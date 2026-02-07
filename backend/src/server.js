import express from "express";
import cors from "cors";
import "dotenv/config";

import clientsRoutes from "./routes/clients.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "backend" }));

app.use("/api/clients", clientsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));