import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col, InputGroup } from "react-bootstrap";
import { Save, HelpCircle, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { FORM_TARGET_GROUPS, REGISTRY_SCHEMA_KEY } from "../../config/appFormTargets.js";
import { resolveFieldsFromRegistry } from "../../utils/resolveFormFields.js";
import api from "../../lib/api.js";

export default function ComponentAssignmentEditor() {
  const [registry, setRegistry] = useState([]);
  const [selectedKey, setSelectedKey] = useState(FORM_TARGET_GROUPS[0]?.targets[0]?.key || "");
  const [fieldRefs, setFieldRefs] = useState([]);
  const [componentMeta, setComponentMeta] = useState({ label: "", component: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tabs for configuration column: 'select' (choose fields) or 'order' (reorder them)
  const [editorTab, setEditorTab] = useState("select");

  const selectedTarget = useMemo(() => {
    for (const g of FORM_TARGET_GROUPS) {
      const t = g.targets.find((x) => x.key === selectedKey);
      if (t) return { ...t, entity: g.entity, groupLabel: g.label };
    }
    return null;
  }, [selectedKey]);

  const registryForEntity = useMemo(() => {
    if (!selectedTarget?.entity) return registry;
    return registry.filter((f) => (f.entities || []).includes(selectedTarget.entity));
  }, [registry, selectedTarget]);

  const previewFields = useMemo(
    () => resolveFieldsFromRegistry(registry, fieldRefs),
    [registry, fieldRefs]
  );

  const orderedFields = useMemo(() => {
    return fieldRefs.map((ref) => {
      const base = registry.find((f) => f.id === ref.id);
      return {
        id: ref.id,
        label: base?.label || ref.id,
        type: base?.type || "text",
      };
    });
  }, [fieldRefs, registry]);

  const inactiveFields = useMemo(() => {
    return registryForEntity.filter((f) => !fieldRefs.some((ref) => ref.id === f.id));
  }, [registryForEntity, fieldRefs]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const regRes = await api.get(`/form-schemas/${REGISTRY_SCHEMA_KEY}`);
        setRegistry(Array.isArray(regRes.data?.fields) ? regRes.data.fields : []);
      } catch (e) {
        setError("Error cargando catálogo.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    setEditorTab("select"); // Reset tab on component change
    (async () => {
      try {
        setError("");
        const res = await api.get(`/form-schemas/${selectedKey}`);
        setFieldRefs(Array.isArray(res.data?.fieldRefs) ? res.data.fieldRefs : []);
        setComponentMeta({
          label: res.data?.label || "",
          component: res.data?.component || selectedTarget?.component || "",
        });
      } catch {
        setFieldRefs([]);
      }
    })();
  }, [selectedKey, selectedTarget?.component]);

  const toggleField = (fieldId) => {
    const exists = fieldRefs.find((r) => r.id === fieldId);
    if (exists) {
      setFieldRefs((p) => p.filter((r) => r.id !== fieldId));
    } else {
      setFieldRefs((p) => [...p, { id: fieldId, enabled: true, required: false }]);
    }
  };

  const updateRef = (fieldId, patch) => {
    setFieldRefs((p) => p.map((r) => (r.id === fieldId ? { ...r, ...patch } : r)));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setFieldRefs((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveDown = (index) => {
    if (index === fieldRefs.length - 1) return;
    setFieldRefs((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.put(`/form-schemas/${selectedKey}`, {
        label: componentMeta.label || selectedTarget?.label,
        schemaType: "assignment",
        entity: selectedTarget?.entity,
        component: selectedTarget?.component,
        fieldRefs,
      });
      setSuccess(`Asignación guardada correctamente para ${selectedTarget?.label || selectedKey}.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e?.response?.data?.error || "Error guardando la asignación.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2 small">Cargando asignaciones…</p>
      </div>
    );
  }

  return (
    <Card className="card-premium border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="h4 fw-black text-gray-900 mb-1">Asignar campos a componentes</h2>
            <p className="text-muted small mb-0">
              Elegí un formulario o vista de la app y marcá qué campos del catálogo usa y su orden de visualización.
            </p>
          </div>
          <Button
            variant="dark"
            onClick={save}
            disabled={saving || !selectedKey}
            className="rounded-xl px-4 py-2.5 text-xs fw-bold d-flex align-items-center gap-2 shadow bg-purple-600 hover-bg-purple-700 text-white border-0"
          >
            {saving ? (
              <>
                <Spinner size="sm" animation="border" className="text-white" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar asignación</span>
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="danger" className="border-0 shadow-sm rounded-xl mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="border-0 shadow-sm rounded-xl mb-4">
            {success}
          </Alert>
        )}

        <Row className="g-4">
          {/* Columna Izquierda: Configuración de Asignación */}
          <Col lg={5} className="d-flex flex-column gap-3.5">
            <div>
              <Form.Group>
                <Form.Label className="small text-muted mb-1.5 fw-bold text-xs uppercase">
                  Componente / pantalla de destino
                </Form.Label>
                <Form.Select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="rounded-xl border-gray-200 focus-ring-purple font-semibold text-gray-800"
                >
                  {FORM_TARGET_GROUPS.map((g) => (
                    <optgroup key={g.entity} label={g.label}>
                      {g.targets.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedTarget && (
                <div className="d-flex align-items-center justify-content-between mt-2.5 px-3 py-2 rounded-xl bg-light border">
                  <span className="text-xxs text-muted font-bold uppercase">Clase React</span>
                  <code className="text-xxs text-purple-700 font-mono fw-bold">
                    {selectedTarget.component}
                  </code>
                </div>
              )}
            </div>

            <div className="d-flex flex-column gap-3.5 mt-2">
              {/* SECCIÓN 1: CAMPOS ACTIVOS (ORDENABLES) */}
              <div>
                <Form.Label className="small text-muted mb-2 fw-bold text-xs uppercase block d-flex align-items-center justify-content-between">
                  <span>1. Campos activos y su orden ({fieldRefs.length})</span>
                  <Badge bg="purple" className="bg-purple-100 text-purple-700 fw-bold rounded-lg text-xxs px-2 py-0.5">
                    Se muestran en este orden
                  </Badge>
                </Form.Label>
                
                <div
                  className="d-flex flex-column gap-2 overflow-auto scrollbar-none mb-3"
                  style={{ maxHeight: 280, paddingRight: "4px" }}
                >
                  {fieldRefs.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-2xl bg-light text-muted small">
                      Ningún campo seleccionado. Activa campos del catálogo abajo.
                    </div>
                  ) : (
                    fieldRefs.map((ref, idx) => {
                      const baseField = registry.find((f) => f.id === ref.id);
                      return (
                        <div
                          key={ref.id}
                          className="p-2.5 border border-purple-500 bg-purple-50 bg-opacity-30 rounded-2xl shadow-sm d-flex align-items-center justify-content-between hover-bg-light transition-all animate-fade-in"
                        >
                          <div className="d-flex align-items-center gap-2.5" style={{ flex: 1, minWidth: 0 }}>
                            <span
                              className="badge bg-purple bg-opacity-10 text-purple-700 fw-bold rounded-lg d-flex align-items-center justify-content-center font-mono"
                              style={{ width: "22px", height: "22px", fontSize: "10px" }}
                            >
                              {idx + 1}
                            </span>
                            <Form.Check
                              type="checkbox"
                              id={`active-${ref.id}`}
                              checked={true}
                              onChange={() => toggleField(ref.id)}
                              className="custom-checkbox m-0 fw-semibold"
                            />
                            <div className="d-flex flex-column text-truncate" style={{ minWidth: 0 }}>
                              <span className="fw-bold text-gray-800 text-xs text-truncate">
                                {baseField?.label || ref.id}
                              </span>
                              <span className="text-xxs text-muted font-mono text-truncate">
                                {ref.id}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            {/* Required Switch */}
                            <Form.Check
                              type="switch"
                              id={`active-req-${ref.id}`}
                              label={
                                <span className={`text-xxs fw-bold uppercase ${ref.required ? "text-danger" : "text-muted"}`} style={{ fontSize: "9px" }}>
                                  {ref.required ? "Oblig" : "Opc"}
                                </span>
                              }
                              checked={!!ref.required}
                              onChange={(e) => updateRef(ref.id, { required: e.target.checked })}
                              className="custom-switch m-0"
                            />

                            {/* Position Controls */}
                            <div className="d-flex gap-1">
                              <Button
                                variant="light"
                                size="sm"
                                className="p-1 rounded-lg border hover-bg-gray-100 btn-order-control"
                                disabled={idx === 0}
                                onClick={() => moveUp(idx)}
                                title="Mover arriba"
                                style={{ padding: "2px 4px", fontSize: "10px" }}
                              >
                                <ChevronUp size={13} className="text-gray-700" />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="p-1 rounded-lg border hover-bg-gray-100 btn-order-control"
                                disabled={idx === fieldRefs.length - 1}
                                onClick={() => moveDown(idx)}
                                title="Mover abajo"
                                style={{ padding: "2px 4px", fontSize: "10px" }}
                              >
                                <ChevronDown size={13} className="text-gray-700" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: CAMPOS DISPONIBLES */}
              <div>
                <Form.Label className="small text-muted mb-2 fw-bold text-xs uppercase block">
                  2. Campos disponibles en catálogo
                </Form.Label>
                
                <div
                  className="d-flex flex-column gap-2 overflow-auto scrollbar-none"
                  style={{ maxHeight: 220, paddingRight: "4px" }}
                >
                  {inactiveFields.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-2xl bg-light text-muted small">
                      Todos los campos del catálogo están activos.
                    </div>
                  ) : (
                    inactiveFields.map((f) => (
                      <div
                        key={f.id}
                        className="p-2.5 border border-gray-200 bg-white rounded-2xl hover-bg-gray-50 transition-all d-flex align-items-center justify-content-between"
                      >
                        <Form.Check
                          type="checkbox"
                          id={`available-${f.id}`}
                          label={
                            <div className="d-flex flex-column ms-1">
                              <span className="fw-bold text-gray-800 text-xs">{f.label}</span>
                              <span className="text-xxs text-muted font-mono">
                                {f.id} · {f.type}
                              </span>
                            </div>
                          }
                          checked={false}
                          onChange={() => toggleField(f.id)}
                          className="custom-checkbox m-0 fw-semibold align-items-start"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Col>

          {/* Columna Derecha: Vista Previa Dinámica interactiva */}
          <Col lg={7}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="small text-muted mb-0 fw-bold text-xs uppercase d-flex align-items-center gap-1.5">
                <Eye size={14} className="text-purple-600" />
                <span>Vista previa interactiva ({previewFields.length} campos)</span>
              </Form.Label>
              <Badge
                bg="purple"
                className="bg-purple-100 text-purple-700 fw-bold rounded-lg text-xxs px-2.5 py-1"
              >
                Visualización de Formulario
              </Badge>
            </div>

            <div
              className="border rounded-2xl p-4 bg-gray-50 bg-opacity-70 overflow-auto shadow-inner"
              style={{ minHeight: 480, maxHeight: 520 }}
            >
              {previewFields.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center text-muted gap-2">
                  <HelpCircle size={32} className="text-gray-300" />
                  <p className="fw-medium small m-0">
                    Seleccioná y activá campos del catálogo a la izquierda para armar el formulario.
                  </p>
                </div>
              ) : (
                <Form className="custom-form d-flex flex-column gap-3 bg-white p-4 rounded-2xl border shadow-sm">
                  <h3 className="h6 text-purple-950 font-black border-bottom pb-2 mb-1 d-flex align-items-center gap-2">
                    <span>{selectedTarget?.label || "Vista de Formulario"}</span>
                  </h3>
                  <Row className="g-3">
                    {previewFields.map((f) => {
                      let inputMock;
                      if (f.type === "textarea") {
                        inputMock = (
                          <Form.Control
                            as="textarea"
                            rows={2}
                            disabled
                            placeholder={`Ej: Notas sobre ${f.label.toLowerCase()}`}
                            className="rounded-lg bg-gray-50 border-gray-200"
                          />
                        );
                      } else if (f.type === "select") {
                        inputMock = (
                          <Form.Select disabled className="rounded-lg bg-gray-50 border-gray-200">
                            <option>{(f.options || [])[0]?.label || "Seleccionar…"}</option>
                          </Form.Select>
                        );
                      } else if (f.type === "services") {
                        inputMock = (
                          <div className="bg-light p-2.5 rounded-xl border border-gray-200 small text-muted font-semibold text-xxs">
                            🛠️ [MÓDULO: Especialidades y servicios calificados del profesional]
                          </div>
                        );
                      } else if (f.type === "schedule") {
                        inputMock = (
                          <div className="bg-light p-2.5 rounded-xl border border-gray-200 small text-muted font-semibold text-xxs">
                            📅 [MÓDULO: Planificación de jornadas horarias semanales y descansos]
                          </div>
                        );
                      } else if (f.type === "servicePricing") {
                        inputMock = (
                          <div className="bg-light p-2.5 rounded-xl border border-gray-200 small text-muted font-semibold text-xxs">
                            💰 [MÓDULO: Esquema de comisiones por facturación y objetivos
                            mensuales]
                          </div>
                        );
                      } else if (f.type === "email") {
                        inputMock = (
                          <Form.Control
                            type="email"
                            disabled
                            placeholder="nombre@correo.com"
                            className="rounded-lg bg-gray-50 border-gray-200"
                          />
                        );
                      } else if (f.type === "phone") {
                        inputMock = (
                          <Form.Control
                            type="tel"
                            disabled
                            placeholder="+54 9 11 2345-6789"
                            className="rounded-lg bg-gray-50 border-gray-200"
                          />
                        );
                      } else if (f.type === "currency") {
                        inputMock = (
                          <InputGroup size="sm" className="rounded-lg overflow-hidden border border-gray-200">
                            <InputGroup.Text className="bg-light">$</InputGroup.Text>
                            <Form.Control
                              type="number"
                              disabled
                              placeholder="0"
                              className="bg-gray-50 border-0"
                            />
                          </InputGroup>
                        );
                      } else {
                        inputMock = (
                          <Form.Control
                            type="text"
                            disabled
                            placeholder={`Ej: ${f.label}`}
                            className="rounded-lg bg-gray-50 border-gray-200"
                          />
                        );
                      }

                      const isWide =
                        f.type === "services" ||
                        f.type === "schedule" ||
                        f.type === "servicePricing" ||
                        f.type === "textarea";

                      return (
                        <Col md={isWide ? 12 : 6} key={f.id}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-gray-700 d-flex justify-content-between align-items-center mb-1">
                              <span>
                                {f.label} {f.required && <span className="text-danger">*</span>}
                              </span>
                              <span className="text-xxs text-muted font-mono">{f.id}</span>
                            </Form.Label>
                            {inputMock}
                          </Form.Group>
                        </Col>
                      );
                    })}
                  </Row>
                </Form>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
