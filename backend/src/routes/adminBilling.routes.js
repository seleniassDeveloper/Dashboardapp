import { Router } from "express";
import prisma from "../prisma.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();

// Middleware para restringir modificaciones (POST, PUT, DELETE) solo a seleniadeveloper@gmail.com
const requireSeleniaAdmin = (req, res, next) => {
  if (req.method !== "GET") {
    if (req.user?.email !== "seleniadeveloper@gmail.com") {
      return res.status(403).json({ 
        success: false, 
        error: "Acceso denegado. Solo seleniadeveloper@gmail.com tiene permisos para modificar suscripciones y accesos." 
      });
    }
  }
  next();
};

// Require auth, global admin custom claim role, and the Selenia restriction
router.use(requireAuth, requireAdmin, requireSeleniaAdmin);

router.get("/businesses", async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        gracePeriodEndsAt: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Calculate Estimated MRR (Monthly Recurring Revenue)
    // Starter: $19, Pro: $49, Business: $99
    let totalMRR = 0;
    const list = businesses.map(b => {
      let mrrContribution = 0;
      if (b.subscriptionStatus === "active") {
        if (b.plan === "starter") mrrContribution = 19;
        else if (b.plan === "pro") mrrContribution = 49;
        else if (b.plan === "business") mrrContribution = 99;
      }
      totalMRR += mrrContribution;

      return {
        ...b,
        mrr: mrrContribution
      };
    });

    return res.json({
      success: true,
      businesses: list,
      estimatedMRR: totalMRR
    });
  } catch (error) {
    console.error("Error listing admin businesses for billing:", error);
    return res.status(500).json({ success: false, error: "No se pudieron obtener los negocios." });
  }
});

router.post("/businesses/:id/override", async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, subscriptionStatus, trialEndsAt, currentPeriodEnd, gracePeriodEndsAt } = req.body;

    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        plan: plan !== undefined ? plan : undefined,
        subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : undefined,
        trialEndsAt: trialEndsAt !== undefined ? (trialEndsAt ? new Date(trialEndsAt) : null) : undefined,
        currentPeriodEnd: currentPeriodEnd !== undefined ? (currentPeriodEnd ? new Date(currentPeriodEnd) : null) : undefined,
        gracePeriodEndsAt: gracePeriodEndsAt !== undefined ? (gracePeriodEndsAt ? new Date(gracePeriodEndsAt) : null) : undefined
      }
    });

    // Mirror updates in active subscription entry if exists
    const subscription = await prisma.subscription.findUnique({ where: { businessId: id } });
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planCode: plan !== undefined ? plan : undefined,
          status: subscriptionStatus !== undefined ? subscriptionStatus : undefined,
          currentPeriodEnd: currentPeriodEnd !== undefined ? (currentPeriodEnd ? new Date(currentPeriodEnd) : null) : undefined
        }
      });
    }

    return res.json({ success: true, business: updated });
  } catch (error) {
    console.error("Error updating business subscription manual override:", error);
    return res.status(500).json({ success: false, error: "No se pudo actualizar la suscripción del negocio." });
  }
});

// GET pending plan requests
router.get("/requests", async (req, res) => {
  try {
    const requests = await prisma.planRequest.findMany({
      where: { status: "PENDING" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionStatus: true,
            plan: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching plan requests:", error);
    return res.status(500).json({ success: false, error: "No se pudieron obtener las solicitudes de planes." });
  }
});

// POST approve request
router.post("/requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.planRequest.findUnique({ where: { id } });
    if (!request || request.status !== "PENDING") {
      return res.status(404).json({ success: false, error: "Solicitud no encontrada o ya procesada." });
    }

    // Aprobar solicitud y actualizar negocio en transacción
    await prisma.$transaction(async (tx) => {
      await tx.planRequest.update({
        where: { id },
        data: { status: "APPROVED" }
      });
      await tx.business.update({
        where: { id: request.businessId },
        data: {
          plan: request.requestedPlan,
          subscriptionStatus: "active"
        }
      });
      // Optionally update subscription if exists
      const sub = await tx.subscription.findUnique({ where: { businessId: request.businessId } });
      if (sub) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { planCode: request.requestedPlan, status: "active" }
        });
      }
    });

    return res.json({ success: true, message: "Solicitud aprobada con éxito." });
  } catch (error) {
    console.error("Error approving plan request:", error);
    return res.status(500).json({ success: false, error: "No se pudo aprobar la solicitud." });
  }
});

// POST reject request
router.post("/requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.planRequest.findUnique({ where: { id } });
    if (!request || request.status !== "PENDING") {
      return res.status(404).json({ success: false, error: "Solicitud no encontrada o ya procesada." });
    }

    await prisma.planRequest.update({
      where: { id },
      data: { status: "REJECTED" }
    });

    return res.json({ success: true, message: "Solicitud rechazada." });
  } catch (error) {
    console.error("Error rejecting plan request:", error);
    return res.status(500).json({ success: false, error: "No se pudo rechazar la solicitud." });
  }
});

// DELETE processed requests
router.delete("/requests/processed", async (req, res) => {
  try {
    const result = await prisma.planRequest.deleteMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"]
        }
      }
    });
    return res.json({ success: true, message: `Se eliminaron ${result.count} solicitudes procesadas.` });
  } catch (error) {
    console.error("Error deleting processed plan requests:", error);
    return res.status(500).json({ success: false, error: "No se pudieron limpiar las solicitudes." });
  }
});

// DELETE single request
router.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.planRequest.delete({ where: { id } });
    return res.json({ success: true, message: "Solicitud eliminada con éxito." });
  } catch (error) {
    console.error("Error deleting plan request:", error);
    return res.status(500).json({ success: false, error: "No se pudo eliminar la solicitud." });
  }
});

export default router;
