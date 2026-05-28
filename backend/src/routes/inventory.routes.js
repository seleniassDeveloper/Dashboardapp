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

const router = Router();

// Apply requireAuth middleware to secure all inventory ERP endpoints
router.use(requireAuth);

router.get("/dashboard", getInventoryDashboardData);

router.get("/products", listProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/suppliers", listSuppliers);
router.post("/suppliers", createSupplier);
router.put("/suppliers/:id", updateSupplier);
router.delete("/suppliers/:id", deleteSupplier);

router.get("/movements", listMovements);
router.post("/movements", createMovement);

router.get("/batches", listBatches);
router.post("/batches", createBatch);

router.get("/rules", listRules);
router.post("/rules", createRule);
router.delete("/rules/:id", deleteRule);

router.get("/orders", listPurchaseOrders);
router.post("/orders", createPurchaseOrder);
router.put("/orders/:id", updateOrderStatus);

export default router;
