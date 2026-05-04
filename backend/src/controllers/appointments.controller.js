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

// Devuelve workers disponibles para: serviceId + startsAt
async function findAvailableWorkers({ serviceId, startsAt, excludeAppointmentId = null }) {
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
          service: {
            select: { duration: true },
          },
        },
      },
    },
  });

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
    const appointments = await prisma.appointment.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        client: true,
        worker: true,
        service: true,
      },
    });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error obteniendo citas:", error);

    return res.status(500).json({
      error: "Error obteniendo citas",
      detail: error?.message || "Unknown error",
    });
  }
}

export async function createAppointment(req, res) {
  try {
    const { clientId, serviceId, workerId, startsAt, notes, status } = req.body;

    if (!clientId || !serviceId || !workerId || !startsAt) {
      return res.status(400).json({
        error: "Faltan datos: clientId, serviceId, workerId, startsAt.",
      });
    }

    const service = await prisma.service.findUnique({
      where: { id: String(serviceId) },
      select: { id: true, name: true, duration: true },
    });

    if (!service) {
      return res.status(400).json({ error: "Servicio inválido." });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: String(workerId) },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!worker) {
      return res.status(400).json({ error: "Trabajador inválido." });
    }

    const client = await prisma.client.findUnique({
      where: { id: String(clientId) },
      select: { id: true },
    });

    if (!client) {
      return res.status(400).json({ error: "Cliente inválido." });
    }

    const newStart = new Date(startsAt);
    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ error: "startsAt inválido." });
    }

    const newEnd = addMinutes(newStart, service.duration);
    const { start: dayStart, end: dayEnd } = dayRange(newStart);

    const sameDay = await prisma.appointment.findMany({
      where: {
        workerId: String(workerId),
        startsAt: { gte: dayStart, lte: dayEnd },
        NOT: { status: "CANCELLED" },
      },
      include: {
        service: {
          select: { id: true, name: true, duration: true },
        },
        client: true,
        worker: true,
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
      });

      return res.status(409).json({
        error: "El trabajador no está libre en ese horario.",
        conflict,
        availableWorkers,
      });
    }

    const appt = await prisma.appointment.create({
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        workerId: String(workerId),
        startsAt: newStart,
        notes: notes || null,
        status: status || "PENDING",
      },
      include: {
        client: true,
        worker: true,
        service: true,
      },
    });

    return res.status(201).json(appt);
  } catch (e) {
    console.error("Error creando la cita:", e);

    return res.status(500).json({
      error: "Error creando la cita.",
      detail: e?.message || "Unknown error",
    });
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { clientId, serviceId, workerId, startsAt, notes, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Id inválido." });
    }

    if (!clientId || !serviceId || !workerId || !startsAt) {
      return res.status(400).json({
        error: "Faltan datos: clientId, serviceId, workerId, startsAt.",
      });
    }

    const service = await prisma.service.findUnique({
      where: { id: String(serviceId) },
      select: { duration: true },
    });

    if (!service) {
      return res.status(400).json({ error: "Servicio inválido." });
    }

    const newStart = new Date(startsAt);
    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ error: "startsAt inválido." });
    }

    const newEnd = addMinutes(newStart, service.duration);
    const { start: dayStart, end: dayEnd } = dayRange(newStart);

    const sameDay = await prisma.appointment.findMany({
      where: {
        workerId: String(workerId),
        startsAt: { gte: dayStart, lte: dayEnd },
        NOT: [{ id: String(id) }, { status: "CANCELLED" }],
      },
      include: {
        service: {
          select: { id: true, name: true, duration: true },
        },
        client: true,
        worker: true,
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
        excludeAppointmentId: id,
      });

      return res.status(409).json({
        error: "El trabajador no está libre en ese horario.",
        conflict,
        availableWorkers,
      });
    }

    const appt = await prisma.appointment.update({
      where: { id: String(id) },
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        workerId: String(workerId),
        startsAt: newStart,
        notes: notes || null,
        status: status || undefined,
      },
      include: {
        client: true,
        worker: true,
        service: true,
      },
    });

    return res.status(200).json(appt);
  } catch (e) {
    console.error("Error actualizando la cita:", e);

    return res.status(500).json({
      error: "Error actualizando la cita.",
      detail: e?.message || "Unknown error",
    });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const id = String(req.params.id || "");

    if (!id) {
      return res.status(400).json({ error: "Id inválido." });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Error eliminando cita:", e);

    return res.status(500).json({
      error: "Error eliminando cita.",
      detail: e?.message || "Unknown error",
    });
  }
}