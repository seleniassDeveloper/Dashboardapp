// src/controllers/appointments.controller.js
import prisma from "../prisma.js";

export async function getAppointments(req, res) {
  try {
    const data = await prisma.appointment.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        client: true,
        service: true,
        worker: true, // ✅ ESTO FALTABA
      },
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

    const appt = await prisma.appointment.create({
      data: {
        clientId,
        serviceId,
        workerId,
        workerFirstName: workerFirstName || null,
        workerLastName: workerLastName || null,
        startsAt: new Date(startsAt),
        notes: notes || null,
        status: status || "PENDING",
      },
      include: {
        client: true,
        service: true,
        worker: true,
      },
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

    const appt = await prisma.appointment.update({
      where: { id },
      data: {
        clientId,
        serviceId,
        workerId,
        workerFirstName: workerFirstName ?? null,
        workerLastName: workerLastName ?? null,
        startsAt: new Date(startsAt),
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