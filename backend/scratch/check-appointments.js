import prisma from "../src/prisma.js";

async function main() {
  const appointments = await prisma.appointment.findMany({
    orderBy: { startsAt: "desc" },
    take: 10,
    include: {
      client: true,
      worker: true,
      service: true,
      business: true
    }
  });

  console.log("RECENT APPOINTMENTS:");
  if (appointments.length === 0) {
    console.log("No appointments found in the database!");
  }
  for (const appt of appointments) {
    console.log(`- ID: ${appt.id}`);
    console.log(`  StartsAt: ${appt.startsAt} (${appt.startsAt.toISOString()})`);
    console.log(`  Status: ${appt.status}`);
    console.log(`  Client: ${appt.client?.firstName} ${appt.client?.lastName} (ID: ${appt.clientId})`);
    console.log(`  Worker: ${appt.worker?.firstName} ${appt.worker?.lastName} (ID: ${appt.workerId})`);
    console.log(`  Service: ${appt.service?.name} (ID: ${appt.serviceId})`);
    console.log(`  Business: ${appt.business?.name} (Slug: ${appt.business?.slug}, ID: ${appt.businessId})`);
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
