import { Router } from "express";

const router = Router();

// In-memory store for scanned barcodes per businessId
const pendingScansByBusiness = new Map();

// POST /api/mobile-scans
// Appends scanned codes from the mobile device to the tenant's pending buffer
router.post("/", (req, res) => {
  const businessId = req.businessId;
  if (!businessId) {
    return res.status(400).json({ success: false, error: "Negocio no especificado." });
  }

  const { codes } = req.body;
  if (Array.isArray(codes)) {
    if (!pendingScansByBusiness.has(businessId)) {
      pendingScansByBusiness.set(businessId, []);
    }
    const buffer = pendingScansByBusiness.get(businessId);
    buffer.push(...codes);
    return res.status(200).json({ success: true, count: buffer.length });
  }
  return res.status(400).json({ success: false, error: "Formato inválido. 'codes' debe ser un arreglo." });
});

// GET /api/mobile-scans/pending
// Retrieves and clears the pending scans for the specified tenant
router.get("/pending", (req, res) => {
  const businessId = req.businessId;
  if (!businessId) {
    return res.status(400).json({ success: false, error: "Negocio no especificado." });
  }

  const buffer = pendingScansByBusiness.get(businessId) || [];
  const currentScans = [...buffer];
  pendingScansByBusiness.set(businessId, []); // Clear tenant buffer
  res.status(200).json({ pending: currentScans });
});

export default router;
