import React, { useState, useMemo } from "react";
import { Row, Col, Card, Badge, Offcanvas, ListGroup, Form, Alert } from "react-bootstrap";
import { Package, AlertTriangle, DollarSign, TrendingUp, Sparkles, X, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#7c3aed", "#10b981", "#3b82f6", "#ec4899", "#f59e0b", "#06b6d4"];

function currency(n) {
  const num = Number(n);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}

function safeFormatDate(dateVal) {
  if (!dateVal) return "Fecha no registrada";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "Fecha inválida";
  return d.toLocaleDateString("es-AR");
}

export default function InventoryDashboard({ summary = {}, products = [], movements = [], onTabChange }) {
  const [selectedKPI, setSelectedKPI] = useState(null); // 'lowStock' | 'value' | 'catalog' | 'spend' | 'mostUsed'
  const [drawerFilter, setDrawerFilter] = useState("");

  const handleCloseDrawer = () => {
    setSelectedKPI(null);
    setDrawerFilter("");
  };

  // Safe pre-calculations for drawer content
  const lowStockProducts = useMemo(() => {
    return (products || []).filter(p => p && typeof p.stock === "number" && typeof p.minStock === "number" && p.stock < p.minStock);
  }, [products]);
  
  const productsWithValue = useMemo(() => {
    return (products || [])
      .filter(p => p !== null && p !== undefined)
      .map(p => ({ ...p, totalVal: (p.stock || 0) * (p.costPrice || 0) }))
      .sort((a, b) => b.totalVal - a.totalVal);
  }, [products]);

  const categoryBreakdown = useMemo(() => {
    const map = (products || [])
      .filter(p => p !== null && p !== undefined)
      .reduce((acc, p) => {
        const cat = p.category || "General";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  }, [products]);

  const recentAutomaticMovements = useMemo(() => {
    return (movements || [])
      .filter(m => m && (m.type === "automatic" || m.type === "output"))
      .slice(0, 15);
  }, [movements]);

  // Chart data
  const stockChartData = useMemo(() => {
    return (products || [])
      .filter(p => p && p.name)
      .slice(0, 8)
      .map(p => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
        stock: p.stock || 0,
        minStock: p.minStock || 0
      }));
  }, [products]);

  // Filtered lists for the drawer
  const filteredDrawerItems = useMemo(() => {
    const q = (drawerFilter || "").toLowerCase().trim();
    if (selectedKPI === "lowStock") {
      return lowStockProducts.filter(p => p && (p.name || "").toLowerCase().includes(q));
    }
    if (selectedKPI === "value") {
      return productsWithValue.filter(p => p && (p.name || "").toLowerCase().includes(q));
    }
    if (selectedKPI === "catalog") {
      return (products || []).filter(p => p && (p.name || "").toLowerCase().includes(q));
    }
    return [];
  }, [selectedKPI, drawerFilter, lowStockProducts, productsWithValue, products]);

  // Safe checks for summary fields
  const safeSummary = useMemo(() => {
    return {
      lowStockCount: typeof summary?.lowStockCount === "number" ? summary.lowStockCount : 0,
      totalValue: typeof summary?.totalValue === "number" ? summary.totalValue : 0,
      totalUnique: typeof summary?.totalUnique === "number" ? summary.totalUnique : 0,
      estimatedMonthlySpend: typeof summary?.estimatedMonthlySpend === "number" ? summary.estimatedMonthlySpend : 0,
      mostConsumed: summary?.mostConsumed || "Sin registros",
      costliestService: summary?.costliestService || "Sin registrar"
    };
  }, [summary]);

  return (
    <div className="animate-fade-in">
      {/* 5 STANDALONE COMPACT KPIS (STATIC) */}
      <Row className="g-3 mb-4">
        {/* KPI 1: Stock Crítico */}
        <Col className="flex-grow-1" style={{ minWidth: "200px" }}>
          <div 
            className="p-3 bg-white border rounded-2xl shadow-sm d-flex align-items-center gap-3 h-100 position-relative overflow-hidden hover-scale transition-all"
            style={{ borderColor: "rgba(239, 68, 68, 0.15)", cursor: "pointer" }}
            onClick={() => setSelectedKPI("lowStock")}
          >
            <div className="p-2.5 rounded-xl bg-red-50 text-red-500 d-flex align-items-center justify-content-center">
              <AlertTriangle size={20} className={safeSummary.lowStockCount > 0 ? "animate-pulse" : ""} />
            </div>
            <div>
              <span className="smaller text-muted d-block fw-bold mb-0.5">Stock Crítico</span>
              <h4 className="fw-black m-0 d-flex align-items-center gap-1.5" style={{ fontSize: "20px" }}>
                <span className={safeSummary.lowStockCount > 0 ? "text-danger" : "text-gray-900"}>{safeSummary.lowStockCount}</span>
                {safeSummary.lowStockCount > 0 && (
                  <Badge bg="danger-soft" className="text-danger rounded-pill px-2 py-0.5" style={{ fontSize: "9px" }}>¡Reponer!</Badge>
                )}
              </h4>
            </div>
          </div>
        </Col>

        {/* KPI 2: Valuación Total */}
        <Col className="flex-grow-1" style={{ minWidth: "200px" }}>
          <div 
            className="p-3 bg-white border rounded-2xl shadow-sm d-flex align-items-center gap-3 h-100 position-relative overflow-hidden hover-scale transition-all"
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedKPI("value")}
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 d-flex align-items-center justify-content-center">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="smaller text-muted d-block fw-bold mb-0.5">Valor del Inventario</span>
              <h4 className="fw-black text-emerald-600 m-0" style={{ fontSize: "20px" }}>{currency(safeSummary.totalValue)}</h4>
            </div>
          </div>
        </Col>

        {/* KPI 3: Cantidad Insumos */}
        <Col className="flex-grow-1" style={{ minWidth: "200px" }}>
          <div 
            className="p-3 bg-white border rounded-2xl shadow-sm d-flex align-items-center gap-3 h-100 position-relative overflow-hidden hover-scale transition-all"
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedKPI("catalog")}
          >
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 d-flex align-items-center justify-content-center">
              <Package size={20} />
            </div>
            <div>
              <span className="smaller text-muted d-block fw-bold mb-0.5">Cantidad de Productos</span>
              <h4 className="fw-black text-gray-900 m-0" style={{ fontSize: "20px" }}>{safeSummary.totalUnique} ítems</h4>
            </div>
          </div>
        </Col>

        {/* KPI 4: Consumo Estimado */}
        <Col className="flex-grow-1" style={{ minWidth: "200px" }}>
          <div 
            className="p-3 bg-white border rounded-2xl shadow-sm d-flex align-items-center gap-3 h-100 position-relative overflow-hidden hover-scale transition-all"
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedKPI("spend")}
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 d-flex align-items-center justify-content-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="smaller text-muted d-block fw-bold mb-0.5">Consumo Mensual</span>
              <h4 className="fw-black text-purple-700 m-0" style={{ fontSize: "20px" }}>{currency(safeSummary.estimatedMonthlySpend)}</h4>
            </div>
          </div>
        </Col>

        {/* KPI 5: Más Utilizado */}
        <Col className="flex-grow-1" style={{ minWidth: "200px" }}>
          <div 
            className="p-3 bg-white border rounded-2xl shadow-sm d-flex align-items-center gap-3 h-100 position-relative overflow-hidden hover-scale transition-all"
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedKPI("mostUsed")}
          >
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 d-flex align-items-center justify-content-center">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="smaller text-muted d-block fw-bold mb-0.5">Más Utilizado</span>
              <h4 className="fw-black text-gray-800 m-0 text-truncate" style={{ fontSize: "15px", maxWidth: "160px", marginTop: "4px" }} title={safeSummary.mostConsumed}>
                {safeSummary.mostConsumed}
              </h4>
            </div>
          </div>
        </Col>
      </Row>

      {/* CHARTS SECTION */}
      <Row className="g-4">
        {/* Nivel de Stock vs Stock Mínimo */}
        <Col lg={8}>
          <Card className="card-premium border shadow-sm bg-white rounded-2xl">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-4">Niveles de Existencias vs Stock Mínimo de Alerta</h3>
              {stockChartData.length === 0 ? (
                <div className="text-center py-5 text-muted small">Cargando catálogo...</div>
              ) : (
                <div style={{ width: "100%", height: "280px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="stock" name="Stock Actual" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={22} />
                      <Bar dataKey="minStock" name="Stock Mínimo" fill="#f87171" radius={[4, 4, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Distribución por Categoría */}
        <Col lg={4}>
          <Card className="card-premium border shadow-sm bg-white rounded-2xl h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <h3 className="h6 fw-black text-gray-900 mb-1">Distribución de Insumos</h3>
                <p className="text-muted smaller mb-3">Participación de productos en catálogo por rubro.</p>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-5 text-muted small">Sin datos de inventario.</div>
              ) : (
                <div style={{ width: "100%", height: "150px" }} className="my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="small d-grid gap-1 mt-2">
                {categoryBreakdown.map((item, idx) => (
                  <div key={item.name} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="rounded-circle" style={{ width: 8, height: 8, background: COLORS[idx % COLORS.length] }} />
                      <span className="text-muted smaller">{item.name}</span>
                    </div>
                    <span className="fw-bold text-gray-800 smaller">{item.value} artículos</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* DETAILED INTERACTIVE DRAWER (OFFCANVAS) */}
      <Offcanvas 
        show={!!selectedKPI} 
        onHide={handleCloseDrawer} 
        placement="end" 
        style={{ width: "420px" }} 
        className="border-0 shadow-lg bg-white"
      >
        <Offcanvas.Header className="p-4 border-bottom bg-light bg-opacity-40 d-flex justify-content-between align-items-center">
          <div>
            <Offcanvas.Title className="fw-black h6 text-gray-900 m-0">
              {selectedKPI === "lowStock" && "Alerta: Stock Mínimo Crítico"}
              {selectedKPI === "value" && "Valuación Contable de Almacén"}
              {selectedKPI === "catalog" && "Resumen de Catálogo"}
              {selectedKPI === "spend" && "Detalles de Consumo Estimado"}
              {selectedKPI === "mostUsed" && "Historial de Insumo Más Utilizado"}
            </Offcanvas.Title>
            <span className="smaller text-muted">Centro de Control Financiero / ERP</span>
          </div>
          <button onClick={handleCloseDrawer} className="p-1 bg-light border-0 rounded-circle text-secondary hover-text-gray-950 transition-all">
            <X size={18} />
          </button>
        </Offcanvas.Header>

        <Offcanvas.Body className="p-4 d-flex flex-column justify-content-between">
          <div className="flex-grow-1 overflow-auto">
            {/* Search Input for List KPIs */}
            {(selectedKPI === "lowStock" || selectedKPI === "value" || selectedKPI === "catalog") && (
              <div className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Buscar insumo..."
                  value={drawerFilter}
                  onChange={(e) => setDrawerFilter(e.target.value)}
                  className="border-gray-200 rounded-xl small"
                />
              </div>
            )}

            {/* Content for: Stock Crítico */}
            {selectedKPI === "lowStock" && (
              <div>
                <Alert variant="danger" className="rounded-xl border-0 py-2.5 smaller mb-3">
                  <div className="fw-bold">Abastecimiento Comprometido</div>
                  Estos artículos se encuentran por debajo del stock de seguridad preestablecido.
                </Alert>
                <ListGroup variant="flush" className="gap-2">
                  {filteredDrawerItems.map(p => (
                    <ListGroup.Item key={p.id} className="p-3 border rounded-xl bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-gray-900 small d-block">{p.name || "Insumo sin nombre"}</strong>
                        <span className="smaller text-muted">Stock actual: <strong className="text-danger">{p.stock ?? 0}</strong> / Límite: {p.minStock ?? 0} {p.unit || "unidad"}</span>
                      </div>
                      <Badge bg="danger-soft" className="text-danger rounded-pill px-2.5 py-1 fw-bold smaller">CRÍTICO</Badge>
                    </ListGroup.Item>
                  ))}
                  {filteredDrawerItems.length === 0 && (
                    <div className="text-center py-5 text-muted smaller">No se encontraron insumos críticos.</div>
                  )}
                </ListGroup>
              </div>
            )}

            {/* Content for: Valor del Inventario */}
            {selectedKPI === "value" && (
              <div>
                <div className="p-3 bg-emerald-50 text-emerald-950 rounded-2xl mb-4 border border-emerald-100 d-flex align-items-center justify-content-between">
                  <span className="fw-bold small">Capital Inmovilizado Total:</span>
                  <span className="fw-black h5 m-0 text-emerald-700">{currency(safeSummary.totalValue)}</span>
                </div>
                <h5 className="smaller fw-bold text-muted uppercase tracking-wider mb-2">Contribución de Productos</h5>
                <ListGroup variant="flush" className="gap-2">
                  {filteredDrawerItems.map(p => (
                    <ListGroup.Item key={p.id} className="p-3 border rounded-xl bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-gray-900 small d-block">{p.name || "Insumo sin nombre"}</strong>
                        <span className="smaller text-muted">{p.stock ?? 0} {p.unit || "unidad"} x {currency(p.costPrice)} c/u</span>
                      </div>
                      <span className="fw-black text-gray-900 small">{currency(p.totalVal)}</span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Content for: Cantidad de Productos */}
            {selectedKPI === "catalog" && (
              <div>
                <div className="d-grid grid-cols-2 gap-2 mb-4">
                  {categoryBreakdown.map(cat => (
                    <div key={cat.name} className="p-2.5 bg-light border rounded-xl text-center">
                      <span className="text-muted smaller d-block mb-0.5">{cat.name}</span>
                      <strong className="text-gray-900 small">{cat.value} productos</strong>
                    </div>
                  ))}
                </div>
                <h5 className="smaller fw-bold text-muted uppercase tracking-wider mb-2">Artículos en Catálogo</h5>
                <ListGroup variant="flush" className="gap-2">
                  {filteredDrawerItems.map(p => (
                    <ListGroup.Item key={p.id} className="p-3 border rounded-xl bg-light bg-opacity-50 d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-gray-900 small d-block">{p.name || "Insumo sin nombre"}</strong>
                        <span className="smaller text-muted">Ubicación: {p.location || "Sin especificar"}</span>
                      </div>
                      <Badge bg="light" className="text-secondary border rounded-pill px-2.5">{p.category || "General"}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            {/* Content for: Consumo Mensual */}
            {selectedKPI === "spend" && (
              <div>
                <Alert variant="info" className="rounded-xl border-0 py-2.5 smaller mb-4">
                  Costo de insumos estimado basado en el total de citas finalizadas registradas en Neon Cloud DB.
                </Alert>
                <div className="p-3 bg-purple-50 text-purple-950 rounded-2xl mb-4 border border-purple-100 d-flex align-items-center justify-content-between">
                  <span className="fw-bold small">Costo Mensual Estimado:</span>
                  <span className="fw-black h5 m-0 text-purple-700">{currency(safeSummary.estimatedMonthlySpend)}</span>
                </div>
                <h5 className="smaller fw-bold text-muted uppercase tracking-wider mb-2">Descuentos de Existencias Recientes</h5>
                <ListGroup variant="flush" className="gap-2">
                  {recentAutomaticMovements.map(m => (
                    <ListGroup.Item key={m.id} className="p-3 border rounded-xl bg-light bg-opacity-50 d-flex align-items-center justify-content-between">
                      <div>
                        <strong className="text-gray-900 small d-block">{m.product?.name || "Insumo"}</strong>
                        <span className="smaller text-muted">{safeFormatDate(m.createdAt)} • {m.reason || "Consumo automático"}</span>
                      </div>
                      <span className="fw-bold text-danger small">-{Math.abs(m.diff || 0)} {m.product?.unit || "unidad"}s</span>
                    </ListGroup.Item>
                  ))}
                  {recentAutomaticMovements.length === 0 && (
                    <div className="text-center py-5 text-muted smaller">No se registran consumos recientes.</div>
                  )}
                </ListGroup>
              </div>
            )}

            {/* Content for: Más Utilizado */}
            {selectedKPI === "mostUsed" && (
              <div>
                <div className="p-4 bg-amber-50 rounded-2xl mb-4 border border-amber-100 text-center">
                  <span className="text-amber-800 smaller block mb-1 uppercase font-semibold">Insumo de Mayor Consumo</span>
                  <h4 className="fw-black text-gray-900 mb-1">{safeSummary.mostConsumed}</h4>
                  <p className="text-muted smaller mb-0">Este insumo presenta el mayor número de deducciones contables automáticas por citas este mes.</p>
                </div>
                <h5 className="smaller fw-bold text-muted uppercase tracking-wider mb-2">Detalles Técnicos</h5>
                <div className="p-3 bg-light rounded-xl border small">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Servicio asociado principal:</span>
                    <strong className="text-gray-900">{safeSummary.costliestService}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Fórmula estándar:</span>
                    <strong className="text-gray-900">Descuento automático por cita</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direct Actions at footer of the drawer */}
          <div className="border-top pt-3.5 mt-3 d-grid gap-2">
            <button 
              onClick={() => { handleCloseDrawer(); onTabChange("productos"); }}
              className="btn btn-purple w-100 rounded-xl py-2.5 text-white bg-purple-600 hover-bg-purple-700 border-0 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
            >
              <span>Ver Catálogo de Stock</span>
            </button>
            <button 
              onClick={handleCloseDrawer} 
              className="btn btn-light w-100 rounded-xl py-2.5 text-gray-800 bg-white border fw-bold"
            >
              Cerrar Detalle
            </button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
