/**
 * Crea un usuario en Firebase Authentication (no en Prisma).
 * Uso: npm run create-user -- email@dominio.com contraseña
 */
import "dotenv/config";
import { getFirebaseAuth } from "../src/services/firebaseAdmin.js";

const [, , emailArg, passwordArg] = process.argv;

if (!emailArg || !passwordArg) {
  console.error("Uso: npm run create-user -- <email> <contraseña>");
  console.error("Requiere cuenta de servicio Firebase (ver backend/.env.example).");
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();

try {
  await getFirebaseAuth().createUser({
    email,
    password: passwordArg,
    emailVerified: false,
  });
  console.log("Usuario creado en Firebase Auth:", email);
} catch (e) {
  if (e?.code === "auth/email-already-exists") {
    console.error("Ese email ya está registrado en Firebase.");
    process.exit(1);
  }
  console.error(e);
  process.exit(1);
}
