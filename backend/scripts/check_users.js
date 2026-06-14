import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          business: true
        }
      }
    }
  });

  console.log("=== Users in DB ===");
  users.forEach(u => {
    console.log(`ID (UID): ${u.id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.name}`);
    console.log(`Memberships: ${u.memberships.length}`);
    u.memberships.forEach(m => {
      console.log(`  - Business: ${m.business.name} (${m.business.slug}), Role: ${m.role}, Status: ${m.status}`);
    });
    console.log("-------------------");
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
