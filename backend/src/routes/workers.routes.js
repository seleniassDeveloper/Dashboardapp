import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/workers
 */
router.get("/workers", async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
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
    console.error(error);
    res.status(500).json({ error: "Error obteniendo trabajadores" });
  }
});

/**
 * POST /api/workers
 */
router.post("/workers", async (req, res) => {
  try {
    const { firstName, lastName, schedules, serviceIds } = req.body;

    const worker = await prisma.worker.create({
      data: {
        firstName,
        lastName,
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
        services: true,
      },
    });

    res.status(201).json(worker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando trabajador" });
  }
});

export default router;