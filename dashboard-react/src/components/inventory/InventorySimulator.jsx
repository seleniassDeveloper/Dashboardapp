import React, { useState, useMemo } from "react";
import { Row, Col, Card, Form, ProgressBar, Badge, Alert } from "react-bootstrap";
import { Sliders, DollarSign, Percent, AlertTriangle, TrendingUp, TrendingDown, CheckCircle, RefreshCw, Layers } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function InventorySimulator({ products = [], rules = [] }) {
  // Simulator inputs
  const [selectedProductId, setSelectedProductId] = useState("all");
  const [costVariation, setCostVariation] = useState(0); // -50% to +100%
  const [markupPercent, setMarkupPercent] = useState(100); // 0% to 300%
  const [wastagePercent, setWastagePercent] = useState(5); // 0% to 50%
  const [monthlyServices, setMonthlyServices] = useState(150); // 10 to 1000

  // Handle Preset Selection
  const applyPreset = (preset) => {
    switch (preset) {
      case "inflation":
        setCostVariation(35);
        setMarkupPercent(70);
        setWastagePercent(12);
        setMonthlyServices(130);
        break;
      case "efficiency":
        setCostVariation(-15);
        setMarkupPercent(150);
        setWastagePercent(2);
        setMonthlyServices(200);
        break;
      case "critical":
        setCostVariation(10);
        setMarkupPercent(40);
        setWastagePercent(25);
        setMonthlyServices(100);
        break;
      case "normal":
      default:
        setCostVariation(0);
        setMarkupPercent(100);
        setWastagePercent(5);
        setMonthlyServices(150);
        break;
    }
  };

  // Perform Calculations
  const stats = useMemo(() => {
    // 1. Determine base metrics
    let baseCost = 0;
    let basePrice = 0;
    let name = "Todos los Insumos (Promedio)";
    let unit = "u";

    if (selectedProductId === "all") {
      if (products.length > 0) {
        baseCost = products.reduce((sum, p) => sum + p.costPrice, 0) / products.length;
        basePrice = products.reduce((sum, p) => sum + (p.salePrice || p.costPrice * 2), 0) / products.length;
      } else {
        baseCost = 5000;
        basePrice = 10000;
      }
    } else {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        baseCost = prod.costPrice;
        basePrice = prod.salePrice || prod.costPrice * 2;
        name = prod.name;
        unit = prod.unit;
      }
    }

    // 2. Simulated values
    const simulatedCost = baseCost * (1 + costVariation / 100);
    const simulatedWastageLoss = simulatedCost * (wastagePercent / 100);
    const totalCostOfUse = simulatedCost + simulatedWastageLoss;
    
    // Selling price base can either be based on cost + markup or standard adjusted selling price
    const simulatedSellingPrice = simulatedCost * (1 + markupPercent / 100);
    
    const marginPerUnit = simulatedSellingPrice - totalCostOfUse;
    const marginPercent = simulatedSellingPrice > 0 ? (marginPerUnit / simulatedSellingPrice) * 100 : 0;
    
    // Monthly aggregates
    const baseMonthlySpend = baseCost * monthlyServices;
    const simulatedMonthlySpend = totalCostOfUse * monthlyServices;
    const simulatedMonthlyRevenue = simulatedSellingPrice * monthlyServices;
    const simulatedMonthlyProfit = simulatedMonthlyRevenue - simulatedMonthlySpend;
    const simulatedWastageCost = simulatedWastageLoss * monthlyServices;
    
    // ROI
    const roi = totalCostOfUse > 0 ? (marginPerUnit / totalCostOfUse) * 100 : 0;

    return {
      name,
      unit,
      baseCost,
      basePrice,
      simulatedCost,
      simulatedWastageLoss,
      totalCostOfUse,
      simulatedSellingPrice,
      marginPerUnit,
      marginPercent,
      baseMonthlySpend,
      simulatedMonthlySpend,
      simulatedMonthlyRevenue,
      simulatedMonthlyProfit,
      simulatedWastageCost,
      roi
    };
  }, [selectedProductId, costVariation, markupPercent, wastagePercent, monthlyServices, products]);

  // Determine Alert/Recommendation badge
  const recommendation = useMemo(() => {
    if (stats.roi < 30) {
      return {
        variant: "danger",
        title: "Rentabilidad Crítica",
        desc: "El margen actual no cubre el desperdicio operativo y la variación de costos. Se recomienda aumentar el markup o buscar proveedores con mejores costos.",
        icon: AlertTriangle
      };
    }
    if (stats.roi >= 30 && stats.roi < 80) {
      return {
        variant: "warning",
        title: "Rentabilidad Moderada",
        desc: "Tu margen es estable pero vulnerable. Reducir las mermas del actual " + wastagePercent + "% al menos del 5% incrementará significativamente tus retornos.",
        icon: AlertTriangle
      };
    }
    return {
      variant: "success",
      title: "Rentabilidad Altamente Saludable",
      desc: "Excelente configuración financiera. Los insumos se encuentran optimizados con una rentabilidad del " + Math.round(stats.roi) + "% por tratamiento.",
      icon: CheckCircle
    };
  }, [stats.roi, wastagePercent]);

  return (
    <div className="animate-fade-in">
      <Row className="g-4 mb-4">
        {/* LEFT PANEL: CONTROLS */}
        <Col lg={5}>
          <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Sliders className="text-purple-600 animate-pulse" size={20} />
              <h3 className="h6 fw-black text-gray-900 mb-0">Controles del Simulador Contable</h3>
            </div>
            <p className="text-muted smaller mb-4">
              Ajusta los parámetros financieros para ver proyecciones y estimar el impacto en la caja del salón en base a fluctuaciones del inventario.
            </p>

            <Form className="d-flex flex-column gap-3.5">
              {/* Product Selector */}
              <Form.Group>
                <Form.Label className="small fw-bold text-gray-700">Insumo a Simular</Form.Label>
                <Form.Select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="rounded-xl border-gray-200 small"
                >
                  <option value="all">Todos los Insumos (Promedio General)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Slider 1: Cost variation */}
              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5">
                  <Form.Label className="small fw-bold text-gray-700 mb-0">Costo de Insumos (Variación)</Form.Label>
                  <Badge bg={costVariation > 0 ? "danger-soft" : costVariation < 0 ? "success-soft" : "secondary-soft"} className={`px-2 py-1 rounded-pill ${costVariation > 0 ? "text-danger" : costVariation < 0 ? "text-success" : "text-secondary"}`}>
                    {costVariation > 0 ? `+${costVariation}% (Inflación)` : `${costVariation}%`}
                  </Badge>
                </div>
                <Form.Range 
                  min={-50} 
                  max={100} 
                  value={costVariation}
                  onChange={(e) => setCostVariation(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10px" }}>
                  <span>-50% Descuento</span>
                  <span>Normal</span>
                  <span>+100% Doble Costo</span>
                </div>
              </Form.Group>

              {/* Slider 2: Markup % */}
              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5">
                  <Form.Label className="small fw-bold text-gray-700 mb-0">Margen de Venta (Markup %)</Form.Label>
                  <Badge bg="purple-soft" className="text-purple-600 px-2 py-1 rounded-pill">
                    {markupPercent}%
                  </Badge>
                </div>
                <Form.Range 
                  min={0} 
                  max={300} 
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10px" }}>
                  <span>Al Costo (0%)</span>
                  <span>100% Margen</span>
                  <span>300% Premium</span>
                </div>
              </Form.Group>

              {/* Slider 3: Wastage/Losses % */}
              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5">
                  <Form.Label className="small fw-bold text-gray-700 mb-0">Porcentaje de Desperdicio (Mermas)</Form.Label>
                  <Badge bg={wastagePercent > 10 ? "danger-soft" : "warning-soft"} className={`px-2 py-1 rounded-pill ${wastagePercent > 10 ? "text-danger" : "text-warning"}`}>
                    {wastagePercent}% de merma
                  </Badge>
                </div>
                <Form.Range 
                  min={0} 
                  max={50} 
                  value={wastagePercent}
                  onChange={(e) => setWastagePercent(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10px" }}>
                  <span>0% Eficiencia</span>
                  <span>10% Normal</span>
                  <span>50% Mitad Desperdiciada</span>
                </div>
              </Form.Group>

              {/* Slider 4: Monthly volume */}
              <Form.Group>
                <div className="d-flex justify-content-between mb-1.5">
                  <Form.Label className="small fw-bold text-gray-700 mb-0">Volumen Mensual de Uso/Servicios</Form.Label>
                  <Badge bg="info-soft" className="text-info px-2 py-1 rounded-pill">
                    {monthlyServices} servicios/mes
                  </Badge>
                </div>
                <Form.Range 
                  min={10} 
                  max={1000} 
                  step={10}
                  value={monthlyServices}
                  onChange={(e) => setMonthlyServices(Number(e.target.value))}
                />
                <div className="d-flex justify-content-between text-muted" style={{ fontSize: "10px" }}>
                  <span>10 servicios</span>
                  <span>500 servicios</span>
                  <span>1000 servicios</span>
                </div>
              </Form.Group>
            </Form>

            {/* PRESET ESCENARIOS */}
            <div className="mt-4 pt-4 border-top">
              <span className="small fw-bold text-gray-800 d-block mb-2.5">Escenarios Predeterminados del ERP</span>
              <div className="d-flex flex-wrap gap-2">
                <button 
                  onClick={() => applyPreset("efficiency")}
                  className="btn btn-sm btn-outline-success rounded-xl px-2.5 py-1.5 small fw-semibold"
                  style={{ fontSize: "11px" }}
                >
                  ✨ Eficiencia Máxima
                </button>
                <button 
                  onClick={() => applyPreset("inflation")}
                  className="btn btn-sm btn-outline-danger rounded-xl px-2.5 py-1.5 small fw-semibold"
                  style={{ fontSize: "11px" }}
                >
                  📈 Inflación Extrema
                </button>
                <button 
                  onClick={() => applyPreset("critical")}
                  className="btn btn-sm btn-outline-warning rounded-xl px-2.5 py-1.5 small fw-semibold"
                  style={{ fontSize: "11px" }}
                >
                  ⚠️ Mermas Críticas
                </button>
                <button 
                  onClick={() => applyPreset("normal")}
                  className="btn btn-sm btn-outline-secondary rounded-xl px-2.5 py-1.5 small fw-semibold"
                  style={{ fontSize: "11px" }}
                >
                  🔄 Reset Valores
                </button>
              </div>
            </div>
          </Card>
        </Col>

        {/* RIGHT PANEL: SIMULATION RESULTS */}
        <Col lg={7}>
          <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl h-100 d-flex flex-column justify-content-between">
            <div>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h3 className="h6 fw-black text-gray-900 mb-0.5">Resultados Proyectados</h3>
                  <span className="smaller text-purple-600 fw-bold">{stats.name}</span>
                </div>
                <span className="smaller text-muted d-flex align-items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Neon Real-time Sync
                </span>
              </div>

              {/* Dynamic Metrics Cards */}
              <Row className="g-3 mb-4">
                {/* Cost per use */}
                <Col sm={6}>
                  <div className="p-3 bg-light rounded-2xl border">
                    <span className="smaller text-muted d-block mb-1">Costo Total de Uso (c/ Merma)</span>
                    <h5 className="fw-black text-gray-900 mb-0.5">
                      {currency(stats.totalCostOfUse)}
                    </h5>
                    <span className="smaller text-muted">
                      Base: {currency(stats.baseCost)} • Merma: {currency(stats.simulatedWastageLoss)}
                    </span>
                  </div>
                </Col>

                {/* Simulated selling price */}
                <Col sm={6}>
                  <div className="p-3 bg-light rounded-2xl border">
                    <span className="smaller text-muted d-block mb-1">Precio Venta Recomendado</span>
                    <h5 className="fw-black text-purple-700 mb-0.5">
                      {currency(stats.simulatedSellingPrice)}
                    </h5>
                    <span className="smaller text-muted">
                      Alineado al {markupPercent}% de Markup
                    </span>
                  </div>
                </Col>
              </Row>

              {/* Profitability progress / ROI */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small fw-bold text-gray-800">Retorno Neto (ROI) por Unidad</span>
                  <span className={`small fw-black ${stats.roi > 80 ? "text-success" : stats.roi > 30 ? "text-warning" : "text-danger"}`}>
                    {Math.round(stats.roi)}% Retorno
                  </span>
                </div>
                <ProgressBar 
                  now={Math.min(100, Math.max(0, stats.roi))} 
                  variant={stats.roi > 80 ? "success" : stats.roi > 30 ? "warning" : "danger"} 
                  className="rounded-pill" 
                  style={{ height: "8px" }}
                />
                <div className="d-flex justify-content-between text-muted smaller mt-1.5">
                  <span>Costo Unitario: {currency(stats.totalCostOfUse)}</span>
                  <span>Margen Unitario: {currency(stats.marginPerUnit)}</span>
                </div>
              </div>

              {/* Proyecciones Mensuales */}
              <div className="p-3 bg-purple bg-opacity-5 rounded-2xl border border-purple-100 mb-4">
                <span className="small fw-bold text-purple-900 d-block mb-3">
                  Proyecciones Mensuales en Base a Volumen ({monthlyServices} Serv/Mes)
                </span>
                
                <Row className="g-2 text-center">
                  <Col xs={4}>
                    <div className="border-end py-1">
                      <span className="smaller text-muted d-block mb-1">Gasto en Insumos</span>
                      <strong className="text-gray-800 small-title-override" style={{ fontSize: "14px" }}>
                        {currency(stats.simulatedMonthlySpend)}
                      </strong>
                    </div>
                  </Col>
                  
                  <Col xs={4}>
                    <div className="border-end py-1">
                      <span className="smaller text-muted d-block mb-1">Pérdida Mermas</span>
                      <strong className="text-danger small-title-override" style={{ fontSize: "14px" }}>
                        {currency(stats.simulatedWastageCost)}
                      </strong>
                    </div>
                  </Col>

                  <Col xs={4}>
                    <div className="py-1">
                      <span className="smaller text-muted d-block mb-1">Ganancia Estimada</span>
                      <strong className="text-success small-title-override" style={{ fontSize: "14px" }}>
                        {currency(stats.simulatedMonthlyProfit)}
                      </strong>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Aura Recommendations Notification */}
            <div>
              <Alert variant={recommendation.variant} className="rounded-xl border-0 m-0 shadow-sm d-flex gap-3 align-items-start p-3.5">
                <recommendation.icon className={`flex-shrink-0 ${recommendation.variant === "danger" ? "text-danger animate-bounce" : recommendation.variant === "warning" ? "text-warning animate-pulse" : "text-success"}`} size={20} />
                <div>
                  <div className="fw-bold small mb-1">{recommendation.title}</div>
                  <div className="smaller text-muted">{recommendation.desc}</div>
                </div>
              </Alert>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
