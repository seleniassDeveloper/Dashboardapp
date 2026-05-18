import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col } from "react-bootstrap";
import { Save } from "lucide-react";
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
    (async () => {
      try {
        setError("");
        const res = await api.get(`/form-schemas/${selectedKey}`);
        setFieldRefs(Array.isArray(res.data?.fieldRefs) ? res.data.fieldRefs : []);
        setComponentMeta({ label: res.data?.label || "", component: res.data?.component || selectedTarget?.component || "" });
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

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await api.put(`/form-schemas/${selectedKey}`, {
        label: componentMeta.label || selectedTarget?.label,
        schemaType: "assignment",
        entity: selectedTarget?.entity,
        component: selectedTarget?.component,
        fieldRefs,
      });
      setSuccess(`Asignación guardada para ${selectedTarget?.component || selectedKey}`);
    } catch (e) {
      setError(e?.response?.data?.error || "Error guardando.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner size="sm" /> Cargando…
      </div>
    );
  }

  return (
    <Card className="card-premium border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1">Asignar campos a componentes</h2>
            <p className="text-muted small mb-0">
              Elegí un formulario o vista de la app y marcá qué campos del catálogo usa.
            </p>
          </div>
          <Button variant="dark" onClick={save} disabled={saving || !selectedKey}>
            <Save size={16} className="me-1" /> Guardar asignación
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row className="g-3">
          <Col lg={5}>
            <Form.Label className="small fw-semibold">Componente / pantalla</Form.Label>
            <Form.Select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className="mb-2">
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
              <div className="small text-muted mb-3">
                React: <code>{selectedTarget.component}</code> · Entidad:{" "}
                <Badge bg="light" text="dark">
                  {selectedTarget.entity}
                </Badge>
              </div>
            )}

            <Form.Label className="small fw-semibold">Campos del catálogo</Form.Label>
            <div className="border rounded-3 p-2" style={{ maxHeight: 360, overflowY: "auto" }}>
              {registryForEntity.length === 0 ? (
                <p className="text-muted small p-2">No hay campos para esta entidad en el catálogo.</p>
              ) : (
                registryForEntity.map((f) => {
                  const ref = fieldRefs.find((r) => r.id === f.id);
                  const checked = Boolean(ref);
                  return (
                    <div key={f.id} className="p-2 border-bottom">
                      <Form.Check
                        type="checkbox"
                        id={`assign-${f.id}`}
                        label={
                          <span>
                            <span className="fw-semibold">{f.label}</span>{" "}
                            <code className="small text-muted">{f.id}</code>
                          </span>
                        }
                        checked={checked}
                        onChange={() => toggleField(f.id)}
                      />
                      {checked && (
                        <div className="ms-4 mt-1 d-flex gap-3">
                          <Form.Check
                            type="switch"
                            size="sm"
                            label="Obligatorio"
                            checked={!!ref?.required}
                            onChange={(e) => updateRef(f.id, { required: e.target.checked })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Col>

          <Col lg={7}>
            <Form.Label className="small fw-semibold">Vista previa ({previewFields.length} campos)</Form.Label>
            <div className="border rounded-3 p-3 bg-light" style={{ minHeight: 360 }}>
              {previewFields.length === 0 ? (
                <p className="text-muted small">Seleccioná campos a la izquierda.</p>
              ) : (
                previewFields.map((f) => (
                  <div key={f.id} className="mb-2 pb-2 border-bottom">
                    <span className="fw-semibold">{f.label}</span>
                    {f.required && <Badge className="ms-2">Requerido</Badge>}
                    <div className="small text-muted">
                      {f.type} · {f.id}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
