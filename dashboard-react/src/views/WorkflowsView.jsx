import React, { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Badge, Button, Spinner, Alert, Form } from "react-bootstrap";
import { Play, Plus, GitBranch, Zap, Pencil, Trash2, Copy, Pause, Scissors, User, HeartPulse, Dumbbell, Sparkles, Settings } from "lucide-react";
import axios from "axios";
import WorkflowBuilderModal from "../components/workflows/WorkflowBuilderModal.jsx";
import BusinessModelModal from "../components/workflows/BusinessModelModal.jsx";
import { triggerSummary, stepsSummary } from "../config/workflowCatalog.js";

const API = "http://localhost:3001/api";

const ICON_MAP = {
  scissors: Scissors,
  user: User,
  "heart-pulse": HeartPulse,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
  settings: Settings,
};

function ModelIcon({ icon, size = 20 }) {
  const Icon = ICON_MAP[icon] || GitBranch;
  return <Icon size={size} />;
}

export default function WorkflowsView() {
  const [businessModels, setBusinessModels] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState({ totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0 });
  const [filterModelId, setFilterModelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState(null);
  const [presetModelId, setPresetModelId] = useState(null);
  const [showModelModal, setShowModelModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [modelsRes, statsRes] = await Promise.all([
        axios.get(`${API}/business-models`),
        axios.get(`${API}/workflows/stats/summary`),
      ]);
      setBusinessModels(Array.isArray(modelsRes.data) ? modelsRes.data : []);
      setStats(statsRes.data || {});

      const params = filterModelId ? { businessModelId: filterModelId } : {};
      const wfRes = await axios.get(`${API}/workflows`, { params });
      setWorkflows(Array.isArray(wfRes.data) ? wfRes.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Error cargando workflows.");
    } finally {
      setLoading(false);
    }
  }, [filterModelId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = (modelId = null) => {
    setEditing(null);
    setPresetModelId(modelId);
    setShowBuilder(true);
  };

  const openEdit = (wf) => {
    setEditing(wf);
    setPresetModelId(null);
    setShowBuilder(true);
  };

  const createFromTemplate = async (model, templateIndex) => {
    try {
      const res = await axios.post(`${API}/workflows/from-template`, {
        businessModelId: model.id,
        templateIndex,
      });
      setEditing(res.data);
      setPresetModelId(null);
      setShowBuilder(true);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Error con plantilla.");
    }
  };

  const toggleStatus = async (wf) => {
    const next = wf.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await axios.patch(`${API}/workflows/${wf.id}/status`, { status: next });
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Error cambiando estado.");
    }
  };

  const deleteWorkflow = async (wf) => {
    if (!window.confirm(`¿Eliminar "${wf.name}"?`)) return;
    try {
      await axios.delete(`${API}/workflows/${wf.id}`);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Error eliminando.");
    }
  };

  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold h3">Workflows</h1>
          <p className="text-muted mb-0">
            Procesos automáticos según tu modelo de negocio: salón, clínica, gym y más.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant="outline-dark" onClick={() => setShowModelModal(true)}>
            Nuevo modelo de negocio
          </Button>
          <Button
            variant="dark"
            className="d-flex align-items-center gap-2 px-4 py-2"
            style={{ borderRadius: "10px" }}
            onClick={() => openCreate()}
          >
            <Plus size={18} />
            Crear Workflow
          </Button>
        </div>
      </header>

      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

      <Row className="g-4 mb-4">
        <Col md={12}>
          <div className="card-premium p-4 d-flex flex-wrap gap-4 align-items-center">
            <div>
              <div className="text-muted small mb-1">Workflows activos</div>
              <div className="h4 fw-bold m-0">{stats.activeWorkflows}</div>
            </div>
            <div className="vr d-none d-md-block" />
            <div>
              <div className="text-muted small mb-1">Total configurados</div>
              <div className="h4 fw-bold m-0">{stats.totalWorkflows}</div>
            </div>
            <div className="vr d-none d-md-block" />
            <div>
              <div className="text-muted small mb-1">Ejecuciones registradas</div>
              <div className="h4 fw-bold m-0 text-success">{stats.totalRuns}</div>
            </div>
            <div className="ms-md-auto" style={{ minWidth: 220 }}>
              <Form.Label className="small text-muted">Filtrar por modelo</Form.Label>
              <Form.Select value={filterModelId} onChange={(e) => setFilterModelId(e.target.value)} size="sm">
                <option value="">Todos los modelos</option>
                {businessModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={12}>
          <h2 className="h6 fw-bold text-uppercase text-muted mb-3">Modelos de negocio</h2>
          <Row className="g-3">
            {businessModels.map((model) => (
              <Col xl={4} md={6} key={model.id}>
                <div className="card-premium p-4 h-100">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-light text-primary">
                      <ModelIcon icon={model.icon} />
                    </div>
                    <div>
                      <h3 className="h6 fw-bold m-0">{model.name}</h3>
                      <p className="text-muted small mb-0">{model.description}</p>
                    </div>
                  </div>
                  <div className="small text-muted mb-3">
                    {model.workflowCount || 0} workflow(s) · {model.allowedTriggers?.length || 0} disparadores
                  </div>
                  {(model.templateWorkflows || []).length > 0 ? (
                    <div className="d-flex flex-column gap-1 mb-3">
                      <span className="small fw-semibold">Plantillas:</span>
                      {model.templateWorkflows.map((tpl, idx) => (
                        <Button
                          key={idx}
                          variant="outline-secondary"
                          size="sm"
                          className="text-start d-flex align-items-center gap-2"
                          onClick={() => createFromTemplate(model, idx)}
                        >
                          <Copy size={12} /> {tpl.name}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  <Button variant="dark" size="sm" className="w-100" onClick={() => openCreate(model.id)}>
                    <Plus size={14} className="me-1" /> Workflow para {model.name}
                  </Button>
                </div>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={12}>
          <h2 className="h6 fw-bold text-uppercase text-muted mb-3">Tus workflows</h2>
          {loading ? (
            <div className="text-center py-5 text-muted">
              <Spinner size="sm" className="me-2" /> Cargando…
            </div>
          ) : workflows.length === 0 ? (
            <div className="card-premium p-5 text-center">
              <GitBranch size={48} className="text-muted mb-3 opacity-25" />
              <h4 className="fw-bold">Sin workflows todavía</h4>
              <p className="text-muted">Elegí un modelo de negocio y una plantilla, o creá uno desde cero.</p>
              <Button variant="dark" onClick={() => openCreate()}>
                Crear primer workflow
              </Button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="card-premium p-4 d-flex align-items-center justify-content-between flex-wrap gap-3 hover-scale"
                >
                  <div className="d-flex align-items-center gap-4">
                    <div
                      className="p-3 rounded-xl bg-light"
                      style={{ color: wf.status === "ACTIVE" ? "var(--brand-accent, #198754)" : "var(--text-muted)" }}
                    >
                      <GitBranch size={24} />
                    </div>
                    <div>
                      <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2 flex-wrap">
                        {wf.name}
                        {wf.businessModel && (
                          <Badge bg="light" text="dark" className="fw-normal">
                            {wf.businessModel.name}
                          </Badge>
                        )}
                      </h3>
                      <div className="d-flex align-items-center gap-2 text-muted small mt-1 flex-wrap">
                        <Zap size={14} /> {triggerSummary(wf.trigger)}
                        <span className="opacity-50">•</span>
                        <span>{stepsSummary(wf.steps)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <div className="text-end me-2">
                      <div className="fw-bold small">{wf.runCount} runs</div>
                      <Badge
                        bg={wf.status === "ACTIVE" ? "success" : wf.status === "PAUSED" ? "secondary" : "warning"}
                        className="small"
                      >
                        {wf.status}
                      </Badge>
                    </div>
                    <Button variant="light" className="p-2 border" title="Editar" onClick={() => openEdit(wf)}>
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="light"
                      className="p-2 border"
                      title={wf.status === "ACTIVE" ? "Pausar" : "Activar"}
                      onClick={() => toggleStatus(wf)}
                    >
                      {wf.status === "ACTIVE" ? <Pause size={16} /> : <Play size={16} />}
                    </Button>
                    <Button variant="light" className="p-2 border text-danger" title="Eliminar" onClick={() => deleteWorkflow(wf)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Col>
      </Row>

      <WorkflowBuilderModal
        show={showBuilder}
        onHide={() => setShowBuilder(false)}
        businessModels={businessModels}
        initialData={editing}
        presetBusinessModelId={presetModelId}
        onSaved={load}
      />

      <BusinessModelModal
        show={showModelModal}
        onHide={() => setShowModelModal(false)}
        onSaved={load}
      />
    </Container>
  );
}
