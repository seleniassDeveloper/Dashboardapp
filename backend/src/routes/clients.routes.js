import { Router } from "express";
import {
  listClients,
  getClientAppointments,
  createClient,
  updateClient,
  deleteClient,
  getClientClinicalHistory,
  createClientClinicalHistory,
  updateClientClinicalHistory,
  deleteClientClinicalHistory,
} from "../controllers/clients.controller.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get("/", requirePermission(["clients.view.all", "clients.view.assigned"]), listClients);
router.get("/:id/appointments", requirePermission(["clients.view.all", "clients.view.assigned"]), getClientAppointments);
router.post("/", requirePermission("clients.create"), createClient);
router.put("/:id", requirePermission("clients.edit"), updateClient);
router.delete("/:id", requirePermission("clients.delete"), deleteClient);

// Historial Clínico y Ficha Técnica
router.get("/:id/clinical-history", requirePermission("clients.clinical.view"), getClientClinicalHistory);
router.post("/:id/clinical-history", requirePermission("clients.clinical.create"), createClientClinicalHistory);
router.put("/:id/clinical-history/:entryId", requirePermission("clients.clinical.edit"), updateClientClinicalHistory);
router.delete("/:id/clinical-history/:entryId", requirePermission("clients.clinical.delete"), deleteClientClinicalHistory);

export default router;