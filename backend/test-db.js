import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking DB connection...");
    
    console.log("1. Product count:");
    const pCount = await prisma.product.count();
    console.log("Product count:", pCount);

    console.log("2. Supplier count:");
    const sCount = await prisma.supplier.count();
    console.log("Supplier count:", sCount);

    console.log("3. Rule count:");
    const rCount = await prisma.serviceConsumptionRule.count();
    console.log("Rule count:", rCount);

    console.log("4. Movement count:");
    const mCount = await prisma.stockMovement.count();
    console.log("Movement count:", mCount);

    console.log("5. Branch count:");
    const bCount = await prisma.branch.count();
    console.log("Branch count:", bCount);

    console.log("6. Services count:");
    const svcCount = await prisma.service.count();
    console.log("Services count:", svcCount);

    console.log("7. Run getInventoryDashboardData logic:");
    const products = await prisma.product.findMany({
      include: { provider: true }
    });
    console.log("Products loaded:", products.length);

    console.log("8. Appointments count:");
    const appts = await prisma.appointment.count({ where: { status: "DONE" } });
    console.log("Appointments status DONE:", appts);

    console.log("All queries executed successfully!");
  } catch (error) {
    console.error("DB QUERY ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
