import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const roles = await prisma.role.findMany();
    console.log("Roles in DB:");
    roles.forEach(r => console.log(`- ID: ${r.id}, Name: ${r.name}`));

    const memberships = await prisma.businessMember.findMany({
      include: {
        user: true,
        roleRel: true,
      }
    });

    console.log("\nMemberships with Role Details:");
    memberships.forEach((m) => {
      console.log(`- User: ${m.user?.email}, BusinessID: ${m.businessId}, Role: ${m.roleRel?.name} (ID: ${m.roleId})`);
    });
  } catch (error) {
    console.error("Error listing roles/memberships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
