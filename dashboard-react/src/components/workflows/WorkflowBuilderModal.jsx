import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, Button, Form, Alert, Spinner, Row, Col, Badge } from "react-bootstrap";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { TRIGGER_META, ACTION_META } from "../../config/workflowCatalog.js";

const API = "http://localhost:3001/api";

function ConfigFields({ fields, config, onChange }) {
  if (!fields?.length) return <p className="text-muted small mb-0">Sin configuración extra.</p>;

  return (
    <Row className="g-2 mt-1">
      {fields.map((f) => (
        <Col md={6} key={f.key}>
          <Form.Label className="small mb-0">{f.label}</Form.Label>
          {f.type === "select" ? (
            <Form.Select
              size="sm"
              value={config[f.key] ?? f.default ?? ""}
              onChange={(e) => onChange({ ...config, [f.key]: e.target.value })}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Form.Select>
          ) : (
            <Form.Control
              size="sm"
              type={f.type === "number" ? "number" : "text"}
              value={config[f.key] ?? f.default ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          )}
        </Col>
      ))}
    </Row>
  );
}

export default function WorkflowBuilderModal({
  show,
  onHide,
  businessModels = [],
  initialData = null,
  presetBusinessModelId = null,
  onSaved,
}) {
  const isEdit = Boolean(initialData?.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessModelId, setBusinessModelId] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [triggerType, setTriggerType] = useState("");
  const [triggerConfig, setTriggerConfig] = useState({});
  const [steps, setSteps] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [screens, setScreens] = useState([]);
  const [screenFieldOptions, setScreenFieldOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const model = useMemo(
    () => businessModels.find((m) => m.id === businessModelId),
    [businessModels, businessModelId]
  );

  const allowedTriggers = model?.allowedTriggers || [];
  const allowedActions = model?.allowedActions || [];

  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        const res = await axios.get(`${API}/form-schemas/resolve/assign.workflow.screen`);
        setScreenFieldOptions(res.data?.fields || []);
      } catch {
        setScreenFieldOptions([]);
      }
    })();
  }, [show]);

  useEffect(() => {
    if (!show) return;
    setError("");
    setSaving(false);

    if (isEdit) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setBusinessModelId(initialData.businessModelId || "");
      setStatus(initialData.status || "DRAFT");
      setTriggerType(initialData.trigger?.type || "");
      setTriggerConfig(initialData.trigger?.config || {});
      setSteps(initialData.steps || []);
      setTransitions(initialData.transitions || []);
      setScreens(initialData.screens || []);
    } else {
      setName("");
      setDescription("");
      setBusinessModelId(presetBusinessModelId || businessModels[0]?.id || "");
      setStatus("DRAFT");
      setTriggerType("");
      setTriggerConfig({});
      setSteps([]);
      setTransitions([]);
      setScreens([]);
    }
  }, [show, isEdit, initialData, presetBusinessModelId, businessModels]);

  useEffect(() => {
    if (!show || isEdit) return;
    if (triggerType && !allowedTriggers.includes(triggerType)) {
      setTriggerType(allowedTriggers[0] || "");
      setTriggerConfig({});
    }
  }, [businessModelId, allowedTriggers, show, isEdit, triggerType]);

  const addStep = () => {
    const type = allowedActions[0];
    if (!type) return;
    const meta = ACTION_META[type];
    const config = {};
    for (const f of meta?.configFields || []) {
      if (f.default !== undefined) config[f.key] = f.default;
    }
    setSteps((prev) => [...prev, { id: `step_${Date.now()}`, type, config }]);
  };

  const valid = name.trim() && businessModelId && triggerType && steps.length > 0;

  const handleSave = async () => {
    if (!valid) {
      setError("Completá nombre, modelo, disparador y al menos una acción.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        businessModelId,
        status,
        trigger: { type: triggerType, config: triggerConfig },
        steps,
        transitions,
        screens,
      };
      const url = isEdit ? `${API}/workflows/${initialData.id}` : `${API}/workflows`;
      const res = isEdit ? await axios.put(url, payload) : await axios.post(url, payload);
      onSaved?.(res.data);
      onHide?.();
    } catch (e) {
      setError(e?.response?.data?.error || "Error guardando workflow.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{isEdit ? "Editar workflow" : "Crear workflow"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="g-3 mb-3">
          <Col md={8}>
            <Form.Label>Nombre *</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Recordatorio 24h" />
          </Col>
          <Col md={4}>
            <Form.Label>Estado</Form.Label>
            <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="DRAFT">Borrador</option>
              <option value="ACTIVE">Activo</option>
              <option value="PAUSED">Pausado</option>
            </Form.Select>
          </Col>
          <Col md={12}>
            <Form.Label>Modelo de negocio *</Form.Label>
            <Form.Select value={businessModelId} onChange={(e) => setBusinessModelId(e.target.value)}>
              <option value="">Seleccionar…</option>
              {businessModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Form.Select>
            {model?.description && <Form.Text muted>{model.description}</Form.Text>}
          </Col>
          <Col md={12}>
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Col>
        </Row>

        <div className="p-3 rounded-3 border mb-3 bg-light">
          <h6 className="fw-bold small text-uppercase text-muted mb-2">Disparador (cuándo corre)</h6>
          <Form.Select
            value={triggerType}
            onChange={(e) => {
              const t = e.target.value;
              setTriggerType(t);
              const meta = TRIGGER_META[t];
              const cfg = {};
              for (const f of meta?.configFields || []) {
                if (f.default !== undefined) cfg[f.key] = f.default;
              }
              setTriggerConfig(cfg);
            }}
            className="mb-2"
          >
            <option value="">Elegir disparador…</option>
            {allowedTriggers.map((t) => (
              <option key={t} value={t}>
                {TRIGGER_META[t]?.label || t}
              </option>
            ))}
          </Form.Select>
          {triggerType && (
            <>
              <p className="small text-muted mb-2">{TRIGGER_META[triggerType]?.description}</p>
              <ConfigFields
                fields={TRIGGER_META[triggerType]?.configFields}
                config={triggerConfig}
                onChange={setTriggerConfig}
              />
            </>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold small text-uppercase text-muted mb-0">Acciones (qué hace)</h6>
          <Button variant="outline-dark" size="sm" onClick={addStep} disabled={!allowedActions.length}>
            <Plus size={14} className="me-1" /> Agregar acción
          </Button>
        </div>

        {steps.length === 0 ? (
          <p className="text-muted small">Agregá al menos una acción al flujo.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="p-3 border rounded-3 bg-white">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <GripVertical size={16} className="text-muted" />
                  <Badge bg="secondary">Paso {index + 1}</Badge>
                  <Form.Select
                    size="sm"
                    className="ms-auto"
                    style={{ maxWidth: 220 }}
                    value={step.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const meta = ACTION_META[type];
                      const config = {};
                      for (const f of meta?.configFields || []) {
                        if (f.default !== undefined) config[f.key] = f.default;
                      }
                      setSteps((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, type, config } : s))
                      );
                    }}
                  >
                    {allowedActions.map((a) => (
                      <option key={a} value={a}>
                        {ACTION_META[a]?.label || a}
                      </option>
                    ))}
                  </Form.Select>
                  <Button
                    variant="light"
                    size="sm"
                    className="text-danger p-1"
                    onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <ConfigFields
                  fields={ACTION_META[step.type]?.configFields}
                  config={step.config || {}}
                  onChange={(config) =>
                    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, config } : s)))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <hr className="my-4" />

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold small text-uppercase text-muted mb-0">Transiciones del flujo</h6>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() =>
              setTransitions((p) => [
                ...p,
                {
                  id: `tr_${Date.now()}`,
                  from: p.length ? p[p.length - 1].to || "trigger" : "trigger",
                  to: steps[0]?.id || "end",
                  label: "Siguiente",
                },
              ])
            }
          >
            <Plus size={14} className="me-1" /> Transición
          </Button>
        </div>
        <p className="text-muted small">
          Conectá disparador → pasos → fin. Podés enlazar pantallas a una transición.
        </p>
        {transitions.length === 0 ? (
          <p className="text-muted small">Sin transiciones (flujo lineal por orden de pasos).</p>
        ) : (
          transitions.map((tr, idx) => (
            <div key={tr.id} className="p-3 border rounded-3 mb-2 bg-white">
              <Row className="g-2 align-items-end">
                <Col md={3}>
                  <Form.Label className="small">Desde</Form.Label>
                  <Form.Select
                    size="sm"
                    value={tr.from}
                    onChange={(e) =>
                      setTransitions((p) => p.map((t, i) => (i === idx ? { ...t, from: e.target.value } : t)))
                    }
                  >
                    <option value="trigger">Disparador</option>
                    {steps.map((s) => (
                      <option key={s.id} value={s.id}>
                        Paso: {ACTION_META[s.type]?.label || s.type}
                      </option>
                    ))}
                    <option value="end">Fin</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small">Hacia</Form.Label>
                  <Form.Select
                    size="sm"
                    value={tr.to}
                    onChange={(e) =>
                      setTransitions((p) => p.map((t, i) => (i === idx ? { ...t, to: e.target.value } : t)))
                    }
                  >
                    {steps.map((s) => (
                      <option key={s.id} value={s.id}>
                        Paso: {ACTION_META[s.type]?.label || s.type}
                      </option>
                    ))}
                    <option value="end">Fin</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small">Etiqueta</Form.Label>
                  <Form.Control
                    size="sm"
                    value={tr.label || ""}
                    onChange={(e) =>
                      setTransitions((p) => p.map((t, i) => (i === idx ? { ...t, label: e.target.value } : t)))
                    }
                  />
                </Col>
                <Col md={2}>
                  <Button
                    variant="light"
                    size="sm"
                    className="text-danger"
                    onClick={() => setTransitions((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={14} />
                  </Button>
                </Col>
              </Row>
            </div>
          ))
        )}

        <hr className="my-4" />

        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="fw-bold small text-uppercase text-muted mb-0">Pantallas en el flujo</h6>
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() =>
              setScreens((p) => [
                ...p,
                {
                  id: `scr_${Date.now()}`,
                  title: "Nueva pantalla",
                  message: "",
                  fieldIds: [],
                  transitionId: transitions[0]?.id || null,
                },
              ])
            }
          >
            <Plus size={14} className="me-1" /> Pantalla
          </Button>
        </div>
        {screens.length === 0 ? (
          <p className="text-muted small">Opcional: formularios que se muestran durante el workflow.</p>
        ) : (
          screens.map((scr, idx) => (
            <div key={scr.id} className="p-3 border rounded-3 mb-2 bg-light">
              <Row className="g-2">
                <Col md={6}>
                  <Form.Label className="small">Título</Form.Label>
                  <Form.Control
                    size="sm"
                    value={scr.title}
                    onChange={(e) =>
                      setScreens((p) => p.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s)))
                    }
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small">Mostrar en transición</Form.Label>
                  <Form.Select
                    size="sm"
                    value={scr.transitionId || ""}
                    onChange={(e) =>
                      setScreens((p) =>
                        p.map((s, i) => (i === idx ? { ...s, transitionId: e.target.value || null } : s))
                      )
                    }
                  >
                    <option value="">Ninguna</option>
                    {transitions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label || t.id}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={12}>
                  <Form.Label className="small">Mensaje</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    size="sm"
                    value={scr.message || ""}
                    onChange={(e) =>
                      setScreens((p) => p.map((s, i) => (i === idx ? { ...s, message: e.target.value } : s)))
                    }
                  />
                </Col>
                <Col md={12}>
                  <Form.Label className="small">Campos (catálogo workflow)</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {screenFieldOptions.map((f) => (
                      <Form.Check
                        key={f.id}
                        type="checkbox"
                        id={`scr-f-${scr.id}-${f.id}`}
                        label={f.label}
                        checked={(scr.fieldIds || []).includes(f.id)}
                        onChange={() => {
                          setScreens((p) =>
                            p.map((s, i) => {
                              if (i !== idx) return s;
                              const ids = s.fieldIds || [];
                              const next = ids.includes(f.id)
                                ? ids.filter((x) => x !== f.id)
                                : [...ids, f.id];
                              return { ...s, fieldIds: next };
                            })
                          );
                        }}
                      />
                    ))}
                  </div>
                </Col>
              </Row>
              <Button
                variant="link"
                size="sm"
                className="text-danger p-0 mt-2"
                onClick={() => setScreens((p) => p.filter((_, i) => i !== idx))}
              >
                Eliminar pantalla
              </Button>
            </div>
          ))
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleSave} disabled={!valid || saving}>
          {saving ? <Spinner size="sm" /> : isEdit ? "Guardar" : "Crear workflow"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
