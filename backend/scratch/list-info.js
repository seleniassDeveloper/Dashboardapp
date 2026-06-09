import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const bizId = "cmpijqxpz0000ybdgguvtpheg";
  const services = await prisma.service.findMany({
    where: { businessId: bizId, isActive: true, availableOnline: true }
  });
  console.log("Services:", services.map(s => ({ id: s.id, name: s.name, duration: s.duration, price: s.price })));

  const workers = await prisma.worker.findMany({
    where: { businessId: bizId, availableOnline: true },
    include: {
      schedules: true,
      services: {
        include: { service: true }
      }
    }
  });
  console.log("Workers and schedules:");
  for (const w of workers) {
    console.log(`Worker: ${w.firstName} ${w.lastName} (ID: ${w.id})`);
    console.log(`  Services:`, w.services.map(ws => ws.service.name));
    console.log(`  Schedules:`, w.schedules.map(s => `Day ${s.dayOfWeek}: ${s.startTime}-${s.endTime}`));
  }

  await prisma.$disconnect();
}

main();
