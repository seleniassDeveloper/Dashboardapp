import { google } from "googleapis";
import prisma from "../prisma.js";

/**
 * Obtiene las variables de entorno de Google OAuth y construye el redirect URI personalizado con el slug del negocio.
 */
function getOAuth2ClientInstance(businessSlug) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // URL base de redirección. Si tiene un slug de negocio, lo agregamos al final
  const baseRedirect = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/public/google/oauth-callback";
  const redirectUri = businessSlug ? `${baseRedirect}/${businessSlug}` : baseRedirect;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Crea una sesión de cliente OAuth2 para Google APIs usando el accessToken de la sesión del usuario.
 */
function getOAuth2Client(accessToken) {
  if (!accessToken) {
    throw new Error("Token de acceso de Google no provisto.");
  }
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

/**
 * Genera la URL de consentimiento para el flujo OAuth2 incluyendo el slug en la redirección.
 */
export function getAuthUrl(businessId, businessSlug) {
  const oauth2Client = getOAuth2ClientInstance(businessSlug);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/gmail.send"
    ],
    state: businessId
  });
}

/**
 * Canjea el código de autorización por los tokens de Google usando el redirect URI con slug.
 */
export async function getTokensFromCode(code, businessSlug) {
  const oauth2Client = getOAuth2ClientInstance(businessSlug);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Obtiene un cliente OAuth2 autenticado para un negocio usando sus credenciales de la DB.
 * Auto-refresca el access token si expira y lo guarda en la base de datos.
 */
export async function getAuthenticatedClient(businessId) {
  const biz = await prisma.business.findUnique({
    where: { id: businessId }
  });

  if (!biz || !biz.googleRefreshToken) {
    console.log(`[Google] El negocio ${businessId} no tiene configurada la integración con Google Calendar.`);
    return null;
  }

  const oauth2Client = getOAuth2ClientInstance();
  oauth2Client.setCredentials({
    access_token: biz.googleAccessToken,
    refresh_token: biz.googleRefreshToken
  });

  // Listener para guardar un nuevo access token si Google lo refresca automáticamente
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      console.log(`[Google] Se detectó renovación automática de token para negocio: ${businessId}`);
      await prisma.business.update({
        where: { id: businessId },
        data: {
          googleAccessToken: tokens.access_token,
          updatedAt: new Date()
        }
      });
    }
  });

  return oauth2Client;
}

/**
 * Envía un correo de confirmación de cita utilizando la Gmail API.
 * El remitente será la misma cuenta ("me") dueña del accessToken.
 */
export async function sendConfirmationEmailWithGmail({ googleAccessToken, to, subject, html }) {
  const auth = getOAuth2Client(googleAccessToken);
  const gmail = google.gmail({ version: "v1", auth });

  const str = [
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    html
  ].join("\n");

  const raw = Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: raw
    }
  });
}

/**
 * Crea un evento en el calendario principal ("primary") del usuario de Google Calendar.
 */
export async function createCalendarEvent({ googleAccessToken, eventDetails }) {
  const auth = getOAuth2Client(googleAccessToken);
  const calendar = google.calendar({ version: "v3", auth });

  const {
    summary,
    description,
    startDateTime,
    endDateTime,
    clientEmail
  } = eventDetails;

  const requestBody = {
    summary,
    description,
    start: {
      dateTime: startDateTime,
      timeZone: "America/Argentina/Buenos_Aires",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "America/Argentina/Buenos_Aires",
    },
    attendees: clientEmail ? [{ email: clientEmail }] : [],
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody,
  });

  return response.data;
}

/**
 * Sincroniza una cita desde la base de datos hacia Google Calendar (Crear o Actualizar).
 */
export async function syncAppointmentToGoogleCalendar(appointmentId) {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        service: true,
        worker: true,
        business: true
      }
    });
    if (!appt || !appt.businessId) return;

    const auth = await getAuthenticatedClient(appt.businessId);
    if (!auth) return;

    const calendar = google.calendar({ version: "v3", auth });
    const duration = appt.service?.duration || 30;
    const endDateTime = new Date(new Date(appt.startsAt).getTime() + duration * 60000).toISOString();
    const calendarId = appt.business?.googleCalendarId || "primary";

    const eventBody = {
      summary: `${appt.service?.name || "Cita"} - ${appt.client?.firstName} ${appt.client?.lastName}`,
      description: `${appt.notes || ""}\n\nDetalles del servicio:\n- Profesional: ${appt.worker?.firstName} ${appt.worker?.lastName}\n- Duración: ${duration} minutos\n- Cita ID: ${appt.id}`,
      start: {
        dateTime: new Date(appt.startsAt).toISOString(),
        timeZone: "America/Argentina/Buenos_Aires"
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Argentina/Buenos_Aires"
      },
      attendees: appt.client?.email ? [{ email: appt.client.email }] : []
    };

    if (appt.googleEventId) {
      try {
        console.log(`[Google] Actualizando evento de calendario para cita: ${appt.id} en calendario: ${calendarId}`);
        await calendar.events.update({
          calendarId,
          eventId: appt.googleEventId,
          requestBody: eventBody
        });
      } catch (err) {
        if (err.status === 404) {
          // Si el evento fue eliminado en Google Calendar, lo volvemos a crear
          console.log(`[Google] Evento no encontrado en Google Calendar, recreando en: ${calendarId}`);
          const response = await calendar.events.insert({
            calendarId,
            requestBody: eventBody
          });
          await prisma.appointment.update({
            where: { id: appt.id },
            data: { googleEventId: response.data.id }
          });
        } else {
          throw err;
        }
      }
    } else {
      console.log(`[Google] Insertando nuevo evento de calendario para cita: ${appt.id} en calendario: ${calendarId}`);
      const response = await calendar.events.insert({
        calendarId,
        requestBody: eventBody
      });

      await prisma.appointment.update({
        where: { id: appt.id },
        data: { googleEventId: response.data.id }
      });
    }
  } catch (error) {
    console.error(`[Google] Error al sincronizar cita ${appointmentId} con Google Calendar:`, error);
  }
}

