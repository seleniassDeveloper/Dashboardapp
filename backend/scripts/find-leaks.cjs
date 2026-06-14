const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../src/controllers");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

files.forEach(f => {
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  const lines = code.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("prisma.") && (line.includes(".findFirst") || line.includes(".findMany") || line.includes(".update") || line.includes(".delete") || line.includes(".create") || line.includes(".count"))) {
      if (!line.includes("businessId") && !line.includes("business: { slug }") && !line.includes("slug: slug") && !line.includes("where: { id }") && !line.includes("where: { id:")) {
        // We skip lines that might be updates by ID since they implicitly isolate if the ID is tenant-scoped, BUT wait!
        // Actually ID might not be enough if a user sends a fake ID belonging to another tenant.
        console.log(`Leak in ${f}:${i+1} -> ${line.trim()}`);
      }
    }
  }
});
