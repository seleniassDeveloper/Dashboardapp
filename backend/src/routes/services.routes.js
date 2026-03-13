import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

// GET /api/services
router.get("/", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    res.json(services);
  } catch (error) {
    console.error("Error obteniendo services:", error);
    res.status(500).json({ error: "Error obteniendo services" });
  }
});

// POST /api/services
router.post("/", async (req, res) => {
  try {
    const { name, price, duration } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio." });
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        price: Number(price),
        duration: Number(duration),
        isActive: true,
      },
    });

    res.status(201).json(service);
  } catch (error) {
    console.error("Error creando service:", error);
    res.status(500).json({ error: "Error creando servicio." });
  }
});

export default router;
