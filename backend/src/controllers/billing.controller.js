import prisma from "../prisma.js";
import crypto from "crypto";
import { sendReminderEmail } from "../services/mailer.js";
import { MercadoPagoProvider } from "../services/billing/mercadopago.provider.js";
import { StripeProvider } from "../services/billing/stripe.provider.js";

export async function getPlans(req, res) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true }
    });
    return res.json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({ success: false, error: "No se pudieron obtener los planes de facturación." });
  }
}

export async function getSubscription(req, res) {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, error: "Identificador del negocio requerido." });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: {
          include: {
            payments: {
              orderBy: { createdAt: "desc" },
              take: 20
            }
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }

    return res.json({
      success: true,
      plan: business.plan,
      subscriptionStatus: business.subscriptionStatus,
      trialEndsAt: business.trialEndsAt,
      currentPeriodEnd: business.currentPeriodEnd,
      gracePeriodEndsAt: business.gracePeriodEndsAt,
      subscription: business.subscription
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return res.status(500).json({ success: false, error: "No se pudo obtener el estado de la suscripción." });
  }
}

export async function checkout(req, res) {
  try {
    const { planCode, interval, provider } = req.body;
    const businessId = req.businessId;

    if (!planCode || !interval) {
      return res.status(400).json({ success: false, error: "planCode e interval ('month' | 'year') son obligatorios." });
    }

    const plan = await prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan) {
      return res.status(404).json({ success: false, error: "El plan seleccionado no existe." });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return res.status(404).json({ success: false, error: "Negocio no encontrado." });
    }

    const email = req.user?.email || `${businessId}@auradash.com`;

    if (provider === "manual") {
      await prisma.planRequest.deleteMany({
        where: {
          businessId,
          status: "PENDING"
        }
      });

      const approvalToken = crypto.randomBytes(32).toString("hex");
      await prisma.planRequest.create({
        data: {
          businessId,
          requestedPlan: planCode,
          status: "PENDING",
          approvalToken
        }
      });

      await prisma.subscription.upsert({
        where: { businessId },
        update: {
          planCode,
          interval,
          status: "pending",
          providerSubId: `manual_${businessId}_${Date.now()}`,
          provider: "manual",
          cancelAtPeriodEnd: false
        },
        create: {
          businessId,
          planCode,
          interval,
          status: "pending",
          providerSubId: `manual_${businessId}_${Date.now()}`,
          provider: "manual"
        }
      });

      return res.status(201).json({
        success: true,
        isRequest: true,
        message: "Tu solicitud de acceso manual ha sido enviada al administrador. Se activará una vez que sea aprobada."
      });
    }

    const providerName = provider === "mercadopago" ? "mercadopago" : "stripe";
    const activeProvider = providerName === "stripe" ? new StripeProvider() : new MercadoPagoProvider();

    const { providerSubId, checkoutUrl } = await activeProvider.createSubscription(
      business,
      plan,
      interval,
      email
    );

    // Upsert subscription metadata in database in status pending
    await prisma.subscription.upsert({
      where: { businessId },
      update: {
        planCode,
        interval,
        status: "pending",
        providerSubId,
        provider: providerName,
        cancelAtPeriodEnd: false
      },
      create: {
        businessId,
        planCode,
        interval,
        status: "pending",
        providerSubId,
        provider: providerName
      }
    });

    // Clean up previous pending requests for this business to avoid clutter
    await prisma.planRequest.deleteMany({
      where: {
        businessId,
        status: "PENDING"
      }
    });

    // Create a pending plan request so it appears in the SuperAdmin console
    const approvalToken = crypto.randomBytes(32).toString("hex");
    await prisma.planRequest.create({
      data: {
        businessId,
        requestedPlan: planCode,
        status: "PENDING",
        approvalToken
      }
    });

    return res.status(201).json({
      success: true,
      checkoutUrl,
      providerSubId
    });
  } catch (error) {
    console.error("Error during checkout setup:", error);
    return res.status(500).json({ success: false, error: error.message || "Error al iniciar el checkout." });
  }
}

export async function cancel(req, res) {
  try {
    const businessId = req.businessId;
    const subscription = await prisma.subscription.findUnique({ where: { businessId } });
    
    if (!subscription || !subscription.providerSubId) {
      return res.status(404).json({ success: false, error: "No se encontró una suscripción activa para cancelar." });
    }

    const provider = subscription.provider === "stripe" ? new StripeProvider() : new MercadoPagoProvider();
    await provider.cancelSubscription(subscription.providerSubId);

    // Mark subscription to cancel at period end in database
    await prisma.subscription.update({
      where: { businessId },
      data: { cancelAtPeriodEnd: true }
    });

    return res.json({ success: true, message: "Tu suscripción ha sido cancelada y no se renovará en el próximo período." });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({ success: false, error: error.message || "Error al cancelar la suscripción." });
  }
}

