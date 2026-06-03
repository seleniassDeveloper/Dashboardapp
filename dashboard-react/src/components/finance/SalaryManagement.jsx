import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Alert, Badge, Modal } from "react-bootstrap";
import { Award, DollarSign, Printer, Save, History, FileText, CheckCircle } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function SalaryManagement({ professionalStats = [] }) {
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Professional Payroll states
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [baseSalary, setBaseSalary] = useState("45000");
  const [bonuses, setBonuses] = useState("0");
  const [advances, setAdvances] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [taxes, setTaxes] = useState("0");
  const [notes, setNotes] = useState("");

  // Paycheck Modal print
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const fetchPayrollHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances/payroll");
      setPayrollHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el historial de liquidaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollHistory();
  }, []);

  const handleSelectStylist = (stylist) => {
    setSelectedStylist(stylist);
    // Presets based on professional profile
    setBaseSalary(stylist.name.includes("Andrea") ? "65000" : "45000");
    setBonuses("0");
    setAdvances("0");
    setDeductions("0");
    setTaxes("0");
    setNotes("");
    setError("");
    setOkMsg("");
  };

  const calculatedCommission = selectedStylist ? selectedStylist.commission : 0;
  const netSalary = selectedStylist 
    ? Number(baseSalary) + calculatedCommission + Number(bonuses) - Number(advances) - Number(deductions) - Number(taxes)
    : 0;

  const handleLiquidate = async (e) => {
    e.preventDefault();
    if (!selectedStylist) return;

    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const payload = {
        workerId: selectedStylist.id,
        baseSalary: Number(baseSalary),
        commissionPaid: calculatedCommission,
        bonuses: Number(bonuses),
        advances: Number(advances),
        deductions: Number(deductions),
        taxes: Number(taxes),
        notes: notes.trim()
      };

      const res = await api.post("/finances/payroll", payload);
      setOkMsg(`Liquidación realizada para ${selectedStylist.name}. ¡Comprobante generado!`);
      setSelectedStylist(null);
      fetchPayrollHistory();
      
      // Open receipt modal immediately
      setActiveReceipt(res.data);
      setShowReceiptModal(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Error al liquidar haberes.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintReceipt = (receipt) => {
    setActiveReceipt(receipt);
    setShowReceiptModal(true);
  };

  const triggerPrintWindow = () => {
    window.print();
  };

  return (
    <div>
      <Row className="g-4">
        {/* Panel de Liquidación Activo */}
        <Col xs={12}>
          <Card className="card-premium border-0 shadow-sm h-100 bg-white">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-3 d-flex align-items-center gap-2">
                <DollarSign className="text-purple-600 animate-pulse" size={20} />
                <span>Liquidación Mensual de Haberes y Comisiones</span>
              </h3>
              <p className="text-muted smaller mb-4">Seleccioná un estilista para configurar haberes básicos, liquidar sus comisiones (40% de facturación en turnos concretados) y emitir su recibo de sueldo.</p>

              {error && <Alert variant="danger" className="rounded-xl py-2 smaller">{error}</Alert>}
              {okMsg && <Alert variant="success" className="rounded-xl py-2 smaller">{okMsg}</Alert>}

              {/* Lista de Profesionales */}
              <div className="table-responsive mb-4" style={{ maxHeight: "200px" }}>
                <Table hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="table-header-small" style={{ fontSize: "11px" }}>
                      <th>Colaborador</th>
                      <th>Rol</th>
                      <th>Citas Completadas</th>
                      <th>Facturado Real</th>
                      <th>Comisión Acumulada</th>
                      <th className="text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "12.5px" }}>
                    {professionalStats.map((p) => (
                      <tr key={p.id} className={selectedStylist?.id === p.id ? "table-active border-purple-500" : ""}>
                        <td className="fw-bold text-gray-900">{p.name}</td>
                        <td>
                          <Badge bg="light" className="text-secondary border rounded-pill px-2">{p.role}</Badge>
                        </td>
                        <td className="fw-semibold text-gray-800 text-center">{p.count} turnos</td>
                        <td className="text-gray-700">{currency(p.totalRevenue)}</td>
                        <td className="fw-bold text-emerald-600">{currency(p.commission)}</td>
                        <td className="text-end">
                          <Button 
                            variant={selectedStylist?.id === p.id ? "dark" : "outline-dark"} 
                            size="sm" 
                            className="rounded-xl font-bold"
                            style={selectedStylist?.id === p.id ? { backgroundColor: "#111827", color: "#ffffff", border: "none" } : { backgroundColor: "#ffffff", color: "#111827", border: "1px solid #d1d5db" }}
                            onClick={() => handleSelectStylist(p)}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Formulario de Detalle de Haberes */}
              {selectedStylist ? (
                <Form onSubmit={handleLiquidate} className="border-top pt-4 border-gray-150">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="h6 fw-bold text-purple-800 m-0">Ajustes para: {selectedStylist.name}</h4>
                    <span className="badge bg-purple-100 text-purple-700 fw-bold px-3 py-1.5 rounded-lg">Comisión 40%: {currency(calculatedCommission)}</span>
                  </div>

                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Sueldo Base ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={baseSalary}
                          onChange={(e) => setBaseSalary(e.target.value)}
                          className="border-gray-200 rounded-xl"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Bonos / Incentivos ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={bonuses}
                          onChange={(e) => setBonuses(e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Adelantos Otorgados ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={advances}
                          onChange={(e) => setAdvances(e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Descuentos / Faltas ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={deductions}
                          onChange={(e) => setDeductions(e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="smaller text-muted fw-bold">Retenciones / Aportes ($)</Form.Label>
                        <Form.Control
                          type="number"
                          value={taxes}
                          onChange={(e) => setTaxes(e.target.value)}
                          className="border-gray-200 rounded-xl"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 h-100 d-flex flex-column justify-content-center text-center">
                        <small className="text-muted block smaller fw-bold uppercase">Sueldo Neto a Cobrar</small>
                        <div className="h4 fw-black text-purple-700 m-0">{currency(netSalary)}</div>
                      </div>
                    </Col>

                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="smaller text-muted fw-bold">Notas de Liquidación (Fórmula, detalles de bono)</Form.Label>
                        <Form.Control
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ej: Bono por cumplimiento de metas de reventa, descuento adelanto quincenal..."
                          className="border-gray-200 rounded-xl"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end gap-2.5 mt-3">
                    <Button 
                      variant="light" 
                      onClick={() => setSelectedStylist(null)} 
                      className="rounded-xl px-4 fw-bold"
                      style={{ backgroundColor: "#ffffff", color: "#111827", border: "1px solid #d1d5db" }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="dark"
                      disabled={saving}
                      className="rounded-xl px-5 text-white fw-bold shadow border-0 d-flex align-items-center gap-1.5"
                      style={{ backgroundColor: "#111827" }}
                    >
                      {saving ? <Spinner size="sm" animation="border" /> : <Save size={16} />}
                      <span>Liquidar Haberes</span>
                    </Button>
                  </div>
                </Form>
              ) : (
                <div className="text-center py-5 bg-gray-50 border rounded-2xl text-muted small">
                  Seleccioná un profesional arriba para abrir su planilla de liquidación de sueldo del mes.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Historial de Liquidaciones */}
        <Col xs={12}>
          <Card className="card-premium border-0 shadow-sm h-100 bg-white">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
                <History className="text-purple-600" size={20} />
                <span>Historial de Pagos Realizados</span>
              </h3>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="purple" />
                </div>
              ) : payrollHistory.length === 0 ? (
                <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
                  No hay recibos de haberes registrados todavía.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: "400px" }}>
                  {payrollHistory.map((pay) => (
                    <div key={pay.id} className="p-3 border rounded-xl bg-light shadow-sm-hover transition-all d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold text-gray-900">{pay.worker ? `${pay.worker.firstName} ${pay.worker.lastName}` : "Colaborador"}</div>
                        <div className="text-muted smaller">
                          {new Date(pay.paymentDate).toLocaleDateString("es-AR")} • {currency(pay.netPaid)} Netto
                        </div>
                      </div>
                      <Button 
                        variant="outline-purple" 
                        size="sm" 
                        className="rounded-xl p-2 hover-scale"
                        onClick={() => handlePrintReceipt(pay)}
                        title="Ver Recibo"
                      >
                        <Printer size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MODAL IMPRIMIBLE DE RECIBO DE SUELDO */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} size="lg" centered className="print-modal border-0">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <FileText size={20} className="text-purple-600" />
            <span>Recibo de Sueldo y Liquidación</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-5" id="printable-area">
          {activeReceipt && (
            <div style={{ fontFamily: "'Inter', sans-serif", color: "#374151" }}>
              <div className="d-flex justify-content-between border-bottom pb-4 mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="h4 fw-black text-purple-700 m-0">AURA STUDIO S.A.S</h2>
                  <p className="text-muted small mb-0">Honduras 4800, Palermo, CABA • CUIT: 30-71829301-9</p>
                </div>
                <div className="text-end">
                  <h3 className="h5 fw-bold text-gray-900 mb-1">RECIBO DE HABERES</h3>
                  <small className="text-muted">Fecha Liquidación: {new Date(activeReceipt.paymentDate).toLocaleDateString("es-AR")}</small>
                </div>
              </div>

              <div className="p-3 bg-light rounded-xl mb-4 border" style={{ fontSize: "14px" }}>
                <Row className="g-2">
                  <Col xs={6}><strong>Colaborador:</strong> {activeReceipt.worker ? `${activeReceipt.worker.firstName} ${activeReceipt.worker.lastName}` : "Profesional"}</Col>
                  <Col xs={6}><strong>Rol / Categoría:</strong> {activeReceipt.worker?.roleTitle || "Estilista"}</Col>
                  <Col xs={6}><strong>CUIT/CUIL:</strong> 27-39201928-2</Col>
                  <Col xs={6}><strong>Período Liquidado:</strong> Mayo 2026</Col>
                </Row>
              </div>

              <Table bordered size="sm" className="mb-4">
                <thead className="bg-light">
                  <tr style={{ fontSize: "12px", textTransform: "uppercase" }}>
                    <th>Concepto / Descripción</th>
                    <th className="text-end">Haberes (Debitos)</th>
                    <th className="text-end">Descuentos</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13.5px" }}>
                  <tr>
                    <td>Sueldo Básico de Convenio</td>
                    <td className="text-end">{currency(activeReceipt.baseSalary)}</td>
                    <td className="text-end">—</td>
                  </tr>
                  <tr>
                    <td>Comisión 40% Citas Realizadas</td>
                    <td className="text-end">{currency(activeReceipt.commissionPaid)}</td>
                    <td className="text-end">—</td>
                  </tr>
                  {activeReceipt.bonuses > 0 && (
                    <tr>
                      <td>Premios / Bonos de Ocupación</td>
                      <td className="text-end">{currency(activeReceipt.bonuses)}</td>
                      <td className="text-end">—</td>
                    </tr>
                  )}
                  {activeReceipt.advances > 0 && (
                    <tr>
                      <td>Descuento Adelanto Quincenal</td>
                      <td className="text-end">—</td>
                      <td className="text-end text-red-600">({currency(activeReceipt.advances)})</td>
                    </tr>
                  )}
                  {activeReceipt.deductions > 0 && (
                    <tr>
                      <td>Descuentos Faltas / Inasistencias</td>
                      <td className="text-end">—</td>
                      <td className="text-end text-red-600">({currency(activeReceipt.deductions)})</td>
                    </tr>
                  )}
                  {activeReceipt.taxes > 0 && (
                    <tr>
                      <td>Retención Obra Social y Jubilación</td>
                      <td className="text-end">—</td>
                      <td className="text-end text-red-600">({currency(activeReceipt.taxes)})</td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <div className="d-flex justify-content-end mb-5">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-end" style={{ minWidth: "250px" }}>
                  <small className="text-purple-700 fw-bold uppercase block mb-1">Total Neto a Cobrar (Caja)</small>
                  <span className="h3 fw-black text-purple-950">{currency(activeReceipt.netPaid)}</span>
                </div>
              </div>

              {activeReceipt.notes && (
                <div className="p-3 bg-gray-50 rounded-xl border text-muted smaller mb-5 italic">
                  <strong>Detalles adicionales:</strong> {activeReceipt.notes}
                </div>
              )}

              <div className="d-flex justify-content-between pt-5 border-top flex-wrap gap-5" style={{ fontSize: "13px" }}>
                <div className="text-center" style={{ width: "200px" }}>
                  <div style={{ height: "60px" }}></div>
                  <div className="border-top pt-2">Firma Empleador</div>
                </div>
                <div className="text-center" style={{ width: "200px" }}>
                  <div style={{ height: "60px" }}></div>
                  <div className="border-top pt-2">Firma Colaborador</div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
          <Button 
            variant="light" 
            onClick={() => setShowReceiptModal(false)} 
            className="rounded-xl px-4 fw-bold"
            style={{ backgroundColor: "#ffffff", color: "#111827", border: "1px solid #d1d5db" }}
          >
            Cerrar
          </Button>
          <Button 
            variant="dark" 
            onClick={triggerPrintWindow} 
            className="rounded-xl px-5 text-white fw-bold d-flex align-items-center gap-1.5 shadow border-0"
            style={{ backgroundColor: "#111827" }}
          >
            <Printer size={16} />
            <span>Imprimir Recibo</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
