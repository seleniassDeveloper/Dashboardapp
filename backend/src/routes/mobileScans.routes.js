import { Router } from "express";

const router = Router();

// In-memory store for scanned barcodes
let pendingScans = [];

// POST /api/mobile-scans
// Appends scanned codes from the mobile device to the pending buffer
router.post("/", (req, res) => {
  const { codes } = req.body;
  if (Array.isArray(codes)) {
    pendingScans.push(...codes);
    return res.status(200).json({ success: true, count: pendingScans.length });
  }
  return res.status(400).json({ success: false, error: "Invalid data format. 'codes' must be an array." });
});

// GET /api/mobile-scans/pending
// Retrieves and clears the pending scans for the Chrome Extension
router.get("/pending", (req, res) => {
  const currentScans = [...pendingScans];
  pendingScans = []; // Clear buffer
  res.status(200).json({ pending: currentScans });
});

export default router;
