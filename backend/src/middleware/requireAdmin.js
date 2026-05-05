export default function requireAdmin(req, res, next) {
  if (!req.user?.admin) {
    return res.status(403).json({ error: "Requiere rol de administrador." });
  }
  next();
}