/**
 * Elimina un evento de Google Calendar.
 */
export async function deleteGoogleCalendarEvent(businessId, googleEventId) {
  if (!businessId || !googleEventId) return;

  try {
    const biz = await prisma.business.findUnique({ where: { id: businessId } });
    const auth = await getAuthenticatedClient(businessId);
    if (!auth) return;

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = biz?.googleCalendarId || "primary";

    console.log(`[Google] Eliminando evento de calendario: ${googleEventId} en calendario: ${calendarId}`);
    await calendar.events.delete({
      calendarId,
      eventId: googleEventId
    });
  } catch (error) {
    console.error(`[Google] Error al eliminar evento de Google Calendar ${googleEventId}:`, error);
  }
}

/**
 * Sincroniza los eventos desde Google Calendar hacia la base de datos (Bidireccional).
 * Busca eventos en el calendario y crea citas locales si no existen en la base de datos.
 */
export async function syncGoogleCalendarToDb(businessId) {
  try {
    const biz = await prisma.business.findUnique({ where: { id: businessId } });
    const auth = await getAuthenticatedClient(businessId);
    if (!auth) return { success: false, message: "Google Calendar no configurado." };

    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = biz?.googleCalendarId || "primary";

    // Consultar eventos modificados en los últimos 7 días
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await calendar.events.list({
      calendarId,
      timeMin,
      singleEvents: true,
      orderBy: "startTime"
    });

    const events = res.data.items || [];
    let syncedCount = 0;

    // Obtener profesional por defecto para el negocio
    const defaultWorker = await prisma.worker.findFirst({
      where: { businessId, availableOnline: true }
    });
    if (!defaultWorker) {
      console.log(`[Google] No se pudo sincronizar porque no hay profesionales disponibles en el negocio.`);
      return { success: false, message: "No hay profesionales registrados en el negocio." };
    }

    // Obtener servicio por defecto para el negocio
    const defaultService = await prisma.service.findFirst({
      where: { businessId, isActive: true }
    });
    if (!defaultService) {
      console.log(`[Google] No se pudo sincronizar porque no hay servicios disponibles en el negocio.`);
      return { success: false, message: "No hay servicios registrados en el negocio." };
    }

    for (const event of events) {
      if (event.status === "cancelled") continue;

      // Verificar si ya existe en la base de datos
      const existingAppt = await prisma.appointment.findFirst({
        where: {
          OR: [
            { googleEventId: event.id },
            {
              businessId,
              startsAt: new Date(event.start.dateTime || event.start.date),
              workerId: defaultWorker.id
            }
          ]
        }
      });

      if (existingAppt) {
        // Si ya existe y no tiene el googleEventId guardado, lo asociamos
        if (!existingAppt.googleEventId) {
          await prisma.appointment.update({
            where: { id: existingAppt.id },
            data: { googleEventId: event.id }
          });
        }
        continue;
      }

      // Buscar o crear cliente a partir del creador/asistente del evento
      const clientEmail = event.creator?.email || event.organizer?.email || "cliente-google@aura.com";
      const summaryParts = (event.summary || "Cliente Google").split("-");
      const clientName = summaryParts[1]?.trim() || summaryParts[0]?.trim() || "Cliente Google";

      let client = await prisma.client.findFirst({
        where: { email: clientEmail, businessId }
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            firstName: clientName,
            lastName: "(Google Calendar)",
            email: clientEmail,
            phone: null,
            businessId,
            notes: "Creado automáticamente desde Google Calendar."
          }
        });
      }

      // Determinar servicio
      let service = defaultService;
      if (summaryParts[0]) {
        const matchingService = await prisma.service.findFirst({
          where: {
            businessId,
            name: { equals: summaryParts[0].trim(), mode: "insensitive" }
          }
        });
        if (matchingService) service = matchingService;
      }

      // Crear cita
      const startsAt = new Date(event.start.dateTime || event.start.date);
      await prisma.appointment.create({
        data: {
          startsAt,
          status: "CONFIRMED",
          notes: event.description || "Sincronizado desde Google Calendar",
          clientId: client.id,
          workerId: defaultWorker.id,
          serviceId: service.id,
          businessId,
          source: "google_calendar",
          googleEventId: event.id
        }
      });

      syncedCount++;
    }

    console.log(`[Google] Sincronización finalizada. Nuevas citas añadidas: ${syncedCount}`);
    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error("[Google] Error en syncGoogleCalendarToDb:", error);
    return { success: false, error: error.message };
  }
}
