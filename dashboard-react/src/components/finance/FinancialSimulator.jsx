import React, { useState } from "react";
import { Card, Row, Col, Form, Badge, ProgressBar } from "react-bootstrap";
import { Sparkles, TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function FinancialSimulator({ baseRevenue = 60000, baseExpenses = 250000 }) {
  const [priceIncrease, setPriceIncrease] = useState(10); // in %
  const [expenseReduction, setExpenseReduction] = useState(5); // in %
  const [newStylists, setNewStylists] = useState(0); // quantity
  const [newBranches, setNewBranches] = useState(0); // quantity
  const [stylistCommission, setStylistCommission] = useState(40); // in %

  // Calculations
  const revenueAfterPriceIncrease = baseRevenue * (1 + priceIncrease / 100);
  const stylistHiringRevenue = newStylists * 25000; // estimated monthly revenue generated per hiring
  const branchOpeningRevenue = newBranches * 120000; // estimated monthly branch revenue

  const totalProjectedRevenue = revenueAfterPriceIncrease + stylistHiringRevenue + branchOpeningRevenue;

  const expensesAfterReduction = baseExpenses * (1 - expenseReduction / 100);
  const stylistHiringCost = newStylists * 45000; // base salary cost
  const branchOpeningCost = newBranches * 85000; // operational cost of opening a branch

  const totalProjectedExpenses = expensesAfterReduction + stylistHiringCost + branchOpeningCost;

  const projectedCommissions = Math.round(totalProjectedRevenue * (stylistCommission / 100));
  const projectedNetProfit = totalProjectedRevenue - totalProjectedExpenses - projectedCommissions;
  const projectedMargin = totalProjectedRevenue > 0 ? Math.round((projectedNetProfit / totalProjectedRevenue) * 100) : 0;

  // Live Risk Index Calculator
  let riskIndex = 15; // low risk default
  let riskLabel = "Bajo";
  let riskColor = "success";

  if (newBranches > 0) riskIndex += newBranches * 30;
  if (newStylists > 2) riskIndex += 20;
  if (stylistCommission > 45) riskIndex += 15;
  if (priceIncrease > 25) riskIndex += 25;

  riskIndex = Math.min(100, riskIndex);
  if (riskIndex > 65) {
    riskLabel = "Crítico";
    riskColor = "danger";
  } else if (riskIndex > 35) {
    riskLabel = "Moderado";
    riskColor = "warning";
  }

  return (
    <Card className="card-premium border-0 shadow-sm bg-white">
      <Card.Body className="p-4">
        <h3 className="h6 fw-black text-gray-900 mb-1 d-flex align-items-center gap-2">
          <Sparkles className="text-purple-600 animate-pulse" size={20} />
          <span>Simulador Financiero Inteligente e Impacto Neto</span>
        </h3>
        <p className="text-muted smaller mb-4">Ajustá las variables de tu negocio para simular escenarios reales de reajustes tarifarios, contrataciones de coloristas o aperturas de sucursales en vivo.</p>

        <Row className="g-4">
          {/* Sliders de Simulación */}
          <Col lg={6} className="border-end pe-lg-4">
            <h4 className="smaller text-muted fw-bold uppercase mb-4">Variables de Simulación</h4>
            
            <Form className="d-grid gap-4">
              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5 small text-gray-700">
                  <span className="fw-semibold">Aumento de Tarifas / Precios:</span>
                  <span className="fw-bold text-purple-700">+{priceIncrease}%</span>
                </div>
                <Form.Range
                  min={0}
                  max={50}
                  step={5}
                  value={priceIncrease}
                  onChange={(e) => setPriceIncrease(Number(e.target.value))}
                />
              </Form.Group>

              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5 small text-gray-700">
                  <span className="fw-semibold">Reducción de Costos Operativos:</span>
                  <span className="fw-bold text-emerald-600">-{expenseReduction}%</span>
                </div>
                <Form.Range
                  min={0}
                  max={25}
                  step={1}
                  value={expenseReduction}
                  onChange={(e) => setExpenseReduction(Number(e.target.value))}
                />
              </Form.Group>

              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5 small text-gray-700">
                  <span className="fw-semibold">Contratar Nuevos Estilistas:</span>
                  <span className="fw-bold text-dark">{newStylists} profesional{newStylists !== 1 ? "es" : ""}</span>
                </div>
                <Form.Range
                  min={0}
                  max={5}
                  step={1}
                  value={newStylists}
                  onChange={(e) => setNewStylists(Number(e.target.value))}
                />
              </Form.Group>

              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5 small text-gray-700">
                  <span className="fw-semibold">Abrir Nuevas Sucursales:</span>
                  <span className="fw-bold text-dark">{newBranches} sucursal{newBranches !== 1 ? "es" : ""}</span>
                </div>
                <Form.Range
                  min={0}
                  max={3}
                  step={1}
                  value={newBranches}
                  onChange={(e) => setNewBranches(Number(e.target.value))}
                />
              </Form.Group>

              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5 small text-gray-700">
                  <span className="fw-semibold">Porcentaje de Comisión:</span>
                  <span className="fw-bold text-purple-700">{stylistCommission}%</span>
                </div>
                <Form.Range
                  min={30}
                  max={60}
                  step={5}
                  value={stylistCommission}
                  onChange={(e) => setStylistCommission(Number(e.target.value))}
                />
              </Form.Group>
            </Form>
          </Col>

          {/* Proyecciones de Rendimiento y Riesgo */}
          <Col lg={6} className="ps-lg-4 d-flex flex-column justify-content-between">
            <div>
              <h4 className="smaller text-muted fw-bold uppercase mb-4">Proyecciones de Rendimiento Financiero</h4>
              
              <Row className="g-3 mb-4">
                <Col xs={6}>
                  <Card className="border-0 bg-light p-3 rounded-2xl text-center shadow-sm-hover transition-all">
                    <div className="text-muted smaller fw-bold mb-1 uppercase">Ingresos Estimados</div>
                    <div className="h4 fw-black text-gray-900 mb-0">{currency(totalProjectedRevenue)}</div>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="border-0 bg-light p-3 rounded-2xl text-center shadow-sm-hover transition-all">
                    <div className="text-muted smaller fw-bold mb-1 uppercase">Gastos Proyectados</div>
                    <div className="h4 fw-black text-red-600 mb-0">{currency(totalProjectedExpenses)}</div>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="border-0 bg-light p-3 rounded-2xl text-center shadow-sm-hover transition-all">
                    <div className="text-muted smaller fw-bold mb-1 uppercase">Comisiones Estimadas</div>
                    <div className="h4 fw-black text-gray-800 mb-0">{currency(projectedCommissions)}</div>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="border-0 bg-purple-50 p-3 rounded-2xl text-center shadow-sm border border-purple-100">
                    <div className="text-purple-700 smaller fw-bold mb-1 uppercase">Ganancia Neta Simulada</div>
                    <div className="h4 fw-black text-purple-950 mb-0">{currency(projectedNetProfit)}</div>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Risk Index Indicators */}
            <div className="p-4 bg-light rounded-2xl border">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <h5 className="h6 fw-bold text-gray-900 m-0 d-flex align-items-center gap-1.5">
                  <AlertTriangle className={`text-${riskColor}`} size={16} />
                  <span>Índice de Riesgo del Escenario</span>
                </h5>
                <Badge bg={riskColor} className="rounded-pill px-3 py-1 fw-bold text-white uppercase">{riskLabel}</Badge>
              </div>
              <ProgressBar now={riskIndex} variant={riskColor} className="rounded-pill shadow-inner mb-3" style={{ height: "10px" }} />
              
              <div className="small text-muted italic leading-relaxed">
                {riskIndex > 65 && (
                  <span>⚠️ <strong>Alerta Directiva:</strong> La apertura de sucursales o la fijación de altas tasas de comisiones aumentan drásticamente el riesgo de liquidez inicial. Asegurá financiamiento previo.</span>
                )}
                {riskIndex > 35 && riskIndex <= 65 && (
                  <span>💡 Escenario con riesgo moderado. Contratar profesionales fomenta mayor volumen, pero recordá auditar la tasa de ocupación real de los turnos para cubrir los salarios fijos.</span>
                )}
                {riskIndex <= 35 && (
                  <span>✅ Escenario de bajo riesgo. Los reajustes paulatinos de precios y las optimizaciones ligeras de costos garantizan un crecimiento estable del margen operativo.</span>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
