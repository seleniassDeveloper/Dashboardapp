const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../src/controllers");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

files.forEach(f => {
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  const lines = code.split("\n");
  let inPrisma = false;
  let hasWhere = false;
  let hasBusinessId = false;
  let currentCall = [];
  let currentLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("prisma.") && (line.includes(".findFirst") || line.includes(".findMany") || line.includes(".update") || line.includes(".delete") || line.includes(".create"))) {
      if (!line.includes("businessId")) {
        console.log(`Potential leak in ${f}:${i+1} -> ${line.trim()}`);
      }
    }
  }
});
