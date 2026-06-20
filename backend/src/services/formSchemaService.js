import prisma from "../prisma.js";
import {
  DEFAULT_FORM_SCHEMAS,
  resolveFieldsFromRegistry,
} from "../config/defaultFormSchemas.js";

export async function ensureFormSchemas() {
  for (const def of DEFAULT_FORM_SCHEMAS) {
    const existing = await prisma.formSchema.findUnique({ where: { key: def.key } });
    if (!existing) {
      await prisma.formSchema.create({
        data: {
          key: def.key,
          label: def.label,
          entity: def.entity || null,
          component: def.component || null,
          schemaType: def.schemaType || "legacy",
          fields: def.fields || [],
          fieldRefs: def.fieldRefs || null,
        },
      });
    } else if (def.key === "fields.registry") {
      const currentFields = Array.isArray(existing.fields) ? existing.fields : [];
      const customFields = currentFields.filter(f => !f.system);
      const newSystemFields = def.fields.filter(f => f.system);
      const systemIds = new Set(newSystemFields.map(f => f.id));
      const filteredCustomFields = customFields.filter(f => !systemIds.has(f.id));
      const mergedFields = [...newSystemFields, ...filteredCustomFields];

      await prisma.formSchema.update({
        where: { key: def.key },
        data: { fields: mergedFields }
      });
    }
  }
}

export function normalizeFormSchema(row) {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    entity: row.entity,
    component: row.component,
    schemaType: row.schemaType || "legacy",
    fields: row.fields,
    fieldRefs: row.fieldRefs,
    updatedAt: row.updatedAt,
  };
}

export async function getRegistryFields() {
  await ensureFormSchemas();
  const row = await prisma.formSchema.findUnique({ where: { key: "fields.registry" } });
  return row?.fields || [];
}

export async function resolveComponentFields(componentKey) {
  await ensureFormSchemas();
  const registry = await getRegistryFields();
  const row = await prisma.formSchema.findUnique({ where: { key: componentKey } });
  if (!row) return { fields: [], schema: null };

  if (row.schemaType === "assignment" || row.fieldRefs) {
    return {
      schema: normalizeFormSchema(row),
      fields: resolveFieldsFromRegistry(registry, { fieldRefs: row.fieldRefs }),
    };
  }

  const legacyFields = (row.fields || []).filter((f) => f.enabled !== false);
  return { schema: normalizeFormSchema(row), fields: legacyFields };
}
