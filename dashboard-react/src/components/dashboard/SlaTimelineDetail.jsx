import React from "react";
import { Button, Badge, Spinner } from "react-bootstrap";
import { Play, CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";

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
    scheduledAt,
    startsAt,
    slaState = "waiting_arrival",
    elapsedSec = 0,
    overdueSec = 0,
    stages = []
  } = appointment;

  const isArrived = Boolean(
    arrivedAt ||
    appointment.status === "EN_ATENCION" ||
    appointment.status === "IN_PROGRESS" ||
    appointment.status === "IN_PROCESS"
  );

  const effectiveSlaState = !isArrived
    ? "waiting_arrival"
    : slaState === "waiting_arrival"
    ? "on_time"
    : slaState;

  const progressPct = isArrived
    ? Math.min(100, Math.round((elapsedSec / Math.max(1, estimatedDurationSec)) * 100))
    : 0;

  const remainingSec = Math.max(0, estimatedDurationSec - elapsedSec);

  // Tiempos formateados
  const scheduledTimeStr = (scheduledAt || startsAt)
    ? new Date(scheduledAt || startsAt).toLocaleTimeString(isEs ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" }) + " hs"
    : "--:--";

  const arrivedTimeStr = arrivedAt
    ? new Date(arrivedAt).toLocaleTimeString(isEs ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" }) + " hs"
    : (isArrived ? (isEs ? "Iniciado reciéntemente" : "Started recently") : (isEs ? "Pendiente" : "Pending"));

  const statusConfig = {
    waiting_arrival: { barColor: "#9ca3af", label: isEs ? "Esperando llegada" : "Awaiting arrival" },
    on_time: { barColor: "#10b981", label: isEs ? "A tiempo" : "On time" },
    at_risk: { barColor: "#f59e0b", label: isEs ? "Por vencer" : "At risk" },
    overdue: { barColor: "#ef4444", label: isEs ? "Excedido" : "Overdue" },
    done: { barColor: "#8b5cf6", label: isEs ? "Finalizado" : "Finished" }
  };

  const cfg = statusConfig[effectiveSlaState] || statusConfig.waiting_arrival;

  // Generar sub-etapas si el backend no envió la lista
  const DEFAULT_STAGE_WEIGHTS = [
    { key: "recepcion", label: isEs ? "1. Recepción" : "1. Reception", weight: 0.10 },
    { key: "servicio", label: isEs ? "2. En servicio" : "2. In Service", weight: 0.75 },
    { key: "cierre", label: isEs ? "3. Cierre y pago" : "3. Checkout & Payment", weight: 0.15 }
  ];

  let runningEst = 0;
  const activeStages = (stages && stages.length > 0) ? stages : DEFAULT_STAGE_WEIGHTS.map((stage) => {
    const stageEstSec = Math.round(stage.weight * estimatedDurationSec);
    const stageStartSec = runningEst;
    const stageEndSec = runningEst + stageEstSec;
    runningEst = stageEndSec;

    let stageState = "pending";
    let stageActualSec = 0;

    if (!isArrived) {
      stageState = "pending";
    } else if (endedAt || elapsedSec >= stageEndSec) {
      stageState = "done";
      stageActualSec = stageEstSec;
    } else if (elapsedSec >= stageStartSec && elapsedSec < stageEndSec) {
      stageState = "current";
      stageActualSec = elapsedSec - stageStartSec;
    } else {
      stageState = "pending";
    }

    return {
      key: stage.key,
      label: stage.label,
      state: stageState,
      estimatedSec: stageEstSec,
      actualSec: stageActualSec,
    };
  });

  return (
    <div className="mt-3 pt-3 border-top bg-light bg-opacity-60 rounded-3 p-3">
      {/* Ficha de Detalles de Inicio y Tiempos */}
      <div className="grid grid-cols-2 gap-2 mb-3 p-2.5 bg-white border rounded-3 shadow-xs text-dark" style={{ fontSize: "12px" }}>
        <div className="d-flex align-items-center gap-1.5">
          <Calendar size={14} className="text-purple-600" />
          <span className="text-muted">{isEs ? "Agendado:" : "Scheduled:"}</span>
          <strong className="text-dark font-monospace">{scheduledTimeStr}</strong>
        </div>
        <div className="d-flex align-items-center gap-1.5">
          <Clock size={14} className="text-success" />
          <span className="text-muted">{isEs ? "Inicio real:" : "Real start:"}</span>
          <strong className="text-dark font-monospace">{arrivedTimeStr}</strong>
        </div>
      </div>

      {/* Barra de progreso animada */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1.5 text-muted smaller">
          <span className="fw-semibold">
            {effectiveSlaState === "waiting_arrival"
              ? (isEs ? "Duración estimada: " : "Estimated duration: ") + formatSecToMinStr(estimatedDurationSec)
              : effectiveSlaState === "done"
              ? (isEs ? "Duración total real: " : "Total duration: ") + formatSecToMinStr(elapsedSec)
              : (isEs ? "Transcurrido: " : "Elapsed: ") + formatSecToMinStr(elapsedSec)}
          </span>

          <span className="fw-bold font-monospace">
            {effectiveSlaState === "waiting_arrival" ? (
              "0%"
            ) : effectiveSlaState === "overdue" ? (
              <span className="text-danger fw-black">+{formatSecToMinStr(overdueSec)} {isEs ? "extra" : "over"} ({progressPct}%)</span>
            ) : effectiveSlaState === "done" ? (
              "100%"
            ) : (
              <span className="text-primary">{progressPct}% (~{formatSecToMinStr(remainingSec)} {isEs ? "restante" : "left"})</span>
            )}
          </span>
        </div>

        <div className="progress rounded-pill" style={{ height: "10px", backgroundColor: "#e5e7eb" }}>
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

      {/* Caja de Acción si no ha llegado la clienta */}
      {!isArrived && (
        <div className="p-2.5 bg-white border rounded-3 d-flex align-items-center justify-content-between mb-3 shadow-xs">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" />
            <span className="small text-muted fw-semibold" style={{ fontSize: "12px" }}>
              {isEs ? "Clienta aún no ha llegado" : "Client has not arrived"}
            </span>
          </div>
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

      {/* Lista visible de sub-etapas del servicio */}
      <div className="d-flex flex-column gap-2 mt-2">
        <span className="text-muted smaller uppercase fw-bold" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>
          {isEs ? "ETAPAS DEL SERVICIO (MODELO MIXTO)" : "SERVICE STAGES"}
        </span>

        {activeStages.map((st, idx) => {
          const isDone = st.state === "done";
          const isCurrent = st.state === "current";

          return (
            <div
              key={st.key || idx}
              className={`p-2 rounded-3 d-flex align-items-center justify-content-between border ${
                isCurrent
                  ? "border-primary bg-white shadow-sm"
                  : isDone
                  ? "border-success-subtle bg-success bg-opacity-10"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
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
                <span className={`small fw-bold ${isCurrent ? "text-primary" : "text-dark"}`}>
                  {st.label}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                {isCurrent && (
                  <Badge bg="primary" className="rounded-pill smaller fw-bold px-2 py-1" style={{ fontSize: "9px" }}>
                    {isEs ? "EN CURSO" : "IN PROGRESS"}
                  </Badge>
                )}
                {isDone && (
                  <Badge bg="success" className="rounded-pill smaller fw-bold px-2 py-1" style={{ fontSize: "9px" }}>
                    {isEs ? "FINALIZADO" : "DONE"}
                  </Badge>
                )}
                {!isDone && !isCurrent && (
                  <Badge bg="secondary" className="rounded-pill smaller fw-normal px-2 py-1 bg-opacity-75" style={{ fontSize: "9px" }}>
                    {isEs ? "PROYECTADO" : "PROJECTED"}
                  </Badge>
                )}
                <span className="smaller text-dark fw-semibold font-monospace" style={{ fontSize: "11.5px" }}>
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
