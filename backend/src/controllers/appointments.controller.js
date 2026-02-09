import prisma from "../prisma.js";

export async function getAppointments(req, res) {
  try {
    const data = await prisma.appointment.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        client: true,
        service: true,
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
    const { clientId, serviceId, startsAt, notes } = req.body;

    const missing = [];
    if (!clientId) missing.push("clientId");
    if (!serviceId) missing.push("serviceId");
    if (!startsAt) missing.push("startsAt");

    if (missing.length) {
      return res.status(400).json({
        error: `Faltan campos obligatorios: ${missing.join(", ")}`,
      });
    }

    const created = await prisma.appointment.create({
      data: {
        clientId,
        serviceId,
        startsAt: new Date(startsAt),
        notes: notes ? String(notes).trim() : null,
      },
      include: { client: true, service: true },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando cita" });
  }
}
