import prisma from "../src/prisma.js";

async function main() {
  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: "cmqljgh0z0000jr01jl94utje"
    },
    orderBy: { startsAt: "asc" },
    include: {
      client: true,
      worker: true,
      service: true
    }
  });

  console.log(`FOUND ${appointments.length} APPOINTMENTS FOR BIZ 'auradash':`);
  for (const appt of appointments) {
    console.log(`- ID: ${appt.id} | Starts: ${appt.startsAt.toISOString()} | Status: ${appt.status}`);
    console.log(`  Client: ${appt.client?.firstName} ${appt.client?.lastName} (Phone: ${appt.client?.phone}, ID: ${appt.clientId})`);
    console.log(`  Service: ${appt.service?.name} | Worker: ${appt.worker?.firstName} ${appt.worker?.lastName}`);
    console.log(`  Notes: ${appt.notes}`);
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
