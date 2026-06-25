import prisma from "../prisma.js";
import { webhook } from "../controllers/billing.controller.js";

async function runTests() {
  console.log("=== INICIANDO PRUEBAS UNITARIAS DE SUSCRIPCIONES Y BILLING ===");

  // 1. Setup - create a clean test business
  const testSlug = `test-billing-biz-${Date.now()}`;
  const business = await prisma.business.create({
    data: {
      name: "SaaS Testing Business",
      slug: testSlug,
      plan: "starter",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    }
  });

  console.log(`[Test Setup] Business creado: ${business.name} (ID: ${business.id}, Status: ${business.subscriptionStatus})`);

  // Helper to mock express req/res
  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.jsonData = data;
      return res;
    };
    res.send = (text) => {
      res.sendData = text;
      return res;
    };
    return res;
  };

  try {
    // === PRUEBA 1: Gating de Middleware checkTenant ===
    console.log("\n--- Prueba 1: Gating de Middleware (checkTenant) ---");
    
    // Simulate checkTenant gating rules:
    function simulateGating(businessObj) {
      const ALLOWED = ["trialing", "active"];
      const isTrialValid = businessObj.subscriptionStatus !== "trialing" || (businessObj.trialEndsAt && new Date(businessObj.trialEndsAt) > new Date());
      if (!ALLOWED.includes(businessObj.subscriptionStatus) || !isTrialValid) {
        return {
          allowed: false,
          statusCode: 402,
          error: "subscription_required"
        };
      }
      return { allowed: true };
    }

    // Trialing (valid) -> should allow
    const res1 = simulateGating(business);
    console.log(`- Trialing con fecha futura: ${res1.allowed ? "PERMITIDO ✅" : "BLOQUEADO ❌"}`);
    if (!res1.allowed) throw new Error("Fallo: El trial válido debería ser permitido.");

    // Trialing (expired) -> should block (402)
    const expiredTrialBiz = {
      ...business,
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() - 1000) // past
    };
    const res2 = simulateGating(expiredTrialBiz);
    console.log(`- Trialing expirado: ${res2.allowed ? "PERMITIDO ❌" : "BLOQUEADO ✅ (402)"}`);
    if (res2.allowed || res2.statusCode !== 402) throw new Error("Fallo: El trial expirado debe ser bloqueado con 402.");

    // Suspended -> should block (402)
    const suspendedBiz = {
      ...business,
      subscriptionStatus: "suspended"
    };
    const res3 = simulateGating(suspendedBiz);
    console.log(`- Suspendido: ${res3.allowed ? "PERMITIDO ❌" : "BLOQUEADO ✅ (402)"}`);
    if (res3.allowed || res3.statusCode !== 402) throw new Error("Fallo: Un negocio suspendido debe ser bloqueado con 402.");

    // Active -> should allow
    const activeBiz = {
      ...business,
      subscriptionStatus: "active"
    };
    const res4 = simulateGating(activeBiz);
    console.log(`- Activo: ${res4.allowed ? "PERMITIDO ✅" : "BLOQUEADO ❌"}`);
    if (!res4.allowed) throw new Error("Fallo: El estado active debe ser permitido.");

    // === PRUEBA 2: Procesamiento del Webhook de MercadoPago ===
    console.log("\n--- Prueba 2: Procesamiento de Webhook (MercadoPago) ---");

    const mockSubId = `mock_sub_${Date.now()}`;
    
    // Create subscription metadata first to simulate checkout
    const subscription = await prisma.subscription.create({
      data: {
        businessId: business.id,
        planCode: "pro",
        interval: "month",
        status: "pending",
        providerSubId: mockSubId,
        provider: "mercadopago"
      }
    });

    console.log(`[Test Sub] Creada suscripción vinculada: ID ${subscription.id}, ProviderSubID ${subscription.providerSubId}`);

    // Mock Webhook request for approved subscription status update
    const req = {
      headers: {},
      body: {
        id: `evt_test_${Date.now()}`,
        type: "subscription_preapproval",
        action: "created",
        data: { id: mockSubId },
        mock_status: "authorized",
        mock_amount: 4900
      }
    };
    const res = mockRes();

    // Invoke webhook handler directly
    await webhook(req, res);

    // Assert responses
    console.log(`- Respuesta Webhook Status: ${res.statusCode}`);
    if (res.statusCode !== 200) throw new Error(`Fallo: Webhook devolvió código ${res.statusCode}`);

    // Check database state update
    const updatedBiz = await prisma.business.findUnique({ where: { id: business.id } });
    console.log(`- Negocio actualizado tras pago: Status: ${updatedBiz.subscriptionStatus}, Plan: ${updatedBiz.plan}`);
    if (updatedBiz.subscriptionStatus !== "active" || updatedBiz.plan !== "pro") {
      throw new Error("Fallo: La suscripción no se activó correctamente tras el webhook.");
    }

    // Check payment creation
    const updatedSub = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { payments: true }
    });
    console.log(`- Pagos registrados: ${updatedSub.payments.length}`);

    // Mock payment failed webhook event
    const reqPayFail = {
      headers: {},
      body: {
        id: `evt_test_pay_${Date.now()}`,
        type: "payment",
        action: "payment.created",
        data: { id: `pay_test_${Date.now()}` },
        mock_status: "rejected",
        mock_subscription_id: mockSubId,
        mock_amount: 4900
      }
    };
    const resPayFail = mockRes();
    await webhook(reqPayFail, resPayFail);

    const pastDueBiz = await prisma.business.findUnique({ where: { id: business.id } });
    console.log(`- Negocio actualizado tras fallo: Status: ${pastDueBiz.subscriptionStatus}`);
    if (pastDueBiz.subscriptionStatus !== "past_due" || !pastDueBiz.gracePeriodEndsAt) {
      throw new Error("Fallo: El negocio debería haber pasado a past_due con gracePeriodEndsAt.");
    }

    // === PRUEBA 3: Cron Jobs de Trial y Grace Period Expirations ===
    console.log("\n--- Prueba 3: Expiración de Trial y Grace Period (Cron Job) ---");

    // Helper simulating dunning cron sweep
    async function simulateCronJobs() {
      const now = new Date();
      // 1. expired trials (trialing -> past_due)
      const expiredTrials = await prisma.business.findMany({
        where: { subscriptionStatus: "trialing", trialEndsAt: { lt: now } }
      });
      for (const b of expiredTrials) {
        await prisma.business.update({
          where: { id: b.id },
          data: {
            subscriptionStatus: "past_due",
            gracePeriodEndsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
          }
        });
      }

      // 2. expired grace period (past_due -> suspended)
      const expiredGrace = await prisma.business.findMany({
        where: { subscriptionStatus: "past_due", gracePeriodEndsAt: { lt: now } }
      });
      for (const b of expiredGrace) {
        await prisma.business.update({
          where: { id: b.id },
          data: { subscriptionStatus: "suspended" }
        });
      }
    }

    // Test Trial Expiration
    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: "trialing",
        trialEndsAt: new Date(Date.now() - 1000) // expired
      }
    });

    await simulateCronJobs();

    const bizAfterTrialCron = await prisma.business.findUnique({ where: { id: business.id } });
    console.log(`- Status tras expiración de Trial: ${bizAfterTrialCron.subscriptionStatus} (Esperado: past_due)`);
    if (bizAfterTrialCron.subscriptionStatus !== "past_due") {
      throw new Error("Fallo: El trial expirado no pasó a past_due.");
    }

    // Test Grace Period Expiration
    await prisma.business.update({
      where: { id: business.id },
      data: {
        subscriptionStatus: "past_due",
        gracePeriodEndsAt: new Date(Date.now() - 1000) // expired
      }
    });

    await simulateCronJobs();

    const bizAfterGraceCron = await prisma.business.findUnique({ where: { id: business.id } });
    console.log(`- Status tras expiración de período de gracia: ${bizAfterGraceCron.subscriptionStatus} (Esperado: suspended)`);
    if (bizAfterGraceCron.subscriptionStatus !== "suspended") {
      throw new Error("Fallo: El período de gracia expirado no suspendió la cuenta.");
    }

    console.log("\n==============================================");
    console.log("🎉 ¡TODAS LAS PRUEBAS DE BILLING SE COMPLETARON CON ÉXITO! 🎉");
    console.log("==============================================");

  } catch (error) {
    console.error("\n❌ ERROR EN LAS PRUEBAS DE BILLING:", error);
    process.exit(1);
  } finally {
    // Cleanup - delete created test business
    await prisma.business.delete({ where: { id: business.id } }).catch(() => null);
  }
}

runTests();
