import prisma from "../prisma.js";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "seleniadeveloper@gmail.com";

/**
 * Verifica si un correo corresponde al superadministrador del sistema.
 */
export function isSuperAdmin(userEmail) {
  if (!userEmail) return false;
  const cleanEmail = String(userEmail).toLowerCase().trim();
  const cleanSuperAdmin = String(SUPER_ADMIN_EMAIL).toLowerCase().trim();
  return cleanEmail === cleanSuperAdmin;
}

/**
 * Verifica si un objeto de usuario posee permisos de administrador o es superadministrador.
 */
export function isSuperAdminUser(user) {
  if (!user) return false;
  return user.admin || isSuperAdmin(user.email);
}

/**
 * Registra una acción administrativa en la tabla de auditoría.
 */
export async function logSuperAdminAction({ userId, userEmail, action, businessId = null, metadata = {}, ip = "" }) {
  try {
    await prisma.auditLog.create({
      data: {
        businessId: businessId || null,
        userId: userId || null,
        action,
        entity: "SuperAdminAction",
        entityId: businessId || null,
        metadata: {
          ...metadata,
          userEmail,
          ip,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error("Error al registrar auditoría de super-admin:", error);
  }
}