export async function webhook(req, res) {
  const isStripe = !!req.headers?.["stripe-signature"];
  const provider = isStripe ? new StripeProvider() : new MercadoPagoProvider();
  
  try {
    // 2. Parse details from webhook payload using PaymentProvider
    const event = await provider.parseEvent(req.body, req.headers);
    console.log("Parsed webhook event:", event);

    const eventId = event.eventId;

    // 1. Check if event is processed
    const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (alreadyProcessed) {
      return res.status(200).json({ success: true, message: "Event already processed (idempotent)" });
    }

    let payloadJson;
    if (isStripe) {
      if (Buffer.isBuffer(req.body)) {
        payloadJson = JSON.parse(req.body.toString("utf8"));
      } else if (typeof req.body === "string") {
        payloadJson = JSON.parse(req.body);
      } else {
        payloadJson = req.body || {};
      }
    } else {
      payloadJson = req.body || {};
    }

    if (!event.providerSubId) {
      // Create record to block repeat notifications of un-mapped webhooks
      await prisma.webhookEvent.create({
        data: {
          eventId,
          provider: isStripe ? "stripe" : "mercadopago",
          type: event.type || "unknown",
          payload: payloadJson
        }
      });
      return res.status(200).json({ success: true, message: "Event ignored: no subscription relation." });
    }

    // 3. Find the subscription in our PostgreSQL database
    const subscription = await prisma.subscription.findFirst({
      where: { providerSubId: event.providerSubId }
    });

    if (!subscription) {
      console.warn(`Webhook subscription correlation not found for: ${event.providerSubId}`);
      return res.status(200).json({ success: true, message: "Subscription not found in database" });
    }

    const now = new Date();
    const periodIntervalMs = subscription.interval === "year" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const currentPeriodEnd = new Date(now.getTime() + periodIntervalMs);

    // 4. Update databases inside a transaction
    await prisma.$transaction(async (tx) => {
      // Record webhook event to guarantee idempotency
      await tx.webhookEvent.create({
        data: {
          eventId,
          provider: isStripe ? "stripe" : "mercadopago",
          type: event.type,
          payload: payloadJson
        }
      });

      if (event.type === "subscription") {
        if (event.status === "authorized" || event.status === "active") {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: "active", currentPeriodEnd }
          });
          await tx.business.update({
            where: { id: subscription.businessId },
            data: {
              subscriptionStatus: "active",
              plan: subscription.planCode,
              currentPeriodEnd,
              gracePeriodEndsAt: null
            }
          });
        } else if (event.status === "cancelled" || event.status === "canceled") {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: "canceled" }
          });
          await tx.business.update({
            where: { id: subscription.businessId },
            data: { subscriptionStatus: "canceled" }
          });
        }
      }

      if (event.type === "payment") {
        const isApproved = event.status === "approved" || event.status === "active";
        
        await tx.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: event.amount || 0,
            currency: "USD",
            status: event.status,
            providerPayId: event.providerPayId,
            paidAt: isApproved ? now : null
          }
        });

        if (isApproved) {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: "active", currentPeriodEnd }
          });
          await tx.business.update({
            where: { id: subscription.businessId },
            data: {
              subscriptionStatus: "active",
              plan: subscription.planCode,
              currentPeriodEnd,
              gracePeriodEndsAt: null
            }
          });
        } else {
          // If payment fails (rejected, past due)
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { status: "past_due" }
          });
          await tx.business.update({
            where: { id: subscription.businessId },
            data: {
              subscriptionStatus: "past_due",
              gracePeriodEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days grace period
            }
          });
        }
      }
    });

    return res.status(200).send("Webhook Processed");
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
}

export async function quickApprove(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("<h1>Token no proporcionado</h1>");

    const request = await prisma.planRequest.findUnique({ where: { approvalToken: token } });
    if (!request) return res.status(404).send("<h1>Solicitud no encontrada o enlace inválido</h1>");
    if (request.status !== "PENDING") return res.status(400).send(`<h1>La solicitud ya ha sido procesada (${request.status}).</h1>`);

    await prisma.$transaction(async (tx) => {
      await tx.planRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED" }
      });
      await tx.business.update({
        where: { id: request.businessId },
        data: {
          plan: request.requestedPlan,
          subscriptionStatus: "active"
        }
      });
      const sub = await tx.subscription.findUnique({ where: { businessId: request.businessId } });
      if (sub) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { planCode: request.requestedPlan, status: "active" }
        });
      }
    });

    return res.status(200).send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1 style="color: #10b981;">✅ Acceso Aprobado Exitosamente</h1>
        <p>El plan <b>${request.requestedPlan.toUpperCase()}</b> se ha otorgado al negocio ID: ${request.businessId}.</p>
        <p>El usuario ya puede acceder a los módulos de su nuevo plan.</p>
        <br/><br/>
        <a href="https://dashboard-api-r6j9.onrender.com" style="text-decoration: none; color: #7c3aed; font-weight: bold;">Cerrar esta ventana</a>
      </div>
    `);

  } catch (error) {
    console.error("Quick Approve Error:", error);
    return res.status(500).send("<h1>Error Interno del Servidor</h1>");
  }
}
