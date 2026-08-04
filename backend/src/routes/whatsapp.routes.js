import { Router } from "express";
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

// POST /api/webhooks/whatsapp - Procesamiento de mensajes entrantes ("SÍ" / "CONFIRMO")
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    console.log("[WhatsApp Webhook] Payload entrante:", JSON.stringify(body, null, 2));

    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (message && message.type === "text") {
        const fromPhone = String(message.from || "").replace(/\D/g, ""); // e.g. 5491122334455
        const textBody = String(message.text?.body || "").trim().toUpperCase();

        console.log(`[WhatsApp Webhook] Mensaje recibido de ${fromPhone}: "${textBody}"`);

        // Comprobar si el texto expresa intención de confirmación
        const isConfirmation = ["SI", "SÍ", "CONFIRMO", "CONFIRMAR", "1", "OK", "CONFIRMADO"].includes(textBody);

        if (isConfirmation && fromPhone) {
          // Extraer los últimos 8 dígitos para búsqueda flexible por teléfono
          const phoneSuffix = fromPhone.slice(-8);

          const clients = await prisma.client.findMany({
            where: {
              phone: { contains: phoneSuffix }
            }
          });

          if (clients.length > 0) {
            const clientIds = clients.map(c => c.id);

            // Buscar la próxima cita pendiente de este cliente
            const appointment = await prisma.appointment.findFirst({
              where: {
                clientId: { in: clientIds },
                startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 2) }
              },
              orderBy: { startsAt: "asc" },
              include: { client: true, service: true, worker: true }
            });

            if (appointment) {
              // Actualizar el estado de la cita a CONFIRMED
              const updatedAppt = await prisma.appointment.update({
                where: { id: appointment.id },
                data: { status: "CONFIRMED" }
              });

              console.log(`[WhatsApp Webhook] ✅ Cita ${appointment.id} confirmada automáticamente via WhatsApp.`);

              // Disparar motor de automatizaciones (workflow "confirmed" / "cita-confirmada")
              await triggerWorkflows(appointment.businessId, "confirmed", {
                ...updatedAppt,
                client: appointment.client,
                service: appointment.service,
                worker: appointment.worker
              });

              // Registrar auditoría
              await prisma.auditLog.create({
                data: {
                  action: "whatsapp_appointment_confirmed",
                  metadata: {
                    actor: "Bot WhatsApp Cloud API",
                    details: `Cita ${appointment.id} confirmada por mensaje entrante ("${textBody}").`
                  },
                  businessId: appointment.businessId
                }
              });
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
