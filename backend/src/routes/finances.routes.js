import { Router } from "express";
import {
  getFinanceDashboardData,
  listExpenses,
  createExpense,
  deleteExpense,
  listCashClosings,
  createCashClosing,
  listSalaryPayments,
  createSalaryPayment,
  listBankMovements,
  reconcileMovement,
  listAuditLogs,
  listBranches
} from "../controllers/finances.controller.js";

const router = Router();

router.get("/dashboard", getFinanceDashboardData);

router.get("/expenses", listExpenses);
router.post("/expenses", createExpense);
router.delete("/expenses/:id", deleteExpense);


router.get("/cash-closings", listCashClosings);
router.post("/cash-closings", createCashClosing);

router.get("/payroll", listSalaryPayments);
router.post("/payroll", createSalaryPayment);

router.get("/bank-recon", listBankMovements);
router.put("/bank-recon/:id", reconcileMovement);

router.get("/audit", listAuditLogs);

router.get("/branches", listBranches);

export default router;
