import { Router } from "express";
import prisma from "../prisma.js";
import { DEFAULT_BUSINESS_MODELS } from "../config/defaultBusinessModels.js";
import { ensureBusinessModels, normalizeBusinessModel } from "../services/businessModelsSeed.js";

const router = Router();

// GET /api/business-models
router.get("/", async (_req, res) => {
  try {
    await ensureBusinessModels();
    const rows = await prisma.businessModel.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { workflows: true } } },
    });
    res.json(rows.map(normalizeBusinessModel));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo modelos de negocio." });
  }
});

// POST /api/business-models — modelo personalizado
router.post("/", async (req, res) => {
  try {
    const { name, description, icon, allowedTriggers, allowedActions } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nombre obligatorio." });

    const slug = `custom-${Date.now()}`;
    const row = await prisma.businessModel.create({
      data: {
        slug,
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || "settings",
        allowedTriggers: allowedTriggers?.length ? allowedTriggers : DEFAULT_BUSINESS_MODELS.find((m) => m.slug === "custom").allowedTriggers,
        allowedActions: allowedActions?.length ? allowedActions : DEFAULT_BUSINESS_MODELS.find((m) => m.slug === "custom").allowedActions,
        templateWorkflows: [],
      },
      include: { _count: { select: { workflows: true } } },
    });
    res.status(201).json(normalizeBusinessModel(row));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando modelo de negocio." });
  }
});

// PUT /api/business-models/:id
router.put("/:id", async (req, res) => {
  try {
    const { name, description, allowedTriggers, allowedActions } = req.body;
    const row = await prisma.businessModel.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        allowedTriggers: allowedTriggers || undefined,
        allowedActions: allowedActions || undefined,
      },
      include: { _count: { select: { workflows: true } } },
    });
    res.json(normalizeBusinessModel(row));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando modelo." });
  }
});

export default router;
