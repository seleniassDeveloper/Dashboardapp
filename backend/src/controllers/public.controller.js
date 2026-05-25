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
    const services = await prisma.service.findMany({
      where: { isActive: true, availableOnline: true },
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
    const workers = await prisma.worker.findMany({
      where: { availableOnline: true },
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
    const { serviceId, professionalId, date } = req.query; // date: YYYY-MM-DD

    if (!serviceId || !professionalId || !date) {
      return res.status(400).json({ error: "Parámetros requeridos: serviceId, professionalId, date." });
    }

    // 1. Obtener servicio y validar duración
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true, availableOnline: true },
    });
    if (!service) return res.status(404).json({ error: "Servicio no disponible." });

    // 2. Obtener profesional y verificar que puede hacer el servicio
    const worker = await prisma.worker.findUnique({
      where: { id: professionalId, availableOnline: true },
      include: {
        services: { where: { serviceId } },
      },
    });
    if (!worker || worker.services.length === 0) {
      return res.status(404).json({ error: "El profesional no realiza este servicio o no está disponible online." });
    }

    // 3. Obtener el día de la semana (0: Domingo, 1: Lunes, etc.)
    // Forzamos zona local para parsear la fecha de forma segura
    const [year, month, day] = date.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // 4. Buscar jornada laboral del profesional para ese día de la semana
    const schedule = await prisma.workerSchedule.findFirst({
      where: { workerId: professionalId, dayOfWeek },
    });
    if (!schedule) return res.json([]); // No trabaja este día

    // 5. Cargar citas existentes del profesional para ese día
    // Las fechas guardadas son UTC (ISO). Filtramos las citas de ese día calendarizado.
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const appts = await prisma.appointment.findMany({
      where: {
        workerId: professionalId,
        startsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: "CANCELLED" },
      },
      include: { service: true },
    });

    // 6. Cargar bloqueos de agenda (ScheduleBlock)
    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        workerId: professionalId,
        date,
      },
    });

    // 7. Generar slots libres
    const startMins = timeToMinutes(schedule.startTime);
    const endMins = timeToMinutes(schedule.endTime);
    const svcDuration = service.duration || 30;
    const slotInterval = 30; // Slots cada 30 minutos
    const availableSlots = [];

    // Verificación de hoy en tiempo real (evitar reservar en el pasado)
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (let m = startMins; m + svcDuration <= endMins; m += slotInterval) {
      const slotStartStr = minutesToTime(m);
      const slotEndStr = minutesToTime(m + svcDuration);

      // Si es hoy, validar que el slot ocurra en el futuro + 60 min de anticipación
      if (date === todayStr) {
        if (m < currentMins + 60) continue;
      }

      // Validar overlap con citas de la base de datos
      let overlaps = false;
      for (const appt of appts) {
        const apptDate = new Date(appt.startsAt);
        // Convertir startsAt a minutos en el día en UTC
        const apptStartM = apptDate.getUTCHours() * 60 + apptDate.getUTCMinutes();
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
        availableSlots.push(slotStartStr);
      }
    }

    return res.json(availableSlots);
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
    } = req.body;

    if (!firstName || !lastName || !serviceId || !professionalId || !date || !time) {
      return res.status(400).json({ error: "Faltan campos obligatorios para completar la reserva." });
    }

    // 1. Validar negocio
    const biz = await prisma.business.findUnique({ where: { slug } });
    if (!biz || !biz.bookingEnabled) {
      return res.status(403).json({ error: "Las reservas no están permitidas en este momento." });
    }

    // 2. Buscar o crear cliente
    let client = null;
    if (email?.trim()) {
      client = await prisma.client.findFirst({
        where: { email: email.trim() },
      });
    }
    if (!client && phone?.trim()) {
      client = await prisma.client.findFirst({
        where: { phone: phone.trim() },
      });
    }

    if (!client) {
      client = await prisma.client.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          notes: "Registrado automáticamente desde reserva pública online.",
        },
      });
    }

    // 3. Calcular fecha/hora de inicio en UTC
    const [year, month, day] = date.split("-").map(Number);
    const [h, m] = time.split(":").map(Number);
    const startsAt = new Date(Date.UTC(year, month - 1, day, h, m, 0));

    // 4. Crear la cita (Appointment)
    const appointment = await prisma.appointment.create({
      data: {
        clientId: client.id,
        serviceId,
        workerId: professionalId,
        startsAt,
        notes: notes || null,
        status: "PENDING", // Por defecto se crea en PENDING
        source: "online_booking",
      },
      include: {
        client: true,
        service: true,
        worker: true,
      },
    });

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
