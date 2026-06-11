import prisma from "../prisma.js";

export async function checkTenant(req, res, next) {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return res.status(401).json({ error: "No autenticado." });
    }

    // SOPORTE DE DESARROLLO / BYPASS
    // Asegurar compatibilidad para el dev-user básico si se ejecuta sin login real
    if (firebaseUid === "dev-user" && process.env.AUTH_DISABLED === "true") {
      let devBusiness = await prisma.business.findFirst();
      if (!devBusiness) {
        devBusiness = await prisma.business.create({
          data: {
            name: "Aura Studio",
            slug: "aura-studio",
            industry: "Estética",
            bookingEnabled: true
          }
        });
      }

      let devUserObj = await prisma.user.findUnique({ where: { id: firebaseUid } });
      if (!devUserObj) {
        devUserObj = await prisma.user.create({
          data: {
            id: firebaseUid,
            email: "selenisdeveloper@gmail.com",
            firstName: "Selenis",
            lastName: "Developer",
            name: "Selenis Developer"
          }
        });
      }

      const ownerRole = await prisma.role.findFirst({
        where: { key: "owner", businessId: null }
      });

      if (ownerRole) {
        let devMember = await prisma.businessMember.findFirst({
          where: { userId: firebaseUid, businessId: devBusiness.id }
        });

        if (!devMember) {
          await prisma.businessMember.create({
            data: {
              userId: firebaseUid,
              businessId: devBusiness.id,
              roleId: ownerRole.id,
              role: "owner",
              status: "ACTIVE"
            }
          });
        }
      }
    }

    // AUTO-SEEDING en PostgreSQL solo para usuarios de demostración (dev-user y quick-booking-user)
    if (firebaseUid && (firebaseUid === "dev-user" || firebaseUid === "quick-booking-user")) {
      let devBusiness = await prisma.business.findFirst();
      if (!devBusiness) {
        devBusiness = await prisma.business.create({
          data: {
            name: "Aura Studio",
            slug: "aura-studio",
            industry: "Estética",
            bookingEnabled: true
          }
        });
      }

      let ownerRole = await prisma.role.findFirst({
        where: { key: "owner", businessId: null }
      });

      if (!ownerRole) {
        ownerRole = await prisma.role.create({
          data: {
            key: "owner",
            name: "Owner / Dueño",
            description: "Propietario del negocio. Acceso total.",
            isSystemRole: true,
            isActive: true
          }
        });
      }

      if (ownerRole) {
        let devMember = await prisma.businessMember.findFirst({
          where: { userId: firebaseUid, businessId: devBusiness.id }
        });

        if (!devMember) {
          console.log("[auth] Creando membresía relacional de Owner en Postgres para:", req.user?.email || firebaseUid);
          await prisma.businessMember.create({
            data: {
              userId: firebaseUid,
              businessId: devBusiness.id,
              roleId: ownerRole.id,
              role: "owner",
              status: "ACTIVE"
            }
          });
        }
      }
    }

    // 1. Obtener el businessId del header x-business-id
    const requestedBusinessId = req.headers["x-business-id"];

    let membership = null;
    
    // 2. Si se solicitó un negocio en particular, buscar la membresía en él
    if (requestedBusinessId) {
      membership = await prisma.businessMember.findUnique({
        where: {
          userId_businessId: {
            userId: firebaseUid,
            businessId: requestedBusinessId
          }
        },
        include: {
          business: true,
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
    }

    // 3. Fallback: Si no se solicitó o no tiene membresía en ese negocio, buscar cualquier membresía activa del usuario
    if (!membership) {
      membership = await prisma.businessMember.findFirst({
        where: {
          userId: firebaseUid,
          status: "ACTIVE"
        },
        include: {
          business: true,
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
    }

    // 4. Si no tiene ninguna membresía, retornamos código para redirección de onboarding en frontend
    if (!membership) {
      // Rutas que permiten bypass para poder crear la empresa inicial
      const isCreatingBusiness = req.method === "POST" && (req.path === "/" || req.path === "" || req.path === "/setup" || req.path === "/setup/");
      if (isCreatingBusiness) {
        return next();
      }

      return res.status(403).json({
        code: "NO_BUSINESS_MEMBERSHIP",
        error: "No posees membresías activas en ningún negocio. Por favor crea uno en onboarding."
      });
    }

    // 5. Validar estado de la membresía
    if (membership.status === "SUSPENDED") {
      return res.status(403).json({ error: "Tu membresía en este negocio ha sido suspendida." });
    }

    if (membership.status === "INVITED") {
      return res.status(403).json({
        code: "INVITATION_PENDING",
        error: "Tu invitación para este negocio está pendiente de ser aceptada."
      });
    }

    // 6. Inyectar variables relacionales en Express
    req.businessId = membership.businessId;
    req.businessSlug = membership.business.slug;
    
    // Cargar rol y matriz de permisos
    const roleKey = membership.roleRel.key;
    let permissions = [];

    if (roleKey === "owner") {
      // OWNER tiene pase total a todos los permisos del sistema
      const allSystemPermissions = await prisma.permission.findMany();
      permissions = allSystemPermissions.map(p => p.action);
    } else {
      permissions = membership.roleRel.permissions.map(rp => rp.permission.action);
    }

    // Guardar en req.user para uso posterior en rbac.middleware
    req.user.role = roleKey;
    req.user.permissions = permissions;

    next();
  } catch (error) {
    console.error("Error en middleware de inquilinos checkTenant:", error);
    res.status(500).json({ error: "Error de validación de inquilino (Multi-Tenant) y RBAC relacional." });
  }
}
