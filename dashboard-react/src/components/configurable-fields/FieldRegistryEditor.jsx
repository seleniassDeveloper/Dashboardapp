import React, { useEffect, useState, useMemo } from "react";
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col, Modal } from "react-bootstrap";
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newFieldData, setNewFieldData] = useState({
    id: "",
    type: "text",
    label: "",
    entities: [],
    rawOptions: "",
    options: [],
    subfields: []
  });

  const handleOpenCreateModal = () => {
    setNewFieldData({
      id: `custom_${Date.now()}`,
      type: "text",
      label: "",
      entities: filterEntity ? [filterEntity] : ["worker"],
      rawOptions: "",
      options: [],
      subfields: []
    });
    setModalError("");
    setShowCreateModal(true);
  };

  const addSubfieldToNewField = () => {
    const subId = `sub_${Date.now()}`;
    setNewFieldData(prev => {
      const subfields = Array.isArray(prev.subfields) ? [...prev.subfields] : [];
      subfields.push({
        id: subId,
        label: "Nuevo subcampo",
        type: "text",
        required: false,
      });
      return { ...prev, subfields };
    });
  };

  const updateSubfieldInNewField = (subIndex, patch) => {
    setNewFieldData(prev => {
      const subfields = Array.isArray(prev.subfields) ? [...prev.subfields] : [];
      subfields[subIndex] = { ...subfields[subIndex], ...patch };
      return { ...prev, subfields };
    });
  };

  const removeSubfieldFromNewField = (subIndex) => {
    setNewFieldData(prev => {
      const subfields = (prev.subfields || []).filter((_, idx) => idx !== subIndex);
      return { ...prev, subfields };
    });
  };

  const handleConfirmCreate = () => {
    if (!newFieldData.label || !newFieldData.label.trim()) {
      setModalError("La etiqueta es requerida.");
      return;
    }
    const cleanId = (newFieldData.id || "").trim();
    if (!cleanId) {
      setModalError("El ID es requerido.");
      return;
    }
    if (fields.some(f => f.id === cleanId)) {
      setModalError(`El ID de campo "${cleanId}" ya está en uso.`);
      return;
    }
    if (!newFieldData.entities || newFieldData.entities.length === 0) {
      setModalError("Debe seleccionar al menos una pantalla/entidad.");
      return;
    }

    if (newFieldData.type === "nested") {
      const subIds = new Set();
      for (const sub of newFieldData.subfields) {
        if (!sub.id || !sub.id.trim()) {
          setModalError("Todos los subcampos deben tener un código ID.");
          return;
        }
        if (!sub.label || !sub.label.trim()) {
          setModalError("Todos los subcampos deben tener una etiqueta.");
          return;
        }
        if (subIds.has(sub.id)) {
          setModalError(`El ID de subcampo "${sub.id}" está duplicado.`);
          return;
        }
        subIds.add(sub.id);
      }
    }

    let options = [];
    if (newFieldData.type === "select") {
      const rawText = newFieldData.rawOptions || "";
      options = rawText
        .split(",")
        .map((item) => {
          const trimmed = item.trim();
          return { value: trimmed.toLowerCase().replace(/\s+/g, "_"), label: trimmed };
        })
        .filter((opt) => opt.label);
    }

    setFields(prev => [
      ...prev,
      {
        id: cleanId,
        type: newFieldData.type,
        label: newFieldData.label.trim(),
        entities: newFieldData.entities,
        options,
        subfields: newFieldData.type === "nested" ? newFieldData.subfields : undefined
      }
    ]);

    setShowCreateModal(false);
    setModalError("");
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

  const addSubfield = (realIndex) => {
    setFields((p) =>
      p.map((f, i) => {
        if (i !== realIndex) return f;
        const subfields = Array.isArray(f.subfields) ? [...f.subfields] : [];
        const subId = `sub_${Date.now()}`;
        subfields.push({
          id: subId,
          label: "Nuevo subcampo",
          type: "text",
          required: false,
        });
        return { ...f, subfields };
      })
    );
  };

  const updateSubfield = (realIndex, subIndex, patch) => {
    setFields((p) =>
      p.map((f, i) => {
        if (i !== realIndex) return f;
        const subfields = Array.isArray(f.subfields) ? [...f.subfields] : [];
        subfields[subIndex] = { ...subfields[subIndex], ...patch };
        return { ...f, subfields };
      })
    );
  };

  const removeSubfield = (realIndex, subIndex) => {
    setFields((p) =>
      p.map((f, i) => {
        if (i !== realIndex) return f;
        const subfields = (f.subfields || []).filter((_, idx) => idx !== subIndex);
        return { ...f, subfields };
      })
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
    <>
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
              onClick={handleOpenCreateModal}
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

                    {field.type === "nested" && (
                      <Col md={12}>
                        <div className="bg-light p-3 rounded-2xl border border-gray-200">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small fw-bold text-purple-950 text-xs">SUBFIELDS (CAMPOS ANIDADOS)</span>
                            <Button
                              variant="outline-purple"
                              size="sm"
                              onClick={() => addSubfield(realIndex)}
                              className="py-1 px-2.5 rounded-lg fw-bold text-xxs d-flex align-items-center gap-1 bg-white border-gray-200"
                            >
                              <Plus size={10} />
                              <span>Agregar subcampo</span>
                            </Button>
                          </div>
                          
                          {(!field.subfields || field.subfields.length === 0) ? (
                            <div className="text-muted smaller text-center py-2 bg-white rounded-xl border border-dashed">
                              No hay subcampos definidos en este grupo.
                            </div>
                          ) : (
                            <div className="d-flex flex-column gap-2 mt-2">
                              {field.subfields.map((sub, subIndex) => (
                                <div key={sub.id || subIndex} className="p-2.5 border rounded-xl bg-white shadow-xs">
                                  <Row className="g-2 align-items-end">
                                    <Col md={3}>
                                      <Form.Label className="text-xxs text-muted mb-1 font-semibold uppercase">Código ID</Form.Label>
                                      <Form.Control
                                        size="sm"
                                        value={sub.id}
                                        onChange={(e) => updateSubfield(realIndex, subIndex, { id: e.target.value })}
                                        className="rounded-lg border-gray-200"
                                        style={{ fontSize: "12px" }}
                                      />
                                    </Col>
                                    <Col md={3}>
                                      <Form.Label className="text-xxs text-muted mb-1 font-semibold uppercase">Etiqueta</Form.Label>
                                      <Form.Control
                                        size="sm"
                                        value={sub.label}
                                        onChange={(e) => updateSubfield(realIndex, subIndex, { label: e.target.value })}
                                        className="rounded-lg border-gray-200"
                                        style={{ fontSize: "12px" }}
                                      />
                                    </Col>
                                    <Col md={3}>
                                      <Form.Label className="text-xxs text-muted mb-1 font-semibold uppercase">Tipo de dato</Form.Label>
                                      <Form.Select
                                        size="sm"
                                        value={sub.type}
                                        onChange={(e) => updateSubfield(realIndex, subIndex, { type: e.target.value })}
                                        className="rounded-lg border-gray-200"
                                        style={{ fontSize: "12px" }}
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
                                        onChange={(e) => updateSubfield(realIndex, subIndex, { required: e.target.checked })}
                                        className="text-xxs font-bold uppercase text-muted"
                                      />
                                    </Col>
                                    <Col md={1} className="d-flex justify-content-end pb-1">
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="p-1 rounded-lg border-0"
                                        onClick={() => removeSubfield(realIndex, subIndex)}
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                    </Col>
                                  </Row>
                                  {sub.type === "select" && (
                                    <div className="mt-2 bg-light p-2 rounded-lg border">
                                      <Form.Label className="text-xxs text-purple-950 mb-1 fw-bold">Opciones de la lista desplegable (separadas por comas)</Form.Label>
                                      <Form.Control
                                        size="sm"
                                        value={Array.isArray(sub.options) ? sub.options.map(o => o.label).join(", ") : ""}
                                        onChange={(e) => {
                                          const opts = e.target.value
                                            .split(",")
                                            .map((item) => {
                                              const trimmed = item.trim();
                                              return { value: trimmed.toLowerCase().replace(/\s+/g, "_"), label: trimmed };
                                            })
                                            .filter((opt) => opt.label);
                                          updateSubfield(realIndex, subIndex, { options: opts });
                                        }}
                                        placeholder="Ej: Chico, Mediano, Grande"
                                        className="rounded-lg border-gray-200 bg-white"
                                        style={{ fontSize: "12px" }}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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

    <Modal 
      show={showCreateModal} 
      onHide={() => setShowCreateModal(false)}
      centered
      size={newFieldData.type === "nested" ? "lg" : "md"}
      className="border-0 shadow-lg"
    >
      <Modal.Header closeButton className="border-bottom-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-black text-gray-900" style={{ fontSize: "18px" }}>Configurar Campo Nuevo</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {modalError && <Alert variant="danger" className="py-2.5 rounded-xl smaller mb-3">{modalError}</Alert>}
        
        <Form className="d-flex flex-column gap-3">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small text-muted mb-1 font-semibold text-xxs uppercase">Código ID del campo</Form.Label>
                <Form.Control
                  placeholder="Ej: talla_uniforme"
                  value={newFieldData.id}
                  onChange={(e) => {
                    const cleanId = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                    setNewFieldData(prev => ({ ...prev, id: cleanId }));
                  }}
                  className="rounded-xl border-gray-200"
                  style={{ fontFamily: "monospace", fontSize: "13px" }}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small text-muted mb-1 font-semibold text-xxs uppercase">Tipo de dato</Form.Label>
                <Form.Select
                  value={newFieldData.type}
                  onChange={(e) => setNewFieldData(prev => ({ ...prev, type: e.target.value }))}
                  className="rounded-xl border-gray-200"
                >
                  {FIELD_TYPE_OPTIONS.filter(t => !t.systemOnly).map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group>
            <Form.Label className="small text-muted mb-1 font-semibold text-xxs uppercase">Etiqueta de visualización</Form.Label>
            <Form.Control
              placeholder="Ej: Talle de uniforme"
              value={newFieldData.label}
              onChange={(e) => setNewFieldData(prev => ({ ...prev, label: e.target.value }))}
              className="rounded-xl border-gray-200"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label className="small text-muted mb-1 font-semibold text-xxs uppercase">Asociado a las siguientes pantallas</Form.Label>
            <div className="d-flex flex-wrap gap-2 pt-1">
              {ENTITIES.map((ent) => {
                const active = newFieldData.entities.includes(ent);
                return (
                  <Button
                    key={ent}
                    variant={active ? "purple" : "outline-secondary"}
                    size="sm"
                    className={`px-3 py-1.5 rounded-pill fw-bold text-xxs ${active ? "bg-purple-600 border-purple-600 text-white shadow-sm" : "text-muted border-gray-200 hover-bg-gray-100"}`}
                    onClick={() => {
                      const nextEntities = active
                        ? newFieldData.entities.filter(e => e !== ent)
                        : [...newFieldData.entities, ent];
                      setNewFieldData(prev => ({ ...prev, entities: nextEntities }));
                    }}
                  >
                    {ENTITY_LABELS[ent] || ent}
                  </Button>
                );
              })}
            </div>
          </Form.Group>

          {newFieldData.type === "select" && (
            <Form.Group className="bg-light p-3 rounded-2xl border">
              <Form.Label className="small text-purple-950 mb-1 fw-bold text-xs">Opciones de la lista desplegable (separadas por comas)</Form.Label>
              <Form.Control
                value={newFieldData.rawOptions}
                onChange={(e) => setNewFieldData(prev => ({ ...prev, rawOptions: e.target.value }))}
                placeholder="Ej: Chico, Mediano, Grande"
                className="rounded-xl border-gray-200 bg-white"
              />
              <Form.Text className="text-muted text-xxs block mt-1">
                💡 Cada opción ingresada por coma se convertirá en un elemento seleccionable en los formularios.
              </Form.Text>
            </Form.Group>
          )}

          {newFieldData.type === "nested" && (
            <div className="bg-light p-3 rounded-2xl border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-purple-950 text-xs">SUBFIELDS (CAMPOS ANIDADOS)</span>
                <Button
                  variant="outline-purple"
                  size="sm"
                  onClick={addSubfieldToNewField}
                  className="py-1 px-2.5 rounded-lg fw-bold text-xxs d-flex align-items-center gap-1 bg-white border-gray-200"
                >
                  <Plus size={10} />
                  <span>Agregar subcampo</span>
                </Button>
              </div>
              
              {(!newFieldData.subfields || newFieldData.subfields.length === 0) ? (
                <div className="text-muted smaller text-center py-3 bg-white rounded-xl border border-dashed">
                  No hay subcampos definidos en este grupo todavía.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 mt-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {newFieldData.subfields.map((sub, subIndex) => (
                    <div key={sub.id || subIndex} className="p-2.5 border rounded-xl bg-white shadow-xs">
                      <Row className="g-2 align-items-end">
                        <Col md={3}>
                          <Form.Label className="text-xxs text-muted mb-1 font-semibold uppercase">ID</Form.Label>
                          <Form.Control
                            size="sm"
                            value={sub.id}
                            onChange={(e) => updateSubfieldInNewField(subIndex, { id: e.target.value })}
                            className="rounded-lg border-gray-200"
                            style={{ fontSize: "11px" }}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label className="text-xxs text-muted mb-1 font-semibold uppercase">Etiqueta</Form.Label>
                          <Form.Control
                            size="sm"
                            value={sub.label}
                            onChange={(e) => updateSubfieldInNewField(subIndex, { label: e.target.value })}
                            className="rounded-lg border-gray-200"
                            style={{ fontSize: "11px" }}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label className="text-xxs text-muted mb-1 font-semibold uppercase">Tipo</Form.Label>
                          <Form.Select
                            size="sm"
                            value={sub.type}
                            onChange={(e) => updateSubfieldInNewField(subIndex, { type: e.target.value })}
                            className="rounded-lg border-gray-200"
                            style={{ fontSize: "11px" }}
                          >
                            <option value="text">Texto corto</option>
                            <option value="number">Número</option>
                            <option value="email">Email</option>
                            <option value="phone">Teléfono</option>
                            <option value="textarea">Texto largo</option>
                          </Form.Select>
                        </Col>
                        <Col md={2} className="d-flex align-items-center pb-1">
                          <Form.Check
                            type="checkbox"
                            label="Oblig."
                            checked={!!sub.required}
                            onChange={(e) => updateSubfieldInNewField(subIndex, { required: e.target.checked })}
                            className="text-xxs font-bold text-muted uppercase"
                          />
                        </Col>
                        <Col md={1} className="d-flex justify-content-end pb-1">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="p-1 rounded-lg border-0"
                            onClick={() => removeSubfieldFromNewField(subIndex)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0 px-4 pb-4 gap-2">
        <Button 
          variant="outline-secondary" 
          onClick={() => setShowCreateModal(false)}
          className="rounded-xl px-4 py-2.5 text-xs fw-bold border-gray-200"
        >
          Cancelar
        </Button>
        <Button 
          variant="purple" 
          onClick={handleConfirmCreate}
          className="rounded-xl px-4 py-2.5 text-xs fw-bold bg-purple-600 hover-bg-purple-700 text-white border-0 shadow"
        >
          Confirmar y Agregar
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
}
