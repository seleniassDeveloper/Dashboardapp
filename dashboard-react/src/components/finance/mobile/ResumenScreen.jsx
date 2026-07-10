// src/components/finance/mobile/ResumenScreen.jsx
import React, { useState } from "react";
import { Badge, Modal, Button, Table, Row, Col } from "react-bootstrap";
import { TrendingUp, DollarSign, CreditCard, ShoppingBag, Landmark, Plus, ArrowRight } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ResumenScreen({ dashboardData, onTabChange }) {
  const [activeModal, setActiveModal] = useState(null);
  
  const summary = dashboardData?.summary || {};
  const paymentMethods = dashboardData?.paymentMethods || [];
  const branchComparison = dashboardData?.branchComparison || [];
  const recentTransactions = dashboardData?.recentTransactions || [];

  return (
    <div className="animate-fade-in">
      {/* Hero section */}
      <section className="f-hero">
        <div className="f-hero__icon">
          <Landmark size={24} />
        </div>
        <p className="f-hero__desc">
          Contabilidad integral multi-sucursal, conciliación y auditorías en tiempo real.
        </p>
      </section>

      {/* Centro de Reportes Button */}
      <button className="f-btn-dark" onClick={() => onTabChange("reportes")}>
        <span>Centro de Reportes</span>
        <ArrowRight size={16} />
      </button>

      {/* KPI Grid */}
      <div className="f-section">
        <h3>Resumen Financiero</h3>
        <span className="text-muted small">Este mes</span>
      </div>

      <div className="f-kpi-grid">
        {/* KPI 1: Ingresos */}
        <button className="f-kpi" onClick={() => setActiveModal("revenues")}>
          <div className="f-kpi__label">Ingresos Totales</div>
          <div className="f-kpi__value">{currency(summary.totalRevenues)}</div>
          <div className="f-kpi__delta up">+{summary.growthPercentage || 0}% vs mes ant</div>
        </button>

        {/* KPI 2: Ganancia Real */}
        <button className="f-kpi" onClick={() => setActiveModal("profit")} style={{ borderLeft: "3px solid var(--f-green)" }}>
          <div className="f-kpi__label">Ganancia Real</div>
          <div className="f-kpi__value">{currency(summary.realProfit)}</div>
          <div className="f-kpi__delta up">+9.3% vs mes ant</div>
        </button>

        {/* KPI 3: Ticket Promedio */}
        <button className="f-kpi" onClick={() => setActiveModal("ticket")}>
          <div className="f-kpi__label">Ticket Promedio</div>
          <div className="f-kpi__value">{currency(summary.avgTicket)}</div>
          <div className="f-kpi__delta up">+6.1% vs mes ant</div>
        </button>

        {/* KPI 4: Cancelaciones */}
        <button className="f-kpi" onClick={() => setActiveModal("cancellations")} style={{ borderLeft: "3px solid var(--f-red)" }}>
          <div className="f-kpi__label">Cancelaciones</div>
          <div className="f-kpi__value">{currency(summary.cancellationLoss)}</div>
          <div className="f-kpi__delta down">-4.2% pérdida</div>
        </button>
      </div>

      {/* Branch Comparison list if multiple branches exist */}
      {branchComparison.length > 1 && (
        <div className="mt-4 px-3">
          <div className="f-section">
            <h3>Rendimiento por Sucursal</h3>
          </div>
          <div className="d-flex gap-3 overflow-auto pb-2 scrollbar-none" style={{ whiteSpace: "nowrap" }}>
            {branchComparison.map(b => (
              <div key={b.name} className="f-card flex-shrink-0" style={{ width: "200px" }}>
                <div className="fw-bold mb-1 text-truncate">{b.name}</div>
                <div className="small text-muted mb-2">Facturado:</div>
                <div className="h5 fw-black text-purple-600 mb-0">{currency(b.totalRevenue)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Ingresos */}
      <Modal show={activeModal === "revenues"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton className="border-0 py-3">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <TrendingUp size={20} className="text-purple-600" />
            <span>Desglose de Ingresos</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6 className="fw-bold text-muted mb-2">MÉTODOS DE PAGO:</h6>
            <div className="row g-2">
              {paymentMethods.map(pm => (
                <div key={pm.name} className="col-6">
                  <div className="p-2 border rounded text-center bg-light">
                    <span className="small text-muted d-block">{pm.name}</span>
                    <strong className="text-dark">{currency(pm.value)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h6 className="fw-bold text-muted mb-2">ÚLTIMOS MOVIMIENTOS:</h6>
            <div className="table-responsive" style={{ maxHeight: "200px" }}>
              <Table hover size="sm" className="mb-0">
                <thead>
                  <tr style={{ fontSize: "11px" }}>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th className="text-end">Monto</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "12px" }}>
                  {recentTransactions.slice(0, 8).map(tx => (
                    <tr key={tx.id}>
                      <td className="text-truncate" style={{ maxWidth: "80px" }}>{tx.clientName}</td>
                      <td className="text-truncate" style={{ maxWidth: "80px" }}>{tx.serviceName}</td>
                      <td className="text-end fw-bold text-success">{currency(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setActiveModal(null)} className="rounded-pill w-100 fw-bold">Listo</Button>
        </Modal.Footer>
      </Modal>

      {/* 2. Ganancia */}
      <Modal show={activeModal === "profit"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton className="border-0 py-3">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <DollarSign size={20} className="text-success" />
            <span>Ganancia Real</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-2 p-3 bg-light rounded-4">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted small">Ingresos Totales</span>
              <span className="fw-bold text-success">+{currency(summary.totalRevenues)}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center border-top pt-2">
              <span className="text-muted small">Gastos Registrados</span>
              <span className="fw-bold text-danger">-{currency(summary.totalExpenses)}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center border-top pt-2">
              <span className="text-muted small">Comisiones (40% est.)</span>
              <span className="fw-bold text-danger">-{currency(summary.totalRevenues * 0.4)}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center border-top pt-2 fw-bold">
              <span>Ganancia Neta</span>
              <span className="text-success">{currency(summary.realProfit)}</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setActiveModal(null)} className="rounded-pill w-100 fw-bold">Listo</Button>
        </Modal.Footer>
      </Modal>

      {/* 3. Ticket Promedio */}
      <Modal show={activeModal === "ticket"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton className="border-0 py-3">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            <span>Ticket Promedio</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="p-3 bg-light rounded-4">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Ingresos Totales</span>
              <span className="fw-bold">{currency(summary.totalRevenues)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 border-top pt-2">
              <span className="text-muted small">Turnos Estimados</span>
              <span className="fw-bold">{Math.max(1, Math.round(summary.totalRevenues / (summary.avgTicket || 1)))}</span>
            </div>
            <div className="d-flex justify-content-between border-top pt-2 fw-bold">
              <span>Ticket Promedio</span>
              <span className="text-primary">{currency(summary.avgTicket)}</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setActiveModal(null)} className="rounded-pill w-100 fw-bold">Listo</Button>
        </Modal.Footer>
      </Modal>

      {/* 4. Cancelaciones */}
      <Modal show={activeModal === "cancellations"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton className="border-0 py-3">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <ShoppingBag size={20} className="text-danger" />
            <span>Pérdidas Estimadas</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="p-3 bg-light rounded-4">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Ticket Promedio</span>
              <span className="fw-bold">{currency(summary.avgTicket)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 border-top pt-2">
              <span className="text-muted small">Turnos Cancelados</span>
              <span className="fw-bold">{Math.max(0, Math.round(summary.cancellationLoss / (summary.avgTicket || 15000)))}</span>
            </div>
            <div className="d-flex justify-content-between border-top pt-2 fw-bold text-danger">
              <span>Pérdida Total</span>
              <span>{currency(summary.cancellationLoss)}</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setActiveModal(null)} className="rounded-pill w-100 fw-bold">Listo</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
