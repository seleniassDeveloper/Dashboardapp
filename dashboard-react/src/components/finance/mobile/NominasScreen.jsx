// src/components/finance/mobile/NominasScreen.jsx
import React, { useState, useEffect } from "react";
import { DollarSign, User, X, Printer, RefreshCw, Send } from "lucide-react";
import { Modal, Form, Button, Row, Col, Spinner, Badge } from "react-bootstrap";
import api from "../../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function NominasScreen({ professionalStats = [] }) {
  const safeProfessionalStats = Array.isArray(professionalStats) ? professionalStats : [];
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [baseSalary, setBaseSalary] = useState("45000");
  const [bonuses, setBonuses] = useState("0");
  const [advances, setAdvances] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [taxes, setTaxes] = useState("0");
  const [notes, setNotes] = useState("");
  
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [sendingId, setSendingId] = useState("");
  const [sendOnLiquidate, setSendOnLiquidate] = useState(true);

  // Form sheet visibility
  const [showFormSheet, setShowFormSheet] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/finances/payroll");
      setPayrollHistory(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSelectStylist = (stylist) => {
    setSelectedStylist(stylist);
    setBaseSalary(stylist.name.includes("Andrea") ? "65000" : "45000");
    setBonuses("0");
    setAdvances("0");
    setDeductions("0");
    setTaxes("0");
    setNotes("");
  };

  const calculatedCommission = selectedStylist ? selectedStylist.commission : 0;
  const netSalary = selectedStylist 
    ? Number(baseSalary) + calculatedCommission + Number(bonuses) - Number(advances) - Number(deductions) - Number(taxes)
    : 0;

  // Monthly summary stats
  const totalRevenues = safeProfessionalStats.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  const totalCommissions = safeProfessionalStats.reduce((sum, p) => sum + (p.commission || 0), 0);

  const handleLiquidate = async (e) => {
    e.preventDefault();
    if (!selectedStylist) return;

    try {
      setSaving(true);
      const payload = {
        workerId: selectedStylist.id,
        baseSalary: Number(baseSalary),
        commissionPaid: calculatedCommission,
        bonuses: Number(bonuses),
        advances: Number(advances),
        deductions: Number(deductions),
        taxes: Number(taxes),
        notes: notes.trim(),
        sendEmail: sendOnLiquidate
      };

      const res = await api.post("/finances/payroll", payload);
      setActiveReceipt(res.data);
      setSelectedStylist(null);
      setShowFormSheet(false);
      setShowReceipt(true);
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert("Error al liquidar haberes.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendReceipt = async (paymentId) => {
    try {
      setSendingId(paymentId);
      const res = await api.post(`/finances/payroll/${paymentId}/send-receipt`);
      alert("Recibo enviado por email al colaborador.");
      setActiveReceipt(res.data);
      fetchHistory();
    } catch (err) {
      alert(err?.response?.data?.error || "No se pudo enviar el recibo por email.");
    } finally {
      setSendingId("");
    }
  };

  return (
    <div className="animate-fade-in px-3 pt-3">
      {/* Resumen del mes */}
      <div className="f-card f-payslip-sum m-0 mb-3 bg-white">
        <h4 className="fw-bold mb-2 small text-muted uppercase">Resumen del mes</h4>
        <div className="f-line">
          <span className="text-muted">Facturación total</span>
          <span className="fw-bold text-dark">{currency(totalRevenues)}</span>
        </div>
        <div className="f-line border-0 pb-0">
          <span className="text-muted">Comisiones totales (40%)</span>
          <span className="fw-bold text-purple-600">{currency(totalCommissions)}</span>
        </div>
      </div>

      <div className="f-section mt-3 mb-2">
        <h3>Profesionales</h3>
      </div>

      {/* Stylists list */}
      <ul className="f-pro-list">
        {safeProfessionalStats.map(p => (
          <li 
            key={p.id} 
            className={`f-pro ${selectedStylist?.id === p.id ? "is-selected" : ""}`}
            onClick={() => handleSelectStylist(p)}
          >
            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{ width: "40px", height: "40px" }}>
              <User size={20} className="text-secondary" />
            </div>
            <div>
              <div className="fw-bold text-dark">{p.name}</div>
              <small>{p.role || "Estilista"} · {p.count || 0} turnos</small>
            </div>
            <b>{currency(p.commission)}</b>
          </li>
        ))}
      </ul>

      {/* Button to open adjustments sheet */}
      <button 
        className="f-btn-purple m-0 w-100 mt-2" 
        onClick={() => {
          if (!selectedStylist) {
            alert("Seleccioná un profesional de la lista.");
            return;
          }
          setShowFormSheet(true);
        }}
        disabled={!selectedStylist}
      >
        Ver liquidación
      </button>

      {/* FORM ADJUSTMENT MODAL SHEET */}
      <Modal show={showFormSheet} onHide={() => setShowFormSheet(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-dark">Ajustes de Liquidación</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleLiquidate}>
          <Modal.Body>
            {selectedStylist && (
              <>
                <div className="p-3 bg-light rounded-4 mb-3 border">
                  <div className="fw-bold text-purple-600">{selectedStylist.name}</div>
                  <div className="small text-muted mt-1">Comisión acumulada: {currency(calculatedCommission)}</div>
                </div>

                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small text-muted fw-bold">Sueldo Base ($)</Form.Label>
                      <Form.Control type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small text-muted fw-bold">Bonos / Premios ($)</Form.Label>
                      <Form.Control type="number" value={bonuses} onChange={(e) => setBonuses(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small text-muted fw-bold">Adelantos ($)</Form.Label>
                      <Form.Control type="number" value={advances} onChange={(e) => setAdvances(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small text-muted fw-bold">Descuentos ($)</Form.Label>
                      <Form.Control type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small text-muted fw-bold">Retenciones / Impuestos ($)</Form.Label>
                      <Form.Control type="number" value={taxes} onChange={(e) => setTaxes(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted fw-bold">Notas / Detalles</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Ej. Bonificación por metas, etc." 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="p-3 bg-purple-soft rounded-4 text-center border">
                  <div className="small text-muted uppercase fw-bold">Neto Estimado a Cobrar</div>
                  <div className="h4 fw-black text-purple-600 m-0 mt-1">{currency(netSalary)}</div>
                </div>
                <div className="mt-3">
                  <Form.Check
                    type="switch"
                    id="send-payslip-email"
                    className="mb-0"
                    label="Enviar recibo por email al liquidar"
                    checked={sendOnLiquidate}
                    onChange={(e) => setSendOnLiquidate(e.target.checked)}
                  />
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowFormSheet(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={saving}>
              {saving ? <Spinner size="sm" /> : "Liquidar y Generar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* RECENT PAYSLIPS HISTORY */}
      <div className="f-section mt-4 mb-2">
        <h3>Historial Reciente</h3>
        <button className="btn btn-sm text-purple-600 p-0" onClick={fetchHistory}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loadingHistory ? (
        <div className="text-center py-4 text-muted small">Cargando recibos...</div>
      ) : payrollHistory.length === 0 ? (
        <div className="text-center py-4 text-muted small border rounded-xl bg-white">No hay liquidaciones previas.</div>
      ) : (
        <div className="d-flex flex-column gap-2 mb-3">
          {payrollHistory.slice(0, 5).map(p => (
            <div className="f-card p-3 mb-0 d-flex justify-content-between align-items-center bg-white" key={p.id}>
              <div>
                <div className="fw-bold text-dark">{p.worker ? `${p.worker.firstName} ${p.worker.lastName}` : "Colaborador"}</div>
                <div className="small text-muted mt-1">
                  {p.paymentDate && !isNaN(new Date(p.paymentDate).getTime()) ? new Date(p.paymentDate).toLocaleDateString("es-AR") : "—"}
                </div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-purple-600">
                  {currency(p.netPaid)}
                </div>
                <div className="d-flex align-items-center justify-content-end gap-1.5 mt-1 flex-wrap">
                  {p.emailStatus === "sent" ? (
                    <Badge bg="success" className="text-white rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>✓ Enviado</Badge>
                  ) : p.emailStatus === "failed" ? (
                    <Badge bg="danger" className="text-white rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>Falló</Badge>
                  ) : p.worker?.email ? (
                    <Badge bg="secondary" className="text-white rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>Sin enviar</Badge>
                  ) : (
                    <Badge bg="warning" className="text-dark rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>Sin email</Badge>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-purple p-1 border-0"
                    disabled={sendingId === p.id || !p.worker?.email}
                    onClick={() => handleSendReceipt(p.id)}
                    title="Enviar recibo por email"
                  >
                    {sendingId === p.id ? <Spinner size="sm" animation="border" style={{ width: "12px", height: "12px" }} /> : <Send size={12} />}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-purple p-1 border-0"
                    onClick={() => {
                      setActiveReceipt(p);
                      setShowReceipt(true);
                    }}
                    title="Ver Recibo"
                  >
                    <Printer size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      <Modal show={showReceipt} onHide={() => setShowReceipt(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-dark">Recibo de Haberes</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" id="printable-receipt-content">
          {activeReceipt && (
            <div className="p-3 border rounded-3 bg-white" style={{ fontFamily: "sans-serif" }}>
              <div className="text-center mb-4">
                <h4 className="fw-bold text-dark mb-1">Aura Studio ERP</h4>
                <p className="text-muted small mb-0">Comprobante Oficial de Liquidación de Haberes</p>
                <div className="small text-muted mt-1">
                  Fecha: {activeReceipt.paymentDate && !isNaN(new Date(activeReceipt.paymentDate).getTime()) ? new Date(activeReceipt.paymentDate).toLocaleDateString("es-AR") : "—"}
                </div>
              </div>
              <hr />
              <div className="row mb-3">
                <div className="col-6">
                  <strong>Colaborador:</strong> {activeReceipt.worker ? `${activeReceipt.worker.firstName} ${activeReceipt.worker.lastName}` : "Colaborador"}
                </div>
                <div className="col-6 text-end">
                  <strong>Rol:</strong> {activeReceipt.worker?.roleTitle || "Estilista"}
                </div>
              </div>
              <hr />
              <Table bordered size="sm" className="mb-4">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th className="text-end">Haberes (+)</th>
                    <th className="text-end">Descuentos (-)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sueldo Básico</td>
                    <td className="text-end text-success">{currency(activeReceipt.baseSalary)}</td>
                    <td className="text-end">-</td>
                  </tr>
                  <tr>
                    <td>Comisiones Liquidadas (40%)</td>
                    <td className="text-end text-success">{currency(activeReceipt.commissionPaid)}</td>
                    <td className="text-end">-</td>
                  </tr>
                  {activeReceipt.bonuses > 0 && (
                    <tr>
                      <td>Premios / Incentivos</td>
                      <td className="text-end text-success">{currency(activeReceipt.bonuses)}</td>
                      <td className="text-end">-</td>
                    </tr>
                  )}
                  {activeReceipt.advances > 0 && (
                    <tr>
                      <td>Adelanto de Sueldo</td>
                      <td className="text-end">-</td>
                      <td className="text-end text-danger">{currency(activeReceipt.advances)}</td>
                    </tr>
                  )}
                  {activeReceipt.deductions > 0 && (
                    <tr>
                      <td>Descuentos varios</td>
                      <td className="text-end">-</td>
                      <td className="text-end text-danger">{currency(activeReceipt.deductions)}</td>
                    </tr>
                  )}
                  {activeReceipt.taxes > 0 && (
                    <tr>
                      <td>Retenciones de ley</td>
                      <td className="text-end">-</td>
                      <td className="text-end text-danger">{currency(activeReceipt.taxes)}</td>
                    </tr>
                  )}
                </tbody>
              </Table>
              <div className="p-3 bg-light rounded text-end fs-5 fw-bold">
                Neto a Cobrar: &nbsp;
                <span className="text-purple-600">
                  {currency(activeReceipt.netPaid)}
                </span>
              </div>
              {activeReceipt.notes && (
                <div className="mt-3 small text-muted mb-3">
                  <strong>Observaciones:</strong> {activeReceipt.notes}
                </div>
              )}

              {Array.isArray(activeReceipt.commissionDetail) && activeReceipt.commissionDetail.length > 0 && (
                <div className="mb-4 mt-3">
                  <h6 className="fw-bold text-purple-700 mb-2">Detalle de comisiones por servicio</h6>
                  <Table size="sm" bordered className="mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: "12px" }}>
                        <th>Servicio</th>
                        <th className="text-center">Citas</th>
                        <th className="text-end">Comisión</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "13px" }}>
                      {activeReceipt.commissionDetail.map((d, i) => (
                        <tr key={i}>
                          <td>{d.serviceName}</td>
                          <td className="text-center">{d.count}</td>
                          <td className="text-end fw-semibold">{currency(d.commission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              <div className="row mt-5 pt-4 text-center">
                <div className="col-6">
                  <div className="border-top pt-2">Firma Empleador</div>
                </div>
                <div className="col-6">
                  <div className="border-top pt-2">Firma Colaborador</div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowReceipt(false)}>
            Cerrar
          </Button>
          <Button 
            variant="purple" 
            disabled={sendingId === activeReceipt?.id || !activeReceipt?.worker?.email}
            onClick={() => handleSendReceipt(activeReceipt.id)}
            className="d-flex align-items-center gap-1.5"
          >
            {sendingId === activeReceipt?.id ? <Spinner size="sm" animation="border" /> : <Send size={14} />}
            <span>Enviar por email</span>
          </Button>
          <Button variant="purple" onClick={() => window.print()}>
            <Printer size={16} className="me-1" /> Imprimir
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
