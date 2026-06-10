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
  getSlaStats,
} from "../controllers/appointments.controller.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

// IMPORTANTE: acá es "/" porque el mount ya es "/api/appointments"
router.get("/availability", requirePermission("agenda.view"), checkAppointmentAvailability);
router.get("/business", requirePermission("agenda.view"), getBusinessConfig);
router.put("/business", requirePermission("settings.edit"), updateBusinessConfig);
router.get("/sla/stats", requirePermission("agenda.view"), getSlaStats);
router.get("/", requirePermission("agenda.view"), getAppointments);
router.post("/", requirePermission("agenda.create"), createAppointment);
router.put("/:id", requirePermission("agenda.edit"), updateAppointment);
router.delete("/:id", requirePermission("agenda.cancel"), deleteAppointment);
router.post("/:id/confirm-email", requirePermission("agenda.edit"), sendManualConfirmationEmail);
router.post("/:id/finalize", requirePermission("agenda.edit"), finalizeAppointment);

export default router;