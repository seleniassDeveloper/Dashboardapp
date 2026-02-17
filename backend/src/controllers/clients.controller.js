import prisma from "../prisma.js";

/* =========================
   CREATE CLIENT
========================= */
export async function createClient(req, res) {
  try {
    const { firstName, lastName, phone, email, notes } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res
        .status(400)
        .json({ error: "firstName y lastName son obligatorios." });
    }

    const created = await prisma.client.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return res.json(created);
  } catch (e) {
    console.error("CREATE CLIENT ERROR:", e);
    return res.status(500).json({ error: "Error creando cliente." });
  }
}

/* =========================
   UPDATE CLIENT
========================= */
export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, notes } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res
        .status(400)
        .json({ error: "firstName y lastName son obligatorios." });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return res.json(updated);
  } catch (e) {
    console.error("UPDATE CLIENT ERROR:", e);
    return res.status(500).json({ error: "Error actualizando cliente." });
  }
}

/* =========================
   LIST CLIENTS
========================= */
export async function listClients(req, res) {
  try {
    const search = String(req.query.search || "").trim();

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const clients = await prisma.client.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 50,
    });

    return res.json(clients);
  } catch (e) {
    console.error("LIST CLIENTS ERROR:", e);
    return res.status(500).json({
      error: "Error listando clientes.",
      detail: e?.message,
    });
  }
}

/* =========================
   DELETE CLIENT
========================= */
export async function deleteClient(req, res) {
  try {
    const { id } = req.params;

    const apptCount = await prisma.appointment.count({
      where: { clientId: id },
    });

    if (apptCount > 0) {
      return res.status(400).json({
        error:
          "No se puede eliminar: el cliente tiene citas. Elimina sus citas primero.",
      });
    }

    await prisma.client.delete({ where: { id } });

    return res.json({ ok: true });
  } catch (e) {
    console.error("DELETE CLIENT ERROR:", e);
    return res.status(500).json({ error: "Error eliminando cliente." });
  }
}

/* =========================
   CLIENT APPOINTMENTS HISTORY
========================= */
export async function getClientAppointments(req, res) {
  try {
    const { id } = req.params;

    const appts = await prisma.appointment.findMany({
      where: { clientId: id },
      orderBy: { startsAt: "desc" },
      include: {
        service: true,
        worker: true,
      },
    });

    return res.json(appts);
  } catch (e) {
    console.error("CLIENT APPOINTMENTS ERROR:", e);
    return res
      .status(500)
      .json({ error: "Error cargando historial de citas." });
  }
}
