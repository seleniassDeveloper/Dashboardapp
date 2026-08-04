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

// POST /api/webhooks/whatsapp - Procesamiento seguro de mensajes entrantes ("SÍ" / "CONFIRMO")
router.post("/", async (req, res) => {
  try {
    // 1. Validar la firma criptográfica X-Hub-Signature-256 de Meta (BUG 3a)
    if (!verifyMetaSignature(req)) {
      console.warn("[WhatsApp Webhook] ⚠️ Firma X-Hub-Signature-256 inválida o manipulada.");
      return res.status(403).json({ error: "Firma inválida o ausente." });
    }

    // Convertir req.body si fue capturado como Buffer por express.raw
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString("utf8"));
      } catch (e) {
        return res.status(400).json({ error: "JSON malformado." });
      }
    }

    console.log("[WhatsApp Webhook] Payload entrante verificado correctamente.");

    if (body?.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (message && message.type === "text") {
        const fromPhone = String(message.from || "").replace(/\D/g, ""); // Ej: 5491122334455
        const textBody = String(message.text?.body || "").trim().toUpperCase();

        console.log(`[WhatsApp Webhook] Mensaje recibido de ${fromPhone}: "${textBody}"`);

        const isConfirmation = ["SI", "SÍ", "CONFIRMO", "CONFIRMAR", "1", "OK", "CONFIRMADO"].includes(textBody);

        if (isConfirmation && fromPhone.length >= 8) {
          // Búsqueda de clientes por teléfono coincidente (BUG 3b)
          const allClients = await prisma.client.findMany({
            select: { id: true, phone: true, firstName: true, lastName: true }
          });

          // Filtrar por coincidencia exacta o coincidencia de los últimos 10 dígitos (E.164)
          const matchedClients = allClients.filter(c => {
            if (!c.phone) return false;
            const clean = c.phone.replace(/\D/g, "");
            return clean === fromPhone || (clean.length >= 8 && fromPhone.endsWith(clean.slice(-9)));
          });

          if (matchedClients.length > 0) {
            const clientIds = matchedClients.map(c => c.id);

            // Buscar citas pendientes desde hace 2 horas en adelante
            const upcomingAppointments = await prisma.appointment.findMany({
              where: {
                clientId: { in: clientIds },
                status: { in: ["PENDING", "UNCONFIRMED"] },
                startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 2) }
              },
              orderBy: { startsAt: "asc" },
              include: { client: true, service: true, worker: true }
            });

            // Desambiguación: solo auto-confirmar si hay EXACTAMENTE 1 cita pendiente no ambigua
            if (upcomingAppointments.length === 1) {
              const appointment = upcomingAppointments[0];

              const updatedAppt = await prisma.appointment.update({
                where: { id: appointment.id },
                data: { status: "CONFIRMED" }
              });

              console.log(`[WhatsApp Webhook] ✅ Cita ${appointment.id} confirmada de forma segura via WhatsApp.`);

              await triggerWorkflows(appointment.businessId, "confirmed", {
                ...updatedAppt,
                client: appointment.client,
                service: appointment.service,
                worker: appointment.worker
              });

              await prisma.auditLog.create({
                data: {
                  action: "whatsapp_appointment_confirmed",
                  metadata: {
                    actor: "Bot WhatsApp Cloud API",
                    details: `Cita ${appointment.id} confirmada tras validar firma de Meta e identidad del cliente.`
                  },
                  businessId: appointment.businessId
                }
              });
            } else if (upcomingAppointments.length > 1) {
              console.warn(`[WhatsApp Webhook] ⚠️ Se encontraron ${upcomingAppointments.length} citas candidatas para ${fromPhone}. Se requiere desambiguación manual para no confirmar la cita errónea.`);
            }
          }
        }
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error?.message || error);
    return res.status(200).send("EVENT_RECEIVED");
  }
});

export default router;
