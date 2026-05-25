/**
 * Lanzador de pruebas locales del salón.
 * Levanta, en un solo comando y SIN instalar Postgres:
 *   1) una base de datos local desechable (PGlite) con datos de ejemplo del salón
 *   2) el backend real (API Express)
 *   3) el frontend (panel de gestión + página de reservas)
 *
 * Uso:
 *   cd "scripts/prueba-local"
 *   npm install        (solo la primera vez)
 *   node iniciar.mjs
 *
 * Detener todo: Ctrl + C en esta ventana.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");        // carpeta Dashboard
const BACKEND = resolve(ROOT, "backend");
const FRONT = resolve(ROOT, "dashboard-react");

const PORT_DB = 5432;
const PORT_API = 3001;
const PORT_WEB = 5173;
const DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${PORT_DB}/postgres?connection_limit=1&pgbouncer=true`;

const procs = [];

function gid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10);
}

// Próximo lunes (para que las citas de ejemplo queden a futuro)
function nextMonday() {
  const d = new Date();
  const add = ((1 - d.getDay()) + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d;
}
function atUTC(baseDate, hh, mm) {
  return new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), hh, mm, 0)).toISOString();
}

async function seed(db) {
  // Servicios
  const SVC = {
    mani: gid("svc"), pedi: gid("svc"), lash: gid("svc"), lift: gid("svc"),
  };
  const servicios = [
    [SVC.mani, "Manicure Semipermanente", 18000, 60],
    [SVC.pedi, "Pedicure Spa", 22000, 90],
    [SVC.lash, "Extensión de Pestañas Pelo a Pelo", 35000, 120],
    [SVC.lift, "Lifting de Pestañas", 25000, 75],
  ];
  for (const [id, name, price, duration] of servicios) {
    await db.query(
      `INSERT INTO "Service" ("id","name","price","duration","isActive","availableOnline","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,true,true,NOW(),NOW())`,
      [id, name, price, duration]
    );
  }

  // Profesionales
  const W = { lucia: gid("wrk"), camila: gid("wrk") };
  await db.query(
    `INSERT INTO "Worker" ("id","firstName","lastName","roleTitle","email","customFields","availableOnline","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,'{}'::jsonb,true,NOW(),NOW())`,
    [W.lucia, "Lucía", "Pérez", "Manicurista Senior", "lucia@aura.cl"]
  );
  await db.query(
    `INSERT INTO "Worker" ("id","firstName","lastName","roleTitle","email","customFields","availableOnline","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,'{}'::jsonb,true,NOW(),NOW())`,
    [W.camila, "Camila", "Rojas", "Lash Artist", "camila@aura.cl"]
  );

  // Servicios por profesional
  const ws = [
    [W.lucia, SVC.mani], [W.lucia, SVC.pedi],
    [W.camila, SVC.lash], [W.camila, SVC.lift],
  ];
  for (const [workerId, serviceId] of ws) {
    await db.query(`INSERT INTO "WorkerService" ("workerId","serviceId") VALUES ($1,$2)`, [workerId, serviceId]);
  }

  // Horarios (1=Lun ... 7=Dom)
  const horarios = [
    ...[1, 2, 3, 4, 5].map((d) => [W.lucia, d, "09:00", "18:00"]),
    [W.lucia, 6, "10:00", "15:00"],
    ...[2, 3, 4, 5, 6].map((d) => [W.camila, d, "10:00", "19:00"]),
  ];
  for (const [workerId, dow, st, et] of horarios) {
    await db.query(
      `INSERT INTO "WorkerSchedule" ("id","workerId","dayOfWeek","startTime","endTime","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
      [gid("sch"), workerId, dow, st, et]
    );
  }

  // Clientes
  const C = { maria: gid("cli"), sofia: gid("cli"), valentina: gid("cli") };
  const clientes = [
    [C.maria, "María José", "González", "+56 9 6011 1222", "maria@example.com", "Alérgica a la acetona."],
    [C.sofia, "Sofía", "Martín", "+56 9 7022 3344", null, null],
    [C.valentina, "Valentina", "Díaz", "+56 9 5040 8899", "valentina@example.com", null],
  ];
  for (const [id, fn, ln, ph, em, no] of clientes) {
    await db.query(
      `INSERT INTO "Client" ("id","firstName","lastName","phone","email","notes","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
      [id, fn, ln, ph, em, no]
    );
  }

  // Negocio (para la página de reservas /booking/mi-negocio)
  await db.query(
    `INSERT INTO "Business" ("id","name","slug","bookingEnabled","bookingPrimaryColor","bookingConfirmationMessage","createdAt","updatedAt")
     VALUES ($1,$2,$3,true,$4,$5,NOW(),NOW())`,
    [gid("biz"), "Aura Nails & Lashes", "mi-negocio", "#ec4899", "¡Tu reserva ha sido confirmada con éxito!"]
  );

  // Citas de ejemplo (próximo lunes) para que la agenda y las estadísticas no estén vacías
  const lun = nextMonday();
  const citas = [
    [gid("apt"), atUTC(lun, 13, 0), "CONFIRMED", C.maria, W.lucia, SVC.mani],
    [gid("apt"), atUTC(lun, 15, 0), "PENDING", C.sofia, W.lucia, SVC.pedi],
    [gid("apt"), atUTC(lun, 11, 0), "CONFIRMED", C.valentina, W.camila, SVC.lash],
  ];
  for (const [id, startsAt, status, clientId, workerId, serviceId] of citas) {
    await db.query(
      `INSERT INTO "Appointment" ("id","startsAt","status","clientId","workerId","serviceId","source")
       VALUES ($1,$2,$3,$4,$5,$6,'dashboard')`,
      [id, startsAt, status, clientId, workerId, serviceId]
    );
  }
}

function printUrls() {
  console.log(`
============================================================
  ✅ TODO LISTO. Abre en tu navegador:

     Panel de gestión:   http://localhost:${PORT_WEB}/app
     Reservas online:    http://localhost:${PORT_WEB}/booking/mi-negocio

  (El backend corre en http://localhost:${PORT_API} con una base
   de datos LOCAL y desechable: tus datos reales de Neon NO se tocan.)

  Para detener todo: presiona  Ctrl + C  en esta ventana.
============================================================
`);
}

async function shutdown() {
  console.log("\nDeteniendo servicios...");
  for (const p of procs) { try { p.kill("SIGTERM"); } catch {} }
  try { await pg.stop?.(); } catch {}
  process.exit(0);
}

// ---------------- arranque ----------------
console.log("Iniciando base de datos local (PGlite)...");
const db = await PGlite.create();
await db.exec(readFileSync(resolve(__dirname, "ddl.sql"), "utf8"));
await seed(db);
const pg = new PGLiteSocketServer({ db, port: PORT_DB, host: "127.0.0.1" });
await pg.start();
console.log("✔ Base local lista con datos del salón (4 servicios, 2 profesionales, 3 clientes, 3 citas).");

console.log("Iniciando backend...");
const backend = spawn(process.execPath, [resolve(__dirname, "run-backend.mjs")], {
  cwd: BACKEND,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL,
    AUTH_DISABLED: "true",
    NODE_ENV: "development",
    PORT: String(PORT_API),
    ENABLE_REMINDERS_JOB: "false",
  },
});
procs.push(backend);

console.log("Iniciando frontend (panel + reservas)...");
const front = spawn("npm", ["run", "dev"], {
  cwd: FRONT,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});
procs.push(front);

backend.on("exit", (code) => console.log(`[backend] terminó (code=${code})`));
front.on("exit", (code) => console.log(`[frontend] terminó (code=${code})`));

setTimeout(printUrls, 4000);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
