import prisma from "../prisma.js";
import { sendReminderEmail } from "../services/mailer.js";

// Helper para convertir hora HH:MM a minutos desde las 00:00
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Helper para convertir minutos a hora HH:MM
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Helper para obtener fecha actual y minutos del día actual en la zona de Argentina
function getArgentinaTimeParts() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  // YYYY-MM-DD
  const todayStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const currentMins = Number(partMap.hour) * 60 + Number(partMap.minute);
  return { todayStr, currentMins };
}

// Obtener info pública del negocio
export async function getPublicBusiness(req, res) {
  try {
    const { slug } = req.params;
    let biz = await prisma.business.findUnique({ where: { slug } });

    // Autocreación de negocio por defecto para desarrollo
    if (!biz && slug === "mi-negocio") {
      biz = await prisma.business.create({
        data: {
          name: "Aura Studio",
          slug: "mi-negocio",
          description: "Estudio de bienestar, estética y servicios profesionales.",
          bookingEnabled: true,
          bookingPrimaryColor: "#10b981",
          bookingConfirmationMessage: "¡Tu reserva ha sido confirmada con éxito!",
        },
      });
    }

    if (!biz) {
      return res.status(404).json({ error: "Negocio no encontrado." });
    }

    if (!biz.bookingEnabled) {
      return res.status(403).json({ error: "Las reservas online están desactivadas para este negocio." });
    }

    return res.json(biz);
  } catch (error) {
    console.error("Error obteniendo negocio público:", error);
    return res.status(500).json({ error: "Error interno al consultar el negocio." });
  }
}

// Obtener servicios online
export async function getPublicServices(req, res) {
  try {
    const { slug } = req.params;
    const services = await prisma.service.findMany({
      where: {
        business: { slug },
        isActive: true,
        availableOnline: true
      },
      orderBy: { name: "asc" },
    });
    return res.json(services);
  } catch (error) {
    console.error("Error obteniendo servicios públicos:", error);
    return res.status(500).json({ error: "Error al listar servicios." });
  }
}

