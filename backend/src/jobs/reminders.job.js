import cron from "node-cron";
import prisma from "../prisma.js";
import { sendReminderEmail } from "../services/mailer.js";
import { triggerWorkflows } from "../services/workflowEngine.js";

function minutesFromEnv() {
  const m = Number(process.env.REMINDER_MINUTES || 120);
  return Number.isFinite(m) ? m : 120;
}

export function startRemindersJob() {
  // corre cada 5 minutos
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      // --- 1. LEGACY STATIC REMINDERS FALLBACK ---
      const mins = minutesFromEnv();
      const windowStart = new Date(now.getTime() + mins * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (mins + 5) * 60 * 1000);

      const legacyAppts = await prisma.appointment.findMany({
        where: {
          startsAt: { gte: windowStart, lt: windowEnd },
          reminderSentAt: null,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: { client: true, service: true, worker: true },
      });

      for (const a of legacyAppts) {
        const to = a.client?.email;
        if (!to) continue;

        const when = new Date(a.startsAt).toLocaleString("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        });

        let smtpConfig = null;
        if (a.businessId) {
          const biz = await prisma.business.findUnique({
            where: { id: a.businessId },
            select: { integrations: true }
          });
          smtpConfig = biz?.integrations?.smtp;
        }

        await sendReminderEmail({
          to,
          subject: `Recordatorio de tu cita (${a.service?.name || "Servicio"})`,
          html: `
            <div style="font-family: Arial, sans-serif">
              <h3>Recordatorio de cita</h3>
              <p>Hola ${a.client?.firstName || ""},</p>
              <p>Te recordamos tu cita:</p>
              <ul>
                <li><b>Servicio:</b> ${a.service?.name || "-"}</li>
                <li><b>Profesional:</b> ${a.worker?.firstName || ""} ${a.worker?.lastName || ""}</li>
                <li><b>Fecha y hora:</b> ${when}</li>
              </ul>
              <p>¡Te esperamos!</p>
            </div>
          `,
          smtpConfig,
        });

        await prisma.appointment.update({
          where: { id: a.id },
          data: {
            reminderSentAt: now,
            reminderType: `${mins}m`,
          },
        });
      }

      // --- 2. DYNAMIC WORKFLOW REMINDERS (CUSTOM TIMING) ---
      const activeWorkflows = await prisma.workflow.findMany({
        where: {
          status: "ACTIVE"
        }
      });

      const getTriggerConfig = (w) => {
        if (w.trigger && typeof w.trigger === "object" && w.trigger.type) {
          return {
            type: w.trigger.type,
            config: w.trigger.config || {}
          };
        }
        if (Array.isArray(w.steps)) {
          const node = w.steps.find(n => n.type === "trigger");
          if (node) {
            return {
              type: node.subtype,
              config: node.config || {}
            };
          }
        }
        return null;
      };

      const timedWorkflows = activeWorkflows.filter(w => {
        const trig = getTriggerConfig(w);
        if (!trig) return false;
        
        const isAppointmentTrigger = ["nueva-cita", "cita-confirmada", "nueva_cita", "confirmed", "appointment_created", "status_changed", "cambio-estado-cita"].includes(trig.type);
        const isBefore = trig.config?.triggerTiming === "BEFORE_APPOINTMENT";
        
        return isAppointmentTrigger && isBefore;
      });

      for (const w of timedWorkflows) {
        const trig = getTriggerConfig(w);
        if (!trig) continue;

        const val = Number(trig.config.timeValue || 24);
        const unit = trig.config.timeUnit || "horas";
        
        let offsetMinutes = val;
        if (unit === "horas" || unit === "hours") {
          offsetMinutes = val * 60;
        } else if (unit === "dias" || unit === "days") {
          offsetMinutes = val * 1440;
        } else if (unit === "minutos" || unit === "minutes") {
          offsetMinutes = val;
        }

        const triggerWindowStart = new Date(now.getTime() + offsetMinutes * 60 * 1000);
        const triggerWindowEnd = new Date(now.getTime() + (offsetMinutes + 5) * 60 * 1000);

        const allowedStatuses = ["PENDING", "CONFIRMED"];
        if (["cita-confirmada", "confirmed"].includes(trig.type)) {
          allowedStatuses.push("CONFIRMED");
        }

        const appts = await prisma.appointment.findMany({
          where: {
            startsAt: { gte: triggerWindowStart, lt: triggerWindowEnd },
            status: { in: allowedStatuses },
            ...(w.businessId ? { businessId: w.businessId } : {})
          },
          include: { client: true, service: true, worker: true }
        });

        for (const a of appts) {
          const sentIds = a.reminderType ? a.reminderType.split(",") : [];
          if (sentIds.includes(w.id)) continue;

          console.log(`[cron-workflows] Triggering timed workflow ${w.name} (${w.id}) for appointment ${a.id}`);
          
          await triggerWorkflows(a.businessId, trig.type, a, [w.id]);

          const updatedSentIds = [...sentIds, w.id].join(",");
          await prisma.appointment.update({
            where: { id: a.id },
            data: {
              reminderSentAt: now,
              reminderType: updatedSentIds
            }
          });
        }
      }
    } catch (err) {
      console.error("Reminders job error:", err);
    }
  });
}
