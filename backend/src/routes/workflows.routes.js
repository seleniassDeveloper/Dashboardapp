import { Router } from "express";
import prisma from "../prisma.js";
import { ensureBusinessModels, normalizeWorkflow } from "../services/businessModelsSeed.js";

const router = Router();

// GET /api/workflows
router.get("/", async (req, res) => {
  try {
    await ensureBusinessModels();
    const { businessModelId, status } = req.query;
    const where = {};
    if (businessModelId) where.businessModelId = String(businessModelId);
    if (status) where.status = String(status);

    const rows = await prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { businessModel: true },
    });
    res.json(rows.map(normalizeWorkflow));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo workflows." });
  }
});

// GET /api/workflows/stats
router.get("/stats/summary", async (_req, res) => {
  try {
    const [totalRuns, activeCount, total] = await Promise.all([
      prisma.workflow.aggregate({ _sum: { runCount: true } }),
      prisma.workflow.count({ where: { status: "ACTIVE" } }),
      prisma.workflow.count(),
    ]);
    res.json({
      totalWorkflows: total,
      activeWorkflows: activeCount,
      totalRuns: totalRuns._sum.runCount || 0,
    });
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo estadísticas." });
  }
});

// POST /api/workflows/from-template
router.post("/from-template", async (req, res) => {
  try {
    const { businessModelId, templateIndex } = req.body;
    const model = await prisma.businessModel.findUnique({ where: { id: businessModelId } });
    if (!model) return res.status(404).json({ error: "Modelo no encontrado." });

    const templates = model.templateWorkflows || [];
    const tpl = templates[Number(templateIndex)];
    if (!tpl) return res.status(400).json({ error: "Plantilla inválida." });

    const row = await prisma.workflow.create({
      data: {
        name: tpl.name,
        description: tpl.description || null,
        status: "DRAFT",
        businessModelId: model.id,
        trigger: tpl.trigger,
        steps: tpl.steps || [],
      },
      include: { businessModel: true },
    });
    res.status(201).json(normalizeWorkflow(row));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando desde plantilla." });
  }
});

// POST /api/workflows
router.post("/", async (req, res) => {
  try {
    const { name, description, businessModelId, trigger, steps, transitions, screens, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nombre obligatorio." });
    if (!businessModelId) return res.status(400).json({ error: "Modelo de negocio obligatorio." });
    if (!trigger?.type) return res.status(400).json({ error: "Disparador obligatorio." });
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: "Agregá al menos una acción." });
    }

    const model = await prisma.businessModel.findUnique({ where: { id: String(businessModelId) } });
    if (!model) return res.status(400).json({ error: "Modelo de negocio inválido." });

    const allowedT = model.allowedTriggers || [];
    const allowedA = model.allowedActions || [];
    if (!allowedT.includes(trigger.type)) {
      return res.status(400).json({ error: "Disparador no permitido para este modelo." });
    }
    for (const step of steps) {
      if (!allowedA.includes(step.type)) {
        return res.status(400).json({ error: `Acción no permitida: ${step.type}` });
      }
    }

    const row = await prisma.workflow.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || "DRAFT",
        businessModelId: String(businessModelId),
        trigger,
        steps: steps.map((s, i) => ({ ...s, id: s.id || `step_${i + 1}` })),
        transitions: Array.isArray(transitions) ? transitions : [],
        screens: Array.isArray(screens) ? screens : [],
      },
      include: { businessModel: true },
    });
    res.status(201).json(normalizeWorkflow(row));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando workflow." });
  }
});

// PUT /api/workflows/:id
router.put("/:id", async (req, res) => {
  try {
    const { name, description, trigger, steps, transitions, screens, status, businessModelId } = req.body;
    const existing = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: { businessModel: true },
    });
    if (!existing) return res.status(404).json({ error: "Workflow no encontrado." });

    const modelId = businessModelId || existing.businessModelId;
    const model =
      modelId === existing.businessModelId
        ? existing.businessModel
        : await prisma.businessModel.findUnique({ where: { id: modelId } });

    if (trigger?.type && model) {
      if (!(model.allowedTriggers || []).includes(trigger.type)) {
        return res.status(400).json({ error: "Disparador no permitido." });
      }
    }
    if (steps?.length && model) {
      for (const step of steps) {
        if (!(model.allowedActions || []).includes(step.type)) {
          return res.status(400).json({ error: `Acción no permitida: ${step.type}` });
        }
      }
    }

    const row = await prisma.workflow.update({
      where: { id: req.params.id },
      data: {
        name: name?.trim() || undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        status: status || undefined,
        businessModelId: businessModelId || undefined,
        trigger: trigger || undefined,
        steps: steps ? steps.map((s, i) => ({ ...s, id: s.id || `step_${i + 1}` })) : undefined,
        transitions: transitions !== undefined ? transitions : undefined,
        screens: screens !== undefined ? screens : undefined,
      },
      include: { businessModel: true },
    });
    res.json(normalizeWorkflow(row));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error actualizando workflow." });
  }
});

// PATCH /api/workflows/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["ACTIVE", "PAUSED", "DRAFT"].includes(status)) {
      return res.status(400).json({ error: "Estado inválido." });
    }
    const row = await prisma.workflow.update({
      where: { id: req.params.id },
      data: { status },
      include: { businessModel: true },
    });
    res.json(normalizeWorkflow(row));
  } catch (e) {
    res.status(500).json({ error: "Error cambiando estado." });
  }
});

// DELETE /api/workflows/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando workflow." });
  }
});

export default router;
