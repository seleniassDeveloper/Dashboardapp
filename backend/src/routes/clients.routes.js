// src/routes/clients.routes.js
import { Router } from "express";
import { createClient, updateClient } from "../controllers/clients.controller.js";

const router = Router();
router.post("/clients", createClient);
router.put("/clients/:id", updateClient);

export default router;