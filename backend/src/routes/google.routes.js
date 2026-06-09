import { Router } from "express";
import prisma from "../prisma.js";
import {
  sendConfirmationEmailWithGmail,
  createCalendarEvent,
  getAuthUrl,
  syncGoogleCalendarToDb
} from "../services/googleService.js";
import { saveWorkerRelations } from "../utils/normalizeWorker.js";

const router = Router();

/**
 * Obtener URL de consentimiento para Google OAuth2.
 */
router.get("/auth-url", async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "No se detectó ID de negocio en la sesión." });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({
        error: "INTEGRATION_NOT_CONFIGURED",
        message: "La integración de Google no está configurada en el servidor. Debes agregar las variables GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el archivo .env del backend."
      });
    }

    const biz = await prisma.business.findUnique({
      where: { id: businessId }
    });
    if (!biz) {
      return res.status(404).json({ error: "Negocio no encontrado." });
    }
    const url = getAuthUrl(businessId, biz.slug);
    res.json({ url });
  } catch (err) {
    console.error("Error en GET /auth-url:", err);
    res.status(500).json({ error: "Error al generar link de autenticación de Google.", detail: err.message });
  }
});

/**
 * Obtener el estado actual de la integración.
 */
router.get("/status", async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "No se detectó ID de negocio en la sesión." });
    }
    const biz = await prisma.business.findUnique({
      where: { id: businessId }
    });
    res.json({
      connected: !!(biz?.googleRefreshToken),
      googleCalendarId: biz?.googleCalendarId || "primary",
      googleBookingUrl: biz?.googleBookingUrl || ""
    });
  } catch (err) {
    console.error("Error en GET /status:", err);
    res.status(500).json({ error: "Error al obtener estado de Google.", detail: err.message });
  }
});

/**
 * Guardar URL de agendamiento público de Google Calendar.
 */
router.post("/booking-url", async (req, res) => {
  try {
    const businessId = req.businessId;
    const { googleBookingUrl } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "No se detectó ID de negocio en la sesión." });
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        googleBookingUrl: googleBookingUrl ? googleBookingUrl.trim() : null
      }
    });

    res.json({ success: true, message: "Enlace de reservas de Google guardado con éxito." });
  } catch (err) {
    console.error("Error en POST /booking-url:", err);
    res.status(500).json({ error: "Error al actualizar el enlace de reservas.", detail: err.message });
  }
});

/**
 * Sincronización manual de citas de Google Calendar a Base de Datos.
 */
router.post("/sync", async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "No se detectó ID de negocio en la sesión." });
    }
    const result = await syncGoogleCalendarToDb(businessId);
    res.json(result);
  } catch (err) {
    console.error("Error en POST /sync:", err);
    res.status(500).json({ error: "Error al sincronizar citas.", detail: err.message });
  }
});

/**
 * Desconectar cuenta de Google.
 */
router.post("/disconnect", async (req, res) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "No se detectó ID de negocio en la sesión." });
    }
    await prisma.business.update({
      where: { id: businessId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleCalendarId: null
      }
    });
    res.json({ success: true, message: "Desconectado con éxito de Google Calendar." });
  } catch (err) {
    console.error("Error en POST /disconnect:", err);
    res.status(500).json({ error: "Error al desconectar cuenta de Google.", detail: err.message });
  }
});

/**
 * Guardar ID de calendario de Google personalizado.
 */
router.post("/calendar-id", async (req, res) => {
  try {
    const businessId = req.businessId;
    const { googleCalendarId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "No se detectó ID de negocio en la sesión." });
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        googleCalendarId: googleCalendarId ? googleCalendarId.trim() : null
      }
    });

    res.json({ success: true, message: "ID de calendario guardado con éxito." });
  } catch (err) {
    console.error("Error en POST /calendar-id:", err);
    res.status(500).json({ error: "Error al actualizar el ID de calendario.", detail: err.message });
  }
});

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

/**
 * Helper to parse CSV string robustly.
 */
function parseCSV(text) {
  const delimiter = text.includes(';') && !text.includes(',') ? ';' : ',';
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines.filter(r => r.some(cell => cell.trim() !== ""));
}

