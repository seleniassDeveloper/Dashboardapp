import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  console.log("Connecting to DB...");
  try {
    const res = await prisma.planRequest.create({
      data: {
        businessId: "cm2xs2s5k0005zbfx4e1t10r3", // A random businessId from previous curl
        requestedPlan: "pro",
        approvalToken: "test-token"
      }
    });
    console.log("Created successfully:", res);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
