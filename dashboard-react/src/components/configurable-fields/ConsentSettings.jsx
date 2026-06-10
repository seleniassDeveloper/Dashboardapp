import React, { useState, useEffect } from "react";
import { Card, Form, Button, Table, Row, Col, Spinner, Alert, Modal } from "react-bootstrap";
import { FileText, Plus, Edit2, Trash2, ShieldAlert, Sparkles, Check } from "lucide-react";
import api from "../../lib/api.js";

export default function ConsentSettings() {
  const [templates, setTemplates] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal editor states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [body, setBody] = useState("");
  const [requirements, setRequirements] = useState("");
  const [whatToKnow, setWhatToKnow] = useState("");
  const [contraindications, setContraindications] = useState("");
  const [preCare, setPreCare] = useState("");
  const [postCare, setPostCare] = useState("");
  const [collectAllergies, setCollectAllergies] = useState(true);

  // Fetch templates and services
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tRes, sRes] = await Promise.all([
        api.get("/consents/templates"),
        api.get("/services")
      ]);
      setTemplates(tRes.data || []);
      setServices(sRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch templates settings error:", err);
      setError("No se pudieron cargar las plantillas de consentimiento o los tratamientos.");
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setServiceId("");
    setBody("");
    setRequirements("");
    setWhatToKnow("");
    setContraindications("");
    setPreCare("");
    setPostCare("");
    setCollectAllergies(true);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingId(t.id);
    setName(t.name || "");
    setServiceId(t.serviceId || "");
    setBody(t.body || "");
    setRequirements(t.requirements || "");
    setWhatToKnow(t.whatToKnow || "");
    setContraindications(t.contraindications || "");
    setPreCare(t.preCare || "");
    setPostCare(t.postCare || "");
    setCollectAllergies(t.collectAllergies ?? true);
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      setError("El nombre de la plantilla y los términos son obligatorios.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      id: editingId,
      name: name.trim(),
      serviceId: serviceId || null,
      body: body.trim(),
      requirements: requirements.trim() || null,
      whatToKnow: whatToKnow.trim() || null,
      contraindications: contraindications.trim() || null,
      preCare: preCare.trim() || null,
      postCare: postCare.trim() || null,
      collectAllergies
    };

    try {
      await api.post("/consents/templates", payload);
      setSuccess("Plantilla guardada y publicada exitosamente.");
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Save template error:", err);
      setError(err.response?.data?.error || "Error al intentar guardar la plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas desactivar esta plantilla de consentimiento? Las solicitudes y registros existentes se mantendrán inalterados por razones de integridad legal.")) return;

    try {
      await api.delete(`/consents/templates/${id}`);
      setSuccess("Plantilla desactivada correctamente.");
      fetchData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Delete template error:", err);
      setError("No se pudo desactivar la plantilla de consentimiento.");
    }
  };

  return (
    <Card className="card-premium border-0 shadow-sm bg-white p-4">
      <Card.Body className="p-0">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 className="h5 fw-black text-gray-900 m-0 d-flex align-items-center gap-2">
              <FileText className="text-purple-600" size={20} />
              <span>Plantillas de Consentimientos Informados</span>
            </h3>
            <p className="text-muted smaller mb-0 mt-0.5">
              Crea y personaliza las cláusulas legales y condiciones médicas obligatorias que tus clientes deben firmar antes de realizarse procedimientos.
            </p>
          </div>
          <Button
            variant="purple"
            className="rounded-xl px-4 py-2.5 text-white bg-purple-600 border-0 hover-bg-purple-700 fw-bold shadow-sm d-flex align-items-center gap-1.5"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Crear Nueva Plantilla</span>
          </Button>
        </div>

        {success && (
          <Alert variant="success" className="rounded-xl border-0 shadow-sm mb-4 py-3 text-emerald-800 bg-emerald-50">
            <Sparkles size={16} className="me-2" />
            <span>{success}</span>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="rounded-xl border-0 shadow-sm mb-4 py-3">
            <ShieldAlert size={16} className="me-2" />
            <span>{error}</span>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" className="text-purple-600" />
            <p className="text-muted mt-2 fw-semibold">Cargando plantillas de consentimiento...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-light rounded-3 border">
            Aún no has configurado plantillas de consentimiento para este negocio. Haz clic en "Crear Nueva Plantilla" para empezar.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px", backgroundColor: "#f9fafb" }}>
                  <th className="py-3">Nombre del Consentimiento</th>
                  <th>Procedimiento Asociado</th>
                  <th>Versión</th>
                  <th>Formulario de Salud</th>
                  <th>Creado Por</th>
                  <th className="text-end pe-3">Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px" }}>
                {templates.map((t) => {
                  const svc = services.find((s) => s.id === t.serviceId);
                  return (
                    <tr key={t.id} className="transition-all hover-bg-light">
                      <td className="fw-bold text-gray-900 py-3">{t.name}</td>
                      <td>
                        {svc ? (
                          <span className="badge bg-purple-100 text-purple-700 fw-bold px-2 py-1 rounded">
                            {svc.name}
                          </span>
                        ) : (
                          <span className="text-muted small">Cualquier servicio</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border rounded px-2.5 py-1">
                          v{t.version}
                        </span>
                      </td>
                      <td>
                        {t.collectAllergies ? (
                          <span className="text-emerald-600 fw-bold">✓ Alergias + Cuestionario</span>
                        ) : (
                          <span className="text-muted">Solo aceptación legal</span>
                        )}
                      </td>
                      <td className="text-muted">{t.createdBy || "Admin"}</td>
                      <td className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-1.5">
                          <Button
                            variant="outline-purple"
                            size="sm"
                            className="rounded-xl px-3 py-1.5 fw-bold text-xs"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit2 size={12} className="me-1" />
                            <span>Editar / Nueva versión</span>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-xl px-3 py-1.5 fw-bold text-xs"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 size={12} className="me-1" />
                            <span>Desactivar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}

        {/* EDITOR DIALOG */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="hegemonic-modal">
          <Form onSubmit={handleSave}>
            <Modal.Header closeButton className="border-0 pb-0 bg-light py-3 px-4">
              <Modal.Title className="fw-bold text-dark">
                {editingId ? "Editar / Publicar Nueva Versión" : "Crear Plantilla de Consentimiento"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Alert variant="warning" className="border-0 rounded-4 p-3 mb-4 bg-amber-50 text-amber-900 d-flex align-items-start gap-2.5">
                <ShieldAlert className="text-warning mt-0.5 flex-shrink-0" size={20} />
                <div className="small">
                  <strong>Aviso de cumplimiento legal:</strong> AuraDash no proporciona asesoría legal ni redacta términos oficiales.
                  <span className="d-block mt-1 fw-bold text-decoration-underline">"Haz revisar este texto por un profesional legal según tu rubro y país"</span>
                </div>
              </Alert>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Nombre de la Plantilla</Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Consentimiento de Microblading"
                      className="rounded-xl border-gray-200 focus-ring-purple"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Tratamiento / Servicio asociado</Form.Label>
                    <Form.Select
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className="rounded-xl border-gray-200 focus-ring-purple"
                    >
                      <option value="">Cualquier servicio (General)</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category || "General"})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Términos y Declaraciones del Procedimiento (Cláusulas legales)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      required
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Escribe aquí las advertencias, riesgos asumidos, exoneración de responsabilidad y cláusulas detalladas del procedimiento..."
                      className="rounded-xl border-gray-200 focus-ring-purple"
                      style={{ fontSize: "13.5px" }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">¿Qué se le hará / Qué debe saber?</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={whatToKnow}
                      onChange={(e) => setWhatToKnow(e.target.value)}
                      placeholder="Resumen simple del procedimiento en palabras no legales..."
                      className="rounded-xl border-gray-200"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">¿Qué debe cumplir el cliente (Requisitos)?</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Ej: No estar tomando aspirinas 48hs antes, traer piel limpia..."
                      className="rounded-xl border-gray-200"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Contraindicaciones médicas</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={contraindications}
                      onChange={(e) => setContraindications(e.target.value)}
                      placeholder="Ej: Embarazo, marcapasos, cicatrización queloide..."
                      className="rounded-xl border-gray-200"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Cuidados Pre-Servicio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={preCare}
                      onChange={(e) => setPreCare(e.target.value)}
                      placeholder="Ej: Evitar tomar alcohol o cafeína antes..."
                      className="rounded-xl border-gray-200"
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Cuidados Post-Servicio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={postCare}
                      onChange={(e) => setPostCare(e.target.value)}
                      placeholder="Ej: No mojar la zona por 24hs, colocar crema regeneradora..."
                      className="rounded-xl border-gray-200"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="collect-allergies-switch"
                      label="Exigir declaración de Alergias, Medicación, Embarazo y observaciones en el formulario de firma"
                      checked={collectAllergies}
                      onChange={(e) => setCollectAllergies(e.target.checked)}
                      className="fw-bold text-purple-900"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
              <Button variant="light" className="rounded-xl px-4 py-2" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="purple"
                type="submit"
                disabled={saving}
                className="rounded-xl px-4 py-2 text-white bg-purple-600 border-0 hover-bg-purple-700 shadow"
              >
                {saving ? "Guardando y publicando..." : editingId ? "Publicar Nueva Versión" : "Publicar Plantilla"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Card.Body>
    </Card>
  );
}
