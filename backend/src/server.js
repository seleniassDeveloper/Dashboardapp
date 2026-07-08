import "dotenv/config";
import { spawn } from "node:child_process";
// Force rebuild trigger to resolve Railway transient cache/network build failure
import app from "./app.js";
import prisma from "./prisma.js";
import { assertProductionEnv } from "./config/env.js";
import { startRemindersJob } from "./jobs/reminders.job.js";
import { startGoogleSyncJob } from "./jobs/googleSync.job.js";
import { startBillingJob } from "./jobs/billing.job.js";

console.log("Starting server...");

const PORT = process.env.PORT || 3001;
console.log("PORT:", PORT);

assertProductionEnv();

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  if (process.env.DATABASE_URL) {
    // Usamos `db push` en vez de `migrate deploy` porque la base de producción
    // se creó con db push (sin baseline de migraciones) y `migrate deploy` da P3005.
    // db push sincroniza el schema (crea tablas/columnas faltantes) de forma aditiva.
    console.log("[server] prisma db push (background)…");
    const migrate = spawn("npx", ["prisma", "db", "push", "--skip-generate"], {
      stdio: "inherit",
      detached: true,
    });
    migrate.unref();
    migrate.on("exit", (code) => {
      console.log(`[server] db push finished code=${code}`);
    });
  } else {
    console.log("[server] DATABASE_URL not set — skip migrations");
  }
});

server.on("error", (err) => {
  console.error("[server] listen error:", err);
  process.exit(1);
});

if (process.env.ENABLE_REMINDERS_JOB === "true") {
  startRemindersJob();
  console.log("[server] Job de recordatorios activo");
}

if (process.env.ENABLE_GOOGLE_SYNC_JOB !== "false") {
  startGoogleSyncJob();
  console.log("[server] Job de sincronización de Google Calendar activo");
}

startBillingJob();
console.log("[server] Job de control de facturación y trial activo");

async function shutdown(signal) {
  console.log(`[server] ${signal} — cerrando…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] uncaughtException:", err);
  // No salir de inmediato: Railway marca 502 si el proceso muere antes del healthcheck
  if (!server?.listening) {
    process.exit(1);
  }
});
