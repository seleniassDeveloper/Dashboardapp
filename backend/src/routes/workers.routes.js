import { Router } from "express";
import prisma from "../prisma.js";
import { normalizeWorker, saveWorkerRelations } from "../utils/normalizeWorker.js";

const router = Router();

const workerInclude = {
  services: { include: { service: true } },
  schedules: true,
};

// GET /api/workers
router.get("/", async (_req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      include: workerInclude,
    });
    res.json(workers.map(normalizeWorker));
  } catch (error) {
    console.error("Error obteniendo workers:", error);
    res.status(500).json({ error: "Error obteniendo workers." });
  }
});

// GET /api/workers/:id
router.get("/:id", async (req, res) => {
  try {
    const w = await prisma.worker.findUnique({
      where: { id: req.params.id },
      include: workerInclude,
    });
    if (!w) return res.status(404).json({ error: "Trabajador no encontrado." });
    res.json(normalizeWorker(w));
  } catch (error) {
    console.error("Error obteniendo worker:", error);
    res.status(500).json({ error: "Error obteniendo trabajador." });
  }
});

// POST /api/workers
router.post("/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      roleTitle,
      customFields,
      serviceIds = [],
      schedules = [],
      servicePricing = {},
    } = req.body;

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
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        roleTitle: roleTitle?.trim() || null,
        customFields: customFields && typeof customFields === "object" ? customFields : {},
      },
    });

    await saveWorkerRelations(prisma, worker.id, { serviceIds, schedules, servicePricing });

    const fullWorker = await prisma.worker.findUnique({
      where: { id: worker.id },
      include: workerInclude,
    });

    res.status(201).json(normalizeWorker(fullWorker));
  } catch (error) {
    console.error("Error creando worker:", error);
    res.status(500).json({ error: "Error creando trabajador." });
  }
});

// PUT /api/workers/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      roleTitle,
      customFields,
      serviceIds = [],
      schedules = [],
      servicePricing = {},
    } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "Nombre y apellido son obligatorios." });
    }

    await prisma.worker.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        roleTitle: roleTitle?.trim() || null,
        customFields: customFields && typeof customFields === "object" ? customFields : {},
      },
    });

    await saveWorkerRelations(prisma, id, { serviceIds, schedules, servicePricing });

    const fullWorker = await prisma.worker.findUnique({
      where: { id },
      include: workerInclude,
    });

    res.json(normalizeWorker(fullWorker));
  } catch (error) {
    console.error("Error actualizando worker:", error);
    res.status(500).json({ error: "Error actualizando trabajador." });
  }
});

export default router;
