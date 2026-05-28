import { Router } from "express";
import {
  getAppointments,
  checkAppointmentAvailability,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getBusinessConfig,
  updateBusinessConfig,
  sendManualConfirmationEmail,
  finalizeAppointment,
} from "../controllers/appointments.controller.js";

const router = Router();

// IMPORTANTE: acá es "/" porque el mount ya es "/api/appointments"
router.get("/availability", checkAppointmentAvailability);
router.get("/business", getBusinessConfig);
router.put("/business", updateBusinessConfig);
router.get("/", getAppointments);
router.post("/", createAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);
router.post("/:id/confirm-email", sendManualConfirmationEmail);
router.post("/:id/finalize", finalizeAppointment);

export default router;