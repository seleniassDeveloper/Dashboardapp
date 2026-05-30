import { Router } from "express";
import prisma from "../prisma.js";
import { requireRole } from "../middleware/rbac.middleware.js";

const router = Router();

// GET /api/audit-logs (Listar bitácora de auditoría - Solo Owners y Admins)
router.get("/", requireRole(["owner", "admin"]), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { businessId: req.businessId },
      orderBy: { createdAt: "desc" },
      take: 150 // Límite razonable para auditoría rápida
    });

    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error al listar bitácora de auditoría:", error);
    res.status(500).json({ success: false, error: "No se pudo recuperar la bitácora de auditoría." });
  }
});

export default router;
