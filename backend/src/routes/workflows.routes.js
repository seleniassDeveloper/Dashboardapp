import { Router } from "express";
import prisma from "../prisma.js";
import { ensureBusinessModels, normalizeWorkflow } from "../services/businessModelsSeed.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

// GET /api/workflows
router.get("/", requirePermission("workflows.view"), async (req, res) => {
  try {
    await ensureBusinessModels();
    const { businessModelId, status } = req.query;
    const where = { businessId: req.businessId };
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
router.get("/stats/summary", requirePermission("workflows.view"), async (_req, res) => {
  try {
    const [totalRuns, activeCount, total] = await Promise.all([
      prisma.workflow.aggregate({ _sum: { runCount: true }, where: { businessId: req.businessId } }),
      prisma.workflow.count({ where: { status: "ACTIVE", businessId: req.businessId } }),
      prisma.workflow.count({ where: { businessId: req.businessId } }),
    ]);
    res.json({
      totalWorkflows: total,
      activeWorkflows: activeCount,
      totalRuns: totalRuns._sum.runCount || 0,
    });
  } catch (e) {
    res.status(500).json({ error: "Error obtaining statistics." });
  }
});

// POST /api/workflows/from-template
router.post("/from-template", requirePermission("workflows.create"), async (req, res) => {
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
        businessId: req.businessId,
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
router.post("/", requirePermission("workflows.create"), async (req, res) => {
  try {
    const { name, description, businessModelId, trigger, steps, transitions, screens, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nombre obligatorio." });
    if (!trigger?.type) return res.status(400).json({ error: "Disparador obligatorio." });
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: "Agregá al menos una acción." });
    }

    // Resolve model if supplied
    let actualModelId = businessModelId || null;
    if (!actualModelId) {
      const firstModel = await prisma.businessModel.findFirst();
      actualModelId = firstModel?.id || null;
    }

    const row = await prisma.workflow.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || "DRAFT",
        businessId: req.businessId,
        businessModelId: actualModelId,
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
router.put("/:id", requirePermission("workflows.edit"), async (req, res) => {
  try {
    const { name, description, trigger, steps, transitions, screens, status, businessModelId } = req.body;
    const existing = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: { businessModel: true },
    });
    if (!existing) return res.status(404).json({ error: "Workflow no encontrado." });

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
router.patch("/:id/status", requirePermission("workflows.edit"), async (req, res) => {
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

// GET /api/workflows/executions - Retrieve automation logs history
router.get("/executions", requirePermission("workflows.logs.view"), async (req, res) => {
  try {
    const list = await prisma.workflowExecution.findMany({
      where: { businessId: req.businessId },
      include: { workflow: true, logs: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo ejecuciones de automatización." });
  }
});

// POST /api/workflows/executions - Register dynamic execution logs
router.post("/executions", requirePermission("workflows.run"), async (req, res) => {
  try {
    const { workflowId, status, triggerType, runTimeMs, logs } = req.body;
    if (!workflowId || !status || !triggerType) {
      return res.status(400).json({ error: "Campos requeridos: workflowId, status, triggerType." });
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        businessId: req.businessId,
        workflowId,
        status,
        triggerType,
        runTimeMs: Number(runTimeMs || 0),
        logs: {
          create: Array.isArray(logs) ? logs.map(l => ({
            nodeName: l.nodeName,
            nodeType: l.nodeType,
            status: l.status || "SUCCESS",
            result: l.result || null,
            error: l.error || null
          })) : []
        }
      },
      include: { logs: true }
    });

    // Update workflow run count
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { 
        runCount: { increment: 1 },
        lastRunAt: new Date()
      }
    });

    res.status(201).json(execution);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error guardando log de ejecución de workflow." });
  }
});

// DELETE /api/workflows/:id
router.delete("/:id", requirePermission("workflows.delete"), async (req, res) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando workflow." });
  }
});

export default router;