// Obtener profesionales online
export async function getPublicProfessionals(req, res) {
  try {
    const { slug } = req.params;
    const workers = await prisma.worker.findMany({
      where: {
        business: { slug },
        availableOnline: true
      },
      include: {
        services: {
          include: { service: true },
        },
      },
    });
    
    const formatted = workers.map((w) => ({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      name: `${w.firstName} ${w.lastName}`.trim(),
      roleTitle: w.roleTitle || "Profesional",
      serviceIds: w.services.map((ws) => ws.serviceId),
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Error obteniendo profesionales públicos:", error);
    return res.status(500).json({ error: "Error al listar profesionales." });
  }
}

// Lógica de cálculo de disponibilidad horaria real
export async function getPublicAvailability(req, res) {
  try {
    const { slug } = req.params;
    const { serviceId, professionalId, workerId, date } = req.query; // date: YYYY-MM-DD

    const effectiveProfessionalId = professionalId || workerId;

    if (!serviceId || !date) {
      return res.status(400).json({ error: "Parámetros requeridos: serviceId, date." });
    }

    // Validar negocio
    const biz = await prisma.business.findUnique({ where: { slug } });
    if (!biz || !biz.bookingEnabled) {
      return res.status(404).json({ error: "Negocio no encontrado o reservas desactivadas." });
    }

    // 1. Obtener servicio y validar duración
    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: biz.id, isActive: true, availableOnline: true },
    });
    if (!service) return res.status(404).json({ error: "Servicio no disponible para este negocio." });

    // 2. Obtener profesional(es) a validar
    let workers = [];
    if (effectiveProfessionalId && effectiveProfessionalId !== "any" && effectiveProfessionalId !== "null" && effectiveProfessionalId !== "undefined") {
      const worker = await prisma.worker.findFirst({
        where: { id: effectiveProfessionalId, businessId: biz.id, availableOnline: true },
        include: {
          services: { where: { serviceId } },
        },
      });
      if (worker && worker.services.length > 0) {
        workers = [worker];
      }
    } else {
      // "Cualquiera" - buscar todos los profesionales del negocio que realizan este servicio
      workers = await prisma.worker.findMany({
        where: {
          businessId: biz.id,
          availableOnline: true,
          services: { some: { serviceId } }
        }
      });
    }

    if (workers.length === 0) {
      return res.json([]);
    }

    // 3. Obtener el día de la semana (0: Domingo, 1: Lunes, etc.)
    const [year, month, day] = date.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const allAvailableSlots = new Set();

    // Verificación de hoy en tiempo real (evitar reservar en el pasado) usando la zona de Argentina
    const { todayStr, currentMins } = getArgentinaTimeParts();

    const svcDuration = service.duration || 30;
    const slotInterval = 30; // Slots cada 30 minutos

    // Recorrer cada profesional para calcular su disponibilidad
    for (const w of workers) {
      // Buscar jornada laboral del profesional para ese día de la semana
      const schedule = await prisma.workerSchedule.findFirst({
        where: { workerId: w.id, dayOfWeek },
      });
      if (!schedule) continue;

      // Cargar citas existentes del profesional para ese día (en la zona horaria de Argentina)
      const startOfDay = new Date(`${date}T00:00:00-03:00`);
      const endOfDay = new Date(`${date}T23:59:59.999-03:00`);

      const appts = await prisma.appointment.findMany({
        where: {
          workerId: w.id,
          startsAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { not: "CANCELLED" },
        },
        include: { service: true },
      });

      // Cargar bloqueos de agenda (ScheduleBlock)
      const blocks = await prisma.scheduleBlock.findMany({
        where: {
          workerId: w.id,
          date,
        },
      });

      const startMins = timeToMinutes(schedule.startTime);
      const endMins = timeToMinutes(schedule.endTime);

      for (let m = startMins; m + svcDuration <= endMins; m += slotInterval) {
        const slotStartStr = minutesToTime(m);

        // Si es hoy, validar que el slot ocurra en el futuro + 60 min de anticipación
        if (date === todayStr) {
          if (m < currentMins + 60) continue;
        }

        // Validar overlap con citas de la base de datos (en la zona horaria de Argentina)
        let overlaps = false;
        for (const appt of appts) {
          const apptDate = new Date(appt.startsAt);
          const timeString = apptDate.toLocaleTimeString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          });
          const [apptH, apptM] = timeString.split(":").map(Number);
          const apptStartM = apptH * 60 + apptM;
          const apptEndM = apptStartM + (appt.service?.duration || 30);

          if (m < apptEndM && m + svcDuration > apptStartM) {
            overlaps = true;
            break;
          }
        }

        if (overlaps) continue;

        // Validar overlap con bloqueos de agenda
        for (const block of blocks) {
          const blockStartM = timeToMinutes(block.startTime);
          const blockEndM = timeToMinutes(block.endTime);
          if (m < blockEndM && m + svcDuration > blockStartM) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          allAvailableSlots.add(slotStartStr);
        }
      }
    }

    // Retornar listado de slots ordenados cronológicamente
    const sortedSlots = Array.from(allAvailableSlots).sort();
    return res.json(sortedSlots);
  } catch (error) {
    console.error("Error calculando disponibilidad:", error);
    return res.status(500).json({ error: "Error al calcular slots disponibles." });
  }
}

