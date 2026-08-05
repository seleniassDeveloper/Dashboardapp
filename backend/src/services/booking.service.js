import prisma from "../prisma.js";
import { getDayRangeInTz } from "../utils/dateUtils.js";
import { checkWorkerAvailability } from "../controllers/public.controller.js";
import { triggerWorkflows } from "./workflowEngine.js";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Lógica central y atómica para la creación de reservas (utilizada por reservas web y bot de WhatsApp)
 */
export async function createBookingCore({
  businessId,
  slug,
  firstName,
  lastName,
  phone,
  email,
  notes,
  serviceId,
  professionalId,
  date, // YYYY-MM-DD
  time, // HH:MM
  source = "online_booking",
  downpaymentPaid,
  downpaymentStatus,
  downpaymentTransactionId
}) {
  if (!firstName || !serviceId || !date || !time) {
    throw new Error("Faltan campos obligatorios para completar la reserva (nombre, servicio, fecha y hora).");
  }

  // 1. Validar negocio
  let biz = null;
  if (businessId) {
    biz = await prisma.business.findUnique({ where: { id: businessId } });
  } else if (slug) {
    biz = await prisma.business.findUnique({ where: { slug } });
  }

  if (!biz || !biz.bookingEnabled) {
    throw new Error("Las reservas no están disponibles en este momento para este negocio.");
  }

  // Validar servicios
  const serviceIds = String(serviceId).split(",");
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, businessId: biz.id, isActive: true, availableOnline: true }
  });

  if (services.length !== serviceIds.length) {
    throw new Error("Uno o más servicios seleccionados no están disponibles.");
  }

  const orderedServices = serviceIds.map(id => services.find(s => s.id === id));
  const totalDuration = orderedServices.reduce((sum, s) => sum + (s.duration || 30), 0);
  const totalPrice = orderedServices.reduce((sum, s) => sum + s.price, 0);

  // 2. Determinar profesional asignado
  let workerIdToAssign = professionalId;

  if (!professionalId || professionalId === "any" || professionalId === "null" || professionalId === "undefined" || professionalId === "sin_preferencia") {
    const allWorkers = await prisma.worker.findMany({
      where: { businessId: biz.id, availableOnline: true },
      include: { services: true }
    });
    const eligibleWorkers = allWorkers.filter(w => {
      const workerServiceIds = w.services.map(ws => ws.serviceId);
      return serviceIds.every(id => workerServiceIds.includes(id));
    });

    let foundWorker = null;
    for (const w of eligibleWorkers) {
      const check = await checkWorkerAvailability(w.id, date, time, totalDuration, biz);
      if (check.available) {
        foundWorker = w;
        break;
      }
    }

    if (!foundWorker) {
      throw new Error("No hay profesionales disponibles para el horario seleccionado.");
    }

    workerIdToAssign = foundWorker.id;
  } else {
    const worker = await prisma.worker.findFirst({
      where: { id: professionalId, businessId: biz.id, availableOnline: true },
      include: { services: true }
    });
    if (!worker) {
      throw new Error("El profesional seleccionado no está disponible para este negocio.");
    }

    const workerServiceIds = worker.services.map(ws => ws.serviceId);
    const canDoAll = serviceIds.every(id => workerServiceIds.includes(id));
    if (!canDoAll) {
      throw new Error("El profesional seleccionado no realiza todos los servicios elegidos.");
    }

    const check = await checkWorkerAvailability(worker.id, date, time, totalDuration, biz);
    if (!check.available) {
      throw new Error("El profesional seleccionado no está disponible en este horario.");
    }

    workerIdToAssign = worker.id;
  }

  // 3. Buscar o crear cliente en el contexto estricto del negocio
  let client = null;
  const inputFirst = (firstName || "Cliente").trim();
  const inputLast = (lastName || "").trim();
  const cleanPhone = phone ? String(phone).trim() : null;
  const cleanEmail = email ? String(email).trim() : null;

  if (cleanPhone) {
    client = await prisma.client.findFirst({
      where: {
        phone: cleanPhone,
        businessId: biz.id
      }
    });
  }

  if (!client && cleanEmail) {
    client = await prisma.client.findFirst({
      where: {
        email: cleanEmail,
        businessId: biz.id
      }
    });
  }

  if (!client) {
    client = await prisma.client.findFirst({
      where: {
        firstName: { equals: inputFirst, mode: 'insensitive' },
        businessId: biz.id
      }
    });
  }

  if (client) {
    if ((inputLast && client.lastName !== inputLast) || (cleanEmail && client.email !== cleanEmail) || (cleanPhone && !client.phone)) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          lastName: inputLast || client.lastName,
          email: cleanEmail || client.email,
          phone: cleanPhone || client.phone
        }
      });
    }
  } else {
    client = await prisma.client.create({
      data: {
        firstName: inputFirst,
        lastName: inputLast || "WhatsApp",
        phone: cleanPhone,
        email: cleanEmail,
        businessId: biz.id,
        notes: `Registrado automáticamente via ${source}.`,
      }
    });
  }

  // 4. Calcular fecha/hora de inicio en la zona horaria del negocio
  const { start: dayStartInUTC } = getDayRangeInTz(date, biz.timezone);
  const [startH, startM] = time.split(":").map(Number);
  const startsAt = new Date(dayStartInUTC.getTime() + (startH * 60 + startM) * 60 * 1000);

  // 5. Crear la cita atómicamente
  const createdAppointments = await prisma.$transaction(async (tx) => {
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
          notes: notes ? `${notes}` : `Reserva via ${source}`,
          status: "PENDING",
          source: source,
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
  }, { maxWait: 15000, timeout: 30000 });

  // 6. Sincronizar Google Calendar y workflows en background
  for (const appt of createdAppointments) {
    import("./googleService.js")
      .then(({ syncAppointmentToGoogleCalendar }) => {
        syncAppointmentToGoogleCalendar(appt.id);
      })
      .catch((err) => console.error("[booking.service] importGoogleServiceError:", err?.message || err));

    triggerWorkflows(biz.id, "appointment_created", appt).catch(err => console.error("[booking.service] triggerAppointmentCreatedWorkflowError:", err?.message || err));
    if (appt.downpaymentPaid && appt.downpaymentPaid > 0) {
      triggerWorkflows(biz.id, "payment_received", appt).catch(err => console.error("[booking.service] triggerPaymentReceivedWorkflowError:", err?.message || err));
    }
  }

  return {
    success: true,
    business: biz,
    client: client,
    appointments: createdAppointments,
    firstAppointment: createdAppointments[0],
    service: orderedServices[0],
    worker: createdAppointments[0]?.worker
  };
}
