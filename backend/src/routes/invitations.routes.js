import { Router } from "express";
import prisma from "../prisma.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { logAudit } from "../utils/auditLogger.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

// GET /api/invitations/:token (Público/Autenticado: Validar y ver detalles de invitación)
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        business: {
          select: {
            name: true,
            slug: true,
            logo: true
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({ success: false, error: "Invitación no válida o inexistente." });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ success: false, error: `Esta invitación ya fue ${invitation.status.toLowerCase()}.` });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
      return res.status(400).json({ success: false, error: "Esta invitación ha expirado." });
    }

    res.json({ success: true, invitation });
  } catch (error) {
    console.error("Error al validar invitación:", error);
    res.status(500).json({ success: false, error: "No se pudo validar la invitación." });
  }
});

// POST /api/invitations/accept (Autenticado: Aceptar invitación y vincular cuenta)
router.post("/accept", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const firebaseUid = req.user?.uid;

    if (!token) {
      return res.status(400).json({ success: false, error: "El token de invitación es requerido." });
    }

    // Buscar invitación
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      return res.status(404).json({ success: false, error: "Invitación no encontrada." });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ success: false, error: `Esta invitación ya fue ${invitation.status.toLowerCase()}.` });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      });
      return res.status(400).json({ success: false, error: "Esta invitación ha expirado." });
    }

    // Buscar el rol asignado en la invitación
    const roleKey = invitation.role;
    const dbRole = await prisma.role.findFirst({
      where: {
        key: roleKey,
        OR: [
          { businessId: null },
          { businessId: invitation.businessId }
        ]
      }
    });
    if (!dbRole) {
      return res.status(404).json({ success: false, error: "El rol asignado en la invitación ya no existe." });
    }

    // Verificar si ya tiene membresía en este negocio
    const existingMember = await prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId: firebaseUid,
          businessId: invitation.businessId
        }
      }
    });

    if (existingMember) {
      // Marcar aceptación
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      });
      return res.json({ success: true, message: "Ya eres miembro de este negocio.", businessId: invitation.businessId });
    }

    // Crear membresía y marcar la invitación como aceptada atómicamente
    await prisma.$transaction(async (tx) => {
      await tx.businessMember.create({
        data: {
          userId: firebaseUid,
          businessId: invitation.businessId,
          roleId: dbRole.id,
          role: dbRole.key,
          status: "ACTIVE",
          invitedBy: invitation.invitedBy
        }
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      });
    });

    await logAudit(invitation.businessId, firebaseUid, "invitation_accepted", "BusinessMember", firebaseUid, {
      role: dbRole.key
    });

    res.json({ success: true, message: "¡Invitación aceptada con éxito!", businessId: invitation.businessId });
  } catch (error) {
    console.error("Error al aceptar invitación:", error);
    res.status(500).json({ success: false, error: "No se pudo procesar la aceptación de la invitación." });
  }
});

// POST /api/invitations/resend (Autenticado: Reenviar/Renovar invitación)
router.post("/resend", requireAuth, requirePermission("members.invite"), async (req, res) => {
  try {
    const { id } = req.body; // ID de la invitación

    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation || invitation.businessId !== req.businessId) {
      return res.status(404).json({ success: false, error: "Invitación no encontrada." });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await prisma.invitation.update({
      where: { id },
      data: {
        status: "PENDING",
        expiresAt,
        createdAt: new Date()
      }
    });

    await logAudit(req.businessId, req.user.uid, "invitation_resent", "Invitation", id, {
      email: invitation.email,
      role: invitation.role
    });

    res.json({
      success: true,
      invitation: updated,
      inviteLink: `${req.protocol}://${req.get("host")}/invite/${invitation.token}`
    });
  } catch (error) {
    console.error("Error al reenviar invitación:", error);
    res.status(500).json({ success: false, error: "No se pudo reenviar la invitación." });
  }
});

// POST /api/invitations/cancel (Autenticado: Cancelar invitación)
router.post("/cancel", requireAuth, requirePermission("members.invite"), async (req, res) => {
  try {
    const { id } = req.body;

    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!invitation || invitation.businessId !== req.businessId) {
      return res.status(404).json({ success: false, error: "Invitación no encontrada." });
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    await logAudit(req.businessId, req.user.uid, "invitation_cancelled", "Invitation", id, {
      email: invitation.email
    });

    res.json({ success: true, message: "Invitación cancelada exitosamente." });
  } catch (error) {
    console.error("Error al cancelar invitación:", error);
    res.status(500).json({ success: false, error: "No se pudo cancelar la invitación." });
  }
});

export default router;
