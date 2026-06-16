const fs = require('fs');

let content = fs.readFileSync('backend/src/routes/google.routes.js', 'utf8');

const endpoints = `
router.post("/import-history", verifyToken, async (req, res) => {
  try {
    const { name, summary } = req.body;
    const businessId = req.user.businessId;
    if (!name || !summary) return res.status(400).json({ error: "Faltan datos requeridos." });

    const record = await prisma.dataImportHistory.create({
      data: {
        businessId,
        name,
        details: summary
      }
    });
    res.json({ success: true, record });
  } catch (err) {
    console.error("Error guardando historial de importacion:", err);
    res.status(500).json({ error: "Error al guardar el historial." });
  }
});

router.get("/import-history", verifyToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const history = await prisma.dataImportHistory.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (err) {
    console.error("Error obteniendo historial de importaciones:", err);
    res.status(500).json({ error: "Error al obtener el historial." });
  }
});

export default router;
`;

content = content.replace('export default router;', endpoints);
fs.writeFileSync('backend/src/routes/google.routes.js', content);
