import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Consultando businesses...");
  try {
    const businesses = await prisma.business.findMany();
    console.log(`Total businesses: ${businesses.length}`);
    businesses.forEach(b => {
      console.log(`ID: ${b.id} | Name: ${b.name} | Slug: ${b.slug} | PrimaryColor: ${b.bookingPrimaryColor}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
