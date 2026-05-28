import React from "react";
import { Row, Col, Card, Badge, Alert, ListGroup, ProgressBar } from "react-bootstrap";
import { Package, AlertTriangle, DollarSign, Activity, Calendar, ShoppingCart, TrendingUp, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#8b5cf6", "#10b981", "#3b82f6", "#ec4899", "#f59e0b", "#06b6d4"];

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function InventoryDashboard({ summary = {}, expiringSoon = [], products = [], onTabChange }) {
  // Prep categories chart data
  const categoryMap = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.keys(categoryMap).map(name => ({
    name,
    value: categoryMap[name]
  }));

  // Prep stock levels chart data (Top 7 items)
  const stockData = products
    .slice(0, 7)
    .map(p => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
      stock: p.stock,
      minStock: p.minStock
    }));

  return (
    <div className="animate-fade-in">
      {/* METRIC CARDS GRID */}
      <Row className="g-4 mb-4">
        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-xl d-flex align-items-center justify-content-center">
                <AlertTriangle size={24} className="animate-pulse" />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Bajo Stock Crítico</span>
                <h4 className="fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
                  <span className={summary.lowStockCount > 0 ? "text-danger" : "text-gray-800"}>
                    {summary.lowStockCount}
                  </span>
                  {summary.lowStockCount > 0 && (
                    <Badge bg="danger" className="rounded-pill px-2.5 py-0.5" style={{ fontSize: "10px" }}>Urgente</Badge>
                  )}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-xl d-flex align-items-center justify-content-center">
                <DollarSign size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Valuación del Inventario</span>
                <h4 className="fw-black text-success mb-0">{currency(summary.totalValue)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-purple bg-opacity-10 text-purple-600 rounded-xl d-flex align-items-center justify-content-center">
                <Package size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Catálogo de Productos</span>
                <h4 className="fw-black text-gray-900 mb-0">{summary.totalUnique} Insumos</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-xl d-flex align-items-center justify-content-center">
                <Calendar size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Lotes por Vencer (45 días)</span>
                <h4 className="fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
                  <span className={summary.expiringSoonCount > 0 ? "text-warning" : "text-gray-800"}>
                    {summary.expiringSoonCount}
                  </span>
                  {summary.expiringSoonCount > 0 && (
                    <Badge bg="warning" className="text-dark rounded-pill px-2" style={{ fontSize: "10px" }}>Alerta</Badge>
                  )}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* RETAILER ASSISTANCE & EXPIRATION ALERTS */}
      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Sparkles className="text-purple-600 animate-pulse" size={20} />
                  <h3 className="h6 fw-black text-gray-900 mb-0">Asistencia Inteligente de Reposición</h3>
                </div>
                
                {summary.lowStockCount > 0 ? (
                  <Alert variant="danger" className="rounded-xl p-3 mb-4 smaller border-0" style={{ backgroundColor: "rgba(239, 68, 68, 0.06)", color: "#ef4444" }}>
                    <div className="fw-bold mb-1">¡Abastecimiento Crítico Detectado!</div>
                    Hay {summary.lowStockCount} insumos esenciales por debajo de su nivel de stock mínimo configurable. El salón corre riesgo de desabastecimiento en tratamientos frecuentes.
                  </Alert>
                ) : (
                  <Alert variant="success" className="rounded-xl p-3 mb-4 smaller border-0" style={{ backgroundColor: "rgba(16, 185, 129, 0.06)", color: "#10b981" }}>
                    <div className="fw-bold mb-1">Stock Saludable</div>
                    Todos tus productos se encuentran en niveles de stock estables y en control. ¡Buen trabajo en la planificación contable!
                  </Alert>
                )}

                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>Insumo de Mayor Uso:</span>
                  <strong className="text-gray-900">{summary.mostConsumed}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 small text-muted">
                  <span>Tratamiento de Mayor Costo:</span>
                  <strong className="text-gray-900">{summary.costliestService}</strong>
                </div>
                <div className="d-flex justify-content-between mb-3 small text-muted">
                  <span>Gasto Mensual Estimado:</span>
                  <strong className="text-purple-600 fw-bold">{currency(summary.estimatedMonthlySpend)}</strong>
                </div>
              </div>

              <div className="d-grid gap-2">
                <button 
                  onClick={() => onTabChange("orders")} 
                  className="btn btn-purple rounded-xl py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 shadow-sm border-0 d-flex align-items-center justify-content-center gap-2"
                >
                  <ShoppingCart size={15} />
                  <span>Redactar Pedido de Reposición</span>
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Lotes por Vencer */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3.5">
                <h3 className="h6 fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
                  <Calendar className="text-purple-600" size={18} />
                  <span>Control de Caducidad de Lotes</span>
                </h3>
                <span className="smaller text-muted fw-semibold">Próximos 45 días</span>
              </div>

              {expiringSoon.length === 0 ? (
                <div className="text-center py-5 text-muted small bg-gray-50 rounded-2xl border flex-grow-1 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "150px" }}>
                  <Package className="text-gray-300 mb-2" size={32} />
                  No hay lotes con fecha de vencimiento crítica próxima en este almacén.
                </div>
              ) : (
                <ListGroup variant="flush" className="overflow-auto scrollbar-none" style={{ maxHeight: "170px" }}>
                  {expiringSoon.map((b) => (
                    <ListGroup.Item key={b.id} className="px-0 py-2.5 bg-transparent border-bottom d-flex align-items-center justify-content-between">
                      <div>
                        <strong className="text-gray-900 small d-block">{b.productName}</strong>
                        <span className="smaller text-muted">Lote: {b.batchNumber} • Quedan: <strong>{b.qty}</strong> unidades</span>
                      </div>
                      <Badge bg="warning-soft" className="text-warning rounded-pill px-3 py-1.5 fw-bold">
                        Vence: {new Date(b.expirationDate).toLocaleDateString("es-AR")}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CHARTS GRAPHICS SECTION */}
      <Row className="g-4">
        {/* Nivel de Stock vs Stock Mínimo */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm bg-white">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-4">Niveles de Stock vs Alerta de Stock Mínimo</h3>
              
              {stockData.length === 0 ? (
                <div className="text-center py-5 text-muted small">Cargando catálogo...</div>
              ) : (
                <div style={{ width: "100%", height: "260px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="stock" name="Stock Actual" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={25} />
                      <Bar dataKey="minStock" name="Stock Mínimo" fill="#f87171" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Distribución por Categoría */}
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <h3 className="h6 fw-black text-gray-900 mb-1">Distribución de Insumos</h3>
                <p className="text-muted smaller mb-3">Participación de productos cargados en catálogo por rubro.</p>
              </div>

              {categoryData.length === 0 ? (
                <div className="text-center py-5 text-muted small">Sin datos.</div>
              ) : (
                <div style={{ width: "100%", height: "150px" }} className="my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="small d-grid gap-1 mt-2">
                {categoryData.map((item, idx) => (
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
    </div>
  );
}
