import { Router } from "express";
import prisma from "../prisma.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { logAudit } from "../utils/auditLogger.js";

const router = Router();

// GET /api/members (Listar colaboradores e invitaciones pendientes)
router.get("/", requirePermission("members.view"), async (req, res) => {
  try {
    const members = await prisma.businessMember.findMany({
      where: { businessId: req.businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
            avatar: true
          }
        },
        roleRel: true
      }
    });

    const invitations = await prisma.invitation.findMany({
      where: { businessId: req.businessId, status: "PENDING" }
    });

    res.json({ success: true, members, invitations });
  } catch (error) {
    console.error("Error al listar miembros:", error);
    res.status(500).json({ success: false, error: "No se pudieron listar los colaboradores." });
  }
});

// POST /api/members/invite (Invitar un nuevo colaborador por email)
router.post("/invite", requirePermission("members.invite"), async (req, res) => {
  try {
    const { email, role, firstName, lastName } = req.body;
    const inviterId = req.user.uid;

    if (!email || !role) {
      return res.status(400).json({ success: false, error: "El email y el rol son obligatorios." });
    }

    // Buscar si el rol existe en el sistema o en el negocio
    const dbRole = await prisma.role.findFirst({
      where: {
        key: role.toLowerCase().trim(),
        OR: [
          { businessId: null },
          { businessId: req.businessId }
        ]
      }
    });
    if (!dbRole) {
      return res.status(404).json({ success: false, error: "El rol seleccionado no existe." });
    }

    // Validar jerarquía de quien invita
    const inviterMember = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: inviterId, businessId: req.businessId } }
    });
    const inviterRole = inviterMember?.role || "viewer";

    // Un Manager no puede invitar a un Admin u Owner
    if (inviterRole === "manager" && ["owner", "admin"].includes(role.toLowerCase())) {
      return res.status(403).json({ success: false, error: "No tienes privilegios para invitar a miembros con roles de mayor jerarquía." });
    }

    // Verificar si ya existe membresía activa/suspendida
    const existingMember = await prisma.businessMember.findFirst({
      where: {
        businessId: req.businessId,
        user: { email: email.toLowerCase().trim() }
      }
    });
    if (existingMember) {
      return res.status(400).json({ success: false, error: "Este usuario ya es miembro de tu negocio." });
    }

    // Generar un token único de invitación
    const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expiración en 7 días

    // Crear la invitación
    const invitation = await prisma.invitation.create({
      data: {
        businessId: req.businessId,
        email: email.toLowerCase().trim(),
        role: role.toLowerCase().trim(),
        token,
        status: "PENDING",
        expiresAt,
        invitedBy: inviterId
      }
    });

    await logAudit(req.businessId, inviterId, "invitation_sent", "Invitation", invitation.id, { email, role });

    res.status(201).json({
      success: true,
      invitation,
      inviteLink: `${req.protocol}://${req.get("host")}/invite/${token}` // Link útil para la UI
    });
  } catch (error) {
    console.error("Error al crear invitación:", error);
    res.status(500).json({ success: false, error: "No se pudo generar la invitación de colaborador." });
  }
});

// PATCH /api/members/:id/role (Cambiar el rol de un colaborador)
router.patch("/:id/role", requirePermission("members.manage"), async (req, res) => {
  try {
    const { id } = req.params; // ID de BusinessMember
    const { roleKey } = req.body;
    const requesterId = req.user.uid;

    if (!roleKey) {
      return res.status(400).json({ success: false, error: "El rol es requerido." });
    }

    // Obtener membresía a modificar
    const memberToUpdate = await prisma.businessMember.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!memberToUpdate || memberToUpdate.businessId !== req.businessId) {
      return res.status(404).json({ success: false, error: "Colaborador no encontrado." });
    }

    // Prevenir auto-modificación de rol
    if (memberToUpdate.userId === requesterId) {
      return res.status(400).json({ success: false, error: "No puedes cambiar tu propio rol en el negocio." });
    }

    // Validar jerarquía del solicitante
    const requesterMember = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: requesterId, businessId: req.businessId } }
    });
    const reqRole = requesterMember?.role || "viewer";

    // Si el solicitante es Manager, no puede editar roles de nadie (Manager es operativo, Admin/Owner configuran)
    if (reqRole === "manager") {
      return res.status(403).json({ success: false, error: "Los managers no tienen autorización para modificar roles." });
    }

    // Si el solicitante es Admin, no puede modificar a un Owner
    if (reqRole === "admin" && memberToUpdate.role === "owner") {
      return res.status(403).json({ success: false, error: "No puedes modificar el rol de un dueño del negocio." });
    }

    // Si intenta promover a alguien a Owner, solo el Owner puede hacerlo
    if (roleKey.toLowerCase() === "owner" && reqRole !== "owner") {
      return res.status(403).json({ success: false, error: "Solo los propietarios pueden designar a un nuevo dueño." });
    }

    // Buscar el rol
    const dbRole = await prisma.role.findFirst({
      where: {
        key: roleKey.toLowerCase().trim(),
        OR: [
          { businessId: null },
          { businessId: req.businessId }
        ]
      }
    });
    if (!dbRole) {
      return res.status(404).json({ success: false, error: "El rol especificado no existe." });
    }

    // Si se remueve al último OWNER de su rol, bloquear
    if (memberToUpdate.role === "owner") {
      const ownersCount = await prisma.businessMember.count({
        where: { businessId: req.businessId, role: "owner" }
      });
      if (ownersCount <= 1) {
        return res.status(400).json({ success: false, error: "No puedes cambiar el rol del último Owner del negocio. Debe haber al menos uno." });
      }
    }

    const updated = await prisma.businessMember.update({
      where: { id },
      data: {
        roleId: dbRole.id,
        role: dbRole.key
      },
      include: { roleRel: true }
    });

    await logAudit(req.businessId, requesterId, "role_changed", "BusinessMember", id, {
      userId: memberToUpdate.userId,
      oldRole: memberToUpdate.role,
      newRole: dbRole.key
    });

    res.json({ success: true, member: updated });
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    res.status(500).json({ success: false, error: "No se pudo actualizar el rol del colaborador." });
  }
});

