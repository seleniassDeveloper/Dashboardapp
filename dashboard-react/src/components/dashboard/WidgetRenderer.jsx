import React, { useMemo } from "react";
import { useBrand } from "../../header/name/BrandProvider";
import { METRIC_OPTIONS, getMetricIcon } from "./WidgetRegistry";
import { useTranslation } from "react-i18next";

// Nuevos componentes modulares
import KPIWidget from "./KPIWidget";
import RevenueWidget from "./RevenueWidget";
import CalendarWidget from "./CalendarWidget";
import ActivityFeedWidget from "./ActivityFeedWidget";
import AttentionWidget from "./AttentionWidget";
import UpcomingAppointmentsWidget from "./UpcomingAppointmentsWidget";

// Mantenemos soporte a tablas e insights simulados
import { Table, Badge, Button } from "react-bootstrap";
import { AlertCircle, CheckCircle } from "lucide-react";

// Formato de moneda base
function baseCurrency(n) {
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
  expenses = [],
  products = [],
  onUpdateAppointmentStatus,
  onConfirmAppointment,
  onFinalizeAppointment,
  onViewCalendar,
  onEditWorker,
  isPreview = false,
}) {
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  const currency = (n) => new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
    style: "currency",
    currency: isEs ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

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
      const name = a?.service?.name || (isEs ? "Sin servicio" : "No service");
      const val = metricType === "revenue" ? Number(a?.service?.price || 0) : 1;
      byServiceMap[name] = (byServiceMap[name] || 0) + val;
    });
    const byService = Object.entries(byServiceMap).map(([name, value]) => ({ name, value }));

    // Agrupación por profesional para gráficos
    const byWorkerMap = {};
    filteredData.forEach((a) => {
      const name = `${a?.worker?.firstName || ""} ${a?.worker?.lastName || ""}`.trim() || (isEs ? "Sin trabajador" : "No worker");
      const val = metricType === "revenue" ? Number(a?.service?.price || 0) : 1;
      byWorkerMap[name] = (byWorkerMap[name] || 0) + val;
    });
    const byWorker = Object.entries(byWorkerMap).map(([name, value]) => ({ name, value }));

    // Agrupación por fecha para series de tiempo
    const byDateMap = {};
    filteredData.forEach((a) => {
      const dateStr = new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { day: "numeric", month: "short" });
      const val = metricType === "revenue" ? Number(a?.service?.price || 0) : 1;
      byDateMap[dateStr] = (byDateMap[dateStr] || 0) + val;
    });
    const byDate = Object.entries(byDateMap).map(([name, value]) => ({ name, value }));

    // Horas Pico de Reserva
    const peakHoursMap = {};
    filteredData.forEach((a) => {
      if (a.status === "CANCELLED") return;
      const start = new Date(a.startsAt);
      const timeStr = start.toLocaleTimeString(isEs ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" }) + (isEs ? " hs" : "");
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
      { name: isEs ? "Recurrentes" : "Recurring", value: recurrentCount },
      { name: isEs ? "Nuevos" : "New", value: newClientsCount },
    ];

    // Fichas Clínicas
    const totalClinicalNotes = clients.filter(c => c.clinicalData || c.notes).length;

    // Gastos Totales
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    // Inventario
    const totalProducts = products.length;

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
      totalClinicalNotes,
      totalExpenses,
      totalProducts,
    };
  }, [appointments, clients, expenses, products, filteredData, widget?.config?.metric]);

  // 3. Renderizado Condicional
  switch (widget?.type) {
    case "kpi": {
      const metricType = widget?.config?.metric || "appointments";
      let displayValue = "";
      let label = "";

      if (metricType === "revenue") {
        displayValue = currency(processedMetrics.totalRevenue);
        label = isEs ? "Ingresos Estimados" : "Estimated Revenue";
      } else if (metricType === "appointments") {
        displayValue = String(processedMetrics.totalAppointments);
        label = isEs ? "Citas Registradas" : "Registered Appointments";
      } else if (metricType === "cancellations") {
        displayValue = `${processedMetrics.cancellationRate}%`;
        label = isEs ? "Tasa de Cancelación" : "Cancellation Rate";
      } else if (metricType === "occupancy") {
        displayValue = `${processedMetrics.occupancyRate}%`;
        label = isEs ? "Ocupación de Horario" : "Schedule Occupancy";
      } else if (metricType === "clients") {
        displayValue = String(clients.length);
        label = isEs ? "Clientes Totales" : "Total Clients";
      } else if (metricType === "peak_hours") {
        const busiest = processedMetrics.peakHours.reduce((max, cur) => (cur.value > (max?.value || 0) ? cur : max), null);
        displayValue = busiest ? busiest.name : "N/A";
        label = isEs ? "Hora Pico de Reservas" : "Peak Booking Hour";
      } else if (metricType === "retention_rate") {
        const total = processedMetrics.retentionRateData.reduce((sum, item) => sum + item.value, 0);
        const recurrent = processedMetrics.retentionRateData.find(d => d.name === (isEs ? "Recurrentes" : "Recurring"))?.value || 0;
        displayValue = total ? `${Math.round((recurrent / total) * 100)}%` : "0%";
        label = isEs ? "Tasa de Retención" : "Retention Rate";
      } else if (metricType === "expenses") {
        displayValue = currency(processedMetrics.totalExpenses);
        label = isEs ? "Gastos Totales" : "Total Expenses";
      } else if (metricType === "inventory") {
        displayValue = String(processedMetrics.totalProducts);
        label = isEs ? "Productos en Inventario" : "Products in Inventory";
      } else if (metricType === "clinical_notes") {
        displayValue = String(processedMetrics.totalClinicalNotes);
        label = isEs ? "Fichas Clínicas" : "Clinical Notes";
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
          title={widget.title || (isEs ? "Métricas de Rendimiento" : "Performance Metrics")}
          chartType={chartType}
          metric={metric}
          chartData={chartData}
          color={accent}
          isPreview={isPreview}
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
          onUpdateAppointmentStatus={onUpdateAppointmentStatus}
          onFinalizeAppointment={onFinalizeAppointment}
          onViewCalendar={onViewCalendar}
          onEditWorker={onEditWorker}
        />
      );
    }

    case "table": {
      const items = appointments.slice(0, 5);

      return (
        <div className="d-flex flex-column h-100 p-1 overflow-hidden">
          <div className="text-muted small fw-bold mb-2">{widget.title || (isEs ? "Resumen de Citas" : "Appointments Summary")}</div>
          <Table responsive hover size="sm" className="mb-0 align-middle">
            <thead>
              <tr style={{ fontSize: "10px" }}>
                <th>{isEs ? "Cliente" : "Client"}</th>
                <th>{isEs ? "Servicio" : "Service"}</th>
                <th>{isEs ? "Colaborador" : "Staff"}</th>
                <th>{isEs ? "Importe" : "Amount"}</th>
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
      const insightsList = isEs ? [
        {
          text: "Tus ingresos bajaron 18% esta semana en comparación con la anterior (debido al feriado de lunes).",
          color: "danger",
          action: "Lanzar Promoción",
          onClick: () => alert("Campañas de descuento express enviadas por correo a clientes recurrentes.")
        },
        {
          text: "Los jueves son tu día más lento: Considera lanzar un 2x1 en tratamientos capilares.",
          color: "info",
          action: "Lanzar 2x1",
          onClick: () => alert("Automatización 2x1 creada para los días Jueves.")
        },
        {
          text: "Este cliente lleva 60 días sin volver: Laura Pérez (Último turno: Balayage).",
          color: "primary",
          action: "Enviar WhatsApp",
          onClick: () => {
            const encoded = encodeURIComponent("¡Hola Laura! Te escribimos de Aura Studio. Hace unos 60 días de tu balayage, queremos ofrecerte un mimo de nutrición gratis con tu próximo turno este sábado. ¿Te agendamos?");
            window.open(`https://wa.me/1154329876?text=${encoded}`, "_blank");
          }
        },
        {
          text: "Coloración genera más ganancias que uñas ($30.000 promedio de ticket vs. $8.000).",
          color: "success",
          action: "Ver Finanzas",
          onClick: () => {
            if (onViewCalendar) onViewCalendar(); // Scroll or move to section
            window.location.hash = "/app/finances";
            alert("Redirigiendo al desglose de Finanzas y comisiones.");
          }
        },
        {
          text: "Tu estilista Andrea tiene la mayor retención de clientes (78% de recurrencia).",
          color: "warning",
          action: "Ver Retención",
          onClick: () => {
            window.location.hash = "/app/team";
            alert("Redirigiendo a Productividad e Invoicing de estilistas.");
          }
        },
        {
          text: "Deberías abrir más horarios los sábados: Tu ocupación entre las 14 y 18 hs ronda el 98%.",
          color: "warning",
          action: "Ampliar Agenda",
          onClick: () => {
            if (onEditWorker) onEditWorker();
          }
        }
      ] : [
        {
          text: "Your income decreased by 18% this week compared to the previous one (due to Monday's holiday).",
          color: "danger",
          action: "Launch Promo",
          onClick: () => alert("Express discount campaigns sent by email to recurring clients.")
        },
        {
          text: "Thursdays are your slowest day: Consider launching a 2x1 on hair treatments.",
          color: "info",
          action: "Launch 2x1",
          onClick: () => alert("2x1 automation created for Thursdays.")
        },
        {
          text: "This client hasn't returned for 60 days: Laura Pérez (Last appointment: Balayage).",
          color: "primary",
          action: "Send WhatsApp",
          onClick: () => {
            const encoded = encodeURIComponent("Hi Laura! We are writing from Aura Studio. It's been about 60 days since your balayage, we want to offer you a free hair care session with your next booking this Saturday. Should we book you in?");
            window.open(`https://wa.me/1154329876?text=${encoded}`, "_blank");
          }
        },
        {
          text: "Coloring generates more profit than nails ($30,000 average ticket vs. $8,000).",
          color: "success",
          action: "View Finances",
          onClick: () => {
            if (onViewCalendar) onViewCalendar(); // Scroll or move to section
            window.location.hash = "/app/finances";
            alert("Redirecting to Finances breakdown and commissions.");
          }
        },
        {
          text: "Your stylist Andrea has the highest client retention (78% recurrence rate).",
          color: "warning",
          action: "View Retention",
          onClick: () => {
            window.location.hash = "/app/team";
            alert("Redirecting to productivity and invoicing of stylists.");
          }
        },
        {
          text: "You should open more slots on Saturdays: Your occupancy between 2 PM and 6 PM is around 98%.",
          color: "warning",
          action: "Extend Schedule",
          onClick: () => {
            if (onEditWorker) onEditWorker();
          }
        }
      ];

      return (
        <div className="d-flex flex-column h-100 p-2">
          <div className="text-muted small fw-bold mb-3 d-flex align-items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <span>{isEs ? "AI Copilot - Sugerencias de Negocio Inteligentes" : "AI Copilot - Intelligent Business Suggestions"}</span>
          </div>
          <div className="d-flex flex-column gap-3 overflow-auto flex-grow-1">
            {insightsList.map((insight, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-4 border-start border-${insight.color} border-4 bg-light d-flex justify-content-between align-items-center flex-wrap gap-2`}
                style={{ fontSize: "12px" }}
              >
                <div className="flex-grow-1 text-dark fw-semibold" style={{ maxWidth: "75%" }}>
                  {insight.text}
                </div>
                <Button 
                  size="sm" 
                  variant={`outline-${insight.color}`} 
                  onClick={insight.onClick}
                  className="rounded-pill px-3 py-1 fw-bold smaller"
                >
                  {insight.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "upcoming_appointments":
      return (
        <UpcomingAppointmentsWidget
          appointments={appointments}
          onConfirmAppointment={onConfirmAppointment}
          onUpdateAppointmentStatus={onUpdateAppointmentStatus}
          onFinalizeAppointment={onFinalizeAppointment}
        />
      );

    default:
      return (
        <div className="text-muted text-center py-4 small">
          {isEs ? "Widget no compatible:" : "Unsupported widget:"} <b>{widget?.type}</b>
        </div>
      );
  }
}