// Crear reserva pública online
export async function createPublicBooking(req, res) {
  try {
    const { slug } = req.params;
    const {
      firstName,
      lastName,
      phone,
      email,
      notes,
      serviceId,
      professionalId,
      date, // YYYY-MM-DD
      time, // HH:MM
      downpaymentPaid,
      downpaymentStatus,
      downpaymentTransactionId,
    } = req.body;

    if (!firstName || !lastName || !serviceId || !date || !time) {
      return res.status(400).json({ error: "Faltan campos obligatorios para completar la reserva." });
    }

    // 1. Validar negocio
    const biz = await prisma.business.findUnique({ where: { slug } });
    if (!biz || !biz.bookingEnabled) {
      return res.status(403).json({ error: "Las reservas no están permitidas en este momento." });
    }

    // Validar que el servicio pertenece al negocio
    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: biz.id, isActive: true, availableOnline: true }
    });
    if (!service) {
      return res.status(400).json({ error: "El servicio seleccionado no está disponible para este negocio." });
    }

    // 2. Determinar profesional asignado
    let workerIdToAssign = professionalId;

    if (!professionalId || professionalId === "any" || professionalId === "null" || professionalId === "undefined") {
      // Buscar todos los profesionales que realizan este servicio y están online
      const workers = await prisma.worker.findMany({
        where: {
          businessId: biz.id,
          availableOnline: true,
          services: { some: { serviceId } }
        }
      });

      // Encontrar uno que esté libre en la fecha y hora seleccionada (en hora local del servidor)
      const [year, month, day] = date.split("-").map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      const [h, m] = time.split(":").map(Number);
      
      const targetStartMins = h * 60 + m;
      const targetEndMins = targetStartMins + (service.duration || 30);

      const startsAt = new Date(`${date}T${time}:00-03:00`);

      let foundWorker = null;
      for (const w of workers) {
        // Verificar jornada laboral
        const schedule = await prisma.workerSchedule.findFirst({
          where: { workerId: w.id, dayOfWeek }
        });
        if (!schedule) continue;

        const schedStartMins = timeToMinutes(schedule.startTime);
        const schedEndMins = timeToMinutes(schedule.endTime);
        if (targetStartMins < schedStartMins || targetEndMins > schedEndMins) continue;

        // Verificar citas existentes (overlap en la zona horaria de Argentina)
        const startOfDay = new Date(`${date}T00:00:00-03:00`);
        const endOfDay = new Date(`${date}T23:59:59.999-03:00`);

        const appts = await prisma.appointment.findMany({
          where: {
            workerId: w.id,
            startsAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { not: "CANCELLED" },
          },
          include: { service: true }
        });

        let overlaps = false;
        for (const appt of appts) {
          const apptDate = new Date(appt.startsAt);
          const timeString = apptDate.toLocaleTimeString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          });
          const [apptH, apptM] = timeString.split(":").map(Number);
          const apptStartM = apptH * 60 + apptM;
          const apptEndM = apptStartM + (appt.service?.duration || 30);

          if (targetStartMins < apptEndM && targetEndMins > apptStartM) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) continue;

        // Verificar bloqueos
        const blocks = await prisma.scheduleBlock.findMany({
          where: {
            workerId: w.id,
            date,
          }
        });

        for (const block of blocks) {
          const blockStartM = timeToMinutes(block.startTime);
          const blockEndM = timeToMinutes(block.endTime);
          if (targetStartMins < blockEndM && targetEndMins > blockStartM) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) continue;

        foundWorker = w;
        break; // Asignamos el primero disponible
      }

      if (!foundWorker) {
        return res.status(400).json({ error: "No hay profesionales disponibles para el horario seleccionado." });
      }

      workerIdToAssign = foundWorker.id;
    } else {
      // Validar profesional seleccionado
      const worker = await prisma.worker.findFirst({
        where: { id: professionalId, businessId: biz.id, availableOnline: true }
      });
      if (!worker) {
        return res.status(400).json({ error: "El profesional seleccionado no está disponible para este negocio." });
      }
    }

    // 3. Buscar o crear cliente en el contexto del negocio
    let client = null;
    if (email?.trim()) {
      client = await prisma.client.findFirst({
        where: { email: email.trim(), businessId: biz.id },
      });
    }
    if (!client && phone?.trim()) {
      client = await prisma.client.findFirst({
        where: { phone: phone.trim(), businessId: biz.id },
      });
    }

    if (!client) {
      client = await prisma.client.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          businessId: biz.id,
          notes: "Registrado automáticamente desde reserva pública online.",
        },
      });
    }

    // 4. Calcular fecha/hora de inicio en la zona horaria de Argentina
    const startsAt = new Date(`${date}T${time}:00-03:00`);

    // 5. Crear la cita (Appointment)
    const appointment = await prisma.appointment.create({
      data: {
        clientId: client.id,
        serviceId,
        workerId: workerIdToAssign,
        startsAt,
        notes: notes || null,
        status: "PENDING", // Por defecto se crea en PENDING
        source: "online_booking",
        businessId: biz.id,
        downpaymentPaid: downpaymentPaid ? Number(downpaymentPaid) : null,
        downpaymentStatus: downpaymentStatus || null,
        downpaymentTransactionId: downpaymentTransactionId || null,
      },
      include: {
        client: true,
        service: true,
        worker: true,
      },
    });

    // Sincronizar con Google Calendar en segundo plano
    import("../services/googleService.js")
      .then(({ syncAppointmentToGoogleCalendar }) => {
        syncAppointmentToGoogleCalendar(appointment.id);
      })
      .catch((err) => console.error("Error importando googleService:", err));

    // Enviar email de confirmación
    if (appointment.client?.email) {
      try {
        const formattedDate = new Date(startsAt).toLocaleDateString("es-AR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "America/Argentina/Buenos_Aires"
        });
        const formattedTime = time;

        const mailHtml = `
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
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${appointment.service?.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Precio</td>
                  <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;">$${appointment.service?.price}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Profesional</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${appointment.worker?.firstName} ${appointment.worker?.lastName}</td>
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

        await sendReminderEmail({
          to: appointment.client.email.trim(),
          subject: `Reserva Confirmada: ${appointment.service?.name} en ${biz.name}`,
          html: mailHtml,
        });
        console.log(`Email de confirmación enviado exitosamente a ${appointment.client.email}`);
      } catch (err) {
        console.error("Error al enviar el email de confirmación:", err);
      }
    }

    return res.status(201).json({
      success: true,
      message: biz.bookingConfirmationMessage,
      booking: appointment,
    });
  } catch (error) {
    console.error("Error creando reserva pública:", error);
    return res.status(500).json({ error: "Error interno al guardar tu reserva." });
  }
}

// Callback de OAuth de Google
export async function googleOAuthCallback(req, res) {
  const { slug } = req.params;
  const { code, state } = req.query; // state es el businessId
  
  if (!code) {
    return res.status(400).send("Falta código de autorización de Google.");
  }

  try {
    const { getTokensFromCode } = await import("../services/googleService.js");
    
    // Obtenemos los tokens usando el redirect URI con el slug del negocio
    const tokens = await getTokensFromCode(code, slug);

    // Buscar el negocio usando el ID (state) o el slug de la ruta para máxima seguridad
    const businessId = state;
    const biz = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessId || undefined },
          { slug: slug || undefined }
        ]
      }
    });

    if (!biz) {
      return res.status(404).send(`Negocio con slug/ID '${slug || businessId}' no encontrado.`);
    }

    await prisma.business.update({
      where: { id: biz.id },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token, // refresh token offline
        updatedAt: new Date()
      }
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/settings?google_sync=success`);
  } catch (error) {
    console.error("Error en googleOAuthCallback:", error);
    return res.status(500).send(`Error al conectar con Google: ${error.message}`);
  }
}

