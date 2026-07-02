import { Router } from "express";
import crypto from "crypto";
import prisma from "../prisma.js";
import requireAuth from "../middleware/requireAuth.js";
import { getFirebaseAuth } from "../services/firebaseAdmin.js";
import { isSuperAdmin, logSuperAdminAction } from "../utils/superadmin.js";

const router = Router();

// Middleware para restringir todo acceso solo a Super-Admin
const requireSuperAdmin = (req, res, next) => {
  const email = req.user?.email || req.dbUser?.email;
  if (!req.user?.admin && !isSuperAdmin(email)) {
    return res.status(403).json({ 
      success: false, 
      error: "Acceso denegado. Se requiere cuenta de Super-Admin Global." 
    });
  }
  next();
};

// Require auth and Super-Admin
router.use(requireAuth, requireSuperAdmin);

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
        createdAt: true,
        ownerId: true,
        userId: true,
        industry: true,
        description: true,
        timezone: true,
        subscription: {
          select: {
            provider: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 1. Obtener los correos electrónicos de los dueños por relación de UID (ownerId o userId)
    const uids = businesses.map(b => b.ownerId || b.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: uids } },
      select: { id: true, email: true }
    });

    const uidEmailMap = {};
    users.forEach(u => {
      uidEmailMap[u.id] = u.email;
    });

    // 2. Obtener correos electrónicos desde BusinessMember (para mayor robustez si ownerId está vacío o es inconsistente)
    const memberships = await prisma.businessMember.findMany({
      where: {
        businessId: { in: businesses.map(b => b.id) },
        role: { in: ["owner", "OWNER"] },
        status: "ACTIVE"
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    const memberOwnerEmailMap = {};
    memberships.forEach(m => {
      if (m.user?.email) {
        memberOwnerEmailMap[m.businessId] = m.user.email;
      }
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

      // Buscar email del dueño con múltiples fallbacks para asegurar que siempre aparezca
      const ownerEmail = memberOwnerEmailMap[b.id]
        || (b.ownerId ? uidEmailMap[b.ownerId] : null)
        || (b.userId ? uidEmailMap[b.userId] : null);

      return {
        ...b,
        ownerEmail: ownerEmail || null,
        mrr: mrrContribution,
        provider: b.subscription?.provider || "free"
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

router.post("/businesses", async (req, res) => {
  try {
    const {
      name,
      slug,
      ownerEmail,
      plan,
      subscriptionStatus,
      trialEndsAt,
      currentPeriodEnd,
      gracePeriodEndsAt,
      industry,
      model,
      timezone,
      provider
    } = req.body;

    if (!name || !slug || !ownerEmail) {
      return res.status(400).json({ success: false, error: "Nombre, Slug y Email del dueño son obligatorios." });
    }

    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    
    // Check if slug exists
    const existingBiz = await prisma.business.findUnique({ where: { slug: cleanSlug } });
    if (existingBiz) {
      return res.status(409).json({ success: false, error: "El slug ya está en uso por otro negocio." });
    }

    const emailLower = ownerEmail.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: emailLower } });

    if (!user) {
      try {
        const auth = getFirebaseAuth();
        const fbUser = await auth.getUserByEmail(emailLower);
        if (fbUser) {
          user = await prisma.user.create({
            data: {
              id: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || "Usuario SaaS",
              status: "active"
            }
          });
        }
      } catch (fbErr) {
        console.log("Firebase user not found during business creation:", fbErr.message);
      }
    }

    if (!user) {
      const tempId = "temp-" + Math.random().toString(36).substring(2, 15);
      user = await prisma.user.create({
        data: {
          id: tempId,
          email: emailLower,
          name: "Usuario Invitado",
          status: "active"
        }
      });
    }

    // Ensure ownerRole exists
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

    const newBiz = await prisma.business.create({
      data: {
        name,
        slug: cleanSlug,
        plan: plan || "starter",
        subscriptionStatus: subscriptionStatus || "trialing",
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
        gracePeriodEndsAt: gracePeriodEndsAt ? new Date(gracePeriodEndsAt) : null,
        industry: industry || null,
        model: model || null,
        timezone: timezone || "America/Argentina/Buenos_Aires",
        ownerId: user.id
      }
    });

    await prisma.businessMember.create({
      data: {
        userId: user.id,
        businessId: newBiz.id,
        role: "owner",
        status: "ACTIVE",
        roleId: ownerRole.id
      }
    });

    await prisma.subscription.create({
      data: {
        businessId: newBiz.id,
        planCode: newBiz.plan,
        status: newBiz.subscriptionStatus,
        interval: "month",
        provider: provider || "free",
        currentPeriodEnd: newBiz.currentPeriodEnd
      }
    });

    // Registrar acción de auditoría
    await logSuperAdminAction({
      userId: req.user?.id || req.user?.uid,
      userEmail: req.user?.email,
      action: "superadmin.business.create_free",
      businessId: newBiz.id,
      metadata: { name: newBiz.name, plan: newBiz.plan, slug: newBiz.slug, provider: provider || "free" },
      ip: req.ip || req.headers["x-forwarded-for"] || ""
    });

    return res.status(201).json({ success: true, business: newBiz });
  } catch (error) {
    console.error("Error creating business manual override:", error);
    return res.status(500).json({ success: false, error: "No se pudo crear el negocio." });
  }
});

router.post("/businesses/:id/override", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      plan, 
      subscriptionStatus, 
      trialEndsAt, 
      currentPeriodEnd, 
      gracePeriodEndsAt,
      name,
      slug,
      industry,
      model,
      timezone,
      ownerEmail,
      provider
    } = req.body;

    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }

    let ownerIdUpdate = undefined;

    if (ownerEmail !== undefined) {
      const emailLower = ownerEmail.trim().toLowerCase();
      if (emailLower) {
        // 1. Buscar en PostgreSQL
        let user = await prisma.user.findUnique({ where: { email: emailLower } });
        
        // 2. Si no está en Postgres, buscar en Firebase Auth
        if (!user) {
          try {
            const auth = getFirebaseAuth();
            const fbUser = await auth.getUserByEmail(emailLower);
            if (fbUser) {
              user = await prisma.user.create({
                data: {
                  id: fbUser.uid,
                  email: fbUser.email,
                  name: fbUser.displayName || "Usuario SaaS",
                  status: "active"
                }
              });
            }
          } catch (fbErr) {
            console.log("Firebase user not found or error:", fbErr.message);
          }
        }

        // 3. Si sigue sin existir, crear un usuario temporal/placeholder en Postgres
        if (!user) {
          const tempId = "temp-" + Math.random().toString(36).substring(2, 15);
          user = await prisma.user.create({
            data: {
              id: tempId,
              email: emailLower,
              name: "Usuario Invitado",
              status: "active"
            }
          });
        }

        ownerIdUpdate = user.id;

        // 4. Asegurar rol OWNER y membresía activa
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

        await prisma.businessMember.upsert({
          where: {
            userId_businessId: {
              userId: user.id,
              businessId: id
            }
          },
          update: {
            role: "owner",
            status: "ACTIVE",
            roleId: ownerRole.id
          },
          create: {
            userId: user.id,
            businessId: id,
            role: "owner",
            status: "ACTIVE",
            roleId: ownerRole.id
          }
        });
      }
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        plan: plan !== undefined ? plan : undefined,
        subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : undefined,
        trialEndsAt: trialEndsAt !== undefined ? (trialEndsAt ? new Date(trialEndsAt) : null) : undefined,
        currentPeriodEnd: currentPeriodEnd !== undefined ? (currentPeriodEnd ? new Date(currentPeriodEnd) : null) : undefined,
        gracePeriodEndsAt: gracePeriodEndsAt !== undefined ? (gracePeriodEndsAt ? new Date(gracePeriodEndsAt) : null) : undefined,
        name: name !== undefined ? name : undefined,
        slug: slug !== undefined ? slug : undefined,
        industry: industry !== undefined ? industry : undefined,
        model: model !== undefined ? model : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        ownerId: ownerIdUpdate !== undefined ? ownerIdUpdate : undefined
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
          currentPeriodEnd: currentPeriodEnd !== undefined ? (currentPeriodEnd ? new Date(currentPeriodEnd) : null) : undefined,
          provider: provider !== undefined ? provider : undefined
        }
      });
    }

    // Registrar acción de auditoría
    await logSuperAdminAction({
      userId: req.user?.id || req.user?.uid,
      userEmail: req.user?.email,
      action: "superadmin.business.update_subscription",
      businessId: id,
      metadata: { name: updated.name, plan: updated.plan, subscriptionStatus: updated.subscriptionStatus, provider },
      ip: req.ip || req.headers["x-forwarded-for"] || ""
    });

    return res.json({ success: true, business: updated });
  } catch (error) {
    console.error("Error updating business subscription manual override:", error);
    return res.status(500).json({ success: false, error: "No se pudo actualizar la suscripción del negocio." });
  }
});

