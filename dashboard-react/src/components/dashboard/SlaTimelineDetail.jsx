import React from "react";
import { Button, Badge, Spinner } from "react-bootstrap";
import { Play, CheckCircle2 } from "lucide-react";

function formatSecToMinStr(seconds) {
  if (!seconds || seconds <= 0) return "0 min";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seg`;
  return `${mins} min${secs > 0 ? ` ${secs}s` : ""}`;
}

export default function SlaTimelineDetail({
  appointment,
  onArrive,
  onComplete,
  actionLoading,
  isEs = true
}) {
  const {
    id,
    estimatedDurationSec = 1800,
    arrivedAt,
    endedAt,
    slaState = "waiting_arrival",
    elapsedSec = 0,
    progressPct = 0,
    overdueSec = 0,
    stages = []
  } = appointment;

  const isArrived = arrivedAt || appointment.status === "EN_ATENCION" || appointment.status === "IN_PROGRESS" || appointment.status === "IN_PROCESS";
  const effectiveSlaState = (!isArrived) ? "waiting_arrival" : (slaState === "waiting_arrival" ? "on_time" : slaState);

  const remainingSec = Math.max(0, estimatedDurationSec - elapsedSec);

  const statusConfig = {
    waiting_arrival: { barColor: "#9ca3af", label: isEs ? "Esperando llegada" : "Awaiting arrival" },
    on_time: { barColor: "#10b981", label: isEs ? "A tiempo" : "On time" },
    at_risk: { barColor: "#f59e0b", label: isEs ? "Por vencer" : "At risk" },
    overdue: { barColor: "#ef4444", label: isEs ? "Excedido" : "Overdue" },
    done: { barColor: "#8b5cf6", label: isEs ? "Finalizado" : "Finished" }
  };

  const cfg = statusConfig[effectiveSlaState] || statusConfig.waiting_arrival;

  return (
    <div className="mt-3 pt-3 border-top bg-light bg-opacity-40 rounded-3 p-3">
      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1 text-muted smaller">
          <span className="fw-semibold">
            {effectiveSlaState === "waiting_arrival"
              ? (isEs ? "Duración estimada: " : "Estimated: ") + formatSecToMinStr(estimatedDurationSec)
              : effectiveSlaState === "done"
              ? (isEs ? "Duración total real: " : "Real total: ") + formatSecToMinStr(elapsedSec)
              : (isEs ? "Transcurrido: " : "Elapsed: ") + formatSecToMinStr(elapsedSec)}
          </span>

          <span className="fw-bold">
            {effectiveSlaState === "waiting_arrival" ? (
              "0%"
            ) : effectiveSlaState === "overdue" ? (
              <span className="text-danger fw-bold">+{formatSecToMinStr(overdueSec)} {isEs ? "de retraso" : "late"}</span>
            ) : effectiveSlaState === "done" ? (
              "100%"
            ) : (
              <span>~{formatSecToMinStr(remainingSec)} {isEs ? "restante" : "remaining"}</span>
            )}
          </span>
        </div>

        <div className="progress rounded-pill" style={{ height: "8px", backgroundColor: "#e5e7eb" }}>
          <div
            className="progress-bar rounded-pill transition-all"
            style={{
              width: `${progressPct}%`,
              backgroundColor: cfg.barColor,
              transition: "width 0.4s ease-in-out"
            }}
          />
        </div>
      </div>

      {/* Acción si no ha llegado */}
      {!isArrived && (
        <div className="p-2.5 bg-white border rounded-3 d-flex align-items-center justify-content-between mb-3">
          <span className="small text-muted fw-semibold">
            {isEs ? " Clienta aún no ha llegado" : " Client has not arrived"}
          </span>
          <Button
            variant="primary"
            size="sm"
            disabled={actionLoading}
            onClick={() => onArrive?.(id)}
            className="rounded-pill px-3 py-1 fw-bold smaller d-flex align-items-center gap-1.5"
            style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
          >
            {actionLoading ? <Spinner size="sm" animation="border" /> : <Play size={13} />}
            <span>{isEs ? "Marcar llegada" : "Mark arrival"}</span>
          </Button>
        </div>
      )}

      {/* Lista de etapas del servicio */}
      <div className="d-flex flex-column gap-2">
        <span className="text-muted smaller uppercase fw-bold" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>
          {isEs ? "Etapas del servicio (Modelo Mixto)" : "Service Stages"}
        </span>

        {stages.map((st, idx) => {
          const isDone = st.state === "done";
          const isCurrent = st.state === "current";

          return (
            <div
              key={st.key || idx}
              className={`p-2 rounded-3 d-flex align-items-center justify-content-between border ${
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
                  style={{ width: "20px", height: "20px", fontSize: "10px" }}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <span className={`small fw-semibold ${isCurrent ? "text-primary" : "text-dark"}`}>
                  {st.label}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                {isCurrent && (
                  <Badge bg="primary" className="rounded-pill smaller fw-bold px-2" style={{ fontSize: "9px" }}>
                    {isEs ? "EN CURSO" : "IN PROGRESS"}
                  </Badge>
                )}
                {isDone && (
                  <Badge bg="success" className="rounded-pill smaller fw-bold px-2" style={{ fontSize: "9px" }}>
                    {isEs ? "REAL" : "REAL"}
                  </Badge>
                )}
                {!isDone && !isCurrent && (
                  <Badge bg="secondary" className="rounded-pill smaller fw-normal px-2 bg-opacity-75" style={{ fontSize: "9px" }}>
                    {isEs ? "ESTIMADO" : "ESTIMATED"}
                  </Badge>
                )}
                <span className="smaller text-muted font-monospace" style={{ fontSize: "11px" }}>
                  {isDone
                    ? (st.durationSeconds ? formatSecToMinStr(st.durationSeconds) : formatSecToMinStr(st.estimatedSec))
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
  );
}
