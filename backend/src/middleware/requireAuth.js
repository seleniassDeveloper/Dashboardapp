import { getFirebaseAuth } from "../services/firebaseAdmin.js";

export default async function requireAuth(req, res, next) {
  if (process.env.AUTH_DISABLED === "true") {
    req.user = { uid: "dev-user", email: "dev@example.com", admin: true };
    return next();
  }

  const header = req.headers.authorization;
  console.log("Authorization header:", header ? "Present" : "Missing");
  
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  console.log("Token preview:", token?.slice(0, 30));
  
  if (!token) {
    return res.status(401).json({ error: "No autenticado." });
  }

  try {
    const decoded = await getFirebaseAuth().verifyIdToken(token);
    console.log("decoded uid:", decoded.uid);
    console.log("decoded aud:", decoded.aud);
    console.log("decoded iss:", decoded.iss);
    
    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
      admin: decoded.admin === true,
    };
    next();
  } catch (e) {
    console.error("verifyIdToken failed:", e);
    const msg = String(e?.message || e);
    if (
      msg.includes("credenciales") ||
      msg.includes("FIREBASE_SERVICE_ACCOUNT") ||
      msg.includes("no hay credenciales") ||
      msg.includes("ENOENT") ||
      msg.includes("JSON")
    ) {
      return res.status(500).json({
        error: "Firebase Admin no está configurado en el servidor (cuenta de servicio).",
      });
    }
    return res.status(401).json({ error: "Sesión inválida o expirada." });
  }
}
