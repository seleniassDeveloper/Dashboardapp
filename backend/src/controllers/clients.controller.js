import prisma from "../prisma.js";
import { encryptData, decryptData } from "../utils/consentCrypto.js";
import { saveBase64Image } from "./appointments.controller.js";

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
    const { firstName, lastName, phone, email, notes, allergies, medicalNotes, photoUrl, marketingConsent } = req.body;
    const businessId = req.businessId;

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
        photoUrl: photoUrl || null,
        allergies: allergies ? encryptData(allergies) : null,
        medicalNotes: medicalNotes ? encryptData(medicalNotes) : null,
        businessId: businessId || null,
        marketingConsent: marketingConsent === true || marketingConsent === "true",
      },
    });

    created.allergies = allergies || null;
    created.medicalNotes = medicalNotes || null;

    return res.status(201).json(created);
  } catch (e) {
    console.error("[clients] create:", e?.message || e);
    return res.status(500).json({ error: "Error creando cliente." });
  }
}

/* =========================
   UPDATE CLIENT
========================= */
export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, notes, allergies, medicalNotes, photoUrl, marketingConsent } = req.body;

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
        photoUrl: photoUrl !== undefined ? photoUrl : undefined,
        allergies: allergies ? encryptData(allergies) : null,
        medicalNotes: medicalNotes ? encryptData(medicalNotes) : null,
        marketingConsent: marketingConsent !== undefined ? (marketingConsent === true || marketingConsent === "true") : undefined,
      },
    });

    updated.allergies = allergies || null;
    updated.medicalNotes = medicalNotes || null;

    return res.json(updated);
  } catch (e) {
    console.error("[clients] update:", e?.message || e);
    return res.status(500).json({ error: "Error actualizando cliente." });
  }
}

/* =========================
   LIST CLIENTS
========================= */
export async function listClients(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const businessId = req.businessId;

    const where = {
      isActive: true,
      ...(businessId ? { OR: [{ businessId }, { businessId: null }] } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {})
    };

    const clients = await prisma.client.findMany({ where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 50,
    });

    // Decrypt allergies and medicalNotes on output
    const decryptedClients = clients.map(c => ({
      ...c,
      allergies: decryptData(c.allergies),
      medicalNotes: decryptData(c.medicalNotes)
    }));

    return res.json(decryptedClients);
  } catch (e) {
    console.error("[clients] list:", e?.message || e);
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
    console.error("[clients] delete:", e?.message || e);
    return res.status(500).json({ error: "Error eliminando cliente." });
  }
}

/* =========================
   CLIENT APPOINTMENTS HISTORY
========================= */
export async function getClientAppointments(req, res) {
  try {
    const { id } = req.params;

    const appts = await prisma.appointment.findMany({ where: { businessId: req.businessId,  clientId: id },
      orderBy: { startsAt: "desc" },
      include: {
        service: true,
        worker: true,
      },
    });

    return res.json(appts);
  } catch (e) {
    console.error("[clients] getClientAppointments:", e?.message || e);
    return res
      .status(500)
      .json({ error: "Error cargando historial de citas." });
  }
}

/* =========================
   CLINICAL HISTORY CRUD
========================= */

// GET /api/clients/:id/clinical-history
export async function getClientClinicalHistory(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.businessId;

    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio no especificado." });
    }

    // Validar relación de cliente con el negocio (auto-curar si no tiene asignado)
    const client = await prisma.client.findFirst({ where: { businessId: req.businessId, 
        id,
        OR: [
          { businessId },
          { businessId: null }
        ]
      }
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado o no pertenece a este negocio." });
    }

    if (!client.businessId) {
      await prisma.client.update({
        where: { id },
        data: { businessId }
      });
    }

    const history = await prisma.clinicalHistory.findMany({ where: { businessId: req.businessId, 
        clientId: id,
        businessId
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        appointment: {
          include: {
            service: true,
            worker: true
          }
        }
      }
    });

    return res.json(history);
  } catch (e) {
    console.error("[clients] getClientClinicalHistory:", e?.message || e);
    return res.status(500).json({ error: "Error obteniendo el historial clínico del cliente." });
  }
}

