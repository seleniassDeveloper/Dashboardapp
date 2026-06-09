import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col } from "react-bootstrap";
import { Plus, Trash2, Save } from "lucide-react";
import { FIELD_TYPE_OPTIONS } from "../../config/formFieldTypes.js";
import { REGISTRY_SCHEMA_KEY } from "../../config/appFormTargets.js";
import api from "../../lib/api.js";

const ENTITIES = ["worker", "client", "appointment", "service", "workflow"];

const ENTITY_LABELS = {
  worker: "Empleado / Equipo",
  client: "Cliente",
  appointment: "Cita / Reserva",
  service: "Servicio",
  workflow: "Workflow"
};

export default function FieldRegistryEditor() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/form-schemas/${REGISTRY_SCHEMA_KEY}`);
        setFields(Array.isArray(res.data?.fields) ? res.data.fields : []);
      } catch (e) {
        setError(e?.response?.data?.error || "Error cargando catálogo.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    return filterEntity
      ? fields.filter((f) => (f.entities || []).includes(filterEntity))
      : fields;
  }, [fields, filterEntity]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        type: "text",
        label: "Nuevo campo",
        entities: filterEntity ? [filterEntity] : ["worker"],
      },
    ]);
  };

  const getRawOptionsString = (field) => {
    if (field.rawOptions !== undefined) return field.rawOptions;
    return (field.options || []).map((o) => o.label).join(", ");
  };

  const handleOptionsChange = (realIndex, rawText) => {
    const opts = rawText
      .split(",")
      .map((item) => {
        const trimmed = item.trim();
        return { value: trimmed.toLowerCase().replace(/\s+/g, "_"), label: trimmed };
      })
      .filter((opt) => opt.label);

    setFields((p) =>
      p.map((f, i) => (i === realIndex ? { ...f, rawOptions: rawText, options: opts } : f))
    );
  };

  const save = async () => {
    // Validaciones de consistencia
    const ids = new Set();
    for (const f of fields) {
      if (!f.label || !f.label.trim()) {
        setError("Todos los campos deben tener una etiqueta válida.");
        return;
      }
      const cleanId = (f.id || "").trim();
      if (!cleanId) {
        setError("Todos los campos deben tener un ID válido.");
        return;
      }
      if (ids.has(cleanId)) {
        setError(`El ID de campo "${cleanId}" está duplicado. Todos los IDs deben ser únicos.`);
        return;
      }
      ids.add(cleanId);

      if (!f.entities || f.entities.length === 0) {
        setError(`El campo "${f.label}" debe estar asignado a al menos una pantalla/entidad.`);
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Limpiar rawOptions antes de enviar payload
      const cleanedFields = fields.map(({ rawOptions, ...rest }) => ({
        ...rest,
        id: rest.id.trim(),
        label: rest.label.trim()
      }));

      await api.put(`/form-schemas/${REGISTRY_SCHEMA_KEY}`, {
        label: "Catálogo global de campos",
        schemaType: "registry",
        fields: cleanedFields,
      });
      
      setSuccess("Catálogo guardado correctamente.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e?.response?.data?.error || "Error guardando catálogo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2 small">Cargando catálogo de campos…</p>
      </div>
    );
  }

  return (
    <Card className="card-premium border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="h4 fw-black text-gray-900 mb-1">Catálogo de campos</h2>
            <p className="text-muted small mb-0">
              Definí todos los campos disponibles. Luego asignalos a cada componente de la app.
            </p>
          </div>
          <Button 
            variant="dark" 
            onClick={save} 
            disabled={saving} 
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
                <span>Guardar catálogo</span>
              </>
            )}
          </Button>
        </div>

        {error && <Alert variant="danger" className="border-0 shadow-sm rounded-xl mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="border-0 shadow-sm rounded-xl mb-4">{success}</Alert>}

        <Row className="g-3 mb-4 align-items-end">
          <Col md={4}>
            <Form.Group>
              <Form.Label className="small text-muted mb-1 fw-bold text-xs uppercase">Filtrar por entidad</Form.Label>
              <Form.Select 
                value={filterEntity} 
                onChange={(e) => setFilterEntity(e.target.value)} 
                size="sm"
                className="rounded-xl border-gray-200"
              >
                <option value="">Todas las entidades</option>
                {ENTITIES.map((e) => (
                  <option key={e} value={e}>
                    {ENTITY_LABELS[e] || e}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={8} className="d-flex justify-content-end">
            <Button 
              variant="outline-purple" 
              size="sm" 
              onClick={addField}
              className="py-2 px-3 rounded-xl fw-bold text-xs d-flex align-items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Campo nuevo</span>
            </Button>
          </Col>
        </Row>

        <div className="d-flex flex-column gap-3.5" style={{ maxHeight: 500, overflowY: "auto", paddingRight: "4px" }}>
          {visible.length === 0 ? (
            <div className="text-center py-5 border border-dashed rounded-2xl bg-light">
              <p className="text-muted m-0 small">No hay campos para mostrar con este filtro.</p>
            </div>
          ) : (
            visible.map((field, index) => {
              const realIndex = fields.findIndex((f) => f.id === field.id);
              return (
                <div key={`registry-field-${field.id || index}-${index}`} className="p-3 border rounded-2xl bg-white shadow-sm hover-shadow transition-all">
                  <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
                    <Badge bg={field.system ? "secondary" : "primary"} className="px-2.5 py-1.5 rounded-lg fw-bold text-xxs">
                      {field.system ? "Sistema" : "Personalizado"}
                    </Badge>
                    
                    {!field.system ? (
                      <div className="d-flex align-items-center gap-2">
                        <code className="small text-muted text-xs">ID:</code>
                        <Form.Control
                          size="sm"
                          style={{ width: "200px", fontFamily: "monospace", fontSize: "11px", height: "26px", padding: "2px 6px" }}
                          value={field.id}
                          onChange={(e) => {
                            const cleanId = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                            setFields((p) =>
                              p.map((f, i) => (i === realIndex ? { ...f, id: cleanId } : f))
                            );
                          }}
                          placeholder="id_campo"
                          className="rounded-lg border-gray-200"
                        />
                      </div>
                    ) : (
                      <code className="small bg-gray-100 px-2.5 py-1 rounded-lg text-xs text-secondary font-mono">{field.id}</code>
                    )}

                    {!field.system && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="ms-auto p-1.5 rounded-lg border-0"
                        onClick={() => setFields((p) => p.filter((_, i) => i !== realIndex))}
                        title="Eliminar campo"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                  
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small text-muted mb-1 font-semibold text-xxs uppercase">Etiqueta de visualización</Form.Label>
                        <Form.Control
                          size="sm"
                          value={field.label}
                          onChange={(e) =>
                            setFields((p) =>
                              p.map((f, i) => (i === realIndex ? { ...f, label: e.target.value } : f))
                            )
                          }
                          placeholder="Ej: Talle de uniforme"
                          className="rounded-lg border-gray-200"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small text-muted mb-1 font-semibold text-xxs uppercase">Tipo de dato</Form.Label>
                        <Form.Select
                          size="sm"
                          value={field.type}
                          disabled={field.system}
                          onChange={(e) =>
                            setFields((p) =>
                              p.map((f, i) => (i === realIndex ? { ...f, type: e.target.value } : f))
                            )
                          }
                          className="rounded-lg border-gray-200"
                        >
                          {FIELD_TYPE_OPTIONS.filter((t) => !t.systemOnly || field.system).map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small text-muted mb-1 font-semibold text-xxs uppercase">Asociado a las siguientes pantallas</Form.Label>
                        <div className="d-flex flex-wrap gap-1.5 pt-0.5">
                          {ENTITIES.map((ent) => {
                            const active = (field.entities || []).includes(ent);
                            return (
                              <Button
                                key={ent}
                                variant={active ? "purple" : "outline-secondary"}
                                size="sm"
                                className={`px-2.5 py-1 rounded-pill fw-bold text-xxs ${active ? "bg-purple-600 border-purple-600 text-white shadow-sm" : "text-muted border-gray-200 hover-bg-gray-100"}`}
                                onClick={() => {
                                  const nextEntities = active
                                    ? (field.entities || []).filter(e => e !== ent)
                                    : [...(field.entities || []), ent];
                                  setFields((p) =>
                                    p.map((f, i) => (i === realIndex ? { ...f, entities: nextEntities } : f))
                                  );
                                }}
                              >
                                {ENTITY_LABELS[ent] || ent}
                              </Button>
                            );
                          })}
                        </div>
                      </Form.Group>
                    </Col>

                    {field.type === "select" && (
                      <Col md={12}>
                        <Form.Group className="bg-light p-3 rounded-2xl border border-gray-200">
                          <Form.Label className="small text-purple-950 mb-1 fw-bold text-xs">Opciones de la lista desplegable (separadas por comas)</Form.Label>
                          <Form.Control
                            size="sm"
                            value={getRawOptionsString(field)}
                            onChange={(e) => handleOptionsChange(realIndex, e.target.value)}
                            placeholder="Ej: Chico, Mediano, Grande"
                            className="rounded-lg border-gray-200 focus-ring-purple bg-white"
                          />
                          <Form.Text className="text-muted text-xxs block mt-1">
                            💡 Cada opción ingresada por coma se convertirá en un elemento seleccionable en los formularios.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                </div>
              );
            })
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
