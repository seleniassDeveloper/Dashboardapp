import { Router } from "express";
import prisma from "../prisma.js";
import {
  sendConfirmationEmailWithGmail,
  createCalendarEvent
} from "../services/googleService.js";

const router = Router();

/**
 * Endpoint para enviar confirmaciones por correo electrónico usando la Gmail API.
 */
router.post("/send-confirmation-email", async (req, res) => {
  const { appointmentId, to, subject, message } = req.body;
  const googleAccessToken = req.headers["x-google-access-token"];

  if (!googleAccessToken) {
    return res.status(400).json({ error: "Falta token de acceso de Google." });
  }

  try {
    // Buscar la cita con Prisma para cargar detalles ricos para el HTML
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, worker: true, service: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    const biz = (await prisma.business.findFirst()) || { name: "Aura Studio" };

    // Formatear fecha y hora
    const formattedDate = new Date(appointment.startsAt).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const formattedTime = new Date(appointment.startsAt).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    // Plantilla HTML premium para enviar por correo
    const html = `
      <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 700;">¡Tu reserva está confirmada!</h2>
          <p style="color: #4b5563; font-size: 14px; margin-top: 5px;">Gracias por confiar en ${biz.name}</p>
        </div>
        
        <div style="padding: 20px 0;">
          <h3 style="color: #111827; font-size: 16px; margin-top: 0; margin-bottom: 15px; font-weight: 600;">Detalle de la cita:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 35%;">Servicio</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${appointment.service?.name || "Servicio General"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Precio</td>
              <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;">$${appointment.service?.price || 0}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Profesional</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${appointment.worker ? `${appointment.worker.firstName} ${appointment.worker.lastName}` : "Cualquier Profesional"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-transform: capitalize;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Hora</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${formattedTime} hs</td>
            </tr>
          </table>
        </div>
        
        <div style="padding: 15px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.5;">
            <strong>Nota:</strong> Si necesitas cancelar o reprogramar tu cita, por favor comunícate con nosotros con al menos 24 horas de anticipación.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${biz.name}. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    await sendConfirmationEmailWithGmail({
      googleAccessToken,
      to,
      subject,
      html
    });

    res.json({ success: true, message: "Email enviado con éxito por Gmail." });
  } catch (err) {
    console.error("Error al enviar email por Gmail API:", err);
    if (err.status === 401 || err.response?.status === 401 || err.message?.includes("invalid_grant") || err.message?.includes("Invalid Credentials")) {
      return res.status(401).json({ error: "GOOGLE_TOKEN_EXPIRED", message: "Tu sesión de Google ha expirado. Reconectá tu cuenta de Google." });
    }
    res.status(500).json({ error: "Error al enviar email por Gmail API.", detail: err.message });
  }
});

/**
 * Endpoint para crear eventos en el Google Calendar del usuario de salón.
 */
router.post("/create-calendar-event", async (req, res) => {
  const {
    clientName,
    serviceName,
    startDateTime,
    endDateTime,
    clientEmail,
    description
  } = req.body;
  const googleAccessToken = req.headers["x-google-access-token"];

  if (!googleAccessToken) {
    return res.status(400).json({ error: "Falta token de acceso de Google." });
  }

  try {
    const data = await createCalendarEvent({
      googleAccessToken,
      eventDetails: {
        summary: `${serviceName} - ${clientName}`,
        description: description || `Cita de ${clientName} para el servicio de ${serviceName}.`,
        startDateTime,
        endDateTime,
        clientEmail
      }
    });

    res.json({ success: true, message: "Evento de calendario creado con éxito.", data });
  } catch (err) {
    console.error("Error al insertar evento en Google Calendar:", err);
    if (err.status === 401 || err.response?.status === 401 || err.message?.includes("invalid_grant") || err.message?.includes("Invalid Credentials")) {
      return res.status(401).json({ error: "GOOGLE_TOKEN_EXPIRED", message: "Tu sesión de Google ha expirado. Reconectá tu cuenta de Google." });
    }
    res.status(500).json({ error: "Error al crear el evento de Google Calendar.", detail: err.message });
  }
});

export default router;
