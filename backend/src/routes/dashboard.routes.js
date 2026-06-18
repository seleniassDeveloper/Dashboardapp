import { Router } from "express";
import {
  getWidgets,
  createWidget,
  updateWidget,
  updateLayouts,
  deleteWidget,
  restoreDefaults,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.post("/widgets/restore-defaults", restoreDefaults);
router.get("/widgets", getWidgets);
router.post("/widgets", createWidget);
router.put("/widgets/layout", updateLayouts);
router.put("/widgets/:id", updateWidget);
router.delete("/widgets/:id", deleteWidget);

export default router;
