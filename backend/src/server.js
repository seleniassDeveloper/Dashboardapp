import "dotenv/config";
import app from "./app.js";
import prisma from "./prisma.js";
import { assertProductionEnv } from "./config/env.js";
import { startRemindersJob } from "./jobs/reminders.job.js";

console.log("Starting server...");

const PORT = process.env.PORT || 3001;
console.log("PORT:", PORT);

assertProductionEnv();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

if (process.env.ENABLE_REMINDERS_JOB === "true") {
  startRemindersJob();
  console.log("[server] Job de recordatorios activo");
}

async function shutdown(signal) {
  console.log(`[server] ${signal} — cerrando…`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] uncaughtException:", err);
  process.exit(1);
});
