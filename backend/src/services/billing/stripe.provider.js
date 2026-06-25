import Stripe from "stripe";
import { PaymentProvider } from "./paymentProvider.js";

const isMock = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("mock_");
const stripe = isMock ? null : new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripeProvider extends PaymentProvider {
  async createSubscription(business, plan, interval, email) {
    if (isMock) {
      const providerSubId = `mock_stripe_sub_${Math.random().toString(36).substr(2, 9)}`;
      const price = interval === "month" ? plan.priceMonth : plan.priceYear;
      const checkoutUrl = `${process.env.APP_BASE_URL || "http://localhost:5173"}/app/settings?tab=subscription&mock_checkout=true&providerSubId=${providerSubId}&planCode=${plan.code}&interval=${interval}&price=${price}&provider=stripe`;
      return { providerSubId, checkoutUrl };
    }

    let priceId = "";
    if (plan.code === "starter") {
      priceId = process.env.STRIPE_PRICE_STARTER;
    } else if (plan.code === "pro" || plan.code === "growth") {
      priceId = process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_GROWTH;
    } else if (plan.code === "business" || plan.code === "aipro") {
      priceId = process.env.STRIPE_PRICE_BUSINESS || process.env.STRIPE_PRICE_AIPRO;
    }

    if (!priceId) {
      throw new Error(`Stripe Price ID no configurado para el plan: ${plan.code}`);
    }

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        businessId: business.id,
        planCode: plan.code,
      },
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          businessId: business.id,
          planCode: plan.code,
        },
      },
      success_url: `${appBaseUrl}/app/settings?tab=subscription&stripe_success=true`,
      cancel_url: `${appBaseUrl}/app/settings?tab=subscription`,
    });

    return {
      providerSubId: session.id,
      checkoutUrl: session.url,
    };
  }

  async cancelSubscription(providerSubId) {
    const isSubMock = isMock || providerSubId.startsWith("mock_");
    if (isSubMock) {
      return true;
    }

    await stripe.subscriptions.cancel(providerSubId);
    return true;
  }

  async verifyWebhook(req) {
    if (isMock) return true;

    const signature = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    try {
      // In Express raw body parser, req.body is a Buffer
      stripe.webhooks.constructEvent(req.body, signature, secret);
      return true;
    } catch (err) {
      console.error("[Stripe] Error en la verificación de firma del webhook:", err.message);
      return false;
    }
  }

  async parseEvent(payload, headers) {
    if (isMock) {
      const eventId = payload.id ? String(payload.id) : `evt_${Date.now()}`;
      const type = payload.type || "";
      const status = payload.mock_status || "active";
      const amount = payload.mock_amount || 1900;
      const providerSubId = payload.mock_subscription_id || "mock_stripe_sub_123";
      const businessId = payload.mock_business_id || "business-default";
      const planCode = payload.mock_plan_code || "starter";

      return {
        eventId,
        type: type === "payment" ? "payment" : "subscription",
        providerSubId,
        status,
        amount,
        businessId,
        planCode,
        raw: payload,
      };
    }

    const signature = headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    // payload is the raw request body Buffer
    const event = stripe.webhooks.constructEvent(payload, signature, secret);

    const eventId = event.id;
    let type = "unknown";
    let providerSubId = "";
    let status = "unknown";
    let amount = 0;
    let businessId = "";
    let planCode = "";

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      type = "subscription";
      providerSubId = session.subscription;
      status = "active";
      amount = session.amount_total || 0;
      businessId = session.metadata?.businessId || "";
      planCode = session.metadata?.planCode || "";
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      type = "subscription";
      providerSubId = subscription.id;
      businessId = subscription.metadata?.businessId || "";
      planCode = subscription.metadata?.planCode || "";
      amount = subscription.items.data[0]?.price?.unit_amount || 0;

      if (subscription.status === "active") {
        status = "active";
      } else if (subscription.status === "past_due") {
        status = "past_due";
      } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
        status = "cancelled";
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      type = "subscription";
      providerSubId = subscription.id;
      status = "cancelled";
      businessId = subscription.metadata?.businessId || "";
      planCode = subscription.metadata?.planCode || "";
      amount = subscription.items.data[0]?.price?.unit_amount || 0;
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      type = "payment";
      providerSubId = invoice.subscription;
      status = "approved";
      amount = invoice.amount_paid || 0;
      businessId = invoice.subscription_details?.metadata?.businessId || "";
      planCode = invoice.subscription_details?.metadata?.planCode || "";
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      type = "payment";
      providerSubId = invoice.subscription;
      status = "rejected";
      amount = invoice.amount_due || 0;
      businessId = invoice.subscription_details?.metadata?.businessId || "";
      planCode = invoice.subscription_details?.metadata?.planCode || "";
    }

    return {
      eventId,
      type,
      providerSubId,
      status,
      amount,
      businessId,
      planCode,
      raw: event,
    };
  }
}
