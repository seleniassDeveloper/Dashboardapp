import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(clients);
});

router.post("/", async (req, res) => {
  const { fullName, phone, email, notes } = req.body;

  if (!fullName) {
    return res.status(400).json({ error: "fullName es requerido" });
  }

  const created = await prisma.client.create({
    data: { fullName, phone, email, notes },
  });

  res.status(201).json(created);
});

export default router;