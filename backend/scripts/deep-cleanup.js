const fs = require('fs');
const path = require('path');

function processFile(filename) {
  const filePath = path.join(__dirname, '../src/controllers', filename);
  if (!fs.existsSync(filePath)) return;

  let code = fs.readFileSync(filePath, 'utf8');

  // Regex to match duplicate where clauses like:
  // where: { businessId: req.businessId },  where: businessId ? { businessId } : undefined,
  // where: { businessId: req.businessId },  where: whereClause,
  // where: { businessId: req.businessId }, where,
  code = code.replace(/where:\s*\{\s*businessId:\s*req\.businessId\s*\}\s*,\s*where:\s*/g, "where: ");

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Deep cleaned ${filename}`);
}

['inventory.controller.js', 'finances.controller.js', 'marketing.controller.js', 'services.controller.js', 'serviceSla.controller.js', 'dashboard.controller.js', 'appointments.controller.js', 'clients.controller.js'].forEach(processFile);
