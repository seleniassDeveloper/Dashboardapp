import { Router } from "express";
import {
  getPublicBusiness,
  getPublicServices,
  getPublicProfessionals,
  getPublicAvailability,
  createPublicBooking,
} from "../controllers/public.controller.js";

const router = Router();

router.get("/business/:slug", getPublicBusiness);
router.get("/business/:slug/services", getPublicServices);
router.get("/business/:slug/professionals", getPublicProfessionals);
router.get("/business/:slug/availability", getPublicAvailability);
router.post("/business/:slug/bookings", createPublicBooking);

export default router;
