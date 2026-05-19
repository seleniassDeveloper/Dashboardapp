import "dotenv/config";
import { spawn } from "node:child_process";
import app from "./app.js";
import prisma from "./prisma.js";
import { assertProductionEnv } from "./config/env.js";
import { startRemindersJob } from "./jobs/reminders.job.js";

console.log("Starting server...");

const PORT = process.env.PORT || 3001;
console.log("PORT:", PORT);

assertProductionEnv();

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  if (process.env.DATABASE_URL) {
    console.log("[server] prisma migrate deploy (background)…");
    const migrate = spawn("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      detached: true,
    });
    migrate.unref();
    migrate.on("exit", (code) => {
      console.log(`[server] migrations finished code=${code}`);
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
  process.exit(1);
});
