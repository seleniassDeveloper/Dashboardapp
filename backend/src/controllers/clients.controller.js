import prisma from "../prisma.js";

export async function getClients(req, res) {
  try {
    const data = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo clientes" });
  }
}

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
        notes: notes ? String(notes).trim() : null,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando cliente" });
  }
}
