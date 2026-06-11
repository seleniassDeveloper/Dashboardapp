import React, { useEffect, useState } from "react";
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col } from "react-bootstrap";
import { Plus, Trash2, ChevronUp, ChevronDown, Save } from "lucide-react";
import { FIELD_TYPE_OPTIONS, SYSTEM_FIELD_IDS } from "../../config/formFieldTypes.js";
import api from "../../lib/api.js";

const EDITABLE_SCHEMAS = [
  { key: "worker.create", label: "Alta de empleado" },
];

export default function FormSchemaEditor() {
  const [selectedKey, setSelectedKey] = useState("worker.create");
  const [fields, setFields] = useState([]);
  const [schemaLabel, setSchemaLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/form-schemas/${selectedKey}`);
        setFields(Array.isArray(res.data?.fields) ? res.data.fields : []);
        setSchemaLabel(res.data?.label || "");
      } catch (e) {
        setError(e?.response?.data?.error || "Error cargando esquema.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedKey]);

  const updateField = (index, patch) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const moveField = (index, dir) => {
    setFields((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const removeField = (index) => {
    const f = fields[index];
    if (f.system) return;
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const addCustomField = () => {
    const id = `custom_${Date.now()}`;
    setFields((prev) => [
      ...prev,
      {
        id,
        type: "text",
        label: "Nuevo campo",
        required: false,
        enabled: true,
        section: "otro",
        placeholder: "",
      },
    ]);
  };

  const addSubfield = (fieldIndex) => {
    const field = fields[fieldIndex];
    const subfields = Array.isArray(field.subfields) ? [...field.subfields] : [];
    const subId = `sub_${Date.now()}`;
    subfields.push({
      id: subId,
      label: "Nuevo subcampo",
      type: "text",
      required: false,
    });
    updateField(fieldIndex, { subfields });
  };

  const updateSubfield = (fieldIndex, subIndex, patch) => {
    const field = fields[fieldIndex];
    const subfields = Array.isArray(field.subfields) ? [...field.subfields] : [];
    subfields[subIndex] = { ...subfields[subIndex], ...patch };
    updateField(fieldIndex, { subfields });
  };

  const removeSubfield = (fieldIndex, subIndex) => {
    const field = fields[fieldIndex];
    const subfields = (field.subfields || []).filter((_, idx) => idx !== subIndex);
    updateField(fieldIndex, { subfields });
  };

  const moveSubfield = (fieldIndex, subIndex, dir) => {
    const field = fields[fieldIndex];
    const subfields = Array.isArray(field.subfields) ? [...field.subfields] : [];
    const targetIdx = subIndex + dir;
    if (targetIdx < 0 || targetIdx >= subfields.length) return;
    [subfields[subIndex], subfields[targetIdx]] = [subfields[targetIdx], subfields[subIndex]];
    updateField(fieldIndex, { subfields });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.put(`/form-schemas/${selectedKey}`, {
        label: schemaLabel,
        fields,
      });
      setSuccess("Formulario guardado. Los cambios aplican al crear o editar empleados.");
    } catch (e) {
      setError(e?.response?.data?.error || "Error guardando.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <Spinner animation="border" size="sm" className="me-2" />
        Cargando editor…
      </div>
    );
  }

  return (
    <Card className="card-premium border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h2 className="h5 fw-bold mb-1">Campos configurables</h2>
            <p className="text-muted small mb-0">
              Definí qué información debe completarse al dar de alta un empleado. Podés agregar campos
              personalizados, marcarlos como obligatorios u ocultarlos.
            </p>
          </div>
          <Button variant="dark" onClick={handleSave} disabled={saving} className="d-flex align-items-center gap-2">
            {saving ? <Spinner size="sm" /> : <Save size={16} />}
            Guardar formulario
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row className="g-3 mb-4">
          <Col md={6}>
            <Form.Label className="small fw-semibold">Formulario</Form.Label>
            <Form.Select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
              {EDITABLE_SCHEMAS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Título</Form.Label>
            <Form.Control value={schemaLabel} onChange={(e) => setSchemaLabel(e.target.value)} />
          </Col>
        </Row>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-semibold">Campos ({fields.length})</span>
          <Button variant="outline-dark" size="sm" onClick={addCustomField} className="d-flex align-items-center gap-1">
            <Plus size={14} /> Agregar campo
          </Button>
        </div>

        <div className="d-flex flex-column gap-2">
          {fields.map((field, index) => (
            <div
              key={`${field.entity || "schema"}-${field.name || field.id}-${field.id || index}`}
              className="p-3 rounded-3 border bg-light-subtle"
              style={{ background: field.enabled === false ? "rgba(0,0,0,0.03)" : undefined }}
            >
              <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                <Badge bg={field.system ? "secondary" : "primary"}>
                  {field.system ? "Sistema" : "Personalizado"}
                </Badge>
                <code className="small text-muted">{field.id}</code>
                <div className="ms-auto d-flex gap-1">
                  <Button variant="light" size="sm" className="p-1" onClick={() => moveField(index, -1)} disabled={index === 0}>
                    <ChevronUp size={14} />
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    className="p-1"
                    onClick={() => moveField(index, 1)}
                    disabled={index === fields.length - 1}
                  >
                    <ChevronDown size={14} />
                  </Button>
                  {!field.system && (
                    <Button variant="light" size="sm" className="p-1 text-danger" onClick={() => removeField(index)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>

              <Row className="g-2">
                <Col md={4}>
                  <Form.Label className="small">Etiqueta</Form.Label>
                  <Form.Control
                    size="sm"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    disabled={field.system && SYSTEM_FIELD_IDS.includes(field.id)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="small">Tipo</Form.Label>
                  <Form.Select
                    size="sm"
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value })}
                    disabled={field.system}
                  >
                    {FIELD_TYPE_OPTIONS.filter((t) => !t.systemOnly || field.system).map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small">Sección</Form.Label>
                  <Form.Select
                    size="sm"
                    value={field.section || "otro"}
                    onChange={(e) => updateField(index, { section: e.target.value })}
                  >
                    <option value="datos">Datos</option>
                    <option value="contacto">Contacto</option>
                    <option value="trabajo">Trabajo</option>
                    <option value="otro">Otros</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="d-flex align-items-end gap-3 pb-1">
                  <Form.Check
                    type="switch"
                    label="Visible"
                    checked={field.enabled !== false}
                    onChange={(e) => updateField(index, { enabled: e.target.checked })}
                    disabled={field.system && SYSTEM_FIELD_IDS.includes(field.id)}
                  />
                  <Form.Check
                    type="switch"
                    label="Obligatorio"
                    checked={!!field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    disabled={field.system && (field.id === "firstName" || field.id === "lastName")}
                  />
                </Col>
              </Row>

              {field.type === "select" && !field.system && (
                <div className="mt-2">
                  <Form.Label className="small">Opciones (valor|etiqueta por línea)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    size="sm"
                    value={safeOptionsText(field.options)}
                    onChange={(e) => updateField(index, { options: parseOptionsText(e.target.value) })}
                    placeholder="junior|Junior&#10;senior|Senior"
                  />
                </div>
              )}

              {field.type === "nested" && (
                <div className="mt-3 p-3 border rounded-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-dark">Subcampos del Grupo</span>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => addSubfield(index)}
                      className="d-flex align-items-center gap-1 py-0.5 px-2 small"
                    >
                      <Plus size={12} /> Agregar subcampo
                    </Button>
                  </div>
                  {safeArray(field.subfields).length === 0 ? (
                    <div className="text-muted small text-center py-2">No hay subcampos. Agregá al menos uno.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mt-2">
                      {safeArray(field.subfields).map((sub, subIndex) => (
                        <div key={sub.id || subIndex} className="p-2 border rounded bg-white shadow-sm">
                          <Row className="g-2 align-items-end">
                            <Col md={3}>
                              <Form.Label className="smaller text-muted d-block mb-1">Código ID</Form.Label>
                              <Form.Control
                                size="sm"
                                value={sub.id}
                                onChange={(e) => updateSubfield(index, subIndex, { id: e.target.value })}
                                placeholder="codigo_id"
                              />
                            </Col>
                            <Col md={3}>
                              <Form.Label className="smaller text-muted d-block mb-1">Etiqueta</Form.Label>
                              <Form.Control
                                size="sm"
                                value={sub.label}
                                onChange={(e) => updateSubfield(index, subIndex, { label: e.target.value })}
                                placeholder="Nombre del subcampo"
                              />
                            </Col>
                            <Col md={3}>
                              <Form.Label className="smaller text-muted d-block mb-1">Tipo</Form.Label>
                              <Form.Select
                                size="sm"
                                value={sub.type}
                                onChange={(e) => updateSubfield(index, subIndex, { type: e.target.value })}
                              >
                                <option value="text">Texto corto</option>
                                <option value="number">Número</option>
                                <option value="email">Email</option>
                                <option value="phone">Teléfono</option>
                                <option value="textarea">Texto largo</option>
                                <option value="select">Lista desplegable</option>
                              </Form.Select>
                            </Col>
                            <Col md={2} className="d-flex align-items-center pb-1">
                              <Form.Check
                                type="checkbox"
                                label="Obligatorio"
                                checked={!!sub.required}
                                onChange={(e) => updateSubfield(index, subIndex, { required: e.target.checked })}
                                className="small"
                              />
                            </Col>
                            <Col md={1} className="d-flex justify-content-end gap-1 pb-1">
                              <Button
                                variant="light"
                                size="sm"
                                className="p-1"
                                onClick={() => moveSubfield(index, subIndex, -1)}
                                disabled={subIndex === 0}
                              >
                                <ChevronUp size={12} />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="p-1"
                                onClick={() => moveSubfield(index, subIndex, 1)}
                                disabled={subIndex === safeArray(field.subfields).length - 1}
                              >
                                <ChevronDown size={12} />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="p-1 text-danger"
                                onClick={() => removeSubfield(index, subIndex)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </Col>
                          </Row>
                          {sub.type === "select" && (
                            <div className="mt-2">
                              <Form.Label className="smaller text-muted d-block mb-1">Opciones (valor|etiqueta por línea)</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                size="sm"
                                value={safeOptionsText(sub.options)}
                                onChange={(e) => updateSubfield(index, subIndex, { options: parseOptionsText(e.target.value) })}
                                placeholder="opcion1|Opción 1"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

function safeOptionsText(options) {
  return safeArray(options)
    .map((o) => `${o.value}|${o.label}`)
    .join("\n");
}

function parseOptionsText(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, label] = line.split("|");
      return { value: (value || "").trim(), label: (label || value || "").trim() };
    });
}

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}
