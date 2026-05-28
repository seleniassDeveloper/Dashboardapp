import React, { useMemo } from "react";
import { Row, Col, Badge } from "react-bootstrap";
import { Calendar, CheckCircle, Clock, AlertCircle, DollarSign, Sparkles } from "lucide-react";

// Formato de moneda ARS
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function AgendaSummary({
  appointments = [],
  workers = [],
  appointmentsByWorker = {},
  onSelectSummary,
}) {
  
  // Calcular métricas operativas
  const stats = useMemo(() => {
    const totalList = appointments;
    const confirmedList = appointments.filter(a => a.status === "CONFIRMED");
    const pendingList = appointments.filter(a => a.status === "PENDING");
    
    const noSenaList = appointments.filter(a => {
      const sena = a.senaStatus || (a.notes?.toLowerCase().includes("seña") ? "PAGADA" : "SIN_SENA");
      return sena === "SIN_SENA";
    });

    const activeAppts = appointments.filter(a => a.status !== "CANCELLED");
    const estimatedRev = activeAppts.reduce((sum, a) => sum + Number(a.service?.price || 0), 0);

    // Calcular carga por profesional
    let busiestWorker = { name: "Ninguno", count: 0 };
    let freeWorker = { name: "Ninguno", count: 99, percentFree: 100 };

    workers.forEach(w => {
      const apptsCount = (appointmentsByWorker[w.id] || []).length;
      
      // Mayor carga
      if (apptsCount > busiestWorker.count) {
        busiestWorker = { name: `${w.firstName} ${w.lastName}`, count: apptsCount };
      }

      // Menor carga (ocupación máxima = 8 turnos de 1 hora)
      const maxSlots = 8;
      const occupied = apptsCount;
      const freeSlots = Math.max(maxSlots - occupied, 0);
      const percentFree = Math.round((freeSlots / maxSlots) * 100);

      if (apptsCount < freeWorker.count) {
        freeWorker = { name: w.firstName, count: apptsCount, percentFree };
      }
    });

    if (workers.length === 0) {
      freeWorker = { name: "N/A", percentFree: 100 };
    }

    return {
      total: totalList.length,
      totalList,
      confirmed: confirmedList.length,
      confirmedList,
      pending: pendingList.length,
      pendingList,
      noSena: noSenaList.length,
      noSenaList,
      estimatedRev,
      estimatedRevList: activeAppts,
      busiestName: busiestWorker.name,
      busiestCount: busiestWorker.count,
      recommendedName: freeWorker.name,
      recommendedFreePercent: freeWorker.percentFree
    };
  }, [appointments, workers, appointmentsByWorker]);

  return (
    <div className="mb-4">
      {/* Indicador Inteligente AI Sparkles */}
      {stats.total > 0 && stats.recommendedName !== "N/A" && (
        <div className="agenda-ai-badge mb-3.5">
          <div className="d-flex align-items-center gap-2">
            <Sparkles size={16} className="text-warning animate-bounce" />
            <span className="fw-semibold">
              <strong>Sugerencia de Agenda Inteligente:</strong> Asigná turnos preferentemente a *{stats.recommendedName}*, quien tiene un *{stats.recommendedFreePercent}%* de disponibilidad libre hoy.
            </span>
          </div>
          <Badge bg="success" className="rounded-pill px-3 py-1 smaller uppercase">Optimizado</Badge>
        </div>
      )}

      {/* Grid de KPIs superiores */}
      <Row className="g-3">
        {/* Citas Totales */}
        <Col xs={6} md={4} lg={2.4}>
          <div
            onClick={() => onSelectSummary?.({
              type: "total",
              title: "Todas las Citas del Día",
              appointments: stats.totalList,
            })}
            className="agenda-summary-card clickable-summary-card shadow-sm d-flex align-items-center gap-3"
            title="Ver todas las citas de hoy"
          >
            <div className="p-2.5 rounded-3 bg-primary bg-opacity-10 text-primary">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-muted smaller fw-bold mb-0.5">Citas del Día</div>
              <strong className="h6 fw-black text-dark m-0">{stats.total} reservas</strong>
            </div>
          </div>
        </Col>

        {/* Confirmadas */}
        <Col xs={6} md={4} lg={2.4}>
          <div
            onClick={() => onSelectSummary?.({
              type: "confirmed",
              title: "Citas Confirmadas de Hoy",
              appointments: stats.confirmedList,
            })}
            className="agenda-summary-card clickable-summary-card shadow-sm d-flex align-items-center gap-3"
            title="Ver citas confirmadas"
          >
            <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-success">
              <CheckCircle size={18} />
            </div>
            <div>
              <div className="text-muted smaller fw-bold mb-0.5">Confirmadas</div>
              <strong className="h6 fw-black text-success m-0">{stats.confirmed} citas</strong>
            </div>
          </div>
        </Col>

        {/* Pendientes */}
        <Col xs={6} md={4} lg={2.4}>
          <div
            onClick={() => onSelectSummary?.({
              type: "pending",
              title: "Citas Pendientes de Hoy",
              appointments: stats.pendingList,
            })}
            className="agenda-summary-card clickable-summary-card shadow-sm d-flex align-items-center gap-3"
            title="Ver citas pendientes"
          >
            <div className="p-2.5 rounded-3 bg-warning bg-opacity-10 text-warning">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-muted smaller fw-bold mb-0.5">Pendientes</div>
              <strong className="h6 fw-black text-warning m-0">{stats.pending} turnos</strong>
            </div>
          </div>
        </Col>

        {/* Sin seña */}
        <Col xs={6} md={4} lg={2.4}>
          <div
            onClick={() => onSelectSummary?.({
              type: "noSena",
              title: "Citas Sin Seña Registrada",
              appointments: stats.noSenaList,
            })}
            className="agenda-summary-card clickable-summary-card shadow-sm d-flex align-items-center gap-3"
            title="Ver citas sin seña"
          >
            <div className="p-2.5 rounded-3 bg-danger bg-opacity-10 text-danger">
              <AlertCircle size={18} />
            </div>
            <div>
              <div className="text-muted smaller fw-bold mb-0.5">Sin Seña</div>
              <strong className="h6 fw-black text-danger m-0">{stats.noSena} citas</strong>
            </div>
          </div>
        </Col>

        {/* Ingresos estimados */}
        <Col xs={12} md={8} lg={2.4}>
          <div
            onClick={() => onSelectSummary?.({
              type: "estimatedRev",
              title: "Detalle de Ingresos Estimados del Día",
              appointments: stats.estimatedRevList,
            })}
            className="agenda-summary-card clickable-summary-card shadow-sm d-flex align-items-center gap-3"
            title="Ver detalle financiero"
          >
            <div className="p-2.5 rounded-3 bg-success bg-opacity-10 text-success">
              <DollarSign size={18} />
            </div>
            <div>
              <div className="text-muted smaller fw-bold mb-0.5">Ingresos Estimados</div>
              <strong className="h6 fw-black text-success m-0">{currency(stats.estimatedRev)}</strong>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
