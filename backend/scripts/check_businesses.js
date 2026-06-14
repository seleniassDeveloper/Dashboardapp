import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });

  console.log("=== Businesses ===");
  businesses.forEach(b => {
    console.log(`ID: ${b.id}`);
    console.log(`Name: ${b.name}`);
    console.log(`Slug: ${b.slug}`);
    console.log(`Plan: ${b.plan}`);
    console.log(`Status: ${b.subscriptionStatus}`);
    console.log(`Trial Ends: ${b.trialEndsAt}`);
    console.log(`Created At: ${b.createdAt}`);
    console.log(`Members: ${b.members.length}`);
    b.members.forEach(m => {
      console.log(`  - User Email: ${m.user?.email || m.userId}, Role: ${m.role}`);
    });
    console.log("-------------------");
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
