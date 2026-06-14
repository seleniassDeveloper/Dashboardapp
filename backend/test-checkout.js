import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getFirebaseAuth } from "./src/services/firebaseAdmin.js";
import crypto from "crypto";

const prisma = new PrismaClient();

async function run() {
  console.log("Setting up test data...");
  try {
    // 1. Create a test user
    const userId = "test-checkout-user";
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "test-checkout@example.com",
        firstName: "Test",
        lastName: "User",
        name: "Test User"
      }
    });

    // 2. Create a test business
    const biz = await prisma.business.upsert({
      where: { slug: "test-checkout-biz" },
      update: {},
      create: {
        name: "Test Checkout Biz",
        slug: "test-checkout-biz",
        industry: "Test",
        bookingEnabled: true
      }
    });

    // 3. Create a role
    const role = await prisma.role.findFirst({ where: { key: "owner" } });
    
    // 4. Create membership
    await prisma.businessMember.upsert({
      where: { userId_businessId: { userId, businessId: biz.id } },
      update: {},
      create: {
        userId,
        businessId: biz.id,
        roleId: role.id,
        role: "owner",
        status: "ACTIVE"
      }
    });

    console.log("Test data ready. Business ID:", biz.id);
    
    // Create a local token
    const token = `local-token-${userId}`;

    console.log("Calling API with token...");
    const fetch = (await import('node-fetch')).default;
    
    const startTime = Date.now();
    const res = await fetch("https://dashboard-api-r6j9.onrender.com/api/billing/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        planCode: "pro",
        interval: "month"
      })
    });
    
    const duration = Date.now() - startTime;
    const json = await res.json();
    
    console.log(`Response received in ${duration}ms:`, res.status, json);
    
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
