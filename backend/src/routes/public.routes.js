import { Router } from "express";
import {
  getPublicBusiness,
  getPublicServices,
  getPublicProfessionals,
  getPublicAvailability,
  createPublicBooking,
  googleOAuthCallback,
  reportPublicError,
  triggerPublicWorkflowWebhook,
} from "../controllers/public.controller.js";
import {
  getPublicConsentDetails,
  signConsent,
  getConsentRecordById
} from "../controllers/consent.controller.js";

const router = Router();

router.get("/business/:slug", getPublicBusiness);
router.get("/business/:slug/services", getPublicServices);
router.get("/business/:slug/professionals", getPublicProfessionals);
router.get("/business/:slug/availability", getPublicAvailability);
router.get("/business/:slug/slots", getPublicAvailability);
router.post("/business/:slug/bookings", createPublicBooking);
router.get("/google/oauth-callback/:slug", googleOAuthCallback);
router.post("/support/report-error", reportPublicError);

// Custom webhook triggers for workflows
router.post("/workflows/trigger/:workflowId", triggerPublicWorkflowWebhook);

// Consentimientos públicos
router.get("/consent/:token", getPublicConsentDetails);
router.post("/consent/:token/sign", signConsent);
router.get("/consent/record/:id", getConsentRecordById);

export default router;
