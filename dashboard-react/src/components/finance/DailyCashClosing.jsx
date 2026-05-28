import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { ShieldCheck, AlertCircle, Save, DollarSign, Calendar } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function DailyCashClosing({ currentRevenue = 0 }) {
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [initialCash, setInitialCash] = useState("10000");
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");

  const expectedCash = Number(initialCash) + currentRevenue;
  const difference = actualCash ? Number(actualCash) - expectedCash : 0;

  const fetchClosings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances/cash-closings");
      setClosings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los cierres de caja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosings();
  }, []);

  const handleCloseCash = async (e) => {
    e.preventDefault();
    if (!actualCash) {
      setError("Por favor, ingresá el monto de efectivo físico contado.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const payload = {
        initialCash: Number(initialCash),
        expectedCash,
        actualCash: Number(actualCash),
        notes: notes.trim()
      };

      await api.post("/finances/cash-closings", payload);
      setOkMsg("¡Cierre de caja realizado y guardado con éxito! Registro auditado.");
      setActualCash("");
      setNotes("");
      fetchClosings();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Error al guardar el cierre de caja.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Row className="g-4">
        {/* Formulario de Cierre Diario */}
        <Col lg={5}>
          <Card className="card-premium border-0 shadow-sm h-100 bg-white">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <h3 className="h6 fw-black text-gray-900 mb-1 d-flex align-items-center gap-2">
                  <ShieldCheck className="text-purple-600 animate-pulse" size={20} />
                  <span>Arqueo y Cierre de Caja Diario</span>
                </h3>
                <p className="text-muted smaller mb-4">Verificá los valores del día, contá el dinero de tu caja física y confirmá el cierre auditado.</p>
                
                {error && <Alert variant="danger" className="rounded-xl smaller py-2">{error}</Alert>}
                {okMsg && <Alert variant="success" className="rounded-xl smaller py-2">{okMsg}</Alert>}

                <Form onSubmit={handleCloseCash}>
                  <Form.Group className="mb-3">
                    <Form.Label className="smaller text-muted fw-bold">Caja Inicial de Apertura ($)</Form.Label>
                    <Form.Control
                      type="number"
                      value={initialCash}
                      onChange={(e) => setInitialCash(e.target.value)}
                      className="border-gray-200 rounded-xl"
                      required
                    />
                  </Form.Group>

                  <div className="p-3 bg-purple-50 rounded-xl mb-3 border border-purple-100">
                    <div className="d-flex justify-content-between mb-1.5 small text-purple-900">
                      <span>Ingresos Efectivos del Día:</span>
                      <span className="fw-bold">{currency(currentRevenue)}</span>
                    </div>
                    <div className="d-flex justify-content-between border-top border-purple-200 pt-1.5 fw-bold text-purple-950">
                      <span>Efectivo Teórico Esperado:</span>
                      <span>{currency(expectedCash)}</span>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="smaller text-purple-950 fw-bold">Efectivo Físico Real Contado ($) *</Form.Label>
                    <Form.Control
                      type="number"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      placeholder="Ej: 75000"
                      className="border-purple-300 rounded-xl p-3 focus-ring-purple shadow-sm-hover"
                      required
                    />
                  </Form.Group>

                  {actualCash && (
                    <div className={`p-3 rounded-xl mb-4 border d-flex align-items-center gap-2.5 ${
                      difference === 0 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : difference > 0 
                          ? "bg-blue-50 text-blue-800 border-blue-200" 
                          : "bg-red-50 text-red-800 border-red-200"
                    }`}>
                      <AlertCircle size={20} />
                      <div className="small">
                        {difference === 0 && <span><strong>Caja Cuadrada:</strong> Sin diferencias de dinero detectadas.</span>}
                        {difference > 0 && <span><strong>Sobrante de Caja:</strong> Hay un sobrante de <strong>{currency(difference)}</strong>.</span>}
                        {difference < 0 && <span><strong>Faltante de Caja:</strong> Se detectó un faltante de <strong>{currency(Math.abs(difference))}</strong>.</span>}
                      </div>
                    </div>
                  )}

                  <Form.Group className="mb-4">
                    <Form.Label className="smaller text-muted fw-bold">Comentarios y Observaciones (Opcional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Retiro de $5.000 para compra urgente de toallas..."
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="purple"
                    disabled={saving}
                    className="w-100 rounded-xl py-3 fw-bold text-white bg-purple-600 hover-bg-purple-700 shadow d-flex align-items-center justify-content-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" animation="border" />
                        <span>Cerrando y auditando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Confirmar y Cerrar Caja</span>
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Historial de Cierres Diarios */}
        <Col lg={7}>
          <Card className="card-premium border-0 shadow-sm h-100 bg-white">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
                <Calendar className="text-purple-600" size={20} />
                <span>Auditoría de Cierres de Caja Anteriores</span>
              </h3>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="purple" />
                </div>
              ) : closings.length === 0 ? (
                <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
                  No hay cierres de caja registrados todavía.
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: "400px" }}>
                  <Table hover responsive className="mb-0 align-middle">
                    <thead>
                      <tr className="table-header-small" style={{ fontSize: "11px" }}>
                        <th className="ps-3">Fecha y Hora</th>
                        <th>Caja Inicial</th>
                        <th>Esperado</th>
                        <th>Físico Real</th>
                        <th>Diferencia</th>
                        <th className="pe-3">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "13px" }}>
                      {closings.map((c) => (
                        <tr key={c.id}>
                          <td className="ps-3 text-secondary">
                            {new Date(c.closingDate).toLocaleDateString("es-AR")} • {new Date(c.closingDate).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                          </td>
                          <td className="text-gray-700">{currency(c.initialCash)}</td>
                          <td className="fw-semibold text-gray-800">{currency(c.expectedCash)}</td>
                          <td className="fw-bold text-purple-700">{currency(c.actualCash)}</td>
                          <td>
                            <Badge 
                              bg={c.difference === 0 ? "success-soft" : c.difference > 0 ? "primary-soft" : "danger-soft"}
                              className={c.difference === 0 ? "text-success rounded-pill px-2.5" : c.difference > 0 ? "text-primary rounded-pill px-2.5" : "text-danger rounded-pill px-2.5"}
                            >
                              {c.difference === 0 ? "Cuadrada" : c.difference > 0 ? `+${currency(c.difference)}` : `${currency(c.difference)}`}
                            </Badge>
                          </td>
                          <td className="text-muted smaller italic pe-3">{c.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
