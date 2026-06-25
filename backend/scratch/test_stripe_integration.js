import dotenv from "dotenv";
import { resolve } from "node:path";
dotenv.config({ path: resolve(process.cwd(), ".env") });

import { StripeProvider } from "../src/services/billing/stripe.provider.js";
import { checkout, webhook, cancel } from "../src/controllers/billing.controller.js";
import prisma from "../src/prisma.js";

async function runTests() {
  console.log("=== STARTING STRIPE INTEGRATION TESTS ===");

  // 1. Test StripeProvider initialization & mock mode
  console.log("\n1. Testing StripeProvider mock checks...");
  const provider = new StripeProvider();
  
  // Test mock createSubscription
  console.log("Testing createSubscription mock...");
  const mockBiz = { id: "biz_test_123" };
  const mockPlan = { code: "starter", name: "Starter Plan", priceMonth: 1900, priceYear: 19900 };
  const subResult = await provider.createSubscription(mockBiz, mockPlan, "month", "test@auradash.com");
  console.log("Sub result:", subResult);
  if (!subResult.providerSubId.startsWith("mock_stripe_sub_")) {
    throw new Error("createSubscription mock returned invalid sub id");
  }
  if (!subResult.checkoutUrl.includes("provider=stripe")) {
    throw new Error("createSubscription mock checkoutUrl should indicate stripe provider");
  }
  console.log("✔ createSubscription mock works!");

  // Test mock parseEvent
  console.log("\n2. Testing parseEvent mock...");
  const mockPayload = {
    id: "evt_mock_999",
    type: "customer.subscription.updated",
    mock_status: "active",
    mock_amount: 1900,
    mock_subscription_id: "mock_stripe_sub_xyz",
    mock_business_id: "biz_test_123",
    mock_plan_code: "starter"
  };
  const parsedEvent = await provider.parseEvent(mockPayload, {});
  console.log("Parsed mock event:", parsedEvent);
  if (parsedEvent.providerSubId !== "mock_stripe_sub_xyz" || parsedEvent.status !== "active") {
    throw new Error("parseEvent mock failed mapping");
  }
  console.log("✔ parseEvent mock works!");

  // Test controller checkout with mock request/response
  console.log("\n3. Testing checkout controller routing...");
  // Create or fetch a test plan and business in database to ensure the query works or use mocks if db fails
  let testBusinessId = "biz_test_123";
  let testPlanCode = "starter";
  try {
    const dbPlan = await prisma.plan.upsert({
      where: { code: testPlanCode },
      update: {},
      create: {
        code: testPlanCode,
        name: "Starter Plan",
        priceMonth: 1900,
        priceYear: 19900,
        isActive: true,
        features: ["Feature 1"]
      }
    });

    const dbBiz = await prisma.business.upsert({
      where: { id: testBusinessId },
      update: {},
      create: {
        id: testBusinessId,
        name: "Test Business",
        slug: "test-business",
        plan: "starter",
        subscriptionStatus: "pending"
      }
    });
    console.log("Database records ready for integration test.");
  } catch (err) {
    console.warn("DB connection not active, skipping database integration tests, testing static mock logic only.", err.message);
    return;
  }

  // Checkout request simulation for Stripe
  const mockReq = {
    body: {
      planCode: "starter",
      interval: "month",
      provider: "stripe"
    },
    businessId: testBusinessId,
    user: { email: "owner@test.com" }
  };

  let jsonResponse = null;
  let statusSet = null;
  const mockRes = {
    status(s) {
      statusSet = s;
      return this;
    },
    json(obj) {
      jsonResponse = obj;
      return this;
    }
  };

  await checkout(mockReq, mockRes);
  console.log("Checkout Controller status:", statusSet, "response:", jsonResponse);
  if (statusSet !== 201 || !jsonResponse.success || !jsonResponse.providerSubId.startsWith("mock_stripe_sub_")) {
    throw new Error("Checkout controller failed to process stripe checkout");
  }
  console.log("✔ Checkout controller dynamic Stripe provider selection works!");

  // Webhook request simulation for Stripe (Mock Event)
  console.log("\n4. Testing webhook controller routing for Stripe...");
  const mockWebhookReq = {
    headers: {
      "stripe-signature": "mock-signature-here"
    },
    body: {
      id: "evt_webhook_test_1",
      type: "customer.subscription.updated",
      mock_status: "active",
      mock_amount: 1900,
      mock_subscription_id: jsonResponse.providerSubId,
      mock_business_id: testBusinessId,
      mock_plan_code: "starter"
    }
  };

  let webhookSentText = null;
  let webhookStatus = null;
  const mockWebhookRes = {
    status(s) {
      webhookStatus = s;
      return this;
    },
    send(text) {
      webhookSentText = text;
      return this;
    },
    json(obj) {
      webhookSentText = JSON.stringify(obj);
      return this;
    }
  };

  await webhook(mockWebhookReq, mockWebhookRes);
  console.log("Webhook Controller status:", webhookStatus, "response:", webhookSentText);
  if (webhookStatus !== 200 || webhookSentText !== "Webhook Processed") {
    throw new Error("Webhook controller failed to process mock Stripe event");
  }
  console.log("✔ Webhook controller processed Stripe event successfully!");

  // Verify that the subscription in DB is indeed updated
  const updatedSub = await prisma.subscription.findUnique({
    where: { businessId: testBusinessId }
  });
  console.log("Updated subscription in DB:", updatedSub);
  if (updatedSub.status !== "active" || updatedSub.provider !== "stripe") {
    throw new Error("Subscription database update mismatch!");
  }
  console.log("✔ Webhook successfully updated Subscription status to 'active' and set provider to 'stripe' in database!");

  // Clean up
  await prisma.subscription.deleteMany({ where: { businessId: testBusinessId } });
  await prisma.webhookEvent.deleteMany({ where: { eventId: "evt_webhook_test_1" } });
  console.log("\n✔ Cleanup done. ALL TESTS PASSED SUCCESSFULLY!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
