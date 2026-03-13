import { Router } from "express";
import { aiAnalytics } from "../controllers/ai.controller.js";

const router = Router();

router.post("/analytics", aiAnalytics);

export default router;