// PATCH /api/members/:id/status (Suspender o reactivar a un colaborador)
router.patch("/:id/status", requirePermission("members.manage"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACTIVE | SUSPENDED
    const requesterId = req.user.uid;

    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ success: false, error: "Estado inválido." });
    }

    const memberToUpdate = await prisma.businessMember.findUnique({
      where: { id }
    });
    if (!memberToUpdate || memberToUpdate.businessId !== req.businessId) {
      return res.status(404).json({ success: false, error: "Colaborador no encontrado." });
    }

    // Prevenir auto-suspensión
    if (memberToUpdate.userId === requesterId) {
      return res.status(400).json({ success: false, error: "No puedes suspender tu propia membresía." });
    }

    // Validar jerarquía del solicitante
    const requesterMember = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: requesterId, businessId: req.businessId } }
    });
    const reqRole = requesterMember?.role || "viewer";

    if (reqRole === "manager" && ["owner", "admin"].includes(memberToUpdate.role)) {
      return res.status(403).json({ success: false, error: "No puedes suspender a administradores o dueños del negocio." });
    }

    if (reqRole === "admin" && memberToUpdate.role === "owner") {
      return res.status(403).json({ success: false, error: "No puedes suspender al propietario de la cuenta." });
    }

    // Prevenir suspender al último OWNER
    if (memberToUpdate.role === "owner" && status === "SUSPENDED") {
      const ownersCount = await prisma.businessMember.count({
        where: { businessId: req.businessId, role: "owner", status: "ACTIVE" }
      });
      if (ownersCount <= 1) {
        return res.status(400).json({ success: false, error: "No puedes suspender al único propietario activo." });
      }
    }

    const updated = await prisma.businessMember.update({
      where: { id },
      data: { status },
      include: { roleRel: true }
    });

    await logAudit(req.businessId, requesterId, status === "ACTIVE" ? "member_activated" : "member_suspended", "BusinessMember", id, {
      userId: memberToUpdate.userId
    });

    res.json({ success: true, member: updated });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ success: false, error: "No se pudo actualizar el estado del colaborador." });
  }
});

// DELETE /api/members/:id (Remover colaborador de un negocio)
router.delete("/:id", requirePermission("members.remove"), async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.uid;

    const memberToUpdate = await prisma.businessMember.findUnique({
      where: { id }
    });
    if (!memberToUpdate || memberToUpdate.businessId !== req.businessId) {
      return res.status(404).json({ success: false, error: "Colaborador no encontrado." });
    }

    // Prevenir auto-eliminación
    if (memberToUpdate.userId === requesterId) {
      return res.status(400).json({ success: false, error: "No puedes expulsarte a ti mismo del negocio." });
    }

    // Validar jerarquía del solicitante
    const requesterMember = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: requesterId, businessId: req.businessId } }
    });
    const reqRole = requesterMember?.role || "viewer";

    if (reqRole === "manager" && ["owner", "admin"].includes(memberToUpdate.role)) {
      return res.status(403).json({ success: false, error: "No tienes privilegios para expulsar a administradores o dueños." });
    }

    if (reqRole === "admin" && memberToUpdate.role === "owner") {
      return res.status(403).json({ success: false, error: "No puedes expulsar al propietario del negocio." });
    }

    // Prevenir eliminar al último OWNER
    if (memberToUpdate.role === "owner") {
      const ownersCount = await prisma.businessMember.count({
        where: { businessId: req.businessId, role: "owner" }
      });
      if (ownersCount <= 1) {
        return res.status(400).json({ success: false, error: "No puedes remover al único propietario de la cuenta." });
      }
    }

    await prisma.businessMember.delete({
      where: { id }
    });

    await logAudit(req.businessId, requesterId, "member_expelled", "BusinessMember", id, {
      userId: memberToUpdate.userId,
      email: memberToUpdate.email
    });

    res.json({ success: true, message: "Colaborador expulsado del negocio exitosamente." });
  } catch (error) {
    console.error("Error al expulsar colaborador:", error);
    res.status(500).json({ success: false, error: "No se pudo remover al colaborador." });
  }
});

export default router;
