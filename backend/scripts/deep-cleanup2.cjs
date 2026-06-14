const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../src/controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

files.forEach(filename => {
  const filePath = path.join(controllersDir, filename);
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix where: { businessId: req.businessId,  businessId: req.businessId, ... } -> where: { businessId: req.businessId, ... }
  // We'll run this multiple times in case there are 3+ duplicates
  let prevCode;
  do {
    prevCode = code;
    code = code.replace(/businessId:\s*req\.businessId\s*,\s*businessId:\s*req\.businessId/g, 'businessId: req.businessId');
    
    // Sometimes it's `businessId: req.businessId,  id, businessId: req.businessId`
    // We can just strip out any trailing `, businessId: req.businessId` or `, businessId` if `businessId: req.businessId` is already there.
  } while (prevCode !== code);

  // General regex to remove all duplicate keys inside a { } block is risky.
  // Let's specifically fix what we broke:
  code = code.replace(/businessId:\s*req\.businessId,\s*businessId/g, 'businessId');
  code = code.replace(/businessId:\s*req\.businessId,\s*id:\s*([a-zA-Z0-9_]+),\s*businessId:\s*req\.businessId/g, 'businessId: req.businessId, id: $1');
  code = code.replace(/businessId:\s*req\.businessId,\s*id,\s*businessId:\s*req\.businessId/g, 'businessId: req.businessId, id');
  
  // Clean up: where: { businessId: req.businessId },  where: 
  code = code.replace(/where:\s*\{\s*businessId:\s*req\.businessId\s*\}\s*,\s*where:/g, "where:");

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Cleaned ${filename}`);
});
