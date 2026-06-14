import cron from "node-cron";
import prisma from "../prisma.js";
import { sendReminderEmail } from "../services/mailer.js";

export function startBillingJob() {
  // Run every day at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("[cron-billing] Running daily subscription and dunning checks...");
      const now = new Date();

      // 1. Handle expired trials (trialing -> past_due)
      const expiredTrials = await prisma.business.findMany({
        where: {
          subscriptionStatus: "trialing",
          trialEndsAt: { lt: now }
        }
      });

      for (const biz of expiredTrials) {
        console.log(`[cron-billing] Trial expired for business ${biz.name} (${biz.id}). Transitioning to past_due.`);
        await prisma.business.update({
          where: { id: biz.id },
          data: {
            subscriptionStatus: "past_due",
            gracePeriodEndsAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days grace period
          }
        });
      }

      // 2. Handle expired grace periods (past_due -> suspended)
      const expiredGrace = await prisma.business.findMany({
        where: {
          subscriptionStatus: "past_due",
          gracePeriodEndsAt: { lt: now }
        }
      });

      for (const biz of expiredGrace) {
        console.log(`[cron-billing] Grace period expired for business ${biz.name} (${biz.id}). Suspending access.`);
        await prisma.business.update({
          where: { id: biz.id },
          data: {
            subscriptionStatus: "suspended"
          }
        });

        // Mirror in subscription if exists
        const sub = await prisma.subscription.findUnique({ where: { businessId: biz.id } });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "suspended" }
          });
        }
      }

      // 3. Dunning notification: 3 days before currentPeriodEnd
      const threeDaysFromNowStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      threeDaysFromNowStart.setHours(0, 0, 0, 0);
      const threeDaysFromNowEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
      threeDaysFromNowEnd.setHours(0, 0, 0, 0);

      const renewals = await prisma.subscription.findMany({
        where: {
          status: "active",
          cancelAtPeriodEnd: false,
          currentPeriodEnd: {
            gte: threeDaysFromNowStart,
            lt: threeDaysFromNowEnd
          }
        },
        include: {
          business: {
            include: {
              members: {
                where: { role: "owner" },
                include: { user: true }
              }
            }
          }
        }
      });

      for (const sub of renewals) {
        // Find owner email
        const ownerMember = sub.business?.members?.[0];
        const ownerEmail = ownerMember?.user?.email;

        if (ownerEmail) {
          console.log(`[cron-billing] Sending renewal reminder email to ${ownerEmail} for business ${sub.business.name}.`);
          try {
            const plan = await prisma.plan.findUnique({ where: { code: sub.planCode } });
            const amountStr = plan ? `$${(plan.priceMonth / 100).toFixed(2)}` : "tu plan";
            
            await sendReminderEmail({
              to: ownerEmail,
              subject: `Aviso de renovación de suscripción - ${sub.business.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                  <h2 style="color: #7c3aed;">Aviso de Renovación Próxima</h2>
                  <p>Hola,</p>
                  <p>Te recordamos que tu suscripción al plan <strong>${plan?.name || sub.planCode}</strong> para <strong>${sub.business.name}</strong> se renovará automáticamente en 3 días.</p>
                  <p>El cargo recurrente aproximado de <strong>${amountStr}</strong> se procesará en tu cuenta configurada.</p>
                  <p>Si deseas realizar cambios en tu suscripción o cancelar la renovación automática, puedes hacerlo desde el panel de control en <strong>Configuración > Suscripción</strong>.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">Gracias por confiar en AuraDash / DashboardOS. Si tienes alguna duda, responde a este correo.</p>
                </div>
              `
            });
          } catch (mailError) {
            console.error(`[cron-billing] Failed to send renewal email to ${ownerEmail}:`, mailError);
          }
        }
      }

    } catch (err) {
      console.error("[cron-billing] Error in daily billing job execution:", err);
    }
  });
}
