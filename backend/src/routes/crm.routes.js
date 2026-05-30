import { Router } from "express";
import { getClientCRMProfile } from "../controllers/crm.controller.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get("/:id", requirePermission("clients.profile.view"), getClientCRMProfile);

export default router;
