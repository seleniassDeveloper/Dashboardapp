import { google } from "googleapis";

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
