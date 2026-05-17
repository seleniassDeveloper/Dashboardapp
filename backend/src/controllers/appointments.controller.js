import prisma from "../prisma.js";
import {
  validateAppointmentSlot,
  findAvailableWorkers,
} from "../services/appointmentAvailability.js";

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

export async function checkAppointmentAvailability(req, res) {
  try {
    const { workerId, serviceId, startsAt, excludeId } = req.query;

    if (!workerId || !serviceId || !startsAt) {
      return res.status(400).json({
        error: "Parámetros requeridos: workerId, serviceId, startsAt.",
      });
    }

    const result = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
      excludeAppointmentId: excludeId || null,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    return res.status(500).json({
      error: "Error verificando disponibilidad.",
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

    const client = await prisma.client.findUnique({
      where: { id: String(clientId) },
      select: { id: true },
    });

    if (!client) {
      return res.status(400).json({ error: "Cliente inválido." });
    }

    const slot = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
    });

    if (!slot.available) {
      return res.status(409).json({
        error: slot.reason || "El profesional no está disponible en ese horario.",
        conflict: slot.conflict || null,
        availableWorkers: slot.availableWorkers || [],
      });
    }

    const appt = await prisma.appointment.create({
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        workerId: String(workerId),
        startsAt: new Date(startsAt),
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

    const client = await prisma.client.findUnique({
      where: { id: String(clientId) },
      select: { id: true },
    });

    if (!client) {
      return res.status(400).json({ error: "Cliente inválido." });
    }

    const slot = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
      excludeAppointmentId: id,
    });

    if (!slot.available) {
      return res.status(409).json({
        error: slot.reason || "El profesional no está disponible en ese horario.",
        conflict: slot.conflict || null,
        availableWorkers: slot.availableWorkers || [],
      });
    }

    const appt = await prisma.appointment.update({
      where: { id: String(id) },
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        workerId: String(workerId),
        startsAt: new Date(startsAt),
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
