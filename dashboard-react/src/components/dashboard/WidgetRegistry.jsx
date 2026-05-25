import { Scissors, Briefcase, CreditCard, Users, Calendar, AlertTriangle, Clock, UserCheck } from "lucide-react";

export const WIDGET_TYPES = {
  kpi: {
    label: "KPI Tarjeta Simple",
    description: "Muestra una métrica clave con porcentaje de variación.",
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 3 },
  },
  chart: {
    label: "Gráfico Estadístico",
    description: "Representa visualmente los datos (barras, líneas, torta, área).",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  calendar: {
    label: "Agenda / Calendario",
    description: "Agenda compacta con próximas citas y disponibilidad.",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 6, h: 6 },
  },
  activity: {
    label: "Actividad Reciente",
    description: "Bitácora en vivo de citas y clientes creados.",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 6, h: 6 },
  },
  workflows: {
    label: "Pipeline de Procesos",
    description: "Tareas y estados de workflows activos.",
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 6, h: 3 },
    maxSize: { w: 12, h: 6 },
  },
  table: {
    label: "Tabla Inteligente",
    description: "Listado interactivo de citas, clientes o finanzas.",
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 3 },
    maxSize: { w: 12, h: 8 },
  },
  ai_insight: {
    label: "Insight IA Automático",
    description: "Recomendaciones y alertas generadas por Inteligencia Artificial.",
    defaultSize: { w: 12, h: 3 },
    minSize: { w: 6, h: 2 },
    maxSize: { w: 12, h: 6 },
  },
  attention: {
    label: "Requiere Atención",
    description: "Lista operativa de alertas, citas pendientes y tareas urgentes.",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 6, h: 6 },
  },
};

export const METRIC_OPTIONS = [
  { value: "revenue", label: "Facturación (Ingresos)", entity: "appointments" },
  { value: "appointments", label: "Citas Totales", entity: "appointments" },
  { value: "clients", label: "Clientes Activos", entity: "clients" },
  { value: "cancellations", label: "Tasa de Cancelación", entity: "appointments" },
  { value: "occupancy", label: "Porcentaje de Ocupación", entity: "appointments" },
  { value: "services_sales", label: "Ventas por Servicio", entity: "services" },
  { value: "workers_load", label: "Carga por Colaborador", entity: "workers" },
  { value: "peak_hours", label: "Horas Pico de Reserva", entity: "appointments" },
  { value: "retention_rate", label: "Retención de Clientes", entity: "clients" },
];

export const RANGE_OPTIONS = [
  { value: "TODAY", label: "Hoy" },
  { value: "THIS_WEEK", label: "Esta Semana" },
  { value: "THIS_MONTH", label: "Este Mes" },
  { value: "LAST_30_DAYS", label: "Últimos 30 Días" },
  { value: "THIS_YEAR", label: "Este Año" },
  { value: "ALL", label: "Histórico Completo" },
];

export const CHART_TYPES = [
  { value: "bar", label: "Gráfico de Barras" },
  { value: "line", label: "Gráfico de Líneas" },
  { value: "pie", label: "Gráfico de Torta (Pie)" },
  { value: "area", label: "Gráfico de Área" },
];

export const COLOR_PRESETS = [
  { value: "#10b981", label: "Esmeralda Aura" },
  { value: "#3b82f6", label: "Clínico Azul" },
  { value: "#8b5cf6", label: "Violeta Fitness" },
  { value: "#d97706", label: "Ámbar Madera" },
  { value: "#ec4899", label: "Rosa Spa" },
  { value: "#6b7280", label: "Mínimo Gris" },
];

// Retorna el icono apropiado según la métrica o entidad
export function getMetricIcon(metric, size = 18) {
  switch (metric) {
    case "revenue":
      return <CreditCard size={size} />;
    case "appointments":
      return <Calendar size={size} />;
    case "clients":
      return <Users size={size} />;
    case "cancellations":
      return <AlertTriangle size={size} />;
    case "services_sales":
      return <Scissors size={size} />;
    case "workers_load":
      return <Briefcase size={size} />;
    case "peak_hours":
      return <Clock size={size} />;
    case "retention_rate":
      return <UserCheck size={size} />;
    default:
      return <Calendar size={size} />;
  }
}
