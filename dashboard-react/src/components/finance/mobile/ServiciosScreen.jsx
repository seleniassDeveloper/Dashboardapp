// src/components/finance/mobile/ServiciosScreen.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ServiciosScreen({ serviceStats = [] }) {
  const safeServiceStats = Array.isArray(serviceStats) ? serviceStats : [];
  const [expandedSvc, setExpandedSvc] = useState(null);

  const handleToggle = (id) => {
    if (expandedSvc === id) {
      setExpandedSvc(null);
    } else {
      setExpandedSvc(id);
    }
  };

  return (
    <div className="animate-fade-in px-3 pt-3">
      {safeServiceStats.length === 0 ? (
        <div className="text-center py-5 text-muted small border rounded-xl bg-white">
          No hay turnos registrados hoy para estimar rentabilidad.
        </div>
      ) : (
        <ul className="f-svc-list p-0 mb-3">
          {safeServiceStats.map(s => {
            const isExpanded = expandedSvc === s.id;
            const barColor = s.marginPercent < 25 ? "var(--f-amber)" : "var(--f-purple)";
            
            return (
              <li 
                className="f-card p-3 mb-2 bg-white" 
                key={s.id}
                onClick={() => handleToggle(s.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="f-svc__top">
                  <span className="fw-bold text-dark">{s.name}</span>
                  <span className="f-svc__pct" style={{ color: barColor }}>{s.marginPercent}%</span>
                </div>

                <div className="f-bar">
                  <i style={{ width: `${s.marginPercent}%`, backgroundColor: barColor }}></i>
                </div>

                <div className="d-flex justify-content-between align-items-center text-muted small mt-1">
                  <span>Precio de lista: {currency(s.price)}</span>
                  <span className="d-flex align-items-center gap-1">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-top border-gray-150 d-grid gap-2 small text-secondary">
                    <div className="d-flex justify-content-between">
                      <span>Costo de insumos (22%):</span>
                      <span className="fw-semibold text-danger">-{currency(s.productCost)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Comisiones de estilistas (40%):</span>
                      <span className="fw-semibold text-danger">-{currency(s.commission)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Turnos completados:</span>
                      <span className="fw-semibold text-dark">{s.count} turnos</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Facturado total:</span>
                      <span className="fw-semibold text-dark">{currency(s.totalRevenue)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold pt-2 border-top">
                      <span>Ganancia Neta Total:</span>
                      <span className="text-success">{currency(s.totalNetProfit)}</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
