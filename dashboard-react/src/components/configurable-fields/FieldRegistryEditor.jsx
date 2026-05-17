import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col } from "react-bootstrap";
import { Plus, Trash2, Save } from "lucide-react";
import { FIELD_TYPE_OPTIONS } from "../../config/formFieldTypes.js";
import { REGISTRY_SCHEMA_KEY } from "../../config/appFormTargets.js";

const API = "http://localhost:3001/api";
const ENTITIES = ["worker", "client", "appointment", "service", "workflow"];

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
        const res = await axios.get(`${API}/form-schemas/${REGISTRY_SCHEMA_KEY}`);
        setFields(Array.isArray(res.data?.fields) ? res.data.fields : []);
      } catch (e) {
        setError(e?.response?.data?.error || "Error cargando catálogo.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = filterEntity
    ? fields.filter((f) => (f.entities || []).includes(filterEntity))
    : fields;

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

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await axios.put(`${API}/form-schemas/${REGISTRY_SCHEMA_KEY}`, {
        label: "Catálogo global de campos",
        schemaType: "registry",
        fields,
      });
      setSuccess("Catálogo guardado.");
    } catch (e) {
      setError(e?.response?.data?.error || "Error guardando.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner size="sm" /> Cargando catálogo…
      </div>
    );
  }

  return (
    <Card className="card-premium border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1">Catálogo de campos</h2>
            <p className="text-muted small mb-0">
              Definí todos los campos disponibles. Luego asignalos a cada componente de la app.
            </p>
          </div>
          <Button variant="dark" onClick={save} disabled={saving}>
            <Save size={16} className="me-1" /> Guardar catálogo
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row className="g-2 mb-3">
          <Col md={4}>
            <Form.Label className="small">Filtrar por entidad</Form.Label>
            <Form.Select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} size="sm">
              <option value="">Todas</option>
              {ENTITIES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={8} className="d-flex align-items-end justify-content-end">
            <Button variant="outline-dark" size="sm" onClick={addField}>
              <Plus size={14} className="me-1" /> Campo nuevo
            </Button>
          </Col>
        </Row>

        <div className="d-flex flex-column gap-2" style={{ maxHeight: 420, overflowY: "auto" }}>
          {visible.map((field, index) => {
            const realIndex = fields.findIndex((f) => f.id === field.id);
            return (
              <div key={field.id} className="p-3 border rounded-3">
                <div className="d-flex gap-2 mb-2 flex-wrap">
                  <Badge bg={field.system ? "secondary" : "primary"}>
                    {field.system ? "Sistema" : "Custom"}
                  </Badge>
                  <code className="small">{field.id}</code>
                  {!field.system && (
                    <Button
                      variant="light"
                      size="sm"
                      className="ms-auto text-danger p-1"
                      onClick={() => setFields((p) => p.filter((_, i) => i !== realIndex))}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                <Row className="g-2">
                  <Col md={4}>
                    <Form.Control
                      size="sm"
                      value={field.label}
                      onChange={(e) =>
                        setFields((p) =>
                          p.map((f, i) => (i === realIndex ? { ...f, label: e.target.value } : f))
                        )
                      }
                      placeholder="Etiqueta"
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      size="sm"
                      value={field.type}
                      disabled={field.system}
                      onChange={(e) =>
                        setFields((p) =>
                          p.map((f, i) => (i === realIndex ? { ...f, type: e.target.value } : f))
                        )
                      }
                    >
                      {FIELD_TYPE_OPTIONS.filter((t) => !t.systemOnly || field.system).map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={5}>
                    <Form.Select
                      size="sm"
                      multiple
                      value={field.entities || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                        setFields((p) =>
                          p.map((f, i) => (i === realIndex ? { ...f, entities: selected } : f))
                        );
                      }}
                      style={{ minHeight: 38 }}
                    >
                      {ENTITIES.map((ent) => (
                        <option key={ent} value={ent}>
                          {ent}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text muted>Ctrl+clic para varias entidades</Form.Text>
                  </Col>
                </Row>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}
