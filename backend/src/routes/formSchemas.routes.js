import { Router } from "express";
import prisma from "../prisma.js";
import {
  ensureFormSchemas,
  normalizeFormSchema,
  resolveComponentFields,
  getRegistryFields,
} from "../services/formSchemaService.js";
import { resolveFieldsFromRegistry } from "../config/defaultFormSchemas.js";

const router = Router();

// GET /api/form-schemas/resolve/:componentKey — campos listos para un componente
router.get("/resolve/:componentKey", async (req, res) => {
  try {
    const result = await resolveComponentFields(req.params.componentKey);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error resolviendo campos." });
  }
});

// GET /api/form-schemas
router.get("/", async (_req, res) => {
  try {
    await ensureFormSchemas();
    const rows = await prisma.formSchema.findMany({ orderBy: { key: "asc" } });
    res.json(rows.map(normalizeFormSchema));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo esquemas." });
  }
});

// GET /api/form-schemas/:key
router.get("/:key", async (req, res) => {
  try {
    if (req.params.key === "resolve") return res.status(404).json({ error: "Usá /resolve/:componentKey" });
    await ensureFormSchemas();
    const row = await prisma.formSchema.findUnique({ where: { key: req.params.key } });
    if (!row) return res.status(404).json({ error: "Esquema no encontrado." });
    const normalized = normalizeFormSchema(row);
    if (normalized.schemaType === "assignment") {
      const registry = await getRegistryFields();
      normalized.resolvedFields = resolveFieldsFromRegistry(registry, { fieldRefs: normalized.fieldRefs });
    }
    res.json(normalized);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo esquema." });
  }
});

// PUT /api/form-schemas/:key
router.put("/:key", async (req, res) => {
  try {
    const { label, fields, fieldRefs, entity, component, schemaType } = req.body;
    await ensureFormSchemas();

    const existing = await prisma.formSchema.findUnique({ where: { key: req.params.key } });
    const type = schemaType || existing?.schemaType || "legacy";

    if (type === "registry") {
      if (!Array.isArray(fields)) return res.status(400).json({ error: "fields debe ser un array." });
    } else if (type === "assignment") {
      if (!Array.isArray(fieldRefs)) return res.status(400).json({ error: "fieldRefs debe ser un array." });
    } else if (!Array.isArray(fields)) {
      return res.status(400).json({ error: "fields debe ser un array." });
    }

    const row = await prisma.formSchema.upsert({
      where: { key: req.params.key },
      create: {
        key: req.params.key,
        label: label || req.params.key,
        entity: entity || null,
        component: component || null,
        schemaType: type,
        fields: fields || [],
        fieldRefs: fieldRefs || null,
      },
      update: {
        label: label || undefined,
        entity: entity !== undefined ? entity : undefined,
        component: component !== undefined ? component : undefined,
        schemaType: type,
        fields: fields !== undefined ? fields : undefined,
        fieldRefs: fieldRefs !== undefined ? fieldRefs : undefined,
      },
    });

    if (req.params.key === "assign.worker.form.create") {
      await prisma.formSchema.upsert({
        where: { key: "assign.worker.form.edit" },
        create: {
          key: "assign.worker.form.edit",
          label: "Empleado — edición",
          schemaType: "assignment",
          entity: "worker",
          fieldRefs: fieldRefs || [],
          fields: [],
        },
        update: { fieldRefs: fieldRefs || undefined },
      });
    }

    res.json(normalizeFormSchema(row));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error guardando esquema." });
  }
});

export default router;
