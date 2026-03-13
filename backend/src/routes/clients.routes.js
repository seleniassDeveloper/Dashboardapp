import { Router } from "express";
import {
  listClients,
  getClientAppointments,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clients.controller.js";

const router = Router();

router.get("/", listClients);
router.get("/:id/appointments", getClientAppointments);
router.post("/", createClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;