import OpenAI from "openai";
import prisma from "../prisma.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function daysInUtcMonth(year, monthIndex0) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function ymdUtc(d) {
  return d.toISOString().slice(0, 10);
}

function summarizeAppointments(list) {
  const appointmentCount = list.length;
  const revenue = list.reduce((acc, a) => acc + Number(a?.service?.price || 0), 0);
  const cancelled = list.filter((a) => a.status === "CANCELLED").length;
  const completed = list.filter(
    (a) => a.status === "CONFIRMED" || a.status === "DONE"
  ).length;
  const pending = list.filter((a) => a.status === "PENDING").length;
  const totalDuration = list.reduce(
    (acc, a) => acc + Number(a?.service?.duration || 0),
    0
  );
  const avgAppointmentDurationMinutes = appointmentCount
    ? Math.round((totalDuration / appointmentCount) * 10) / 10
    : 0;
  return {
    appointmentCount,
    revenue,
    cancelled,
    completed,
    pending,
    avgAppointmentDurationMinutes,
  };
}

function filterAppointmentsInRange(appointments, start, end) {
  const t0 = start.getTime();
  const t1 = end.getTime();
  return appointments.filter((a) => {
    const t = new Date(a.startsAt).getTime();
    return t >= t0 && t <= t1;
  });
}

