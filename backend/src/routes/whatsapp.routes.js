import { Router } from "express";
import crypto from "crypto";
import prisma from "../prisma.js";
import { triggerWorkflows } from "../services/workflowEngine.js";

const router = Router();

// GET /api/webhooks/whatsapp - Verificación del Webhook de Meta Cloud API
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "aura_whatsapp_verify_token";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Verificación exitosa.");
    return res.status(200).send(challenge);
  }
  
  return res.sendStatus(403);
});

// Helper para verificar la firma HMAC-SHA256 de Meta
function verifyMetaSignature(req) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true; // Si no hay secreto configurado en dev, permitir

  const signatureHeader = req.headers["x-hub-signature-256"];
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const signature = signatureHeader.slice(7);
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (e) {
    return false;
  }
}

// POST /api/webhooks/whatsapp - Procesamiento seguro de mensajes entrantes (Multi-Tenant + Idempotencia)
router.post("/", async (req, res) => {
  try {
    // 1. Validar la firma criptográfica X-Hub-Signature-256 de Meta
    if (!verifyMetaSignature(req)) {
      console.warn("[WhatsApp Webhook] ⚠️ Firma X-Hub-Signature-256 inválida o manipulada.");
      return res.status(403).json({ error: "Firma inválida o ausente." });
    }

    // Responder 200 inmediatamente a Meta para prevenir retries innecesarios
    res.status(200).send("EVENT_RECEIVED");

    // Convertir req.body si fue capturado como Buffer
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString("utf8"));
      } catch (e) {
        return;
      }
    }

    if (body?.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      const recipientPhoneId = change?.metadata?.phone_number_id;

      if (!message || !recipientPhoneId) return;

      const messageId = message.id;

      // 2. Idempotencia (Tarea 4): ignorar si ya procesamos este message.id
      if (messageId) {
        const existingEvent = await prisma.webhookEvent.findUnique({
          where: { eventId: messageId }
        }).catch(() => null);

        if (existingEvent) {
          console.log(`[WhatsApp Webhook] ⏩ Mensaje ${messageId} ya procesado previamente. Omitiendo.`);
          return;
        }

        await prisma.webhookEvent.create({
          data: {
            provider: "whatsapp",
            eventId: messageId,
            type: "incoming_message",
            payload: message
          }
        }).catch(err => console.error("[WhatsApp Webhook] Error registrando WebhookEvent:", err?.message));
      }

      // 3. Multi-Tenant Resolution (Tarea 3): Identificar el negocio por phoneId receptor
      const allBusinesses = await prisma.business.findMany({
        select: { id: true, slug: true, name: true, integrations: true, timezone: true, bookingConfirmationMessage: true }
      });

      const targetBusiness = allBusinesses.find(b => {
        const wp = b.integrations?.whatsapp;
        return wp && String(wp.phoneId) === String(recipientPhoneId);
      });

      if (!targetBusiness) {
        console.warn(`[WhatsApp Webhook] ⚠️ No se encontró ningún negocio configurado con phoneId="${recipientPhoneId}". Mensaje ignorado.`);
        return;
      }

      const businessId = targetBusiness.id;
      const fromPhone = String(message.from || "").replace(/\D/g, ""); // E.164 sin +

      // Manejo de mensajes de texto e interactivos
      const textContent = message.type === "text"
        ? String(message.text?.body || "").trim()
        : message.type === "interactive"
        ? String(message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || "").trim()
        : "";

      const textBodyUpper = textContent.toUpperCase();
      console.log(`[WhatsApp Webhook] [Negocio: ${targetBusiness.name}] Mensaje de ${fromPhone}: "${textContent}"`);

      // Cargar servicio de envío de WhatsApp
      const { sendText } = await import("../services/whatsapp.service.js");

      // CASO A: Confirmación de cita existente ("SÍ", "CONFIRMO", "OK")
      const isConfirmation = ["SI", "SÍ", "CONFIRMO", "CONFIRMAR", "1", "OK", "CONFIRMADO"].includes(textBodyUpper);
      if (isConfirmation && fromPhone.length >= 8) {
        const clientsInBiz = await prisma.client.findMany({
          where: { businessId },
          select: { id: true, phone: true }
        });

        const matchedClients = clientsInBiz.filter(c => {
          if (!c.phone) return false;
          const clean = c.phone.replace(/\D/g, "");
          return clean === fromPhone || (clean.length >= 8 && fromPhone.endsWith(clean.slice(-9)));
        });

        if (matchedClients.length > 0) {
          const clientIds = matchedClients.map(c => c.id);

          const upcomingAppts = await prisma.appointment.findMany({
            where: {
              businessId,
              clientId: { in: clientIds },
              status: { in: ["PENDING", "UNCONFIRMED"] },
              startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 2) }
            },
            orderBy: { startsAt: "asc" },
            include: { client: true, service: true, worker: true }
          });

          if (upcomingAppts.length === 1) {
            const appt = upcomingAppts[0];
            const updatedAppt = await prisma.appointment.update({
              where: { id: appt.id },
              data: { status: "CONFIRMED" }
            });

            console.log(`[WhatsApp Webhook] ✅ Cita ${appt.id} en ${targetBusiness.name} confirmada via WhatsApp.`);

            await triggerWorkflows(businessId, "confirmed", {
              ...updatedAppt,
              client: appt.client,
              service: appt.service,
              worker: appt.worker
            });

            await sendText(targetBusiness.integrations.whatsapp, fromPhone, `¡Gracias ${appt.client.firstName}! 🌟 Tu turno para *${appt.service?.name}* ha sido confirmado exitosamente. Te esperamos.`);
            return;
          }
        }
      }

      // CASO B: Solicitud de Agendado via comando o payload estructurado
      // Ejemplo: "AGENDAR|serviceId|date|time|professionalId|nombre"
      if (textContent.startsWith("AGENDAR|")) {
        const parts = textContent.split("|");
        const [_, serviceId, date, time, professionalId, clientName] = parts;

        const { createBookingCore } = await import("../services/booking.service.js");

        try {
          const bookingResult = await createBookingCore({
            businessId: targetBusiness.id,
            slug: targetBusiness.slug,
            firstName: clientName || "Cliente WhatsApp",
            phone: fromPhone,
            serviceId: serviceId,
            professionalId: professionalId || "any",
            date: date,
            time: time,
            source: "whatsapp"
          });

          const { firstAppointment, service, worker } = bookingResult;

          const confirmationMsg = `¡Tu turno ha sido agendado y registrado con éxito! 🎉\n\n` +
            `📌 *Servicio:* ${service?.name || "Servicio"}\n` +
            `📅 *Fecha:* ${date}\n` +
            `⏰ *Hora:* ${time} hs\n` +
            `👤 *Profesional:* ${worker?.firstName || "Asignado"}\n` +
            `🔢 *Nº de turno:* #${firstAppointment.id.slice(-6).toUpperCase()}\n\n` +
            `¡Te esperamos en *${targetBusiness.name}*!`;

          await sendText(targetBusiness.integrations.whatsapp, fromPhone, confirmationMsg);
          console.log(`[WhatsApp Webhook] ✅ Reserva creada via WhatsApp y registrada en dashboard para ${targetBusiness.name}`);
        } catch (bookingErr) {
          console.error(`[WhatsApp Webhook] Error agendando via WhatsApp:`, bookingErr?.message);
          await sendText(targetBusiness.integrations.whatsapp, fromPhone, `Disculpa, no pudimos completar la reserva: ${bookingErr?.message || "Horario no disponible"}. Por favor intenta con otro horario.`);
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error interno:", error?.message || error);
  }
});

export default router;
