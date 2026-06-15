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

    const biz = appointment.businessId 
      ? await prisma.business.findUnique({ where: { id: appointment.businessId } })
      : { name: "Aura Studio" };

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
    const skippedDetails = [];
    const successfulDetails = [];

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const cleanPhone = (phone) => phone ? phone.replace(/[^0-9+]/g, '') : null;

    // --- IN-MEMORY CACHE OPTIMIZATION ---
    // Fetch all existing entities to memory
    const allClients = await prisma.client.findMany({ where: { businessId } });
    const allServices = await prisma.service.findMany({ where: { businessId } });
    const allWorkers = await prisma.worker.findMany({ where: { businessId } });

    const clientCache = {
      byEmail: new Map(),
      byPhone: new Map(),
      byName: new Map() // key: firstName + " " + lastName
    };
    allClients.forEach(c => {
      if (c.email) clientCache.byEmail.set(c.email, c);
      if (c.phone) clientCache.byPhone.set(c.phone, c);
      clientCache.byName.set(`${c.firstName} ${c.lastName}`.trim(), c);
    });

    const serviceCache = new Map();
    allServices.forEach(s => serviceCache.set(s.name.trim(), s));

    const workerCache = new Map();
    allWorkers.forEach(w => workerCache.set(`${w.firstName} ${w.lastName}`.trim(), w));

    let appointmentCache = null;
    if (entityType === "appointments") {
      const allAppts = await prisma.appointment.findMany({ where: { businessId } });
      appointmentCache = new Map();
      allAppts.forEach(a => {
        const key = `${a.clientId}_${new Date(a.startsAt).getTime()}`;
        appointmentCache.set(key, a);
      });
    }

    const getOrCreateClient = async (nameVal, phoneVal, emailVal) => {
      if (!nameVal) return null;
      let firstName = nameVal.trim();
      let lastName = "";
      const parts = nameVal.trim().split(/\s+/);
      if (parts.length > 1) {
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }
      const phone = cleanPhone(phoneVal);
      let email = emailVal ? emailVal.trim() : null;
      if (email && !isValidEmail(email)) email = null;

      if (email && clientCache.byEmail.has(email)) return clientCache.byEmail.get(email);
      if (phone && clientCache.byPhone.has(phone)) return clientCache.byPhone.get(phone);
      const nameKey = `${firstName} ${lastName}`.trim();
      if (clientCache.byName.has(nameKey)) return clientCache.byName.get(nameKey);

      const newClient = await prisma.client.create({
        data: { firstName, lastName, phone, email, businessId }
      });
      if (email) clientCache.byEmail.set(email, newClient);
      if (phone) clientCache.byPhone.set(phone, newClient);
      clientCache.byName.set(nameKey, newClient);
      return newClient;
    };

    const getOrCreateService = async (serviceName, priceVal) => {
      if (!serviceName) return null;
      const name = serviceName.trim();
      if (serviceCache.has(name)) return serviceCache.get(name);

      let priceStr = priceVal ? String(priceVal).replace(/[^0-9]/g, "") : "";
      let price = parseInt(priceStr, 10) || 12000;

      const newService = await prisma.service.create({
        data: { name, price, duration: 60, businessId }
      });
      serviceCache.set(name, newService);
      return newService;
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
      const nameKey = `${firstName} ${lastName}`.trim();

      if (workerCache.has(nameKey)) {
        const existing = workerCache.get(nameKey);
        if (serviceId) {
          const relation = await prisma.workerService.findUnique({
            where: { workerId_serviceId: { workerId: existing.id, serviceId } }
          });
          if (!relation) {
            await prisma.workerService.create({ data: { workerId: existing.id, serviceId } });
          }
        }
        return existing;
      }

      const defaultSchedules = [1,2,3,4,5].map(dayOfWeek => ({ dayOfWeek, startTime: "09:00", endTime: "19:00" }));

      const newWorker = await prisma.worker.create({
        data: {
          firstName, lastName, email: `${firstName.toLowerCase()}@salonaura.com`,
          phone: "1123456789", roleTitle: "Estilista", businessId, branchId,
          schedules: { create: defaultSchedules }
        }
      });
      if (serviceId) await prisma.workerService.create({ data: { workerId: newWorker.id, serviceId } });
      workerCache.set(nameKey, newWorker);
      return newWorker;
    };

    // Procesamiento secuencial para aprovechar el caché en memoria
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const rowNum = idx + 2;
      
      try {
        if (entityType === "clients") {
          const nameVal = mapping.firstName && row[mapping.firstName] ? row[mapping.firstName] : "";
          let firstName = nameVal ? nameVal.trim() : "Cliente";
          let lastName = nameVal ? "" : "Anónimo";
          if (nameVal) {
            if (mapping.lastName && row[mapping.lastName]) {
              lastName = row[mapping.lastName].trim();
            } else {
              const parts = nameVal.trim().split(/\s+/);
              if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(" ");
              }
            }
          }

          let phone = cleanPhone(mapping.phone && row[mapping.phone] ? row[mapping.phone].trim() : null);
          let emailRaw = mapping.email && row[mapping.email] ? row[mapping.email].trim() : null;
          let email = null;
          let invalidEmailNote = null;
          
          if (emailRaw) {
            if (isValidEmail(emailRaw)) {
              email = emailRaw;
            } else {
              invalidEmailNote = `Email inválido en origen: ${emailRaw}`;
            }
          }

          let notes = mapping.notes && row[mapping.notes] ? row[mapping.notes].trim() : null;

          const standardKeys = ["firstName", "lastName", "phone", "email", "notes"];
          const customKeys = Object.keys(mapping).filter(k => !standardKeys.includes(k));
          const customValues = [];
          for (const key of customKeys) {
            const colName = mapping[key];
            if (colName && row[colName] !== undefined && row[colName] !== null) {
              const val = String(row[colName]).trim();
              if (val) customValues.push(`${key}: ${val}`);
            }
          }
          if (invalidEmailNote) customValues.push(invalidEmailNote);
          
          let finalNotes = notes;
          if (customValues.length > 0) {
            finalNotes = (finalNotes ? finalNotes + "\n" : "") + customValues.join("\n");
          }

          let existing = null;
          if (email && clientCache.byEmail.has(email)) existing = clientCache.byEmail.get(email);
          if (!existing && phone && clientCache.byPhone.has(phone)) existing = clientCache.byPhone.get(phone);
          const nameKey = `${firstName} ${lastName}`.trim();
          if (!existing && clientCache.byName.has(nameKey)) existing = clientCache.byName.get(nameKey);

          if (existing) {
            reusedCount++;
            if (finalNotes && !existing.notes?.includes(finalNotes)) {
              await prisma.client.update({
                where: { id: existing.id },
                data: { notes: (existing.notes ? existing.notes + "\n" : "") + finalNotes }
              });
              existing.notes = (existing.notes ? existing.notes + "\n" : "") + finalNotes; // Update cache
            }
            successfulDetails.push({ row: rowNum, entityType: "Clientes", action: "Actualizado", description: nameKey });
          } else {
            const newClient = await prisma.client.create({
              data: { firstName, lastName, phone, email, notes: finalNotes, businessId }
            });
            if (email) clientCache.byEmail.set(email, newClient);
            if (phone) clientCache.byPhone.set(phone, newClient);
            clientCache.byName.set(nameKey, newClient);
            createdCount++;
            successfulDetails.push({ row: rowNum, entityType: "Clientes", action: "Creado", description: nameKey });
          }
        } 
        else if (entityType === "services") {
          const nameVal = mapping.name && row[mapping.name] ? row[mapping.name] : "";
          const name = nameVal ? nameVal.trim() : "Servicio Importado";

          let priceStr = mapping.price ? String(row[mapping.price]).replace(/[^0-9]/g, "") : "";
          let price = parseInt(priceStr, 10) || 0;
          let durationStr = mapping.duration ? String(row[mapping.duration]).replace(/[^0-9]/g, "") : "";
          let duration = parseInt(durationStr, 10) || 60;

          if (serviceCache.has(name.trim())) {
            reusedCount++;
            successfulDetails.push({ row: rowNum, entityType: "Servicios", action: "Ignorado / Ya existía", description: name.trim() });
          } else {
            const standardKeys = ["name", "price", "duration"];
            const customKeys = Object.keys(mapping).filter(k => !standardKeys.includes(k));
            const customValues = [];
            for (const key of customKeys) {
              const colName = mapping[key];
              if (colName && row[colName] !== undefined && row[colName] !== null) {
                const val = String(row[colName]).trim();
                if (val) customValues.push(`${key}: ${val}`);
              }
            }
            let description = customValues.length > 0 ? customValues.join("\n") : null;

            const newSvc = await prisma.service.create({
              data: { name: name.trim(), price, duration, description, businessId, isActive: true, availableOnline: true }
            });
            serviceCache.set(name.trim(), newSvc);
            createdCount++;
            successfulDetails.push({ row: rowNum, entityType: "Servicios", action: "Creado", description: name.trim() });
          }
        } 
        else if (entityType === "workers") {
          const nameVal = mapping.firstName && row[mapping.firstName] ? row[mapping.firstName] : "";
          let firstName = nameVal ? nameVal.trim() : "Profesional";
          let lastName = nameVal ? "" : "Importado";
          if (nameVal) {
            if (mapping.lastName && row[mapping.lastName]) {
              lastName = row[mapping.lastName].trim();
            } else {
              const parts = nameVal.trim().split(/\s+/);
              if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(" ");
              }
            }
          }

          let emailRaw = mapping.email && row[mapping.email] ? row[mapping.email].trim() : null;
          let email = isValidEmail(emailRaw) ? emailRaw : `${firstName.toLowerCase()}.${Date.now()}@salonaura.com`;
          let phone = cleanPhone(mapping.phone && row[mapping.phone] ? row[mapping.phone].trim() : null);
          const roleTitle = mapping.roleTitle && row[mapping.roleTitle] ? row[mapping.roleTitle].trim() : null;

          const nameKey = `${firstName} ${lastName}`.trim();
          if (workerCache.has(nameKey)) {
            reusedCount++;
            successfulDetails.push({ row: rowNum, entityType: "Profesionales", action: "Ignorado / Ya existía", description: nameKey });
          } else {
            const defaultSchedules = [1,2,3,4,5].map(dayOfWeek => ({ dayOfWeek, startTime: "09:00", endTime: "19:00" }));
            const standardKeys = ["firstName", "lastName", "email", "phone", "roleTitle"];
            const customKeys = Object.keys(mapping).filter(k => !standardKeys.includes(k));
            const customFields = {};
            for (const key of customKeys) {
              const colName = mapping[key];
              if (colName && row[colName] !== undefined && row[colName] !== null) {
                const val = String(row[colName]).trim();
                if (val) customFields[key] = val;
              }
            }

            const newWorker = await prisma.worker.create({
              data: {
                firstName, lastName, email, phone, roleTitle: roleTitle || "Profesional",
                customFields, businessId, branchId, schedules: { create: defaultSchedules }
              }
            });
            workerCache.set(nameKey, newWorker);
            createdCount++;
            successfulDetails.push({ row: rowNum, entityType: "Profesionales", action: "Creado", description: nameKey });
          }
        } 
        else if (entityType === "appointments") {
          let clientName = mapping.clientName && row[mapping.clientName] ? String(row[mapping.clientName]).trim() : "";
          if (!clientName) clientName = "Cliente Anónimo";

          let serviceName = mapping.serviceName && row[mapping.serviceName] ? String(row[mapping.serviceName]).trim() : "";
          if (!serviceName) serviceName = "Servicio General";

          let workerName = mapping.workerName && row[mapping.workerName] ? String(row[mapping.workerName]).trim() : "";
          if (!workerName) workerName = "Profesional Asignado";

          let dateVal = mapping.startsAt && row[mapping.startsAt] ? String(row[mapping.startsAt]).trim() : "";
          let timeVal = mapping.time && row[mapping.time] ? String(row[mapping.time]).trim() : "";

          const phoneVal = mapping.phone ? row[mapping.phone] : null;
          const emailVal = mapping.email ? row[mapping.email] : null;
          const priceVal = mapping.price ? row[mapping.price] : null;
          const notesVal = mapping.notes ? row[mapping.notes] : null;
          const statusVal = mapping.status ? row[mapping.status] : null;

          const client = await getOrCreateClient(clientName, phoneVal, emailVal);
          const service = await getOrCreateService(serviceName, priceVal);
          const worker = await getOrCreateWorker(workerName, service?.id);
          
          let startsAt = dateVal ? parseDateTime(dateVal, timeVal) : null;
          if (!startsAt) {
            startsAt = new Date();
          }

          if (!client || !service || !worker || !startsAt) {
            failedCount++;
            skippedDetails.push({ row: rowNum, motive: "No se pudo vincular cliente, servicio, profesional o fecha inválida" });
            continue;
          }

          const apptKey = `${client.id}_${startsAt.getTime()}`;
          if (appointmentCache.has(apptKey)) {
            reusedCount++;
            successfulDetails.push({ row: rowNum, entityType: "Citas", action: "Ignorado / Ya existía", description: `Cita de ${clientName}` });
            continue;
          }

          let defaultStatus = "CONFIRMED";
          if (startsAt < new Date()) defaultStatus = "DONE";
          const finalStatus = statusVal ? statusVal.trim().toUpperCase() : defaultStatus;

          const standardKeys = ["clientName", "phone", "email", "serviceName", "workerName", "startsAt", "time", "price", "status", "notes"];
          const customKeys = Object.keys(mapping).filter(k => !standardKeys.includes(k));
          const customValues = [];
          for (const key of customKeys) {
            const colName = mapping[key];
            if (colName && row[colName] !== undefined && row[colName] !== null) {
              const val = String(row[colName]).trim();
              if (val) customValues.push(`${key}: ${val}`);
            }
          }
          let finalNotes = notesVal || "Importado históricamente";
          if (customValues.length > 0) finalNotes = (finalNotes ? finalNotes + "\n" : "") + customValues.join("\n");

          const newAppt = await prisma.appointment.create({
            data: {
              clientId: client.id, serviceId: service.id, workerId: worker.id,
              startsAt, notes: finalNotes, status: finalStatus, businessId, branchId
            }
          });
          appointmentCache.set(apptKey, newAppt);
          createdCount++;
          successfulDetails.push({ row: rowNum, entityType: "Citas", action: "Creado", description: `Cita de ${clientName} con ${workerName}` });
        }
      } catch (e) {
        console.error(`Error importando fila ${rowNum}:`, e);
        failedCount++;
        skippedDetails.push({ row: rowNum, motive: e.message || "Error interno de base de datos" });
      }
    }

    res.json({
      success: true,
      summary: {
        created: createdCount,
        reused: reusedCount,
        failed: failedCount,
        skippedDetails,
        successfulDetails
      }
    });
  } catch (err) {
    console.error("Error en importación masiva:", err);
    res.status(500).json({ error: "Error al realizar la importación masiva.", detail: err.message });
  }
});


router.post("/import-history", async (req, res) => {
  try {
    const { name, summary } = req.body;
    const businessId = req.businessId;
    if (!name || !summary) return res.status(400).json({ error: "Faltan datos requeridos." });

    const record = await prisma.dataImportHistory.create({
      data: {
        businessId,
        name,
        details: summary
      }
    });
    res.json({ success: true, record });
  } catch (err) {
    console.error("Error guardando historial de importacion:", err);
    res.status(500).json({ error: "Error al guardar el historial." });
  }
});

router.get("/import-history", async (req, res) => {
  try {
    const businessId = req.businessId;
    const history = await prisma.dataImportHistory.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (err) {
    console.error("Error obteniendo historial de importaciones:", err);
    res.status(500).json({ error: "Error al obtener el historial." });
  }
});

export default router;