/** Porcentaje (no acotado): null si la base es 0 y no hay comparación útil */
function pctChange(prev, curr) {
  if (prev === 0 && curr === 0) return 0;
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function formatPct(p) {
  if (p === null || Number.isNaN(p)) return "n/d";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p}%`;
}

function workerNameFromAppointment(a) {
  const w = `${a?.worker?.firstName || ""} ${a?.worker?.lastName || ""}`.trim();
  return w || "Sin trabajador";
}

/** Agrega citas por trabajador; ordenado por cantidad de citas (desc). */
function aggregateByWorker(list) {
  const map = new Map();
  for (const a of list) {
    const id = a.workerId || "unknown";
    if (!map.has(id)) {
      map.set(id, {
        workerId: id,
        workerName: workerNameFromAppointment(a),
        appointmentCount: 0,
        revenue: 0,
        cancelled: 0,
        pending: 0,
        completed: 0,
        durationSum: 0,
      });
    }
    const row = map.get(id);
    row.appointmentCount += 1;
    row.revenue += Number(a?.service?.price || 0);
    row.durationSum += Number(a?.service?.duration || 0);
    if (a.status === "CANCELLED") row.cancelled += 1;
    else if (a.status === "PENDING") row.pending += 1;
    else if (a.status === "CONFIRMED" || a.status === "DONE") row.completed += 1;
  }

  const rows = [];
  for (const row of map.values()) {
    rows.push({
      workerId: row.workerId,
      workerName: row.workerName,
      appointmentCount: row.appointmentCount,
      revenue: row.revenue,
      cancelled: row.cancelled,
      pending: row.pending,
      completed: row.completed,
      avgAppointmentDurationMinutes: row.appointmentCount
        ? Math.round((row.durationSum / row.appointmentCount) * 10) / 10
        : 0,
    });
  }

  rows.sort((a, b) => b.appointmentCount - a.appointmentCount);
  return rows;
}

function addShareOfPeriod(rows, periodTotalAppointments) {
  if (!periodTotalAppointments) {
    return rows.map((r) => ({
      ...r,
      shareOfPeriodAppointmentsPct: 0,
    }));
  }
  return rows.map((r) => ({
    ...r,
    shareOfPeriodAppointmentsPct:
      Math.round((1000 * r.appointmentCount) / periodTotalAppointments) / 10,
  }));
}

const MAX_WORKER_ROWS = 25;

/**
 * Comparativas basadas en startsAt (UTC).
 * Incluye MTD vs mismos días del mes anterior, meses completos y ventanas de 7 días.
 */
function buildComparisons(appointments) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const dayOfMonth = now.getUTCDate();

  // --- Mes en curso: del día 1 hasta ahora ---
  const currentMonthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const currentMonthList = filterAppointmentsInRange(
    appointments,
    currentMonthStart,
    now
  );
  const currentMonth = summarizeAppointments(currentMonthList);

  // --- Mismo número de días calendario en el mes anterior (tope si el mes es más corto) ---
  const prevY = m === 0 ? y - 1 : y;
  const prevM = m === 0 ? 11 : m - 1;
  const dimPrev = daysInUtcMonth(prevY, prevM);
  const lastDayPrevWindow = Math.min(dayOfMonth, dimPrev);
  const prevWindowStart = new Date(Date.UTC(prevY, prevM, 1, 0, 0, 0, 0));
  const prevWindowEnd = new Date(
    Date.UTC(prevY, prevM, lastDayPrevWindow, 23, 59, 59, 999)
  );
  const prevWindowList = filterAppointmentsInRange(
    appointments,
    prevWindowStart,
    prevWindowEnd
  );
  const previousMonthSameDays = summarizeAppointments(prevWindowList);

  const mtdPct = {
    revenue: pctChange(previousMonthSameDays.revenue, currentMonth.revenue),
    appointments: pctChange(
      previousMonthSameDays.appointmentCount,
      currentMonth.appointmentCount
    ),
    cancelled: pctChange(
      previousMonthSameDays.cancelled,
      currentMonth.cancelled
    ),
    avgDuration: pctChange(
      previousMonthSameDays.avgAppointmentDurationMinutes,
      currentMonth.avgAppointmentDurationMinutes
    ),
  };

  // --- Último mes calendario completo vs el anterior ---
  const lastMonthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const lastMonthList = filterAppointmentsInRange(
    appointments,
    lastMonthStart,
    lastMonthEnd
  );
  const lastMonthFull = summarizeAppointments(lastMonthList);

  const monthBeforeEnd = new Date(Date.UTC(y, m - 1, 0, 23, 59, 59, 999));
  const monthBeforeStart = new Date(Date.UTC(y, m - 2, 1, 0, 0, 0, 0));
  const monthBeforeList = filterAppointmentsInRange(
    appointments,
    monthBeforeStart,
    monthBeforeEnd
  );
  const monthBeforeFull = summarizeAppointments(monthBeforeList);

  const fullMonthMomPct = {
    revenue: pctChange(monthBeforeFull.revenue, lastMonthFull.revenue),
    appointments: pctChange(
      monthBeforeFull.appointmentCount,
      lastMonthFull.appointmentCount
    ),
    cancelled: pctChange(monthBeforeFull.cancelled, lastMonthFull.cancelled),
    avgDuration: pctChange(
      monthBeforeFull.avgAppointmentDurationMinutes,
      lastMonthFull.avgAppointmentDurationMinutes
    ),
  };

  // --- Últimos 7 días vs 7 días anteriores ---
  const end7 = now;
  const start7 = new Date(end7.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start14 = new Date(end7.getTime() - 14 * 24 * 60 * 60 * 1000);
  const last7List = appointments.filter((a) => {
    const t = new Date(a.startsAt).getTime();
    return t >= start7.getTime() && t <= end7.getTime();
  });
  const prev7List = appointments.filter((a) => {
    const t = new Date(a.startsAt).getTime();
    return t >= start14.getTime() && t < start7.getTime();
  });
  const last7 = summarizeAppointments(last7List);
  const prev7 = summarizeAppointments(prev7List);
  const weekPct = {
    revenue: pctChange(prev7.revenue, last7.revenue),
    appointments: pctChange(prev7.appointmentCount, last7.appointmentCount),
    cancelled: pctChange(prev7.cancelled, last7.cancelled),
    avgDuration: pctChange(
      prev7.avgAppointmentDurationMinutes,
      last7.avgAppointmentDurationMinutes
    ),
  };

  // --- Año contra año: MTD mismo mes año anterior (mismos días calendario, cap por días del mes) ---
  const yoyYear = y - 1;
  const dimYoySameMonth = daysInUtcMonth(yoyYear, m);
  const yoyDayCap = Math.min(dayOfMonth, dimYoySameMonth);
  const priorYearMtdStart = new Date(Date.UTC(yoyYear, m, 1, 0, 0, 0, 0));
  const priorYearMtdEnd = new Date(
    Date.UTC(yoyYear, m, yoyDayCap, 23, 59, 59, 999)
  );
  const priorYearMtdList = filterAppointmentsInRange(
    appointments,
    priorYearMtdStart,
    priorYearMtdEnd
  );
  const priorYearMonthToDate = summarizeAppointments(priorYearMtdList);

  const yoyMtdPct = {
    revenue: pctChange(priorYearMonthToDate.revenue, currentMonth.revenue),
    appointments: pctChange(
      priorYearMonthToDate.appointmentCount,
      currentMonth.appointmentCount
    ),
    cancelled: pctChange(
      priorYearMonthToDate.cancelled,
      currentMonth.cancelled
    ),
    avgDuration: pctChange(
      priorYearMonthToDate.avgAppointmentDurationMinutes,
      currentMonth.avgAppointmentDurationMinutes
    ),
  };

  // --- Año contra año: último mes calendario cerrado vs el mismo mes del año anterior (ambos completos) ---
  const lmY = lastMonthStart.getUTCFullYear();
  const lmM = lastMonthStart.getUTCMonth();
  const priorYearLmStart = new Date(Date.UTC(lmY - 1, lmM, 1, 0, 0, 0, 0));
  const priorYearLmEnd = new Date(
    Date.UTC(lmY - 1, lmM + 1, 0, 23, 59, 59, 999)
  );
  const priorYearLastMonthList = filterAppointmentsInRange(
    appointments,
    priorYearLmStart,
    priorYearLmEnd
  );
  const priorYearSameCompletedMonth = summarizeAppointments(
    priorYearLastMonthList
  );

  const yoyCompletedMonthPct = {
    revenue: pctChange(priorYearSameCompletedMonth.revenue, lastMonthFull.revenue),
    appointments: pctChange(
      priorYearSameCompletedMonth.appointmentCount,
      lastMonthFull.appointmentCount
    ),
    cancelled: pctChange(
      priorYearSameCompletedMonth.cancelled,
      lastMonthFull.cancelled
    ),
    avgDuration: pctChange(
      priorYearSameCompletedMonth.avgAppointmentDurationMinutes,
      lastMonthFull.avgAppointmentDurationMinutes
    ),
  };

  const workersRankedMonthToDate = addShareOfPeriod(
    aggregateByWorker(currentMonthList).slice(0, MAX_WORKER_ROWS),
    currentMonth.appointmentCount
  );
  const workersRankedLast7Days = aggregateByWorker(last7List).slice(
    0,
    MAX_WORKER_ROWS
  );
  const workersRankedLastCompletedMonth = addShareOfPeriod(
    aggregateByWorker(lastMonthList).slice(0, MAX_WORKER_ROWS),
    lastMonthFull.appointmentCount
  );

  return {
    asOf: now.toISOString(),
    timezoneNote:
      "Rangos usan fechas en UTC según startsAt guardado en la base.",
    monthToDateVsSameDaysPriorMonth: {
      description:
        "Del día 1 del mes actual hasta hoy, comparado con los mismos días calendario del mes anterior (ajustado si el mes anterior es más corto).",
      currentPeriod: {
        from: ymdUtc(currentMonthStart),
        to: ymdUtc(now),
        ...currentMonth,
      },
      previousPeriod: {
        from: ymdUtc(prevWindowStart),
        to: ymdUtc(prevWindowEnd),
        ...previousMonthSameDays,
      },
      pctChangeVsPrevious: {
        revenue: mtdPct.revenue,
        appointments: mtdPct.appointments,
        cancelled: mtdPct.cancelled,
        avgAppointmentDurationMinutes: mtdPct.avgDuration,
      },
      pctChangeVsPreviousFormatted: {
        revenue: formatPct(mtdPct.revenue),
        appointments: formatPct(mtdPct.appointments),
        cancelled: formatPct(mtdPct.cancelled),
        avgAppointmentDurationMinutes: formatPct(mtdPct.avgDuration),
      },
    },
    lastCompletedCalendarMonth: {
      label: `${lastMonthStart.getUTCFullYear()}-${String(lastMonthStart.getUTCMonth() + 1).padStart(2, "0")}`,
      from: ymdUtc(lastMonthStart),
      to: ymdUtc(lastMonthEnd),
      ...lastMonthFull,
    },
    priorCompletedCalendarMonth: {
      label: `${monthBeforeStart.getUTCFullYear()}-${String(monthBeforeStart.getUTCMonth() + 1).padStart(2, "0")}`,
      from: ymdUtc(monthBeforeStart),
      to: ymdUtc(monthBeforeEnd),
      ...monthBeforeFull,
    },
    monthOverMonthFullMonths: {
      description:
        "Mes calendario completo más reciente que ya cerró vs el mes completo anterior.",
      pctChange: {
        revenue: fullMonthMomPct.revenue,
        appointments: fullMonthMomPct.appointments,
        cancelled: fullMonthMomPct.cancelled,
        avgAppointmentDurationMinutes: fullMonthMomPct.avgDuration,
      },
      pctChangeFormatted: {
        revenue: formatPct(fullMonthMomPct.revenue),
        appointments: formatPct(fullMonthMomPct.appointments),
        cancelled: formatPct(fullMonthMomPct.cancelled),
        avgAppointmentDurationMinutes: formatPct(fullMonthMomPct.avgDuration),
      },
    },
    rolling7DaysVsPrior7Days: {
      description: "Ventana móvil: últimos 7 días vs los 7 días anteriores.",
      last7Days: {
        from: ymdUtc(start7),
        to: ymdUtc(end7),
        ...last7,
      },
      previous7Days: {
        from: ymdUtc(start14),
        to: ymdUtc(start7),
        ...prev7,
      },
      pctChange: {
        revenue: weekPct.revenue,
        appointments: weekPct.appointments,
        cancelled: weekPct.cancelled,
        avgAppointmentDurationMinutes: weekPct.avgDuration,
      },
      pctChangeFormatted: {
        revenue: formatPct(weekPct.revenue),
        appointments: formatPct(weekPct.appointments),
        cancelled: formatPct(weekPct.cancelled),
        avgAppointmentDurationMinutes: formatPct(weekPct.avgDuration),
      },
    },
    yearOverYearMonthToDateVsSameDaysPriorYear: {
      description:
        "Mes en curso (día 1 a hoy) vs los mismos días calendario del mismo mes del año anterior.",
      priorYearPeriod: {
        from: ymdUtc(priorYearMtdStart),
        to: ymdUtc(priorYearMtdEnd),
        ...priorYearMonthToDate,
      },
      pctChangeVsPriorYearSameWindow: {
        revenue: yoyMtdPct.revenue,
        appointments: yoyMtdPct.appointments,
        cancelled: yoyMtdPct.cancelled,
        avgAppointmentDurationMinutes: yoyMtdPct.avgDuration,
      },
      pctChangeVsPriorYearSameWindowFormatted: {
        revenue: formatPct(yoyMtdPct.revenue),
        appointments: formatPct(yoyMtdPct.appointments),
        cancelled: formatPct(yoyMtdPct.cancelled),
        avgAppointmentDurationMinutes: formatPct(yoyMtdPct.avgDuration),
      },
    },
    yearOverYearLastCompletedMonthVsSameMonthPriorYear: {
      description:
        "Último mes calendario ya cerrado vs el mismo mes del año anterior (ambos meses completos).",
      priorYearMonth: {
        label: `${priorYearLmStart.getUTCFullYear()}-${String(priorYearLmStart.getUTCMonth() + 1).padStart(2, "0")}`,
        from: ymdUtc(priorYearLmStart),
        to: ymdUtc(priorYearLmEnd),
        ...priorYearSameCompletedMonth,
      },
      pctChangeVsPriorYearSameMonth: {
        revenue: yoyCompletedMonthPct.revenue,
        appointments: yoyCompletedMonthPct.appointments,
        cancelled: yoyCompletedMonthPct.cancelled,
        avgAppointmentDurationMinutes: yoyCompletedMonthPct.avgDuration,
      },
      pctChangeVsPriorYearSameMonthFormatted: {
        revenue: formatPct(yoyCompletedMonthPct.revenue),
        appointments: formatPct(yoyCompletedMonthPct.appointments),
        cancelled: formatPct(yoyCompletedMonthPct.cancelled),
        avgAppointmentDurationMinutes: formatPct(
          yoyCompletedMonthPct.avgDuration
        ),
      },
    },
    workers: {
      note:
        "Filas por trabajador real del sistema (firstName + lastName). No existe agrupación 'equipo' en datos: tratá 'equipo A' como el trabajador que más concentración tenga (shareOfPeriodAppointmentsPct) si el usuario habla de carga acumulada.",
      rankedByAppointmentsMonthToDate: workersRankedMonthToDate,
      rankedByAppointmentsLast7Days: workersRankedLast7Days,
      rankedByAppointmentsLastCompletedMonth: workersRankedLastCompletedMonth,
    },
  };
}

function buildLocalMetrics({ appointments, workers, services }) {
  const totalAppointments = appointments.length;

  const revenue = appointments.reduce((acc, a) => {
    const price = Number(a?.service?.price || 0);
    return acc + price;
  }, 0);

  const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
  const completed = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "DONE"
  ).length;
  const pending = appointments.filter((a) => a.status === "PENDING").length;

  const byServiceMap = {};
  for (const a of appointments) {
    const name = a?.service?.name || "Sin servicio";
    byServiceMap[name] = (byServiceMap[name] || 0) + 1;
  }

  const byWorkerMap = {};
  for (const a of appointments) {
    const name =
      `${a?.worker?.firstName || ""} ${a?.worker?.lastName || ""}`.trim() ||
      "Sin trabajador";
    byWorkerMap[name] = (byWorkerMap[name] || 0) + 1;
  }

  return {
    totals: {
      totalAppointments,
      revenue,
      cancelled,
      completed,
      pending,
      totalWorkers: workers.length,
      totalServices: services.length,
    },
    byService: Object.entries(byServiceMap).map(([name, value]) => ({
      name,
      value,
    })),
    byWorker: Object.entries(byWorkerMap).map(([name, value]) => ({
      name,
      value,
    })),
  };
}

function buildDashboardContext({ appointments, workers, services }) {
  const overview = buildLocalMetrics({ appointments, workers, services });
  const comparisons = buildComparisons(appointments);
  return {
    overview,
    comparisons,
  };
}

export async function createAIReport(req, res) {
  try {
    const { question, viewPreferences, gadgetIntent } = req.body || {};

    if (!question?.trim()) {
      return res.status(400).json({ error: "Falta la pregunta." });
    }

    const viewsHint =
      viewPreferences && typeof viewPreferences === "object"
        ? JSON.stringify(viewPreferences)
        : "{}";

    const gadgetIntentHint =
      gadgetIntent && typeof gadgetIntent === "object"
        ? JSON.stringify(gadgetIntent)
        : "{}";

    const [appointments, workers, services] = await Promise.all([
      prisma.appointment.findMany({
        include: {
          client: true,
          worker: true,
          service: true,
        },
        orderBy: { startsAt: "asc" },
      }),
      prisma.worker.findMany(),
      prisma.service.findMany({
        where: { isActive: true },
      }),
    ]);

    const metrics = buildDashboardContext({ appointments, workers, services });

    const prompt = `
Eres un analista de negocio para un dashboard de citas.

Responde en español.
Interpretá cualquier pedido del usuario: consejos, comparaciones, alertas, explicaciones o pedidos de visualización basados solo en el contexto.
No inventes cifras ni hechos que no puedas inferir de los datos proporcionados.

Usá el bloque "comparisons" para hablar de variaciones (%): mes actual (MTD) vs los mismos días del mes anterior, mes cerrado vs mes cerrado anterior, y últimos 7 días vs los 7 anteriores.
Usá también:
- comparisons.yearOverYearMonthToDateVsSameDaysPriorYear → MTD este año vs mismos días del mismo mes del año pasado.
- comparisons.yearOverYearLastCompletedMonthVsSameMonthPriorYear → último mes cerrado vs ese mismo mes del año anterior (meses completos).
- comparisons.workers → carga por trabajador (cantidad de citas, ingresos, cancelaciones; shareOfPeriodAppointmentsPct indica concentración en el período).

Cuando cites un porcentaje, que coincida con esos objetos (o indicá que es sobre el total histórico si usás solo "overview").
En los KPIs, el campo "delta" debe reflejar la variación más relevante para esa métrica (preferí MTD vs mismos días del mes anterior para ingresos/citas de "este mes"; si el usuario pide interanual, usá YoY MTD o último mes cerrado YoY).

Si el usuario pide ver **la misma vista que ya existe en el dashboard**, elegí exactamente un valor para mirrorGadget:
- appointments_list → lista de citas / tabla principal de turnos
- calendar → calendario de citas
- rentabilidad → panel de rentabilidad / ingresos por período
- eficiencia → panel de eficiencia operativa
- analisis_servicio → métricas / análisis por servicio
Si no pide duplicar ninguno de esos bloques, mirrorGadget debe ser "none".

Cuando mirrorGadget no sea "none", igualmente completá summary, insights, kpis, chart y actions para contextualizar y dar consejos sobre esa vista.

chart.type debe ser "pie" o "bar" según lo que mejor ilustre la pregunta (el cliente puede mostrar ambos tipos y una tabla usando los mismos datos de chart.data).

Preferencias de vista para el gadget (JSON). El frontend solo muestra las secciones con valor true; igualmente devolvé el objeto de respuesta completo según el schema:
${viewsHint}

Intención del usuario sobre el gadget (JSON): tipo de uso, qué debe mostrar, cómo quiere verlo y opcionalmente un bloque calculation con operation sum|multiply|divide|none y whyThisOperation (motivo de negocio).
${gadgetIntentHint}

Si existe gadgetIntent.calculation y operation es "sum", "multiply" o "divide":
- Aplicá esa operación solo con números que puedas obtener del contexto (overview, comparisons, workers). No inventes series nuevas fuera de los datos.
- Si los datos no alcanzan para el cálculo pedido, decilo en insights y sugerí qué habría que registrar o exportar.
- Respetá calculation.whyThisOperation al explicar en summary por qué ese cálculo es relevante.
- Cuando sea posible, reflejá el resultado en KPIs claros y/o en chart.data si encaja la comparación.

Si gadgetIntent.whatShouldShow u howToVisualize tienen texto, usalos como prioridad junto con la pregunta del usuario.

Pregunta del usuario:
${question}

Contexto del dashboard:
${JSON.stringify(metrics, null, 2)}
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "dashboard_report",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              insights: {
                type: "array",
                items: { type: "string" },
              },
              kpis: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    label: { type: "string" },
                    value: { type: "string" },
                    delta: { type: "string" },
                  },
                  required: ["label", "value", "delta"],
                },
              },
              chart: {
                type: "object",
                additionalProperties: false,
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        name: { type: "string" },
                        value: { type: "number" },
                      },
                      required: ["name", "value"],
                    },
                  },
                },
                required: ["type", "title", "data"],
              },
              actions: {
                type: "array",
                items: { type: "string" },
              },
              mirrorGadget: {
                type: "string",
                enum: [
                  "none",
                  "appointments_list",
                  "calendar",
                  "rentabilidad",
                  "eficiencia",
                  "analisis_servicio",
                ],
              },
            },
            required: [
              "summary",
              "insights",
              "kpis",
              "chart",
              "actions",
              "mirrorGadget",
            ],
          },
        },
      },
    });

    const text =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "{}";

    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      mirrorGadget: parsed.mirrorGadget || "none",
    });
  } catch (error) {
    console.error("AI report error FULL:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      name: error?.name,
      request_id: error?.request_id,
    });

    try {
      const [appointments, workers, services] = await Promise.all([
        prisma.appointment.findMany({
          include: {
            client: true,
            worker: true,
            service: true,
          },
        }),
        prisma.worker.findMany(),
        prisma.service.findMany({
          where: { isActive: true },
        }),
      ]);

      const metrics = buildDashboardContext({ appointments, workers, services });
      const mtd = metrics.comparisons.monthToDateVsSameDaysPriorMonth;
      const mtdPct = mtd?.pctChangeVsPreviousFormatted || {};
      const yoyMtdFmt =
        metrics.comparisons.yearOverYearMonthToDateVsSameDaysPriorYear
          ?.pctChangeVsPriorYearSameWindowFormatted || {};
      const topWorkerMtd =
        metrics.comparisons.workers?.rankedByAppointmentsMonthToDate?.[0];

      return res.status(200).json({
        summary: `En total hay ${metrics.overview.totals.totalAppointments} citas y facturación estimada $${metrics.overview.totals.revenue}. Este mes (MTD) vs mismos días del mes anterior: facturación ${mtdPct.revenue || "n/d"}, citas ${mtdPct.appointments || "n/d"}. YoY MTD facturación ${yoyMtdFmt.revenue || "n/d"}, citas ${yoyMtdFmt.appointments || "n/d"}.`,
        insights: [
          `Canceladas (total): ${metrics.overview.totals.cancelled}`,
          `Pendientes (total): ${metrics.overview.totals.pending}`,
          `Completadas (total): ${metrics.overview.totals.completed}`,
          `Mes cerrado ${metrics.comparisons.lastCompletedCalendarMonth.label}: facturación $${metrics.comparisons.lastCompletedCalendarMonth.revenue} (${metrics.comparisons.monthOverMonthFullMonths.pctChangeFormatted.revenue} vs mes anterior).`,
          `YoY último mes cerrado vs mismo mes año anterior — facturación: ${metrics.comparisons.yearOverYearLastCompletedMonthVsSameMonthPriorYear?.pctChangeVsPriorYearSameMonthFormatted?.revenue || "n/d"}.`,
          topWorkerMtd
            ? `Mayor carga MTD: ${topWorkerMtd.workerName} (${topWorkerMtd.shareOfPeriodAppointmentsPct}% de las citas del mes hasta la fecha).`
            : `Sin citas MTD por trabajador.`,
        ],
        kpis: [
          {
            label: "Citas (total)",
            value: String(metrics.overview.totals.totalAppointments),
            delta: mtdPct.appointments || "n/d",
          },
          {
            label: "Facturación (total)",
            value: `$${metrics.overview.totals.revenue}`,
            delta: mtdPct.revenue || "n/d",
          },
          {
            label: "Facturación este mes (MTD)",
            value: `$${mtd?.currentPeriod?.revenue ?? 0}`,
            delta: mtdPct.revenue || "n/d",
          },
          {
            label: "Fact. MTD YoY",
            value: `$${metrics.comparisons.yearOverYearMonthToDateVsSameDaysPriorYear?.priorYearPeriod?.revenue ?? 0} → $${mtd?.currentPeriod?.revenue ?? 0}`,
            delta: yoyMtdFmt.revenue || "n/d",
          },
        ],
        chart: {
          type: "pie",
          title: "Citas por servicio",
          data: metrics.overview.byService,
        },
        actions: [
          "Revisa el servicio con mayor carga.",
          "Redistribuye citas entre trabajadores con menor ocupación.",
          "Reduce cancelaciones en los bloques con más ausencias.",
        ],
        mirrorGadget: "none",
      });
    } catch (fallbackError) {
      console.error("Fallback metrics error:", fallbackError);

      return res.status(200).json({
        summary:
          "No pude usar OpenAI en este momento. Mostrando un análisis local básico del dashboard.",
        insights: [
          "Revisa el servicio con más citas para detectar saturación.",
          "Compara cancelaciones frente a confirmaciones.",
          "Busca trabajadores con baja carga para redistribuir agenda.",
        ],
        kpis: [{ label: "Estado IA", value: "Fallback local", delta: "0%" }],
        chart: {
          type: "pie",
          title: "Sin datos IA",
          data: [],
        },
        actions: [
          "Verifica la API key y el billing.",
          "Reintenta la consulta.",
          "Usa el análisis local como respaldo.",
        ],
        mirrorGadget: "none",
      });
    }
  }
}