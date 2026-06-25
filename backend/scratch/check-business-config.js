import prisma from "../src/prisma.js";

async function main() {
  const business = await prisma.business.findUnique({
    where: { id: "cmqljgh0z0000jr01jl94utje" }
  });

  if (!business) {
    console.log("Business not found!");
    return;
  }

  console.log("Business Name:", business.name);
  console.log("Slug:", business.slug);
  console.log("Integrations:", JSON.stringify(business.integrations, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
