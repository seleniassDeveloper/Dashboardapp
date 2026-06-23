import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSlug(slug) {
  console.log(`Checking business with slug: ${slug}`);
  try {
    const biz = await prisma.business.findFirst({
      where: { slug }
    });

    if (!biz) {
      console.log(`Business slug '${slug}' not found!`);
      return;
    }

    console.log(`Business ID: ${biz.id} | Name: ${biz.name} | BookingEnabled: ${biz.bookingEnabled}`);

    const services = await prisma.service.findMany({
      where: { businessId: biz.id }
    });
    console.log(`Services count: ${services.length}`);
    services.forEach(s => {
      console.log(`  Service: ${s.name} | isActive: ${s.isActive} | availableOnline: ${s.availableOnline}`);
    });

    const workers = await prisma.worker.findMany({
      where: { businessId: biz.id }
    });
    console.log(`Workers count: ${workers.length}`);
    workers.forEach(w => {
      console.log(`  Worker: ${w.firstName} ${w.lastName} | availableOnline: ${w.availableOnline}`);
    });
  } catch (e) {
    console.error(e);
  }
}

async function main() {
  await checkSlug("auradash");
  await checkSlug("auradashdigital");
  await prisma.$disconnect();
}

main();
