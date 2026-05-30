import { Router } from "express";
import {
  getInventoryDashboardData,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  listMovements,
  createMovement,
  listBatches,
  createBatch,
  listRules,
  createRule,
  deleteRule,
  listPurchaseOrders,
  createPurchaseOrder,
  updateOrderStatus
} from "../controllers/inventory.controller.js";
import requireAuth from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = Router();

// Apply requireAuth middleware to secure all inventory ERP endpoints
router.use(requireAuth);

router.get("/dashboard", requirePermission("inventory.view"), getInventoryDashboardData);

router.get("/products", requirePermission("inventory.view"), listProducts);
router.post("/products", requirePermission("inventory.create"), createProduct);
router.put("/products/:id", requirePermission("inventory.edit"), updateProduct);
router.delete("/products/:id", requirePermission("inventory.delete"), deleteProduct);

router.get("/suppliers", requirePermission("inventory.view"), listSuppliers);
router.post("/suppliers", requirePermission("inventory.create"), createSupplier);
router.put("/suppliers/:id", requirePermission("inventory.edit"), updateSupplier);
router.delete("/suppliers/:id", requirePermission("inventory.delete"), deleteSupplier);

router.get("/movements", requirePermission("inventory.movements.view"), listMovements);
router.post("/movements", requirePermission("inventory.edit"), createMovement);

router.get("/batches", requirePermission("inventory.view"), listBatches);
router.post("/batches", requirePermission("inventory.create"), createBatch);

router.get("/rules", requirePermission("inventory.view"), listRules);
router.post("/rules", requirePermission("inventory.create"), createRule);
router.delete("/rules/:id", requirePermission("inventory.delete"), deleteRule);

router.get("/orders", requirePermission("inventory.view"), listPurchaseOrders);
router.post("/orders", requirePermission("inventory.create"), createPurchaseOrder);
router.put("/orders/:id", requirePermission("inventory.purchase.approve"), updateOrderStatus);

export default router;
