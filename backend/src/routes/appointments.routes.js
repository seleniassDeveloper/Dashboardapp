import { Router } from "express";
import {
  getAppointments,
  checkAppointmentAvailability,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getBusinessConfig,
  updateBusinessConfig,
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

export default router;