import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const uid = 'VaXiH3WTEqWBqsc03cXtzUsix5x1'; // seleniadeveloper@gmail.com
  
  const user = await prisma.user.findUnique({ where: { id: uid } });
  console.log("User:", user);
  
  const members = await prisma.businessMember.findMany({ where: { userId: uid }, include: { business: true, roleRel: true } });
  console.log("Memberships:", members);
}

check().then(() => prisma.$disconnect());
