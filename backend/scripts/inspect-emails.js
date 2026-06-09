import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("=== CLIENTS ===");
  const clients = await prisma.client.findMany({ select: { id: true, firstName: true, lastName: true, email: true } });
  console.log(clients);

  console.log("=== WORKERS ===");
  const workers = await prisma.worker.findMany({ select: { id: true, firstName: true, lastName: true, email: true } });
  console.log(workers);

  console.log("=== USERS ===");
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log(users);

  console.log("=== BUSINESSES ===");
  const businesses = await prisma.business.findMany({ select: { id: true, name: true, slug: true } });
  console.log(businesses);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
