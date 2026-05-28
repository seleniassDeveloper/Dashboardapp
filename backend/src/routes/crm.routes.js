import { Router } from "express";
import { getClientCRMProfile } from "../controllers/crm.controller.js";

const router = Router();

router.get("/:id", getClientCRMProfile);

export default router;
