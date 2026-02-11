// src/controllers/appointments.controller.js
import prisma from "../prisma.js";

export async function getAppointments(req, res) {
  try {
    const data = await prisma.appointment.findMany({
      orderBy: { startsAt: "asc" },
      include: { client: true, service: true },
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo citas" });
  }
}

export async function createAppointment(req, res) {
  try {
    const { clientId, serviceId, startsAt, notes } = req.body;

    if (!clientId || !serviceId || !startsAt) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: clientId, serviceId, startsAt",
      });
    }

    const created = await prisma.appointment.create({
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        startsAt: new Date(startsAt),
        notes: notes ?? null,
      },
      include: { client: true, service: true },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error("createAppointment ERROR:", e);
    res.status(500).json({ error: "Error creando cita" });
  }
}

export async function updateAppointment(req, res) {
  try {
    const id = String(req.params.id || "");
    const { clientId, serviceId, startsAt, notes, status } = req.body;

    if (!id) return res.status(400).json({ error: "id inválido" });

    if (!clientId || !serviceId || !startsAt) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: clientId, serviceId, startsAt",
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        startsAt: new Date(startsAt),
        notes: notes ?? null,
        status: status ?? undefined,
      },
      include: { client: true, service: true },
    });

    res.json(updated);
  } catch (e) {
    console.error("updateAppointment ERROR:", e);
    res.status(500).json({ error: "Error actualizando cita" });
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