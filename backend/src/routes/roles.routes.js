import { Router } from "express";
import prisma from "../prisma.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { logAudit } from "../utils/auditLogger.js";

const router = Router();

// GET /api/roles (Listar roles disponibles: sistema + custom del negocio, con conteo de usuarios)
router.get("/", requirePermission("roles.view"), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { businessId: null },
          { businessId: req.businessId }
        ]
      },
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: {
          select: {
            members: {
              where: {
                businessId: req.businessId,
                status: "ACTIVE"
              }
            }
          }
        }
      },
      orderBy: {
        isSystemRole: "desc"
      }
    });

    // Mapear conteo de usuarios de manera amigable
    const mappedRoles = roles.map(r => ({
      ...r,
      userCount: r._count?.members || 0
    }));

    res.json({ success: true, roles: mappedRoles });
  } catch (error) {
    console.error("Error al listar roles:", error);
    res.status(500).json({ success: false, error: "No se pudieron listar los roles." });
  }
});

// GET /api/roles/permissions (Obtener catálogo completo de permisos del sistema)
router.get("/permissions/all", requirePermission("permissions.view"), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: "asc" },
        { action: "asc" }
      ]
    });
    res.json({ success: true, permissions });
  } catch (error) {
    console.error("Error al listar permisos:", error);
    res.status(500).json({ success: false, error: "No se pudieron obtener los permisos del sistema." });
  }
});

// POST /api/roles/permissions/create (Crear nuevo permiso dinámicamente)
router.post("/permissions/create", requirePermission("permissions.edit"), async (req, res) => {
  try {
    const { action, module, description } = req.body;

    if (!action || !module) {
      return res.status(400).json({ success: false, error: "El nombre de la acción y el módulo son obligatorios." });
    }

    const actionKey = action.toLowerCase().trim();
    const moduleKey = module.toLowerCase().trim();

    // Validar si ya existe
    const existing = await prisma.permission.findFirst({
      where: { action: actionKey }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: "Este permiso ya existe en el sistema." });
    }

    const newPermission = await prisma.permission.create({
      data: {
        action: actionKey,
        key: actionKey,
        module: moduleKey,
        description: description?.trim() || `Permiso para ${actionKey}`
      }
    });

    // Registrar en logs de auditoría
    await logAudit(req.businessId, req.user.uid, "permission_created", "Permission", newPermission.id, {
      action: actionKey,
      module: moduleKey
    });

    res.status(201).json({ success: true, permission: newPermission });
  } catch (error) {
    console.error("Error al crear permiso:", error);
    res.status(500).json({ success: false, error: "No se pudo registrar el permiso en el catálogo." });
  }
});


// GET /api/roles/permission-matrix (Matriz completa unificada)
router.get("/permission-matrix", requirePermission("permissions.view"), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { businessId: null },
          { businessId: req.businessId }
        ]
      },
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: {
        isSystemRole: "desc"
      }
    });

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: "asc" },
        { action: "asc" }
      ]
    });

    res.json({ success: true, roles, permissions });
  } catch (error) {
    console.error("Error al obtener la matriz de permisos:", error);
    res.status(500).json({ success: false, error: "No se pudo recuperar la matriz de permisos." });
  }
});

// PATCH /api/roles/permission-matrix (Guardar cambios masivos de la matriz visual)
router.patch("/permission-matrix", requirePermission("permissions.edit"), async (req, res) => {
  try {
    const { matrix } = req.body; // Formato: { "roleId1": ["perm.action1", "perm.action2"], "roleId2": [...] }

    if (!matrix || typeof matrix !== "object") {
      return res.status(400).json({ success: false, error: "Debe proveer un objeto de matriz válido." });
    }

    const requesterId = req.user.uid;

    await prisma.$transaction(async (tx) => {
      for (const [roleId, actions] of Object.entries(matrix)) {
        // Verificar que el rol pertenezca a este negocio o sea del sistema modificable
        const role = await tx.role.findUnique({ where: { id: roleId } });
        if (!role || (role.businessId && role.businessId !== req.businessId)) {
          throw new Error(`Rol no encontrado o no autorizado: ${roleId}`);
        }

        // El Owner global no se puede modificar
        if (role.key === "owner" && !role.businessId) {
          continue; // Omitir sin arrojar error para no romper guardados masivos
        }

        // Obtener permisos correspondientes en base de datos
        const dbPermissions = await tx.permission.findMany({
          where: { action: { in: actions } }
        });

        // 1. Limpiar todos los permisos actuales para este rol
        await tx.rolePermission.deleteMany({
          where: { roleId }
        });

        // 2. Insertar los nuevos permisos
        const newRolePermissions = dbPermissions.map(p => ({
          roleId,
          permissionId: p.id
        }));

        if (newRolePermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: newRolePermissions
          });
        }

        await logAudit(req.businessId, requesterId, "role_permissions_updated", "Role", roleId, {
          roleKey: role.key,
          permissionsCount: dbPermissions.length
        });
      }
    });

    res.json({ success: true, message: "Matriz de permisos guardada exitosamente." });
  } catch (error) {
    console.error("Error al guardar la matriz de permisos:", error);
    res.status(500).json({ success: false, error: error.message || "No se pudo guardar la matriz de permisos." });
  }
});

