import prisma from "../prisma.js";

export async function getServices(req, res) {
  try {
    const data = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo servicios" });
  }
}

export async function createService(req, res) {
  try {
    const { name, price, duration, isActive } = req.body;

    if (!name || price == null || duration == null) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: name, price, duration",
      });
    }

    const created = await prisma.service.create({
      data: {
        name: String(name).trim(),
        price: Number(price),
        duration: Number(duration),
        isActive: isActive ?? true,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando servicio" });
  }
}
