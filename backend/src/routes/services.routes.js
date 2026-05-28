import { Router } from "express";
import {
  listServices,
  createService,
  updateService,
  deleteService
} from "../controllers/services.controller.js";

const router = Router();

router.get("/", listServices);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;
