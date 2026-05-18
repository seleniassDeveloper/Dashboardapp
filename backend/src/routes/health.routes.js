import { Router } from "express";
import prisma from "../prisma.js";
import { ensureFirebaseAdmin } from "../services/firebaseAdmin.js";

const router = Router();

router.get("/", async (_req, res) => {
  const checks = { database: false, firebase: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (e) {
    console.error("[health] database:", e?.message);
  }

  try {
    if (process.env.AUTH_DISABLED !== "true") {
      ensureFirebaseAdmin();
    }
    checks.firebase = process.env.AUTH_DISABLED === "true" || true;
  } catch (e) {
    console.error("[health] firebase:", e?.message);
    checks.firebase = false;
  }

  const ok = checks.database && checks.firebase;

  res.status(ok ? 200 : 503).json({
    ok,
    service: "dashboard-api",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
