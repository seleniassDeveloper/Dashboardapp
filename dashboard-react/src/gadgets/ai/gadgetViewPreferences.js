/** Claves de vistas disponibles para gadgets generados desde el chat IA */

export const GADGET_VIEW_KEYS = [
  "summary",
  "kpis",
  "insights",
  "actions",
  "chartPie",
  "chartBar",
  "chartTable",
  "mirrorEmbedded",
];

export const VIEW_LABELS = {
  summary: "Resumen de texto",
  kpis: "Tarjetas KPI",
  insights: "Lista de insights",
  actions: "Acciones recomendadas",
  chartPie: "Gráfico circular (torta)",
  chartBar: "Gráfico de barras",
  chartTable: "Tabla de datos del gráfico",
  mirrorEmbedded:
    "Vista del dashboard embebida (si la IA devolvió mirrorGadget)",
};

export const DEFAULT_VIEW_PREFERENCES = Object.fromEntries(
  GADGET_VIEW_KEYS.map((k) => [k, true])
);

export function normalizeViewPreferences(raw) {
  const out = { ...DEFAULT_VIEW_PREFERENCES };
  if (!raw || typeof raw !== "object") return out;
  for (const key of GADGET_VIEW_KEYS) {
    if (key in raw) out[key] = Boolean(raw[key]);
  }
  return out;
}

/** Cómo armar las vistas según una sola elección (sin checkboxes). */
export const GADGET_PRESENTATION_OPTIONS = [
  {
    value: "full",
    label:
      "Completa: texto, KPIs, torta, barras, tabla, acciones y vista embebida si aplica",
    views: {
      summary: true,
      kpis: true,
      insights: true,
      actions: true,
      chartPie: true,
      chartBar: true,
      chartTable: true,
      mirrorEmbedded: true,
    },
  },
  {
    value: "executive",
    label: "Ejecutiva: resumen, KPIs, insights y acciones (sin gráficos)",
    views: {
      summary: true,
      kpis: true,
      insights: true,
      actions: true,
      chartPie: false,
      chartBar: false,
      chartTable: false,
      mirrorEmbedded: false,
    },
  },
  {
    value: "charts_mix",
    label: "Gráficos: KPIs + torta + barras + tabla",
    views: {
      summary: true,
      kpis: true,
      insights: true,
      actions: true,
      chartPie: true,
      chartBar: true,
      chartTable: true,
      mirrorEmbedded: false,
    },
  },
  {
    value: "numbers_focus",
    label: "Solo números: KPIs y tabla",
    views: {
      summary: true,
      kpis: true,
      insights: false,
      actions: false,
      chartPie: false,
      chartBar: false,
      chartTable: true,
      mirrorEmbedded: false,
    },
  },
  {
    value: "conversation",
    label: "Tipo conversación: resumen corto + insights + acciones",
    views: {
      summary: true,
      kpis: false,
      insights: true,
      actions: true,
      chartPie: false,
      chartBar: false,
      chartTable: false,
      mirrorEmbedded: false,
    },
  },
  {
    value: "mirror_heavy",
    label: "Priorizar vista del dashboard embebida + KPIs y texto breve",
    views: {
      summary: true,
      kpis: true,
      insights: true,
      actions: false,
      chartPie: false,
      chartBar: false,
      chartTable: false,
      mirrorEmbedded: true,
    },
  },
];

export function viewsFromPresentationPreset(presetValue) {
  const opt = GADGET_PRESENTATION_OPTIONS.find((o) => o.value === presetValue);
  return opt?.views ? { ...opt.views } : { ...DEFAULT_VIEW_PREFERENCES };
}

/** Qué datos debe priorizar la IA en el gadget (solo `<select>`). */
export const GADGET_CONTENT_FOCUS_OPTIONS = [
  {
    value: "auto",
    label: "Que la IA priorice según el propósito que elegiste",
  },
  {
    value: "volume",
    label: "Cantidad de citas y ocupación de agenda",
  },
  {
    value: "revenue",
    label: "Ingresos estimados y precios por servicio",
  },
  {
    value: "states",
    label: "Estados de las citas (pendientes, confirmadas, canceladas…)",
  },
  {
    value: "workers",
    label: "Trabajadores y reparto de carga",
  },
  {
    value: "services",
    label: "Servicios más pedidos o rentables",
  },
  {
    value: "period_compare",
    label: "Comparar este período con otro (mes / semana / año)",
  },
  {
    value: "duration_efficiency",
    label: "Duración de citas y eficiencia",
  },
  {
    value: "risk_alerts",
    label: "Riesgos, picos y alertas",
  },
];