// Envío público de reportes de error por correo electrónico
export async function reportPublicError(req, res) {
  try {
    const { name, email, description, path, stack, context } = req.body;
    
    await sendReminderEmail({
      to: "auradash.digital@gmail.com",
      subject: `🚨 Reporte de Error - AuraDash: ${description ? description.substring(0, 40) : "Sin descripción"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">🚨 Reporte de Error Recibido</h1>
          </div>
          <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
            <p><strong>Remitente:</strong> ${name || "Anónimo"} (${email || "No especificado"})</p>
            <p><strong>Ubicación/Módulo:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 14px;">${path || "No especificada"}</code></p>
            
            <p style="margin-top: 20px; font-weight: bold;">Descripción del problema:</p>
            <blockquote style="background: #f8fafc; padding: 16px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 0; font-style: italic;">
              ${description || "Sin descripción adicional"}
            </blockquote>

            ${stack ? `
              <p style="margin-top: 20px; font-weight: bold;">Detalles técnicos / Stack Trace:</p>
              <pre style="background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 6px; font-size: 12px; overflow-x: auto; font-family: monospace;">${stack}</pre>
            ` : ""}

            ${context ? `
              <p style="margin-top: 20px; font-weight: bold;">Contexto Adicional:</p>
              <pre style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; overflow-x: auto; font-family: monospace; border: 1px solid #e2e8f0;">${JSON.stringify(context, null, 2)}</pre>
            ` : ""}
          </div>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
            Este es un correo automático enviado desde el sistema de reporte de errores de AuraDash.
          </div>
        </div>
      `
    });

    return res.status(200).json({ ok: true, message: "Reporte enviado con éxito." });
  } catch (error) {
    console.error("Error al enviar reporte de soporte:", error);
    return res.status(500).json({ error: "No se pudo enviar el reporte por correo. Inténtalo más tarde." });
  }
}


