// src/controllers/appointments.controller.js
import prisma from "../prisma.js";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + Number(minutes || 0) * 60 * 1000);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function dayRange(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ✅ devuelve workers disponibles para: serviceId + startsAt (usando duración del servicio)
async function findAvailableWorkers({ serviceId, startsAt, excludeAppointmentId = null }) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { duration: true },
  });
  if (!service) return [];

  const newStart = new Date(startsAt);
  const newEnd = addMinutes(newStart, service.duration);
  const { start: dayStart, end: dayEnd } = dayRange(newStart);

  // 1) workers que tienen ese servicio
  const workers = await prisma.worker.findMany({
    where: {
      services: { some: { serviceId } }, // WorkerService
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      appointments: {
        where: {
          ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
          startsAt: { gte: dayStart, lte: dayEnd },
          NOT: { status: "CANCELLED" }, // ✅ canceladas no bloquean
        },
        select: { id: true, startsAt: true, service: { select: { duration: true } } },
      },
    },
  });

  // 2) filtrar disponibles por solapamiento real (calculando end con duración)
  const available = workers.filter((w) => {
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

export async function getAppointments(req, res) {
  try {
    const data = await prisma.appointment.findMany({
      orderBy: { startsAt: "asc" },
      include: { client: true, service: true, worker: true },
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo citas" });
  }
}

export async function createAppointment(req, res) {
  try {
    const {
      clientId,
      serviceId,
      workerId,
      workerFirstName,
      workerLastName,
      startsAt,
      notes,
      status,
    } = req.body;

    if (!clientId || !serviceId || !workerId || !startsAt) {
      return res.status(400).json({
        error: "Faltan datos: clientId, serviceId, workerId, startsAt.",
      });
    }

    // ✅ duración del servicio
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true, name: true },
    });
    if (!service) return res.status(400).json({ error: "Servicio inválido." });

    const newStart = new Date(startsAt);
    const newEnd = addMinutes(newStart, service.duration);
    const { start: dayStart, end: dayEnd } = dayRange(newStart);

    // ✅ buscar citas del worker ese día (no CANCELLED) y chequear overlaps
    const sameDay = await prisma.appointment.findMany({
      where: {
        workerId,
        startsAt: { gte: dayStart, lte: dayEnd },
        NOT: { status: "CANCELLED" },
      },
      include: { client: true, service: { select: { id: true, name: true, duration: true } }, worker: true },
    });

    const conflict = sameDay.find((a) => {
      const aStart = new Date(a.startsAt);
      const aEnd = addMinutes(aStart, a?.service?.duration || 60);
      return overlaps(aStart, aEnd, newStart, newEnd);
    });

    if (conflict) {
      const availableWorkers = await findAvailableWorkers({ serviceId, startsAt: newStart });
      return res.status(409).json({
        error: "El trabajador no está libre en ese horario.",
        conflict,
        availableWorkers,
      });
    }

    // ✅ crear cita
    const appt = await prisma.appointment.create({
      data: {
        clientId,
        serviceId,
        workerId,
        workerFirstName: workerFirstName || null,
        workerLastName: workerLastName || null,
        startsAt: newStart,
        notes: notes || null,
        status: status || "CONFIRMED", // ✅ mejor default que PENDING
      },
      include: { client: true, service: true, worker: true },
    });

    res.json(appt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando la cita." });
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const {
      clientId,
      serviceId,
      workerId,
      workerFirstName,
      workerLastName,
      startsAt,
      notes,
      status,
    } = req.body;

    if (!clientId || !serviceId || !workerId || !startsAt) {
      return res.status(400).json({
        error: "Faltan datos: clientId, serviceId, workerId, startsAt.",
      });
    }

    // ✅ duración del servicio
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    });
    if (!service) return res.status(400).json({ error: "Servicio inválido." });

    const newStart = new Date(startsAt);
    const newEnd = addMinutes(newStart, service.duration);
    const { start: dayStart, end: dayEnd } = dayRange(newStart);

    // ✅ buscar citas del worker ese día excluyendo la misma cita
    const sameDay = await prisma.appointment.findMany({
      where: {
        workerId,
        startsAt: { gte: dayStart, lte: dayEnd },
        NOT: [{ id }, { status: "CANCELLED" }],
      },
      include: { client: true, service: { select: { id: true, name: true, duration: true } }, worker: true },
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
        excludeAppointmentId: id,
      });

      return res.status(409).json({
        error: "El trabajador no está libre en ese horario.",
        conflict,
        availableWorkers,
      });
    }

    const appt = await prisma.appointment.update({
      where: { id },
      data: {
        clientId,
        serviceId,
        workerId,
        workerFirstName: workerFirstName ?? null,
        workerLastName: workerLastName ?? null,
        startsAt: newStart,
        notes: notes || null,
        status: status || undefined,
      },
      include: { client: true, service: true, worker: true },
    });

    res.json(appt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando la cita." });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "id inválido" });

    await prisma.appointment.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error("deleteAppointment ERROR:", e);
    res.status(500).json({ error: "Error eliminando cita" });
  }
}