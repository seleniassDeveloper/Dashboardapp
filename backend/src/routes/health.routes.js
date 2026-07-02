import { Router } from "express";
import prisma from "../prisma.js";
import { ensureFirebaseAdmin } from "../services/firebaseAdmin.js";

import { isSuperAdmin } from "../utils/superadmin.js";

const router = Router();

/** Liveness — Railway healthcheck (siempre 200 si el proceso está arriba). */
router.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "dashboard-api",
    timestamp: new Date().toISOString(),
    diagnostics: {
      isSuperAdminSelenia: isSuperAdmin("seleniadeveloper@gmail.com"),
      isSuperAdminSelenis: isSuperAdmin("selenisdeveloper@gmail.com"),
      superAdminEmailConfigured: process.env.SUPER_ADMIN_EMAIL || "default",
      authDisabled: process.env.AUTH_DISABLED || "false"
    }
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
      const adminApp = ensureFirebaseAdmin();
      checks.firebase = !!adminApp.apps?.length || !!adminApp;
    }
  } catch (e) {
    console.error("[health/ready] Firebase check failed:", e.message);
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
