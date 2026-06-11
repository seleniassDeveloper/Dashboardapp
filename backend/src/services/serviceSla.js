import prisma from "../prisma.js";

/**
 * Handles SLA calculation and tracking on status transitions.
 * @param {string} businessId
 * @param {string} appointmentId
 * @param {string} statusFrom
 * @param {string} statusTo
 */
export async function handleSlaTransition(businessId, appointmentId, statusFrom, statusTo) {
  if (!businessId || !appointmentId || !statusTo || statusFrom === statusTo) return;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true }
    });

    if (!appointment || !appointment.service) return;

    // Get SLA configuration
    const config = await prisma.serviceSlaConfig.findFirst({
      where: {
        businessId,
        OR: [
          { serviceId: appointment.serviceId },
          { serviceId: null }
        ]
      },
      orderBy: { serviceId: "desc" }
    });

    const startStatusKey = config?.startStatusKey || "CONFIRMED";
    const endStatusKey = config?.endStatusKey || "DONE";
    const toleranceType = config?.toleranceType || "percent";
    const toleranceValue = config?.toleranceValue ?? 10.0;
    const hardLimitSec = config?.hardLimitSec || null;

    const now = new Date();

    // Check if transitioning TO startStatusKey
    if (statusTo === startStatusKey) {
      const existingSla = await prisma.serviceSla.findUnique({
        where: { appointmentId }
      });

      if (!existingSla) {
        // Calculate estimatedSec
        let estimatedSec = appointment.service.duration * 60; // default in seconds
        
        // Check for professional override
        const override = await prisma.serviceProfessionalEstimate.findUnique({
          where: {
            serviceId_workerId: {
              serviceId: appointment.serviceId,
              workerId: appointment.workerId
            }
          }
        });

        if (override) {
          estimatedSec = override.estimatedDurationSec;
        } else if (appointment.service.estimatedDurationSec) {
          estimatedSec = appointment.service.estimatedDurationSec;
        }

        await prisma.serviceSla.create({
          data: {
            businessId,
            appointmentId,
            serviceId: appointment.serviceId,
            professionalId: appointment.workerId,
            estimatedSec,
            startedAt: now,
            status: "incompleto",
            withinLimit: true,
            overageSec: 0,
          }
        });
        console.log(`[ServiceSla] Initialized SLA for appt ${appointmentId} with estimate ${estimatedSec}s.`);
      } else {
        // If resuming or returning to active
        await prisma.serviceSla.update({
          where: { appointmentId },
          data: { status: "incompleto" }
        });
      }
    }

    // Check if transitioning TO endStatusKey
    if (statusTo === endStatusKey) {
      const existingSla = await prisma.serviceSla.findUnique({
        where: { appointmentId }
      });

      // If no SLA started, create one with fallback startedAt
      let startedAt = existingSla ? existingSla.startedAt : appointment.createdAt;
      let estimatedSec = existingSla ? existingSla.estimatedSec : (appointment.service.duration * 60);

      if (!existingSla) {
        const override = await prisma.serviceProfessionalEstimate.findUnique({
          where: {
            serviceId_workerId: {
              serviceId: appointment.serviceId,
              workerId: appointment.workerId
            }
          }
        });
        if (override) {
          estimatedSec = override.estimatedDurationSec;
        } else if (appointment.service.estimatedDurationSec) {
          estimatedSec = appointment.service.estimatedDurationSec;
        }
      }

      // Fetch all status histories to calculate active seconds
      const histories = await prisma.appointmentStatusHistory.findMany({
        where: { appointmentId },
        orderBy: { transitionedAt: "asc" }
      });

      // Sum durationSeconds of all transitions where statusFrom was startStatusKey
      const activeHistories = histories.filter(h => h.statusFrom === startStatusKey);
      const actualSec = activeHistories.reduce((sum, h) => sum + (h.durationSeconds || 0), 0);

      // Find first start transitionedAt if firstStartHistory is found
      const firstStartHistory = histories.find(h => h.statusTo === startStatusKey);
      if (firstStartHistory) {
        startedAt = firstStartHistory.transitionedAt;
      }

      const endedAt = now;
      const totalElapsedSec = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
      const pausedSec = Math.max(0, totalElapsedSec - actualSec);

      // Calculations
      const varianceSec = actualSec - estimatedSec;
      const variancePct = estimatedSec > 0 ? (varianceSec / estimatedSec) : null;

      let tolSec = 0;
      if (toleranceType === "percent") {
        tolSec = estimatedSec * (toleranceValue / 100);
      } else {
        tolSec = toleranceValue * 60;
      }

      const banda_inferior = estimatedSec - tolSec;
      const banda_superior = estimatedSec + tolSec;

      let status = "a_tiempo";
      if (actualSec < banda_inferior) {
        status = "antes";
      } else if (actualSec > banda_superior) {
        status = "excedido";
      }

      const withinLimit = hardLimitSec ? (actualSec <= hardLimitSec) : true;
      const overageSec = hardLimitSec ? Math.max(0, actualSec - hardLimitSec) : 0;

      await prisma.serviceSla.upsert({
        where: { appointmentId },
        create: {
          businessId,
          appointmentId,
          serviceId: appointment.serviceId,
          professionalId: appointment.workerId,
          estimatedSec,
          actualSec,
          startedAt,
          endedAt,
          pausedSec,
          varianceSec,
          variancePct,
          status,
          withinLimit,
          overageSec,
        },
        update: {
          actualSec,
          endedAt,
          pausedSec,
          varianceSec,
          variancePct,
          status,
          withinLimit,
          overageSec,
        }
      });
      console.log(`[ServiceSla] Consolidated SLA for appt ${appointmentId}: actual=${actualSec}s, est=${estimatedSec}s, status=${status}.`);
    }
  } catch (err) {
    console.error("[ServiceSla] Error in handleSlaTransition:", err);
  }
}