// GET /api/roles/:id (Detalle de un rol individual)
router.get("/:id", requirePermission("roles.view"), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: {
          select: { members: { where: { businessId: req.businessId } } }
        }
      }
    });

    if (!role || (role.businessId && role.businessId !== req.businessId)) {
      return res.status(404).json({ success: false, error: "Rol no encontrado o no pertenece a tu negocio." });
    }

    res.json({
      success: true,
      role: {
        ...role,
        userCount: role._count?.members || 0
      }
    });
  } catch (error) {
    console.error("Error al obtener rol:", error);
    res.status(500).json({ success: false, error: "No se pudo obtener el detalle del rol." });
  }
});

// POST /api/roles (Crear rol personalizado para el negocio)
router.post("/", requirePermission("roles.create"), async (req, res) => {
  try {
    const { name, description } = req.body;
    const requesterId = req.user.uid;

    if (!name) {
      return res.status(400).json({ success: false, error: "El nombre del rol es obligatorio." });
    }

    // Normalizar la clave basada en el nombre
    const key = name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!key) {
      return res.status(400).json({ success: false, error: "Nombre inválido para generar la clave del rol." });
    }

    // Validar si ya existe este rol en este negocio
    const existing = await prisma.role.findFirst({
      where: {
        key,
        businessId: req.businessId
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "Ya existe un rol personalizado con un nombre similar en este negocio." });
    }

    const newRole = await prisma.role.create({
      data: {
        name,
        key,
        description,
        isSystemRole: false,
        isActive: true,
        businessId: req.businessId
      }
    });

    await logAudit(req.businessId, requesterId, "role_created", "Role", newRole.id, { name, key });

    res.status(201).json({ success: true, role: newRole });
  } catch (error) {
    console.error("Error al crear rol custom:", error);
    res.status(500).json({ success: false, error: "No se pudo crear el rol personalizado." });
  }
});

// POST /api/roles/:id/duplicate (Duplicar un rol y copiar sus permisos)
router.post("/:id/duplicate", requirePermission("roles.create"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const requesterId = req.user.uid;

    if (!name) {
      return res.status(400).json({ success: false, error: "El nombre del nuevo rol duplicado es obligatorio." });
    }

    // Obtener rol original
    const sourceRole = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true }
    });

    if (!sourceRole || (sourceRole.businessId && sourceRole.businessId !== req.businessId)) {
      return res.status(404).json({ success: false, error: "Rol original no encontrado." });
    }

    const key = name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Validar si ya existe
    const existing = await prisma.role.findFirst({
      where: {
        key,
        businessId: req.businessId
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "Ya existe un rol con ese nombre en este negocio." });
    }

    // Crear el nuevo rol duplicado y sus relaciones en una transacción atómica
    const duplicatedRole = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name,
          key,
          description: description || `Copia de ${sourceRole.name}. ${sourceRole.description || ""}`,
          isSystemRole: false,
          isActive: true,
          businessId: req.businessId
        }
      });

      const newRelations = sourceRole.permissions.map(rp => ({
        roleId: newRole.id,
        permissionId: rp.permissionId
      }));

      if (newRelations.length > 0) {
        await tx.rolePermission.createMany({
          data: newRelations
        });
      }

      return newRole;
    });

    await logAudit(req.businessId, requesterId, "role_duplicated", "Role", duplicatedRole.id, {
      sourceRoleKey: sourceRole.key,
      newRoleKey: key
    });

    res.status(201).json({ success: true, role: duplicatedRole });
  } catch (error) {
    console.error("Error al duplicar rol:", error);
    res.status(500).json({ success: false, error: "No se pudo duplicar el rol." });
  }
});

