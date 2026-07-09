// src/components/appointments/mobile/AppointmentsSLA.jsx
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, SlidersHorizontal, Calendar, 
  CheckCircle2, Clock, CreditCard, AlertCircle, Plus, 
  BarChart3, Menu, Users 
} from "lucide-react";
import { useSlaProgress } from "../../../hooks/useSlaProgress";
import ApptCard from "./ApptCard";
import "./AppointmentsSLA.css";

export default function AppointmentsSLA() {
  const navigate = useNavigate();
  const { 
    confirmed, 
    pending, 
    noDeposit, 
    total, 
    pct, 
    goalPct, 
    confirmAppt, 
    chargeDeposit, 
    openWhatsApp 
  } = useSlaProgress();

  // Hide global topbar when SLA panel is active
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { detail: false }));
    };
  }, []);

  const formattedToday = useMemo(() => {
    const d = new Date();
    const formatted = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  // Handle FAB button click
  const handleFabClick = () => {
    window.dispatchEvent(new CustomEvent("open-appointment-modal"));
  };

  return (
    <div className="sla-mobile">
      {/* SECCIÓN 1 — Header */}
      <header className="sla-header">
        <button 
          className="sla-iconbtn" 
          onClick={() => navigate("/app")}
          aria-label="Volver al inicio"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="sla-header__title">Progreso de Citas (SLA)</span>
        <button 
          className="sla-iconbtn sla-iconbtn--plain"
          aria-label="Filtros"
        >
          <SlidersHorizontal size={20} />
        </button>
      </header>

      {/* SECCIÓN 2 — Resumen de Hoy */}
      <section className="sla-summary">
        <div className="sla-summary__top">
          <div className="sla-summary__ico">
            <Calendar size={22} />
          </div>
          <div>
            <h2 className="sla-summary__title">Resumen de Hoy</h2>
            <div className="sla-summary__date">{formattedToday}</div>
          </div>
          <div className="sla-summary__count">
            <b>{total}</b>
            <span>{total === 1 ? "cita /" : "citas /"}</span>
            <span>programadas</span>
          </div>
        </div>

        {/* Progress Card Inside Summary */}
        <div className="sla-progress-card">
          <div className="sla-progress__head">
            <span className="sla-progress__label">Confirmación del día</span>
            <span className="sla-progress__goal">{goalPct}% meta</span>
          </div>
          
          <div className="sla-progress__row">
            <span className="sla-progress__pct">{pct}%</span>
            <div className="sla-bar">
              <div 
                className="sla-bar__fill" 
                style={{ width: `${pct}%` }}
              />
              <div 
                className="sla-bar__goal" 
                style={{ left: `${goalPct}%` }}
                title={`Meta: ${goalPct}%`}
              />
            </div>
          </div>

          <div className="sla-legend">
            <span>
              <i className="sla-dot sla-dot--green" />
              <b>{confirmed.length}</b> confirmadas
            </span>
            <span>
              <i className="sla-dot sla-dot--amber" />
              <b>{pending.length}</b> pendiente
            </span>
            <span>
              <i className="sla-dot sla-dot--red" />
              <b>{noDeposit.length}</b> sin seña
            </span>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3 — KPIs (3 tarjetas) */}
      <section className="sla-kpis">
        <div className="sla-kpi">
          <div className="sla-kpi__ico sla-kpi__ico--green">
            <CheckCircle2 size={18} />
          </div>
          <div className="sla-kpi__info">
            <strong className="sla-kpi__value">{confirmed.length}</strong>
            <span className="sla-kpi__label sla-kpi__label--green">Confirmadas</span>
          </div>
        </div>

        <div className="sla-kpi">
          <div className="sla-kpi__ico sla-kpi__ico--amber">
            <Clock size={18} />
          </div>
          <div className="sla-kpi__info">
            <strong className="sla-kpi__value">{pending.length}</strong>
            <span className="sla-kpi__label sla-kpi__label--amber">Pendiente</span>
          </div>
        </div>

        <div className="sla-kpi">
          <div className="sla-kpi__ico sla-kpi__ico--red">
            <CreditCard size={18} />
          </div>
          <div className="sla-kpi__info">
            <strong className="sla-kpi__value">{noDeposit.length}</strong>
            <span className="sla-kpi__label sla-kpi__label--red">Sin seña</span>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4 — Grupos de citas */}

      {/* 4.1 Prioridad Alta (Sin seña) */}
      {noDeposit.length > 0 && (
        <section className="sla-group sla-group--danger">
          <div className="sla-group__head">
            <AlertCircle size={18} className="text-danger" />
            <span className="sla-group__title">Prioridad Alta</span>
            <span className="sla-group__sub sla-group__sub--red">Sin seña</span>
            <span className="sla-group__count sla-group__count--red">
              {noDeposit.length} {noDeposit.length === 1 ? "cita" : "citas"}
            </span>
          </div>
          <div className="sla-list">
            {noDeposit.slice(0, 2).map(appt => (
              <ApptCard 
                key={appt.id} 
                appt={appt} 
                state="sin_sena" 
                onCollect={chargeDeposit}
                onWhatsApp={openWhatsApp}
              />
            ))}
            {noDeposit.length > 2 && (
              <button 
                className="sla-morelink"
                onClick={() => navigate("/app/calendar")}
              >
                + {noDeposit.length - 2} citas más
              </button>
            )}
          </div>
        </section>
      )}

      {/* 4.2 Pendientes (Esperando confirmación) */}
      {pending.length > 0 && (
        <section className="sla-group">
          <div className="sla-group__head">
            <Clock size={18} className="text-warning" />
            <span className="sla-group__title">Pendientes</span>
            <span className="sla-group__sub sla-group__sub--amber">Esperando confirmación</span>
            <span className="sla-group__count sla-group__count--amber">
              {pending.length} {pending.length === 1 ? "cita" : "citas"}
            </span>
          </div>
          <div className="sla-list">
            {pending.slice(0, 2).map(appt => (
              <ApptCard 
                key={appt.id} 
                appt={appt} 
                state="pendiente" 
                onConfirm={confirmAppt}
                onWhatsApp={openWhatsApp}
              />
            ))}
            {pending.length > 2 && (
              <button 
                className="sla-morelink"
                onClick={() => navigate("/app/calendar")}
              >
                + {pending.length - 2} citas más
              </button>
            )}
          </div>
        </section>
      )}

      {/* 4.3 Confirmadas */}
      {confirmed.length > 0 && (
        <section className="sla-group">
          <div className="sla-group__head">
            <CheckCircle2 size={18} className="text-success" />
            <span className="sla-group__title">Confirmadas</span>
            <span className="sla-group__count sla-group__count--green">
              {confirmed.length} {confirmed.length === 1 ? "cita" : "citas"}
            </span>
          </div>
          <div className="sla-list">
            {confirmed.slice(0, 2).map(appt => (
              <ApptCard 
                key={appt.id} 
                appt={appt} 
                state="confirmada" 
              />
            ))}
            {confirmed.length > 2 && (
              <button 
                className="sla-morelink"
                onClick={() => navigate("/app/calendar")}
              >
                + {confirmed.length - 2} citas más
              </button>
            )}
          </div>
        </section>
      )}

      {/* SECCIÓN 5 — Tab bar inferior */}
      <nav className="sla-nav">
        <button 
          className="sla-nav__item sla-nav__item--active"
          onClick={() => navigate("/app/calendar")}
        >
          <Calendar size={20} />
          <span>Agenda</span>
        </button>
        
        <button 
          className="sla-nav__item"
          onClick={() => navigate("/app/clients")}
        >
          <Users size={20} />
          <span>Clientes</span>
        </button>

        <button 
          className="sla-nav__fab"
          onClick={handleFabClick}
          aria-label="Nueva cita"
        >
          <Plus size={24} />
        </button>

        <button 
          className="sla-nav__item"
          onClick={() => navigate("/app/workflows")}
        >
          <BarChart3 size={20} />
          <span>Reportes</span>
        </button>

        <button 
          className="sla-nav__item"
          onClick={() => navigate("/app/settings")}
        >
          <Menu size={20} />
          <span>Más</span>
        </button>
      </nav>
    </div>
  );
}
