export default function requireAdmin(req, res, next) {
  const email = String(req.user?.email || "").toLowerCase().trim();
  if (!req.user?.admin && email !== "seleniadeveloper@gmail.com") {
    return res.status(403).json({ error: "Requiere rol de administrador." });
  }
  next();
}

