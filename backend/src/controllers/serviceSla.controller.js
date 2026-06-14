import prisma from "../prisma.js";

/**
 * Helper to process array safely.
 */
function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

/**
 * Returns Service SLA stats and configurations.
 */
export async function getServiceSlaStats(req, res) {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio faltante." });
    }

    // Fetch all completed SLAs (status !== 'incompleto')
    const slas = await prisma.serviceSla.findMany({ where: { businessId: req.businessId,  businessId, NOT: { status: "incompleto" } },
      include: {
        service: true,
        worker: true,
        appointment: { include: { client: true } }
      },
      orderBy: { endedAt: "desc" }
    });

    // Compute service averages
    const serviceMap = {};
    for (const sla of slas) {
      const sId = sla.serviceId;
      if (!serviceMap[sId]) {
        serviceMap[sId] = {
          serviceName: sla.service.name,
          serviceId: sId,
          sumEstimated: 0,
          sumActual: 0,
          count: 0,
          onTimeCount: 0,
          withinLimitCount: 0,
          varianceSum: 0,
          currentEstimate: sla.estimatedSec,
        };
      }
      const s = serviceMap[sId];
      s.sumEstimated += sla.estimatedSec;
      s.sumActual += sla.actualSec || 0;
      s.count += 1;
      if (sla.status === "a_tiempo") s.onTimeCount += 1;
      if (sla.withinLimit) s.withinLimitCount += 1;
      s.varianceSum += (sla.varianceSec || 0);
    }

    const serviceStats = Object.values(serviceMap).map(s => {
      const avgActual = Math.round(s.sumActual / s.count);
      const avgEstimated = Math.round(s.sumEstimated / s.count);
      const diffMin = Math.round((avgActual - s.currentEstimate) / 60);

      // Suggest override / update if diff is significant (e.g. >= 2 minutes and at least 3 samples)
      let suggestion = null;
      if (s.count >= 3 && Math.abs(diffMin) >= 2) {
        suggestion = {
          avgActualMinutes: Math.round(avgActual / 60),
          currentEstimateMinutes: Math.round(s.currentEstimate / 60),
          recommendedMinutes: Math.round(avgActual / 60),
          differenceMinutes: diffMin,
        };
      }

      return {
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        avgEstimated,
        avgActual,
        count: s.count,
        pctOnTime: Math.round((s.onTimeCount / s.count) * 100),
        pctWithinLimit: Math.round((s.withinLimitCount / s.count) * 100),
        avgVariance: Math.round(s.varianceSum / s.count),
        suggestion
      };
    });

    // Compute professional averages
    const professionalMap = {};
    for (const sla of slas) {
      const pId = sla.professionalId;
      if (!professionalMap[pId]) {
        professionalMap[pId] = {
          professionalName: `${sla.worker.firstName} ${sla.worker.lastName}`.trim(),
          professionalId: pId,
          sumEstimated: 0,
          sumActual: 0,
          count: 0,
          onTimeCount: 0,
          withinLimitCount: 0,
          varianceSum: 0,
        };
      }
      const p = professionalMap[pId];
      p.sumEstimated += sla.estimatedSec;
      p.sumActual += sla.actualSec || 0;
      p.count += 1;
      if (sla.status === "a_tiempo") p.onTimeCount += 1;
      if (sla.withinLimit) p.withinLimitCount += 1;
      p.varianceSum += (sla.varianceSec || 0);
    }

    const professionalStats = Object.values(professionalMap).map(p => ({
      professionalId: p.professionalId,
      professionalName: p.professionalName,
      avgEstimated: Math.round(p.sumEstimated / p.count),
      avgActual: Math.round(p.sumActual / p.count),
      count: p.count,
      pctOnTime: Math.round((p.onTimeCount / p.count) * 100),
      pctWithinLimit: Math.round((p.withinLimitCount / p.count) * 100),
      avgVariance: Math.round(p.varianceSum / p.count),
    }));

    // Compute global metrics
    const totalCompleted = slas.length;
    const globalOnTimeCount = slas.filter(s => s.status === "a_tiempo").length;
    const globalWithinLimitCount = slas.filter(s => s.withinLimit).length;
    const pctOnTime = totalCompleted > 0 ? Math.round((globalOnTimeCount / totalCompleted) * 100) : 0;
    const pctWithinLimit = totalCompleted > 0 ? Math.round((globalWithinLimitCount / totalCompleted) * 100) : 0;

    // Bottleneck: service with highest avgVariance
    const sortedServicesByVariance = [...serviceStats].sort((a, b) => b.avgVariance - a.avgVariance);
    const bottleneckService = sortedServicesByVariance[0] || null;

    // Bottleneck professional: worker with highest avgVariance
    const sortedProfessionalsByVariance = [...professionalStats].sort((a, b) => b.avgVariance - a.avgVariance);
    const bottleneckProfessional = sortedProfessionalsByVariance[0] || null;

    // Format recent SLA logs (last 50)
    const recentSlas = slas.slice(0, 50).map(s => ({
      id: s.id,
      appointmentId: s.appointmentId,
      clientName: s.appointment?.client ? `${s.appointment.client.firstName} ${s.appointment.client.lastName}` : "Cliente",
      serviceName: s.service.name,
      professionalName: `${s.worker.firstName} ${s.worker.lastName}`.trim(),
      estimatedSec: s.estimatedSec,
      actualSec: s.actualSec,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      status: s.status,
      withinLimit: s.withinLimit,
      varianceSec: s.varianceSec,
    }));

    return res.json({
      serviceStats,
      professionalStats,
      totalCompleted,
      pctOnTime,
      pctWithinLimit,
      bottleneckService,
      bottleneckProfessional,
      recentSlas
    });
  } catch (error) {
    console.error("Error obtaining Service SLA stats:", error);
    return res.status(500).json({ error: "Error obteniendo estadísticas de SLA de ejecución." });
  }
}

