import { Router } from "express";
import { createAIReport } from "../controllers/ai.controller.js";

const router = Router();

router.post("/report", createAIReport);

export default router;