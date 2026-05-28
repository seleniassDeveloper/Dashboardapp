import React, { useState, useEffect } from "react";
import { Card, Table, Form, Row, Col, Badge, Spinner, Alert } from "react-bootstrap";
import { ClipboardCheck, Search, Filter, AlertCircle, ChevronDown, ChevronUp, Clock, User, MessageSquare } from "lucide-react";
import api from "../../lib/api.js";

export default function WorkflowExecutionLogs() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/workflows/executions");
      setExecutions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los registros de ejecución desde Neon Cloud.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  const handleExpandToggle = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Filtered Executions
  const filteredList = React.useMemo(() => {
    return executions.filter(e => {
      const matchSearch = e.workflow?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.triggerType?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "all" || e.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [executions, searchTerm, filterStatus]);

  return (
    <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl animate-fade-in">
      <Card.Body className="p-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="h6 fw-black text-gray-900 mb-0.5 d-flex align-items-center gap-2">
              <ClipboardCheck className="text-purple-600 animate-pulse" size={20} />
              <span>Bitácora de Auditoría y Ejecuciones (Logs)</span>
            </h3>
            <p className="text-muted smaller mb-0">Rastrea cada automatización en tiempo real con tiempos de procesamiento y registro de respuestas.</p>
          </div>
          
          <button 
            onClick={fetchExecutions}
            className="btn btn-sm btn-outline-purple rounded-xl px-3 py-2 fw-semibold"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "Actualizar Bitácora"}
          </button>
        </div>

        {error && <Alert variant="danger" className="rounded-2xl">{error}</Alert>}

        {/* SEARCH AND FILTERS */}
        <Row className="g-3 mb-4">
          <Col md={7}>
            <Form.Group className="position-relative">
              <Form.Control
                type="text"
                placeholder="Buscar por nombre de workflow o disparador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border-gray-200 small ps-5 py-2.5 bg-light bg-opacity-30"
              />
              <Search className="position-absolute text-muted" size={16} style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }} />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group className="position-relative">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border-gray-200 small ps-5 py-2.5 bg-light bg-opacity-30"
              >
                <option value="all">🟢 Todos los Estados</option>
                <option value="SUCCESS">✅ Éxito (Exitosas)</option>
                <option value="FAILED">🚨 Error (Fallidas)</option>
                <option value="RUNNING">⚡ Corriendo (En Proceso)</option>
              </Form.Select>
              <Filter className="position-absolute text-muted" size={16} style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }} />
            </Form.Group>
          </Col>
        </Row>

        {/* LOGS LIST */}
        {loading && executions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-2xl border">
            No se encontraron ejecuciones registradas en la bitácora contable.
          </div>
        ) : (
          <div className="d-flex flex-column gap-2.5">
            {filteredList.map((e) => {
              const isExpanded = expandedId === e.id;
              return (
                <div key={e.id} className="border rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover-row-focus">
                  {/* Summary Bar */}
                  <div 
                    onClick={() => handleExpandToggle(e.id)}
                    className="p-3 bg-light bg-opacity-20 d-flex align-items-center justify-content-between flex-wrap gap-3 cursor-pointer select-none"
                    style={{ fontSize: "13px" }}
                  >
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <Badge bg={e.status === "SUCCESS" ? "success-soft" : "danger-soft"} className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${e.status === "SUCCESS" ? "text-success" : "text-danger"}`} style={{ width: "32px", height: "32px" }}>
                        <Clock size={16} />
                      </Badge>
                      <div>
                        <strong className="text-gray-900 d-block">{e.workflow?.name || "Workflow Desconocido"}</strong>
                        <span className="smaller text-muted">Disparador: <strong>{e.triggerType}</strong> • {new Date(e.createdAt).toLocaleString("es-AR")}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div className="text-end">
                        <span className="smaller text-muted d-block">T. Procesamiento</span>
                        <strong className="text-purple-600">{e.runTimeMs} ms</strong>
                      </div>
                      <Badge bg={e.status === "SUCCESS" ? "success" : "danger"} className="rounded-pill px-3 py-1.5 fw-bold">
                        {e.status === "SUCCESS" ? "EXITOSO" : "FALLIDO"}
                      </Badge>
                      {isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
                    </div>
                  </div>

                  {/* Expanded Logs Details */}
                  {isExpanded && (
                    <div className="p-4 bg-light bg-opacity-30 border-top small" style={{ fontSize: "12.5px" }}>
                      <span className="smaller text-muted fw-bold d-block mb-3">Trazabilidad del Flujo de Ejecución (Paso a Paso):</span>
                      
                      {(!e.logs || e.logs.length === 0) ? (
                        <div className="text-muted italic py-2">Sin sub-logs detallados para esta ejecución.</div>
                      ) : (
                        <div className="d-flex flex-column gap-3.5 position-relative ps-4 before-line">
                          {e.logs.map((log) => (
                            <div key={log.id} className="position-relative d-flex align-items-start gap-3">
                              {/* Dot connector */}
                              <div 
                                className="position-absolute bg-white rounded-circle border border-2" 
                                style={{ 
                                  width: "12px", 
                                  height: "12px", 
                                  left: "-25px", 
                                  top: "4px",
                                  borderColor: log.status === "SUCCESS" ? "#10b981" : "#ef4444"
                                }} 
                              />
                              
                              <div className="flex-grow-1 p-3 bg-white rounded-2xl border shadow-sm">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <strong className="text-gray-900">{log.nodeName}</strong>
                                  <Badge bg={log.status === "SUCCESS" ? "success-soft" : "danger-soft"} className={log.status === "SUCCESS" ? "text-success" : "text-danger"}>
                                    {log.nodeType.toUpperCase()}
                                  </Badge>
                                </div>
                                <span className="smaller text-muted d-block mb-1.5">Estado: <strong>{log.status}</strong> • {new Date(log.createdAt).toLocaleTimeString("es-AR")}</span>
                                <div className="p-2 bg-light rounded-xl font-mono text-gray-800" style={{ fontSize: "11px", whiteSpace: "pre-line" }}>
                                  {log.status === "SUCCESS" ? (log.result || "Acción completada con éxito.") : (log.error || "Fallo en ejecución de automatización.")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
      <style>{`
        .before-line::before {
          content: '';
          position: absolute;
          left: 14px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background-color: #e2e8f0;
          z-index: 0;
        }
      `}</style>
    </Card>
  );
}
