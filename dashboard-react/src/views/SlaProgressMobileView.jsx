// SlaProgressMobileView.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, SlidersHorizontal, Calendar, CreditCard, Clock, CheckCircle, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import { Badge, Button, Spinner } from "react-bootstrap";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider.jsx";
import api from "../lib/api.js";
import "./SlaProgressMobileView.css";

// SVG de WhatsApp para alineación de alta fidelidad
const WhatsAppIcon = ({ size = 16, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={{ color: "#25D366" }}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.905-6.99C16.488 1.876 14.016 1.846 12 1.846c-5.434 0-9.858 4.417-9.863 9.861-.001 1.761.463 3.479 1.34 5.006l-1.025 3.738 3.825-.997z"/>
  </svg>
);

export default function SlaProgressMobileView() {
  const navigate = useNavigate();
  const { appointments, loading, fetchAppointments } = useAppointmentsStore();
  
  // Date and Time reference
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const formattedToday = useMemo(() => {
    const d = new Date();
    const formatted = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  // Dispatch custom events to hide global app topbar while inside this full-screen view
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { detail: false }));
    };
  }, []);

  // Mock fallbacks to match the mockup metrics exactly if the database is empty for today
  const mockAppointments = useMemo(() => [
    {
      id: "mock-1",
      startsAt: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
      clientName: "Ana García",
      serviceName: "Deep Facial",
      duration: 60,
      status: "CONFIRMED",
      depositStatus: "SIN_SENA",
      client: { firstName: "Ana", lastName: "García", phone: "+5491134922342" },
      service: { name: "Deep Facial", duration: 60, price: 15000 },
      worker: { firstName: "Laura" }
    },
    {
      id: "mock-2",
      startsAt: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
      clientName: "Fernanda Rodríguez",
      serviceName: "Basic Manicure",
      duration: 45,
      status: "PENDING",
      depositStatus: "SIN_SENA",
      client: { firstName: "Fernanda", lastName: "Rodríguez", phone: "+5491134922342" },
      service: { name: "Basic Manicure", duration: 45, price: 8000 },
      worker: { firstName: "Lucía" }
    },
    {
      id: "mock-3",
      startsAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      clientName: "Camila López",
      serviceName: "Coloración + Corte",
      duration: 95,
      status: "CONFIRMED",
      depositStatus: "PAGADA",
      client: { firstName: "Camila", lastName: "López", phone: "+5491134922342" },
      service: { name: "Coloración + Corte", duration: 95, price: 30000 },
      worker: { firstName: "Marta" }
    },
    {
      id: "mock-4",
      startsAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
      clientName: "Valeria Ruiz",
      serviceName: "Perfilado de Cejas",
      duration: 30,
      status: "CONFIRMED",
      depositStatus: "PAGADA",
      client: { firstName: "Valeria", lastName: "Ruiz" },
      service: { name: "Perfilado de Cejas", duration: 30, price: 5000 },
      worker: { firstName: "Marta" }
    },
    {
      id: "mock-5",
      startsAt: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
      clientName: "Sofía Martínez",
      serviceName: "Peinado de Fiesta",
      duration: 60,
      status: "CONFIRMED",
      depositStatus: "PAGADA",
      client: { firstName: "Sofía", lastName: "Martínez" },
      service: { name: "Peinado de Fiesta", duration: 60, price: 12000 },
      worker: { firstName: "Laura" }
    },
    {
      id: "mock-6",
      startsAt: new Date(new Date().setHours(13, 30, 0, 0)).toISOString(),
      clientName: "Carolina Sosa",
      serviceName: "Pedicura Completa",
      duration: 50,
      status: "CONFIRMED",
      depositStatus: "PAGADA",
      client: { firstName: "Carolina", lastName: "Sosa" },
      service: { name: "Pedicura Completa", duration: 50, price: 9000 },
      worker: { firstName: "Lucía" }
    },
    {
      id: "mock-7",
      startsAt: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
      clientName: "Julieta Cardozo",
      serviceName: "Corte Unisex",
      duration: 40,
      status: "CONFIRMED",
      depositStatus: "PAGADA",
      client: { firstName: "Julieta", lastName: "Cardozo" },
      service: { name: "Corte Unisex", duration: 40, price: 7500 },
      worker: { firstName: "Laura" }
    },
    {
      id: "mock-8",
      startsAt: new Date(new Date().setHours(16, 30, 0, 0)).toISOString(),
      clientName: "Marta Benítez",
      serviceName: "Tratamiento de Keratina",
      duration: 120,
      status: "CONFIRMED",
      depositStatus: "PAGADA",
      client: { firstName: "Marta", lastName: "Benítez" },
      service: { name: "Tratamiento de Keratina", duration: 120, price: 25000 },
      worker: { firstName: "Marta" }
    }
  ], []);

  const [localMockAppts, setLocalMockAppts] = useState(mockAppointments);

  // Filter today's real appointments
  const realTodayAppts = useMemo(() => {
    return appointments.filter(a => {
      if (!a.startsAt || a.status === "CANCELLED") return false;
      return a.startsAt.startsWith(todayStr);
    });
  }, [appointments, todayStr]);

  // Use real data if it contains today's appointments, else fallback to mock data
  const hasRealData = realTodayAppts.length > 0;
  const displayList = hasRealData ? realTodayAppts : localMockAppts;

  // Group appointments into lists
  const groupedData = useMemo(() => {
    const list = displayList;
    
    // Group 1: Prioridad Alta (Active appointments that are not CANCELLED or DONE, but have NO downpayment / are "SIN_SENA")
    const prioridadAlta = list.filter(a => 
      a.status !== "DONE" && 
      a.status !== "CANCELLED" && 
      (a.depositStatus === "SIN_SENA" || a.senaStatus === "SIN_SENA" || !a.depositStatus)
    );

    // Group 2: Pendientes (Awaiting confirmation status)
    const pendientes = list.filter(a => a.status === "PENDING");

    // Group 3: Confirmadas (Confirmed or Completed status)
    const confirmadas = list.filter(a => a.status === "CONFIRMED" || a.status === "DONE" || a.status === "IN_PROGRESS");

    return {
      prioridadAlta,
      pendientes,
      confirmadas
    };
  }, [displayList]);

  // Counts calculations
  const counts = useMemo(() => {
    const list = displayList;
    const total = list.length;
    const confirmed = list.filter(a => a.status === "CONFIRMED" || a.status === "DONE" || a.status === "IN_PROGRESS").length;
    const pending = list.filter(a => a.status === "PENDING").length;
    
    // Sin seña count includes active appointments that are SIN_SENA
    const sinSena = list.filter(a => 
      a.status !== "DONE" && 
      a.status !== "CANCELLED" && 
      (a.depositStatus === "SIN_SENA" || a.senaStatus === "SIN_SENA" || !a.depositStatus)
    ).length;

    const confirmedPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

    return {
      total,
      confirmed,
      pending,
      sinSena,
      confirmedPct
    };
  }, [displayList]);

  // Handle WhatsApp action
  const handleWhatsAppClick = (appt) => {
    const phone = appt.client?.phone || appt.phone || "";
    if (!phone) {
      alert("El cliente no cuenta con un número de teléfono guardado.");
      return;
    }
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const text = `Hola ${appt.client?.firstName || "Cliente"}, te escribimos para confirmar tu cita de ${appt.service?.name || "Servicio"} para hoy a las ${new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs. ¡Te esperamos!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Handle status update
  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      const appt = displayList.find(x => x.id === apptId);
      if (!appt) return;

      if (String(apptId).startsWith("mock-")) {
        setLocalMockAppts(prev => prev.map(x => x.id === apptId ? { ...x, status: newStatus } : x));
        return;
      }

      await api.put(`/appointments/${apptId}`, {
        clientId: appt.clientId,
        serviceId: appt.serviceId,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        status: newStatus,
      });
      fetchAppointments();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar el estado de la cita");
    }
  };

  // Handle deposit/seña payment
  const handleCollectDeposit = async (apptId) => {
    try {
      const appt = displayList.find(x => x.id === apptId);
      if (!appt) return;

      if (String(apptId).startsWith("mock-")) {
        setLocalMockAppts(prev => prev.map(x => x.id === apptId ? { ...x, depositStatus: "PAGADA" } : x));
        return;
      }

      await api.put(`/appointments/${apptId}`, {
        clientId: appt.clientId,
        serviceId: appt.serviceId,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        senaStatus: "PAGADA",
        depositStatus: "PAGADA"
      });
      fetchAppointments();
    } catch (e) {
      console.error(e);
      alert("Error al registrar el pago de la seña");
    }
  };

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).replace(" a. m.", " a.m.").replace(" p. m.", " p.m.");
    } catch (e) {
      return "";
    }
  };

  const getDayAbbreviation = (dateStr) => {
    try {
      const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
      return days[new Date(dateStr).getDay()];
    } catch (e) {
      return "LUN";
    }
  };

  return (
    <div className="sla-mobile-view animate-fade-in">
      {/* 1. Header Row */}
      <header className="sla-hdr">
        <button className="sla-hdr__back border-0" onClick={() => navigate("/app")}>
          <ChevronLeft size={22} />
        </button>
        <h1 className="sla-hdr__title">Progreso de Citas (SLA)</h1>
        <button className="sla-hdr__filter border-0">
          <SlidersHorizontal size={18} />
        </button>
      </header>

      {/* 2. Top Card: Resumen de Hoy */}
      <section className="sla-summary-card">
        <div className="sla-summary-card__header">
          <div className="sla-summary-card__icon-box">
            <Calendar size={22} />
          </div>
          <div className="sla-summary-card__title-box">
            <h2 className="sla-summary-card__title">Resumen de Hoy</h2>
            <p className="sla-summary-card__subtitle">{formattedToday}</p>
          </div>
          <div className="sla-summary-card__stats-box">
            <strong>{counts.total} citas</strong>
            <span>programadas</span>
          </div>
        </div>

        <div className="sla-progress-section">
          <div className="sla-progress-section__lbls">
            <span className="sla-progress-section__lbl">Confirmación del día</span>
            <span className="sla-progress-section__target">80% meta</span>
          </div>
          
          <div className="sla-progress-section__pct">{counts.confirmedPct}%</div>

          <div className="sla-progress-bar-container">
            <div 
              className="sla-progress-bar-fill" 
              style={{ width: `${counts.confirmedPct}%` }}
            />
            <div className="sla-progress-bar-target-marker" style={{ left: "80%" }} />
          </div>

          <div className="sla-summary-card__legend">
            <div className="sla-legend-item">
              <span className="sla-legend-dot sla-legend-dot--green" />
              <span><strong>{counts.confirmed}</strong> confirmadas</span>
            </div>
            <div className="sla-legend-item">
              <span className="sla-legend-dot sla-legend-dot--amber" />
              <span><strong>{counts.pending}</strong> pendiente</span>
            </div>
            <div className="sla-legend-item">
              <span className="sla-legend-dot sla-legend-dot--red" />
              <span><strong>{counts.sinSena}</strong> sin seña</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Small cards side-by-side */}
      <section className="sla-kpi-grid">
        <div className="sla-kpi-box">
          <div className="sla-kpi-box__icon sla-kpi-box__icon--green">
            <CheckCircle size={16} />
          </div>
          <div className="sla-kpi-box__info">
            <strong>{counts.confirmed}</strong>
            <span className="span--green">Confirmadas</span>
          </div>
        </div>

        <div className="sla-kpi-box">
          <div className="sla-kpi-box__icon sla-kpi-box__icon--amber">
            <Clock size={16} />
          </div>
          <div className="sla-kpi-box__info">
            <strong>{counts.pending}</strong>
            <span className="span--amber">Pendiente</span>
          </div>
        </div>

        <div className="sla-kpi-box">
          <div className="sla-kpi-box__icon sla-kpi-box__icon--red">
            <CreditCard size={16} />
          </div>
          <div className="sla-kpi-box__info">
            <strong>{counts.sinSena}</strong>
            <span className="span--red">Sin seña</span>
          </div>
        </div>
      </section>

      {/* 4. Lists Grouped by Category */}
      
      {/* 4.1 Prioridad Alta (Sin Seña) */}
      {groupedData.prioridadAlta.length > 0 && (
        <section className="mb-4">
          <div className="sla-section-title-row">
            <h3>
              <AlertCircle size={16} className="text-danger" />
              <span>Prioridad Alta</span>
              <span className="sla-section-title-row__sub">Sin seña</span>
            </h3>
            <Badge className="badge-count badge-count--red">
              {groupedData.prioridadAlta.length} {groupedData.prioridadAlta.length === 1 ? "cita" : "citas"}
            </Badge>
          </div>
          
          <div className="sla-list-group">
            {groupedData.prioridadAlta.slice(0, 2).map((appt) => (
              <div key={appt.id} className="sla-appt-card">
                <div className="sla-appt-card__row">
                  <div className="sla-time-box sla-time-box--red">
                    <span className="sla-time-box__val">{formatTime(appt.startsAt).split(" ")[0]}</span>
                    <span className="sla-time-box__val">{formatTime(appt.startsAt).split(" ")[1]}</span>
                    <span className="sla-time-box__val--sub">{getDayAbbreviation(appt.startsAt)}</span>
                  </div>

                  <div className="sla-appt-card__info">
                    <h4 className="sla-appt-card__client">{appt.client?.firstName} {appt.client?.lastName || ""}</h4>
                    <p className="sla-appt-card__service">{appt.service?.name || appt.serviceName}</p>
                    <div className="sla-appt-card__duration">
                      <Clock size={11} />
                      <span>{appt.service?.duration || appt.duration || 60} min</span>
                    </div>
                  </div>

                  <Badge className="sla-status-pill sla-status-pill--red">Sin seña</Badge>
                </div>

                <div className="sla-actions-row">
                  <button className="sla-btn sla-btn--white" onClick={() => handleWhatsAppClick(appt)}>
                    <WhatsAppIcon size={14} className="sla-btn--wa-icon" />
                    <span>WhatsApp</span>
                  </button>
                  <button className="sla-btn sla-btn--red" onClick={() => handleCollectDeposit(appt.id)}>
                    <CreditCard size={14} />
                    <span>Cobrar seña</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4.2 Pendientes (Esperando Confirmacion) */}
      {groupedData.pendientes.length > 0 && (
        <section className="mb-4">
          <div className="sla-section-title-row">
            <h3>
              <Clock size={16} className="text-warning" />
              <span>Pendientes</span>
              <span className="sla-section-title-row__sub">Esperando confirmación</span>
            </h3>
            <Badge className="badge-count badge-count--amber">
              {groupedData.pendientes.length} {groupedData.pendientes.length === 1 ? "cita" : "citas"}
            </Badge>
          </div>

          <div className="sla-list-group">
            {groupedData.pendientes.slice(0, 2).map((appt) => (
              <div key={appt.id} className="sla-appt-card">
                <div className="sla-appt-card__row">
                  <div className="sla-time-box sla-time-box--amber">
                    <span className="sla-time-box__val">{formatTime(appt.startsAt).split(" ")[0]}</span>
                    <span className="sla-time-box__val">{formatTime(appt.startsAt).split(" ")[1]}</span>
                    <span className="sla-time-box__val--sub">{getDayAbbreviation(appt.startsAt)}</span>
                  </div>

                  <div className="sla-appt-card__info">
                    <h4 className="sla-appt-card__client">{appt.client?.firstName} {appt.client?.lastName || ""}</h4>
                    <p className="sla-appt-card__service">{appt.service?.name || appt.serviceName}</p>
                    <div className="sla-appt-card__duration">
                      <Clock size={11} />
                      <span>{appt.service?.duration || appt.duration || 60} min</span>
                    </div>
                  </div>

                  <Badge className="sla-status-pill sla-status-pill--amber">Esperando confirmación</Badge>
                </div>

                <div className="sla-actions-row">
                  <button className="sla-btn sla-btn--white" onClick={() => handleWhatsAppClick(appt)}>
                    <WhatsAppIcon size={14} className="sla-btn--wa-icon" />
                    <span>WhatsApp</span>
                  </button>
                  <button className="sla-btn sla-btn--amber" onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}>
                    <CheckCircle size={14} />
                    <span>Confirmar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4.3 Confirmadas */}
      {groupedData.confirmadas.length > 0 && (
        <section className="mb-3">
          <div className="sla-section-title-row">
            <h3>
              <CheckCircle size={16} className="text-success" />
              <span>Confirmadas</span>
            </h3>
            <Badge className="badge-count badge-count--green">
              {groupedData.confirmadas.length} {groupedData.confirmadas.length === 1 ? "cita" : "citas"}
            </Badge>
          </div>

          <div className="sla-list-group">
            {groupedData.confirmadas.slice(0, 1).map((appt) => (
              <div key={appt.id} className="sla-appt-card">
                <div className="sla-appt-card__row">
                  <div className="sla-time-box sla-time-box--green">
                    <span className="sla-time-box__val">{formatTime(appt.startsAt).split(" ")[0]}</span>
                    <span className="sla-time-box__val">{formatTime(appt.startsAt).split(" ")[1]}</span>
                    <span className="sla-time-box__val--sub">{getDayAbbreviation(appt.startsAt)}</span>
                  </div>

                  <div className="sla-appt-card__info">
                    <h4 className="sla-appt-card__client">{appt.client?.firstName} {appt.client?.lastName || ""}</h4>
                    <p className="sla-appt-card__service">{appt.service?.name || appt.serviceName}</p>
                    <div className="sla-appt-card__duration">
                      <Clock size={11} />
                      <span>{appt.service?.duration || appt.duration || 60} min</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                    <Badge className="sla-status-pill sla-status-pill--green">Confirmada</Badge>
                    <ChevronRight size={18} className="sla-chevron" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {groupedData.confirmadas.length > 1 && (
            <span className="sla-more-link" onClick={() => navigate("/app/calendar")}>
              + {groupedData.confirmadas.length - 1} citas más
            </span>
          )}
        </section>
      )}
    </div>
  );
}
