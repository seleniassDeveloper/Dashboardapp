import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { checkTenant } from "../middleware/tenant.middleware.js";
import prisma from "../prisma.js";

const router = Router();

// Proxy /api/auth/me a la estructura relacional avanzada
router.get("/me", requireAuth, checkTenant, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const dbUser = await prisma.user.findUnique({
      where: { id: firebaseUid }
    });

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
        roleRel: true
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

    if (memberships.length === 0) {
      return res.json({
        success: true,
        user: dbUser,
        business: null,
        role: null,
        permissions: [],
        userBusinesses: []
      });
    }

    const requestedBusinessId = req.headers["x-business-id"];
    let activeMembership = memberships.find(m => m.businessId === requestedBusinessId);
    if (!activeMembership) {
      activeMembership = memberships[0];
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

    res.json({
      success: true,
      user: dbUser,
      business: biz,
      role: roleKey,
      roleName: activeMembership.roleRel.name,
      permissions,
      userBusinesses
    });
  } catch (error) {
    console.error("Error en endpoint /auth/me:", error);
    res.status(500).json({ success: false, error: "No se pudo recuperar la sesión del usuario." });
  }
});
// POST /api/auth/login (Autenticación local para desarrollo / SaaS Multi-Usuario sin Firebase)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos." });
    }

    const emailNorm = email.toLowerCase().trim();

    // 1. Buscar si el usuario ya existe en la base de datos relacional
    let dbUser = await prisma.user.findFirst({
      where: { email: { equals: emailNorm, mode: "insensitive" } }
    });

    // 2. Si no existe y es uno de los correos sugeridos por el sistema, lo auto-creamos con su rol relacional
    const suggestedEmails = [
      "owner@empresa.com", 
      "admin@empresa.com", 
      "manager@empresa.com", 
      "recepcion@empresa.com", 
      "estilista@empresa.com", 
      "finance@empresa.com", 
      "viewer@empresa.com"
    ];

    if (!dbUser && suggestedEmails.includes(emailNorm)) {
      let key = "viewer";
      let name = "Viewer";
      if (emailNorm.startsWith("owner")) { key = "owner"; name = "Owner"; }
      else if (emailNorm.startsWith("admin")) { key = "admin"; name = "Admin"; }
      else if (emailNorm.startsWith("manager")) { key = "manager"; name = "Manager"; }
      else if (emailNorm.startsWith("recepcion")) { key = "reception"; name = "Recepción"; }
      else if (emailNorm.startsWith("estilista")) { key = "professional"; name = "Profesional"; }
      else if (emailNorm.startsWith("finance")) { key = "finance"; name = "Finanzas"; }

      dbUser = await prisma.user.create({
        data: {
          id: `local-${key}-uid`,
          email: emailNorm,
          firstName: name,
          lastName: "Empresa",
          name: `${name} Empresa`
        }
      });

      // Asegurar existencia de negocio base de desarrollo
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

      // Buscar rol de sistema
      const systemRole = await prisma.role.findFirst({
        where: { key: key, businessId: null }
      });

      if (systemRole) {
        await prisma.businessMember.create({
          data: {
            userId: dbUser.id,
            businessId: devBusiness.id,
            roleId: systemRole.id,
            role: key,
            status: "ACTIVE"
          }
        });
      }
    }

    if (!dbUser) {
      return res.status(401).json({ error: "El correo ingresado no se encuentra registrado en la empresa." });
    }

    // 3. Validar contraseña local
    const prefix = emailNorm.split("@")[0];
    const isValidPass = password === "selenia" || password === "123456" || password === prefix;

    if (!isValidPass) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    // 4. Emitir token local
    const token = `local-token-${dbUser.id}`;

    return res.json({
      success: true,
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name
      }
    });
  } catch (error) {
    console.error("Error en POST /api/auth/login local:", error);
    return res.status(500).json({ error: "Error interno al iniciar sesión." });
  }
});

