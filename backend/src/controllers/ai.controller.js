// src/controllers/ai.controller.js
import OpenAI from "openai";
import prisma from "../prisma.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// limpia ```json ... ``` y basura común
function extractJson(raw = "") {
  let t = String(raw).trim();

  // quita fences ```json ... ```
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  // intenta recortar a primer { ... último }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }

  return t;
}

// fallback para poder testear UI aunque OpenAI falle
function mockResponse(appointments = []) {
  // ejemplo básico: torta por servicio
  const byService = new Map();
  for (const a of appointments) {
    const name = a?.service?.name || "Servicio";
    byService.set(name, (byService.get(name) || 0) + 1);
  }

  return {
    title: "Reporte (mock)",
    summaryText:
      "No pude llamar a OpenAI (cuota/billing). Este reporte es de prueba para validar el frontend.",
    widgets: [
      {
        type: "kpis",
        title: "KPIs",
        items: [
          { label: "Citas", value: appointments.length },
          {
            label: "Confirmadas",
            value: appointments.filter((a) => a.status === "CONFIRMED").length,
          },
          {
            label: "Canceladas",
            value: appointments.filter((a) => a.status === "CANCELLED").length,
          },
          { label: "Finalizadas", value: appointments.filter((a) => a.status === "DONE").length },
        ],
      },
      {
        type: "pie",
        title: "Citas por servicio",
        data: Array.from(byService.entries()).map(([name, value]) => ({ name, value })),
        nameKey: "name",
        dataKey: "value",
      },
    ],
  };
}

export async function aiAnalytics(req, res) {
  console.log("OPENAI KEY?", process.env.OPENAI_API_KEY ? "OK" : "NO");

  try {
    const { question, from, to } = req.body;

    const where = {};
    if (from || to) {
      where.startsAt = {};
      if (from) where.startsAt.gte = new Date(from);
      if (to) where.startsAt.lte = new Date(to);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { client: true, service: true, worker: true },
      orderBy: { startsAt: "asc" },
    });

    const system = `
Sos un analista de datos para un dashboard de turnos.
Tu tarea: devolver SOLO JSON válido (sin texto extra).
Ese JSON debe tener:
{
  "title": "string",
  "summaryText": "string",
  "insights": ["string", "..."],
  "widgets": [
    { "type": "kpis", "title": "string", "items": [{ "label": "string", "value": "string|number" }] },
    { "type": "pie", "title": "string", "data": [{ "name":"string", "value": number }], "nameKey":"name", "dataKey":"value" },
    { "type": "bar", "title": "string", "data": [{ "name":"string", "value": number }], "xKey":"name", "series":[{ "key":"value", "name":"Valor" }] },
    { "type": "table", "title": "string", "columns": ["..."], "rows": [{...}] }
  ]
}
Las "insights" deben ser frases cortas en español, claras y accionables, en tono similar a:
- "Tu facturación cayó 12% este mes."
- "Tus tareas se están acumulando en el equipo A."
- "Tus tiempos promedio están aumentando."
Podés ajustar los porcentajes o valores según los datos disponibles.
Reglas: nada de markdown, nada de backticks, nada de explicación fuera del JSON.
`.trim();

    const user = `
Datos (citas) en JSON:
${JSON.stringify(appointments)}

Pedido del usuario:
"${question}"
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      // clave: pedir respuesta en JSON para que sea parseable
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = completion?.choices?.[0]?.message?.content || "";
    const cleaned = extractJson(raw);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("IA no devolvió JSON puro:", raw);
      return res.status(500).json({
        error: "La IA no devolvió JSON válido",
        raw,
      });
    }

    return res.json(parsed);
  } catch (err) {
    // caso cuota/billing
    const code = err?.code || err?.error?.code;
    const status = err?.status || 500;

    console.error("AI ERROR:", status, code, err?.message);

    if (status === 429 || code === "insufficient_quota") {
      // devolvé mock para poder seguir probando el front
      // (si preferís que sea 429 real, cambiamos esto)
      const appointments = await prisma.appointment.findMany({
        include: { client: true, service: true, worker: true },
      });
      return res.status(200).json(mockResponse(appointments));
    }

    return res.status(500).json({
      error: "Error generando reporte IA",
      details: err?.message || String(err),
    });
  }
}