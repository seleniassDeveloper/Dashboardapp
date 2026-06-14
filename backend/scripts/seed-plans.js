import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    code: "starter",
    name: "Plan Starter",
    priceMonth: 1900, // $19.00 in cents
    priceYear: 19000, // $190.00 in cents
    currency: "USD",
    maxUsers: 3,
    maxBranches: 1,
    features: {
      calendar: true,
      clients: true,
      services: true,
      finance: false,
      inventory: false,
      workflows: false,
      automations: false,
      marketing: false
    }
  },
  {
    code: "pro",
    name: "Plan Pro",
    priceMonth: 4900, // $49.00 in cents
    priceYear: 49000, // $490.00 in cents
    currency: "USD",
    maxUsers: 10,
    maxBranches: 3,
    features: {
      calendar: true,
      clients: true,
      services: true,
      finance: true,
      inventory: true,
      workflows: true,
      automations: false,
      marketing: false
    }
  },
  {
    code: "business",
    name: "Plan Business",
    priceMonth: 9900, // $99.00 in cents
    priceYear: 99000, // $990.00 in cents
    currency: "USD",
    maxUsers: null,
    maxBranches: null,
    features: {
      calendar: true,
      clients: true,
      services: true,
      finance: true,
      inventory: true,
      workflows: true,
      automations: true,
      marketing: true
    }
  }
];

async function main() {
  console.log("Seeding subscription plans...");
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan
    });
    console.log(`Plan ${plan.name} (${plan.code}) seeded.`);
  }
  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