/** Para qué sirve el gadget (solo `<select>`). */
export const GADGET_PURPOSE_OPTIONS = [
  { value: "explore", label: "Explorar o consultar datos generales" },
  { value: "compare_periods", label: "Comparar períodos (mes, semana, año)" },
  { value: "compare_workers", label: "Comparar trabajadores / reparto de carga" },
  { value: "compare_services", label: "Comparar servicios o ventas por servicio" },
  { value: "revenue_billing", label: "Ingresos, facturación o ticket medio" },
  { value: "cancellations_quality", label: "Cancelaciones, ausencias o calidad" },
  { value: "occupancy_schedule", label: "Ocupación de agenda y horarios" },
  { value: "efficiency_duration", label: "Duración de citas / eficiencia operativa" },
  { value: "clients_focus", label: "Clientes o historial de citas" },
  { value: "goals_tracking", label: "Seguimiento de metas u objetivos" },
  { value: "alerts_monitoring", label: "Alertas y monitoreo de desvíos" },
  { value: "executive_summary", label: "Resumen ejecutivo para informes" },
  { value: "mirror_section", label: "Duplicar una vista del dashboard" },
  { value: "team_distribution", label: "Distribución por equipo / rol (según trabajadores)" },
  {
    value: "forecast_trend",
    label: "Tendencias o lectura prospectiva (con datos disponibles)",
  },
  { value: "calculate", label: "Calcular métricas derivadas (sumas, ratios…)" },
  { value: "advice", label: "Consejos y próximos pasos de negocio" },
  { value: "other", label: "Otro (lo detallo en mi mensaje para la IA)" },
];

export const PURPOSE_LABELS = Object.fromEntries(
  GADGET_PURPOSE_OPTIONS.map((o) => [o.value, o.label])
);

export const CALCULATION_TOGGLE_OPTIONS = [
  { value: "no", label: "No — solo interpretación con los datos" },
  { value: "yes", label: "Sí — aplicar una operación sobre valores" },
];

export const CALCULATION_OPERATION_OPTIONS = [
  { value: "none", label: "Que la IA elija la operación según los datos" },
  { value: "sum", label: "Sumar" },
  { value: "multiply", label: "Multiplicar" },
  { value: "divide", label: "Dividir (ratio, promedio, etc.)" },
];

export const CALCULATION_OPERATION_LABELS = Object.fromEntries(
  CALCULATION_OPERATION_OPTIONS.map((o) => [o.value, o.label])
);

/** Motivo del cálculo (solo `<select>`); si elegís mensaje a la IA, lo escribís abajo. */
export const CALCULATION_REASON_PRESETS = [
  {
    value: "explain_in_message",
    label: "Lo detallo en mi mensaje para la IA (abajo)",
  },
  {
    value: "total_revenue",
    label: "Obtener ingreso total estimado del período",
  },
  {
    value: "avg_per_unit",
    label: "Promedio por cita o por día",
  },
  {
    value: "cancel_rate",
    label: "Ratio o porcentaje de cancelaciones",
  },
  {
    value: "share_mix",
    label: "Participación o mezcla porcentual entre categorías",
  },
  {
    value: "compare_two_numbers",
    label: "Comparar dos cantidades (diferencia o cociente)",
  },
];

export const CALCULATION_REASON_LABELS = Object.fromEntries(
  CALCULATION_REASON_PRESETS.map((o) => [o.value, o.label])
);

/**
 * Validación cuando el cálculo requiere aclaración en el mensaje a la IA.
 */
export function validateGadgetCalculationForAiMessage({
  calculationEnabled,
  calculationOperation,
  calculationReasonPreset,
  aiMessageText,
}) {
  if (
    calculationEnabled &&
    calculationOperation !== "none" &&
    calculationReasonPreset === "explain_in_message" &&
    String(aiMessageText || "").trim().length < 12
  ) {
    return "Si elegís sumar, multiplicar o dividir y el motivo es «detallarlo en tu mensaje», escribí abajo una frase clara para la IA.";
  }
  return null;
}

/**
 * Payload enviado al backend para enriquecer el prompt del gadget.
 * Todo es elegible por `<select>` salvo el mensaje final al modelo.
 */
export function buildGadgetIntentPayload({
  purpose = "explore",
  contentFocus = "auto",
  presentationPreset = "full",
  calculationEnabled = false,
  calculationOperation = "none",
  calculationReasonPreset = "explain_in_message",
}) {
  const contentOpt = GADGET_CONTENT_FOCUS_OPTIONS.find(
    (o) => o.value === contentFocus
  );
  const presOpt = GADGET_PRESENTATION_OPTIONS.find(
    (o) => o.value === presentationPreset
  );

  const payload = {
    purpose: GADGET_PURPOSE_OPTIONS.some((o) => o.value === purpose) ?
        purpose
      : "explore",
    contentFocus,
    presentationPreset,
    whatShouldShow: contentOpt?.label ?? "",
    howToVisualize: presOpt?.label ?? "",
    calculation: null,
  };

  if (!calculationEnabled) return payload;

  const op =
    CALCULATION_OPERATION_OPTIONS.some((o) => o.value === calculationOperation) ?
      calculationOperation
    : "none";

  const reasonOpt = CALCULATION_REASON_PRESETS.find(
    (o) => o.value === calculationReasonPreset
  );

  const whyThisOperation =
    calculationReasonPreset === "explain_in_message" ? ""
    : reasonOpt?.label ? String(reasonOpt.label)
    : "";

  payload.calculation = {
    operation: op,
    whyThisOperation,
    reasonPreset: calculationReasonPreset,
  };

  return payload;
}
