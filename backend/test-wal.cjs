const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
  await prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
  const res = await prisma.$queryRawUnsafe(`PRAGMA journal_mode;`);
  console.log("Journal mode:", res);
}
run().then(() => prisma.$disconnect());
