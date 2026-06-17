import dotenv from "dotenv";
import { resolve } from "node:path";
dotenv.config({ path: resolve(process.cwd(), ".env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import appointmentsRoutes from "./routes/appointments.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import workersRoutes from "./routes/workers.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminUsersRoutes from "./routes/adminUsers.routes.js";
import formSchemasRoutes from "./routes/formSchemas.routes.js";
import businessModelsRoutes from "./routes/businessModels.routes.js";
import workflowsRoutes from "./routes/workflows.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import publicRoutes from "./routes/public.routes.js";
import healthRoutes from "./routes/health.routes.js";
import googleRoutes from "./routes/google.routes.js";
import crmRoutes from "./routes/crm.routes.js";
import financesRoutes from "./routes/finances.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import businessRoutes from "./routes/business.routes.js";
import membersRoutes from "./routes/members.routes.js";
import invitationsRoutes from "./routes/invitations.routes.js";
import rolesRoutes from "./routes/roles.routes.js";
import meRoutes from "./routes/me.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import consentRoutes from "./routes/consent.routes.js";
import marketingRoutes from "./routes/marketing.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import adminBillingRoutes from "./routes/adminBilling.routes.js";
import requireAuth from "./middleware/requireAuth.js";
import { checkTenant } from "./middleware/tenant.middleware.js";
import { getCorsOptions } from "./config/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

/** Liveness — primero, sin middleware (Railway healthcheck). */
app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "dashboard-api",
    timestamp: new Date().toISOString()
  });
});

app.use(cors(getCorsOptions()));
app.options(/.*/, cors(getCorsOptions()));

// 1. Seguridad de Cabeceras HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permite acceso a recursos (como /uploads) desde el frontend
}));

// 2. Límite global de peticiones (Rate Limiting)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Límite generoso
  message: { error: "Demasiadas peticiones desde esta IP. Intenta de nuevo después de 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 3. Límite estricto para rutas sensibles (como auth)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Límite estricto para proteger contra fuerza bruta
  message: { error: "Demasiados intentos. Por favor espera 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(resolve(process.cwd(), "uploads")));
app.use(requestLogger);

app.get("/", (_req, res) => {
  res.json({
    service: "Dashboard API",
    health: "/health",
    ready: "/health/ready",
    api: "/api",
  });
});

app.use("/health", healthRoutes);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminUsersRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin/billing", adminBillingRoutes);

app.use("/api/appointments", requireAuth, checkTenant, appointmentsRoutes);
app.use("/api/clients", requireAuth, checkTenant, clientsRoutes);
app.use("/api/consents", requireAuth, checkTenant, consentRoutes);
app.use("/api/workers", requireAuth, checkTenant, workersRoutes);
app.use("/api/staff", requireAuth, checkTenant, staffRoutes);
app.use("/api/services", requireAuth, checkTenant, servicesRoutes);
app.use("/api/form-schemas", requireAuth, formSchemasRoutes);
app.use("/api/business-models", requireAuth, businessModelsRoutes);
app.use("/api/workflows", requireAuth, checkTenant, workflowsRoutes);
app.use("/api/ai", requireAuth, checkTenant, aiRoutes);
app.use(`\/api\/dashboard`, requireAuth, dashboardRoutes);
app.use("/api/google", requireAuth, checkTenant, googleRoutes);
app.use("/api/crm", requireAuth, checkTenant, crmRoutes);
app.use("/api/finances", requireAuth, checkTenant, financesRoutes);
app.use("/api/finance", requireAuth, checkTenant, financesRoutes);
app.use("/api/reports/finance", requireAuth, checkTenant, financesRoutes);
app.use("/api/cash-closing", requireAuth, checkTenant, financesRoutes);
app.use("/api/salaries", requireAuth, checkTenant, financesRoutes);
app.use("/api/commissions", requireAuth, checkTenant, financesRoutes);
app.use("/api/inventory", requireAuth, checkTenant, inventoryRoutes);
app.use("/api/businesses", requireAuth, checkTenant, businessRoutes);
app.use("/api/members", requireAuth, checkTenant, membersRoutes);
app.use("/api/invitations", invitationsRoutes);
app.use("/api/roles", requireAuth, checkTenant, rolesRoutes);
app.use("/api/permissions", requireAuth, checkTenant, (req, res, next) => {
  req.url = "/permissions/all";
  rolesRoutes(req, res, next);
});
app.use("/api/permission-matrix", requireAuth, checkTenant, (req, res, next) => {
  req.url = "/permission-matrix";
  rolesRoutes(req, res, next);
});
app.use("/api/marketing", requireAuth, checkTenant, marketingRoutes);
app.use("/api/me", requireAuth, meRoutes);
app.use("/api/audit-logs", requireAuth, checkTenant, auditRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
