import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

/**
 * =========================
 * GET /api/workers
 * =========================
 */
router.get("/workers", async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        schedules: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    res.json(workers);
  } catch (error) {
    console.error("GET WORKERS ERROR:", error);
    res.status(500).json({ error: "Error obteniendo trabajadores" });
  }
});

/**
 * =========================
 * POST /api/workers
 * =========================
 */
router.post("/workers", async (req, res) => {
  try {
    const { firstName, lastName, schedules = [], serviceIds = [] } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res
        .status(400)
        .json({ error: "firstName y lastName son obligatorios." });
    }

    const worker = await prisma.worker.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        schedules: {
          create: schedules,
        },
        services: {
          create: serviceIds.map((id) => ({
            serviceId: id,
          })),
        },
      },
      include: {
        schedules: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    res.status(201).json(worker);
  } catch (error) {
    console.error("CREATE WORKER ERROR:", error);
    res.status(500).json({ error: "Error creando trabajador" });
  }
});

export default router;