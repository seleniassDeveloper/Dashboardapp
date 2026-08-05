import React from "react";
import { AlertCircle, Clock, UserCheck, CalendarDays, ArrowRight, Sparkles, CreditCard } from "lucide-react";
import { Badge, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function AttentionWidget({
  appointments = [],
  workers = [],
  onConfirmAppointment,
  onUpdateAppointmentStatus,
  onFinalizeAppointment,
  onViewCalendar,
  onEditWorker,
}) {
  const { i18n } = useTranslation("dashboard");
  const isEs = i18n.language === "es";

  const [dateRange, setDateRange] = React.useState("TODAY");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Citas PENDING filtradas por fecha
  const pendingAppointments = appointments.filter((a) => {
    if (a.status !== "PENDING") return false;
    const date = new Date(a.startsAt);
    
    if (dateRange === "TODAY") {
      return date.toDateString() === now.toDateString();
    } else if (dateRange === "THIS_WEEK") {
      const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 24 * 60 * 60 * 1000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      return date >= startOfWeek && date < endOfWeek;
    } else if (dateRange === "THIS_MONTH") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true; // ALL
  });

  // 2. Colaboradores sin horarios (WorkerSchedule)
  const workersWithoutSchedule = workers.filter((w) => !w.schedules || w.schedules.length === 0);

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getUTCDate() === today.getUTCDate() &&
      d.getUTCMonth() === today.getUTCMonth() &&
      d.getUTCFullYear() === today.getUTCFullYear();
  };

  const isPastDay = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const dDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    return dDate.getTime() < todayDate.getTime();
  };

  const formatCleanTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} hs`;
  };

  const formatCleanDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const alerts = [];

  // 1. Alertas de citas PENDING
  pendingAppointments.forEach((a) => {
    alerts.push({
      id: `pending-${a.id}`,
      type: "pending_appt",
      title: isEs ? `Cita pendiente de ${a.client?.firstName} ${a.client?.lastName || ""}` : `Pending appointment for ${a.client?.firstName} ${a.client?.lastName || ""}`,
      subtitle: isEs 
        ? `${a.service?.name} · ${formatCleanDate(a.startsAt)} a las ${formatCleanTime(a.startsAt)}`
        : `${a.service?.name} · ${formatCleanDate(a.startsAt)} at ${formatCleanTime(a.startsAt)}`,
      icon: Clock,
      badgeText: isEs ? "Pendiente" : "Pending",
      badgeBg: "warning",
      actionText: isEs ? "Confirmar" : "Confirm",
      onClick: () => onConfirmAppointment?.(a.id),
    });
  });

  // 2. Alertas de profesionales sin horario
  workersWithoutSchedule.forEach((w) => {
    alerts.push({
      id: `worker-schedule-${w.id}`,
      type: "worker_schedule",
      title: isEs ? `Profesional sin horario activo: ${w.firstName} ${w.lastName}` : `Staff without active schedule: ${w.firstName} ${w.lastName}`,
      subtitle: isEs ? "Configurá su jornada laboral para habilitar reservas online." : "Configure their working hours to enable online bookings.",
      icon: AlertCircle,
      badgeText: isEs ? "Sin horario" : "No schedule",
      badgeBg: "danger",
      actionText: isEs ? "Editar" : "Edit",
      onClick: () => onEditWorker?.(w.id),
    });
  });

  // 3. Alertas de ciclo de vida del servicio (today o vencidos)
  appointments.forEach((a) => {
    if (["CANCELLED", "DONE"].includes(a.status)) return;

    const start = new Date(a.startsAt);
    const duration = a.service?.duration || 60; // en minutos
    const end = new Date(start.getTime() + duration * 60000);

    const isOverdue = end.getTime() <= now.getTime();
    const isNearStart = start.getTime() - now.getTime() <= 1800000; // empieza en <= 30 mins o ya empezó
    const startsToday = isToday(a.startsAt);
    const startsInPast = isPastDay(a.startsAt);

    if (a.status === "CONFIRMED" && (isNearStart || isOverdue || startsInPast)) {
      alerts.push({
        id: `confirm-arrived-${a.id}`,
        type: "confirm_arrived",
        title: isEs ? `Marcar llegada: ${a.client?.firstName} ${a.client?.lastName || ""}` : `Mark arrived: ${a.client?.firstName} ${a.client?.lastName || ""}`,
        subtitle: isEs 
          ? `${a.service?.name} con ${a.worker?.firstName || "Personal"} · ${formatCleanTime(a.startsAt)}` 
          : `${a.service?.name} with ${a.worker?.firstName || "Staff"} · ${formatCleanTime(a.startsAt)}`,
        icon: UserCheck,
        badgeText: isEs ? "Esperando cliente" : "Waiting client",
        badgeBg: "info",
        actionText: isEs ? "Marcar Llegada" : "Mark Arrived",
        onClick: () => onUpdateAppointmentStatus?.(a.id, "EN_ATENCION", true),
      });
    } else if (a.status === "EN_ATENCION" || a.status === "IN_PROGRESS" || a.status === "IN_PROCESS") {
      alerts.push({
        id: `in-progress-${a.id}`,
        type: "in_progress",
        title: isEs ? `En atención: ${a.client?.firstName} ${a.client?.lastName || ""}` : `In service: ${a.client?.firstName} ${a.client?.lastName || ""}`,
        subtitle: isEs 
          ? `${a.service?.name} · Atiende ${a.worker?.firstName || "Personal"}` 
          : `${a.service?.name} · Served by ${a.worker?.firstName || "Staff"}`,
        icon: Clock,
        badgeText: isEs ? "En atención" : "In Progress",
        badgeBg: "primary",
        actionText: isEs ? "Cobrar y Cerrar" : "Checkout",
        onClick: () => onFinalizeAppointment?.(a),
      });
    } else if (a.status === "PENDING_PAYMENT") {
      alerts.push({
        id: `pending-payment-${a.id}`,
        type: "pending_payment",
        title: isEs 
          ? `Cobro pendiente: ${a.client?.firstName} ${a.client?.lastName || ""}` 
          : `Pending payment: ${a.client?.firstName} ${a.client?.lastName || ""}`,
        subtitle: isEs
          ? `${a.service?.name || "Servicio"} con ${a.worker?.firstName || ""}`
          : `${a.service?.name || "Service"} with ${a.worker?.firstName || ""}`,
        icon: CreditCard,
        badgeText: isEs ? "Por Cobrar" : "Pending Payment",
        badgeBg: "warning",
        actionText: isEs ? "Cobrar y Cerrar" : "Checkout",
        onClick: () => onFinalizeAppointment?.(a),
      });
    }
  });

  // Si no hay alertas reales, agregamos unas simuladas de negocio recomendadas
  if (alerts.length === 0) {
    alerts.push({
      id: "simulated-1",
      type: "tip",
      title: isEs ? "Optimización de horarios" : "Schedule optimization",
      subtitle: isEs 
        ? "Sábado en la tarde registra 95% de ocupación. Considerá agregar bloqueos de descanso."
        : "Saturday afternoon has 95% occupancy. Consider adding rest blocks.",
      icon: CalendarDays,
      badgeText: isEs ? "Tip de IA" : "AI Tip",
      badgeBg: "success",
      actionText: isEs ? "Ver Horarios" : "View Schedules",
      onClick: () => onViewCalendar?.(),
    });
  }

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="small text-muted fw-bold">{isEs ? "Próximas Citas:" : "Upcoming:"}</span>
        
        {/* Selector de Rango con Pills Modernas */}
        <div className="bg-light p-1 rounded-pill border shadow-xs d-flex align-items-center gap-1">
          <Button
            size="sm"
            variant={dateRange === "TODAY" ? "primary" : "link"}
            className={`rounded-pill px-2.5 py-1 fw-bold text-decoration-none border-0 ${
              dateRange === "TODAY" ? "shadow-xs text-white" : "text-muted"
            }`}
            style={dateRange === "TODAY" ? { backgroundColor: "#7c3aed", fontSize: "11px" } : { fontSize: "11px" }}
            onClick={() => setDateRange("TODAY")}
          >
            {isEs ? "Hoy" : "Today"}
          </Button>
          <Button
            size="sm"
            variant={dateRange === "THIS_WEEK" ? "primary" : "link"}
            className={`rounded-pill px-2.5 py-1 fw-bold text-decoration-none border-0 ${
              dateRange === "THIS_WEEK" ? "shadow-xs text-white" : "text-muted"
            }`}
            style={dateRange === "THIS_WEEK" ? { backgroundColor: "#7c3aed", fontSize: "11px" } : { fontSize: "11px" }}
            onClick={() => setDateRange("THIS_WEEK")}
          >
            {isEs ? "Semana" : "Week"}
          </Button>
          <Button
            size="sm"
            variant={dateRange === "THIS_MONTH" ? "primary" : "link"}
            className={`rounded-pill px-2.5 py-1 fw-bold text-decoration-none border-0 ${
              dateRange === "THIS_MONTH" ? "shadow-xs text-white" : "text-muted"
            }`}
            style={dateRange === "THIS_MONTH" ? { backgroundColor: "#7c3aed", fontSize: "11px" } : { fontSize: "11px" }}
            onClick={() => setDateRange("THIS_MONTH")}
          >
            {isEs ? "Mes" : "Month"}
          </Button>
          <Button
            size="sm"
            variant={dateRange === "ALL" ? "primary" : "link"}
            className={`rounded-pill px-2.5 py-1 fw-bold text-decoration-none border-0 ${
              dateRange === "ALL" ? "shadow-xs text-white" : "text-muted"
            }`}
            style={dateRange === "ALL" ? { backgroundColor: "#7c3aed", fontSize: "11px" } : { fontSize: "11px" }}
            onClick={() => setDateRange("ALL")}
          >
            {isEs ? "Todas" : "All"}
          </Button>
        </div>
      </div>

      <div className="d-flex flex-column gap-3 overflow-auto flex-grow-1" style={{ minHeight: "220px" }}>
        {alerts.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              className="p-3 border rounded-3 bg-white shadow-xs transition-all hover-shadow-sm d-flex flex-column justify-content-between"
              style={{ borderColor: "#eaecf0", borderRadius: "12px" }}
            >
              {/* Header: Ícono + Título + Badge */}
              <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2.5 flex-grow-1">
                  <div
                    className="p-2 rounded-circle bg-light text-purple-700 border d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "34px", height: "34px", backgroundColor: "#f3e8ff", borderColor: "#e9d5ff" }}
                  >
                    <IconComp size={16} />
                  </div>
                  <div className="fw-bold text-dark" style={{ fontSize: "14px", lineHeight: "1.3" }}>
                    {item.title}
                  </div>
                </div>
                <Badge
                  bg={item.badgeBg}
                  className="rounded-pill px-2.5 py-1 fw-bold flex-shrink-0"
                  style={{ fontSize: "11px" }}
                >
                  {item.badgeText}
                </Badge>
              </div>

              {/* Subtítulo / Detalles de la cita */}
              <div className="text-muted mb-3 ps-1" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                {item.subtitle}
              </div>

              {/* Acciones del Botón */}
              <div className="d-flex align-items-center justify-content-end gap-2 flex-wrap pt-2 border-top" style={{ borderColor: "#f2f4f7" }}>
                {item.secondaryActionText && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={item.secondaryOnClick}
                    className="rounded-pill px-3 py-1 font-semibold small"
                    style={{ fontSize: "11px" }}
                  >
                    {item.secondaryActionText}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={item.onClick}
                  className="rounded-pill px-2.5 py-1 font-bold d-flex align-items-center gap-1 ms-auto shadow-xs border-0 text-white"
                  style={{
                    fontSize: "11px",
                    backgroundColor: "#7c3aed",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span>{item.actionText}</span>
                  <ArrowRight size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
