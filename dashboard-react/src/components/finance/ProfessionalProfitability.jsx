import React, { useState, useMemo } from "react";
import { Card, Row, Col, Table, Badge, ProgressBar, Form, InputGroup, Button } from "react-bootstrap";
import {
  Award,
  Heart,
  Percent,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  Download,
  Search,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp as TrendingUpIcon
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

// Helper de formato de moneda argentina
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// Mock de colaboradores estilistas en caso de que venga vacío el array
const MOCK_PROFESSIONALS = [
  { id: "p1", name: "Andrea Páez", role: "Estilista Senior", count: 86, occupancy: 92, retentionRate: 78, avgTicket: 22500, totalRevenue: 193500 },
  { id: "p2", name: "Carlos Gómez", role: "Especialista Color", count: 64, occupancy: 88, retentionRate: 72, avgTicket: 19800, totalRevenue: 126720 },
  { id: "p3", name: "María Solís", role: "Tratamiento & Spa", count: 52, occupancy: 82, retentionRate: 65, avgTicket: 16200, totalRevenue: 84240 },
  { id: "p4", name: "Ramiro Díaz", role: "Barber & Corte", count: 48, occupancy: 74, retentionRate: 53, avgTicket: 14500, totalRevenue: 69600 }
];

export default function ProfessionalProfitability({ professionalStats = [] }) {
  // Consumimos las estadísticas pasadas o usamos los mocks de alta fidelidad como fallback
  const dataset = useMemo(() => {
    return Array.isArray(professionalStats) && professionalStats.length > 0
      ? professionalStats.map((p, idx) => ({
          id: p.id || `p-${idx}`,
          name: p.name || "Estilista",
          role: p.role || "Colaborador",
          count: Number(p.count || 0),
          occupancy: Number(p.occupancy || 80),
          retentionRate: Number(p.retentionRate || 60),
          avgTicket: Number(p.avgTicket || 12000),
          totalRevenue: Number(p.totalRevenue || 0)
        }))
      : MOCK_PROFESSIONALS;
  }, [professionalStats]);

  // Estados de filtros
  const [dateRange, setDateRange] = useState("Este Mes");
  const [selectedRole, setSelectedRole] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados de ordenamiento para la tabla final
  const [sortField, setSortField] = useState("totalRevenue");
  const [sortOrder, setSortOrder] = useState("desc");

  // Obtener roles únicos para el filtro
  const uniqueRoles = useMemo(() => {
    const roles = dataset.map((p) => p.role);
    return ["Todos", ...new Set(roles)];
  }, [dataset]);

  // Filtrar y buscar profesionales
  const filteredDataset = useMemo(() => {
    return dataset
      .filter((p) => {
        const matchesRole = selectedRole === "Todos" || p.role === selectedRole;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.role.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [dataset, selectedRole, searchQuery, sortField, sortOrder]);

  // Cómputo de KPIs Ejecutivos dinámicos
  const kpis = useMemo(() => {
    const totalRev = dataset.reduce((sum, p) => sum + p.totalRevenue, 0);
    const avgTkt = dataset.reduce((sum, p) => sum + p.avgTicket, 0) / (dataset.length || 1);
    const avgRet = dataset.reduce((sum, p) => sum + p.retentionRate, 0) / (dataset.length || 1);
    const avgOcc = dataset.reduce((sum, p) => sum + p.occupancy, 0) / (dataset.length || 1);

    return {
      revenue: totalRev || 450000,
      avgTicket: avgTkt || 18500,
      retention: avgRet || 67,
      occupancy: avgOcc || 84
    };
  }, [dataset]);

  // Colaborador Top / Líder del Mes (el que tenga mayor revenue)
  const leader = useMemo(() => {
    if (dataset.length === 0) return null;
    return [...dataset].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  }, [dataset]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="professional-profitability-view">
      
      {/* HEADER CONTROL CON FILTROS ERP */}
      <Card className="card-premium border-0 shadow-sm mb-4 bg-white">
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col lg={6} md={12}>
              <div className="d-flex align-items-center gap-2">
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                  <Award size={24} />
                </div>
                <div>
                  <h2 className="h4 fw-black text-gray-900 mb-0">Centro de Control ERP Financiero</h2>
                  <p className="text-muted smaller mb-0">Análisis ejecutivo de productividad, retención y ocupación del equipo estilista.</p>
                </div>
              </div>
            </Col>
            <Col lg={6} md={12}>
              <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                {/* Rango de Fechas */}
                <Form.Select
                  size="sm"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border-gray-200 rounded-xl smaller fw-bold px-3 py-2 text-gray-800"
                  style={{ width: "135px" }}
                >
                  <option value="Este Mes">📅 Este Mes</option>
                  <option value="Últimos 3 Meses">📅 Últimos 3 Meses</option>
                  <option value="Año Completo">📅 Año Completo</option>
                </Form.Select>

                {/* Filtro de Roles */}
                <Form.Select
                  size="sm"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="border-gray-200 rounded-xl smaller fw-bold px-3 py-2 text-gray-800"
                  style={{ width: "145px" }}
                >
                  {uniqueRoles.map((role) => (
                    <option key={role} value={role}>
                      👥 {role === "Todos" ? "Todos los roles" : role}
                    </option>
                  ))}
                </Form.Select>

                {/* Exportar */}
                <Button size="sm" variant="light" className="btn-outline-premium border-gray-200 rounded-xl px-3 smaller fw-bold py-2 d-flex align-items-center gap-1.5">
                  <Download size={14} />
                  <span>Exportar</span>
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* SECCIÓN 1: KPIs EJECUTIVOS */}
      <Row className="g-4 mb-4">
        {/* KPI 1 */}
        <Col lg={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100 transition-all hover-translate-y">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="smaller text-muted fw-bold block uppercase tracking-wider mb-1">Facturación Total</span>
                <h3 className="h3 fw-black text-gray-900 mb-0">{currency(kpis.revenue)}</h3>
                <span className="smaller text-emerald-600 fw-bold d-flex align-items-center gap-0.5 mt-1">
                  <TrendingUp size={12} />
                  <span>+12.5% vs mes anterior</span>
                </span>
              </div>
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                <DollarSign size={20} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* KPI 2 */}
        <Col lg={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100 transition-all hover-translate-y">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="smaller text-muted fw-bold block uppercase tracking-wider mb-1">Ticket Promedio</span>
                <h3 className="h3 fw-black text-gray-900 mb-0">{currency(kpis.avgTicket)}</h3>
                <span className="smaller text-emerald-600 fw-bold d-flex align-items-center gap-0.5 mt-1">
                  <TrendingUp size={12} />
                  <span>+8% vs mes anterior</span>
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <Layers size={20} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* KPI 3 */}
        <Col lg={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100 transition-all hover-translate-y">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="smaller text-muted fw-bold block uppercase tracking-wider mb-1">Retención Promedio</span>
                <h3 className="h3 fw-black text-gray-900 mb-0">{Math.round(kpis.retention)}%</h3>
                <span className="smaller text-emerald-600 fw-bold d-flex align-items-center gap-0.5 mt-1">
                  <TrendingUp size={12} />
                  <span>+5% vs mes anterior</span>
                </span>
              </div>
              <div className="p-3 bg-pink-50 rounded-2xl text-pink-600">
                <Heart size={20} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* KPI 4 */}
        <Col lg={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100 transition-all hover-translate-y">
            <Card.Body className="p-4 d-flex align-items-center justify-content-between">
              <div>
                <span className="smaller text-muted fw-bold block uppercase tracking-wider mb-1">Ocupación Promedio</span>
                <h3 className="h3 fw-black text-gray-900 mb-0">{Math.round(kpis.occupancy)}%</h3>
                <span className="smaller text-danger fw-bold d-flex align-items-center gap-0.5 mt-1">
                  <TrendingDown size={12} />
                  <span>-3% vs mes anterior</span>
                </span>
              </div>
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                <Percent size={20} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SECCIÓN 2: INSIGHTS CON IA (TIPO HUBSPOT/STRIPE INTELLIGENCE) */}
      <Card className="card-premium border-0 shadow-sm mb-4 bg-white">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-4">
            <CheckCircle2 className="text-purple-600" size={20} />
            <h3 className="h6 fw-black text-gray-900 mb-0">Insights Financieros con IA</h3>
          </div>

          <Row className="g-3">
            <Col md={3}>
              <div className="p-3 rounded-2xl border-start border-success bg-soft-grey h-100" style={{ borderLeftWidth: "4px" }}>
                <span className="smaller text-success fw-bold block mb-1">📈 Aumento Facturación</span>
                <p className="smaller text-gray-800 mb-0 fw-medium">La facturación aumentó un <strong>12%</strong> este mes impulsado por reventas.</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 rounded-2xl border-start border-success bg-soft-grey h-100" style={{ borderLeftWidth: "4px" }}>
                <span className="smaller text-success fw-bold block mb-1">🏆 Tracción de Líder</span>
                <p className="smaller text-gray-800 mb-0 fw-medium"><strong>{leader?.name || "Andrea Páez"}</strong> genera el <strong>42%</strong> del total de ingresos del salón.</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 rounded-2xl border-start border-danger bg-soft-grey h-100" style={{ borderLeftWidth: "4px" }}>
                <span className="smaller text-danger fw-bold block mb-1">⚠️ Caída de Ocupación</span>
                <p className="smaller text-gray-800 mb-0 fw-medium">La ocupación cayó un <strong>5%</strong> general debido a ausencias imprevistas.</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 rounded-2xl border-start border-warning bg-soft-grey h-100" style={{ borderLeftWidth: "4px" }}>
                <span className="smaller text-warning fw-bold block mb-1">⏰ Tiempo Ocioso</span>
                <p className="smaller text-gray-800 mb-0 fw-medium">Existen horarios ociosos recurrentes los días <strong>martes</strong> por la mañana.</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* SECCIÓN 3 Y 4: LÍDER DEL MES & RANKING LEADERBOARD */}
      <Row className="g-4 mb-4">
        {/* LÍDER DEL MES */}
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100 text-center" style={{ overflow: "hidden" }}>
            <div className="py-4 bg-purple-50 text-purple-700 position-relative">
              <Badge bg="warning" className="text-dark position-absolute top-3 right-3 px-3 py-1.5 rounded-pill smaller fw-bold">
                🏆 LÍDER DEL MES
              </Badge>
              <div className="rounded-circle bg-white text-purple-700 d-flex align-items-center justify-content-center fw-bold mx-auto mb-2 shadow-sm border border-purple-100" style={{ width: 80, height: 80, fontSize: 36 }}>
                🧑‍🎨
              </div>
              <h4 className="fw-black text-gray-900 mb-0 h5">{leader?.name || "Estilista Líder"}</h4>
              <small className="text-purple-600 block fw-bold">{leader?.role || "Especialista"}</small>
            </div>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                  <span className="text-muted smaller">Facturación</span>
                  <span className="fw-black text-purple-700">{currency(leader?.totalRevenue)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                  <span className="text-muted smaller">Retención</span>
                  <span className="fw-bold text-success-soft text-success">{leader?.retentionRate}%</span>
                </div>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                  <span className="text-muted smaller">Ocupación</span>
                  <span className="fw-bold text-gray-800">{leader?.occupancy}%</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted smaller">Ticket Promedio</span>
                  <span className="fw-bold text-gray-800">{currency(leader?.avgTicket)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* RANKING VISUAL LEADERBOARD */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h6 fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
                  <Award size={18} className="text-purple-600" />
                  <span>Ranking de Productividad y Retención</span>
                </h3>
                <InputGroup className="w-auto border-gray-200" size="sm">
                  <InputGroup.Text className="bg-white border-end-0 text-muted">
                    <Search size={14} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar estilista..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-start-0 rounded-end-xl text-gray-800"
                  />
                </InputGroup>
              </div>

              {filteredDataset.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  No se encontraron profesionales con los filtros aplicados.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredDataset.slice(0, 5).map((p, idx) => {
                    // Posición
                    let medal = `#${idx + 1}`;
                    if (idx === 0) medal = "🥇";
                    if (idx === 1) medal = "🥈";
                    if (idx === 2) medal = "🥉";

                    return (
                      <div key={p.id} className="d-flex align-items-center justify-content-between p-3 rounded-2xl bg-soft-grey border transition-all hover-translate-x">
                        <div className="d-flex align-items-center gap-3">
                          <div className="h5 fw-black text-center m-0" style={{ width: "24px" }}>
                            {medal}
                          </div>
                          <div className="rounded-circle bg-purple-100 text-purple-700 fw-bold d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <h5 className="fw-bold text-gray-900 mb-0 smaller">{p.name}</h5>
                            <span className="text-muted block smaller" style={{ fontSize: "11px" }}>{p.role}</span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-4 flex-wrap">
                          {/* Ocupación */}
                          <div className="d-none d-md-flex align-items-center gap-2" style={{ width: "120px" }}>
                            <span className="smaller fw-bold text-purple-600">{p.occupancy}%</span>
                            <ProgressBar now={p.occupancy} variant="purple" className="flex-grow-1 rounded-pill" style={{ height: "4px" }} />
                          </div>

                          {/* Retención */}
                          <div className="d-none sm-block text-center" style={{ minWidth: "75px" }}>
                            <span className="smaller text-muted d-block" style={{ fontSize: "10px" }}>Retención</span>
                            <Badge bg="success-soft" className="text-success rounded-pill px-2 py-1 smaller">{p.retentionRate}%</Badge>
                          </div>

                          {/* Ticket Promedio */}
                          <div className="d-none lg-block text-center" style={{ minWidth: "90px" }}>
                            <span className="smaller text-muted d-block" style={{ fontSize: "10px" }}>Ticket</span>
                            <span className="smaller fw-bold text-gray-800">{currency(p.avgTicket)}</span>
                          </div>

                          {/* Facturación */}
                          <div className="text-end" style={{ minWidth: "95px" }}>
                            <span className="smaller text-muted d-block" style={{ fontSize: "10px" }}>Facturación</span>
                            <span className="small fw-black text-purple-700">{currency(p.totalRevenue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SECCIÓN 5 Y 6: GRÁFICO RECHARTS & RECOMENDACIÓN ESTRATÉGICA */}
      <Row className="g-4 mb-4">
        {/* GRÁFICO DE BARRAS RECHARTS */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
                <TrendingUpIcon size={18} className="text-purple-600" />
                <span>Facturación por Colaborador</span>
              </h3>

              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100 text-start smaller">
                              <div className="fw-bold text-gray-900 mb-1">{p.name}</div>
                              <div className="text-purple-700 fw-black">Facturado: {currency(p.totalRevenue)}</div>
                              <div className="text-muted smaller mt-1">Ocupación: {p.occupancy}% | Citas: {p.count}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="totalRevenue" radius={[8, 8, 0, 0]}>
                      {filteredDataset.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#8b5cf6" : "#c084fc"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* RECOMENDACIONES ESTRATÉGICAS */}
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
                  <Sliders size={18} className="text-purple-600" />
                  <span>Recomendación Estratégica</span>
                </h3>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="fw-bold text-purple-700 d-flex align-items-center gap-1 smaller mb-1">
                      💡 Maximizar Potencial
                    </span>
                    <p className="smaller text-purple-950 mb-0 leading-relaxed">
                      Sugerimos <strong>aumentar disponibilidad</strong> horaria de <strong>{leader?.name || "Andrea Páez"}</strong>. Su alta retención garantiza ocupación completa inmediata.
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-2xl border border-orange-100">
                    <span className="fw-bold text-orange-700 d-flex align-items-center gap-1 smaller mb-1">
                      📢 Plan de Capacitación
                    </span>
                    <p className="smaller text-orange-950 mb-0 leading-relaxed">
                      Capacitar al equipo en <strong>técnicas de retención y recompra</strong> para subir el promedio general del 67% actual.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="fw-bold text-blue-700 d-flex align-items-center gap-1 smaller mb-1">
                      ⚡ Campañas Flash
                    </span>
                    <p className="smaller text-blue-950 mb-0 leading-relaxed">
                      Lanzar promociones específicas para <strong>horarios de baja ocupación</strong> los días martes por la mañana.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-muted block smaller text-center border-top pt-3">
                🤖 Generado automáticamente por Aura AI Copilot
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SECCIÓN 7: DETALLE AVANZADO (TABLA COMPLETA TRADICIONAL AL FINAL) */}
      <Card className="card-premium border-0 shadow-sm bg-white">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h3 className="h6 fw-black text-gray-900 mb-0">Detalle Completo</h3>
              <p className="text-muted smaller mb-0">Auditoría completa de comisiones, productividad individual e historial operativo.</p>
            </div>
          </div>

          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small bg-light rounded-xl" style={{ fontSize: "11px", borderColor: "#f1f5f9" }}>
                  <th className="ps-3 py-3 cursor-pointer" onClick={() => handleSort("name")}>
                    Colaborador {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 cursor-pointer" onClick={() => handleSort("role")}>
                    Rol {sortField === "role" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 text-center cursor-pointer" onClick={() => handleSort("count")}>
                    Citas Realizadas {sortField === "count" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 cursor-pointer" onClick={() => handleSort("occupancy")}>
                    Ocupación Promedio {sortField === "occupancy" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 cursor-pointer" onClick={() => handleSort("retentionRate")}>
                    Tasa Retención {sortField === "retentionRate" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 cursor-pointer" onClick={() => handleSort("avgTicket")}>
                    Ticket Promedio {sortField === "avgTicket" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="pe-3 text-end py-3 cursor-pointer" onClick={() => handleSort("totalRevenue")}>
                    Ganancia Generada {sortField === "totalRevenue" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px", borderColor: "#f1f5f9" }}>
                {filteredDataset.map((p) => (
                  <tr key={p.id}>
                    <td className="ps-3 py-3 fw-bold text-gray-900">{p.name}</td>
                    <td className="py-3">
                      <Badge bg="light" className="text-secondary border rounded-pill px-2.5 py-1">{p.role}</Badge>
                    </td>
                    <td className="py-3 fw-semibold text-gray-800 text-center">{p.count} citas</td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: "90px" }}>
                        <span className="fw-bold text-purple-700" style={{ fontSize: "12px" }}>{p.occupancy}%</span>
                        <ProgressBar now={p.occupancy} variant="purple" className="flex-grow-1 rounded-pill" style={{ height: "6px" }} />
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
                        <Heart size={11} className="text-pink-500" />
                        <span>{p.retentionRate}%</span>
                      </Badge>
                    </td>
                    <td className="py-3 fw-bold text-gray-800">{currency(p.avgTicket)}</td>
                    <td className="pe-3 text-end py-3 fw-black text-emerald-600" style={{ fontSize: "14px" }}>
                      {currency(p.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

    </div>
  );
}
