import React, { useState, useEffect } from "react";
import { Clock, UserCheck, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function UpcomingAppointmentsWidget({
  appointments = [],
  onConfirmAppointment,
  onUpdateAppointmentStatus,
  onFinalizeAppointment,
  defaultRange = "TODAY",
  compact = false,
}) {
  const { i18n } = useTranslation("dashboard");
  const isEs = i18n.language === "es";

  const [dateRange, setDateRange] = useState(defaultRange || "TODAY");

  useEffect(() => {
    if (defaultRange) {
      setDateRange(defaultRange);
    }
  }, [defaultRange]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter and sort appointments
  const upcomingAppointments = appointments
    .filter((a) => {
      if (a.status === "CANCELLED" || a.status === "DONE") return false;
      
      // Always show in-progress appointments in the SLA tracker
      if (a.status === "IN_PROGRESS") return true;

      const date = new Date(a.startsAt);
      
      if (dateRange === "TODAY") {
        return date.toDateString() === now.toDateString();
      } else if (dateRange === "THIS_WEEK") {
        const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        return date >= startOfWeek && date < endOfWeek;
      }
      return true; // ALL
    })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  // Smart fallback: if TODAY has no appointments, but there are appointments in other ranges, default to ALL
  useEffect(() => {
    if (dateRange === "TODAY" && appointments.length > 0) {
      const hasToday = appointments.some(a => {
        if (a.status === "CANCELLED" || a.status === "DONE") return false;
        return new Date(a.startsAt).toDateString() === now.toDateString();
      });
      if (!hasToday) {
        setDateRange("ALL");
      }
    }
  }, [appointments, dateRange]);

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString(isEs ? "es-AR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  };

  const getSLAInfo = (a) => {
    const start = new Date(a.startsAt);
    const duration = a.service?.duration || 60;
    const end = new Date(start.getTime() + duration * 60000);
    const diffMins = Math.round((start.getTime() - now.getTime()) / 60000);

    if (a.status === "PENDING") {
      return { text: isEs ? "Esperando Confirmación" : "Awaiting Confirmation", color: "warning" };
    }
    if (a.status === "CONFIRMED") {
      if (diffMins < 0) return { text: isEs ? `Demorado (${Math.abs(diffMins)}m)` : `Overdue (${Math.abs(diffMins)}m)`, color: "danger" };
      if (diffMins <= 30) return { text: isEs ? `En ${diffMins}m` : `In ${diffMins}m`, color: "info" };
      return { text: isEs ? "A tiempo" : "On time", color: "success" };
    }
    if (a.status === "IN_PROGRESS") {
      const elapsedMins = Math.round((now.getTime() - start.getTime()) / 60000);
      if (elapsedMins > duration) return { text: isEs ? `Excedido (${elapsedMins - duration}m extra)` : `Exceeded (${elapsedMins - duration}m extra)`, color: "danger" };
      return { text: isEs ? `En Curso (${elapsedMins}/${duration}m)` : `In Progress (${elapsedMins}/${duration}m)`, color: "primary" };
    }
    return { text: "", color: "secondary" };
  };

  if (compact) {
    const displayedAppointments = upcomingAppointments.slice(0, 4);

    return (
      <div className="d-flex flex-column gap-2 overflow-auto" style={{ minHeight: "100px", maxHeight: "300px" }}>
        {upcomingAppointments.length === 0 ? (
          <div className="text-center text-muted py-3">
            <Clock size={20} className="opacity-50 mb-1" />
            <p className="small mb-0" style={{ fontSize: "12px" }}>
              {isEs ? "No hay citas próximas hoy." : "No upcoming appointments today."}
            </p>
          </div>
        ) : (
          displayedAppointments.map((a) => {
            const sla = getSLAInfo(a);
            return (
              <div 
                key={a.id} 
                className="d-flex align-items-center justify-content-between py-2 border-bottom last-border-0 gap-2"
                style={{ fontSize: "13px" }}
              >
                {/* Time & Client/Service Info */}
                <div className="d-flex align-items-center gap-2 text-truncate" style={{ flex: 1 }}>
                  <div 
                    className="bg-light rounded d-flex flex-column align-items-center justify-content-center px-1.5 py-1"
                    style={{ minWidth: "52px", height: "40px", border: "1px solid #efecf8" }}
                  >
                    <span className="fw-bold text-dark" style={{ fontSize: "11px", lineHeight: 1.1 }}>
                      {formatTime(a.startsAt)}
                    </span>
                    <span className="text-muted" style={{ fontSize: "8px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.2px" }}>
                      {new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { weekday: 'short' }).replace('.', '')}
                    </span>
                  </div>
                  
                  <div className="text-truncate">
                    <div className="fw-bold text-gray-900 text-truncate" style={{ fontSize: "13px", lineHeight: "1.2" }}>
                      {a.client?.firstName} {a.client?.lastName || ""}
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: "11px", marginTop: "1px" }}>
                      {a.service?.name} · {a.worker?.firstName}
                    </div>
                  </div>
                </div>

                {/* SLA Badge & Action */}
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <Badge 
                    bg={sla.color} 
                    className={`text-${sla.color === "info" || sla.color === "warning" ? "dark" : "white"} rounded-pill border-0 px-2 py-1 fw-bold`}
                    style={{ fontSize: "9px" }}
                  >
                    {sla.text}
                  </Badge>

                  <div className="d-flex align-items-center">
                    {a.status === "PENDING" && (
                      <Button 
                        variant="warning" 
                        size="sm" 
                        className="p-1 rounded-circle d-flex align-items-center justify-content-center text-white" 
                        style={{ width: "26px", height: "26px", backgroundColor: "#f59e0b", border: 0 }}
                        onClick={() => onConfirmAppointment?.(a.id)}
                        title={isEs ? "Confirmar" : "Confirm"}
                      >
                        <CheckCircle2 size={13} />
                      </Button>
                    )}
                    {a.status === "CONFIRMED" && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="p-1 rounded-circle d-flex align-items-center justify-content-center text-white" 
                        style={{ width: "26px", height: "26px", backgroundColor: "#7c5cfc", border: 0 }}
                        onClick={() => onUpdateAppointmentStatus?.(a.id, "IN_PROGRESS")}
                        title={isEs ? "Iniciar SLA" : "Start SLA"}
                      >
                        <PlayCircle size={13} />
                      </Button>
                    )}
                    {a.status === "IN_PROGRESS" && (
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="p-1 rounded-circle d-flex align-items-center justify-content-center text-white" 
                        style={{ width: "26px", height: "26px", backgroundColor: "#10b981", border: 0 }}
                        onClick={() => onFinalizeAppointment?.(a)}
                        title={isEs ? "Finalizar" : "Finish"}
                      >
                        <CheckCircle2 size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {upcomingAppointments.length > 4 && (
          <div className="text-center text-muted small mt-1" style={{ fontSize: "11px" }}>
            {isEs 
              ? `+${upcomingAppointments.length - 4} citas más hoy` 
              : `+${upcomingAppointments.length - 4} more appointments today`}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="small text-muted fw-bold">{isEs ? "SLA de Próximas Citas:" : "Upcoming SLA:"}</span>
        <div className="btn-group" role="group" style={{ transform: "scale(0.85)", transformOrigin: "right" }}>
          <button 
            type="button" 
            className={`btn btn-sm ${dateRange === "TODAY" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setDateRange("TODAY")}
          >
            {isEs ? "Hoy" : "Today"}
          </button>
          <button 
            type="button" 
            className={`btn btn-sm ${dateRange === "THIS_WEEK" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setDateRange("THIS_WEEK")}
          >
            {isEs ? "Semana" : "Week"}
          </button>
          <button 
            type="button" 
            className={`btn btn-sm ${dateRange === "ALL" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setDateRange("ALL")}
          >
            {isEs ? "Todas" : "All"}
          </button>
        </div>
      </div>

      <div className="d-flex flex-column gap-3 overflow-auto flex-grow-1 pe-2" style={{ minHeight: "220px" }}>
        {upcomingAppointments.length === 0 ? (
          <div className="text-center text-muted mt-4">
            <Clock size={32} className="opacity-50 mb-2" />
            <p className="small">{isEs ? "No hay citas próximas en este rango." : "No upcoming appointments in this range."}</p>
          </div>
        ) : (
          upcomingAppointments.map((a) => {
            const sla = getSLAInfo(a);
            return (
              <div key={a.id} className="p-3 border rounded-3 bg-white shadow-sm d-flex flex-column gap-2 hover-shadow transition-all">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "14px" }}>
                      {a.client?.firstName} {a.client?.lastName || ""}
                    </h6>
                    <span className="text-muted small d-block" style={{ fontSize: "12px" }}>
                      {a.service?.name} · {a.worker?.firstName} {a.worker?.lastName}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold d-block text-dark" style={{ fontSize: "14px" }}>
                      {new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { weekday: 'short', day: 'numeric' })} {formatTime(a.startsAt)}
                    </span>
                    <Badge bg={sla.color} className="mt-1" style={{ fontSize: "10px" }}>
                      {sla.text}
                    </Badge>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-2 pt-2 border-top">
                  {a.status === "PENDING" && (
                    <Button variant="warning" size="sm" className="d-flex align-items-center gap-1 rounded-pill" onClick={() => onConfirmAppointment?.(a.id)}>
                      <CheckCircle2 size={14} /> {isEs ? "Confirmar" : "Confirm"}
                    </Button>
                  )}
                  {a.status === "CONFIRMED" && (
                    <Button variant="primary" size="sm" className="d-flex align-items-center gap-1 rounded-pill" onClick={() => onUpdateAppointmentStatus?.(a.id, "IN_PROGRESS")}>
                      <PlayCircle size={14} /> {isEs ? "Iniciar SLA" : "Start SLA"}
                    </Button>
                  )}
                  {a.status === "IN_PROGRESS" && (
                    <Button variant="success" size="sm" className="d-flex align-items-center gap-1 rounded-pill" onClick={() => onFinalizeAppointment?.(a)}>
                      <CheckCircle2 size={14} /> {isEs ? "Finalizar (Checkout)" : "Finish (Checkout)"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
