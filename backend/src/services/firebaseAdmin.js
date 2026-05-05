import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

/**
 * Cuenta de servicio: JSON en FIREBASE_SERVICE_ACCOUNT_JSON
 * o archivo en FIREBASE_SERVICE_ACCOUNT_PATH (ruta relativa al cwd del backend, por defecto firebase-service-account.json).
 */
export function ensureFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline?.trim()) {
    const cred = JSON.parse(inline);
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    return admin;
  }

  const rel = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "firebase-service-account.json";
  const full = resolve(process.cwd(), rel);
  if (!existsSync(full)) {
    throw new Error(
      `Firebase Admin: no hay credenciales. Definí FIREBASE_SERVICE_ACCOUNT_JSON o colocá el JSON en ${full}`
    );
  }

  const cred = JSON.parse(readFileSync(full, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(cred) });
  return admin;
}

export function getFirebaseAuth() {
  return ensureFirebaseAdmin().auth();
}
