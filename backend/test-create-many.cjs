const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log(typeof prisma.expense.createManyAndReturn);
}
main().then(() => prisma.$disconnect());
