import { Router } from "express";
import prisma from "../prisma.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { logAudit } from "../utils/auditLogger.js";

const router = Router();

// POST /api/businesses (Onboarding de negocio)
router.post("/", async (req, res) => {
  try {
    const { name, rubro, logo, slug, schedules } = req.body;
    const firebaseUid = req.user?.uid;

    if (!name || !slug) {
      return res.status(400).json({ success: false, error: "El nombre y el slug del negocio son obligatorios." });
    }

    // Verificar si el slug ya existe
    const existing = await prisma.business.findUnique({
      where: { slug: slug.toLowerCase().trim() }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "El slug seleccionado ya está en uso. Por favor elige otro." });
    }

    // Buscar rol 'owner'
    let ownerRole = await prisma.role.findFirst({
      where: { key: "owner", businessId: null }
    });
    if (!ownerRole) {
      ownerRole = await prisma.role.create({
        data: {
          key: "owner",
          name: "Owner / Dueño",
          description: "Acceso total del sistema.",
          isSystemRole: true
        }
      });
    }

    // Crear negocio y membresía OWNER de forma atómica (transacción)
    const result = await prisma.$transaction(async (tx) => {
      const biz = await tx.business.create({
        data: {
          name,
          slug: slug.toLowerCase().trim(),
          ownerId: firebaseUid,
          logo: logo || null,
          industry: rubro || null,
          description: `Negocio de rubro ${rubro || "Estética"}`,
          bookingEnabled: true,
          bookingPrimaryColor: "#7c3aed"
        }
      });

      const member = await tx.businessMember.create({
        data: {
          userId: firebaseUid,
          businessId: biz.id,
          roleId: ownerRole.id,
          role: "owner",
          status: "ACTIVE"
        }
      });

      return { biz, member };
    });

    await logAudit(result.biz.id, firebaseUid, "business_created", "Business", result.biz.id, { name, rubro });

    res.status(201).json({
      success: true,
      business: result.biz,
      member: result.member
    });
  } catch (error) {
    console.error("Error al crear negocio en onboarding:", error);
    res.status(500).json({ success: false, error: "No se pudo registrar tu negocio. Intenta nuevamente." });
  }
});

// GET /api/businesses/me
router.get("/me", async (req, res) => {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: req.businessId }
    });
    res.json({ success: true, business: biz });
  } catch (error) {
    console.error("Error en GET /me:", error);
    res.status(500).json({ success: false, error: "No se pudo obtener la configuración del negocio." });
  }
});

// GET /api/businesses/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const biz = await prisma.business.findUnique({
      where: { id }
    });
    if (!biz) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }
    res.json({ success: true, business: biz });
  } catch (error) {
    console.error("Error en GET /:id:", error);
    res.status(500).json({ success: false, error: "No se pudo obtener el negocio." });
  }
});

// PATCH /api/businesses/:id
router.patch("/:id", requirePermission("business.edit"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, industry, description, bookingEnabled, bookingPrimaryColor, bookingConfirmationMessage } = req.body;

    if (id !== req.businessId) {
      return res.status(403).json({ success: false, error: "No tienes autorización para modificar este negocio." });
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        name,
        logo,
        industry,
        description,
        bookingEnabled,
        bookingPrimaryColor,
        bookingConfirmationMessage
      }
    });

    await logAudit(req.businessId, req.user.uid, "business_updated", "Business", id, { name, industry });

    res.json({ success: true, business: updated });
  } catch (error) {
    console.error("Error al actualizar negocio:", error);
    res.status(500).json({ success: false, error: "No se pudo actualizar el negocio." });
  }
});

export default router;
