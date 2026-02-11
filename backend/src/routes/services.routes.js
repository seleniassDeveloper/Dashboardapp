import { Router } from "express";
import { getServices, createService } from "../controllers/services.controller.js";

const router = Router();

router.get("/services", getServices);
router.post("/services", createService);

export default router;
