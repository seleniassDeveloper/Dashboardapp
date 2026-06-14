const fs = require('fs');
const path = require('path');

function processFile(filename) {
  const filePath = path.join(__dirname, '../src/controllers', filename);
  if (!fs.existsSync(filePath)) return;

  let code = fs.readFileSync(filePath, 'utf8');

  // Fix duplicated where clauses
  code = code.replace(/where:\s*\{\s*businessId:\s*req\.businessId\s*\}\,\s*where:\s*\{\s*businessId:\s*req\.businessId\s*\}/g, "where: { businessId: req.businessId }");

  code = code.replace(/where:\s*\{\s*businessId:\s*req\.businessId\s*\}\,\s*where:\s*\{/g, "where: { businessId: req.businessId, ");

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Cleaned ${filename}`);
}

['inventory.controller.js', 'finances.controller.js', 'marketing.controller.js', 'services.controller.js', 'serviceSla.controller.js', 'dashboard.controller.js', 'appointments.controller.js', 'clients.controller.js'].forEach(processFile);
