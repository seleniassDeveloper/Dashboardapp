import { Router } from "express";
import prisma from "../prisma.js";
import { checkTenant } from "../middleware/tenant.middleware.js";

const router = Router();

// GET /api/me (Obtener perfil del usuario y detalles del espacio de trabajo activo)
router.get("/", async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ success: false, error: "No autenticado." });
    }

    // Cargar perfil relacional
    const dbUser = await prisma.user.findUnique({
      where: { id: firebaseUid }
    });

    // Cargar membresías activas del usuario para armar la lista de empresas permitidas
    const memberships = await prisma.businessMember.findMany({
      where: { userId: firebaseUid, status: "ACTIVE" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true
          }
        },
        roleRel: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const userBusinesses = memberships.map(m => ({
      id: m.business.id,
      name: m.business.name,
      slug: m.business.slug,
      logo: m.business.logo,
      role: m.roleRel.key,
      roleName: m.roleRel.name
    }));

    // Si no hay membresías en absoluto, retornar perfil básico sin bloquear (para onboarding)
    if (memberships.length === 0) {
      return res.json({
        success: true,
        user: dbUser,
        business: null,
        role: null,
        permissions: [],
        availableModules: [],
        userBusinesses: []
      });
    }

    // Resolver negocio activo actual
    const activeBusinessId = req.headers["x-business-id"] || localStorageBusinessIdFallback(memberships);
    
    let activeMembership = memberships.find(m => m.businessId === activeBusinessId);
    if (!activeMembership) {
      activeMembership = memberships[0]; // Fallback al primero
    }

    const biz = activeMembership.business;
    const roleKey = activeMembership.roleRel.key;
    let permissions = [];

    if (roleKey === "owner") {
      const allSystemPermissions = await prisma.permission.findMany();
      permissions = allSystemPermissions.map(p => p.action);
    } else {
      permissions = activeMembership.roleRel.permissions.map(rp => rp.permission.action);
    }

    const availableModules = [];
    if (permissions.includes("dashboard.view")) availableModules.push("dashboard");
    if (permissions.includes("appointments.view.all") || permissions.includes("appointments.view.own")) availableModules.push("agenda");
    if (permissions.includes("clients.view") || permissions.includes("clients.view.assigned")) availableModules.push("clients");
    if (permissions.includes("services.view")) availableModules.push("services");
    if (permissions.includes("team.view")) availableModules.push("team");
    if (permissions.includes("finance.view")) availableModules.push("finance");
    if (permissions.includes("inventory.view")) availableModules.push("inventory");
    if (permissions.includes("sheets.view")) availableModules.push("sheets");
    if (permissions.includes("workflows.view")) availableModules.push("workflows");
    if (permissions.includes("automations.view")) availableModules.push("automations");
    if (permissions.includes("settings.view")) availableModules.push("settings");

    res.json({
      success: true,
      user: dbUser,
      business: biz,
      role: roleKey ? roleKey.toUpperCase() : null,
      roleName: activeMembership.roleRel.name,
      permissions,
      availableModules,
      userBusinesses
    });
  } catch (error) {
    console.error("Error en GET /api/me:", error);
    res.status(500).json({ success: false, error: "Error al recuperar detalles de la sesión." });
  }
});

// GET /api/me/businesses (Listar todos los negocios autorizados del usuario)
router.get("/businesses", async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const memberships = await prisma.businessMember.findMany({
      where: { userId: firebaseUid, status: "ACTIVE" },
      include: {
        business: true
      }
    });

    const userBusinesses = memberships.map(m => m.business);
    res.json({ success: true, userBusinesses });
  } catch (error) {
    console.error("Error en GET /api/me/businesses:", error);
    res.status(500).json({ success: false, error: "No se pudieron recuperar las empresas." });
  }
});

// Helper de fallback
function localStorageBusinessIdFallback(memberships) {
  if (memberships.length === 0) return null;
  return memberships[0].businessId;
}

export default router;
