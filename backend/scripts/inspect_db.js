import prisma from "../src/prisma.js";

async function main() {
  const businesses = await prisma.business.findMany();
  console.log("=== Businesses ===");
  console.log(JSON.stringify(businesses, null, 2));
}

main()
  .catch(err => {
    console.error(err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