/**
 * Helper to parse dates with common layouts like DD/MM/YYYY or YYYY-MM-DD
 */
function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  let combinedStr = dateStr.trim();
  if (timeStr && timeStr.trim()) {
    combinedStr += " " + timeStr.trim();
  }

  // Matches DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = combinedStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 12;
    const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const second = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  const d = new Date(combinedStr);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/**
 * Endpoint to fetch, convert and parse Google Sheets into headers and preview rows
 */
router.post("/fetch-sheet", async (req, res) => {
  const { sheetUrl } = req.body;
  if (!sheetUrl || !sheetUrl.trim()) {
    return res.status(400).json({ error: "Falta la URL de Google Sheets." });
  }

  try {
    let exportUrl = sheetUrl;
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const spreadsheetId = match[1];
      exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
      const gidMatch = sheetUrl.match(/[#&?]gid=([0-9]+)/);
      if (gidMatch) {
        exportUrl += `&gid=${gidMatch[1]}`;
      }
    }

    const response = await fetch(exportUrl);
    if (!response.ok) {
      return res.status(400).json({
        error: "No se pudo acceder a la planilla de Google. Asegúrate de que tenga los permisos de 'Cualquier persona con el enlace puede leer'."
      });
    }

    const csvText = await response.text();
    const parsed = parseCSV(csvText);

    if (parsed.length === 0) {
      return res.status(400).json({ error: "La planilla está vacía o no tiene datos válidos." });
    }

    const headers = parsed[0].map(h => h.trim());
    const previewRows = parsed.slice(1, 11).map(row => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] !== undefined ? row[idx].trim() : "";
      });
      return obj;
    });

    res.json({
      success: true,
      headers,
      previewRows,
      totalRows: parsed.length - 1
    });
  } catch (err) {
    console.error("Error al descargar/procesar planilla:", err);
    res.status(500).json({ error: "Error interno al procesar la planilla de Google Sheets.", detail: err.message });
  }
});

/**
 * Endpoint to dynamically import mapped columns into Database
 */
