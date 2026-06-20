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
import { resolveComponentFields } from "../services/formSchemaService.js";

const router = Router();

router.get("/business/:slug", getPublicBusiness);
router.get("/business/:slug/services", getPublicServices);
router.get("/business/:slug/professionals", getPublicProfessionals);
router.get("/business/:slug/availability", getPublicAvailability);
router.get("/business/:slug/slots", getPublicAvailability);
router.post("/business/:slug/bookings", createPublicBooking);
// Redirect ESTÁTICO (sin :slug). El negocio se identifica por `state` (businessId).
// Se conserva la variante con :slug por compatibilidad con conexiones antiguas.
router.get("/google/oauth-callback", googleOAuthCallback);
router.get("/google/oauth-callback/:slug", googleOAuthCallback);
router.post("/support/report-error", reportPublicError);

// Custom webhook triggers for workflows
router.post("/workflows/trigger/:workflowId", triggerPublicWorkflowWebhook);

// Consentimientos públicos
router.get("/consent/:token", getPublicConsentDetails);
router.post("/consent/:token/sign", signConsent);
router.get("/consent/record/:id", getConsentRecordById);

router.get("/form-schemas/resolve/:componentKey", async (req, res) => {
  try {
    const result = await resolveComponentFields(req.params.componentKey);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error resolviendo campos públicos." });
  }
});

router.get("/version", (req, res) => res.json({ version: "fire-and-forget-fix" }));

export default router;
