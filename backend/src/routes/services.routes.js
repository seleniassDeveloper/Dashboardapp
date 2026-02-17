import { Router } from "express";
import {
  createService,
  listServices,
  updateService,
  deleteService,
} from "../controllers/services.controller.js";

const router = Router();

router.get("/services", listServices);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);

export default router;