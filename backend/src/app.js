import dotenv from "dotenv";
import { resolve } from "node:path";
dotenv.config({ path: resolve(process.cwd(), ".env") });

import express from "express";
import cors from "cors";

import appointmentsRoutes from "./routes/appointments.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import workersRoutes from "./routes/workers.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminUsersRoutes from "./routes/adminUsers.routes.js";
import formSchemasRoutes from "./routes/formSchemas.routes.js";
import businessModelsRoutes from "./routes/businessModels.routes.js";
import workflowsRoutes from "./routes/workflows.routes.js";
import healthRoutes from "./routes/health.routes.js";
import requireAuth from "./middleware/requireAuth.js";
import { getCorsOptions } from "./config/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: "2mb" }));
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

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminUsersRoutes);

app.use("/api/appointments", requireAuth, appointmentsRoutes);
app.use("/api/clients", requireAuth, clientsRoutes);
app.use("/api/workers", requireAuth, workersRoutes);
app.use("/api/services", requireAuth, servicesRoutes);
app.use("/api/form-schemas", requireAuth, formSchemasRoutes);
app.use("/api/business-models", requireAuth, businessModelsRoutes);
app.use("/api/workflows", requireAuth, workflowsRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
