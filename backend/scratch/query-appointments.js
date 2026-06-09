import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: new Date("2026-06-01T00:00:00.000Z")
        }
      },
      orderBy: { startsAt: "desc" },
      include: {
        client: true,
        worker: true,
        service: true,
        business: true
      }
    });
    for (const a of appointments) {
      console.log(`ID: ${a.id} | Date: ${a.startsAt} | Status: ${a.status} | Business: ${a.business?.name} (${a.businessId}) | Client: ${a.client?.firstName} ${a.client?.lastName} | Worker: ${a.worker?.firstName} | Source: ${a.source}`);
    }
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
