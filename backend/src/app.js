import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";



import appointmentsRoutes from "./routes/appointments.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import workersRoutes from "./routes/workers.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import requireAuth from "./middleware/requireAuth.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/appointments", requireAuth, appointmentsRoutes);
app.use("/api/clients", requireAuth, clientsRoutes);
app.use("/api/workers", requireAuth, workersRoutes);
app.use("/api/services", requireAuth, servicesRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

export default app;