// POST /api/clients/:id/clinical-history
export async function createClientClinicalHistory(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.businessId;
    const { appointmentId, type, title, notes, formulaData, clinicalData } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio no especificado." });
    }

    if (!title || !type) {
      return res.status(400).json({ error: "El título y el tipo de entrada son obligatorios." });
    }

    // Validar relación de cliente con el negocio (auto-curar si no tiene asignado)
    const client = await prisma.client.findFirst({ where: { businessId: req.businessId, 
        id,
        OR: [
          { businessId },
          { businessId: null }
        ]
      }
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado o no pertenece a este negocio." });
    }

    if (!client.businessId) {
      await prisma.client.update({
        where: { id },
        data: { businessId }
      });
    }

    // Quien lo crea
    const createdBy = req.user?.name || req.user?.email || req.user?.uid || "Profesional";

    const created = await prisma.clinicalHistory.create({
      data: {
        businessId,
        clientId: id,
        appointmentId: appointmentId || null,
        type,
        title,
        notes: notes || "",
        formulaData: formulaData || null,
        clinicalData: clinicalData || null,
        createdBy
      },
      include: {
        appointment: {
          include: {
            service: true,
            worker: true
          }
        }
      }
    });

    return res.status(201).json(created);
  } catch (e) {
    console.error("[clients] createClientClinicalHistory:", e?.message || e);
    return res.status(500).json({ error: "Error creando la entrada en el historial clínico." });
  }
}

// PUT /api/clients/:id/clinical-history/:entryId
export async function updateClientClinicalHistory(req, res) {
  try {
    const { id, entryId } = req.params;
    const businessId = req.businessId;
    const { appointmentId, type, title, notes, formulaData, clinicalData } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio no especificado." });
    }

    // Validar relación de cliente con el negocio
    const client = await prisma.client.findFirst({ where: { businessId: req.businessId, 
        id,
        OR: [
          { businessId },
          { businessId: null }
        ]
      }
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado o no pertenece a este negocio." });
    }

    // Validar que la entrada clínica exista y pertenezca al cliente y negocio
    const entry = await prisma.clinicalHistory.findFirst({ where: { businessId: req.businessId, 
        id: entryId,
        clientId: id,
        businessId
      }
    });

    if (!entry) {
      return res.status(404).json({ error: "Entrada del historial clínico no encontrada." });
    }

    const updatedBy = req.user?.name || req.user?.email || req.user?.uid || "Profesional";

    const updated = await prisma.clinicalHistory.update({
      where: { id: entryId },
      data: {
        appointmentId: appointmentId !== undefined ? appointmentId : entry.appointmentId,
        type: type !== undefined ? type : entry.type,
        title: title !== undefined ? title : entry.title,
        notes: notes !== undefined ? notes : entry.notes,
        formulaData: formulaData !== undefined ? formulaData : entry.formulaData,
        clinicalData: clinicalData !== undefined ? clinicalData : entry.clinicalData,
        updatedBy
      },
      include: {
        appointment: {
          include: {
            service: true,
            worker: true
          }
        }
      }
    });

    return res.json(updated);
  } catch (e) {
    console.error("[clients] updateClientClinicalHistory:", e?.message || e);
    return res.status(500).json({ error: "Error actualizando la entrada en el historial clínico." });
  }
}

// DELETE /api/clients/:id/clinical-history/:entryId
export async function deleteClientClinicalHistory(req, res) {
  try {
    const { id, entryId } = req.params;
    const businessId = req.businessId;

    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio no especificado." });
    }

    // Validar que la entrada clínica exista y pertenezca al cliente y negocio
    const entry = await prisma.clinicalHistory.findFirst({ where: { businessId: req.businessId, 
        id: entryId,
        clientId: id,
        businessId
      }
    });

    if (!entry) {
      return res.status(404).json({ error: "Entrada del historial clínico no encontrada." });
    }

    await prisma.clinicalHistory.delete({
      where: { id: entryId }
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[clients] deleteClientClinicalHistory:", e?.message || e);
    return res.status(500).json({ error: "Error eliminando la entrada del historial clínico." });
  }
}

/* =========================
   UPLOAD CLIENT PHOTO
========================= */
export async function uploadClientPhoto(req, res) {
  try {
    const { id } = req.params;
    const { photo } = req.body; // base64 string
    const businessId = req.businessId;

    if (!photo) {
      return res.status(400).json({ error: "La foto en base64 es obligatoria." });
    }

    const client = await prisma.client.findFirst({ where: { businessId: req.businessId, 
        id,
        OR: [
          { businessId },
          { businessId: null }
        ]
      }
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado o no pertenece a este negocio." });
    }

    // Guardar imagen base64 localmente
    const savedPath = saveBase64Image(photo, "client_avatar", id);
    if (!savedPath) {
      return res.status(400).json({ error: "El formato de la imagen no es válido." });
    }

    // Actualizar DB
    const updated = await prisma.client.update({
      where: { id },
      data: { photoUrl: savedPath }
    });

    return res.json({ photoUrl: savedPath, client: updated });
  } catch (e) {
    console.error("[clients] uploadClientPhoto:", e?.message || e);
    return res.status(500).json({ error: "Error subiendo la foto de perfil del cliente." });
  }
}
