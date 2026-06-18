import { Scissors, Briefcase, CreditCard, Users, Calendar, AlertTriangle, Clock, UserCheck, Archive, FileText, TrendingDown } from "lucide-react";

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
  upcoming_appointments: {
    label: "Próximas Citas (SLA)",
    description: "Lista de siguientes citas con seguimiento de SLA para gestionar su estado.",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    maxSize: { w: 6, h: 8 },
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
  { value: "expenses", label: "Gastos Totales", entity: "expenses" },
  { value: "inventory", label: "Inventario de Productos", entity: "products" },
  { value: "clinical_notes", label: "Fichas Clínicas", entity: "clinical_notes" },
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
    case "expenses":
      return <TrendingDown size={size} />;
    case "inventory":
      return <Archive size={size} />;
    case "clinical_notes":
      return <FileText size={size} />;
    default:
      return <Calendar size={size} />;
  }
}

export function getWidgetTypes(isEs) {
  return {
    kpi: {
      label: isEs ? "KPI Tarjeta Simple" : "KPI Simple Card",
      description: isEs ? "Muestra una métrica clave con porcentaje de variación." : "Displays a key metric with variation percentage.",
      defaultSize: { w: 4, h: 2 },
      minSize: { w: 3, h: 2 },
      maxSize: { w: 6, h: 3 },
    },
    chart: {
      label: isEs ? "Gráfico Estadístico" : "Statistical Chart",
      description: isEs ? "Representa visualmente los datos (barras, líneas, torta, área)." : "Visually represents data (bars, lines, pie, area).",
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      maxSize: { w: 12, h: 6 },
    },
    calendar: {
      label: isEs ? "Agenda / Calendario" : "Schedule / Calendar",
      description: isEs ? "Agenda compacta con próximas citas y disponibilidad." : "Compact schedule with upcoming appointments and availability.",
      defaultSize: { w: 4, h: 4 },
      minSize: { w: 4, h: 3 },
      maxSize: { w: 6, h: 6 },
    },
    activity: {
      label: isEs ? "Actividad Reciente" : "Recent Activity",
      description: isEs ? "Bitácora en vivo de citas y clientes creados." : "Live feed of appointments and created clients.",
      defaultSize: { w: 4, h: 4 },
      minSize: { w: 3, h: 3 },
      maxSize: { w: 6, h: 6 },
    },
    workflows: {
      label: isEs ? "Pipeline de Procesos" : "Process Pipeline",
      description: isEs ? "Tareas y estados de workflows activos." : "Tasks and states of active workflows.",
      defaultSize: { w: 8, h: 4 },
      minSize: { w: 6, h: 3 },
      maxSize: { w: 12, h: 6 },
    },
    table: {
      label: isEs ? "Tabla Inteligente" : "Smart Table",
      description: isEs ? "Listado interactivo de citas, clientes o finanzas." : "Interactive listing of appointments, clients or finances.",
      defaultSize: { w: 12, h: 4 },
      minSize: { w: 6, h: 3 },
      maxSize: { w: 12, h: 8 },
    },
    ai_insight: {
      label: isEs ? "Insight IA Automático" : "Automated AI Insight",
      description: isEs ? "Recomendaciones y alertas generadas por Inteligencia Artificial." : "Recommendations and alerts generated by Artificial Intelligence.",
      defaultSize: { w: 12, h: 3 },
      minSize: { w: 6, h: 2 },
      maxSize: { w: 12, h: 6 },
    },
    attention: {
      label: isEs ? "Requiere Atención" : "Requires Attention",
      description: isEs ? "Lista operativa de alertas, citas pendientes y tareas urgentes." : "Operational list of alerts, pending appointments and urgent tasks.",
      defaultSize: { w: 4, h: 3 },
      minSize: { w: 3, h: 3 },
      maxSize: { w: 6, h: 6 },
    },
  };
}

export function getMetricOptions(isEs) {
  return [
    { value: "revenue", label: isEs ? "Facturación (Ingresos)" : "Billing (Revenue)", entity: "appointments" },
    { value: "appointments", label: isEs ? "Citas Totales" : "Total Appointments", entity: "appointments" },
    { value: "clients", label: isEs ? "Clientes Activos" : "Active Clients", entity: "clients" },
    { value: "cancellations", label: isEs ? "Tasa de Cancelación" : "Cancellation Rate", entity: "appointments" },
    { value: "occupancy", label: isEs ? "Porcentaje de Ocupación" : "Occupancy Percentage", entity: "appointments" },
    { value: "services_sales", label: isEs ? "Ventas por Servicio" : "Sales by Service", entity: "services" },
    { value: "workers_load", label: isEs ? "Carga por Colaborador" : "Load per Staff Member", entity: "workers" },
    { value: "peak_hours", label: isEs ? "Horas Pico de Reserva" : "Peak Booking Hours", entity: "appointments" },
    { value: "retention_rate", label: isEs ? "Retención de Clientes" : "Client Retention Rate", entity: "clients" },
    { value: "expenses", label: isEs ? "Gastos Totales" : "Total Expenses", entity: "expenses" },
    { value: "inventory", label: isEs ? "Inventario de Productos" : "Product Inventory", entity: "products" },
    { value: "clinical_notes", label: isEs ? "Fichas Clínicas" : "Clinical Notes", entity: "clinical_notes" },
  ];
}

export function getRangeOptions(isEs) {
  return [
    { value: "TODAY", label: isEs ? "Hoy" : "Today" },
    { value: "THIS_WEEK", label: isEs ? "Esta Semana" : "This Week" },
    { value: "THIS_MONTH", label: isEs ? "Este Mes" : "This Month" },
    { value: "LAST_30_DAYS", label: isEs ? "Últimos 30 Días" : "Last 30 Days" },
    { value: "THIS_YEAR", label: isEs ? "Este Año" : "This Year" },
    { value: "ALL", label: isEs ? "Histórico Completo" : "Complete History" },
  ];
}

export function getChartTypes(isEs) {
  return [
    { value: "bar", label: isEs ? "Gráfico de Barras" : "Bar Chart" },
    { value: "line", label: isEs ? "Gráfico de Líneas" : "Line Chart" },
    { value: "pie", label: isEs ? "Gráfico de Torta (Pie)" : "Pie Chart" },
    { value: "area", label: isEs ? "Gráfico de Área" : "Area Chart" },
  ];
}

export function getColorPresets(isEs) {
  return [
    { value: "#10b981", label: isEs ? "Esmeralda Aura" : "Aura Emerald" },
    { value: "#3b82f6", label: isEs ? "Clínico Azul" : "Clinical Blue" },
    { value: "#8b5cf6", label: isEs ? "Violeta Fitness" : "Fitness Violet" },
    { value: "#d97706", label: isEs ? "Ámbar Madera" : "Wood Amber" },
    { value: "#ec4899", label: isEs ? "Rosa Spa" : "Spa Pink" },
    { value: "#6b7280", label: isEs ? "Mínimo Gris" : "Minimal Gray" },
  ];
}
