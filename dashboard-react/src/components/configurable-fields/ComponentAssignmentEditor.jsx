import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col, InputGroup } from "react-bootstrap";
import { Save, HelpCircle, Eye, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
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
  const [draggedIndex, setDraggedIndex] = useState(null);

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

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setFieldRefs((prev) => {
      const next = [...prev];
      const draggedItem = next[draggedIndex];
      next.splice(draggedIndex, 1);
      next.splice(index, 0, draggedItem);
      return next;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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
          {/* Columna Izquierda: Paleta de Campos */}
          <Col lg={4} className="d-flex flex-column gap-4">
            <div className="bg-white p-4 rounded-3xl border shadow-sm">
              <Form.Group>
                <Form.Label className="small text-muted mb-2 fw-bold text-xs uppercase d-flex align-items-center gap-2">
                  <div className="bg-purple text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 18, height: 18, fontSize: 10 }}>1</div>
                  Destino de la Asignación
                </Form.Label>
                <Form.Select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="rounded-xl border-gray-200 focus-ring-purple font-semibold text-gray-800 mb-2"
                  size="lg"
                  style={{ fontSize: "14px" }}
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
                {selectedTarget && (
                  <div className="d-flex align-items-center justify-content-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-xxs text-muted font-bold uppercase">Clase React</span>
                    <code className="text-xxs text-purple-700 font-mono fw-bold">
                      {selectedTarget.component}
                    </code>
                  </div>
                )}
              </Form.Group>
            </div>

            <div>
              <Form.Label className="small text-muted mb-3 fw-bold text-xs uppercase d-flex align-items-center gap-2">
                <div className="bg-purple text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 18, height: 18, fontSize: 10 }}>2</div>
                Paleta de Campos Disponibles
              </Form.Label>
              
              <div
                className="d-flex flex-column gap-2 overflow-auto scrollbar-none pb-2"
                style={{ maxHeight: 400, paddingRight: "4px" }}
              >
                {inactiveFields.length === 0 ? (
                  <div className="text-center py-5 border border-dashed border-gray-300 rounded-3xl bg-light text-muted small d-flex flex-column align-items-center gap-2">
                    <i className="fa-solid fa-check-circle text-success fs-3 opacity-50"></i>
                    <span>¡Todos los campos están en uso!</span>
                  </div>
                ) : (
                  inactiveFields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleField(f.id)}
                      className="text-start p-3 border border-gray-200 bg-white rounded-2xl hover-bg-gray-50 transition-all d-flex align-items-center justify-content-between w-100 shadow-sm add-field-btn group"
                    >
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-gray-800 text-sm mb-0.5">{f.label}</span>
                        <span className="text-xxs text-muted font-mono bg-light px-1.5 py-0.5 rounded border d-inline-block w-auto" style={{ width: "fit-content" }}>
                          {f.type}
                        </span>
                      </div>
                      <div className="text-purple-600 bg-purple-50 rounded-circle d-flex align-items-center justify-content-center add-icon transition-transform" style={{ width: 32, height: 32 }}>
                        <i className="fa-solid fa-plus text-xs"></i>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Col>

          {/* Columna Derecha: Canvas Interactivo */}
          <Col lg={8}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Label className="small text-muted mb-0 fw-bold text-xs uppercase d-flex align-items-center gap-2">
                <div className="bg-purple text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 18, height: 18, fontSize: 10 }}>3</div>
                Lienzo del Formulario ({previewFields.length} campos)
              </Form.Label>
              <Badge
                bg="purple"
                className="bg-purple-100 text-purple-700 fw-bold rounded-lg text-xxs px-3 py-1.5 d-flex align-items-center gap-1.5"
              >
                <Eye size={12} />
                Visualización Interactiva
              </Badge>
            </div>

            <div
              className="border border-gray-200 rounded-3xl p-4 p-md-5 bg-gray-50 overflow-auto shadow-inner position-relative"
              style={{ minHeight: 550, maxHeight: 650 }}
            >
              {previewFields.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5 text-center text-muted gap-3 mt-5">
                  <div className="bg-white p-4 rounded-circle shadow-sm">
                    <HelpCircle size={48} className="text-purple-300" />
                  </div>
                  <div>
                    <h4 className="h5 fw-bold text-gray-800 mb-1">El lienzo está vacío</h4>
                    <p className="small text-muted m-0">
                      Hacé clic en los campos de la paleta a la izquierda para añadirlos aquí.
                    </p>
                  </div>
                </div>
              ) : (
                <Form className="custom-form d-flex flex-column gap-4 bg-white p-4 p-md-5 rounded-3xl border shadow-sm mx-auto" style={{ maxWidth: 800 }}>
                  <div className="border-bottom pb-3 mb-2 d-flex align-items-center gap-3">
                    <div className="bg-purple text-white rounded-xl p-2 shadow-sm d-flex">
                      <i className="fa-solid fa-table-list"></i>
                    </div>
                    <div>
                      <h3 className="h5 text-gray-900 font-black m-0">
                        {selectedTarget?.label || "Formulario"}
                      </h3>
                      <p className="text-xs text-muted m-0 mt-1">Arrastrá para reordenar. Pasá el mouse para opciones.</p>
                    </div>
                  </div>
                  
                  <Row className="g-4">
                    {previewFields.map((f, idx) => {
                      let inputMock;
                      if (f.type === "textarea") {
                        inputMock = (
                          <Form.Control
                            as="textarea"
                            rows={3}
                            disabled
                            placeholder={`Ej: Notas sobre ${f.label.toLowerCase()}`}
                            className="rounded-xl bg-gray-50 border-gray-200"
                          />
                        );
                      } else if (f.type === "select") {
                        inputMock = (
                          <Form.Select disabled className="rounded-xl bg-gray-50 border-gray-200">
                            <option>{(f.options || [])[0]?.label || "Seleccionar…"}</option>
                          </Form.Select>
                        );
                      } else if (f.type === "services") {
                        inputMock = (
                          <div className="bg-light p-3 rounded-xl border border-gray-200 small text-muted font-semibold text-xs d-flex align-items-center gap-2">
                            <span className="fs-5">🛠️</span>
                            <span>MÓDULO: Especialidades y servicios calificados del profesional</span>
                          </div>
                        );
                      } else if (f.type === "schedule") {
                        inputMock = (
                          <div className="bg-light p-3 rounded-xl border border-gray-200 small text-muted font-semibold text-xs d-flex align-items-center gap-2">
                            <span className="fs-5">📅</span>
                            <span>MÓDULO: Planificación de jornadas horarias semanales y descansos</span>
                          </div>
                        );
                      } else if (f.type === "servicePricing") {
                        inputMock = (
                          <div className="bg-light p-3 rounded-xl border border-gray-200 small text-muted font-semibold text-xs d-flex align-items-center gap-2">
                            <span className="fs-5">💰</span>
                            <span>MÓDULO: Esquema de comisiones por facturación y objetivos</span>
                          </div>
                        );
                      } else if (f.type === "email") {
                        inputMock = (
                          <Form.Control
                            type="email"
                            disabled
                            placeholder="nombre@correo.com"
                            className="rounded-xl bg-gray-50 border-gray-200"
                          />
                        );
                      } else if (f.type === "phone") {
                        inputMock = (
                          <Form.Control
                            type="tel"
                            disabled
                            placeholder="+54 9 11 2345-6789"
                            className="rounded-xl bg-gray-50 border-gray-200"
                          />
                        );
                      } else if (f.type === "currency") {
                        inputMock = (
                          <InputGroup className="rounded-xl overflow-hidden border border-gray-200">
                            <InputGroup.Text className="bg-light border-0">$</InputGroup.Text>
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
                            className="rounded-xl bg-gray-50 border-gray-200"
                          />
                        );
                      }

                      const isWide =
                        f.type === "services" ||
                        f.type === "schedule" ||
                        f.type === "servicePricing" ||
                        f.type === "textarea";

                      return (
                        <Col
                          md={isWide ? 12 : 6}
                          key={f.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                        >
                          <div
                            className={`draggable-input-card position-relative p-3 p-md-4 rounded-3xl border transition-all ${
                              draggedIndex === idx
                                ? "opacity-30 border-dashed border-purple-500 bg-purple-50 shadow-inner scale-95"
                                : "border-gray-200 bg-white shadow-sm hover-shadow-md"
                            }`}
                            style={{ cursor: "grab", zIndex: draggedIndex === idx ? 0 : 1 }}
                          >
                            {/* Overlay Controls on Hover */}
                            <div className="card-actions position-absolute top-0 end-0 p-2 opacity-0 transition-opacity" style={{ zIndex: 10 }}>
                              <div className="bg-white border shadow-sm rounded-xl d-flex align-items-center px-2 py-1 gap-1">
                                <Form.Check
                                  type="switch"
                                  id={`req-${f.id}`}
                                  checked={!!f.required}
                                  onChange={(e) => updateRef(f.id, { required: e.target.checked })}
                                  label={
                                    <span className={`text-xxs fw-bold uppercase ms-1 ${f.required ? 'text-danger' : 'text-muted'}`}>
                                      {f.required ? "Obligatorio" : "Opcional"}
                                    </span>
                                  }
                                  className="custom-switch m-0"
                                />
                                <div className="vr mx-2 bg-gray-200" style={{ width: 1, height: 16 }}></div>
                                <button
                                  type="button"
                                  className="btn-close btn-close-sm"
                                  onClick={() => toggleField(f.id)}
                                  title="Quitar campo"
                                  style={{ fontSize: "10px" }}
                                ></button>
                              </div>
                            </div>

                            <Form.Group className="mb-0">
                              <Form.Label className="fw-semibold text-sm text-gray-800 d-flex align-items-center gap-2 mb-2">
                                <GripVertical
                                  size={16}
                                  className="text-purple-300 drag-handle transition-colors"
                                  style={{ cursor: "grab" }}
                                />
                                <span>
                                  {f.label} {f.required && <span className="text-danger">*</span>}
                                </span>
                              </Form.Label>
                              {inputMock}
                            </Form.Group>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Form>
              )}
            </div>
          </Col>
        </Row>
        <style>{`
          .add-field-btn:hover .add-icon {
            transform: scale(1.1) rotate(90deg);
            background-color: #7c3aed !important;
            color: white !important;
          }
          .draggable-input-card {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .draggable-input-card:hover {
            border-color: #a78bfa !important;
            background-color: #faf5ff !important;
          }
          .draggable-input-card:hover .card-actions {
            opacity: 1 !important;
          }
          .draggable-input-card:active {
            cursor: grabbing !important;
          }
          .draggable-input-card:active .drag-handle {
            cursor: grabbing !important;
          }
          .draggable-input-card .drag-handle:hover {
            color: #8b5cf6 !important;
          }
          .scale-95 {
            transform: scale(0.95);
          }
          .hover-shadow-md:hover {
            box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.1), 0 8px 10px -6px rgba(139, 92, 246, 0.1) !important;
          }
        `}</style>
      </Card.Body>
    </Card>
  );
}
