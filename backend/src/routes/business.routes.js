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

    let finalSlug = slug.toLowerCase().trim();

    // Verificar si el slug ya existe, si es así, agregar un sufijo aleatorio para evitar errores al usuario
    let existing = await prisma.business.findUnique({
      where: { slug: finalSlug }
    });
    if (existing) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalSlug = `${finalSlug}-${randomSuffix}`;
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
          slug: finalSlug,
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

      await tx.user.update({
        where: { id: firebaseUid },
        data: { status: "active" }
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

// POST /api/businesses/setup (Creación atómica de negocio + servicios + profesionales + horarios)
router.post("/setup", async (req, res) => {
  try {
    const { name, rubro, slug, logo, services, workers, schedules } = req.body;
    const firebaseUid = req.user?.uid;

    if (!name || !slug) {
      return res.status(400).json({ success: false, error: "El nombre y el slug del negocio son obligatorios." });
    }

    let finalSlug = slug.toLowerCase().trim();

    // Verificar si el slug ya existe, si es así, agregar un sufijo aleatorio
    let existing = await prisma.business.findUnique({
      where: { slug: finalSlug }
    });
    if (existing) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalSlug = `${finalSlug}-${randomSuffix}`;
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

    // Crear de forma atómica en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el negocio
      const biz = await tx.business.create({
        data: {
          name,
          slug: finalSlug,
          ownerId: firebaseUid,
          logo: logo || null,
          industry: rubro || null,
          model: rubro || null,
          description: `Negocio de rubro ${rubro || "Servicios"}`,
          bookingEnabled: true,
          bookingPrimaryColor: "#7c3aed"
        }
      });

      // 2. Crear la membresía del Owner
      const member = await tx.businessMember.create({
        data: {
          userId: firebaseUid,
          businessId: biz.id,
          roleId: ownerRole.id,
          role: "owner",
          status: "ACTIVE"
        }
      });

      // 3. Crear los Servicios
      const serviceMap = {}; // Nombre del servicio -> ID
      if (Array.isArray(services)) {
        for (const s of services) {
          const createdSvc = await tx.service.create({
            data: {
              name: s.name,
              duration: Number(s.duration || 30),
              price: Number(s.price || 0),
              category: s.category || rubro || "Servicios",
              businessId: biz.id,
              isActive: true,
              availableOnline: true
            }
          });
          serviceMap[s.name] = createdSvc.id;
        }
      }

      // 4. Crear los Profesionales y sus Horarios
      if (Array.isArray(workers)) {
        for (const w of workers) {
          const createdWorker = await tx.worker.create({
            data: {
              firstName: w.firstName,
              lastName: w.lastName,
              roleTitle: w.roleTitle || "Profesional",
              businessId: biz.id,
              availableOnline: true
            }
          });

          // Crear horarios de trabajo para este profesional
          if (Array.isArray(schedules)) {
            for (const sch of schedules) {
              await tx.workerSchedule.create({
                data: {
                  workerId: createdWorker.id,
                  dayOfWeek: Number(sch.dayOfWeek),
                  startTime: sch.startTime,
                  endTime: sch.endTime
                }
              });
            }
          }

          // Vincular servicios a este profesional
          if (Array.isArray(w.services)) {
            for (const svcName of w.services) {
              const serviceId = serviceMap[svcName];
              if (serviceId) {
                await tx.workerService.create({
                  data: {
                    workerId: createdWorker.id,
                    serviceId: serviceId
                  }
                });
              }
            }
          }
        }
      }

      await tx.user.update({
        where: { id: firebaseUid },
        data: { status: "active" }
      });

      return { biz, member };
    });

    await logAudit(result.biz.id, firebaseUid, "business_setup_completed", "Business", result.biz.id, { name, rubro });

    res.status(201).json({
      success: true,
      business: result.biz,
      member: result.member
    });
  } catch (error) {
    console.error("Error en setup de negocio:", error);
    res.status(500).json({ success: false, error: "No se pudo completar la configuración de tu negocio. Intenta nuevamente." });
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
    if (id !== req.businessId) {
      return res.status(403).json({ success: false, error: "No tienes autorización para ver este negocio." });
    }
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

// GET /api/businesses/me/integrations/whatsapp
router.get("/me/integrations/whatsapp", async (req, res) => {
  try {
    const id = req.businessId;
    if (!id) return res.status(403).json({ success: false, error: "No business context." });

    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) return res.status(404).json({ success: false, error: "Negocio no encontrado." });

    const whatsapp = biz.integrations?.whatsapp || {};
    const rawToken = whatsapp.token || "";
    
    // Mask token for privacy
    const maskedToken = rawToken
      ? (rawToken.length > 8 ? `${rawToken.slice(0, 4)}••••••••${rawToken.slice(-4)}` : "••••••••")
      : "";

    res.json({
      success: true,
      whatsapp: {
        phoneId: whatsapp.phoneId || "",
        businessId: whatsapp.businessId || "",
        staffPhone: whatsapp.staffPhone || "",
        token: maskedToken,
        hasToken: Boolean(rawToken),
        slug: biz.slug
      }
    });
  } catch (error) {
    console.error("Error al obtener integración WhatsApp:", error);
    res.status(500).json({ success: false, error: "Error al obtener configuración de WhatsApp." });
  }
});

// PUT /api/businesses/me/integrations/whatsapp
router.put("/me/integrations/whatsapp", requirePermission("business.edit"), async (req, res) => {
  try {
    const { phoneId, businessId: wpBusinessId, token, staffPhone } = req.body;
    const id = req.businessId;

    if (!id) {
      return res.status(403).json({ success: false, error: "No business context." });
    }

    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) return res.status(404).json({ success: false, error: "Negocio no encontrado." });

    const currentIntegrations = biz.integrations || {};
    const currentWp = currentIntegrations.whatsapp || {};

    // If token sent is masked (contains bullet dots) or empty, preserve existing token in DB
    const finalToken = (token && !token.includes("••••")) ? token : (currentWp.token || "");

    const updatedIntegrations = {
      ...currentIntegrations,
      whatsapp: {
        phoneId: phoneId !== undefined ? phoneId : currentWp.phoneId,
        businessId: wpBusinessId !== undefined ? wpBusinessId : currentWp.businessId,
        token: finalToken,
        staffPhone: staffPhone !== undefined ? staffPhone : currentWp.staffPhone
      }
    };

    await prisma.business.update({
      where: { id },
      data: { integrations: updatedIntegrations }
    });

    res.json({ success: true, integrations: updatedIntegrations });
  } catch (error) {
    console.error("Error al actualizar integración de WhatsApp:", error);
    res.status(500).json({ success: false, error: "No se pudo guardar la configuración de WhatsApp." });
  }
});

// POST /api/businesses/me/integrations/whatsapp/test-message
router.post("/me/integrations/whatsapp/test-message", requirePermission("business.edit"), async (req, res) => {
  try {
    const id = req.businessId;
    const { targetPhone } = req.body;

    if (!id) return res.status(403).json({ success: false, error: "No business context." });

    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) return res.status(404).json({ success: false, error: "Negocio no encontrado." });

    const { sendText } = await import("../services/whatsapp.service.js");
    const destPhone = targetPhone || biz.integrations?.whatsapp?.staffPhone;

    if (!destPhone) {
      return res.status(400).json({ success: false, error: "Ingresa un número de teléfono para enviar el mensaje de prueba." });
    }

    const messageText = `¡Hola! 👋 Este es un mensaje de prueba enviado desde tu cuenta de ${biz.name} en AuraDash. La integración de WhatsApp está funcionando correctamente. 🎉`;

    await sendText(biz.integrations?.whatsapp, destPhone, messageText);

    res.json({ success: true, message: `Mensaje de prueba enviado con éxito a ${destPhone}.` });
  } catch (error) {
    console.error("Error en mensaje de prueba de WhatsApp:", error);
    res.status(400).json({ success: false, error: error.message || "No se pudo enviar el mensaje de prueba." });
  }
});

