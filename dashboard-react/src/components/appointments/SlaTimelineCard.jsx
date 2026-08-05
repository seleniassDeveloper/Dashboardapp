import React, { useState } from "react";
import { Card, Button, Badge, ProgressBar, Spinner, Collapse } from "react-bootstrap";
import { User, Clock, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Play, Sparkles } from "lucide-react";

function formatSecToMinStr(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seg`;
  return `${mins} min${secs > 0 ? ` ${secs}s` : ""}`;
}

export default function SlaTimelineCard({ appointment, now, onArrive, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    id,
    clientName,
    serviceName,
    workerName,
    scheduledAt,
    estimatedDurationSec = 1800,
    arrivedAt,
    endedAt,
    slaState: initialSlaState,
    stages = []
  } = appointment;

  // Cálculo en vivo en cliente desde arrivedAt del servidor
  let elapsedSec = 0;
  if (arrivedAt) {
    const startPoint = new Date(arrivedAt).getTime();
    const endPoint = endedAt ? new Date(endedAt).getTime() : (now || new Date()).getTime();
    elapsedSec = Math.max(0, Math.floor((endPoint - startPoint) / 1000));
  }

  let progressPct = 0;
  if (arrivedAt && estimatedDurationSec > 0) {
    progressPct = Math.min(100, Math.round((elapsedSec / estimatedDurationSec) * 1000) / 10);
  }

  // Recálculo dinámico de estado
  let slaState = initialSlaState;
  if (!arrivedAt) {
    slaState = "waiting_arrival";
  } else if (endedAt) {
    slaState = "done";
  } else if (elapsedSec > estimatedDurationSec + 300) {
    slaState = "overdue";
  } else if (elapsedSec >= estimatedDurationSec * 0.85) {
    slaState = "at_risk";
  } else {
    slaState = "on_time";
  }

  const remainingSec = Math.max(0, estimatedDurationSec - elapsedSec);
  const overdueSec = Math.max(0, elapsedSec - estimatedDurationSec);

  const handleArriveClick = async (e) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await onArrive(id);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteClick = async (e) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await onComplete(id);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Estilos según el estado de SLA
  const statusConfig = {
    waiting_arrival: {
      badgeBg: "secondary",
      badgeText: "Esperando llegada",
      barVariant: "secondary",
      barColor: "#9ca3af",
    },
    on_time: {
      badgeBg: "success",
      badgeText: "A tiempo",
      barVariant: "success",
      barColor: "#10b981",
    },
    at_risk: {
      badgeBg: "warning",
      badgeText: "En riesgo",
      barVariant: "warning",
      barColor: "#f59e0b",
    },
    overdue: {
      badgeBg: "danger",
      badgeText: "Retrasado",
      barVariant: "danger",
      barColor: "#ef4444",
    },
    done: {
      badgeBg: "info",
      badgeText: "Completado",
      barVariant: "info",
      barColor: "#8b5cf6",
    }
  };

  const cfg = statusConfig[slaState] || statusConfig.waiting_arrival;

  return (
    <Card
      className="border-0 shadow-sm rounded-4 overflow-hidden mb-3 bg-white hover-shadow-sm transition-all"
      style={{ cursor: "pointer" }}
      onClick={() => setExpanded(!expanded)}
    >
      <Card.Body className="p-3.5">
        {/* Cabecera de la Cita */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2.5">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-circle bg-light d-flex align-items-center justify-content-center text-primary">
              <User size={18} />
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0 fs-6">{clientName}</h6>
              <div className="text-muted smaller d-flex align-items-center gap-2">
                <span className="fw-medium text-purple-700">{serviceName}</span>
                <span>•</span>
                <span>{workerName}</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="text-end">
              <span className="small font-monospace fw-bold text-dark d-block">
                {scheduledAt ? new Date(scheduledAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : ""} hs
              </span>
            </div>
            <Badge bg={cfg.badgeBg} className="rounded-pill px-3 py-1.5 fw-bold text-uppercase smaller" style={{ letterSpacing: "0.03em" }}>
              {cfg.badgeText}
            </Badge>
          </div>
        </div>

        {/* Barra de Progreso SLA */}
        <div className="my-3">
          <div className="d-flex justify-content-between align-items-center mb-1 text-muted smaller">
            <span className="fw-semibold">
              {slaState === "waiting_arrival" ? (
                "Duración estimada: " + formatSecToMinStr(estimatedDurationSec)
              ) : slaState === "done" ? (
                "Duración total real: " + formatSecToMinStr(elapsedSec)
              ) : (
                <>
                  Transcurrido: <span className="fw-bold text-dark">{formatSecToMinStr(elapsedSec)}</span>
                </>
              )}
            </span>

            <span className="fw-bold">
              {slaState === "waiting_arrival" ? (
                "0%"
              ) : slaState === "overdue" ? (
                <span className="text-danger fw-black">+{formatSecToMinStr(overdueSec)} de retraso</span>
              ) : slaState === "done" ? (
                "100%"
              ) : (
                <span>Faltan ~{formatSecToMinStr(remainingSec)}</span>
              )}
            </span>
          </div>

          <div className="progress rounded-pill" style={{ height: "10px", backgroundColor: "#f3f4f6" }}>
            <div
              className={`progress-bar rounded-pill transition-all`}
              style={{
                width: `${progressPct}%`,
                backgroundColor: cfg.barColor,
                transition: "width 0.5s ease-in-out"
              }}
            />
          </div>
        </div>

        {/* Acciones y Botón Desplegable */}
        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
          <Button
            variant="link"
            size="sm"
            className="p-0 text-purple-700 text-decoration-none d-flex align-items-center gap-1.5 smaller fw-bold"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <span>{expanded ? "Ocultar Etapas" : "Tocar para desplegar etapas y tiempos"}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>

          <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {slaState === "waiting_arrival" && (
              <Button
                variant="primary"
                size="sm"
                className="rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5"
                disabled={actionLoading}
                onClick={handleArriveClick}
                style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
              >
                {actionLoading ? <Spinner size="sm" animation="border" /> : <Play size={14} />}
                <span>Marcar llegada</span>
              </Button>
            )}

            {(slaState === "on_time" || slaState === "at_risk" || slaState === "overdue") && (
              <Button
                variant="success"
                size="sm"
                className="rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5"
                disabled={actionLoading}
                onClick={handleCompleteClick}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                {actionLoading ? <Spinner size="sm" animation="border" /> : <CheckCircle2 size={14} />}
                <span>Terminó</span>
              </Button>
            )}
          </div>
        </div>

        {/* Etapas Expandibles (Proyección Mixta) */}
        <Collapse in={expanded}>
          <div className="mt-3 pt-3 border-top bg-light bg-opacity-50 rounded-3 p-3">
            <h6 className="text-muted smaller uppercase fw-bold mb-2.5" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>
              Desglose de Etapas del Servicio (Modelo Mixto)
            </h6>
            <div className="d-flex flex-column gap-2">
              {stages.map((st, idx) => {
                const isDone = st.state === "done";
                const isCurrent = st.state === "current";

                return (
                  <div
                    key={st.key || idx}
                    className={`p-2.5 rounded-3 d-flex align-items-center justify-content-between border ${
                      isCurrent
                        ? "border-primary bg-white shadow-xs"
                        : isDone
                        ? "border-emerald-200 bg-emerald-50 bg-opacity-30"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          isDone
                            ? "bg-success text-white"
                            : isCurrent
                            ? "bg-primary text-white"
                            : "bg-light text-muted border"
                        }`}
                        style={{ width: "22px", height: "22px", fontSize: "11px" }}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span className={`small fw-semibold ${isCurrent ? "text-primary" : "text-dark"}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {isCurrent && (
                        <Badge bg="primary" className="rounded-pill smaller fw-bold px-2">
                          EN CURSO
                        </Badge>
                      )}
                      {isDone && (
                        <Badge bg="success" className="rounded-pill smaller fw-bold px-2">
                          REAL
                        </Badge>
                      )}
                      {!isDone && !isCurrent && (
                        <Badge bg="secondary" className="rounded-pill smaller fw-normal px-2 bg-opacity-75">
                          ESTIMADO
                        </Badge>
                      )}
                      <span className="small text-muted font-monospace">
                        {isDone
                          ? formatSecToMinStr(st.actualSec || st.estimatedSec)
                          : isCurrent
                          ? formatSecToMinStr(st.actualSec)
                          : `~${formatSecToMinStr(st.estimatedSec)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
}
