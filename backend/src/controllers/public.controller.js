import prisma from "../prisma.js";
import { sendReminderEmail } from "../services/mailer.js";
import { triggerWorkflows } from "../services/workflowEngine.js";
import { getTzMinutes, getDayRangeInTz, getCurrentTimeInTz } from "../utils/timezone.util.js";

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

// Helper para agregar minutos a una fecha
function addMinutes(date, minutes) {
  return new Date(date.getTime() + Number(minutes || 0) * 60 * 1000);
}

// Helper para verificar solapamiento
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// Obtener info pública del negocio
export async function getPublicBusiness(req, res) {
  try {
    const { slug } = req.params;
    const publicSelect = {
      id: true,
      name: true,
      slug: true,
      logo: true,
      industry: true,
      description: true,
      bookingEnabled: true,
      bookingPrimaryColor: true,
      bookingConfirmationMessage: true,
      timezone: true,
      bookingDownpaymentEnabled: true,
      bookingDownpaymentPercent: true
    };

    let biz = await prisma.business.findUnique({ 
      where: { slug },
      select: publicSelect
    });

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
        select: publicSelect
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
// Helper para verificar la disponibilidad de un profesional específico para un bloque total
async function checkWorkerAvailability(workerId, date, time, totalDuration, biz) {
  const [year, month, day] = date.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  const [h, m] = time.split(":").map(Number);
  
  const targetStartMins = h * 60 + m;
  const targetEndMins = targetStartMins + totalDuration;

  // 1. Validar jornada laboral del profesional
  const schedule = await prisma.workerSchedule.findFirst({
    where: { workerId, dayOfWeek }
  });
  if (!schedule) {
    return { available: false, reason: "El profesional no trabaja este día de la semana." };
  }

  const schedStartMins = timeToMinutes(schedule.startTime);
  const schedEndMins = timeToMinutes(schedule.endTime);
  if (targetStartMins < schedStartMins || targetEndMins > schedEndMins) {
    return { available: false, reason: "El horario está fuera de la jornada laboral del profesional." };
  }

  // 2. Validar citas existentes (en la zona horaria del negocio)
  const { start: startOfDay, end: endOfDay } = getDayRangeInTz(date, biz.timezone);

  const appts = await prisma.appointment.findMany({
    where: {
      workerId,
      startsAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { not: "CANCELLED" },
    },
    include: { service: true }
  });

  for (const appt of appts) {
    const apptStartM = getTzMinutes(appt.startsAt, biz.timezone);
    const apptEndM = apptStartM + (appt.service?.duration || 30);

    if (targetStartMins < apptEndM && targetEndMins > apptStartM) {
      return { available: false, reason: "El profesional tiene otra cita programada en ese horario." };
    }
  }

  // 3. Validar bloqueos de agenda
  const blocks = await prisma.scheduleBlock.findMany({
    where: {
      workerId,
      date,
    }
  });

  for (const block of blocks) {
    const blockStartM = timeToMinutes(block.startTime);
    const blockEndM = timeToMinutes(block.endTime);
    if (targetStartMins < blockEndM && targetEndMins > blockStartM) {
      return { available: false, reason: "El profesional tiene un bloqueo de agenda en ese horario." };
    }
  }

  return { available: true };
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

    // 1. Obtener servicios y validar duración total
    const serviceIds = serviceId.split(",");
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        businessId: biz.id,
        isActive: true,
        availableOnline: true
      },
    });

    if (services.length !== serviceIds.length) {
      return res.status(404).json({ error: "Uno o más servicios seleccionados no están disponibles para este negocio." });
    }

    // Calcular la duración total combinada en el orden solicitado
    const orderedServices = serviceIds.map(id => services.find(s => s.id === id));
    const svcDuration = orderedServices.reduce((sum, s) => sum + (s.duration || 30), 0);
    const slotInterval = 30; // Slots cada 30 minutos

    // 2. Obtener profesional(es) a validar
    let workers = [];
    if (effectiveProfessionalId && effectiveProfessionalId !== "any" && effectiveProfessionalId !== "null" && effectiveProfessionalId !== "undefined") {
      const worker = await prisma.worker.findFirst({
        where: { id: effectiveProfessionalId, businessId: biz.id, availableOnline: true },
        include: {
          services: true,
        },
      });
      if (worker) {
        const workerServiceIds = worker.services.map(ws => ws.serviceId);
        const canDoAll = serviceIds.every(id => workerServiceIds.includes(id));
        if (canDoAll) {
          workers = [worker];
        }
      }
    } else {
      // "Cualquiera" - buscar todos los profesionales del negocio que realizan TODOS los servicios seleccionados
      const allWorkers = await prisma.worker.findMany({
        where: {
          businessId: biz.id,
          availableOnline: true,
        },
        include: {
          services: true
        }
      });
      workers = allWorkers.filter(w => {
        const workerServiceIds = w.services.map(ws => ws.serviceId);
        return serviceIds.every(id => workerServiceIds.includes(id));
      });
    }

    if (workers.length === 0) {
      return res.json([]);
    }

    // 3. Obtener el día de la semana (0: Domingo, 1: Lunes, etc.)
    const [year, month, day] = date.split("-").map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const allAvailableSlots = new Set();

    // Verificación de hoy en tiempo real (evitar reservar en el pasado) usando la zona del negocio
    const { todayStr, currentMins } = getCurrentTimeInTz(biz.timezone);

    // Recorrer cada profesional para calcular su disponibilidad
    for (const w of workers) {
      // Buscar jornada laboral del profesional para ese día de la semana
      const schedule = await prisma.workerSchedule.findFirst({
        where: { workerId: w.id, dayOfWeek },
      });
      if (!schedule) continue;

      // Cargar citas existentes del profesional para ese día (en la zona horaria del negocio)
      const { start: startOfDay, end: endOfDay } = getDayRangeInTz(date, biz.timezone);

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

        // Validar overlap con citas de la base de datos
        let overlaps = false;
        for (const appt of appts) {
          const apptStartM = getTzMinutes(appt.startsAt, biz.timezone);
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
      serviceId, // Puede ser comma-separated (ej: "id1,id2")
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

    // Validar servicios
    const serviceIds = serviceId.split(",");
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, businessId: biz.id, isActive: true, availableOnline: true }
    });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({ error: "Uno o más servicios seleccionados no están disponibles para este negocio." });
    }

    const orderedServices = serviceIds.map(id => services.find(s => s.id === id));
    const totalDuration = orderedServices.reduce((sum, s) => sum + (s.duration || 30), 0);
    const totalPrice = orderedServices.reduce((sum, s) => sum + s.price, 0);

    // 2. Determinar profesional asignado o validar el seleccionado
    let workerIdToAssign = professionalId;

    if (!professionalId || professionalId === "any" || professionalId === "null" || professionalId === "undefined") {
      // "Cualquiera" - buscar todos los profesionales del negocio que realizan TODOS los servicios y están online
      const allWorkers = await prisma.worker.findMany({
        where: { businessId: biz.id, availableOnline: true },
        include: { services: true }
      });
      const eligibleWorkers = allWorkers.filter(w => {
        const workerServiceIds = w.services.map(ws => ws.serviceId);
        return serviceIds.every(id => workerServiceIds.includes(id));
      });

      // Encontrar uno que esté libre en la fecha y hora seleccionada para el bloque completo
      let foundWorker = null;
      for (const w of eligibleWorkers) {
        const check = await checkWorkerAvailability(w.id, date, time, totalDuration, biz);
        if (check.available) {
          foundWorker = w;
          break;
        }
      }

      if (!foundWorker) {
        return res.status(400).json({ error: "No hay profesionales disponibles para el horario seleccionado." });
      }

      workerIdToAssign = foundWorker.id;
    } else {
      // Validar profesional seleccionado
      const worker = await prisma.worker.findFirst({
        where: { id: professionalId, businessId: biz.id, availableOnline: true },
        include: { services: true }
      });
      if (!worker) {
        return res.status(400).json({ error: "El profesional seleccionado no está disponible para este negocio." });
      }

      // Validar si realiza todos los servicios
      const workerServiceIds = worker.services.map(ws => ws.serviceId);
      const canDoAll = serviceIds.every(id => workerServiceIds.includes(id));
      if (!canDoAll) {
        return res.status(400).json({ error: "El profesional seleccionado no realiza todos los servicios elegidos." });
      }

      // Validar disponibilidad real del profesional seleccionado
      const check = await checkWorkerAvailability(worker.id, date, time, totalDuration, biz);
      if (!check.available) {
        // Buscar profesionales alternativos que sí estén libres a esa hora
        const allWorkers = await prisma.worker.findMany({
          where: { businessId: biz.id, availableOnline: true },
          include: { services: true }
        });
        const eligibleWorkers = allWorkers.filter(w => {
          if (w.id === worker.id) return false;
          const wsIds = w.services.map(ws => ws.serviceId);
          return serviceIds.every(id => wsIds.includes(id));
        });

        const alternativeWorkers = [];
        for (const w of eligibleWorkers) {
          const checkAlt = await checkWorkerAvailability(w.id, date, time, totalDuration, biz);
          if (checkAlt.available) {
            alternativeWorkers.push(w);
          }
        }

        if (alternativeWorkers.length > 0) {
          const namesList = alternativeWorkers.map(w => `${w.firstName} ${w.lastName}`).join(", ");
          return res.status(400).json({
            error: `El profesional seleccionado no está disponible en este horario. Podrías reservar con: ${namesList}.`,
            alternativeWorkers: alternativeWorkers.map(w => ({ id: w.id, name: `${w.firstName} ${w.lastName}` }))
          });
        } else {
          return res.status(400).json({ error: "El profesional seleccionado no está disponible en este horario y no hay otros profesionales libres." });
        }
      }

      workerIdToAssign = worker.id;
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

    if (client) {
      // Si el nombre ingresado difiere, actualizamos el cliente en la base de datos para alinearlo
      const inputFirst = firstName.trim();
      const inputLast = lastName.trim();
      if (client.firstName !== inputFirst || client.lastName !== inputLast) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: {
            firstName: inputFirst,
            lastName: inputLast,
            email: email?.trim() || client.email
          }
        });
      }
    } else {
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

    // 4. Calcular fecha/hora de inicio en la zona horaria del negocio
    // Usamos getDayRangeInTz con la hora deseada
    const { start: dayStartInUTC } = getDayRangeInTz(date, biz.timezone);
    // Convertimos la hora (HH:MM) a milisegundos y se la sumamos al inicio del día UTC
    const [startH, startM] = time.split(":").map(Number);
    const startsAt = new Date(dayStartInUTC.getTime() + (startH * 60 + startM) * 60 * 1000);

    // 5. Crear las citas (Appointments) secuencialmente y con revalidación atómica
    const createdAppointments = await prisma.$transaction(async (tx) => {
      // Re-validar solapamiento justo antes de crear para prevenir colisiones
      const { start: txDayStart, end: txDayEnd } = getDayRangeInTz(date, biz.timezone);
      const sameDayAppts = await tx.appointment.findMany({
        where: {
          workerId: workerIdToAssign,
          startsAt: { gte: txDayStart, lte: txDayEnd },
          status: { not: "CANCELLED" }
        },
        include: { service: true }
      });
      
      const newTotalEnd = addMinutes(startsAt, totalDuration);
      for (const appt of sameDayAppts) {
        const apptEnd = addMinutes(new Date(appt.startsAt), appt.service?.duration || 30);
        if (overlaps(new Date(appt.startsAt), apptEnd, startsAt, newTotalEnd)) {
          throw new Error("El horario seleccionado acaba de ser reservado. Por favor, elige otro.");
        }
      }

      let currentStartsAt = startsAt;
      const created = [];

      for (let i = 0; i < orderedServices.length; i++) {
        const svc = orderedServices[i];
        
        let apptDpPaid = null;
        if (downpaymentPaid) {
          if (i === orderedServices.length - 1) {
            apptDpPaid = Number(downpaymentPaid) - created.reduce((sum, a) => sum + (a.downpaymentPaid || 0), 0);
          } else {
            apptDpPaid = Math.round(Number(downpaymentPaid) * (svc.price / totalPrice));
          }
        }

        const appointment = await tx.appointment.create({
          data: {
            clientId: client.id,
            serviceId: svc.id,
            workerId: workerIdToAssign,
            startsAt: currentStartsAt,
            notes: notes ? `${notes} (${i + 1}/${orderedServices.length})` : `Reserva múltiple (${i + 1}/${orderedServices.length})`,
            status: "PENDING",
            source: "online_booking",
            businessId: biz.id,
            downpaymentPaid: apptDpPaid,
            downpaymentStatus: downpaymentStatus || null,
            downpaymentTransactionId: downpaymentTransactionId || null,
          },
          include: {
            client: true,
            service: true,
            worker: true,
          },
        });

        created.push(appointment);
        currentStartsAt = addMinutes(currentStartsAt, svc.duration || 30);
      }
      
      return created;
    });

    // Sincronizar con Google Calendar en segundo plano
    for (const appt of createdAppointments) {
      import("../services/googleService.js")
        .then(({ syncAppointmentToGoogleCalendar }) => {
          syncAppointmentToGoogleCalendar(appt.id);
        })
        .catch((err) => console.error("Error importando googleService:", err));
    }

    // Trigger workflows for public bookings
    for (const appt of createdAppointments) {
      triggerWorkflows(biz.id, "appointment_created", appt).catch(err => console.error("Error triggering appointment_created workflow:", err));
      if (appt.downpaymentPaid && appt.downpaymentPaid > 0) {
        triggerWorkflows(biz.id, "payment_received", appt).catch(err => console.error("Error triggering payment_received workflow:", err));
      }
    }

    // Enviar email consolidado de confirmación si el cliente tiene email
    if (client.email) {
      try {
        const emailServicesList = createdAppointments.map((appt, idx) => {
          const apptDate = new Date(appt.startsAt);
          const formattedDate = apptDate.toLocaleDateString("es-AR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: biz.timezone
          });
          const formattedTime = apptDate.toLocaleTimeString("es-AR", {
            timeZone: biz.timezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          });
          return `
            <div style="padding: 12px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 12px; border: 1px solid #f1f5f9;">
              <strong style="color: #111827; font-size: 14px;">Servicio ${idx + 1}: ${appt.service?.name}</strong>
              <div style="color: #4b5563; font-size: 13px; margin-top: 4px;">
                <strong>Profesional:</strong> ${appt.worker?.firstName} ${appt.worker?.lastName}<br/>
                <strong>Fecha:</strong> <span style="text-transform: capitalize;">${formattedDate}</span><br/>
                <strong>Hora:</strong> ${formattedTime} hs<br/>
                <strong>Precio:</strong> $${appt.service?.price}
              </div>
            </div>
          `;
        }).join("");

        const mailHtml = `
          <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 700;">¡Tu reserva está confirmada!</h2>
              <p style="color: #4b5563; font-size: 14px; margin-top: 5px;">Gracias por confiar en ${biz.name}</p>
            </div>
            
            <div style="padding: 20px 0;">
              <h3 style="color: #111827; font-size: 16px; margin-top: 0; margin-bottom: 15px; font-weight: 600;">Detalle de tus turnos:</h3>
              ${emailServicesList}
            </div>
            
            ${downpaymentPaid ? `
              <div style="padding: 15px; background-color: #e6f4ea; border-radius: 8px; margin-bottom: 20px; border: 1px solid #c2e7cd;">
                <p style="margin: 0; color: #137333; font-size: 13px; line-height: 1.5;">
                  <strong>Seña Total Abonada:</strong> $${downpaymentPaid} (Código: ${downpaymentTransactionId})<br/>
                  <strong>Saldo restante en salón:</strong> $${totalPrice - downpaymentPaid}
                </p>
              </div>
            ` : ""}
            
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

        const subjectStr = createdAppointments.length === 1 
          ? `Reserva Confirmada: ${createdAppointments[0].service?.name} en ${biz.name}`
          : `Reserva Confirmada: ${createdAppointments.length} servicios en ${biz.name}`;

        await sendReminderEmail({
          to: client.email.trim(),
          subject: subjectStr,
          html: mailHtml,
          smtpConfig: biz?.integrations?.smtp
        });console.log(`Email de confirmación unificado enviado exitosamente a ${client.email}`);
      } catch (err) {
        console.error("Error al enviar el email de confirmación:", err);
      }
    }

    return res.status(201).json({
      success: true,
      message: biz.bookingConfirmationMessage,
      booking: createdAppointments[0], // Retrocompatibilidad
      bookings: createdAppointments,
    });
  } catch (error) {
    console.error("Error creando reserva pública:", error);
    if (error.message && error.message.includes("acaba de ser reservado")) {
      return res.status(409).json({ error: error.message });
    }
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

export async function triggerPublicWorkflowWebhook(req, res) {
  try {
    const { workflowId } = req.params;
    const { secret } = req.query;
    const authSecret = secret || req.headers["x-webhook-secret"];

    const { triggerWorkflowByInboundWebhook } = await import("../services/workflowEngine.js");
    const result = await triggerWorkflowByInboundWebhook(workflowId, req.body || {}, authSecret);
    
    return res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error("Error triggering public workflow webhook:", error);
    return res.status(400).json({ error: error.message || "Error al ejecutar webhook." });
  }
}



