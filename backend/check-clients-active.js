import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const id = "cmqljgh0z0000jr01jl94utje";
  try {
    const total = await prisma.client.count({ where: { businessId: id } });
    const active = await prisma.client.count({ where: { businessId: id, isActive: true } });
    console.log(`Business AuraDash (999 clients DB) -> Total: ${total} | Active: ${active}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
