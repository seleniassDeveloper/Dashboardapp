/**
 * Marca un usuario como admin (custom claims) en Firebase Auth.
 * Uso: npm run set-admin -- <uid> true|false
 */
import "dotenv/config";
import { getFirebaseAuth } from "../src/services/firebaseAdmin.js";

const [, , uidArg, adminArg] = process.argv;

if (!uidArg || !adminArg) {
  console.error("Uso: npm run set-admin -- <uid> true|false");
  process.exit(1);
}

const uid = String(uidArg).trim();
const admin = String(adminArg).toLowerCase() === "true";

await getFirebaseAuth().setCustomUserClaims(uid, { admin });
console.log(`Claims actualizados: uid=${uid} admin=${admin}`);

