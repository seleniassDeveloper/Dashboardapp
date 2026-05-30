import prisma from "../prisma.js";

export async function logAudit(businessId, userId, action, entity = null, entityId = null, metadata = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        businessId,
        userId,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }
    });
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
}
