import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { Clock, AlertCircle, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AgendaSlaSidePanel({
  slaData = {
    pct: 85,
    goalPct: 90,
    onTimeCount: 12,
    atRiskCount: 2,
    breachedCount: 2,
  },
  alerts = [
    {
      id: "a1",
      type: "risk",
      title: "Cita en riesgo",
      timeAgo: "2 min",
      client: "Paula Gómez - 10:00",
      detail: "Llegada esperada: 09:58"
    },
    {
      id: "a2",
      type: "breach",
      title: "Incumplimiento",
      timeAgo: "1 h",
      client: "No Show - 11:00",
      detail: "Sin llegada detectada"
    }
  ],
  stats = {
    avgTimeBetween: "15 min",
    noShowRate: "16.7%",
    estimatedIncome: "$1,850",
    completedServices: 12
  },
  onOpenAlerts,
  onOpenSuggestions
}) {
  const navigate = useNavigate();

  // Calcular el trazo para el SVG Semi-circle gauge
  const radius = 70;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Semi-circulo
  const strokeDashoffset = circumference - (circumference * Math.min(slaData.pct, 100)) / 100;

  return (
    <div className="d-flex flex-column gap-3">
      
      {/* 1. CARD: SLA Citas Hoy */}
      <Card className="border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="fw-black h6 text-dark m-0" style={{ letterSpacing: "-0.01em" }}>
              SLA Citas Hoy
            </h3>
            <span className="badge rounded-pill px-3 py-1 fw-bold smaller d-flex align-items-center gap-1" style={{ backgroundColor: "#d1fae5", color: "#047857", fontSize: "11px" }}>
              <span className="rounded-circle d-inline-block" style={{ width: "6px", height: "6px", backgroundColor: "#10b981" }}></span>
              En tiempo real
            </span>
          </div>

          {/* Semi-gauge Chart */}
          <div className="d-flex flex-column align-items-center justify-content-center py-2">
            <div className="position-relative d-flex flex-column align-items-center justify-content-center" style={{ width: "180px", height: "100px" }}>
              <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
                {/* Background Arc */}
                <path
                  d="M 20 90 A 70 70 0 0 1 160 90"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                {/* Value Arc Gradient */}
                <defs>
                  <linearGradient id="slaGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 90 A 70 70 0 0 1 160 90"
                  fill="none"
                  stroke="url(#slaGaugeGrad)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                />
              </svg>

              <div className="position-absolute text-center" style={{ bottom: "0px" }}>
                <div className="fw-black text-dark lh-1" style={{ fontSize: "32px", letterSpacing: "-0.03em" }}>
                  {slaData.pct}%
                </div>
                <div className="text-muted fw-bold" style={{ fontSize: "11px", marginTop: "2px" }}>
                  Cumplimiento SLA
                </div>
                <div className="text-muted small" style={{ fontSize: "10px", marginTop: "1px" }}>
                  Objetivo: {slaData.goalPct}%
                </div>
              </div>
            </div>
          </div>

          {/* 3 Metrics Boxes */}
          <div className="row g-2 mt-3 pt-2">
            <div className="col-4">
              <div className="p-2.5 rounded-3 text-center" style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }}>
                <div className="fw-black h5 m-0" style={{ color: "#16a34a" }}>
                  {slaData.onTimeCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: "11px" }}>
                  A tiempo
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="p-2.5 rounded-3 text-center" style={{ backgroundColor: "#fffbeb", border: "1px solid #fef3c7" }}>
                <div className="fw-black h5 m-0" style={{ color: "#d97706" }}>
                  {slaData.atRiskCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: "11px" }}>
                  En riesgo
                </div>
              </div>
            </div>

            <div className="col-4">
              <div className="p-2.5 rounded-3 text-center" style={{ backgroundColor: "#fef2f2", border: "1px solid #fee2e2" }}>
                <div className="fw-black h5 m-0" style={{ color: "#dc2626" }}>
                  {slaData.breachedCount}
                </div>
                <div className="text-muted fw-semibold" style={{ fontSize: "11px" }}>
                  Incumplidas
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>


      {/* 2. CARD: Alertas SLA */}
      <Card className="border-0 shadow-sm rounded-4 bg-white">
        <Card.Body className="p-4">
          <h3 className="fw-black h6 text-dark mb-3" style={{ letterSpacing: "-0.01em" }}>
            Alertas SLA
          </h3>

          <div className="d-flex flex-column gap-2.5">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-3 rounded-3 border d-flex align-items-start gap-3 transition-all"
                style={{
                  backgroundColor: alt.type === "risk" ? "#fffbf0" : "#fef8f8",
                  borderColor: alt.type === "risk" ? "#fed7aa" : "#fecdd3"
                }}
              >
                <div className="mt-0.5">
                  {alt.type === "risk" ? (
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: "26px", height: "26px", backgroundColor: "#f59e0b" }}>
                      <Clock size={14} />
                    </div>
                  ) : (
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: "26px", height: "26px", backgroundColor: "#ef4444" }}>
                      <AlertCircle size={14} />
                    </div>
                  )}
                </div>

                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-bold small" style={{ color: alt.type === "risk" ? "#d97706" : "#dc2626" }}>
                      {alt.title}
                    </span>
                    <span className="text-muted smaller" style={{ fontSize: "11px" }}>
                      {alt.timeAgo}
                    </span>
                  </div>
                  <div className="fw-semibold text-dark small text-truncate mt-0.5">
                    {alt.client}
                  </div>
                  <div className="text-muted smaller" style={{ fontSize: "11px" }}>
                    {alt.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="light"
            className="w-100 mt-3 py-2 text-muted fw-bold rounded-3 border-0 bg-light hover-bg-gray-200"
            style={{ fontSize: "12px" }}
            onClick={onOpenAlerts || (() => navigate("/app/sla-today"))}
          >
            Ver todas las alertas
          </Button>
        </Card.Body>
      </Card>


      {/* 3. CARD: Estadísticas del día */}
      <Card className="border-0 shadow-sm rounded-4 bg-white">
        <Card.Body className="p-4">
          <h3 className="fw-black h6 text-dark mb-3" style={{ letterSpacing: "-0.01em" }}>
            Estadísticas del día
          </h3>

          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center justify-content-between py-1.5 border-bottom border-light">
              <span className="text-muted small">Tiempo promedio entre citas</span>
              <span className="fw-bold text-dark small">{stats.avgTimeBetween}</span>
            </div>

            <div className="d-flex align-items-center justify-content-between py-1.5 border-bottom border-light">
              <span className="text-muted small">Tasa de no show</span>
              <span className="fw-bold text-dark small">{stats.noShowRate}</span>
            </div>

            <div className="d-flex align-items-center justify-content-between py-1.5 border-bottom border-light">
              <span className="text-muted small">Ingresos estimados</span>
              <span className="fw-bold text-dark small">{stats.estimatedIncome}</span>
            </div>

            <div className="d-flex align-items-center justify-content-between py-1.5">
              <span className="text-muted small">Servicios completados</span>
              <span className="fw-bold text-dark small">{stats.completedServices}</span>
            </div>
          </div>
        </Card.Body>
      </Card>


      {/* 4. CARD: Optimiza tu agenda (Gradient Soft Purple) */}
      <Card 
        className="border-0 shadow-sm rounded-4 text-dark position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)",
          border: "1px solid #e9d5ff"
        }}
      >
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Sparkles size={18} style={{ color: "#7c3aed" }} />
            <span className="fw-black small" style={{ color: "#5b21b6" }}>
              Optimiza tu agenda
            </span>
          </div>

          <p className="small mb-3" style={{ color: "#3730a3", fontSize: "12px", lineHeight: "1.4" }}>
            Tienes 3 espacios disponibles esta tarde que puedes aprovechar para más citas.
          </p>

          <Button
            variant="white"
            className="btn-sm rounded-3 px-3 py-2 fw-bold bg-white border-0 shadow-xs d-flex align-items-center gap-1"
            style={{ color: "#6d28d9", fontSize: "12px" }}
            onClick={onOpenSuggestions}
          >
            <span>Ver sugerencias</span>
            <ChevronRight size={14} />
          </Button>
        </Card.Body>
      </Card>

    </div>
  );
}
