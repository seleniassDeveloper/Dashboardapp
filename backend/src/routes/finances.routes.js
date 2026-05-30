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
import { requirePermission, requireFinanceAccess } from "../middleware/rbac.middleware.js";

const router = Router();

// Todos los endpoints de finanzas requieren el permiso general 'finance.view' o bypass de supervisor
router.use(requireFinanceAccess);

router.get("/dashboard", requirePermission("finance.revenue.view"), getFinanceDashboardData);

router.get("/expenses", requirePermission("finance.expenses.view"), listExpenses);
router.post("/expenses", requirePermission("finance.expenses.create"), createExpense);
router.delete("/expenses/:id", requirePermission("finance.expenses.delete"), deleteExpense);

router.get("/cash-closings", requirePermission("finance.expenses.view"), listCashClosings);
router.post("/cash-closings", requirePermission("finance.cashClosing.manage"), createCashClosing);

router.get("/payroll", requirePermission("finance.commissions.view"), listSalaryPayments);
router.post("/payroll", requirePermission("finance.commissions.view"), createSalaryPayment);

router.get("/bank-recon", requirePermission("finance.revenue.view"), listBankMovements);
router.put("/bank-recon/:id", requirePermission("finance.expenses.edit"), reconcileMovement);

router.get("/audit", requirePermission("audit.view"), listAuditLogs);
router.get("/branches", listBranches);

export default router;