router.delete("/businesses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }

    await prisma.business.delete({ where: { id } });

    // Registrar acción de auditoría
    await logSuperAdminAction({
      userId: req.user?.id || req.user?.uid,
      userEmail: req.user?.email,
      action: "superadmin.business.delete",
      businessId: id,
      metadata: { name: biz.name, slug: biz.slug },
      ip: req.ip || req.headers["x-forwarded-for"] || ""
    });

    return res.json({ success: true, message: "Negocio eliminado exitosamente." });
  } catch (error) {
    console.error("Error deleting business:", error);
    return res.status(500).json({ success: false, error: "No se pudo eliminar el negocio." });
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

router.post("/requests", async (req, res) => {
  try {
    const { businessId, requestedPlan, status } = req.body;
    if (!businessId || !requestedPlan) {
      return res.status(400).json({ success: false, error: "businessId y requestedPlan son requeridos." });
    }
    const biz = await prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }

    const newRequest = await prisma.planRequest.create({
      data: {
        businessId,
        requestedPlan,
        status: status || "PENDING",
        approvalToken: crypto.randomBytes(32).toString("hex")
      }
    });

    return res.status(201).json({ success: true, request: newRequest });
  } catch (error) {
    console.error("Error creating plan request:", error);
    return res.status(500).json({ success: false, error: "No se pudo crear la solicitud de plan." });
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

// GET cross-tenant view for a single business (Super-Admin only)
router.get("/businesses/:id/data", async (req, res) => {
  try {
    const { id } = req.params;
    const biz = await prisma.business.findUnique({
      where: { id },
      include: {
        subscription: true
      }
    });
    if (!biz) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }

    const [members, clientCount, appointmentCount, serviceCount, workerCount, recentAppointments] = await Promise.all([
      prisma.businessMember.findMany({
        where: { businessId: id },
        include: {
          user: {
            select: { email: true, name: true, status: true }
          }
        }
      }),
      prisma.client.count({ where: { businessId: id } }),
      prisma.appointment.count({ where: { businessId: id } }),
      prisma.service.count({ where: { businessId: id } }),
      prisma.worker.count({ where: { businessId: id } }),
      prisma.appointment.findMany({
        where: { businessId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          client: { select: { name: true, email: true } },
          worker: { select: { name: true } }
        }
      })
    ]);

    // Registrar acción de auditoría
    await logSuperAdminAction({
      userId: req.user?.id || req.user?.uid,
      userEmail: req.user?.email,
      action: "superadmin.business.view_cross_tenant_data",
      businessId: id,
      metadata: { name: biz.name, slug: biz.slug },
      ip: req.ip || req.headers["x-forwarded-for"] || ""
    });

    return res.json({
      success: true,
      business: biz,
      members,
      metrics: {
        clients: clientCount,
        appointments: appointmentCount,
        services: serviceCount,
        workers: workerCount
      },
      recentAppointments
    });
  } catch (error) {
    console.error("Error fetching cross-tenant business data:", error);
    return res.status(500).json({ success: false, error: "No se pudieron obtener los datos del negocio." });
  }
});

// GET all audit logs (Super-Admin only)
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 150
    });
    return res.json({ success: true, logs });
  } catch (error) {
    console.error("Error listing audit logs:", error);
    return res.status(500).json({ success: false, error: "No se pudieron obtener los registros de auditoría." });
  }
});

export default router;
