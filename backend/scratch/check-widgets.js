import prisma from "../src/prisma.js";

async function main() {
  const widgets = await prisma.dashboardWidget.findMany({
    orderBy: { createdAt: "desc" }
  });

  console.log("DASHBOARD WIDGETS:");
  for (const w of widgets) {
    console.log(`- ID: ${w.id}`);
    console.log(`  Title: ${w.title}`);
    console.log(`  Type: ${w.type}`);
    console.log(`  Config: ${JSON.stringify(w.config)}`);
    console.log(`  Layout: ${JSON.stringify(w.layout)}`);
    console.log(`  BusinessId: ${w.businessId}`);
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
