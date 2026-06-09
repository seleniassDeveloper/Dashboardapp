import { Router } from "express";
import {
  getPublicBusiness,
  getPublicServices,
  getPublicProfessionals,
  getPublicAvailability,
  createPublicBooking,
  googleOAuthCallback,
} from "../controllers/public.controller.js";

const router = Router();

router.get("/business/:slug", getPublicBusiness);
router.get("/business/:slug/services", getPublicServices);
router.get("/business/:slug/professionals", getPublicProfessionals);
router.get("/business/:slug/availability", getPublicAvailability);
router.get("/business/:slug/slots", getPublicAvailability);
router.post("/business/:slug/bookings", createPublicBooking);
router.get("/google/oauth-callback/:slug", googleOAuthCallback);

export default router;
