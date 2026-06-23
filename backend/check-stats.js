import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function showStats(id, name) {
  console.log(`=============================`);
  console.log(`Business: ${name} (${id})`);
  try {
    const clientsCount = await prisma.client.count({ where: { businessId: id } });
    const workersCount = await prisma.worker.count({ where: { businessId: id } });
    const apptsCount = await prisma.appointment.count({ where: { businessId: id } });

    console.log(`Clients count: ${clientsCount}`);
    console.log(`Workers count: ${workersCount}`);
    console.log(`Appointments count: ${apptsCount}`);

    const workers = await prisma.worker.findMany({ where: { businessId: id } });
    console.log(`Workers: ${workers.map(w => `${w.firstName} ${w.lastName}`).join(", ")}`);
  } catch (e) {
    console.error(e);
  }
}

async function main() {
  const businesses = await prisma.business.findMany();
  for (const b of businesses) {
    await showStats(b.id, b.name);
  }
  await prisma.$disconnect();
}

main();
