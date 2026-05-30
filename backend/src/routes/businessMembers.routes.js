import { Router } from "express";
import prisma from "../prisma.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

// Listar todos los colaboradores asociados al negocio actual
router.get("/", requirePermission("users.manage"), async (req, res) => {
  try {
    const members = await prisma.businessMember.findMany({
      where: { businessId: req.businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        role: {
          select: {
            id: true,
            key: true,
            name: true,
            description: true
          }
        }
      }
    });

    res.json({ success: true, members });
  } catch (error) {
    console.error("Error al listar colaboradores:", error);
    res.status(500).json({ success: false, error: "No se pudieron listar los colaboradores." });
  }
});

// Listar todos los roles del sistema disponibles
router.get("/roles", requirePermission("users.manage"), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { isSystem: true }
    });
    res.json({ success: true, roles });
  } catch (error) {
    console.error("Error al listar roles:", error);
    res.status(500).json({ success: false, error: "No se pudieron obtener los roles." });
  }
});

// Invitar un nuevo colaborador al negocio por email
router.post("/invite", requirePermission("users.invite"), async (req, res) => {
  try {
    const { email, firstName, lastName, roleKey } = req.body;
    if (!email || !roleKey) {
      return res.status(400).json({ success: false, error: "Email y rol son requeridos." });
    }

    // Buscar si el rol existe
    const role = await prisma.role.findUnique({
      where: { key: roleKey }
    });
    if (!role) {
      return res.status(404).json({ success: false, error: "El rol especificado no existe." });
    }

    // Buscar si el usuario ya existe en nuestra base de datos (por su email)
    let user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() }
    });

    // Si el usuario no existe, lo creamos de forma provisional (estado INVITADO)
    if (!user) {
      const provisionalId = `invited-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      user = await prisma.user.create({
        data: {
          id: provisionalId,
          email: email.toLowerCase().trim(),
          firstName: firstName || "",
          lastName: lastName || ""
        }
      });
    }

    // Verificar si ya tiene una membresía en este negocio
    const existingMember = await prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId: req.businessId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ success: false, error: "Este usuario ya es miembro o está invitado a este negocio." });
    }

    // Crear la membresía con estado INVITED
    const newMember = await prisma.businessMember.create({
      data: {
        userId: user.id,
        businessId: req.businessId,
        roleId: role.id,
        status: "INVITED"
      },
      include: {
        user: true,
        role: true
      }
    });

    res.status(201).json({ success: true, member: newMember });
  } catch (error) {
    console.error("Error al invitar colaborador:", error);
    res.status(500).json({ success: false, error: "No se pudo enviar la invitación." });
  }
});

// Modificar el rol de un colaborador
router.patch("/:memberId/role", requirePermission("users.manage"), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { roleKey } = req.body;

    if (!roleKey) {
      return res.status(400).json({ success: false, error: "El rol es requerido." });
    }

    const role = await prisma.role.findUnique({
      where: { key: roleKey }
    });
    if (!role) {
      return res.status(404).json({ success: false, error: "El rol especificado no existe." });
    }

    // Validar que el miembro pertenece a este negocio (seguridad multi-tenant)
    const member = await prisma.businessMember.findFirst({
      where: { id: memberId, businessId: req.businessId }
    });
    if (!member) {
      return res.status(404).json({ success: false, error: "Colaborador no encontrado en este negocio." });
    }

    const updated = await prisma.businessMember.update({
      where: { id: memberId },
      data: { roleId: role.id },
      include: { role: true }
    });

    res.json({ success: true, member: updated });
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    res.status(500).json({ success: false, error: "No se pudo actualizar el rol." });
  }
});

// Modificar el estado de un colaborador (Activar, Suspender)
router.patch("/:memberId/status", requirePermission("users.manage"), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.body; // "ACTIVE" | "SUSPENDED"

    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ success: false, error: "Estado inválido." });
    }

    // Validar que el miembro pertenece a este negocio
    const member = await prisma.businessMember.findFirst({
      where: { id: memberId, businessId: req.businessId }
    });
    if (!member) {
      return res.status(404).json({ success: false, error: "Colaborador no encontrado en este negocio." });
    }

    // Prevenir auto-suspensión
    if (member.userId === req.user.uid) {
      return res.status(400).json({ success: false, error: "No puedes suspender tu propia membresía." });
    }

    const updated = await prisma.businessMember.update({
      where: { id: memberId },
      data: { status },
      include: { role: true }
    });

    res.json({ success: true, member: updated });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ success: false, error: "No se pudo cambiar el estado." });
  }
});

// Remover un colaborador de un negocio
router.delete("/:memberId", requirePermission("users.manage"), async (req, res) => {
  try {
    const { memberId } = req.params;

    // Validar que el miembro pertenece a este negocio
    const member = await prisma.businessMember.findFirst({
      where: { id: memberId, businessId: req.businessId }
    });
    if (!member) {
      return res.status(404).json({ success: false, error: "Colaborador no encontrado en este negocio." });
    }

    // Prevenir auto-eliminación
    if (member.userId === req.user.uid) {
      return res.status(400).json({ success: false, error: "No puedes remover tu propia membresía del negocio." });
    }

    await prisma.businessMember.delete({
      where: { id: memberId }
    });

    res.json({ success: true, message: "Colaborador removido exitosamente." });
  } catch (error) {
    console.error("Error al remover colaborador:", error);
    res.status(500).json({ success: false, error: "No se pudo remover al colaborador." });
  }
});

export default router;
