import express from "express";
import cors from "cors";

import servicesRoutes from "./routes/services.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "backend" });
});

app.use("/api/services", servicesRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/appointments", appointmentsRoutes);

export default app;
