import prisma from "../prisma.js";

/* =========================
   VALIDADORES DE FORMATO
========================= */
// Email simple pero efectivo: algo@algo.dominio
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_RE.test(email);
}

// Teléfono: permite +, espacios, guiones, paréntesis y puntos.
// Requiere entre 7 y 15 dígitos (estándar E.164).
function isValidPhone(phone) {
  if (!/^[+0-9()\-.\s]+$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

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

    const emailVal = (email?.trim() && email.trim() !== "—") ? email.trim() : null;
    const phoneVal = (phone?.trim() && phone.trim() !== "—") ? phone.trim() : null;
    const notesVal = (notes?.trim() && notes.trim() !== "—") ? notes.trim() : null;

    if (emailVal && !isValidEmail(emailVal)) {
      return res.status(400).json({ error: "El email no tiene un formato válido." });
    }

    if (phoneVal && !isValidPhone(phoneVal)) {
      return res.status(400).json({ error: "El teléfono no tiene un formato válido." });
    }

    const created = await prisma.client.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phoneVal,
        email: emailVal,
        notes: notesVal,
      },
    });

    return res.status(201).json(created);
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

    const emailVal = (email?.trim() && email.trim() !== "—") ? email.trim() : null;
    const phoneVal = (phone?.trim() && phone.trim() !== "—") ? phone.trim() : null;
    const notesVal = (notes?.trim() && notes.trim() !== "—") ? notes.trim() : null;

    if (emailVal && !isValidEmail(emailVal)) {
      return res.status(400).json({ error: "El email no tiene un formato válido." });
    }

    if (phoneVal && !isValidPhone(phoneVal)) {
      return res.status(400).json({ error: "El teléfono no tiene un formato válido." });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phoneVal,
        email: emailVal,
        notes: notesVal,
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

    // Primero eliminamos en cascada las citas para evitar bloqueos de clave foránea
    await prisma.appointment.deleteMany({
      where: { clientId: id },
    });

    // Luego eliminamos el cliente
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
