import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const reqs = await prisma.planRequest.findMany({
    where: { requestedPlan: "pro" }
  });
  console.log("PlanRequests:", reqs);
}
run();
