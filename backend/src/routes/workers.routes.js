import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

// GET /api/workers
router.get("/", async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      include: {
        services: {
          include: {
            service: true,
          },
        },
        schedules: true,
      },
    });

    const normalized = workers.map((w) => ({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      serviceIds: (w.services || []).map((ws) => String(ws.serviceId)),
      schedules: w.schedules || [],
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    res.json(normalized);
  } catch (error) {
    console.error("Error obteniendo workers:", error);
    res.status(500).json({ error: "Error obteniendo workers" });
  }
});

// POST /api/workers
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, serviceIds = [], schedules = [] } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "Nombre y apellido son obligatorios." });
    }

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: "Debes seleccionar al menos un servicio." });
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: "Debes dejar al menos un día activo." });
    }

    const worker = await prisma.worker.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    await prisma.workerService.createMany({
      data: serviceIds.map((serviceId) => ({
        workerId: worker.id,
        serviceId: String(serviceId),
      })),
      skipDuplicates: true,
    });

    await prisma.workerSchedule.createMany({
      data: schedules.map((s) => ({
        workerId: worker.id,
        dayOfWeek: Number(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });

    const fullWorker = await prisma.worker.findUnique({
      where: { id: worker.id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        schedules: true,
      },
    });

    res.status(201).json({
      id: fullWorker.id,
      firstName: fullWorker.firstName,
      lastName: fullWorker.lastName,
      serviceIds: (fullWorker.services || []).map((ws) => String(ws.serviceId)),
      schedules: fullWorker.schedules || [],
    });
  } catch (error) {
    console.error("Error creando worker:", error);
    res.status(500).json({ error: "Error creando trabajador." });
  }
});

// PUT /api/workers/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, serviceIds = [], schedules = [] } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "Nombre y apellido son obligatorios." });
    }

    await prisma.worker.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    await prisma.workerService.deleteMany({
      where: { workerId: id },
    });

    await prisma.workerSchedule.deleteMany({
      where: { workerId: id },
    });

    if (serviceIds.length > 0) {
      await prisma.workerService.createMany({
        data: serviceIds.map((serviceId) => ({
          workerId: id,
          serviceId: String(serviceId),
        })),
        skipDuplicates: true,
      });
    }

    if (schedules.length > 0) {
      await prisma.workerSchedule.createMany({
        data: schedules.map((s) => ({
          workerId: id,
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }

    const fullWorker = await prisma.worker.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        schedules: true,
      },
    });

    res.json({
      id: fullWorker.id,
      firstName: fullWorker.firstName,
      lastName: fullWorker.lastName,
      serviceIds: (fullWorker.services || []).map((ws) => String(ws.serviceId)),
      schedules: fullWorker.schedules || [],
    });
  } catch (error) {
    console.error("Error actualizando worker:", error);
    res.status(500).json({ error: "Error actualizando trabajador." });
  }
});

export default router;