/**
 * Returns the live SLA status of a active appointment.
 */
export async function getLiveSla(req, res) {
  try {
    const { appointmentId } = req.params;
    const businessId = req.businessId;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, businessId },
      include: { service: true, worker: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    // Fetch SLA config
    const config = await prisma.serviceSlaConfig.findFirst({ where: { businessId: req.businessId, 
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

    // Fetch histories
    const histories = await prisma.appointmentStatusHistory.findMany({ where: { businessId: req.businessId,  businessId: req.businessId,  appointmentId },
      orderBy: { transitionedAt: "asc" }
    });

    // 1. Calculate past active seconds
    const pastActiveSec = histories
      .filter(h => h.statusFrom === startStatusKey)
      .reduce((sum, h) => sum + (h.durationSeconds || 0), 0);

    // 2. Is it currently in startStatusKey?
    const isActive = appointment.status === startStatusKey;
    let currentPeriodSec = 0;
    let lastStartedAt = null;

    if (isActive) {
      // Find last transition to startStatusKey
      const lastTransitionToStart = [...histories]
        .reverse()
        .find(h => h.statusTo === startStatusKey);

      const lastTransitionTime = lastTransitionToStart 
        ? lastTransitionToStart.transitionedAt 
        : appointment.createdAt;

      lastStartedAt = lastTransitionTime;
      currentPeriodSec = Math.max(0, Math.round((Date.now() - lastTransitionTime.getTime()) / 1000));
    }

    const totalActiveSec = pastActiveSec + currentPeriodSec;

    // Get estimated seconds
    let estimatedSec = appointment.service.duration * 60; // default
    
    // Check professional override
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

    return res.json({
      appointmentId,
      isActive,
      status: appointment.status,
      startStatusKey,
      endStatusKey,
      estimatedSec,
      actualSec: totalActiveSec,
      hardLimitSec,
      lastStartedAt,
      pastActiveSec,
      currentPeriodSec
    });
  } catch (error) {
    console.error("Error getting live SLA:", error);
    return res.status(500).json({ error: "Error obteniendo SLA en vivo." });
  }
}

/**
 * Returns SLA configurations.
 */
export async function getSlaConfig(req, res) {
  try {
    const businessId = req.businessId;
    const configs = await prisma.serviceSlaConfig.findMany({ where: { businessId: req.businessId,  businessId },
      include: { service: true }
    });
    return res.json(configs);
  } catch (error) {
    console.error("Error fetching SLA configs:", error);
    return res.status(500).json({ error: "Error obteniendo configuraciones de SLA." });
  }
}

/**
 * Updates or creates an SLA configuration.
 */
export async function updateSlaConfig(req, res) {
  try {
    const businessId = req.businessId;
    const { id, serviceId, toleranceType, toleranceValue, hardLimitSec, startStatusKey, endStatusKey } = req.body;

    let existing = null;
    if (id) {
      existing = await prisma.serviceSlaConfig.findUnique({ where: { id } });
    } else {
      existing = await prisma.serviceSlaConfig.findFirst({ where: { businessId: req.businessId,  businessId, serviceId: serviceId || null }
      });
    }

    const data = {
      businessId,
      serviceId: serviceId || null,
      toleranceType: toleranceType || "percent",
      toleranceValue: Number(toleranceValue ?? 10.0),
      hardLimitSec: hardLimitSec ? Number(hardLimitSec) : null,
      startStatusKey: startStatusKey || "CONFIRMED",
      endStatusKey: endStatusKey || "DONE",
    };

    let result;
    if (existing) {
      result = await prisma.serviceSlaConfig.update({
        where: { id: existing.id },
        data
      });
    } else {
      result = await prisma.serviceSlaConfig.create({
        data
      });
    }

    return res.json(result);
  } catch (error) {
    console.error("Error updating SLA config:", error);
    return res.status(500).json({ error: "Error guardando configuración de SLA." });
  }
}

/**
 * Returns professional overrides estimates.
 */
export async function getProfessionalEstimates(req, res) {
  try {
    const businessId = req.businessId;
    const estimates = await prisma.serviceProfessionalEstimate.findMany({ where: { businessId: req.businessId,  businessId: req.businessId, 
        service: { businessId }
      },
      include: { service: true, worker: true }
    });
    return res.json(estimates);
  } catch (error) {
    console.error("Error fetching professional estimates:", error);
    return res.status(500).json({ error: "Error obteniendo overrides de estimaciones." });
  }
}

/**
 * Creates or updates overrides estimates.
 */
export async function updateProfessionalEstimate(req, res) {
  try {
    const { serviceId, workerId, estimatedDurationSec } = req.body;
    if (!serviceId || !workerId || !estimatedDurationSec) {
      return res.status(400).json({ error: "Faltan parámetros: serviceId, workerId, estimatedDurationSec." });
    }

    const result = await prisma.serviceProfessionalEstimate.upsert({
      where: {
        serviceId_workerId: { serviceId, workerId }
      },
      create: {
        serviceId,
        workerId,
        estimatedDurationSec: Number(estimatedDurationSec)
      },
      update: {
        estimatedDurationSec: Number(estimatedDurationSec)
      }
    });

    return res.json(result);
  } catch (error) {
    console.error("Error updating professional estimate:", error);
    return res.status(500).json({ error: "Error guardando estimación del profesional." });
  }
}
