import { Router } from "express";
import { getPlans, getSubscription, checkout, cancel, webhook, quickApprove } from "../controllers/billing.controller.js";
import requireAuth from "../middleware/requireAuth.js";
import { checkTenant } from "../middleware/tenant.middleware.js";

const router = Router();

// PUBLIC WEBHOOK & QUICK APPROVE: Excluded from requireAuth and checkTenant
router.post("/webhook", webhook);
router.get("/quick-approve", quickApprove);

// AUTH & TENANT REQUIRED FOR WORKSPACE ACTIONS
router.get("/plans", requireAuth, checkTenant, getPlans);
router.get("/subscription", requireAuth, checkTenant, getSubscription);
router.post("/checkout", requireAuth, checkTenant, checkout);
router.post("/cancel", requireAuth, checkTenant, cancel);

export default router;
