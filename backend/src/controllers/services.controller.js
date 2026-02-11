import prisma from "../prisma.js";

export async function getServices(req, res) {
  try {
    const data = await prisma.service.findMany({ orderBy: { name: "asc" } });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo servicios" });
  }
}

export async function createService(req, res) {
  try {
    const { name, price, duration, isActive } = req.body;

    if (!name) return res.status(400).json({ error: "name es obligatorio" });

    const created = await prisma.service.create({
      data: {
        name: String(name),
        price: Number(price) || 0,
        duration: Number(duration) || 30,
        isActive: isActive ?? true,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando servicio" });
  }
}
