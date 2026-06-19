const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.expense.count();
  console.log('Total expenses:', count);
  const first5 = await prisma.expense.findMany({ take: 5, orderBy: { date: 'desc' } });
  console.log('Sample:', first5);
}
main().catch(console.error).finally(() => prisma.$disconnect());
