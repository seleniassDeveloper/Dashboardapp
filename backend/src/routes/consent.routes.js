import { Router } from "express";
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  createConsentRequest,
  getClientConsentRequests,
  getClientConsentRecords,
  getConsentRecordById
} from "../controllers/consent.controller.js";

const router = Router();

router.get("/templates", getTemplates);
router.post("/templates", createTemplate);
router.delete("/templates/:id", deleteTemplate);
router.get("/requests", getClientConsentRequests);
router.post("/requests", createConsentRequest);
router.get("/records", getClientConsentRecords);
router.get("/records/:id", getConsentRecordById);

export default router;
