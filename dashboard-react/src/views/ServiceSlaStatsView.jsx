import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, Table, Form, Badge, Spinner, Alert, Button, Tabs, Tab } from "react-bootstrap";
import { Clock, ArrowRight, User, Filter, RefreshCw, Activity, AlertTriangle, CheckCircle, BarChart3, Search, Calendar, Save, Plus, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider.jsx";
import api from "../lib/api.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Helper to format duration in seconds into human-readable text
const formatDuration = (seconds, isEs) => {
  if (seconds === null || seconds === undefined) return "—";
  const abs = Math.abs(seconds);
  const sign = seconds < 0 ? "-" : "";
  if (abs < 60) return `${sign}${abs} ${isEs ? "seg" : "sec"}`;
  const mins = Math.round(abs / 60);
  if (mins < 60) return `${sign}${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (remMins === 0) return `${sign}${hours}h`;
  return `${sign}${hours}h ${remMins}m`;
};

export default function ServiceSlaStatsView() {
  const { i18n } = useTranslation("views");
  const isEs = i18n.language === "es";
  const { services: servicesCatalog } = useAppointmentsStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    serviceStats: [],
    professionalStats: [],
    totalCompleted: 0,
    pctOnTime: 0,
    pctWithinLimit: 0,
    bottleneckService: null,
    bottleneckProfessional: null,
    recentSlas: []
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Config SLA states
  const [configs, setConfigs] = useState([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");
  const [newConfig, setNewConfig] = useState({
    serviceId: "",
    toleranceType: "percent",
    toleranceValue: 10,
    hardLimitSec: "",
    startStatusKey: "CONFIRMED",
    endStatusKey: "DONE"
  });

  // Professional overrides states
  const [estimates, setEstimates] = useState([]);
  const [newEstimate, setNewEstimate] = useState({
    serviceId: "",
    workerId: "",
    estimatedMinutes: ""
  });
  const [workers, setWorkers] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [statsRes, configRes, estimatesRes, workersRes] = await Promise.all([
        api.get("/appointments/sla-service/stats"),
        api.get("/appointments/sla-service/config"),
        api.get("/appointments/sla-service/estimates"),
        api.get("/workers")
      ]);

      setStats(statsRes.data || {});
      setConfigs(configRes.data || []);
      setEstimates(estimatesRes.data || []);
      setWorkers(workersRes.data || []);
    } catch (err) {
      console.error("Error fetching SLA data:", err);
      setError(
        isEs 
          ? "No se pudieron cargar las estadísticas del SLA de servicio." 
          : "Could not load Service SLA statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateConfig = async (configData) => {
    try {
      setConfigLoading(true);
      await api.put("/appointments/sla-service/config", configData);
      const res = await api.get("/appointments/sla-service/config");
      setConfigs(res.data || []);
      setConfigError("");
      alert(isEs ? "Configuración de SLA guardada exitosamente." : "SLA configuration saved successfully.");
    } catch (err) {
      console.error("Error updating config:", err);
      setConfigError(isEs ? "Error al guardar configuración." : "Error saving config.");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    if (!newEstimate.serviceId || !newEstimate.workerId || !newEstimate.estimatedMinutes) {
      alert(isEs ? "Completa todos los campos" : "Complete all fields");
      return;
    }
    try {
      setConfigLoading(true);
      await api.post("/appointments/sla-service/estimates", {
        serviceId: newEstimate.serviceId,
        workerId: newEstimate.workerId,
        estimatedDurationSec: Number(newEstimate.estimatedMinutes) * 60
      });
      const res = await api.get("/appointments/sla-service/estimates");
      setEstimates(res.data || []);
      setNewEstimate({ serviceId: "", workerId: "", estimatedMinutes: "" });
    } catch (err) {
      console.error(err);
      alert(isEs ? "Error al agregar override" : "Error adding override");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleApplySuggestion = async (serviceId, minutes) => {
    try {
      // Find the service to update
      const service = servicesCatalog.find(s => s.id === serviceId);
      if (!service) return;

      if (!window.confirm(isEs 
        ? `¿Deseas actualizar el estimado base de "${service.name}" a ${minutes} minutos?` 
        : `Do you want to update the base estimate of "${service.name}" to ${minutes} minutes?`)) {
        return;
      }

      await api.put(`/services/${serviceId}`, {
        ...service,
        estimatedDurationSec: minutes * 60
      });
      alert(isEs ? "Estimado del servicio actualizado correctamente." : "Service estimate updated successfully.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert(isEs ? "Error al actualizar estimado." : "Error updating estimate.");
    }
  };

  const filteredSlas = useMemo(() => {
    if (!stats.recentSlas) return [];
    return stats.recentSlas.filter(s => {
      const matchesSearch = s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.professionalName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stats.recentSlas, searchTerm, statusFilter]);

  // Chart data formatting: Estimated vs Actual per service
  const chartData = useMemo(() => {
    if (!stats.serviceStats) return [];
    return stats.serviceStats.map(s => ({
      name: s.serviceName,
      Estimado: Math.round(s.avgEstimated / 60),
      Real: Math.round(s.avgActual / 60)
    }));
  }, [stats.serviceStats]);

  // Active configurations including fallbacks
  const globalConfig = configs.find(c => !c.serviceId) || {
    toleranceType: "percent",
    toleranceValue: 10,
    hardLimitSec: null,
    startStatusKey: "CONFIRMED",
    endStatusKey: "DONE"
  };

  return (
    <Container fluid className="p-0 animate-fade-in">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Activity className="text-purple-600 animate-pulse" size={28} />
            <h1 className="fw-bold h3 m-0">
              {isEs ? "SLA de Ejecución de Servicios" : "Service Execution SLA"}
            </h1>
          </div>
          <p className="text-muted mb-0">
            {isEs 
              ? "Compara el tiempo real que toman los profesionales contra las duraciones estimadas de los servicios."
              : "Compare actual time taken by professionals against estimated service durations."
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
            <span>{isEs ? "Actualizar" : "Refresh"}</span>
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="danger" className="rounded-2xl border-0 shadow-sm mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <Spinner size="sm" className="me-2" /> 
          {isEs ? "Cargando métricas de ejecución..." : "Loading execution metrics..."}
        </div>
      ) : (
        <Tabs defaultActiveKey="stats" className="custom-tabs border-bottom mb-4">
          <Tab eventKey="stats" title={isEs ? "Estadísticas y KPIs" : "Statistics & KPIs"}>
            {/* KPI Cards Grid */}
            <Row className="g-4 mb-4">
              <Col lg={3} md={6}>
                <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl">
                  <span className="text-muted small text-uppercase tracking-wider fw-bold d-block mb-1" style={{ fontSize: "11px" }}>
                    {isEs ? "Servicios Finalizados" : "Completed Services"}
                  </span>
                  <div className="h2 fw-black m-0 text-gray-900">{stats.totalCompleted}</div>
                  <p className="text-muted smaller mt-2 mb-0">
                    {isEs ? "Total medido en esta sucursal." : "Total measured in this business."}
                  </p>
                </Card>
              </Col>

              <Col lg={3} md={6}>
                <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl">
                  <span className="text-muted small text-uppercase tracking-wider fw-bold d-block mb-1" style={{ fontSize: "11px" }}>
                    {isEs ? "SLA Cumplido (A Tiempo)" : "SLA Met (On Time)"}
                  </span>
                  <div className="h2 fw-black m-0 text-success">{stats.pctOnTime}%</div>
                  <p className="text-muted smaller mt-2 mb-0">
                    {isEs ? "Citas finalizadas dentro de tolerancia." : "Appointments finalized within tolerance."}
                  </p>
                </Card>
              </Col>

              <Col lg={3} md={6}>
                <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl">
                  <span className="text-muted small text-uppercase tracking-wider fw-bold d-block mb-1" style={{ fontSize: "11px" }}>
                    {isEs ? "Dentro del Límite Duro" : "Within Hard Limit"}
                  </span>
                  <div className="h2 fw-black m-0 text-purple-600">{stats.pctWithinLimit}%</div>
                  <p className="text-muted smaller mt-2 mb-0">
                    {isEs ? "Finalizados antes del límite máximo." : "Finalized before hard limit."}
                  </p>
                </Card>
              </Col>

              <Col lg={3} md={6}>
                <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl">
                  <span className="text-muted small text-uppercase tracking-wider fw-bold d-block mb-1" style={{ fontSize: "11px" }}>
                    {isEs ? "Cuello de Botella (Servicio)" : "Bottleneck Service"}
                  </span>
                  <div className="h5 fw-bold m-0 text-danger text-truncate">
                    {stats.bottleneckService ? stats.bottleneckService.serviceName : "—"}
                  </div>
                  <p className="text-muted smaller mt-2 mb-0">
                    {stats.bottleneckService 
                      ? `${isEs ? "Desvío prom:" : "Avg diff:"} +${Math.round(stats.bottleneckService.avgVariance / 60)} min` 
                      : (isEs ? "Sin desvíos notables." : "No notable delays.")}
                  </p>
                </Card>
              </Col>
            </Row>

            {/* Suggestions & Recommendations Section */}
            {stats.serviceStats?.some(s => s.suggestion) && (
              <Card className="border-0 shadow-sm rounded-2xl p-4 mb-4" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #edd8ff 100%)", borderLeft: "5px solid #7c3aed" }}>
                <h5 className="fw-black text-purple-900 mb-2 d-flex align-items-center gap-2">
                  <AlertTriangle className="text-purple-600 animate-pulse" size={20} />
                  {isEs ? "Sugerencias de Ajuste de Estimados" : "Estimate Calibration Suggestions"}
                </h5>
                <p className="text-purple-950 small mb-3">
                  {isEs 
                    ? "Detectamos discrepancias consistentes entre la duración estimada y el tiempo real de ejecución. Te sugerimos calibrar la duración base de los siguientes servicios:"
                    : "We detected consistent gaps between estimated durations and actual execution times. We suggest calibrating the base duration of these services:"
                  }
                </p>
                <div className="d-grid gap-2">
                  {stats.serviceStats.filter(s => s.suggestion).map(s => (
                    <div key={s.serviceId} className="bg-white p-3 rounded-xl border d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <strong className="text-dark small">{s.serviceName}</strong>
                        <span className="text-muted smaller d-block mt-0.5">
                          {isEs 
                            ? `Estimado actual: ${s.suggestion.currentEstimateMinutes} min · Real promedio: ${s.suggestion.avgActualMinutes} min (${s.suggestion.differenceMinutes > 0 ? "+" : ""}${s.suggestion.differenceMinutes} min)`
                            : `Current estimate: ${s.suggestion.currentEstimateMinutes} min · Avg actual: ${s.suggestion.avgActualMinutes} min (${s.suggestion.differenceMinutes > 0 ? "+" : ""}${s.suggestion.differenceMinutes} min)`
                          }
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="purple"
                        onClick={() => handleApplySuggestion(s.serviceId, s.suggestion.recommendedMinutes)}
                        className="btn-purple-soft rounded-lg d-flex align-items-center gap-1 text-purple-700 fw-bold border-0 px-3 py-1.5"
                      >
                        <span>{isEs ? "Ajustar estimado" : "Calibrate"}</span>
                        <ArrowUpRight size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recharts comparison Chart */}
            <Row className="g-4 mb-4">
              <Col lg={12}>
                <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl">
                  <h5 className="fw-bold text-gray-900 mb-4">
                    {isEs ? "Comparativa Duración Estimada vs Tiempo Real Promedio" : "Service Duration Comparison (Estimated vs Avg Actual)"}
                  </h5>
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
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} label={{ value: isEs ? "Minutos" : "Minutes", angle: -90, position: "insideLeft", style: { fill: "#64748b", fontSize: 11, fontWeight: 600 } }} />
                          <Tooltip cursor={{ fill: "rgba(100,116,139,0.03)" }} />
                          <Legend verticalAlign="top" height={36} />
                          <Bar name={isEs ? "Estimado (min)" : "Estimated (min)"} dataKey="Estimado" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                          <Bar name={isEs ? "Real Promedio (min)" : "Avg Actual (min)"} dataKey="Real" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Service & Professional metrics tables */}
            <Row className="g-4 mb-4">
              <Col md={6}>
                <Card className="card-premium border bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-3 bg-light bg-opacity-40 border-bottom">
                    <h6 className="fw-black text-gray-900 m-0">{isEs ? "Desempeño por Servicio" : "Performance by Service"}</h6>
                  </div>
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0 text-dark small">
                      <thead>
                        <tr className="bg-light bg-opacity-40 border-bottom">
                          <th className="px-3 py-2.5">{isEs ? "Servicio" : "Service"}</th>
                          <th className="py-2.5 text-center">{isEs ? "Citas" : "Count"}</th>
                          <th className="py-2.5 text-center">{isEs ? "Estimado vs Real" : "Est vs Act"}</th>
                          <th className="px-3 py-2.5 text-end">{isEs ? "% A Tiempo" : "% On Time"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.serviceStats.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-4 text-muted">{isEs ? "Sin datos." : "No data."}</td></tr>
                        ) : (
                          stats.serviceStats.map(s => (
                            <tr key={s.serviceId}>
                              <td className="px-3 py-2.5 fw-semibold">{s.serviceName}</td>
                              <td className="py-2.5 text-center font-mono">{s.count}</td>
                              <td className="py-2.5 text-center font-mono text-muted">
                                {Math.round(s.avgEstimated / 60)}m vs {Math.round(s.avgActual / 60)}m
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono">
                                <span className={`fw-bold ${s.pctOnTime >= 80 ? "text-success" : s.pctOnTime >= 50 ? "text-warning" : "text-danger"}`}>
                                  {s.pctOnTime}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="card-premium border bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-3 bg-light bg-opacity-40 border-bottom">
                    <h6 className="fw-black text-gray-900 m-0">{isEs ? "Desempeño por Profesional" : "Performance by Professional"}</h6>
                  </div>
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0 text-dark small">
                      <thead>
                        <tr className="bg-light bg-opacity-40 border-bottom">
                          <th className="px-3 py-2.5">{isEs ? "Profesional" : "Professional"}</th>
                          <th className="py-2.5 text-center">{isEs ? "Citas" : "Count"}</th>
                          <th className="py-2.5 text-center">{isEs ? "Desvío Promedio" : "Avg Deviation"}</th>
                          <th className="px-3 py-2.5 text-end">{isEs ? "% A Tiempo" : "% On Time"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.professionalStats.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-4 text-muted">{isEs ? "Sin datos." : "No data."}</td></tr>
                        ) : (
                          stats.professionalStats.map(p => (
                            <tr key={p.professionalId}>
                              <td className="px-3 py-2.5 fw-semibold">{p.professionalName}</td>
                              <td className="py-2.5 text-center font-mono">{p.count}</td>
                              <td className="py-2.5 text-center font-mono">
                                <span className={p.avgVariance > 60 ? "text-danger" : p.avgVariance < -60 ? "text-primary" : "text-success"}>
                                  {p.avgVariance > 0 ? "+" : ""}{Math.round(p.avgVariance / 60)} min
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono">
                                <span className={`fw-bold ${p.pctOnTime >= 80 ? "text-success" : p.pctOnTime >= 50 ? "text-warning" : "text-danger"}`}>
                                  {p.pctOnTime}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* SLA transitions logs list */}
            <Card className="card-premium border bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
              <div className="p-4 border-bottom bg-light bg-opacity-40">
                <Row className="g-3 align-items-center">
                  <Col md={6}>
                    <h5 className="fw-bold text-gray-900 m-0">
                      {isEs ? "Historial de Ejecución de SLA de Servicio" : "Service SLA Execution Log"}
                    </h5>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex gap-2 justify-content-md-end">
                      <div className="position-relative" style={{ minWidth: "200px" }}>
                        <Search className="position-absolute text-muted" size={14} style={{ left: "12px", top: "10px" }} />
                        <Form.Control
                          type="text"
                          placeholder={isEs ? "Buscar..." : "Search..."}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="ps-5 border-gray-200 rounded-xl small"
                          style={{ padding: "7px 12px 7px 32px", fontSize: "12.5px" }}
                        />
                      </div>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border-gray-200 rounded-xl small shadow-none"
                        style={{ width: "140px", fontSize: "12.5px" }}
                      >
                        <option value="all">{isEs ? "Todos" : "All"}</option>
                        <option value="antes">{isEs ? "Antes" : "Early"}</option>
                        <option value="a_tiempo">{isEs ? "A tiempo" : "On Time"}</option>
                        <option value="excedido">{isEs ? "Excedido" : "Exceeded"}</option>
                      </Form.Select>
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="table-responsive">
                <Table hover className="align-middle mb-0 text-dark small">
                  <thead>
                    <tr className="bg-light bg-opacity-40 border-bottom">
                      <th className="px-4 py-3">{isEs ? "Cita / Cliente" : "Client"}</th>
                      <th className="py-3">{isEs ? "Servicio" : "Service"}</th>
                      <th className="py-3">{isEs ? "Profesional" : "Professional"}</th>
                      <th className="py-3 text-center">{isEs ? "Real vs Estimado" : "Actual vs Est"}</th>
                      <th className="py-3 text-center">{isEs ? "Desvío" : "Variance"}</th>
                      <th className="px-4 py-3 text-end">{isEs ? "Resultado SLA" : "SLA Result"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlas.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-5 text-muted">{isEs ? "No se encontraron registros de SLA." : "No SLA records found."}</td></tr>
                    ) : (
                      filteredSlas.map(s => {
                        let statusColor = "success";
                        let statusText = isEs ? "A Tiempo" : "On Time";
                        if (s.status === "excedido") {
                          statusColor = "danger";
                          statusText = isEs ? "Excedido" : "Exceeded";
                        } else if (s.status === "antes") {
                          statusColor = "primary";
                          statusText = isEs ? "Antes" : "Early";
                        }

                        return (
                          <tr key={s.id}>
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center gap-2">
                                <div className="p-1 bg-light text-muted rounded">
                                  <User size={14} />
                                </div>
                                <span className="fw-semibold">{s.clientName}</span>
                              </div>
                            </td>
                            <td className="py-3">{s.serviceName}</td>
                            <td className="py-3">{s.professionalName}</td>
                            <td className="py-3 text-center font-mono">
                              {Math.round(s.actualSec / 60)} min / {Math.round(s.estimatedSec / 60)} min
                            </td>
                            <td className="py-3 text-center font-mono">
                              <span className={s.varianceSec > 0 ? "text-danger" : s.varianceSec < 0 ? "text-primary" : "text-success"}>
                                {s.varianceSec > 0 ? "+" : ""}{Math.round(s.varianceSec / 60)} min
                              </span>
                            </td>
                            <td className="px-4 py-3 text-end">
                              <Badge bg={`${statusColor}-soft`} className={`text-${statusColor} rounded-pill border-0 px-2 py-1`}>
                                {statusText}
                              </Badge>
                              {!s.withinLimit && (
                                <Badge bg="danger-soft" className="text-danger rounded-pill border-0 px-2 py-1 ms-1" title={isEs ? "Superó límite duro" : "Exceeded hard limit"}>
                                  ⚠️ Límite
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card>
          </Tab>

          {/* SLA CONFIG Tab */}
          <Tab eventKey="config" title={isEs ? "Configuración y Tolerancias" : "Configurations & Tolerances"}>
            <Row className="g-4 mb-5">
              <Col lg={6}>
                <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl">
                  <h5 className="fw-black text-gray-900 mb-3">{isEs ? "Configuración Global de SLA" : "Global SLA Configuration"}</h5>
                  {configError && <Alert variant="danger">{configError}</Alert>}
                  <Form onSubmit={(e) => { e.preventDefault(); handleUpdateConfig({ ...globalConfig, serviceId: null }); }}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small-label fw-bold">{isEs ? "Tipo de Tolerancia" : "Tolerance Type"}</Form.Label>
                      <Form.Select
                        value={globalConfig.toleranceType}
                        onChange={(e) => handleUpdateConfig({ ...globalConfig, toleranceType: e.target.value })}
                        className="modern-input"
                      >
                        <option value="percent">{isEs ? "Porcentaje (%)" : "Percentage (%)"}</option>
                        <option value="minutes">{isEs ? "Minutos fijos" : "Fixed minutes"}</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small-label fw-bold">
                        {globalConfig.toleranceType === "percent" ? (isEs ? "Valor de Tolerancia (%)" : "Tolerance Value (%)") : (isEs ? "Valor de Tolerancia (minutos)" : "Tolerance Value (minutes)")}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        value={globalConfig.toleranceValue}
                        onChange={(e) => handleUpdateConfig({ ...globalConfig, toleranceValue: Number(e.target.value) })}
                        className="modern-input"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small-label fw-bold">{isEs ? "Límite Máximo Duro (segundos, opcional)" : "Hard Limit (seconds, optional)"}</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder={isEs ? "Ej: 7200 (2 horas)" : "Ex: 7200 (2 hours)"}
                        value={globalConfig.hardLimitSec || ""}
                        onChange={(e) => handleUpdateConfig({ ...globalConfig, hardLimitSec: e.target.value ? Number(e.target.value) : null })}
                        className="modern-input"
                      />
                    </Form.Group>

                    <Row className="g-2 mb-3">
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="small-label fw-bold">{isEs ? "Estado de Inicio" : "Start Status"}</Form.Label>
                          <Form.Control
                            type="text"
                            value={globalConfig.startStatusKey}
                            onChange={(e) => handleUpdateConfig({ ...globalConfig, startStatusKey: e.target.value })}
                            className="modern-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={6}>
                        <Form.Group>
                          <Form.Label className="small-label fw-bold">{isEs ? "Estado de Fin" : "End Status"}</Form.Label>
                          <Form.Control
                            type="text"
                            value={globalConfig.endStatusKey}
                            onChange={(e) => handleUpdateConfig({ ...globalConfig, endStatusKey: e.target.value })}
                            className="modern-input"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-muted smaller mb-3">
                      {isEs 
                        ? "* Por defecto se inicia al cambiar a CONFIRMED y finaliza en DONE. Si se definen otros, se usarán dichos estados." 
                        : "* Defaults to starting at CONFIRMED and ending at DONE."}
                    </div>
                  </Form>
                </Card>
              </Col>

              <Col lg={6}>
                <Card className="card-premium border p-4 bg-white shadow-sm rounded-2xl mb-4">
                  <h5 className="fw-black text-gray-900 mb-3">{isEs ? "Override por Profesional" : "Professional Overrides"}</h5>
                  <Form onSubmit={handleAddOverride} className="mb-4">
                    <Row className="g-2">
                      <Col sm={4}>
                        <Form.Select
                          value={newEstimate.serviceId}
                          onChange={(e) => setNewEstimate(prev => ({ ...prev, serviceId: e.target.value }))}
                          className="modern-input small"
                          required
                        >
                          <option value="">{isEs ? "Servicio..." : "Service..."}</option>
                          {servicesCatalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Form.Select>
                      </Col>
                      <Col sm={4}>
                        <Form.Select
                          value={newEstimate.workerId}
                          onChange={(e) => setNewEstimate(prev => ({ ...prev, workerId: e.target.value }))}
                          className="modern-input small"
                          required
                        >
                          <option value="">{isEs ? "Profesional..." : "Professional..."}</option>
                          {workers.map(w => <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>)}
                        </Form.Select>
                      </Col>
                      <Col sm={3}>
                        <Form.Control
                          type="number"
                          placeholder={isEs ? "Estimado (min)" : "Minutes"}
                          value={newEstimate.estimatedMinutes}
                          onChange={(e) => setNewEstimate(prev => ({ ...prev, estimatedMinutes: e.target.value }))}
                          className="modern-input small"
                          required
                        />
                      </Col>
                      <Col sm={1} className="d-flex align-items-end">
                        <Button type="submit" variant="dark" className="btn-premium w-100 p-2 d-flex align-items-center justify-content-center">
                          <Plus size={16} />
                        </Button>
                      </Col>
                    </Row>
                  </Form>

                  <div className="table-responsive" style={{ maxHeight: "250px" }}>
                    <Table hover className="align-middle mb-0 text-dark small">
                      <thead>
                        <tr className="bg-light border-bottom">
                          <th>{isEs ? "Servicio" : "Service"}</th>
                          <th>{isEs ? "Profesional" : "Professional"}</th>
                          <th className="text-end">{isEs ? "Estimado" : "Estimate"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimates.length === 0 ? (
                          <tr><td colSpan={3} className="text-center text-muted py-3">{isEs ? "Sin overrides cargados." : "No overrides loaded."}</td></tr>
                        ) : (
                          estimates.map((e, idx) => (
                            <tr key={idx}>
                              <td>{e.service?.name}</td>
                              <td>{e.worker?.firstName} {e.worker?.lastName}</td>
                              <td className="text-end font-mono fw-bold">{Math.round(e.estimatedDurationSec / 60)} min</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>
      )}

      <style>{`
        .bg-success-soft { background-color: rgba(16, 185, 129, 0.08) !important; }
        .bg-danger-soft { background-color: rgba(239, 68, 68, 0.08) !important; }
        .bg-primary-soft { background-color: rgba(59, 130, 246, 0.08) !important; }
        .bg-purple-soft { background-color: rgba(124, 58, 237, 0.08) !important; }
        
        .text-success { color: #10b981 !important; }
        .text-danger { color: #ef4444 !important; }
        .text-primary { color: #3b82f6 !important; }
        .text-purple-700 { color: #6d28d9 !important; }
        
        .card-premium {
          border-color: #f1f5f9 !important;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04) !important;
        }
        .btn-purple-soft {
          background-color: rgba(124, 58, 237, 0.08);
          transition: background-color 0.2s;
        }
        .btn-purple-soft:hover {
          background-color: rgba(124, 58, 237, 0.15) !important;
        }
      `}</style>
    </Container>
  );
}
