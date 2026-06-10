import prisma from "../prisma.js";
import { DEFAULT_BUSINESS_MODELS } from "../config/defaultBusinessModels.js";

export async function ensureBusinessModels() {
  for (const def of DEFAULT_BUSINESS_MODELS) {
    await prisma.businessModel.upsert({
      where: { slug: def.slug },
      update: {
        name: def.name,
        description: def.description,
        icon: def.icon,
        allowedTriggers: def.allowedTriggers,
        allowedActions: def.allowedActions,
        templateWorkflows: def.templateWorkflows || [],
      },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        icon: def.icon,
        allowedTriggers: def.allowedTriggers,
        allowedActions: def.allowedActions,
        templateWorkflows: def.templateWorkflows || [],
      },
    });
  }
}

export function normalizeBusinessModel(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    allowedTriggers: row.allowedTriggers || [],
    allowedActions: row.allowedActions || [],
    templateWorkflows: row.templateWorkflows || [],
    isActive: row.isActive,
    workflowCount: row._count?.workflows ?? row.workflowCount ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function normalizeWorkflow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    businessModelId: row.businessModelId,
    businessModel: row.businessModel
      ? { id: row.businessModel.id, slug: row.businessModel.slug, name: row.businessModel.name, icon: row.businessModel.icon }
      : null,
    trigger: row.trigger,
    steps: row.steps || [],
    transitions: row.transitions || [],
    screens: row.screens || [],
    runCount: row.runCount,
    lastRunAt: row.lastRunAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
