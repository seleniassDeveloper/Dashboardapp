import { Router } from "express";
import {
  createClient,
  updateClient,
  listClients,
  deleteClient,
  getClientAppointments,
} from "../controllers/clients.controller.js";

const router = Router();

router.get("/clients", listClients);
router.get("/clients/:id/appointments", getClientAppointments);

router.post("/clients", createClient);
router.put("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);

export default router;
