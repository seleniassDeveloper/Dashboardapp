// src/components/finance/mobile/SimuladorScreen.jsx
import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw, Trash2, Plus } from "lucide-react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const SEED_CUSTOM_VARS = [
  {
    id: "c1",
    name: "Alquiler de Cabina de Estética",
    type: "income",
    calcType: "fixed",
    value: 15000,
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

export default function SimuladorScreen({ baseRevenue = 2450000, baseExpenses = 620000 }) {
  const [priceIncrease, setPriceIncrease] = useState(10);
  const [expenseReduction, setExpenseReduction] = useState(5);
  const [newStylists, setNewStylists] = useState(2);
  const [newBranches, setNewBranches] = useState(1);
  const [stylistCommission, setStylistCommission] = useState(40);

  const [customVars, setCustomVars] = useState(() => {
    const stored = localStorage.getItem("auradash_custom_simulation_variables");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error parsing custom variables:", e);
      }
    }
    return SEED_CUSTOM_VARS;
  });

  const safeCustomVars = useMemo(() => {
    return Array.isArray(customVars) ? customVars : [];
  }, [customVars]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarType, setNewVarType] = useState("income");
  const [newVarCalcType, setNewVarCalcType] = useState("fixed");
  const [newVarValue, setNewVarValue] = useState("");
  const [newVarMax, setNewVarMax] = useState("10");
  const [newVarUnit, setNewVarUnit] = useState("unidades");

  useEffect(() => {
    localStorage.setItem("auradash_custom_simulation_variables", JSON.stringify(safeCustomVars));
  }, [safeCustomVars]);

  const handleCustomValChange = (id, val) => {
    setCustomVars(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return prevArr.map(v => v.id === id ? { ...v, currentVal: Number(val) } : v);
    });
  };

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
      step: 1,
      unit: newVarUnit.trim() || "unidades",
      currentVal: 0
    };

    setCustomVars(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return [...prevArr, newVar];
    });
    setNewVarName("");
    setNewVarType("income");
    setNewVarCalcType("fixed");
    setNewVarValue("");
    setNewVarMax("10");
    setNewVarUnit("unidades");
    setShowAddModal(false);
  };

  const handleDeleteCustomVar = (id) => {
    setCustomVars(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      return prevArr.filter(v => v.id !== id);
    });
  };

  const handleReset = () => {
    setPriceIncrease(10);
    setExpenseReduction(5);
    setNewStylists(2);
    setNewBranches(1);
    setStylistCommission(40);
    setCustomVars(SEED_CUSTOM_VARS.map(v => ({ ...v, currentVal: 0 })));
  };

  // Calculations
  const safeBaseRevenue = Number(baseRevenue) || 0;
  const safeBaseExpenses = Number(baseExpenses) || 0;

  const revenueAfterPriceIncrease = safeBaseRevenue * (1 + priceIncrease / 100);
  const stylistHiringRevenue = newStylists * 25000;
  const branchOpeningRevenue = newBranches * 120000;

  let customRevenueAddition = 0;
  let customExpenseAddition = 0;

  safeCustomVars.forEach(v => {
    const sliderVal = Number(v.currentVal || 0);
    const impactVal = Number(v.value || 0);

    if (v.type === "income") {
      if (v.calcType === "fixed") {
        customRevenueAddition += sliderVal * impactVal;
      } else {
        customRevenueAddition += safeBaseRevenue * (sliderVal * impactVal / 100);
      }
    } else if (v.type === "expense") {
      if (v.calcType === "fixed") {
        customExpenseAddition += sliderVal * impactVal;
      } else {
        customExpenseAddition += safeBaseExpenses * (sliderVal * impactVal / 100);
      }
    }
  });

  const totalProjectedRevenue = revenueAfterPriceIncrease + stylistHiringRevenue + branchOpeningRevenue + customRevenueAddition;

  const expensesAfterReduction = safeBaseExpenses * (1 - expenseReduction / 100);
  const stylistHiringCost = newStylists * 45000;
  const branchOpeningCost = newBranches * 85000;

  const totalProjectedExpenses = expensesAfterReduction + stylistHiringCost + branchOpeningCost + customExpenseAddition;

  const projectedCommissions = Math.round(totalProjectedRevenue * (stylistCommission / 100));
  const projectedNetProfit = totalProjectedRevenue - totalProjectedExpenses - projectedCommissions;
  const projectedMargin = totalProjectedRevenue > 0 ? Math.round((projectedNetProfit / totalProjectedRevenue) * 100) : 0;

  // Risk rating
  const riskLabel = useMemo(() => {
    let riskIndex = 15;
    if (newBranches > 0) riskIndex += newBranches * 25;
    if (newStylists > 2) riskIndex += 15;
    if (stylistCommission > 45) riskIndex += 15;
    if (priceIncrease > 25) riskIndex += 20;

    safeCustomVars.forEach(v => {
      if (v.type === "expense" && v.currentVal > 0) {
        riskIndex += Math.min(25, v.currentVal * 6);
      }
    });

    if (totalProjectedRevenue > 0) {
      const expensesRatio = (totalProjectedExpenses + projectedCommissions) / totalProjectedRevenue;
      if (expensesRatio > 0.95) riskIndex += 35;
      else if (expensesRatio > 0.8) riskIndex += 15;
    }

    if (projectedNetProfit < 0) riskIndex = Math.max(riskIndex, 90);
    riskIndex = Math.min(100, riskIndex);

    if (riskIndex > 65) return "crit";
    if (riskIndex > 35) return "mod";
    return "low";
  }, [priceIncrease, expenseReduction, newStylists, newBranches, stylistCommission, safeCustomVars, totalProjectedRevenue, totalProjectedExpenses, projectedCommissions, projectedNetProfit]);

  return (
    <div className="animate-fade-in pt-3">
      {/* Reset button at top */}
      <div className="d-flex justify-content-between align-items-center px-3 mb-2">
        <div className="small text-muted">Escenario Base: Normal</div>
        <button className="btn btn-sm text-purple-600 p-0 d-flex align-items-center gap-1" onClick={handleReset}>
          <RefreshCw size={14} />
          <span>Resetear</span>
        </button>
      </div>

      {/* Sliders section */}
      <div className="f-card f-sliders m-3 mt-1 bg-white">
        <div className="f-slider">
          <div className="f-slider__head">
            <span>Aumento de tarifas</span>
            <b>+{priceIncrease}%</b>
          </div>
          <input 
            type="range" 
            min="0" 
            max="50" 
            step="5" 
            value={priceIncrease} 
            onChange={(e) => setPriceIncrease(Number(e.target.value))} 
          />
        </div>

        <div className="f-slider">
          <div className="f-slider__head">
            <span>Reducción de costos</span>
            <b>-{expenseReduction}%</b>
          </div>
          <input 
            type="range" 
            min="0" 
            max="30" 
            step="2.5" 
            value={expenseReduction} 
            onChange={(e) => setExpenseReduction(Number(e.target.value))} 
          />
        </div>

        <div className="f-slider">
          <div className="f-slider__head">
            <span>Nuevos estilistas</span>
            <b>{newStylists}</b>
          </div>
          <input 
            type="range" 
            min="0" 
            max="5" 
            step="1" 
            value={newStylists} 
            onChange={(e) => setNewStylists(Number(e.target.value))} 
          />
        </div>

        <div className="f-slider">
          <div className="f-slider__head">
            <span>Abrir sucursales</span>
            <b>{newBranches}</b>
          </div>
          <input 
            type="range" 
            min="0" 
            max="3" 
            step="1" 
            value={newBranches} 
            onChange={(e) => setNewBranches(Number(e.target.value))} 
          />
        </div>

        <div className="f-slider border-0 pb-0">
          <div className="f-slider__head">
            <span>% de comisión</span>
            <b>{stylistCommission}%</b>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5" 
            value={stylistCommission} 
            onChange={(e) => setStylistCommission(Number(e.target.value))} 
          />
        </div>
      </div>

      {/* Custom Variables */}
      {safeCustomVars.length > 0 && (
        <div className="f-card m-3 bg-white">
          <h5 className="fw-bold mb-3 small text-muted uppercase">Variables Personalizadas</h5>
          {safeCustomVars.map(v => (
            <div className="f-slider mb-3" key={v.id}>
              <div className="f-slider__head">
                <span className="d-flex align-items-center gap-1.5 text-truncate" style={{ maxWidth: "160px" }}>
                  <button className="btn p-0 border-0 text-danger" onClick={() => handleDeleteCustomVar(v.id)}>
                    <Trash2 size={13} />
                  </button>
                  {v.name}
                </span>
                <b>{v.currentVal} {v.unit}</b>
              </div>
              <input 
                type="range" 
                min={v.min} 
                max={v.max} 
                step={v.step} 
                value={v.currentVal} 
                onChange={(e) => handleCustomValChange(v.id, e.target.value)} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Button to add custom variable */}
      <div className="px-3">
        <button 
          className="btn btn-outline-purple w-100 rounded-xl py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
          onClick={() => setShowAddModal(true)}
          style={{ borderStyle: "dashed" }}
        >
          <Plus size={16} /> Añadir Variable Personalizada
        </button>
      </div>

      {/* Projections Card */}
      <div className="f-card f-proj m-3 bg-white">
        <h5 className="fw-bold mb-2 small text-muted uppercase">Proyección del escenario</h5>
        
        <div className="f-line">
          <span>Ingresos proyectados</span>
          <b className="pos">{currency(totalProjectedRevenue)}</b>
        </div>
        
        <div className="f-line">
          <span>Gastos proyectados</span>
          <b className="text-danger">-{currency(totalProjectedExpenses)}</b>
        </div>
        
        <div className="f-line">
          <span>Comisiones estimadas</span>
          <b className="text-danger">-{currency(projectedCommissions)}</b>
        </div>
        
        <div className="f-line border-top pt-2">
          <span>Ganancia neta</span>
          <b className={projectedNetProfit >= 0 ? "pos" : "text-danger"}>
            {currency(projectedNetProfit)}
          </b>
        </div>
        
        <div className="f-line border-0 pb-0">
          <span>Margen neto</span>
          <b className={projectedMargin >= 0 ? "text-success" : "text-danger"}>{projectedMargin}%</b>
        </div>
      </div>

      {/* Risk flag */}
      <div className={`f-risk is-${riskLabel === "low" ? "low" : riskLabel === "mod" ? "mod" : "crit"}`}>
        <span>Riesgo del escenario</span>
        <b className="uppercase">
          {riskLabel === "low" ? "Bajo" : riskLabel === "mod" ? "Moderado" : "Crítico"}
        </b>
      </div>

      {/* ADD CUSTOM VARIABLE MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Nueva Variable</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddCustomVar}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">Nombre de variable *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Ej. Alquiler de Cabinas, Marketing..." 
                value={newVarName} 
                onChange={(e) => setNewVarName(e.target.value)} 
                required 
              />
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small text-muted fw-bold">Tipo *</Form.Label>
                  <Form.Select value={newVarType} onChange={(e) => setNewVarType(e.target.value)}>
                    <option value="income">Ingreso (+)</option>
                    <option value="expense">Egreso (-)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small text-muted fw-bold">Cálculo *</Form.Label>
                  <Form.Select value={newVarCalcType} onChange={(e) => setNewVarCalcType(e.target.value)}>
                    <option value="fixed">Fijo</option>
                    <option value="percent">Porcentual %</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-2 mb-2">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small text-muted fw-bold">Impacto unitario *</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Ej. 15000 o 5" 
                    value={newVarValue} 
                    onChange={(e) => setNewVarValue(e.target.value)} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small text-muted fw-bold">Límite máximo</Form.Label>
                  <Form.Control type="number" value={newVarMax} onChange={(e) => setNewVarMax(e.target.value)} />
                </Form.Group>
              </Col>
              <Col xs={12} className="mt-2">
                <Form.Group>
                  <Form.Label className="small text-muted fw-bold">Nombre de unidad</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Ej. cabinas, campañas, estilistas..." 
                    value={newVarUnit} 
                    onChange={(e) => setNewVarUnit(e.target.value)} 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button type="submit" variant="purple">Añadir</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