// PATCH /api/roles/:id (Modificar rol personalizado)
router.patch("/:id", requirePermission("roles.edit"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role || (role.businessId && role.businessId !== req.businessId)) {
      return res.status(404).json({ success: false, error: "Rol no encontrado o no pertenece a tu negocio." });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ success: false, error: "No puedes modificar roles globales del sistema." });
    }

    // Validaciones de seguridad en deactivación
    if (isActive === false) {
      if (role.key === "owner" || role.key === "admin") {
        return res.status(400).json({ success: false, error: "No puedes desactivar el rol Owner o Admin." });
      }

      // Validar si tiene miembros asignados activos
      const activeMembers = await prisma.businessMember.count({
        where: { roleId: id, status: "ACTIVE" }
      });
      if (activeMembers > 0) {
        return res.status(400).json({ success: false, error: "No puedes desactivar un rol que tiene colaboradores activos asignados." });
      }
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    await logAudit(req.businessId, req.user.uid, "role_updated", "Role", id, { name, isActive });

    res.json({ success: true, role: updated });
  } catch (error) {
    console.error("Error al editar rol:", error);
    res.status(500).json({ success: false, error: "No se pudo editar el rol." });
  }
});

// DELETE /api/roles/:id (Eliminar rol personalizado)
router.delete("/:id", requirePermission("roles.delete"), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role || (role.businessId && role.businessId !== req.businessId)) {
      return res.status(404).json({ success: false, error: "Rol no encontrado o no pertenece a tu negocio." });
    }

    if (role.isSystemRole) {
      return res.status(400).json({ success: false, error: "No puedes eliminar roles globales del sistema." });
    }

    // Verificar si hay miembros asignados a este rol antes de borrar
    const membersWithRole = await prisma.businessMember.count({
      where: { roleId: id }
    });
    if (membersWithRole > 0) {
      return res.status(400).json({ success: false, error: "No puedes eliminar este rol porque tiene colaboradores asignados. Reasígnalos primero." });
    }

    await prisma.role.delete({ where: { id } });

    await logAudit(req.businessId, req.user.uid, "role_deleted", "Role", id, { key: role.key });

    res.json({ success: true, message: "Rol personalizado eliminado exitosamente." });
  } catch (error) {
    console.error("Error al eliminar rol:", error);
    res.status(500).json({ success: false, error: "No se pudo eliminar el rol." });
  }
});

// GET /api/roles/:id/permissions (Obtener los permisos específicos de un rol)
router.get("/:id/permissions", requirePermission("permissions.view"), async (req, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });

    if (!role || (role.businessId && role.businessId !== req.businessId)) {
      return res.status(404).json({ success: false, error: "Rol no encontrado." });
    }

    const assignedActions = role.permissions.map(rp => rp.permission.action);

    res.json({ success: true, roleId: id, permissions: assignedActions });
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
    res.status(500).json({ success: false, error: "No se pudieron cargar los permisos del rol." });
  }
});

// PATCH /api/roles/:id/permissions (Actualizar la matriz de permisos de un rol)
router.patch("/:id/permissions", requirePermission("permissions.edit"), async (req, res) => {
  try {
    const { id } = req.params;
    const { actions } = req.body; // Array de strings (ej: ["agenda.view", "finance.view"])

    if (!Array.isArray(actions)) {
      return res.status(400).json({ success: false, error: "Debe proveer un arreglo con las acciones de permisos." });
    }

    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role || (role.businessId && role.businessId !== req.businessId)) {
      return res.status(404).json({ success: false, error: "Rol no encontrado o no pertenece a tu negocio." });
    }

    // El OWNER del sistema no se puede modificar
    if (role.key === "owner" && !role.businessId) {
      return res.status(400).json({ success: false, error: "No es posible modificar los permisos del propietario principal (Owner)." });
    }

    // Buscar los registros de permisos correspondientes en BD
    const dbPermissions = await prisma.permission.findMany({
      where: {
        action: { in: actions }
      }
    });

    // Modificar relaciones de permisos de forma atómica en una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Limpiar todos los permisos actuales
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // 2. Insertar los nuevos permisos seleccionados
      const newRolePermissions = dbPermissions.map(p => ({
        roleId: id,
        permissionId: p.id
      }));

      if (newRolePermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: newRolePermissions
        });
      }
    });

    await logAudit(req.businessId, req.user.uid, "role_permissions_updated", "Role", id, {
      roleKey: role.key,
      permissionsCount: dbPermissions.length
    });

    res.json({ success: true, message: "Permisos actualizados con éxito en el Editor de Roles." });
  } catch (error) {
    console.error("Error al guardar permisos en el rol:", error);
    res.status(500).json({ success: false, error: "No se pudieron actualizar los permisos del rol." });
  }
});

export default router;
