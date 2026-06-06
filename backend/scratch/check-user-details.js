import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking user demo@auradash.digital database records...");
    const user = await prisma.user.findFirst({
      where: { email: { equals: "demo@auradash.digital", mode: "insensitive" } }
    });
    
    if (!user) {
      console.log("User demo@auradash.digital not found!");
      // Let's print some users to see who is registered
      const someUsers = await prisma.user.findMany({ take: 5 });
      console.log("Registered users (sample):", someUsers);
      return;
    }

    console.log("Found User:", user);

    const memberships = await prisma.businessMember.findMany({
      where: { userId: user.id },
      include: {
        business: true,
        roleRel: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    console.log("User memberships count:", memberships.length);
    for (const member of memberships) {
      console.log(`- Membership in business '${member.business.name}' (ID: ${member.businessId}):`);
      console.log(`  Role: ${member.role}`);
      console.log(`  Status: ${member.status}`);
      console.log(`  roleRel detail:`, member.roleRel ? {
        id: member.roleRel.id,
        key: member.roleRel.key,
        name: member.roleRel.name,
        permissionsCount: member.roleRel.permissions?.length
      } : "null");
    }

    const allPermissions = await prisma.permission.findMany();
    console.log("Total permissions in DB:", allPermissions.length);
    console.log("Permissions list (sample):", allPermissions.slice(0, 10));

  } catch (error) {
    console.error("Error checking user details:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
