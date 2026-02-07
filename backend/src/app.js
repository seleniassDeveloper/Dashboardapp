import express from "express";
import cors from "cors";

import clientsRoutes from "./routes/clients.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

// quitar warning del favicon (opcional)
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "backend" });
});

// ✅ Clients API
app.use("/api/clients", clientsRoutes);

// root simple
app.get("/", (req, res) => {
  res.send("Backend OK ✅");
});