// src/components/finance/mobile/EquipoScreen.jsx
import React, { useState, useMemo } from "react";
import { Award, User } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const FALLBACK_PROFESSIONALS = [
  { id: "p1", name: "Andrea Páez", role: "Estilista Senior", count: 86, occupancy: 92, retentionRate: 78, avgTicket: 22500, totalRevenue: 193500 },
  { id: "p2", name: "Carlos Gómez", role: "Especialista Color", count: 64, occupancy: 88, retentionRate: 72, avgTicket: 19800, totalRevenue: 126720 },
  { id: "p3", name: "María Solís", role: "Tratamiento & Spa", count: 52, occupancy: 82, retentionRate: 65, avgTicket: 16200, totalRevenue: 84240 },
  { id: "p4", name: "Ramiro Díaz", role: "Barber & Corte", count: 48, occupancy: 74, retentionRate: 53, avgTicket: 14500, totalRevenue: 69600 }
];

export default function EquipoScreen({ professionalStats = [] }) {
  const [dateRange, setDateRange] = useState("Este Mes");
  const [selectedRole, setSelectedRole] = useState("Todos");

  const dataset = useMemo(() => {
    const list = Array.isArray(professionalStats) && professionalStats.length > 0 ? professionalStats : FALLBACK_PROFESSIONALS;
    return list.map((p, idx) => ({
      id: p.id || `p-${idx}`,
      name: p.name || "Estilista",
      role: p.role || "Colaborador",
      count: Number(p.count || 0),
      occupancy: Number(p.occupancy || 80),
      retentionRate: Number(p.retentionRate || 60),
      avgTicket: Number(p.avgTicket || p.totalRevenue / (p.count || 1) || 12000),
      totalRevenue: Number(p.totalRevenue || p.commission / 0.4 || 0)
    }));
  }, [professionalStats]);

  const uniqueRoles = useMemo(() => {
    const roles = dataset.map(p => p.role);
    return ["Todos", ...new Set(roles)];
  }, [dataset]);

  const filteredDataset = useMemo(() => {
    return dataset.filter(p => {
      return selectedRole === "Todos" || p.role === selectedRole;
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [dataset, selectedRole]);

  const kpis = useMemo(() => {
    const totalRev = filteredDataset.reduce((sum, p) => sum + p.totalRevenue, 0);
    const avgTkt = filteredDataset.reduce((sum, p) => sum + p.avgTicket, 0) / (filteredDataset.length || 1);
    const avgRet = filteredDataset.reduce((sum, p) => sum + p.retentionRate, 0) / (filteredDataset.length || 1);
    const avgOcc = filteredDataset.reduce((sum, p) => sum + p.occupancy, 0) / (filteredDataset.length || 1);

    return {
      revenue: totalRev,
      avgTicket: Math.round(avgTkt),
      retention: Math.round(avgRet),
      occupancy: Math.round(avgOcc)
    };
  }, [filteredDataset]);

  const getMedal = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="animate-fade-in pt-3">
      {/* Selectors */}
      <div className="f-filters">
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="Este Mes">Este mes</option>
          <option value="Este Año">Este año</option>
        </select>
        
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
          <option value="Todos">Todos los roles</option>
          {uniqueRoles.filter(r => r !== "Todos").map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {/* KPI Grid */}
      <div className="f-kpi-grid mb-3">
        <div className="f-kpi">
          <div className="f-kpi__label">Facturación total</div>
          <div className="f-kpi__value text-purple-600">{currency(kpis.revenue)}</div>
        </div>
        <div className="f-kpi">
          <div className="f-kpi__label">Ticket promedio</div>
          <div className="f-kpi__value text-dark">{currency(kpis.avgTicket)}</div>
        </div>
        <div className="f-kpi">
          <div className="f-kpi__label">Retención promedio</div>
          <div className="f-kpi__value text-success">{kpis.retention}%</div>
        </div>
        <div className="f-kpi">
          <div className="f-kpi__label">Ocupación promedio</div>
          <div className="f-kpi__value text-success">{kpis.occupancy}%</div>
        </div>
      </div>

      {/* Top list */}
      <div className="f-section">
        <h3>Top del mes</h3>
      </div>

      {filteredDataset.length === 0 ? (
        <div className="text-center py-5 text-muted small px-3">
          No hay datos disponibles para los filtros seleccionados.
        </div>
      ) : (
        <ol className="f-rank mb-3">
          {filteredDataset.map((p, idx) => (
            <li className="f-rank__item" key={p.id}>
              <span className="f-medal">{getMedal(idx)}</span>
              <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{ width: "38px", height: "38px", flexShrink: 0 }}>
                <User size={18} className="text-secondary" />
              </div>
              <div className="min-w-0">
                <div className="fw-bold text-dark text-truncate">{p.name}</div>
                <small className="text-muted mt-0.5">
                  {p.occupancy}% ocup. · {p.retentionRate}% ret.
                </small>
              </div>
              <b>{currency(p.totalRevenue)}</b>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
