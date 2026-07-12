// src/components/appointments/mobile/AppointmentsSLA.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, SlidersHorizontal, Calendar, 
  CheckCircle2, Clock, CreditCard, AlertCircle, Plus, 
  BarChart3, Menu, Users 
} from "lucide-react";
import { Modal, Spinner } from "react-bootstrap";
import api from "../../../lib/api.js";
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

  const [selectedAppt, setSelectedAppt] = useState(null);
  const [slaDetail, setSlaDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!selectedAppt) {
      setSlaDetail(null);
      return;
    }
    
    const fetchSlaDetail = async () => {
      try {
        setLoadingDetail(true);
        if (String(selectedAppt.id).startsWith("mock-")) {
          // Simulate status histories for mock data
          const startsAtDate = new Date(selectedAppt.startsAt);
          const duration = selectedAppt.service?.duration || 60;
          const status = selectedAppt.status;
          
          const mockHistories = [
            {
              id: "h1",
              statusFrom: "CREATED",
              statusTo: "PENDING",
              transitionedAt: new Date(startsAtDate.getTime() - 3600000).toISOString(),
              durationSeconds: 120
            }
          ];
          
          if (status === "CONFIRMED") {
            mockHistories.push({
              id: "h2",
              statusFrom: "PENDING",
              statusTo: "CONFIRMED",
              transitionedAt: new Date(startsAtDate.getTime() - 1800000).toISOString(),
              durationSeconds: 900
            });
          }
          
          setSlaDetail({
            appointmentId: selectedAppt.id,
            isActive: status === "CONFIRMED",
            status,
            startStatusKey: "CONFIRMED",
            endStatusKey: "DONE",
            estimatedSec: duration * 60,
            actualSec: status === "CONFIRMED" ? 1200 : 0,
            hardLimitSec: null,
            lastStartedAt: status === "CONFIRMED" ? new Date(startsAtDate.getTime() - 1800000).toISOString() : null,
            pastActiveSec: 0,
            currentPeriodSec: status === "CONFIRMED" ? 1200 : 0,
            histories: mockHistories
          });
          return;
        }

        const res = await api.get(`/appointments/sla-service/live/${selectedAppt.id}`);
        setSlaDetail(res.data);
      } catch (err) {
        console.error("Error fetching SLA detail:", err);
      } finally {
        setLoadingDetail(false);
      }
    };
    
    fetchSlaDetail();
  }, [selectedAppt]);

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
                onSelect={setSelectedAppt}
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
                onSelect={setSelectedAppt}
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
                onSelect={setSelectedAppt}
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

      {/* MODAL DETALLE DE TIEMPOS Y SLA */}
      <Modal show={!!selectedAppt} onHide={() => setSelectedAppt(null)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-dark fs-5">Seguimiento de Cita y SLA</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {selectedAppt && (
            <div>
              {/* Cliente e Info */}
              <div className="p-3 bg-light rounded-4 mb-3 border">
                <div className="fw-bold text-dark fs-6">
                  {selectedAppt.clientName || `${selectedAppt.client?.firstName || ""} ${selectedAppt.client?.lastName || ""}`.trim() || "Cliente"}
                </div>
                <div className="small text-muted mt-1">
                  Servicio: <strong>{selectedAppt.serviceName || selectedAppt.service?.name || "Servicio"}</strong>
                </div>
                <div className="small text-muted">
                  Profesional: {selectedAppt.worker?.firstName || "Estilista"}
                </div>
              </div>

              {loadingDetail ? (
                <div className="text-center py-4">
                  <Spinner size="sm" animation="border" className="text-purple-600 me-2" />
                  <span className="small text-muted">Cargando tiempos de SLA...</span>
                </div>
              ) : slaDetail ? (
                <div>
                  {/* Estimado vs Real */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between small fw-bold mb-1">
                      <span>Tiempo estimado: {Math.round(slaDetail.estimatedSec / 60)} min</span>
                      <span className={slaDetail.actualSec > slaDetail.estimatedSec ? "text-danger" : "text-success"}>
                        Transcurrido: {Math.round(slaDetail.actualSec / 60)} min
                      </span>
                    </div>
                    <div className="progress" style={{ height: "8px", borderRadius: "10px" }}>
                      <div 
                        className={`progress-bar ${slaDetail.actualSec > slaDetail.estimatedSec ? "bg-danger" : "bg-success"}`} 
                        role="progressbar" 
                        style={{ width: `${Math.min(100, (slaDetail.actualSec / (slaDetail.estimatedSec || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Estado de SLA Alerta */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 p-2.5 rounded-3 border bg-white" style={{ fontSize: "13px" }}>
                      {slaDetail.status === "DONE" ? (
                        <>
                          <CheckCircle2 size={16} className="text-success" />
                          <span className="fw-bold text-success">Cita Finalizada</span>
                        </>
                      ) : slaDetail.isActive ? (
                        <>
                          <Clock size={16} className="text-warning" />
                          <span className="fw-bold text-warning">En curso (SLA Activo)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-muted" />
                          <span className="fw-bold text-muted">SLA no iniciado (esperando confirmación)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Línea de tiempo de transiciones */}
                  <div>
                    <h6 className="fw-bold text-dark mb-2.5 small uppercase tracking-wider">Historial de Tiempos de Estado</h6>
                    {(!slaDetail.histories || slaDetail.histories.length === 0) ? (
                      <div className="small text-muted text-center py-2">No se registran cambios de estado aún.</div>
                    ) : (
                      <div className="sla-timeline-list d-flex flex-column gap-3.5 position-relative pl-2.5">
                        {/* Vertical line connector */}
                        <div className="position-absolute h-100 border-start border-gray-200" style={{ left: "15px", top: "10px", width: "2px", zIndex: 0 }} />

                        {slaDetail.histories.map((h, i) => {
                          const timeStr = new Date(h.transitionedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                          const durMin = h.durationSeconds ? Math.round(h.durationSeconds / 60) : 0;
                          
                          return (
                            <div key={h.id || i} className="d-flex align-items-start gap-3 position-relative" style={{ zIndex: 1 }}>
                              <div className="rounded-circle bg-purple-100 border border-purple-500 d-flex align-items-center justify-content-center" style={{ width: "12px", height: "12px", marginTop: "4px" }} style={{ zIndex: 2, position: "relative" }} />
                              <div>
                                <div className="small text-dark fw-bold">
                                  {h.statusFrom} &rarr; {h.statusTo}
                                </div>
                                <div className="text-muted" style={{ fontSize: "11.5px" }}>
                                  Hora: {timeStr} {durMin > 0 && `(Permaneció: ${durMin} min)`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-muted small">No se pudo cargar la información de SLA.</div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
