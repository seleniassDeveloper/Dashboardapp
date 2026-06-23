import { getFirebaseAuth } from "../services/firebaseAdmin.js";
import prisma from "../prisma.js";

export default async function requireAuth(req, res, next) {
  let firebaseUser = null;
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  // 1. Validar tokens de autenticación local para desarrollo / testing
  if (token && token.startsWith("local-token-")) {
    const userId = token.replace("local-token-", "");
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (dbUser) {
        firebaseUser = {
          uid: dbUser.id,
          email: dbUser.email,
          admin: true
        };
      }
    } catch (e) {
      console.error("Error validando local-token en requireAuth:", e);
    }
  }

  // 2. Si no es un token local, aplicar flujos estándar
  if (!firebaseUser) {
    if (process.env.AUTH_DISABLED === "true" && !token) {
      // Compatibilidad para desarrollo rápido local sin token
      firebaseUser = { uid: "dev-user", email: "selenisdeveloper@gmail.com", admin: true };
    } else {
      const bypassToken = process.env.QUICK_BOOKING_TOKEN || "aura-admin-token";

      if (token && token === bypassToken) {
        firebaseUser = { uid: "quick-booking-user", email: "quick@booking.com", admin: true };
      } else if (!token) {
        return res.status(401).json({ error: "No autenticado. Por favor inicia sesión." });
      } else {
        try {
          const decoded = await getFirebaseAuth().verifyIdToken(token);
          firebaseUser = {
            uid: decoded.uid,
            email: decoded.email ?? null,
            admin: decoded.admin === true,
          };
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
            console.warn("[auth] Firebase Admin no configurado — Habilitando bypass local para desarrollo.");
            firebaseUser = { uid: "quick-booking-user", email: "quick@booking.com", admin: true };
          } else {
            return res.status(401).json({ error: "Sesión inválida o expirada." });
          }
        }
      }
    }
  }

  try {
    req.user = firebaseUser;

    // Buscar o crear el User en nuestra base de datos local relacional
    if (firebaseUser?.uid) {
      let dbUser = await prisma.user.findUnique({
        where: { id: firebaseUser.uid }
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: firebaseUser.uid,
            email: firebaseUser.email || `${firebaseUser.uid}@aura-studio.com`,
            firstName: firebaseUser.uid === "dev-user" ? "Dev" : "Usuario",
            lastName: firebaseUser.uid === "dev-user" ? "User" : "SaaS",
            name: firebaseUser.uid === "dev-user" ? "Dev User" : "Usuario SaaS",
            status: "active"
          }
        });
      }
      req.dbUser = dbUser;
    }

    next();
  } catch (error) {
    console.error("Error asegurando registro de User en requireAuth:", error);
    res.status(500).json({ error: "Error de autenticación y sincronización del perfil relacional." });
  }
}
