import React, { useState } from "react";
import { ArrowLeft, ArrowUpRight, Clock, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export default function FlowStats({ stats, workflows, onBack }) {
  const [period, setPeriod] = useState("month");

  // Dynamic daily stats for AreaChart
  const dailyData = [
    { d: "1 May", v: 15 },
    { d: "8 May", v: 38 },
    { d: "15 May", v: 24 },
    { d: "22 May", v: 48 },
    { d: "31 May", v: 35 }
  ];

  // Get top 3 workflows based on runs
  const topFlows = [...workflows]
    .sort((a, b) => (b.runCount || 0) - (a.runCount || 0))
    .slice(0, 3);

  // Fallback if no top workflows exist
  const mockTopFlows = [
    { name: "Recordatorio 24h antes de la cita", runCount: 245, width: "90%" },
    { name: "Encuesta de satisfacción NPS", runCount: 180, width: "65%" },
    { name: "Alerta stock bajo producto", runCount: 92, width: "40%" }
  ];

  const displayTopFlows = topFlows.length > 0
    ? topFlows.map((f, idx) => ({
        name: f.name,
        runCount: f.runCount || 0,
        width: idx === 0 ? "90%" : idx === 1 ? "65%" : "40%"
      }))
    : mockTopFlows;

  return (
    <div className="flow-stats-view">
      {/* 1. Header and Selector */}
      <div className="f-topbar">
        <button className="f-icon-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className="f-topbar__title">Estadísticas</span>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          style={{ border: 0, fontSize: "12px", color: "var(--f-muted)", fontWeight: "700", outline: "none", background: "none" }}
        >
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>

      {/* 2. 2x2 KPI metrics grid */}
      <div className="f-metrics">
        {/* KPI 1: Ejecuciones */}
        <div className="f-metric">
          <div className="f-metric__label">Ejecuciones</div>
          <div className="f-metric__val">{stats.todayExecutions || 128}</div>
          <div className="f-metric__delta f-metric__delta--up">
            +12% este mes
          </div>
        </div>

        {/* KPI 2: Tasa de éxito */}
        <div className="f-metric">
          <div className="f-metric__label">Tasa de éxito</div>
          <div className="f-metric__val">{stats.conversion || 96}%</div>
          <div className="f-metric__delta f-metric__delta--up">
            +5% este mes
          </div>
        </div>

        {/* KPI 3: Con errores */}
        <div className="f-metric">
          <div className="f-metric__label">Con errores</div>
          <div className="f-metric__val">{stats.todayErrors || 3}</div>
          <div className="f-metric__delta f-metric__delta--down" style={{ color: "var(--f-red)" }}>
            +40% este mes
          </div>
        </div>

        {/* KPI 4: Tiempo promedio */}
        <div className="f-metric">
          <div className="f-metric__label">Tiempo promedio</div>
          <div className="f-metric__val">1.2s</div>
          <div className="f-metric__delta f-metric__delta--up">
            -10% de carga
          </div>
        </div>
      </div>

      {/* 3. Area Chart Container */}
      <div className="f-card f-chart">
        <div className="f-chart__head">
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e1b2e" }}>Ejecuciones por día</span>
          <span style={{ fontSize: "11px", color: "var(--f-purple)", fontWeight: "700" }}>Ver más</span>
        </div>

        <div style={{ marginTop: "12px", width: "100%", height: 140 }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={dailyData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="fArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={10} stroke="#a5a4b3" />
              <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#a5a4b3" />
              <Tooltip />
              <Area type="monotone" dataKey="v" stroke="#7c5cfc" strokeWidth={2} fill="url(#fArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Top Flows list */}
      <div className="f-card">
        <h4 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 16px", color: "#1e1b2e" }}>Top flujos</h4>
        
        {displayTopFlows.map((f, idx) => (
          <div key={idx} className="f-top-row">
            <span className="f-top-row__rank">{idx + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", color: "var(--f-text)", fontWeight: "600", marginBottom: "4px" }} className="text-truncate">
                {f.name}
              </div>
              <div className="f-top-row__bar">
                <div className="f-top-row__fill" style={{ width: f.width }} />
              </div>
            </div>
            <span className="f-top-row__num">{f.runCount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