router.post("/import", async (req, res) => {
  const { sheetUrl, entityType, mapping, rows: inputRows } = req.body;
  const businessId = req.businessId;

  if ((!sheetUrl && !inputRows) || !entityType || !mapping) {
    return res.status(400).json({ error: "Faltan parámetros: sheetUrl o rows, entityType y mapping." });
  }

  try {
    let rows = [];

    if (inputRows && Array.isArray(inputRows)) {
      rows = inputRows;
    } else {
      let exportUrl = sheetUrl;
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const spreadsheetId = match[1];
        exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
        const gidMatch = sheetUrl.match(/[#&?]gid=([0-9]+)/);
        if (gidMatch) {
          exportUrl += `&gid=${gidMatch[1]}`;
        }
      }

      const response = await fetch(exportUrl);
      if (!response.ok) {
        return res.status(400).json({ error: "No se pudo descargar la planilla para importar." });
      }

      const csvText = await response.text();
      const parsed = parseCSV(csvText);
      if (parsed.length <= 1) {
        return res.status(400).json({ error: "La planilla no tiene filas de datos para importar." });
      }

      const headers = parsed[0].map(h => h.trim());
      rows = parsed.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx] !== undefined ? row[idx].trim() : "";
        });
        return obj;
      });
    }

    const defaultBranch = await prisma.branch.findFirst({ where: { businessId } });
    const branchId = defaultBranch ? defaultBranch.id : null;

    let createdCount = 0;
    let reusedCount = 0;
    let failedCount = 0;

    if (entityType === "clients") {
      for (const row of rows) {
        try {
          const nameVal = row[mapping.firstName];
          if (!nameVal) {
            failedCount++;
            continue;
          }

          let firstName = nameVal.trim();
          let lastName = "";
          if (mapping.lastName && row[mapping.lastName]) {
            lastName = row[mapping.lastName].trim();
          } else {
            const parts = nameVal.trim().split(/\s+/);
            if (parts.length > 1) {
              firstName = parts[0];
              lastName = parts.slice(1).join(" ");
            }
          }

          const phone = mapping.phone && row[mapping.phone] ? row[mapping.phone].trim() : null;
          const email = mapping.email && row[mapping.email] ? row[mapping.email].trim() : null;
          const notes = mapping.notes && row[mapping.notes] ? row[mapping.notes].trim() : null;

          let existing = null;
          if (email) {
            existing = await prisma.client.findFirst({ where: { email, businessId } });
          }
          if (!existing && phone) {
            existing = await prisma.client.findFirst({ where: { phone, businessId } });
          }

          if (existing) {
            reusedCount++;
          } else {
            await prisma.client.create({
              data: {
                firstName,
                lastName,
                phone,
                email,
                notes,
                businessId
              }
            });
            createdCount++;
          }
        } catch (e) {
          console.error("Error importando fila cliente:", e);
          failedCount++;
        }
      }
    } else if (entityType === "services") {
      for (const row of rows) {
        try {
          const name = row[mapping.name];
          if (!name) {
            failedCount++;
            continue;
          }

          let priceStr = mapping.price ? String(row[mapping.price]).replace(/[^0-9]/g, "") : "";
          let price = parseInt(priceStr, 10) || 0;

          let durationStr = mapping.duration ? String(row[mapping.duration]).replace(/[^0-9]/g, "") : "";
          let duration = parseInt(durationStr, 10) || 60;

          let existing = await prisma.service.findFirst({ where: { name: name.trim(), businessId } });
          if (existing) {
            reusedCount++;
          } else {
            await prisma.service.create({
              data: {
                name: name.trim(),
                price,
                duration,
                businessId,
                isActive: true,
                availableOnline: true
              }
            });
            createdCount++;
          }
        } catch (e) {
          console.error("Error importando fila servicio:", e);
          failedCount++;
        }
      }
    } else if (entityType === "workers") {
      for (const row of rows) {
        try {
          const nameVal = row[mapping.firstName];
          if (!nameVal) {
            failedCount++;
            continue;
          }

          let firstName = nameVal.trim();
          let lastName = "";
          if (mapping.lastName && row[mapping.lastName]) {
            lastName = row[mapping.lastName].trim();
          } else {
            const parts = nameVal.trim().split(/\s+/);
            if (parts.length > 1) {
              firstName = parts[0];
              lastName = parts.slice(1).join(" ");
            }
          }

          const email = mapping.email && row[mapping.email] ? row[mapping.email].trim() : null;
          const phone = mapping.phone && row[mapping.phone] ? row[mapping.phone].trim() : null;
          const roleTitle = mapping.roleTitle && row[mapping.roleTitle] ? row[mapping.roleTitle].trim() : null;

          let existing = await prisma.worker.findFirst({ where: { firstName, lastName, businessId } });
          if (existing) {
            reusedCount++;
          } else {
            const defaultSchedules = [
              { dayOfWeek: 1, startTime: "09:00", endTime: "19:00" },
              { dayOfWeek: 2, startTime: "09:00", endTime: "19:00" },
              { dayOfWeek: 3, startTime: "09:00", endTime: "19:00" },
              { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" },
              { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" }
            ];

            await prisma.worker.create({
              data: {
                firstName,
                lastName,
                email: email || `${firstName.toLowerCase()}@salonaura.com`,
                phone,
                roleTitle: roleTitle || "Profesional",
                businessId,
                branchId,
                schedules: {
                  create: defaultSchedules
                }
              }
            });
            createdCount++;
          }
        } catch (e) {
          console.error("Error importando fila colaborador:", e);
          failedCount++;
        }
      }
    } else if (entityType === "appointments") {
      // Helpers to resolve ids dynamically
      const getOrCreateClient = async (nameVal, phoneVal, emailVal) => {
        if (!nameVal) return null;
        let firstName = nameVal.trim();
        let lastName = "";
        const parts = nameVal.trim().split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }
        const phone = phoneVal ? phoneVal.trim() : null;
        const email = emailVal ? emailVal.trim() : null;

        let existing = null;
        if (email) {
          existing = await prisma.client.findFirst({ where: { email, businessId } });
        }
        if (!existing && phone) {
          existing = await prisma.client.findFirst({ where: { phone, businessId } });
        }
        if (!existing) {
          existing = await prisma.client.findFirst({ where: { firstName, lastName, businessId } });
        }

        if (existing) return existing;

        return await prisma.client.create({
          data: {
            firstName,
            lastName,
            phone,
            email,
            businessId
          }
        });
      };

      const getOrCreateService = async (serviceName, priceVal) => {
        if (!serviceName) return null;
        const name = serviceName.trim();
        let existing = await prisma.service.findFirst({ where: { name, businessId } });
        if (existing) return existing;

        let priceStr = priceVal ? String(priceVal).replace(/[^0-9]/g, "") : "";
        let price = parseInt(priceStr, 10) || 12000;

        return await prisma.service.create({
          data: {
            name,
            price,
            duration: 60,
            businessId
          }
        });
      };

      const getOrCreateWorker = async (workerName, serviceId) => {
        if (!workerName) return null;
        const nameVal = workerName.trim();
        let firstName = nameVal;
        let lastName = "";
        const parts = nameVal.split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }

        let existing = await prisma.worker.findFirst({ where: { firstName, lastName, businessId } });
        if (existing) {
          // Verify if relation with service exists, if not save it
          if (serviceId) {
            const relation = await prisma.workerService.findUnique({
              where: { workerId_serviceId: { workerId: existing.id, serviceId } }
            });
            if (!relation) {
              await prisma.workerService.create({
                data: { workerId: existing.id, serviceId }
              });
            }
          }
          return existing;
        }

        const defaultSchedules = [
          { dayOfWeek: 1, startTime: "09:00", endTime: "19:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "19:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "19:00" },
          { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" }
        ];

        const newWorker = await prisma.worker.create({
          data: {
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}@salonaura.com`,
            phone: "1123456789",
            roleTitle: "Estilista",
            businessId,
            branchId,
            schedules: {
              create: defaultSchedules
            }
          }
        });

        if (serviceId) {
          await prisma.workerService.create({
            data: { workerId: newWorker.id, serviceId }
          });
        }

        return newWorker;
      };

      for (const row of rows) {
        try {
          const clientName = row[mapping.clientName];
          const serviceName = row[mapping.serviceName];
          const workerName = row[mapping.workerName];
          const dateVal = row[mapping.startsAt];

          if (!clientName || !serviceName || !workerName || !dateVal) {
            failedCount++;
            continue;
          }

          const phoneVal = mapping.phone ? row[mapping.phone] : null;
          const emailVal = mapping.email ? row[mapping.email] : null;
          const priceVal = mapping.price ? row[mapping.price] : null;
          const timeVal = mapping.time ? row[mapping.time] : null;
          const notesVal = mapping.notes ? row[mapping.notes] : null;
          const statusVal = mapping.status ? row[mapping.status] : null;

          const client = await getOrCreateClient(clientName, phoneVal, emailVal);
          const service = await getOrCreateService(serviceName, priceVal);
          const worker = await getOrCreateWorker(workerName, service?.id);

          const startsAt = parseDateTime(dateVal, timeVal);

          if (!client || !service || !worker || !startsAt) {
            failedCount++;
            continue;
          }

          // Check if appointment already exists at that exact time for this client
          const existingAppt = await prisma.appointment.findFirst({
            where: {
              clientId: client.id,
              startsAt,
              businessId
            }
          });

          if (existingAppt) {
            reusedCount++;
            continue;
          }

          let defaultStatus = "CONFIRMED";
          if (startsAt < new Date()) {
            defaultStatus = "DONE";
          }
          const finalStatus = statusVal ? statusVal.trim().toUpperCase() : defaultStatus;

          await prisma.appointment.create({
            data: {
              clientId: client.id,
              serviceId: service.id,
              workerId: worker.id,
              startsAt,
              notes: notesVal || "Importado históricamente",
              status: finalStatus,
              businessId,
              branchId
            }
          });
          createdCount++;
        } catch (e) {
          console.error("Error importando fila cita:", e);
          failedCount++;
        }
      }
    }

    res.json({
      success: true,
      summary: {
        created: createdCount,
        reused: reusedCount,
        failed: failedCount
      }
    });
  } catch (err) {
    console.error("Error en importación masiva:", err);
    res.status(500).json({ error: "Error al realizar la importación masiva.", detail: err.message });
  }
});

export default router;
