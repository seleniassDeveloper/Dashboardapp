const fs = require("fs");
const path = require("path");

function addBusinessIdFilter(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // Reemplazar `prisma.<model>.findMany()` con `prisma.<model>.findMany({ where: { businessId: req.businessId } })`
  content = content.replace(/prisma\.([a-zA-Z]+)\.findMany\(\)/g, "prisma.$1.findMany({ where: { businessId: req.businessId } })");

  // Reemplazar `prisma.<model>.findMany({` con `prisma.<model>.findMany({ where: { businessId: req.businessId },`
  // Pero necesitamos asegurarnos de que no haya ya un `where:`. Si lo hay, es más difícil con regex simple, pero veamos.
  content = content.replace(/prisma\.([a-zA-Z]+)\.findMany\(\{\s*/g, (match, model) => {
     return `prisma.${model}.findMany({ where: { businessId: req.businessId }, `;
  });

  // Arreglar `where: { businessId: req.businessId }, where: {` que pudo haberse creado
  content = content.replace(/where:\s*\{\s*businessId:\s*req\.businessId\s*\}\,\s*where:\s*\{/g, "where: { businessId: req.businessId, ");

  fs.writeFileSync(filePath, content, "utf8");
}

addBusinessIdFilter(path.join(__dirname, "../src/controllers/inventory.controller.js"));
addBusinessIdFilter(path.join(__dirname, "../src/controllers/finances.controller.js"));
addBusinessIdFilter(path.join(__dirname, "../src/controllers/marketing.controller.js"));
addBusinessIdFilter(path.join(__dirname, "../src/controllers/services.controller.js"));
addBusinessIdFilter(path.join(__dirname, "../src/controllers/serviceSla.controller.js"));
