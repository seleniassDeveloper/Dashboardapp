// src/controllers/clients.controller.js
import prisma from "../prisma.js";

export async function createClient(req, res) {
  try {
    const { fullName, email, phone, notes } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: "fullName es obligatorio" });
    }

    const created = await prisma.client.create({
      data: {
        fullName: String(fullName).trim(),
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        notes: notes ?? null,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error("createClient ERROR:", e);
    res.status(500).json({ error: "Error creando cliente" });
  }
}

export async function updateClient(req, res) {
  try {
    const id = String(req.params.id || "");
    const { fullName, email, phone, notes } = req.body;

    if (!id) return res.status(400).json({ error: "id inválido" });
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: "fullName es obligatorio" });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        fullName: String(fullName).trim(),
        email: email ? String(email).trim() : null,
        phone: phone ? String(phone).trim() : null,
        notes: notes ?? undefined,
      },
    });

    res.json(updated);
  } catch (e) {
    console.error("updateClient ERROR:", e);
    res.status(500).json({ error: "Error actualizando cliente" });
  }
}