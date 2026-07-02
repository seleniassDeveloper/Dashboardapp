import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, Table, Form, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { Clock, ArrowRight, User, Filter, RefreshCw, Activity, AlertTriangle, CheckCircle, BarChart3, Search, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider.jsx";
import api from "../lib/api.js";
import { useBusinessModel } from "../hooks/useBusinessModel.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Helper to format duration in seconds into human-readable text
const formatDuration = (seconds, isEs) => {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return isEs ? `${seconds} seg` : `${seconds} sec`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return isEs ? `${mins} min` : `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (remMins === 0) return `${hours}h`;
  return `${hours}h ${remMins}m`;
};

export default function SlaStatsView() {
  const { i18n } = useTranslation("views");
  const isEs = i18n.language === "es";
  const { appointmentStatuses } = useAppointmentsStore();
  const { appointmentStatuses: modelDefaultStatuses } = useBusinessModel();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ averages: [], recentTransitions: [], totalTransitions: 0 });

  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // all, day, week

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/appointments/sla/stats");
      setData(res.data || { averages: [], recentTransitions: [], totalTransitions: 0 });
    } catch (err) {
      console.error("Error fetching SLA stats:", err);
      setError(
        isEs 
          ? "No se pudieron cargar las estadísticas del SLA. Inténtalo de nuevo." 
          : "Could not load SLA statistics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map status key to label and color
  const getStatusDetails = (statusKey) => {
    const found = appointmentStatuses?.find(s => s.key === statusKey) || 
                  modelDefaultStatuses?.find(s => s.key === statusKey);

    return found || { key: statusKey, label: statusKey, color: "#6b7280" };
  };

  // Process data for Recharts
  const chartData = useMemo(() => {
    if (!data.averages) return [];
    return data.averages.map(avg => {
      const details = getStatusDetails(avg.status);
      return {
        key: avg.status,
        name: details.label,
        durationMinutes: Math.round(avg.averageSeconds / 60),
        durationSeconds: avg.averageSeconds,
        count: avg.count,
        color: details.color
      };
    }).sort((a, b) => b.durationSeconds - a.durationSeconds);
  }, [data.averages, appointmentStatuses, isEs]);

  // SLA KPI calculations
  const kpis = useMemo(() => {
    const total = data.totalTransitions || 0;
    
    // Average resolution time (sum of all average transition times in chartData)
    const totalAvgSeconds = chartData.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const avgTotalTimeStr = formatDuration(totalAvgSeconds, isEs);

    // Identify bottleneck status (highest average duration)
    const bottleneck = chartData[0] || null;

    return {
      total,
      avgTotalTimeStr,
      bottleneck
    };
  }, [data.totalTransitions, chartData, isEs]);

  // Filtered recent transitions list
  const filteredTransitions = useMemo(() => {
    if (!data.recentTransitions) return [];
    
    return data.recentTransitions.filter(item => {
      // 1. Search filter
      const clientMatch = item.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const serviceMatch = item.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = clientMatch || serviceMatch;

      // 2. Status filter
      const matchesStatus = statusFilter === "all" || 
                            item.statusFrom === statusFilter || 
                            item.statusTo === statusFilter;

      // 3. Time filter
      let matchesTime = true;
      if (timeFilter !== "all" && item.transitionedAt) {
        const transitionDate = new Date(item.transitionedAt);
        const diffDays = (new Date().getTime() - transitionDate.getTime()) / (1000 * 3600 * 24);
        if (timeFilter === "day" && diffDays > 1) matchesTime = false;
        if (timeFilter === "week" && diffDays > 7) matchesTime = false;
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [data.recentTransitions, searchTerm, statusFilter, timeFilter]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataObj = payload[0].payload;
      return (
        <div className="bg-white border rounded-2xl p-3 shadow-lg" style={{ minWidth: "180px" }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-circle" style={{ width: "10px", height: "10px", backgroundColor: dataObj.color }} />
            <strong className="text-gray-900 small">{dataObj.name}</strong>
          </div>
          <div className="text-muted smaller mb-1">
            {isEs ? "Permanencia prom:" : "Avg retention:"} <span className="text-purple-600 font-bold">{formatDuration(dataObj.durationSeconds, isEs)}</span>
          </div>
          <div className="text-muted smaller">
            {isEs ? "Transiciones:" : "Transitions:"} <span className="text-gray-900 font-semibold">{dataObj.count}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Container fluid className="p-0 animate-fade-in">
      {/* SLA Metric Section Header */}
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Clock className="text-purple-600 animate-pulse" size={28} />
            <h1 className="fw-bold h3 m-0">
              {isEs ? "Métricas de SLA" : "SLA Metrics"}
            </h1>
          </div>
          <p className="text-muted mb-0">
            {isEs 
              ? "Monitorea los tiempos de respuesta y permanencia en cada estado de tu flujo de trabajo."
              : "Monitor response times and retention in each state of your business workflow."
            }
          </p>
        </div>
        <div>
          <Button
            variant="light"
            onClick={fetchData}
            disabled={loading}
            className="d-flex align-items-center gap-2 border rounded-xl px-3 py-2 hover-bg-gray-100"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>{isEs ? "Refrescar" : "Refresh"}</span>
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="danger" className="rounded-2xl border-0 shadow-sm mb-4 animate-fade-in">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <Spinner size="sm" className="me-2" /> 
          {isEs ? "Cargando métricas de SLA y tiempos de transición..." : "Loading SLA metrics and transition times..."}
        </div>
      ) : (
        <>
          {/* KPI CARDS GRID */}
          <Row className="g-4 mb-4">
            {/* KPI 1: Total Transiciones */}
            <Col lg={4} md={6}>
              <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl position-relative overflow-hidden">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>
                    {isEs ? "Total Transiciones de Citas" : "Total Appointment Transitions"}
                  </span>
                  <div className="p-2 bg-purple bg-opacity-10 text-purple-600 rounded-xl">
                    <Activity size={20} />
                  </div>
                </div>
                <div className="h2 fw-black m-0 text-gray-900">{kpis.total}</div>
                <p className="text-muted smaller mt-2 mb-0">
                  {isEs 
                    ? "Volumen total de cambios de estado registrados en el sistema." 
                    : "Total volume of status changes recorded in the system."}
                </p>
              </Card>
            </Col>

            {/* KPI 2: Tiempo de Ciclo Promedio */}
            <Col lg={4} md={6}>
              <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl position-relative overflow-hidden">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>
                    {isEs ? "Tiempo de Ciclo Promedio" : "Average Cycle Time"}
                  </span>
                  <div className="p-2 bg-success bg-opacity-10 text-success rounded-xl">
                    <Clock size={20} />
                  </div>
                </div>
                <div className="h2 fw-black m-0 text-success">{kpis.avgTotalTimeStr || "—"}</div>
                <p className="text-muted smaller mt-2 mb-0">
                  {isEs 
                    ? "Tiempo promedio acumulado que pasa una cita a través del workflow." 
                    : "Average cumulative time an appointment spends progressing through the workflow."}
                </p>
              </Card>
            </Col>

            {/* KPI 3: Cuello de Botella (Slowest State) */}
            <Col lg={4} md={12}>
              <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl position-relative overflow-hidden">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small text-uppercase tracking-wider fw-bold" style={{ fontSize: "11px" }}>
                    {isEs ? "Cuello de Botella (Mayor Retención)" : "Workflow Bottleneck (Highest Hold)"}
                  </span>
                  <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-xl">
                    <AlertTriangle size={20} />
                  </div>
                </div>
                {kpis.bottleneck ? (
                  <div className="d-flex align-items-center gap-3">
                    <div className="h2 fw-black m-0 text-danger">
                      {formatDuration(kpis.bottleneck.durationSeconds, isEs)}
                    </div>
                    <Badge 
                      style={{ backgroundColor: kpis.bottleneck.color, color: "#fff", fontSize: "11px" }}
                      className="px-2.5 py-1.5 rounded-lg border-0"
                    >
                      {kpis.bottleneck.name}
                    </Badge>
                  </div>
                ) : (
                  <div className="h2 fw-black m-0 text-muted">—</div>
                )}
                <p className="text-muted smaller mt-2 mb-0">
                  {isEs 
                    ? "Estado donde las citas permanecen más tiempo en promedio." 
                    : "Status where appointments remain for the longest duration on average."}
                </p>
              </Card>
            </Col>
          </Row>

          {/* SLA CHART */}
          <Row className="g-4 mb-4">
            <Col lg={12}>
              <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-gray-900 m-0">
                      {isEs ? "Permanencia Promedio por Estado de Workflow" : "Average Retention Time per Workflow State"}
                    </h5>
                    <p className="text-muted smaller mb-0">
                      {isEs 
                        ? "Mide la cantidad de tiempo (en minutos) que una cita pasa en cada estado." 
                        : "Measure the amount of time (in minutes) an appointment spends in each status."}
                    </p>
                  </div>
                  <Badge bg="light" className="text-dark border p-2 d-flex align-items-center gap-1.5 rounded-lg">
                    <BarChart3 size={14} className="text-purple-600" />
                    <span>{isEs ? "Expresado en Minutos" : "Expressed in Minutes"}</span>
                  </Badge>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center py-5 text-muted border border-dashed rounded-xl">
                    {isEs ? "Sin datos suficientes para generar el gráfico." : "Insufficient data to generate the chart."}
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          dx={-10}
                          label={{ 
                            value: isEs ? "Minutos" : "Minutes", 
                            angle: -90, 
                            position: "insideLeft",
                            style: { textAnchor: "middle", fill: "#64748b", fontSize: 11, fontWeight: 600 } 
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(100, 116, 139, 0.04)", radius: 8 }} />
                        <Bar 
                          dataKey="durationMinutes" 
                          radius={[8, 8, 0, 0]} 
                          maxBarSize={45}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* TRANSITIONS LOG LIST */}
          <Card className="card-premium border bg-white rounded-2xl shadow-sm overflow-hidden mb-5 animate-fade-in">
            {/* Filters panel */}
            <div className="p-4 border-bottom bg-light bg-opacity-40">
              <Row className="g-3 align-items-center">
                <Col md={4} sm={12}>
                  <h5 className="fw-bold text-gray-900 m-0 d-flex align-items-center gap-2">
                    {isEs ? "Bitácora de Transiciones Recientes" : "Recent Transitions Log"}
                    <Badge bg="purple-soft" className="text-purple-600 font-mono smaller rounded-pill">
                      {filteredTransitions.length}
                    </Badge>
                  </h5>
                </Col>
                <Col md={8} sm={12}>
                  <div className="d-flex gap-2 flex-wrap justify-content-md-end">
                    {/* Search */}
                    <div className="position-relative" style={{ minWidth: "200px" }}>
                      <Search className="position-absolute text-muted" size={16} style={{ left: "12px", top: "11px" }} />
                      <Form.Control
                        type="text"
                        placeholder={isEs ? "Buscar cliente o servicio..." : "Search client or service..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ps-5 border-gray-200 rounded-xl small"
                        style={{ padding: "8.5px 12px 8.5px 36px", fontSize: "13px" }}
                        list="sla-client-suggestions"
                      />
                      <datalist id="sla-client-suggestions">
                        {Array.from(new Set(data.recentTransitions?.map(t => t.clientName))).filter(Boolean).map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>

                    {/* Filter Status */}
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border-gray-200 rounded-xl small shadow-none"
                      style={{ width: "160px", fontSize: "13px" }}
                    >
                      <option value="all">{isEs ? "Todos los estados" : "All states"}</option>
                      {appointmentStatuses?.map(st => (
                        <option key={st.key} value={st.key}>{st.label}</option>
                      ))}
                    </Form.Select>

                    {/* Filter Date */}
                    <Form.Select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="border-gray-200 rounded-xl small shadow-none"
                      style={{ width: "150px", fontSize: "13px" }}
                    >
                      <option value="all">{isEs ? "Cualquier fecha" : "Any date"}</option>
                      <option value="day">{isEs ? "Últimas 24 horas" : "Last 24 hours"}</option>
                      <option value="week">{isEs ? "Últimos 7 días" : "Last 7 days"}</option>
                    </Form.Select>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Transitions Table */}
            <div className="table-responsive">
              <Table hover className="align-middle mb-0" style={{ borderCollapse: "separate" }}>
                <thead className="bg-light bg-opacity-40">
                  <tr className="border-bottom">
                    <th className="px-4 py-3 text-muted text-uppercase smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                      {isEs ? "Cita / Cliente" : "Appointment / Client"}
                    </th>
                    <th className="py-3 text-muted text-uppercase text-center smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                      {isEs ? "Transición de Estado" : "Status Transition"}
                    </th>
                    <th className="py-3 text-muted text-uppercase text-center smaller tracking-wider" style={{ fontSize: "10.5px" }}>
                      {isEs ? "Fecha de Transición" : "Transitioned At"}
                    </th>
                    <th className="px-4 py-3 text-muted text-uppercase text-end smaller tracking-wider" style={{ fontSize: "10.5px", width: "160px" }}>
                      {isEs ? "SLA / Tiempo Permanencia" : "SLA / Hold Duration"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransitions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5 text-muted small">
                        {isEs ? "No se encontraron transiciones que coincidan con los filtros." : "No transitions found matching active filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredTransitions.map((item) => {
                      const fromDetails = getStatusDetails(item.statusFrom);
                      const toDetails = getStatusDetails(item.statusTo);

                      return (
                        <tr key={item.id} className="transition-all hover-row-focus">
                          {/* Client & Service */}
                          <td className="px-4 py-3.5">
                            <div className="d-flex align-items-center gap-3">
                              <div className="p-2 bg-purple bg-opacity-10 text-purple-600 rounded-xl d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                                <User size={16} />
                              </div>
                              <div>
                                <strong className="text-gray-900 small d-block">{item.clientName}</strong>
                                <span className="text-muted smaller d-block mt-0.5">{item.serviceName}</span>
                              </div>
                            </div>
                          </td>

                          {/* Status Transition flow */}
                          <td className="py-3.5 text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <Badge 
                                style={{ backgroundColor: fromDetails.color, color: "#fff", fontSize: "10.5px" }} 
                                className="px-2.5 py-1.5 rounded-lg border-0"
                              >
                                {fromDetails.label}
                              </Badge>
                              <ArrowRight size={14} className="text-muted" />
                              <Badge 
                                style={{ backgroundColor: toDetails.color, color: "#fff", fontSize: "10.5px" }} 
                                className="px-2.5 py-1.5 rounded-lg border-0"
                              >
                                {toDetails.label}
                              </Badge>
                            </div>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3.5 text-center text-muted smaller" style={{ fontSize: "12.5px" }}>
                            <div className="d-flex align-items-center justify-content-center gap-1.5">
                              <Calendar size={13} className="opacity-60" />
                              <span>
                                {new Date(item.transitionedAt).toLocaleDateString(isEs ? "es-AR" : "en-US")}
                                {" "}
                                {new Date(item.transitionedAt).toLocaleTimeString(isEs ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </td>

                          {/* Duration */}
                          <td className="px-4 py-3.5 text-end font-mono">
                            <span 
                              className={`fw-bold small px-2 py-1 rounded ${
                                item.durationSeconds > 3600 * 2 
                                  ? "text-danger bg-danger bg-opacity-10" 
                                  : "text-gray-900"
                              }`}
                            >
                              {formatDuration(item.durationSeconds, isEs)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      <style>{`
        .bg-purple-soft {
          background-color: rgba(124, 58, 237, 0.08) !important;
        }
        .hover-row-focus {
          transition: background-color 0.2s ease;
        }
        .hover-row-focus:hover {
          background-color: rgba(248, 250, 252, 0.6) !important;
        }
        .card-premium {
          border-color: #f1f5f9 !important;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>
    </Container>
  );
}
