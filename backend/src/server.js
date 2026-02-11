import express from "express";
import cors from "cors";

import appointmentsRoutes from "./routes/appointments.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import servicesRoutes from "./routes/services.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", appointmentsRoutes);
app.use("/api", clientsRoutes);
app.use("/api", servicesRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
