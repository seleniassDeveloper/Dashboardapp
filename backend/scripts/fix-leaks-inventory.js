const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/inventory.controller.js');
let code = fs.readFileSync(file, 'utf8');

// 1. Fix seedInventoryIfNeeded
code = code.replace('async function seedInventoryIfNeeded() {', 'async function seedInventoryIfNeeded(req) {\n  const businessId = req.businessId;\n  if(!businessId) return;');

// 2. Fix calls to seedInventoryIfNeeded()
code = code.replace(/await seedInventoryIfNeeded\(\);/g, 'await seedInventoryIfNeeded(req);');

// 3. Inject businessId into data blocks in seedInventoryIfNeeded
code = code.replace(/data: \{/g, 'data: {\n          businessId,');

// Wait, the above will break other data blocks!
