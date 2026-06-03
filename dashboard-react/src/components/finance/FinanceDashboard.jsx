import React from "react";
import { Row, Col, Card, Badge, ProgressBar, Table, Button, Form } from "react-bootstrap";
import { TrendingUp, DollarSign, CreditCard, Sparkles, ShoppingBag, Plus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";

const COLORS = ["#8b5cf6", "#10b981", "#3b82f6", "#ec4899", "#f59e0b", "#06b6d4"];

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function FinanceDashboard({ 
  summary = {}, 
  paymentMethods = [], 
  branchComparison = [],
  recentTransactions = [],
  onAddExpenseClick
}) {
  const chartData = [
    { name: "Semana 1", ingresos: Math.round(summary.totalRevenues * 0.22), egresos: Math.round(summary.totalExpenses * 0.25) },
    { name: "Semana 2", ingresos: Math.round(summary.totalRevenues * 0.28), egresos: Math.round(summary.totalExpenses * 0.23) },
    { name: "Semana 3", ingresos: Math.round(summary.totalRevenues * 0.26), egresos: Math.round(summary.totalExpenses * 0.27) },
    { name: "Semana 4", ingresos: Math.round(summary.totalRevenues * 0.24), egresos: Math.round(summary.totalExpenses * 0.25) }
  ];

  return (
    <div>
      <Row className="g-4 mb-4">
        {/* KPI 1: Ingresos Totales */}
        <Col md={3}>
          <div className="card-premium p-4 h-100 bg-white">
            <div className="d-flex justify-content-between mb-3 align-items-start">
              <div className="p-2 rounded bg-purple-50 text-purple-600"><TrendingUp size={20} /></div>
              <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1 small">+{summary.growthPercentage}% vs mes ant</Badge>
            </div>
            <div className="text-muted small">Ingresos Totales (Mes)</div>
            <div className="h2 fw-black text-purple-700 m-0">{currency(summary.totalRevenues)}</div>
          </div>
        </Col>

        {/* KPI 2: Ganancia Real */}
        <Col md={3}>
          <div className="card-premium p-4 h-100 bg-white" style={{ borderLeft: "4px solid #10b981" }}>
            <div className="d-flex justify-content-between mb-3 align-items-start">
              <div className="p-2 rounded bg-emerald-50 text-emerald-600"><DollarSign size={20} /></div>
              <span className="text-muted smaller fw-bold uppercase">Caja Neta</span>
            </div>
            <div className="text-muted small">Ganancia Real (Reales - Egresos - Comisiones)</div>
            <div className="h2 fw-black text-emerald-600 m-0">{currency(summary.realProfit)}</div>
          </div>
        </Col>

        {/* KPI 3: Ticket Promedio */}
        <Col md={3}>
          <div className="card-premium p-4 h-100 bg-white">
            <div className="d-flex justify-content-between mb-3 align-items-start">
              <div className="p-2 rounded bg-blue-50 text-blue-600"><CreditCard size={20} /></div>
              <span className="text-muted smaller fw-bold uppercase">Consumo Medio</span>
            </div>
            <div className="text-muted small">Ticket Promedio del Salón</div>
            <div className="h2 fw-black text-gray-800 m-0">{currency(summary.avgTicket)}</div>
          </div>
        </Col>

        {/* KPI 4: Cancelaciones */}
        <Col md={3}>
          <div className="card-premium p-4 h-100 bg-white" style={{ borderLeft: "4px solid #f87171" }}>
            <div className="d-flex justify-content-between mb-3 align-items-start">
              <div className="p-2 rounded bg-red-50 text-red-500"><ShoppingBag size={20} /></div>
              <span className="text-muted smaller fw-bold uppercase">Pérdida Neto</span>
            </div>
            <div className="text-muted small">Pérdida por Turnos Cancelados</div>
            <div className="h2 fw-black text-red-600 m-0">{currency(summary.cancellationLoss)}</div>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Gráfico Principal: Tendencia del Flujo de Caja */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm bg-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="h6 fw-black text-gray-900 mb-0">Flujo de Caja Semanal (Ingresos vs Egresos)</h3>
                  <small className="text-muted">Comparativa gráfica de ingresos reales vs gastos operativos liquidados.</small>
                </div>
                <div className="d-flex align-items-center gap-3 font-semibold small">
                  <span className="d-flex align-items-center gap-1"><span className="rounded-circle bg-purple-600" style={{ width: 8, height: 8 }} /> Ingresos</span>
                  <span className="d-flex align-items-center gap-1"><span className="rounded-circle bg-red-500" style={{ width: 8, height: 8 }} /> Egresos</span>
                </div>
              </div>

              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v) => currency(v)} />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" />
                    <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorEgresos)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Métodos de Pago */}
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100 d-flex flex-column justify-content-between">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <h3 className="h6 fw-black text-gray-900 mb-1">Caja por Métodos de Pago</h3>
                <p className="text-muted smaller mb-3">Ingresos acreditados clasificados por pasarela financiera.</p>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border flex-grow-1 d-flex items-center justify-center">
                  Registrá citas finalizadas para ver estadísticas.
                </div>
              ) : (
                <div style={{ width: "100%", height: "160px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => currency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-3 small d-grid gap-1">
                {paymentMethods.map((item, idx) => (
                  <div key={item.name} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <span className="rounded-circle" style={{ width: 8, height: 8, background: COLORS[idx % COLORS.length] }} />
                      <span className="text-muted smaller">{item.name}</span>
                    </div>
                    <span className="fw-bold text-gray-800 smaller">{currency(item.value)}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Renderizado Condicional Multi-Sucursal */}
        {branchComparison?.length > 1 ? (
          <>
            {/* Cabecera de la sección Rendimiento por Sucursal */}
            <Col xs={12}>
              <div className="d-flex justify-content-between align-items-center mt-2 mb-1">
                <div>
                  <h3 className="h5 fw-black text-gray-900 mb-1">Rendimiento por Sucursal</h3>
                  <p className="text-muted small mb-0">Comparativa de ingresos netos, ocupación y ticket promedio entre puntos de venta activos.</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Form.Select size="sm" className="border-gray-200 rounded-xl small fw-semibold" style={{ width: "160px" }}>
                    <option value="month">Este Mes</option>
                    <option value="prev_month">Mes Anterior</option>
                    <option value="quarter">Último Trimestre</option>
                  </Form.Select>
                </div>
              </div>
            </Col>

            {/* Grid de Cards de Sucursales */}
            {branchComparison.map((branch) => {
              const isTop = [...branchComparison].sort((a, b) => b.netProfit - a.netProfit)[0]?.id === branch.id;
              return (
                <Col md={6} lg={4} key={branch.id}>
                  <Card className="card-premium border-0 shadow-sm bg-white h-100 position-relative overflow-hidden">
                    {isTop && (
                      <div 
                        className="position-absolute px-3 py-1 text-white fw-bold small shadow-sm"
                        style={{
                          top: 12,
                          right: -32,
                          transform: "rotate(45deg)",
                          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          fontSize: "9px",
                          width: "120px",
                          textAlign: "center"
                        }}
                      >
                        🏆 Top
                      </div>
                    )}
                    <Card.Body className="p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <h4 className="h6 fw-black text-gray-900 m-0">{branch.name}</h4>
                          {isTop && (
                            <Badge bg="warning-soft" className="text-warning rounded-pill px-2.5 py-1 smaller">
                              🥇 Mejor Rendimiento
                            </Badge>
                          )}
                        </div>

                        <div className="mb-3">
                          <span className="text-muted smaller d-block uppercase font-semibold">Ganancia Neta</span>
                          <span className="h3 fw-black text-emerald-600">{currency(branch.netProfit)}</span>
                        </div>

                        <Row className="g-2 mb-3 pt-2 border-top">
                          <Col xs={6}>
                            <span className="text-muted smaller d-block">Ingresos</span>
                            <span className="fw-bold text-gray-800 small">{currency(branch.revenue)}</span>
                          </Col>
                          <Col xs={6}>
                            <span className="text-muted smaller d-block">Egresos</span>
                            <span className="fw-bold text-red-500 small">{currency(branch.expenses)}</span>
                          </Col>
                        </Row>

                        <div className="d-grid gap-2 small">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Citas Totales:</span>
                            <span className="fw-bold text-gray-900">{branch.appointmentsCount}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Ticket Promedio:</span>
                            <span className="fw-bold text-gray-900">{currency(branch.avgTicket)}</span>
                          </div>
                          <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted">Ocupación:</span>
                              <span className="fw-bold text-purple-700">{branch.occupancy}%</span>
                            </div>
                            <ProgressBar 
                              now={branch.occupancy} 
                              variant={branch.occupancy > 75 ? "purple" : branch.occupancy > 50 ? "info" : "warning"} 
                              style={{ height: "4px" }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-top d-flex align-items-center justify-content-between">
                        <span className="text-muted smaller">Vs mes anterior:</span>
                        <Badge bg={branch.growthPercentage >= 0 ? "success-soft" : "danger-soft"} className={`${branch.growthPercentage >= 0 ? "text-success" : "text-danger"} rounded-pill px-2 py-0.5`}>
                          {branch.growthPercentage >= 0 ? `+${branch.growthPercentage}%` : `${branch.growthPercentage}%`}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}

            {/* Gráfico Comparativo de Barras */}
            <Col lg={4}>
              <Card className="card-premium border-0 shadow-sm bg-white h-100">
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h3 className="h6 fw-black text-gray-900 mb-1">Comparativa de Sucursales</h3>
                    <p className="text-muted smaller mb-4">Ingresos netos por punto de venta.</p>
                  </div>

                  <div style={{ width: "100%", height: "200px" }} className="flex-grow-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchComparison} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v) => currency(v)} />
                        <Bar dataKey="revenue" name="Ingresos" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Tabla Operativa Reciente (Toma Col lg={8} cuando hay multi-sucursal) */}
            <Col lg={8}>
              <div className="card-premium p-0 overflow-hidden shadow-sm bg-white h-100">
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                  <h3 className="h6 fw-black text-gray-900 m-0">Movimientos de Caja Recientes</h3>
                </div>
                {recentTransactions.length === 0 ? (
                  <div className="py-5 text-center text-muted smaller">Registrá turnos finalizados para ver flujos de caja recientes.</div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: "250px" }}>
                    <Table hover responsive className="mb-0 align-middle">
                      <thead>
                        <tr className="table-header-small" style={{ fontSize: "11px" }}>
                          <th className="ps-4">Cliente</th>
                          <th>Tratamiento</th>
                          <th>Especialista</th>
                          <th>Medio de Pago</th>
                          <th>Fecha</th>
                          <th className="pe-4 text-end">Cobro</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: "13px" }}>
                        {recentTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="ps-4 py-2.5">
                              <div className="fw-bold text-gray-900">{tx.clientName}</div>
                              <div className="text-muted smaller">{tx.clientEmail}</div>
                            </td>
                            <td>
                              <Badge bg="primary-soft" className="text-primary rounded-pill px-2.5">{tx.serviceName}</Badge>
                            </td>
                            <td className="text-gray-700">{tx.workerName}</td>
                            <td className="text-secondary small">{tx.paymentMethod}</td>
                            <td className="text-secondary small">{new Date(tx.date).toLocaleDateString("es-AR")}</td>
                            <td className="pe-4 text-end fw-black text-success">{currency(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Col>
          </>
        ) : (
          <>
            {/* Tabla Operativa Reciente (Toma Ancho Completo Col lg={12} cuando no hay multi-sucursal) */}
            <Col lg={12}>
              <div className="card-premium p-0 overflow-hidden shadow-sm bg-white">
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                  <h3 className="h6 fw-black text-gray-900 m-0">Movimientos de Caja Recientes</h3>
                </div>
                {recentTransactions.length === 0 ? (
                  <div className="py-5 text-center text-muted smaller">Registrá turnos finalizados para ver flujos de caja recientes.</div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: "280px" }}>
                    <Table hover responsive className="mb-0 align-middle">
                      <thead>
                        <tr className="table-header-small" style={{ fontSize: "11px" }}>
                          <th className="ps-4">Cliente</th>
                          <th>Tratamiento</th>
                          <th>Especialista</th>
                          <th>Medio de Pago</th>
                          <th>Fecha</th>
                          <th className="pe-4 text-end">Cobro</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: "13px" }}>
                        {recentTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="ps-4 py-2.5">
                              <div className="fw-bold text-gray-900">{tx.clientName}</div>
                              <div className="text-muted smaller">{tx.clientEmail}</div>
                            </td>
                            <td>
                              <Badge bg="primary-soft" className="text-primary rounded-pill px-2.5">{tx.serviceName}</Badge>
                            </td>
                            <td className="text-gray-700">{tx.workerName}</td>
                            <td className="text-secondary small">{tx.paymentMethod}</td>
                            <td className="text-secondary small">{new Date(tx.date).toLocaleDateString("es-AR")}</td>
                            <td className="pe-4 text-end fw-black text-success">{currency(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Col>

            {/* Banner inferior con acceso a Configuración de Sucursales */}
            <Col xs={12}>
              <div 
                className="p-4 border shadow-sm rounded-2xl d-flex flex-wrap justify-content-between align-items-center gap-3"
                style={{
                  background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                  borderColor: "#e9d5ff"
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h4 className="h6 fw-black text-gray-900 mb-1">¿Tenés más de un punto de venta o local comercial?</h4>
                    <p className="text-muted smaller mb-0">Habilitá la contabilidad multi-sucursal y accedé a métricas comparativas detalladas en tiempo real.</p>
                  </div>
                </div>
                <Button 
                  variant="purple" 
                  size="sm" 
                  href="/app/settings?tab=sucursales"
                  className="rounded-xl px-4 py-2 fw-bold text-white shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    border: "none"
                  }}
                >
                  Configurar Sucursales
                </Button>
              </div>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
}
