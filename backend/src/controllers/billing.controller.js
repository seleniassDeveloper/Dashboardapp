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
    console.error("[billing] getPlans:", error?.message || error);
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
    console.error("[billing] getSubscription:", error?.message || error);
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
    console.error("[billing] checkout:", error?.message || error);
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
    console.error("[billing] cancel:", error?.message || error);
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

    const isActivating = subscription.status !== "active";
    let shouldSendEmail = false;

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
          if (isActivating) {
            shouldSendEmail = true;
          }
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
          if (isActivating) {
            shouldSendEmail = true;
          }
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

    if (shouldSendEmail) {
      sendSubscriptionActivationEmail(subscription.businessId, subscription.planCode, subscription.interval).catch(err => console.error("[billing] sendSubscriptionActivationEmailError:", err?.message || err));
    }

    return res.status(200).send("Webhook Processed");
  } catch (error) {
    console.error("[billing] webhook:", error?.message || error);
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

    const sub = await prisma.subscription.findUnique({ where: { businessId: request.businessId } });
    const interval = sub?.interval || "month";
    sendSubscriptionActivationEmail(request.businessId, request.requestedPlan, interval).catch(err => console.error("[billing] sendSubscriptionActivationEmailError:", err?.message || err));

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
    console.error("[billing] quickApprove:", error?.message || error);
    return res.status(500).send("<h1>Error Interno del Servidor</h1>");
  }
}

async function sendSubscriptionActivationEmail(businessId, planCode, interval) {
  try {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return;

    let recipientEmail = "";
    if (business.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: business.ownerId } });
      if (owner) recipientEmail = owner.email;
    }
    if (!recipientEmail && business.userId) {
      const owner = await prisma.user.findUnique({ where: { id: business.userId } });
      if (owner) recipientEmail = owner.email;
    }

    if (!recipientEmail) {
      console.warn(`[mailer] No se encontró el correo del dueño para el negocio ${businessId}. No se enviará correo.`);
      return;
    }

    const planName = planCode.toUpperCase();
    const billingPeriod = interval === "year" ? "Anual" : "Mensual";
    const priceText = planCode === "starter" ? (interval === "year" ? "$190.00 USD" : "$19.00 USD") :
                      planCode === "pro" ? (interval === "year" ? "$490.00 USD" : "$49.00 USD") :
                      (interval === "year" ? "$990.00 USD" : "$99.00 USD");

    const subject = `¡Tu suscripción a AuraDash ${planName} está activa! 🚀`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #7c3aed; padding: 25px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">¡Gracias por tu suscripción!</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Hola <strong>${business.name}</strong>,</p>
          <p style="font-size: 14px; color: #555;">Queremos confirmarte que tu suscripción a <strong>AuraDash</strong> se ha activado correctamente. Ya tienes acceso completo a todas las funciones correspondientes a tu nuevo plan.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #7c3aed; padding: 20px; border-radius: 4px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #7c3aed; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Detalles de la Suscripción</h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #666; font-weight: bold; width: 140px;">Plan:</td>
                <td style="padding: 6px 0; color: #111;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; font-weight: bold;">Período de Facturación:</td>
                <td style="padding: 6px 0; color: #111;">${billingPeriod}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; font-weight: bold;">Monto total:</td>
                <td style="padding: 6px 0; color: #111; font-weight: bold; color: #10b981;">${priceText}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666; font-weight: bold;">Estado:</td>
                <td style="padding: 6px 0;"><span style="background-color: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">Activa</span></td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #555;">Puedes gestionar tu facturación, descargar facturas o cancelar la renovación automática en cualquier momento ingresando a la sección de <strong>Configuración > Suscripción</strong> en tu panel de control.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://auradash.digital/app/settings?tab=subscription" style="background-color: #7c3aed; color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.25);">Ir a mi Panel de Control</a>
          </div>

          <p style="font-size: 13px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            Si tienes alguna duda o necesitas asistencia técnica, responde a este correo o contáctanos a soporte@auradash.com.
          </p>
        </div>
      </div>
    `;

    await sendReminderEmail({
      to: recipientEmail,
      subject,
      html
    });

    console.log(`[mailer] Correo de confirmación de suscripción enviado correctamente a ${recipientEmail} para el negocio ${businessId}`);
  } catch (error) {
    console.error("[billing] sendSubscriptionActivationEmail:", error?.message || error);
  }
}
