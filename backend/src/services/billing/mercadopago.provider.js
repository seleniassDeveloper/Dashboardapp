import crypto from "crypto";
import { PaymentProvider } from "./paymentProvider.js";

export class MercadoPagoProvider extends PaymentProvider {
  async createSubscription(business, plan, interval, email) {
    const isMock = !process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith("mock_");
    if (isMock) {
      const providerSubId = `mock_sub_${Math.random().toString(36).substr(2, 9)}`;
      const price = interval === "month" ? plan.priceMonth : plan.priceYear;
      // Redirect to settings with mock parameters to prompt simulation modal
      const checkoutUrl = `/app/settings?tab=subscription&mock_checkout=true&providerSubId=${providerSubId}&planCode=${plan.code}&interval=${interval}&price=${price}&provider=mercadopago`;
      return { providerSubId, checkoutUrl };
    }

    const price = interval === "month" ? plan.priceMonth : plan.priceYear;
    const priceInMainCurrency = price / 100; // Convert cents to standard currency units
    const reason = `Suscripción a ${plan.name} (${interval === "month" ? "Mensual" : "Anual"})`;

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        back_url: `${process.env.APP_BASE_URL || "http://localhost:5173"}/app/settings?tab=subscription`,
        reason,
        auto_recurring: {
          frequency: 1,
          frequency_type: interval === "month" ? "months" : "years",
          transaction_amount: priceInMainCurrency,
          currency_id: plan.currency || "USD",
          free_trial: {
            frequency: 1,
            frequency_type: "months"
          }
        },
        payer_email: email,
        status: "pending"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MercadoPago Subscription creation failed: ${errText}`);
    }

    const data = await response.json();
    return {
      providerSubId: data.id,
      checkoutUrl: data.init_point
    };
  }

  async cancelSubscription(providerSubId) {
    const isMock = !process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith("mock_") || providerSubId.startsWith("mock_");
    if (isMock) {
      return true;
    }

    const response = await fetch(`https://api.mercadopago.com/preapproval/${providerSubId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "cancelled"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MercadoPago Subscription cancellation failed: ${errText}`);
    }

    return true;
  }

  async verifyWebhook(req) {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("[MercadoPagoProvider] MP_WEBHOOK_SECRET no está definida. Omitiendo validación HMAC.");
      return true;
    }

    const xSignature = req.headers?.["x-signature"];
    const xRequestId = req.headers?.["x-request-id"];
    const payload = req.body || {};
    const dataId = payload.data?.id || payload.id || "";

    if (!xSignature) {
      console.warn("[MercadoPagoProvider] Header x-signature ausente.");
      return false;
    }

    const parts = String(xSignature).split(",");
    let ts = "";
    let hashV1 = "";

    for (const part of parts) {
      const [k, v] = part.trim().split("=");
      if (k === "ts") ts = v;
      if (k === "v1") hashV1 = v;
    }

    if (!ts || !hashV1) {
      console.warn("[MercadoPagoProvider] Header x-signature incompleto o malformado.");
      return false;
    }

    const manifest = `id:${dataId};request-id:${xRequestId || ""};ts:${ts};`;
    const computedHash = crypto
      .createHmac("sha256", secret.trim())
      .update(manifest)
      .digest("hex");

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedHash, "utf8"),
        Buffer.from(hashV1, "utf8")
      );
      if (!isValid) {
        console.warn("[MercadoPagoProvider] Firma x-signature inválida (HMAC mismatch).");
      }
      return isValid;
    } catch {
      console.warn("[MercadoPagoProvider] Error al evaluar firma HMAC.");
      return false;
    }
  }

  async parseEvent(payload, headers) {
    const eventId = payload.id ? String(payload.id) : `event_${Date.now()}`;
    const type = payload.type || "";
    const action = payload.action || "";
    const dataId = payload.data?.id || "";

    const isMock = !process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith("mock_") || String(dataId).startsWith("mock_");

    if (isMock) {
      // Return normalized simulated event directly
      if (type === "subscription_preapproval") {
        return {
          eventId,
          type: "subscription",
          providerSubId: dataId || "mock_sub_xyz",
          status: payload.mock_status || "authorized",
          amount: payload.mock_amount || 1900,
          raw: payload
        };
      }
      if (type === "payment") {
        return {
          eventId,
          type: "payment",
          providerSubId: payload.mock_subscription_id || "mock_sub_xyz",
          status: payload.mock_status || "approved",
          amount: payload.mock_amount || 1900,
          providerPayId: dataId || "mock_pay_123",
          raw: payload
        };
      }
      return { eventId, type: "unknown", providerSubId: "", status: "unknown", amount: 0, raw: payload };
    }

    if (type === "subscription_preapproval" || type === "subscription") {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
        headers: { "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN.trim()}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch preapproval info from MP: ${await res.text()}`);
      }
      const preapproval = await res.json();
      return {
        eventId,
        type: "subscription",
        providerSubId: preapproval.id,
        status: preapproval.status, // authorized, paused, cancelled
        amount: Math.round((preapproval.auto_recurring?.transaction_amount || 0) * 100),
        raw: preapproval
      };
    }

    if (type === "payment") {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN.trim()}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch payment info from MP: ${await res.text()}`);
      }
      const payment = await res.json();
      return {
        eventId,
        type: "payment",
        providerSubId: payment.preapproval_id || "",
        status: payment.status, // approved, rejected, pending, in_process
        amount: Math.round((payment.transaction_amount || 0) * 100),
        providerPayId: String(payment.id),
        raw: payment
      };
    }

    return {
      eventId,
      type: "unknown",
      providerSubId: "",
      status: "unknown",
      amount: 0,
      raw: payload
    };
  }
}