// POST /api/auth/finance-access (Autorización de supervisor para bypass financiero)
router.post("/finance-access", async (req, res) => {
  try {
    const { email, username, password, businessId } = req.body;
    const inputEmail = (email || username || "").toLowerCase().trim();

    let finalBusinessId = businessId;
    if (!finalBusinessId || finalBusinessId === "null" || finalBusinessId === "undefined" || finalBusinessId === "default") {
      const firstBiz = await prisma.business.findFirst();
      if (firstBiz) {
        finalBusinessId = firstBiz.id;
      }
    }

    if (!inputEmail || !password || !finalBusinessId) {
      return res.status(400).json({ error: "Faltan campos obligatorios: email, password, businessId." });
    }

    let firebaseUid = null;
    let emailToFind = inputEmail;
    const { generateBypassToken } = await import("../utils/financeCrypto.js");

    // 1. Validar contraseña
    if (process.env.AUTH_DISABLED === "true" || inputEmail.includes("@empresa.com")) {
      const prefix = inputEmail.split("@")[0];
      if (password !== "admin" && password !== "owner" && password !== "finance" && password !== "selenia" && password !== prefix) {
        return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
      }
      
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: inputEmail, mode: "insensitive" } }
      });
      
      if (dbUser) {
        firebaseUid = dbUser.id;
      } else {
        firebaseUid = `local-viewer-uid`;
      }
    } else {
      // En producción, verificamos la contraseña contra el REST API de Firebase Auth
      const apiKey = process.env.FIREBASE_API_KEY || "AIzaSyD4bj69P0XDIE-KjY7uduNBt_MaVF2a8FQ";
      const fbUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

      try {
        const response = await fetch(fbUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inputEmail,
            password,
            returnSecureToken: true
          })
        });

        const fbData = await response.json();
        if (fbData.error) {
          console.warn("[finance-access] Falló login Firebase REST:", fbData.error.message);
          return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }

        firebaseUid = fbData.localId;
        emailToFind = fbData.email?.toLowerCase().trim() || inputEmail;
      } catch (err) {
        console.error("[finance-access] Error de conexión con Firebase REST API:", err);
        return res.status(500).json({ error: "Error de conexión al verificar credenciales." });
      }
    }

    // 2. Buscar membresía del usuario verificado en la empresa especificada
    const member = await prisma.businessMember.findFirst({
      where: {
        businessId: finalBusinessId,
        user: {
          OR: [
            { id: firebaseUid },
            { email: { equals: emailToFind, mode: "insensitive" } }
          ]
        },
        status: "ACTIVE"
      },
      include: {
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

    if (!member) {
      return res.status(403).json({ error: "No eres miembro activo de este negocio o careces de permisos." });
    }

    // 3. Validar privilegios financieros reales
    const roleKey = member.roleRel.key.toLowerCase();
    const permissions = member.roleRel.permissions.map(rp => rp.permission.action);

    const hasFinanceAccess = 
      roleKey === "owner" || 
      roleKey === "admin" || 
      roleKey === "finance" || 
      permissions.includes("finance.view");

    if (!hasFinanceAccess) {
      return res.status(403).json({ error: "El usuario ingresado no posee permisos financieros de visualización." });
    }

    // 4. Generar token de bypass real firmado
    const token = generateBypassToken(member.userId, businessId);

    return res.json({
      success: true,
      authorized: true,
      token
    });
  } catch (error) {
    console.error("Error en POST /api/auth/finance-access:", error);
    return res.status(500).json({ error: "Error interno en la autenticación de supervisor." });
  }
});

// POST /api/auth/setup-dev-role (Configurar rol de desarrollo al instante para Google login)
router.post("/setup-dev-role", requireAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const firebaseUid = req.user.uid;

    if (!role) {
      return res.status(400).json({ error: "Rol requerido." });
    }

    // Buscar o crear el negocio base
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

    // Buscar rol del sistema en la base de datos
    const systemRole = await prisma.role.findFirst({
      where: { key: role, businessId: null }
    });

    if (!systemRole) {
      return res.status(404).json({ error: `El rol comercial ${role} no existe.` });
    }

    // Comprobar si ya tiene una membresía para este negocio
    let membership = await prisma.businessMember.findFirst({
      where: { userId: firebaseUid, businessId: devBusiness.id }
    });

    if (membership) {
      // Actualizar el rol de la membresía
      membership = await prisma.businessMember.update({
        where: { id: membership.id },
        data: {
          role: role,
          roleId: systemRole.id,
          status: "ACTIVE"
        }
      });
    } else {
      // Crear nueva membresía
      membership = await prisma.businessMember.create({
        data: {
          userId: firebaseUid,
          businessId: devBusiness.id,
          roleId: systemRole.id,
          role: role,
          status: "ACTIVE"
        }
      });
    }

    return res.json({ success: true, businessId: devBusiness.id });
  } catch (error) {
    console.error("Error en setup-dev-role:", error);
    return res.status(500).json({ error: "No se pudo configurar el rol de desarrollo." });
  }
});

export default router;
