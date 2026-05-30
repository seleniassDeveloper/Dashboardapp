import { Router } from "express";
import {
  listClients,
  getClientAppointments,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clients.controller.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

router.get("/", requirePermission(["clients.view.all", "clients.view.assigned"]), listClients);
router.get("/:id/appointments", requirePermission(["clients.view.all", "clients.view.assigned"]), getClientAppointments);
router.post("/", requirePermission("clients.create"), createClient);
router.put("/:id", requirePermission("clients.edit"), updateClient);
router.delete("/:id", requirePermission("clients.delete"), deleteClient);

export default router;