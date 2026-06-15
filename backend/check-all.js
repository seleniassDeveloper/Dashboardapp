import prisma from "./src/prisma.js";

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

  console.log("USERS IN POSTGRESQL:");
  for (const u of users) {
    console.log(`- ${u.email} (ID: ${u.id}, Status: ${u.status})`);
    for (const m of u.memberships) {
      console.log(`  -> Business: ${m.business.name} (Slug: ${m.business.slug}, Role: ${m.role})`);
    }
    if (u.memberships.length === 0) {
      console.log("  -> NO BUSINESSES!");
    }
  }

  // Check businesses without members?
  const bizs = await prisma.business.findMany({
    include: { members: true }
  });

  console.log("\nBUSINESSES:");
  for (const b of bizs) {
    console.log(`- ${b.name} (Slug: ${b.slug}, OwnerId: ${b.ownerId})`);
    if (b.members.length === 0) {
      console.log("  -> WARNING: NO MEMBERS!");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
