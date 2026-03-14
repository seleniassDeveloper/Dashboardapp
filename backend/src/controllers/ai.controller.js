import OpenAI from "openai";
import prisma from "../prisma.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function createAIReport(req, res) {
  try {
    const { question } = req.body || {};

    if (!question?.trim()) {
      return res.status(400).json({ error: "Falta la pregunta." });
    }

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

    const metrics = buildLocalMetrics({ appointments, workers, services });

    const prompt = `
Eres un analista de negocio para un dashboard de citas.

Responde en español.
Analiza los datos del negocio y devuelve decisiones accionables.
No inventes datos que no estén en el contexto.

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
            },
            required: ["summary", "insights", "kpis", "chart", "actions"],
          },
        },
      },
    });

    const text =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "{}";

    const parsed = JSON.parse(text);
    return res.json(parsed);
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

      const metrics = buildLocalMetrics({ appointments, workers, services });

      return res.status(200).json({
        summary: `Tienes ${metrics.totals.totalAppointments} citas y una facturación estimada de $${metrics.totals.revenue}.`,
        insights: [
          `Canceladas: ${metrics.totals.cancelled}`,
          `Pendientes: ${metrics.totals.pending}`,
          `Completadas: ${metrics.totals.completed}`,
        ],
        kpis: [
          {
            label: "Citas",
            value: String(metrics.totals.totalAppointments),
            delta: "0%",
          },
          {
            label: "Facturación",
            value: `$${metrics.totals.revenue}`,
            delta: "0%",
          },
          {
            label: "Canceladas",
            value: String(metrics.totals.cancelled),
            delta: "0%",
          },
        ],
        chart: {
          type: "pie",
          title: "Citas por servicio",
          data: metrics.byService,
        },
        actions: [
          "Revisa el servicio con mayor carga.",
          "Redistribuye citas entre trabajadores con menor ocupación.",
          "Reduce cancelaciones en los bloques con más ausencias.",
        ],
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
      });
    }
  }
}