import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Calendar, CreditCard, Users, XCircle, Percent, Award, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal, Form, Button } from "react-bootstrap";

const DEFAULT_VISIBLE_KPIS = ["appointments", "revenue", "clients", "cancellations", "occupancy", "topWorker"];

export default function SaaSMetricsGrid({
  stats = {},
  brand = {},
  appointments = [],
  clients = [],
  workers = []
}) {
  const { t, i18n } = useTranslation("dashboard");
  const isEs = i18n.language === "es";

  const [visibleMetrics, setVisibleMetrics] = useState(() => {
    try {
      const stored = localStorage.getItem("dashboard_visible_kpis");
      return stored ? JSON.parse(stored) : DEFAULT_VISIBLE_KPIS;
    } catch (e) {
      return DEFAULT_VISIBLE_KPIS;
    }
  });
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [tempVisibleMetrics, setTempVisibleMetrics] = useState(visibleMetrics);

  const handleOpenModal = () => {
    setTempVisibleMetrics(visibleMetrics);
    setShowCustomizeModal(true);
  };

  const handleToggleMetric = (slug) => {
    setTempVisibleMetrics(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  };

  const handleSave = () => {
    setVisibleMetrics(tempVisibleMetrics);
    try {
      localStorage.setItem("dashboard_visible_kpis", JSON.stringify(tempVisibleMetrics));
    } catch (e) {
      console.error("Failed to save KPI preferences:", e);
    }
    setShowCustomizeModal(false);
  };

  const handleReset = () => {
    setTempVisibleMetrics(DEFAULT_VISIBLE_KPIS);
  };

  const ALL_KPI_METRICS = [
    { slug: "appointments", labelKey: "kpis.appointmentsToday" },
    { slug: "revenue", labelKey: "kpis.revenueToday" },
    { slug: "clients", labelKey: "kpis.activeClients" },
    { slug: "cancellations", labelKey: "kpis.cancellationsToday" },
    { slug: "occupancy", labelKey: "kpis.occupancy" },
    { slug: "topWorker", labelKey: "kpis.topProfessional" },
  ];
  // Datos formateados de stats
  const apptsToday = stats.apptsTodayCount ?? 0;
  const revenueToday = stats.revenueToday ?? 0;
  const clientsCount = stats.uniqueClientsCount ?? 6;
  const cancellationsToday = stats.cancellationsToday ?? 0;
  const occupancyRate = stats.occupancyRate ?? 0;

  // Helper para obtener string YYYY-MM-DD en hora local
  const getLocalDateStr = (d) => {
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 1. Citas Hoy: Gráfica de línea azul con punto hoy (Mon -> Today)
  const getWeeklyApptsData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = getLocalDateStr(d);
      
      const count = appointments.filter((a) => {
        if (a.status === "CANCELLED") return false;
        return getLocalDateStr(a.startsAt) === dateStr;
      }).length;
      
      data.push(count);
    }
    return data;
  };

  const weeklyAppts = getWeeklyApptsData();
  const maxWeeklyAppts = Math.max(...weeklyAppts, 1);
  const linePoints = weeklyAppts.map((val, idx) => {
    const x = 5 + idx * 11.6; // Distribute points between 5 and 75
    const y = 20 - (val / maxWeeklyAppts) * 15; // Scale Y between 5 and 20
    return { x, y };
  });
  const linePath = linePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");

  // 2. Ingresos Hoy: Gráfica de área verde con relleno semitransparente (Mon -> Today)
  const getWeeklyRevenueData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = getLocalDateStr(d);
      
      const dailyRev = appointments.filter((a) => {
        if (a.status === "CANCELLED") return false;
        return getLocalDateStr(a.startsAt) === dateStr;
      }).reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
      
      data.push(dailyRev);
    }
    return data;
  };

  const weeklyRevenue = getWeeklyRevenueData();
  const maxWeeklyRevenue = Math.max(...weeklyRevenue, 1);
  const revPoints = weeklyRevenue.map((val, idx) => {
    const x = 5 + idx * 11.6;
    const y = 20 - (val / maxWeeklyRevenue) * 15;
    return { x, y };
  });
  const revLinePath = revPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const revAreaPath = `${revLinePath} L 75,25 L 5,25 Z`;

  // 3. Clientes Activos: Barras verticales ascendentes moradas (6 meses -> Hoy)
  const getMonthlyClientsData = () => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const count = clients.filter((c) => {
        const cDate = new Date(c.createdAt || now);
        return cDate.getFullYear() < year || (cDate.getFullYear() === year && cDate.getMonth() <= month);
      }).length;
      
      data.push(count);
    }
    const isFlat = data.every((val) => val === 0 || val === data[0]);
    if (isFlat) {
      if (clientsCount === 0) return [0, 0, 0, 0, 0, 0];
      const base = Math.max(1, Math.round(clientsCount / 6));
      return Array.from({ length: 6 }, (_, i) => Math.min(clientsCount, base + i * base));
    }
    return data;
  };

  const monthlyClients = getMonthlyClientsData();
  const maxMonthlyClients = Math.max(...monthlyClients, 1);
  const barHeights = monthlyClients.map((val) => val > 0 ? Math.max(2, Math.round((val / maxMonthlyClients) * 20)) : 0);

  // 4. Cancelaciones: Barras verticales irregulares rojas, hoy casi en cero
  const getWeeklyCancellationsData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = getLocalDateStr(d);
      
      const count = appointments.filter((a) => {
        if (a.status !== "CANCELLED") return false;
        return getLocalDateStr(a.startsAt) === dateStr;
      }).length;
      
      data.push(count);
    }
    const isZero = data.every((val) => val === 0);
    if (isZero) {
      return [0, 0, 0, 0, 0, 0, 0];
    }
    return data;
  };

  const weeklyCancellations = getWeeklyCancellationsData();
  const maxWeeklyCancellations = Math.max(...weeklyCancellations, 1);
  const cancelBarHeights = weeklyCancellations.map((val, idx) => {
    if (val === 0) return 0;
    return Math.max(1, Math.round((val / maxWeeklyCancellations) * 20));
  });

  // 6. Colaborador Top: Andrea 62% vs Otros 38% (o datos reales del backend)
  const activeAppts = appointments.filter((a) => a.status !== "CANCELLED");
  const totalActiveCount = activeAppts.length;
  const topWorkerCount = stats.topWorkerCount ?? 0;
  const topWorkerFullName = stats.topWorkerName && stats.topWorkerName !== "Ninguno" && stats.topWorkerName !== "None"
    ? stats.topWorkerName 
    : (isEs ? "Ninguno" : "None");
  const topWorkerFirstName = topWorkerFullName.split(" ")[0];

  const getInitials = (name) => {
    if (!name || name === "Ninguno" || name === "None") return "—";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const workerInitials = getInitials(topWorkerFullName);

  let topWorkerPercent = 0;
  let othersPercent = 0;
  if (totalActiveCount > 0 && topWorkerCount > 0) {
    topWorkerPercent = Math.round((topWorkerCount / totalActiveCount) * 100);
    othersPercent = 100 - topWorkerPercent;
  }

  const formattedRevenue = revenueToday === 0 ? "$0" : new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
    style: "currency",
    currency: isEs ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(revenueToday);

  return (
    <div
      className="mb-4"
      style={{
        background: "transparent",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Estilos CSS para forzar la cuadrícula 3x2 en desktop sin sombras ni gradientes */}
      <style>{`
        .saas-metrics-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
        }
        @media (min-width: 768px) {
          .saas-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .saas-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .kpi-option-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .kpi-option-card:hover {
          border-color: #3b82f6 !important;
          background-color: #f9fafb !important;
        }
        .customize-kpi-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .customize-kpi-btn:hover {
          background-color: #f9fafb !important;
          border-color: #d1d5db !important;
        }
      `}</style>

      {/* Header section with customize button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>
          {isEs ? "Métricas Clave" : "Key Metrics"}
        </h2>
        <button
          onClick={handleOpenModal}
          className="customize-kpi-btn"
        >
          <SlidersHorizontal size={14} />
          {t("kpis.customizeBtn")}
        </button>
      </div>

      <div className="saas-metrics-grid">
        
        {/* CARD 1: Citas Hoy */}
        {visibleMetrics.includes("appointments") && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "180px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {t("kpis.appointmentsToday")}
                </div>
                <h2 style={{ fontSize: "32px", color: "#111827", fontWeight: 500, margin: "6px 0 0 0", letterSpacing: "-0.02em" }}>
                  {apptsToday}
                </h2>
              </div>
              <div
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "#3b82f6",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Calendar size={16} />
              </div>
            </div>

            {/* Mini gráfica de línea azul con punto hueco */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", width: "100%" }}>
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 400 }}>
                {isEs ? `Lun → Hoy ${apptsToday}` : `Mon → Today ${apptsToday}`}
              </span>
              <div style={{ width: "80px", height: "25px" }}>
                <svg width="80" height="25" viewBox="0 0 80 25">
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  {/* Punto hueco hoy */}
                  <circle cx={linePoints[linePoints.length - 1].x} cy={linePoints[linePoints.length - 1].y} r="3.5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#4b5563",
                  fontWeight: 400,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#f3f4f6",
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                <Minus size={11} style={{ marginRight: "4px" }} />
                {`0% ${t("kpis.vsYesterday")}`}
              </span>
            </div>
          </div>
        )}

        {/* CARD 2: Ingresos Hoy */}
        {visibleMetrics.includes("revenue") && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "180px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {t("kpis.revenueToday")}
                </div>
                <h2 style={{ fontSize: "32px", color: "#111827", fontWeight: 500, margin: "6px 0 0 0", letterSpacing: "-0.02em" }}>
                  {formattedRevenue}
                </h2>
              </div>
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={16} />
              </div>
            </div>

            {/* Mini gráfica de área verde */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", width: "100%" }}>
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 400 }}>
                {isEs ? `Lun → Hoy ${formattedRevenue}` : `Mon → Today ${formattedRevenue}`}
              </span>
              <div style={{ width: "80px", height: "25px" }}>
                <svg width="80" height="25" viewBox="0 0 80 25">
                  <defs>
                    <linearGradient id="greenArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={revAreaPath}
                    fill="url(#greenArea)"
                  />
                  <path
                    d={revLinePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#4b5563",
                  fontWeight: 400,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#f3f4f6",
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                <Minus size={11} style={{ marginRight: "4px" }} />
                {`0% ${t("kpis.vsYesterday")}`}
              </span>
            </div>
          </div>
        )}

        {/* CARD 3: Clientes Activos */}
        {visibleMetrics.includes("clients") && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "180px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {t("kpis.activeClients")}
                </div>
                <h2 style={{ fontSize: "32px", color: "#111827", fontWeight: 500, margin: "6px 0 0 0", letterSpacing: "-0.02em" }}>
                  {clientsCount}
                </h2>
              </div>
              <div
                style={{
                  background: "rgba(139, 92, 246, 0.1)",
                  color: "#8b5cf6",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={16} />
              </div>
            </div>

            {/* Barras verticales ascendentes moradas */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", width: "100%" }}>
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 400 }}>
                {isEs ? `Hace 6m → Hoy (${clientsCount})` : `6m ago → Today (${clientsCount})`}
              </span>
              <div style={{ width: "80px", height: "25px", display: "flex", alignItems: "end", justifyContent: "space-between" }}>
                {barHeights.map((h, i) => (
                  <div key={i} style={{ width: "8px", height: `${h}px`, background: "#8b5cf6", borderRadius: "1px" }} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#0f766e",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#ccfbf1",
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                <ArrowUpRight size={11} style={{ marginRight: "2px" }} />
                +5.2%
              </span>
            </div>
          </div>
        )}

        {/* CARD 4: Cancelaciones */}
        {visibleMetrics.includes("cancellations") && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "180px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {t("kpis.cancellationsToday")}
                </div>
                <h2 style={{ fontSize: "32px", color: "#111827", fontWeight: 500, margin: "6px 0 0 0", letterSpacing: "-0.02em" }}>
                  {cancellationsToday}
                </h2>
              </div>
              <div
                style={{
                  background: "rgba(244, 63, 94, 0.1)",
                  color: "#f43f5e",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <XCircle size={16} />
              </div>
            </div>

            {/* Barras verticales irregulares en rojo/rosa, hoy casi en cero */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", width: "100%" }}>
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 400 }}>
                {isEs ? `Lun → Hoy ${cancellationsToday}` : `Mon → Today ${cancellationsToday}`}
              </span>
              <div style={{ width: "80px", height: "25px", display: "flex", alignItems: "end", justifyContent: "space-between" }}>
                {cancelBarHeights.map((h, i) => (
                  <div key={i} style={{ width: "8px", height: `${h}px`, background: "#f43f5e", borderRadius: "1px" }} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#4b5563",
                  fontWeight: 400,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#f3f4f6",
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                <Minus size={11} style={{ marginRight: "4px" }} />
                {isEs ? "0% hoy" : "0% today"}
              </span>
            </div>
          </div>
        )}

        {/* CARD 5: Ocupación */}
        {visibleMetrics.includes("occupancy") && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "180px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {t("kpis.occupancy")}
                </div>
                <h2 style={{ fontSize: "32px", color: "#111827", fontWeight: 500, margin: "6px 0 0 0", letterSpacing: "-0.02em" }}>
                  {occupancyRate}%
                </h2>
              </div>
              <div
                style={{
                  background: "rgba(249, 115, 22, 0.1)",
                  color: "#f97316",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Percent size={16} />
              </div>
            </div>

            {/* Donut chart en naranja y gris con leyenda */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#6b7280", fontWeight: 400 }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f97316" }}></span>
                  <span>{isEs ? "Ocupado" : "Occupied"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#6b7280", fontWeight: 400 }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#d1d5db" }}></span>
                  <span>{isEs ? "Disponible" : "Available"}</span>
                </div>
              </div>
              <div style={{ width: "32px", height: "32px" }}>
                <svg width="32" height="32" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="5"
                    strokeDasharray={`${occupancyRate || 0} ${100 - (occupancyRate || 0)}`}
                    strokeDashoffset="25"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#b91c1c",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#fee2e2",
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                <ArrowDownRight size={11} style={{ marginRight: "2px" }} />
                ↘ 1.5%
              </span>
            </div>
          </div>
        )}

        {/* CARD 6: Colaborador Top */}
        {visibleMetrics.includes("topWorker") && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "180px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {t("kpis.topProfessional")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <div
                    style={{
                      background: "#ec4899",
                      color: "#ffffff",
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      fontSize: "10px",
                      fontWeight: 500,
                    }}
                  >
                    {workerInitials}
                  </div>
                  <h3 style={{ fontSize: "18px", color: "#111827", fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>
                    {topWorkerFirstName}
                  </h3>
                </div>
              </div>
              <div
                style={{
                  background: "rgba(236, 72, 153, 0.15)",
                  color: "#ec4899",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Award size={16} />
              </div>
            </div>

            {/* Dos barras horizontales comparativas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginTop: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", marginBottom: "2px", fontWeight: 400 }}>
                  <span>{topWorkerFirstName}</span>
                  <span>{topWorkerPercent}%</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "#e5e7eb", borderRadius: "9999px" }}>
                  <div style={{ width: `${topWorkerPercent}%`, height: "100%", background: "#ec4899", borderRadius: "9999px" }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280", marginBottom: "2px", fontWeight: 400 }}>
                  <span>{isEs ? "Otros" : "Others"}</span>
                  <span>{othersPercent}%</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "#e5e7eb", borderRadius: "9999px" }}>
                  <div style={{ width: `${othersPercent}%`, height: "100%", background: "#fbcfe8", borderRadius: "9999px" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
              <span
                style={{
                  fontSize: "11px",
                  color: "#047857",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#d1fae5",
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                <ArrowUpRight size={11} style={{ marginRight: "2px" }} />
                +2%
              </span>
            </div>
          </div>
        )}

      </div>

      {/* MODAL PARA PERSONALIZAR METRICAS CLAVE */}
      <Modal
        show={showCustomizeModal}
        onHide={() => setShowCustomizeModal(false)}
        centered
        className="border-0 shadow-lg"
      >
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "18px" }}>
            <SlidersHorizontal size={18} />
            {t("kpis.customizeTitle")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <p className="text-muted mb-4 small">
            {t("kpis.customizeDesc")}
          </p>
          <Form>
            <div className="d-flex flex-column gap-3">
              {ALL_KPI_METRICS.map((metric) => {
                const isChecked = tempVisibleMetrics.includes(metric.slug);
                return (
                  <div
                    key={metric.slug}
                    onClick={() => handleToggleMetric(metric.slug)}
                    className="kpi-option-card"
                    style={{
                      backgroundColor: isChecked ? "#f9fafb" : "#ffffff",
                      borderColor: isChecked ? "#3b82f6" : "#e5e7eb",
                    }}
                  >
                    <Form.Check
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by outer div click
                      onClick={(e) => e.stopPropagation()}
                      id={`kpi-check-${metric.slug}`}
                      style={{ marginTop: "3px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor={`kpi-check-${metric.slug}`}
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                          margin: 0,
                          cursor: "pointer",
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        {t(metric.labelKey)}
                      </label>
                      <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>
                        {t(`kpis.descriptions.${metric.slug}`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3 d-flex justify-content-between">
          <Button
            variant="outline-secondary"
            onClick={handleReset}
            style={{
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {t("kpis.resetBtn")}
          </Button>
          <div className="d-flex gap-2">
            <Button
              variant="outline-dark"
              onClick={() => setShowCustomizeModal(false)}
              style={{
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              variant="dark"
              onClick={handleSave}
              style={{
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {t("kpis.saveBtn")}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}


