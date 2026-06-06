import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Fetching user...");
    const user = await prisma.user.findFirst({
      where: { email: "demo@auradash.digital" },
      include: {
        role: {
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

    if (!user) {
      console.log("User demo@auradash.digital not found.");
      
      console.log("Checking all users in DB:");
      const allUsers = await prisma.user.findMany({
        include: { role: true }
      });
      for (const u of allUsers) {
        console.log(`- Email: ${u.email}, Role: ${u.role?.name}`);
      }
      return;
    }

    console.log("User:", user.email);
    console.log("Role:", user.role?.name);
    console.log("Permissions:");
    if (user.role?.permissions) {
      for (const rp of user.role.permissions) {
        console.log(`- ${rp.permission.action} (${rp.permission.description})`);
      }
    } else {
      console.log("No permissions found for role.");
    }
  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
