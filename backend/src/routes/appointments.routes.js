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
  uploadAppointmentPhoto,
  deleteAppointmentPhoto,
  updateAppointmentPhotoMetadata,
} from "../controllers/appointments.controller.js";
import {
  getServiceSlaStats,
  getLiveSla,
  getSlaConfig,
  updateSlaConfig,
  getProfessionalEstimates,
  updateProfessionalEstimate
} from "../controllers/serviceSla.controller.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

// IMPORTANTE: acá es "/" porque el mount ya es "/api/appointments"
router.get("/availability", requirePermission("agenda.view"), checkAppointmentAvailability);
router.get("/business", requirePermission("agenda.view"), getBusinessConfig);
router.put("/business", requirePermission("settings.edit"), updateBusinessConfig);
router.get("/sla/stats", requirePermission("agenda.view"), getSlaStats);

// SLA de Ejecución de Servicio
router.get("/sla-service/stats", requirePermission("agenda.view"), getServiceSlaStats);
router.get("/sla-service/live/:appointmentId", requirePermission("agenda.view"), getLiveSla);
router.get("/sla-service/config", requirePermission("agenda.view"), getSlaConfig);
router.put("/sla-service/config", requirePermission("settings.edit"), updateSlaConfig);
router.get("/sla-service/estimates", requirePermission("agenda.view"), getProfessionalEstimates);
router.post("/sla-service/estimates", requirePermission("agenda.edit"), updateProfessionalEstimate);

router.get("/", requirePermission("agenda.view"), getAppointments);
router.post("/", requirePermission("agenda.create"), createAppointment);
router.put("/:id", requirePermission("agenda.edit"), updateAppointment);
router.delete("/:id", requirePermission("agenda.cancel"), deleteAppointment);
router.post("/:id/confirm-email", requirePermission("agenda.edit"), sendManualConfirmationEmail);
router.post("/:id/finalize", requirePermission("agenda.edit"), finalizeAppointment);

// Fotos de citas
router.post("/:id/photos", requirePermission("agenda.view"), uploadAppointmentPhoto);
router.delete("/photos/:photoId", requirePermission("agenda.edit"), deleteAppointmentPhoto);
router.put("/photos/:photoId", requirePermission("agenda.edit"), updateAppointmentPhotoMetadata);

export default router;