import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Badge, ProgressBar, Button, Modal, InputGroup } from "react-bootstrap";
import { Sparkles, TrendingUp, DollarSign, Users, AlertTriangle, Plus, Trash2, Coins, TrendingDown, HelpCircle, RefreshCw } from "lucide-react";

// Helper de formato de moneda argentina
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// Variables predeterminadas sugeridas de muestra si no hay guardadas
const SEED_CUSTOM_VARS = [
  {
    id: "c1",
    name: "Alquiler de Cabina de Estética",
    type: "income", // 'income' o 'expense'
    calcType: "fixed", // 'fixed' (tarifa fija por unidad) o 'percent' (% sobre base)
    value: 15000, // monto fijo
    min: 0,
    max: 10,
    step: 1,
    unit: "cabinas",
    currentVal: 0
  },
  {
    id: "c2",
    name: "Campaña de Marketing Digital",
    type: "expense",
    calcType: "fixed",
    value: 30000,
    min: 0,
    max: 5,
    step: 1,
    unit: "campañas",
    currentVal: 0
  }
];

export default function FinancialSimulator({ baseRevenue = 60000, baseExpenses = 250000 }) {
  // Sliders Estándar del Sistema
  const [priceIncrease, setPriceIncrease] = useState(10); // en %
  const [expenseReduction, setExpenseReduction] = useState(5); // en %
  const [newStylists, setNewStylists] = useState(0); // cantidad
  const [newBranches, setNewBranches] = useState(0); // cantidad
  const [stylistCommission, setStylistCommission] = useState(40); // en %

  // Estado para Variables Personalizadas (Cargadas de LocalStorage con Seed como fallback)
  const [customVars, setCustomVars] = useState(() => {
    const stored = localStorage.getItem("auradash_custom_simulation_variables");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing custom variables:", e);
      }
    }
    return SEED_CUSTOM_VARS;
  });

  // Modal de Creación de Variables
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarType, setNewVarType] = useState("income");
  const [newVarCalcType, setNewVarCalcType] = useState("fixed");
  const [newVarValue, setNewVarValue] = useState("");
  const [newVarMax, setNewVarMax] = useState("10");
  const [newVarUnit, setNewVarUnit] = useState("unidades");

  // Guardar en LocalStorage cada vez que cambien las variables
  useEffect(() => {
    localStorage.setItem("auradash_custom_simulation_variables", JSON.stringify(customVars));
  }, [customVars]);

  // Manejo de actualización de valor de variable personalizada
  const handleCustomValChange = (id, val) => {
    setCustomVars(prev => prev.map(v => v.id === id ? { ...v, currentVal: Number(val) } : v));
  };

  // Agregar nueva variable personalizada
  const handleAddCustomVar = (e) => {
    e.preventDefault();
    if (!newVarName.trim() || !newVarValue) return;

    const newVar = {
      id: `custom-${Date.now()}`,
      name: newVarName.trim(),
      type: newVarType,
      calcType: newVarCalcType,
      value: Number(newVarValue),
      min: 0,
      max: Number(newVarMax) || 10,
      step: newVarCalcType === "percent" ? 1 : 1,
      unit: newVarUnit.trim() || "unidades",
      currentVal: 0
    };

    setCustomVars(prev => [...prev, newVar]);
    
    // Resetear formulario
    setNewVarName("");
    setNewVarType("income");
    setNewVarCalcType("fixed");
    setNewVarValue("");
    setNewVarMax("10");
    setNewVarUnit("unidades");
    setShowAddModal(false);
  };

  // Eliminar variable personalizada
  const handleDeleteCustomVar = (id) => {
    setCustomVars(prev => prev.filter(v => v.id !== id));
  };

  // Restaurar simulador a estado inicial
  const handleResetSimulator = () => {
    setPriceIncrease(10);
    setExpenseReduction(5);
    setNewStylists(0);
    setNewBranches(0);
    setStylistCommission(40);
    setCustomVars(SEED_CUSTOM_VARS.map(v => ({ ...v, currentVal: 0 })));
  };

  // --- CÁLCULOS MATEMÁTICOS DE PROYECCIÓN ---

  // 1. Ingresos Base modificados
  const revenueAfterPriceIncrease = baseRevenue * (1 + priceIncrease / 100);
  const stylistHiringRevenue = newStylists * 25000; // Ingreso estimado mensual por estilista contratado
  const branchOpeningRevenue = newBranches * 120000; // Ingreso estimado mensual por sucursal abierta

  // Suma de Ingresos de Variables Personalizadas
  let customRevenueAddition = 0;
  // Suma de Egresos de Variables Personalizadas
  let customExpenseAddition = 0;

  customVars.forEach(v => {
    const sliderVal = Number(v.currentVal || 0);
    const impactVal = Number(v.value || 0);

    if (v.type === "income") {
      if (v.calcType === "fixed") {
        customRevenueAddition += sliderVal * impactVal;
      } else {
        // Impacto porcentual calculado sobre la facturación base
        customRevenueAddition += baseRevenue * (sliderVal * impactVal / 100);
      }
    } else if (v.type === "expense") {
      if (v.calcType === "fixed") {
        customExpenseAddition += sliderVal * impactVal;
      } else {
        // Impacto porcentual calculado sobre los gastos base
        customExpenseAddition += baseExpenses * (sliderVal * impactVal / 100);
      }
    }
  });

  const totalProjectedRevenue = revenueAfterPriceIncrease + stylistHiringRevenue + branchOpeningRevenue + customRevenueAddition;

  // 2. Egresos Base modificados
  const expensesAfterReduction = baseExpenses * (1 - expenseReduction / 100);
  const stylistHiringCost = newStylists * 45000; // Costo estimado de sueldo
  const branchOpeningCost = newBranches * 85000; // Costo operativo mensual por sucursal

  const totalProjectedExpenses = expensesAfterReduction + stylistHiringCost + branchOpeningCost + customExpenseAddition;

  // 3. Comisiones y Margen Neto
  const projectedCommissions = Math.round(totalProjectedRevenue * (stylistCommission / 100));
  const projectedNetProfit = totalProjectedRevenue - totalProjectedExpenses - projectedCommissions;
  const projectedMargin = totalProjectedRevenue > 0 ? Math.round((projectedNetProfit / totalProjectedRevenue) * 100) : 0;

  // --- CÁLCULO DINÁMICO DE RIESGO DE ESCENARIO ---
  let riskIndex = 15; // default bajo

  if (newBranches > 0) riskIndex += newBranches * 25;
  if (newStylists > 2) riskIndex += 15;
  if (stylistCommission > 45) riskIndex += 15;
  if (priceIncrease > 25) riskIndex += 20;

  // Sumar riesgo por cada gasto personalizado agregado
  customVars.forEach(v => {
    if (v.type === "expense" && v.currentVal > 0) {
      riskIndex += Math.min(25, v.currentVal * 6);
    }
  });

  // Modificar riesgo basándose en el balance real proyectado
  if (totalProjectedRevenue > 0) {
    const expensesRatio = (totalProjectedExpenses + projectedCommissions) / totalProjectedRevenue;
    if (expensesRatio > 0.95) {
      riskIndex += 35; // Muy ajustado, peligro de caja
    } else if (expensesRatio > 0.8) {
      riskIndex += 15;
    }
  }

  // Pérdida neta inmediatamente eleva el riesgo a crítico
  if (projectedNetProfit < 0) {
    riskIndex = Math.max(riskIndex, 90);
  }

  riskIndex = Math.min(100, riskIndex);

  let riskLabel = "Bajo";
  let riskColor = "success";
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
        
        {/* Cabecera del Simulador */}
        <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
          <h3 className="h6 fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
            <Sparkles className="text-purple-600 animate-pulse" size={20} />
            <span>Simulador Financiero Inteligente e Impacto Neto</span>
          </h3>
          <div className="d-flex gap-2">
            <Button
              variant="outline-dark"
              size="sm"
              onClick={handleResetSimulator}
              className="rounded-xl px-2.5 py-1.5 small fw-bold d-flex align-items-center gap-1.5 border"
            >
              <RefreshCw size={13} />
              <span>Restaurar Valores</span>
            </Button>
            <Button
              variant="purple"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="rounded-xl px-3 py-1.5 small fw-bold d-flex align-items-center gap-1.5 text-white bg-purple-600 border-0"
            >
              <Plus size={14} />
              <span>Añadir Variable</span>
            </Button>
          </div>
        </div>
        <p className="text-muted smaller mb-4">Ajustá las variables de tu negocio para simular escenarios reales de reajustes tarifarios, contrataciones de coloristas o aperturas de sucursales en vivo.</p>

        <Row className="g-4">
          
          {/* COLUMNA IZQUIERDA: SLIDERS (VARIABLES ESTÁNDAR Y PERSONALIZADAS) */}
          <Col lg={6} className="border-end pe-lg-4">
            
            {/* Variables del Sistema */}
            <div className="mb-4">
              <h4 className="smaller text-muted fw-bold uppercase mb-3.5 d-flex align-items-center gap-2">
                <Coins size={15} className="text-purple-600" />
                <span>Variables del Sistema</span>
              </h4>
              
              <Form className="d-grid gap-3.5">
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
            </div>

            {/* Variables Personalizadas */}
            <div>
              <h4 className="smaller text-muted fw-bold uppercase mb-3.5 d-flex align-items-center justify-content-between">
                <span className="d-flex align-items-center gap-2">
                  <Plus size={15} className="text-pink-600" />
                  <span>Variables Personalizadas ({customVars.length})</span>
                </span>
              </h4>

              {customVars.length === 0 ? (
                <div className="p-3.5 border border-dashed rounded-2xl text-center text-muted smaller italic">
                  No has agregado variables personalizadas de simulación. Hacé clic en "Añadir Variable" arriba para configurar un nuevo factor.
                </div>
              ) : (
                <div className="d-grid gap-4 bg-light bg-opacity-35 p-3 rounded-2xl border">
                  {customVars.map((v) => {
                    const sliderVal = Number(v.currentVal || 0);
                    const isIncome = v.type === "income";
                    const isFixed = v.calcType === "fixed";
                    
                    // Cálculo de impacto visible
                    let impactLabel = "";
                    if (isFixed) {
                      impactLabel = `${currency(sliderVal * v.value)}`;
                    } else {
                      impactLabel = `+${(sliderVal * v.value).toFixed(1)}%`;
                    }

                    return (
                      <Form.Group key={v.id} className="border-bottom border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="d-flex justify-content-between align-items-center mb-1.5 small text-gray-700">
                          <div>
                            <span className="fw-semibold me-2">{v.name}</span>
                            <Badge bg={isIncome ? "success" : "danger"} className="text-white rounded-pill px-2 py-0.5 fw-bold uppercase text-xxs">
                              {isIncome ? "Ingreso" : "Gasto"}
                            </Badge>
                          </div>
                          <div className="d-flex align-items-center gap-2.5">
                            <span className="smaller text-muted">
                              ({sliderVal} {v.unit})
                            </span>
                            <span className={`fw-black ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
                              {isIncome ? "+" : "-"} {impactLabel}
                            </span>
                            <Button
                              variant="link"
                              onClick={() => handleDeleteCustomVar(v.id)}
                              className="text-muted hover:text-red-500 p-0 line-height-1"
                              title="Eliminar variable"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                        <Form.Range
                          min={v.min || 0}
                          max={v.max || 10}
                          step={v.step || 1}
                          value={sliderVal}
                          onChange={(e) => handleCustomValChange(v.id, e.target.value)}
                        />
                      </Form.Group>
                    );
                  })}
                </div>
              )}
            </div>

          </Col>

          {/* COLUMNA DERECHA: PROYECCIONES Y RIESGOS */}
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
                  <span>⚠️ <strong>Alerta Directiva:</strong> La simulación arroja un alto índice de riesgo. El aumento crítico de costos operativos o comisiones excesivas podrían sofocar la caja neta del negocio. Planificá reservas financieras extras.</span>
                )}
                {riskIndex > 35 && riskIndex <= 65 && (
                  <span>💡 Escenario con riesgo moderado. Incorporar nuevas variables incrementa la tracción, pero asegurate de validar que el volumen real de citas de clientes absorba los costos fijos extras.</span>
                )}
                {riskIndex <= 35 && (
                  <span>✅ Escenario de bajo riesgo. Los reajustes paulatinos de precios y las optimizaciones ligeras de costos garantizan un crecimiento estable del margen operativo.</span>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      {/* MODAL CREAR VARIABLE PERSONALIZADA */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered className="border-0 shadow-lg">
        <Modal.Header closeButton className="border-0 bg-light py-3.5 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: "16px" }}>
            <Plus size={18} className="text-purple-600" />
            <span>Configurar Nueva Variable de Simulación</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddCustomVar}>
          <Modal.Body className="p-4">
            
            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Nombre de la Variable *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Alquiler de Cabinas, Venta de Productos, Cafetería..."
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                className="border-gray-200 rounded-xl small"
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Tipo de Impacto *</Form.Label>
                  <Form.Select
                    value={newVarType}
                    onChange={(e) => setNewVarType(e.target.value)}
                    className="border-gray-200 rounded-xl small"
                  >
                    <option value="income">🟢 Ingreso Adicional</option>
                    <option value="expense">🔴 Gasto Adicional</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Tipo de Cálculo *</Form.Label>
                  <Form.Select
                    value={newVarCalcType}
                    onChange={(e) => setNewVarCalcType(e.target.value)}
                    className="border-gray-200 rounded-xl small"
                  >
                    <option value="fixed">Valor Fijo ($ ARS)</option>
                    <option value="percent">Porcentaje (%) sobre Base</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">
                    {newVarCalcType === "fixed" ? "Valor / Impacto ($ ARS) *" : "Porcentaje (%) por punto *"}
                  </Form.Label>
                  <InputGroup size="sm">
                    {newVarCalcType === "fixed" && <InputGroup.Text className="bg-transparent border-gray-200">$</InputGroup.Text>}
                    <Form.Control
                      type="number"
                      placeholder={newVarCalcType === "fixed" ? "15000" : "2.5"}
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      className="border-gray-200 rounded-xl small"
                      step={newVarCalcType === "fixed" ? "500" : "0.1"}
                      required
                    />
                    {newVarCalcType === "percent" && <InputGroup.Text className="bg-transparent border-gray-200">%</InputGroup.Text>}
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Rango Máximo del Slider *</Form.Label>
                  <Form.Control
                    type="number"
                    value={newVarMax}
                    onChange={(e) => setNewVarMax(e.target.value)}
                    placeholder="10"
                    className="border-gray-200 rounded-xl small"
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label className="smaller text-muted fw-bold">Unidad de Medida (Etiqueta)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: cabinas, campañas, meses, unidades..."
                value={newVarUnit}
                onChange={(e) => setNewVarUnit(e.target.value)}
                className="border-gray-200 rounded-xl small"
              />
            </Form.Group>

          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button
              variant="light"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl px-4 fw-bold text-xs"
              style={{ backgroundColor: "#ffffff", color: "#111827", border: "1px solid #d1d5db" }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="purple"
              className="rounded-xl px-5 fw-bold shadow border-0 text-white text-xs bg-purple-600"
            >
              Añadir Variable
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </Card>
  );
}
