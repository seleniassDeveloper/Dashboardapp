import React, { useMemo } from "react";
import { useBrand } from "../../header/name/BrandProvider";
import { METRIC_OPTIONS, getMetricIcon } from "./WidgetRegistry";

// Nuevos componentes modulares
import KPIWidget from "./KPIWidget";
import RevenueWidget from "./RevenueWidget";
import CalendarWidget from "./CalendarWidget";
import ActivityFeedWidget from "./ActivityFeedWidget";
import AttentionWidget from "./AttentionWidget";

// Mantenemos soporte a tablas e insights simulados
import { Table, Badge } from "react-bootstrap";
import { AlertCircle, CheckCircle } from "lucide-react";

// Formato de moneda ARS
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function WidgetRenderer({
  widget,
  appointments = [],
  clients = [],
  workers = [],
  services = [],
  onUpdateAppointmentStatus,
  onConfirmAppointment,
  onViewCalendar,
  onEditWorker,
}) {
  const { brand } = useBrand();
  const accent = widget?.config?.color || brand?.accentColor || "#10b981";

  // 1. Filtrar datos según el rango de fecha
  const filteredData = useMemo(() => {
    const range = widget?.config?.range || "ALL";
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return appointments.filter((a) => {
      const date = new Date(a.startsAt);
      if (range === "TODAY") {
        return date >= startOfToday;
      }
      if (range === "THIS_WEEK") {
        const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 24 * 60 * 60 * 1000);
        return date >= startOfWeek;
      }
      if (range === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return date >= startOfMonth;
      }
      if (range === "LAST_30_DAYS") {
        const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= thirtyDaysAgo;
      }
      if (range === "THIS_YEAR") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return date >= startOfYear;
      }
      return true;
    });
  }, [appointments, widget?.config?.range]);

  // 2. Procesar métricas para KPIs y Gráficos
  const processedMetrics = useMemo(() => {
    const metricType = widget?.config?.metric || "appointments";
    
    // Conteo total de citas
    const totalAppointments = filteredData.length;
    
    // Ingresos
    const totalRevenue = filteredData.reduce((acc, a) => acc + Number(a?.service?.price || 0), 0);
    
    // Tasa de cancelaciones
    const cancelledCount = filteredData.filter((a) => a.status === "CANCELLED").length;
    const cancellationRate = totalAppointments ? Math.round((cancelledCount / totalAppointments) * 100) : 0;

    // Tasa de ocupación
    const occupancyRate = totalAppointments ? Math.round((filteredData.filter((a) => ["CONFIRMED", "DONE"].includes(a.status)).length / totalAppointments) * 100) : 0;

    // Agrupación por servicio para gráficos
    const byServiceMap = {};
    filteredData.forEach((a) => {
      const name = a?.service?.name || "Sin servicio";
      const val = metricType === "revenue" ? Number(a?.service?.price || 0) : 1;
      byServiceMap[name] = (byServiceMap[name] || 0) + val;
    });
    const byService = Object.entries(byServiceMap).map(([name, value]) => ({ name, value }));

    // Agrupación por profesional para gráficos
    const byWorkerMap = {};
    filteredData.forEach((a) => {
      const name = `${a?.worker?.firstName || ""} ${a?.worker?.lastName || ""}`.trim() || "Sin trabajador";
      const val = metricType === "revenue" ? Number(a?.service?.price || 0) : 1;
      byWorkerMap[name] = (byWorkerMap[name] || 0) + val;
    });
    const byWorker = Object.entries(byWorkerMap).map(([name, value]) => ({ name, value }));

    // Agrupación por fecha para series de tiempo
    const byDateMap = {};
    filteredData.forEach((a) => {
      const dateStr = new Date(a.startsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      const val = metricType === "revenue" ? Number(a?.service?.price || 0) : 1;
      byDateMap[dateStr] = (byDateMap[dateStr] || 0) + val;
    });
    const byDate = Object.entries(byDateMap).map(([name, value]) => ({ name, value }));

    // Horas Pico de Reserva
    const peakHoursMap = {};
    filteredData.forEach((a) => {
      if (a.status === "CANCELLED") return;
      const start = new Date(a.startsAt);
      const timeStr = start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " hs";
      peakHoursMap[timeStr] = (peakHoursMap[timeStr] || 0) + 1;
    });
    const peakHours = Object.entries(peakHoursMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Retención de Clientes
    const clientApptCounts = {};
    appointments.forEach((a) => {
      if (a.clientId && a.status !== "CANCELLED") {
        clientApptCounts[a.clientId] = (clientApptCounts[a.clientId] || 0) + 1;
      }
    });
    let recurrentCount = 0;
    let newClientsCount = 0;
    Object.values(clientApptCounts).forEach((count) => {
      if (count > 1) recurrentCount++;
      else newClientsCount++;
    });
    const retentionRateData = [
      { name: "Recurrentes", value: recurrentCount },
      { name: "Nuevos", value: newClientsCount },
    ];

    return {
      totalAppointments,
      totalRevenue,
      cancellationRate,
      occupancyRate,
      byService,
      byWorker,
      byDate,
      peakHours,
      retentionRateData,
    };
  }, [appointments, filteredData, widget?.config?.metric]);

  // 3. Renderizado Condicional
  switch (widget?.type) {
    case "kpi": {
      const metricType = widget?.config?.metric || "appointments";
      let displayValue = "";
      let label = "";

      if (metricType === "revenue") {
        displayValue = currency(processedMetrics.totalRevenue);
        label = "Ingresos Estimados";
      } else if (metricType === "appointments") {
        displayValue = String(processedMetrics.totalAppointments);
        label = "Citas Registradas";
      } else if (metricType === "cancellations") {
        displayValue = `${processedMetrics.cancellationRate}%`;
        label = "Tasa de Cancelación";
      } else if (metricType === "occupancy") {
        displayValue = `${processedMetrics.occupancyRate}%`;
        label = "Ocupación de Horario";
      } else if (metricType === "clients") {
        displayValue = String(clients.length);
        label = "Clientes Totales";
      } else if (metricType === "peak_hours") {
        const busiest = processedMetrics.peakHours.reduce((max, cur) => (cur.value > (max?.value || 0) ? cur : max), null);
        displayValue = busiest ? busiest.name : "N/A";
        label = "Hora Pico de Reservas";
      } else if (metricType === "retention_rate") {
        const total = processedMetrics.retentionRateData.reduce((sum, item) => sum + item.value, 0);
        const recurrent = processedMetrics.retentionRateData.find(d => d.name === "Recurrentes")?.value || 0;
        displayValue = total ? `${Math.round((recurrent / total) * 100)}%` : "0%";
        label = "Tasa de Retención";
      }

      // Buscar ícono en Registry si es necesario
      const Icon = getMetricIcon ? getMetricIcon(metricType) : null;

      return (
        <KPIWidget
          title={widget.title || label}
          value={displayValue}
          percentage={12.4} // Simulado para fines operativos de diseño
          trend="up"
          color={accent}
          icon={Icon}
        />
      );
    }

    case "chart": {
      const chartType = widget?.config?.chartType || "bar";
      const metric = widget?.config?.metric || "appointments";
      
      let chartData = processedMetrics.byDate;
      if (metric === "services_sales") chartData = processedMetrics.byService;
      if (metric === "workers_load") chartData = processedMetrics.byWorker;
      if (metric === "peak_hours") chartData = processedMetrics.peakHours;
      if (metric === "retention_rate") chartData = processedMetrics.retentionRateData;

      return (
        <RevenueWidget
          title={widget.title || "Métricas de Rendimiento"}
          chartType={chartType}
          metric={metric}
          chartData={chartData}
          color={accent}
        />
      );
    }

    case "calendar": {
      return (
        <CalendarWidget
          appointments={appointments}
          workers={workers}
          services={services}
          color={accent}
          onUpdateAppointmentStatus={onUpdateAppointmentStatus}
        />
      );
    }

    case "activity": {
      return (
        <ActivityFeedWidget
          appointments={appointments}
          clients={clients}
        />
      );
    }

    case "attention": {
      return (
        <AttentionWidget
          appointments={appointments}
          workers={workers}
          onConfirmAppointment={onConfirmAppointment}
          onViewCalendar={onViewCalendar}
          onEditWorker={onEditWorker}
        />
      );
    }

    case "table": {
      const items = appointments.slice(0, 5);

      return (
        <div className="d-flex flex-column h-100 p-1 overflow-hidden">
          <div className="text-muted small fw-bold mb-2">{widget.title || "Resumen de Citas"}</div>
          <Table responsive hover size="sm" className="mb-0 align-middle">
            <thead>
              <tr style={{ fontSize: "10px" }}>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Colaborador</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "12px" }}>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="fw-semibold text-dark">{a.client?.firstName} {a.client?.lastName}</td>
                  <td>{a.service?.name}</td>
                  <td className="text-muted">{a.worker?.firstName}</td>
                  <td className="fw-bold text-dark">{currency(a.service?.price)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      );
    }

    case "ai_insight": {
      const insights = widget?.config?.insights || [
        "El volumen de facturación ha crecido un 15% este mes gracias a las campañas promocionales.",
        "Se detecta saturación horaria los sábados por la tarde, considera habilitar agendas extras.",
      ];

      return (
        <div className="d-flex flex-column h-100 p-2">
          <div className="text-muted small fw-bold mb-3 d-flex align-items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <span>AI Copilot Insights</span>
          </div>
          <div className="d-grid gap-2 overflow-auto">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-3 rounded-3 border-start border-success border-4 bg-light small text-muted">
                {insight}
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="text-muted text-center py-4 small">
          Widget no compatible: <b>{widget?.type}</b>
        </div>
      );
  }
}
