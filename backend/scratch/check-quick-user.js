import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const userId = "quick-booking-user";
    console.log("Checking user database record for quick-booking-user...");
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log("User quick-booking-user not found!");
      return;
    }
    console.log("User:", user);

    const memberships = await prisma.businessMember.findMany({
      where: { userId: userId },
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

    console.log("Memberships count:", memberships.length);
    for (const member of memberships) {
      console.log(`- Membership in business '${member.business.name}' (ID: ${member.businessId}):`);
      console.log(`  Role string stored: '${member.role}'`);
      console.log(`  Status: ${member.status}`);
      console.log(`  roleRel detail:`, member.roleRel ? {
        id: member.roleRel.id,
        key: member.roleRel.key,
        name: member.roleRel.name,
        permissionsCount: member.roleRel.permissions?.length
      } : "null");
      
      const roleKey = member.roleRel ? member.roleRel.key : null;
      let permissions = [];
      if (roleKey === "owner") {
        const allSystemPermissions = await prisma.permission.findMany();
        permissions = allSystemPermissions.map(p => p.action);
      } else if (member.roleRel) {
        permissions = member.roleRel.permissions.map(rp => rp.permission.action);
      }
      console.log(`  Resolved roleKey: '${roleKey}'`);
      console.log(`  Resolved permissions count: ${permissions.length}`);
      console.log(`  Resolved permissions list:`, permissions);
    }

    // Also let's print all roles in database
    const roles = await prisma.role.findMany();
    console.log("Total roles in DB:", roles.length);
    console.log("Roles keys in DB:", roles.map(r => r.key));

  } catch (error) {
    console.error("Error during check:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
