import React, { useState, useEffect, useCallback } from "react";
import { Clock, UserCheck, PlayCircle, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Play } from "lucide-react";
import { Badge, Button, Collapse, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";
import SlaTimelineDetail from "./SlaTimelineDetail";

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
  const [expandedId, setExpandedId] = useState(null);
  const [slaTodayList, setSlaTodayList] = useState([]);
  const [loadingSla, setLoadingSla] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [now, setNow] = useState(new Date());

  // 1. Cargar datos del timeline SLA del servidor (evita cálculo erróneo desde startsAt agendado)
  const fetchSlaToday = useCallback(async () => {
    try {
      setLoadingSla(true);
      const res = await api.get("/appointments/sla-today");
      setSlaTodayList(res.data || []);
    } catch (err) {
      console.error("[UpcomingAppointmentsWidget] Error fetching sla-today:", err);
    } finally {
      setLoadingSla(false);
    }
  }, []);

  useEffect(() => {
    fetchSlaToday();
  }, [fetchSlaToday]);

  // Reloj local en vivo en el cliente (cada 1s) para actualizar transcurrido
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (defaultRange) {
      setDateRange(defaultRange);
    }
  }, [defaultRange]);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filtrar y ordenar citas
  const upcomingAppointments = appointments
    .filter((a) => {
      if (a.status === "CANCELLED" || a.status === "DONE") return false;
      if (a.status === "IN_PROGRESS" || a.status === "EN_ATENCION") return true;

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
  }, [appointments, dateRange, now]);

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

  // Acciones de SLA en backend
  const handleArrive = async (appointmentId) => {
    try {
      setActionLoadingId(appointmentId);
      await api.post(`/appointments/${appointmentId}/arrive`);
      await fetchSlaToday();
      onUpdateAppointmentStatus?.(appointmentId, "EN_ATENCION", true);
    } catch (err) {
      console.error("Error marking arrival:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      setActionLoadingId(appointmentId);
      await api.post(`/appointments/${appointmentId}/complete`);
      await fetchSlaToday();
      const appt = appointments.find(x => x.id === appointmentId);
      if (appt) onFinalizeAppointment?.(appt);
    } catch (err) {
      console.error("Error marking completion:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Arreglo del cálculo de SLA: no restar desde la hora AGENDADA (startsAt)
  const getSLAInfo = (a) => {
    const slaBackend = slaTodayList.find((s) => s.id === a.id);

    if (a.status === "PENDING") {
      return { text: isEs ? "Esperando Confirmación" : "Awaiting Confirmation", color: "warning" };
    }

    const isArrived = slaBackend?.arrivedAt || a.status === "EN_ATENCION" || a.status === "IN_PROGRESS" || a.status === "IN_PROCESS";

    if (!isArrived) {
      return { text: isEs ? "Esperando llegada" : "Awaiting Arrival", color: "secondary" };
    }

    // Cálculo dinámico si llegó la clienta (desde arrivedAt)
    const arrivedTime = slaBackend?.arrivedAt ? new Date(slaBackend.arrivedAt).getTime() : now.getTime();
    const elapsedSec = Math.max(0, Math.floor((now.getTime() - arrivedTime) / 1000));
    const elapsedMins = Math.floor(elapsedSec / 60);
    const estimatedDurationSec = slaBackend?.estimatedDurationSec || (a.service?.duration || 30) * 60;
    const estMins = Math.floor(estimatedDurationSec / 60);

    if (a.status === "DONE" || slaBackend?.slaState === "done") {
      return { text: isEs ? "Finalizada" : "Finished", color: "info" };
    }

    if (elapsedSec > estimatedDurationSec + 300 || slaBackend?.slaState === "overdue") {
      const overdueMins = Math.max(1, Math.floor((elapsedSec - estimatedDurationSec) / 60));
      return {
        text: isEs ? `Excedido (${overdueMins}m extra)` : `Exceeded (${overdueMins}m extra)`,
        color: "danger"
      };
    }

    if (elapsedSec >= estimatedDurationSec * 0.85 || slaBackend?.slaState === "at_risk") {
      return { text: isEs ? "Por vencer" : "At risk", color: "warning" };
    }

    return {
      text: isEs ? `En Curso (${elapsedMins}/${estMins}m)` : `In Progress (${elapsedMins}/${estMins}m)`,
      color: "success"
    };
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (compact) {
    const displayedAppointments = upcomingAppointments;

    return (
      <div className="d-flex flex-column gap-2 overflow-auto pe-1" style={{ minHeight: "100px", maxHeight: "360px" }}>
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
            const slaBackend = slaTodayList.find((s) => s.id === a.id) || a;
            const isExpanded = expandedId === a.id;

            const isArrived = slaBackend?.arrivedAt || a.status === "EN_ATENCION" || a.status === "IN_PROGRESS" || a.status === "IN_PROCESS";
            const effectiveArrivedAt = slaBackend?.arrivedAt || (isArrived ? (a.updatedAt || a.startsAt) : null);
            const computedElapsedSec = slaBackend?.elapsedSec || (effectiveArrivedAt ? Math.max(0, Math.floor((now.getTime() - new Date(effectiveArrivedAt).getTime()) / 1000)) : 0);

            const slaDetailAppt = {
              ...a,
              ...slaBackend,
              scheduledAt: slaBackend?.scheduledAt || a.startsAt,
              startsAt: a.startsAt,
              arrivedAt: effectiveArrivedAt,
              elapsedSec: computedElapsedSec
            };

            return (
              <div
                key={a.id}
                className="py-2.5 px-3 border rounded-3 bg-white hover-shadow-xs transition-all"
                style={{ fontSize: "13px" }}
              >
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div
                    className="d-flex align-items-center gap-2 text-truncate cursor-pointer"
                    style={{ flex: 1 }}
                    onClick={() => toggleExpand(a.id)}
                  >
                    <div
                      className="bg-light rounded d-flex flex-column align-items-center justify-content-center px-1.5 py-1 flex-shrink-0"
                      style={{ minWidth: "52px", height: "40px", border: "1px solid #efecf8" }}
                    >
                      <span className="fw-bold text-dark" style={{ fontSize: "11px", lineHeight: 1.1 }}>
                        {formatTime(a.startsAt)}
                      </span>
                      <span className="text-muted" style={{ fontSize: "8px", textTransform: "uppercase", fontWeight: "600" }}>
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

                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <Badge
                      bg={sla.color}
                      className={`text-${sla.color === "warning" ? "dark" : "white"} rounded-pill border-0 px-2.5 py-1 fw-bold`}
                      style={{ fontSize: "10px" }}
                    >
                      {sla.text}
                    </Badge>

                    <Button
                      variant="link"
                      size="sm"
                      className="p-1 text-muted text-decoration-none"
                      onClick={() => toggleExpand(a.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`sla-detail-${a.id}`}
                      title={isExpanded ? "Ocultar etapas" : "Ver etapas SLA"}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>

                <Collapse in={isExpanded}>
                  <div id={`sla-detail-${a.id}`}>
                    <SlaTimelineDetail
                      appointment={slaDetailAppt}
                      onArrive={handleArrive}
                      onComplete={handleComplete}
                      actionLoading={actionLoadingId === a.id}
                      isEs={isEs}
                    />
                  </div>
                </Collapse>
              </div>
            );
          })
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

      <div className="d-flex flex-column gap-3 overflow-auto flex-grow-1 pe-1" style={{ minHeight: "220px" }}>
        {upcomingAppointments.length === 0 ? (
          <div className="text-center text-muted mt-4">
            <Clock size={32} className="opacity-50 mb-2" />
            <p className="small">{isEs ? "No hay citas próximas en este rango." : "No upcoming appointments in this range."}</p>
          </div>
        ) : (
          upcomingAppointments.map((a) => {
            const sla = getSLAInfo(a);
            const slaBackend = slaTodayList.find((s) => s.id === a.id) || a;
            const isExpanded = expandedId === a.id;
            const isArrived = slaBackend?.arrivedAt || a.status === "EN_ATENCION" || a.status === "IN_PROGRESS" || a.status === "IN_PROCESS";
            const effectiveArrivedAt = slaBackend?.arrivedAt || (isArrived ? (a.updatedAt || a.startsAt) : null);
            const computedElapsedSec = slaBackend?.elapsedSec || (effectiveArrivedAt ? Math.max(0, Math.floor((now.getTime() - new Date(effectiveArrivedAt).getTime()) / 1000)) : 0);

            const slaDetailAppt = {
              ...a,
              ...slaBackend,
              scheduledAt: slaBackend?.scheduledAt || a.startsAt,
              startsAt: a.startsAt,
              arrivedAt: effectiveArrivedAt,
              elapsedSec: computedElapsedSec
            };

            return (
              <div key={a.id} className="p-3 border rounded-3 bg-white shadow-xs d-flex flex-column gap-2 hover-shadow-sm transition-all">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div
                    className="cursor-pointer flex-grow-1"
                    onClick={() => toggleExpand(a.id)}
                  >
                    <h6 className="mb-1 fw-bold text-dark" style={{ fontSize: "14px" }}>
                      {a.client?.firstName} {a.client?.lastName || ""}
                    </h6>
                    <span className="text-muted small d-block" style={{ fontSize: "12px" }}>
                      {a.service?.name} · {a.worker?.firstName} {a.worker?.lastName || ""}
                    </span>
                  </div>

                  <div className="text-end flex-shrink-0">
                    <span className="fw-bold d-block text-dark font-monospace" style={{ fontSize: "13px" }}>
                      {new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { weekday: 'short', day: 'numeric' })} {formatTime(a.startsAt)} hs
                    </span>
                    <Badge bg={sla.color} className="mt-1 px-2.5 py-1 rounded-pill" style={{ fontSize: "10px" }}>
                      {sla.text}
                    </Badge>
                  </div>
                </div>

                {/* Acciones y Toggle Chevron */}
                <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-purple-700 text-decoration-none d-flex align-items-center gap-1 smaller fw-bold"
                    onClick={() => toggleExpand(a.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`sla-detail-full-${a.id}`}
                  >
                    <span>{isExpanded ? (isEs ? "Ocultar etapas" : "Hide stages") : (isEs ? "Ver etapas SLA" : "View SLA stages")}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>

                  <div className="d-flex gap-2">
                    {a.status === "PENDING" && (
                      <Button variant="warning" size="sm" className="d-flex align-items-center gap-1 rounded-pill fw-semibold" onClick={() => onConfirmAppointment?.(a.id)}>
                        <CheckCircle2 size={14} /> {isEs ? "Confirmar" : "Confirm"}
                      </Button>
                    )}

                    {!isArrived && a.status !== "DONE" && a.status !== "CANCELLED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoadingId === a.id}
                        className="d-flex align-items-center gap-1 rounded-pill fw-bold"
                        style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
                        onClick={() => handleArrive(a.id)}
                      >
                        {actionLoadingId === a.id ? <Spinner size="sm" animation="border" /> : <Play size={14} />}
                        {isEs ? "Marcar llegada" : "Mark Arrival"}
                      </Button>
                    )}

                    {isArrived && a.status !== "DONE" && (
                      <Button
                        variant="success"
                        size="sm"
                        disabled={actionLoadingId === a.id}
                        className="d-flex align-items-center gap-1 rounded-pill fw-bold"
                        style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                        onClick={() => handleComplete(a.id)}
                      >
                        {actionLoadingId === a.id ? <Spinner size="sm" animation="border" /> : <CheckCircle2 size={14} />}
                        {isEs ? "Finalizar (Checkout)" : "Finish (Checkout)"}
                      </Button>
                    )}
                  </div>
                </div>

                <Collapse in={isExpanded}>
                  <div id={`sla-detail-full-${a.id}`}>
                    <SlaTimelineDetail
                      appointment={slaDetailAppt}
                      onArrive={handleArrive}
                      onComplete={handleComplete}
                      actionLoading={actionLoadingId === a.id}
                      isEs={isEs}
                    />
                  </div>
                </Collapse>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
