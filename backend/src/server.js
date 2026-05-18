import "dotenv/config";
import app from "./app.js";
import prisma from "./prisma.js";
import { assertProductionEnv } from "./config/env.js";
import { startRemindersJob } from "./jobs/reminders.job.js";

assertProductionEnv();

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(
    `[server] Dashboard API en ${HOST}:${PORT} (${process.env.NODE_ENV || "development"})`
  );
});

if (process.env.ENABLE_REMINDERS_JOB === "true") {
  startRemindersJob();
  console.log("[server] Job de recordatorios activo");
}

async function shutdown(signal) {
  console.log(`[server] ${signal} — cerrando conexiones…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] uncaughtException:", err);
  shutdown("uncaughtException");
});
