const fs = require('fs');
const path = require('path');

function processFile(filename) {
  const filePath = path.join(__dirname, '../src/controllers', filename);
  if (!fs.existsSync(filePath)) return;

  let code = fs.readFileSync(filePath, 'utf8');

  // Fix findMany() and count() without arguments
  code = code.replace(/prisma\.([a-zA-Z0-9_]+)\.(findMany|count|findFirst)\(\)/g, (match, model, method) => {
    return `prisma.${model}.${method}({ where: { businessId: req.businessId } })`;
  });

  // Fix findMany/count/findFirst WITH arguments but missing businessId
  // Uses negative lookahead to only replace if businessId is not already there
  code = code.replace(/prisma\.([a-zA-Z0-9_]+)\.(findMany|count|findFirst)\(\{\s*where:\s*\{(?!\s*businessId)/g, (match, model, method) => {
    return `prisma.${model}.${method}({ where: { businessId: req.businessId, `;
  });

  // Fix findMany/count/findFirst WITH arguments but NO where clause
  code = code.replace(/prisma\.([a-zA-Z0-9_]+)\.(findMany|count|findFirst)\(\{\s*(?!where:)/g, (match, model, method) => {
    return `prisma.${model}.${method}({ where: { businessId: req.businessId }, `;
  });

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Patched ${filename}`);
}

['inventory.controller.js', 'finances.controller.js', 'marketing.controller.js', 'services.controller.js', 'serviceSla.controller.js', 'dashboard.controller.js', 'appointments.controller.js', 'clients.controller.js'].forEach(processFile);
