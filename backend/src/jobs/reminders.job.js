import cron from "node-cron";
import prisma from "../prisma.js";
import { sendReminderEmail } from "../services/mailer.js";

function minutesFromEnv() {
  const m = Number(process.env.REMINDER_MINUTES || 120);
  return Number.isFinite(m) ? m : 120;
}

export function startRemindersJob() {
  // corre cada 5 minutos
  cron.schedule("*/5 * * * *", async () => {
    try {
      const mins = minutesFromEnv();
      const now = new Date();
      const windowStart = new Date(now.getTime() + mins * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (mins + 5) * 60 * 1000);

      const appts = await prisma.appointment.findMany({
        where: {
          startsAt: { gte: windowStart, lt: windowEnd },
          reminderSentAt: null,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: { client: true, service: true, worker: true },
      });

      for (const a of appts) {
        const to = a.client?.email;
        if (!to) continue;

        const when = new Date(a.startsAt).toLocaleString("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        });

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
        });

        await prisma.appointment.update({
          where: { id: a.id },
          data: {
            reminderSentAt: new Date(),
            reminderType: `${mins}m`,
          },
        });
      }
    } catch (err) {
      console.error("Reminders job error:", err);
    }
  });
}