// PUT /api/businesses/me/integrations/smtp
router.put("/me/integrations/smtp", requirePermission("business.edit"), async (req, res) => {
  try {
    const { host, port, user, password } = req.body;
    const id = req.businessId;

    if (!id) {
      return res.status(403).json({ success: false, error: "No business context." });
    }

    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) return res.status(404).json({ success: false, error: "Negocio no encontrado." });

    const currentIntegrations = biz.integrations || {};
    const updatedIntegrations = {
      ...currentIntegrations,
      smtp: { host, port: Number(port), user, password }
    };

    await prisma.business.update({
      where: { id },
      data: { integrations: updatedIntegrations }
    });

    res.json({ success: true, integrations: updatedIntegrations });
  } catch (error) {
    console.error("Error al actualizar integración SMTP:", error);
    res.status(500).json({ success: false, error: "No se pudo guardar la configuración SMTP." });
  }
});

// DELETE /api/businesses/me/integrations/:name
router.delete("/me/integrations/:name", requirePermission("business.edit"), async (req, res) => {
  try {
    const { name } = req.params;
    const id = req.businessId;

    if (!id) {
      return res.status(403).json({ success: false, error: "No business context." });
    }

    const biz = await prisma.business.findUnique({ where: { id } });
    if (!biz) return res.status(404).json({ success: false, error: "Negocio no encontrado." });

    const currentIntegrations = biz.integrations || {};
    
    // Si la integración existe, la eliminamos
    if (currentIntegrations[name]) {
      delete currentIntegrations[name];
      
      await prisma.business.update({
        where: { id },
        data: { integrations: currentIntegrations }
      });
    }

    res.json({ success: true, integrations: currentIntegrations });
  } catch (error) {
    console.error(`Error al desconectar integración ${req.params.name}:`, error);
    res.status(500).json({ success: false, error: `No se pudo desconectar la integración ${req.params.name}.` });
  }
});

export default router;
