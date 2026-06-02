import { Router } from "express";
import {
  listServices,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService
} from "../controllers/services.controller.js";

const router = Router();

router.get("/", listServices);
router.post("/", createService);
router.put("/:id", updateService);
router.patch("/:id/status", toggleServiceStatus);
router.delete("/:id", deleteService);

export default router;
