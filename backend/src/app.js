import express from "express";
import cors from "cors";

import appointmentsRoutes from "./routes/appointments.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import workersRoutes from "./routes/workers.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/appointments", appointmentsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/workers", workersRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/ai", aiRoutes);

export default app;