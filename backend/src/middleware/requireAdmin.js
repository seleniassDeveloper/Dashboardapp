import { isSuperAdmin } from "../utils/superadmin.js";

export default function requireAdmin(req, res, next) {
  const email = String(req.user?.email || "").toLowerCase().trim();
  if (!req.user?.admin && !isSuperAdmin(email)) {
    return res.status(403).json({ error: "Requiere rol de administrador." });
  }
  next();
}

