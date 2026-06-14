import { Router } from "express";
import prisma from "../prisma.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = Router();

// Require both auth and global admin custom claim role
router.use(requireAuth, requireAdmin);

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

export default router;
