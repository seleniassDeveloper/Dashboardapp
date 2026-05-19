import { Router } from "express";
import prisma from "../prisma.js";
import { ensureFirebaseAdmin } from "../services/firebaseAdmin.js";

const router = Router();

/** Liveness — Railway healthcheck (siempre 200 si el proceso está arriba). */
router.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "dashboard-api",
    timestamp: new Date().toISOString()
  });
});

/** Readiness — DB y Firebase (opcional para monitoreo). */
router.get("/ready", async (_req, res) => {
  const checks = { database: false, firebase: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (e) {
    console.error("[health/ready] database:", e?.message);
  }

  try {
    if (process.env.AUTH_DISABLED === "true") {
      checks.firebase = true;
    } else {
      ensureFirebaseAdmin();
      checks.firebase = true;
    }
  } catch (e) {
    console.error("[health/ready] firebase:", e?.message);
    checks.firebase = false;
  }

  const ok = checks.database;

  res.status(ok ? 200 : 503).json({
    ok,
    service: "dashboard-api",
    environment: process.env.NODE_ENV || "development",
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
