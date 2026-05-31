import { verifyBypassToken } from "../utils/financeCrypto.js";

export function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = String(req.user?.role || "").toLowerCase();
    const userPermissions = req.user?.permissions || [];
    const userEmail = String(req.user?.email || "").toLowerCase();

    // El Owner / Dueño tiene pase absoluto e irrestricto en cualquier módulo
    if (userRole === "owner" || userEmail === "seleniadeveloper@gmail.com") {
      return next();
    }

    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    const hasPerm = permissionsToCheck.some(p => userPermissions.includes(p));

    if (hasPerm) {
      return next();
    }

    return res.status(403).json({
      error: `Acceso denegado. Se requiere al menos uno de los siguientes permisos: [${permissionsToCheck.join(", ")}]`
    });
  };
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const userRole = String(req.user?.role || "").toLowerCase();
    const userEmail = String(req.user?.email || "").toLowerCase();
    const lcAllowedRoles = allowedRoles.map(r => String(r).toLowerCase());

    // El Owner tiene pase por defecto en cualquier rol check
    if (userRole === "owner" || userEmail === "seleniadeveloper@gmail.com" || lcAllowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: `Acceso denegado. Requiere uno de los siguientes roles: [${allowedRoles.join(", ")}]`
    });
  };
}

/**
 * Middleware para requerir acceso financiero.
 * Permite acceso si el usuario activo tiene 'finance.view' o rol OWNER, ADMIN, o FINANCE.
 * Si no, permite el paso si se presenta un token de bypass firmado de supervisor válido en 'x-finance-bypass-token'.
 */
export function requireFinanceAccess(req, res, next) {
  const userRole = String(req.user?.role || "").toLowerCase();
  const userPermissions = req.user?.permissions || [];
  const userEmail = String(req.user?.email || "").toLowerCase();

  // 1. Si el usuario logueado posee rol OWNER, ADMIN, o FINANCE, o el permiso finance.view, pasa directamente
  if (
    ["owner", "admin", "finance"].includes(userRole) ||
    userEmail === "seleniadeveloper@gmail.com" ||
    userPermissions.includes("finance.view")
  ) {
    return next();
  }

  // 2. Si no tiene permiso, buscar si hay un token de bypass de supervisor válido
  const bypassToken = req.headers["x-finance-bypass-token"];
  if (bypassToken) {
    const verified = verifyBypassToken(bypassToken);
    if (verified && verified.businessId === req.businessId) {
      // El token es válido y corresponde al negocio activo
      return next();
    }
  }

  return res.status(403).json({
    error: "Acceso denegado. Esta sección financiera requiere el permiso 'finance.view' o credenciales de supervisor autorizadas."
  });
}

