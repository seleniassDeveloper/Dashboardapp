import prisma from "../prisma.js";

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + Number(minutes || 0) * 60 * 1000);
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export function dayRange(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);

  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function parseTimeToMinutes(hhmm) {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** JS: 0=Dom … 6=Sab → WorkerSchedule: 1=Lun … 7=Dom */
export function jsDayToScheduleDay(date) {
  const d = new Date(date).getDay();
  return d === 0 ? 7 : d;
}

export function isWithinWorkerSchedule(schedules, startsAt, durationMinutes) {
  const list = Array.isArray(schedules) ? schedules : [];
  if (list.length === 0) return { ok: true, reason: null };

  const startDate = new Date(startsAt);
  const day = jsDayToScheduleDay(startDate);
  const dayBlocks = list.filter((s) => Number(s.dayOfWeek) === day);

  if (dayBlocks.length === 0) {
    return {
      ok: false,
      reason: "El profesional no trabaja ese día.",
    };
  }

  const startMin = startDate.getHours() * 60 + startDate.getMinutes();
  const endMin = startMin + Number(durationMinutes || 60);

  const fits = dayBlocks.some((block) => {
    const blockStart = parseTimeToMinutes(block.startTime);
    const blockEnd = parseTimeToMinutes(block.endTime);
    return startMin >= blockStart && endMin <= blockEnd;
  });

  if (!fits) {
    const ranges = dayBlocks
      .map((b) => `${b.startTime}–${b.endTime}`)
      .join(", ");
    return {
      ok: false,
      reason: `Fuera del horario laboral (${ranges}).`,
    };
  }

  return { ok: true, reason: null };
}

export async function findAvailableWorkers({ serviceId, startsAt, excludeAppointmentId = null }) {
  const service = await prisma.service.findUnique({
    where: { id: String(serviceId) },
    select: { duration: true },
  });

  if (!service) return [];

  const newStart = new Date(startsAt);
  const newEnd = addMinutes(newStart, service.duration);
  const { start: dayStart, end: dayEnd } = dayRange(newStart);

  const workers = await prisma.worker.findMany({
    where: {
      services: {
        some: { serviceId: String(serviceId) },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      schedules: true,
      appointments: {
        where: {
          startsAt: { gte: dayStart, lte: dayEnd },
          NOT: [
            { status: "CANCELLED" },
            ...(excludeAppointmentId ? [{ id: String(excludeAppointmentId) }] : []),
          ],
        },
        select: {
          id: true,
          startsAt: true,
          service: { select: { duration: true } },
        },
      },
    },
  });

  const available = workers.filter((w) => {
    const scheduleCheck = isWithinWorkerSchedule(w.schedules, newStart, service.duration);
    if (!scheduleCheck.ok) return false;

    const busy = (w.appointments || []).some((a) => {
      const aStart = new Date(a.startsAt);
      const aEnd = addMinutes(aStart, a?.service?.duration || 60);
      return overlaps(aStart, aEnd, newStart, newEnd);
    });

    return !busy;
  });

  return available.map((w) => ({
    id: w.id,
    firstName: w.firstName || "",
    lastName: w.lastName || "",
    name: `${w.firstName || ""} ${w.lastName || ""}`.trim() || "Trabajador",
  }));
}

export async function validateAppointmentSlot({
  workerId,
  serviceId,
  startsAt,
  excludeAppointmentId = null,
}) {
  const service = await prisma.service.findUnique({
    where: { id: String(serviceId) },
    select: { id: true, name: true, duration: true },
  });

  if (!service) {
    return { available: false, reason: "Servicio inválido." };
  }

  const worker = await prisma.worker.findUnique({
    where: { id: String(workerId) },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      schedules: true,
      services: { where: { serviceId: String(serviceId) }, select: { serviceId: true } },
    },
  });

  if (!worker) {
    return { available: false, reason: "Profesional inválido." };
  }

  if (!worker.services?.length) {
    return {
      available: false,
      reason: "Este profesional no realiza el servicio seleccionado.",
    };
  }

  const newStart = new Date(startsAt);
  if (isNaN(newStart.getTime())) {
    return { available: false, reason: "Fecha/hora inválida." };
  }

  const scheduleCheck = isWithinWorkerSchedule(worker.schedules, newStart, service.duration);
  if (!scheduleCheck.ok) {
    return { available: false, reason: scheduleCheck.reason };
  }

  const newEnd = addMinutes(newStart, service.duration);
  const { start: dayStart, end: dayEnd } = dayRange(newStart);

  const sameDay = await prisma.appointment.findMany({
    where: {
      workerId: String(workerId),
      startsAt: { gte: dayStart, lte: dayEnd },
      NOT: [
        { status: "CANCELLED" },
        ...(excludeAppointmentId ? [{ id: String(excludeAppointmentId) }] : []),
      ],
    },
    include: {
      service: { select: { duration: true } },
      client: true,
    },
  });

  const conflict = sameDay.find((a) => {
    const aStart = new Date(a.startsAt);
    const aEnd = addMinutes(aStart, a?.service?.duration || 60);
    return overlaps(aStart, aEnd, newStart, newEnd);
  });

  if (conflict) {
    const availableWorkers = await findAvailableWorkers({
      serviceId,
      startsAt: newStart,
      excludeAppointmentId,
    });

    const workerName = `${worker.firstName || ""} ${worker.lastName || ""}`.trim();
    const conflictClient = conflict.client
      ? `${conflict.client.firstName || ""} ${conflict.client.lastName || ""}`.trim()
      : "otro cliente";

    return {
      available: false,
      reason: `${workerName || "El profesional"} ya tiene una cita con ${conflictClient} en ese horario.`,
      conflict,
      availableWorkers,
    };
  }

  return {
    available: true,
    reason: null,
    worker: {
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      name: `${worker.firstName || ""} ${worker.lastName || ""}`.trim(),
    },
    service,
    startsAt: newStart,
    endsAt: newEnd,
  };
}
