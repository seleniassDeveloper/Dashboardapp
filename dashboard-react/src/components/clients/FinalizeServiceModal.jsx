import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Card } from "react-bootstrap";
import { Sparkles, Camera, Clipboard, Plus, Trash2, CheckCircle, CreditCard } from "lucide-react";
import api from "../../lib/api.js";

export default function FinalizeServiceModal({ show, onHide, appointment, onCompleted }) {
  const [note, setNote] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [finalPrice, setFinalPrice] = useState(0);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [selectedWorkflowSelection, setSelectedWorkflowSelection] = useState("ALL"); // "ALL" | "NONE" | workflowId

  useEffect(() => {
    if (appointment) {
      setNote("");
      setRecommendations("");
      setBeforePhoto(null);
      setAfterPhoto(null);
      setFinalPrice(appointment.service?.price || 0);
      setSendEmail(!!appointment.client?.email);
      setSendWhatsapp(!!appointment.client?.phone);
      setPaymentMethod("Efectivo");
    }
  }, [appointment]);

  useEffect(() => {
    if (show && appointment) {
      api.get("/workflows?status=ACTIVE")
        .then(res => {
          const list = Array.isArray(res.data) ? res.data : [];
          // Filter workflows that match finalize triggers
          const filtered = list.filter(wf => {
            const type = String(wf.trigger?.type || "").toLowerCase();
            const hasFinalizeTrigger = type === "done" || type === "cita-finalizada" || 
                                      type === "payment_received" || type === "pago-recibido" ||
                                      type === "status_changed" || type === "cambio-estado-cita";
            const hasStepFinalizeTrigger = Array.isArray(wf.steps) && wf.steps.some(s => {
              if (s.type !== "trigger") return false;
              const sub = String(s.subtype || "").toLowerCase();
              return sub === "done" || sub === "cita-finalizada" || 
                     sub === "payment_received" || sub === "pago-recibido" ||
                     sub === "status_changed" || sub === "cambio-estado-cita";
            });
            return hasFinalizeTrigger || hasStepFinalizeTrigger;
          });
          setActiveWorkflows(filtered);
          setSelectedWorkflowSelection("ALL");
        })
        .catch(err => {
          console.error("Error fetching active workflows:", err);
        });
    }
  }, [show, appointment]);

  if (!appointment) return null;

  const clientName = appointment.client
    ? `${appointment.client.firstName} ${appointment.client.lastName}`
    : "Cliente general";
  const serviceName = appointment.service?.name || "Servicio General";
  const professionalName = appointment.worker
    ? `${appointment.worker.firstName} ${appointment.worker.lastName}`
    : "Profesional asignado";

  const handleImageUpload = (e, setPhoto) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setError("La imagen supera el límite de 12MB. Intenta subir una más pequeña.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setError("");
    };
    reader.onerror = () => {
      setError("Error leyendo el archivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, setPhoto) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setError("La imagen supera el límite de 12MB. Intenta subir una más pequeña.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Por favor, ingresá una nota clínica o de evolución para el historial del cliente.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let selectedWorkflowIds = null;
      if (selectedWorkflowSelection === "NONE") {
        selectedWorkflowIds = [];
      } else if (selectedWorkflowSelection !== "ALL") {
        selectedWorkflowIds = [selectedWorkflowSelection];
      }

      const payload = {
        note: note.trim(),
        recommendations: recommendations.trim(),
        beforePhoto,
        afterPhoto,
        paymentMethod,
        finalPrice,
        sendEmail,
        selectedWorkflowIds
      };

      const res = await api.post(`/appointments/${appointment.id}/finalize`, payload);

      if (res.data?.success) {
        // WhatsApp redirection if checked
        if (sendWhatsapp && appointment.client?.phone) {
          try {
            const rawPhone = appointment.client.phone.trim();
            const cleanPhone = rawPhone.replace(/\D/g, "");
            const clientName = `${appointment.client.firstName} ${appointment.client.lastName || ""}`.trim();
            const serviceName = appointment.service?.name || "Servicio";
            const workerName = appointment.worker ? `${appointment.worker.firstName} ${appointment.worker.lastName}` : "Profesional";
            const formattedPrice = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(finalPrice);
            
            const messageText = `¡Hola ${clientName}! Gracias por tu visita a Aura Studio. Te enviamos el detalle de tu servicio de hoy: *${serviceName}* con *${workerName}*.\n\n*Total abonado:* ${formattedPrice} (${paymentMethod})\n\n¡Esperamos verte pronto! 🧾✨`;
            
            let finalPhone = cleanPhone;
            if (finalPhone.length === 10 && !finalPhone.startsWith("54")) {
              finalPhone = `549${finalPhone}`;
            }
            
            const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(messageText)}`;
            window.open(waUrl, "_blank");
          } catch (waErr) {
            console.error("Error creating WhatsApp redirect:", waErr);
          }
        }

        // Reset state
        setNote("");
        setRecommendations("");
        setBeforePhoto(null);
        setAfterPhoto(null);
        if (onCompleted) {
          onCompleted(res.data.appointment);
        }
        onHide();
      } else {
        setError("Ocurrió un problema inesperado al registrar el fin de servicio.");
      }
    } catch (err) {
      console.error("Error al finalizar servicio:", err);
      setError(err?.response?.data?.error || "Error de red al guardar. Por favor reintentá.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="hegemonic-modal border-0">
      <Modal.Header closeButton className="border-0 bg-light-purple py-3 px-4 rounded-top">
        <Modal.Title className="fw-black text-dark d-flex align-items-center gap-2">
          <Sparkles className="text-purple-600 animate-pulse" size={24} />
          <span>Finalizar Servicio & Ficha Técnica</span>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4 bg-white rounded-bottom">
        <Card className="border-0 shadow-sm bg-purple-50 p-3 mb-4 rounded-xl">
          <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between">
            <div>
              <small className="text-uppercase tracking-wider text-muted font-bold font-xs block mb-1">Cliente</small>
              <div className="fw-semibold text-gray-800">{clientName}</div>
            </div>
            <div>
              <small className="text-uppercase tracking-wider text-muted font-bold font-xs block mb-1">Servicio</small>
              <span className="badge bg-purple-100 text-purple-700 font-semibold rounded-lg px-3 py-2">{serviceName}</span>
            </div>
            <div>
              <small className="text-uppercase tracking-wider text-muted font-bold font-xs block mb-1">Especialista</small>
              <div className="fw-semibold text-gray-800">{professionalName}</div>
            </div>
          </div>
        </Card>

        {error && (
          <div className="alert alert-danger border-0 rounded-xl d-flex align-items-center gap-2 mb-4">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Detalles de Cobro y Cierre */}
          <div className="border border-purple-100 rounded-2xl p-4 bg-purple-50 bg-opacity-20 mb-4 shadow-inner">
            <h4 className="h6 fw-bold mb-3 text-purple-900 d-flex align-items-center gap-1.5">
              <CreditCard size={18} className="text-purple-600" />
              <span>Detalles de Cierre & Cobro del Turno</span>
            </h4>
            
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-gray-700 mb-1">Monto a Cobrar ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(Number(e.target.value))}
                    placeholder="Monto final cobrado"
                    className="border-gray-200 rounded-xl focus-ring-purple"
                    required
                  />
                  <Form.Text className="text-muted">
                    Precio original del servicio: ${appointment.service?.price || 0}
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold text-gray-700 mb-1">Método de Pago *</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border-gray-200 rounded-xl focus-ring-purple cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Opciones de Envío de Comprobante */}
            <div className="mt-3.5 pt-3 border-top border-purple-100/50">
              <div className="fw-bold text-gray-700 mb-2 small text-uppercase tracking-wider">Enviar Comprobante Digital</div>
              <div className="d-flex flex-wrap gap-4">
                <Form.Check
                  type="checkbox"
                  id="send-email-checkbox"
                  label={
                    <span className="small text-gray-700 text-truncate">
                      Enviar por Email {appointment.client?.email ? `(${appointment.client.email})` : <em className="text-muted">(Sin email)</em>}
                    </span>
                  }
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={!appointment.client?.email}
                  className="cursor-pointer"
                />
                
                <Form.Check
                  type="checkbox"
                  id="send-whatsapp-checkbox"
                  label={
                    <span className="small text-gray-700 text-truncate">
                      Enviar por WhatsApp {appointment.client?.phone ? `(${appointment.client.phone})` : <em className="text-muted">(Sin teléfono)</em>}
                    </span>
                  }
                  checked={sendWhatsapp}
                  onChange={(e) => setSendWhatsapp(e.target.checked)}
                  disabled={!appointment.client?.phone}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Opciones de Automatizaciones si hay múltiples activas */}
          {activeWorkflows.length >= 2 && (
            <div className="border border-purple-100 rounded-2xl p-4 bg-purple-50 bg-opacity-20 mb-4 shadow-inner animate-fade-in">
              <h4 className="h6 fw-bold mb-3 text-purple-900 d-flex align-items-center gap-1.5">
                <Sparkles size={18} className="text-purple-600 animate-pulse" />
                <span>Múltiples automatizaciones detectadas para este disparador</span>
              </h4>
              <Form.Group>
                <Form.Label className="small text-gray-700 mb-2 font-semibold">
                  Seleccioná cuál de las automatizaciones activas querés ejecutar al finalizar esta cita:
                </Form.Label>
                <Form.Select
                  value={selectedWorkflowSelection}
                  onChange={(e) => setSelectedWorkflowSelection(e.target.value)}
                  className="border-gray-200 rounded-xl focus-ring-purple cursor-pointer small"
                  style={{ fontSize: "13px" }}
                >
                  <option value="ALL">✨ Ejecutar todas las automatizaciones activas ({activeWorkflows.length})</option>
                  <option value="NONE">❌ No ejecutar ninguna automatización</option>
                  {activeWorkflows.map(wf => (
                    <option key={wf.id} value={wf.id}>
                      🔄 Ejecutar solo: {wf.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          )}

          {/* Evolución clínica y Notas */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold text-gray-700 d-flex align-items-center gap-2 mb-2">
              <Clipboard size={18} className="text-purple-500" />
              <span>Notas Clínicas / Evolución del Cabello o Tratamiento *</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describí los detalles del servicio: tono aplicado, tiempo de pose, estado inicial del cabello, tratamientos utilizados..."
              className="border-gray-200 rounded-xl p-3 focus-ring-purple shadow-sm-hover"
              required
            />
          </Form.Group>

          {/* Recomendaciones Post-Tratamiento */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold text-gray-700 d-flex align-items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-emerald-500" />
              <span>Recomendaciones Post-Cuidado (Opcional)</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="¿Qué cuidados debe tener en casa? Champú recomendado, evitar el sol, hidratación diaria..."
              className="border-gray-200 rounded-xl p-3 focus-ring-purple shadow-sm-hover"
            />
          </Form.Group>

          {/* Carga de Fotos Antes/Después */}
          <div className="mb-4">
            <Form.Label className="fw-bold text-gray-700 d-flex align-items-center gap-2 mb-3">
              <Camera size={18} className="text-blue-500" />
              <span>Galería de Evolución Visual (Antes & Después)</span>
            </Form.Label>
            
            <Row className="g-4">
              {/* Foto Antes */}
              <Col md={6}>
                <div className="text-center mb-2">
                  <span className="badge bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-pill">FOTO ANTES</span>
                </div>
                
                {beforePhoto ? (
                  <div className="position-relative border border-2 border-dashed rounded-2xl overflow-hidden shadow-sm aspect-video bg-gray-50 flex items-center justify-center group" style={{ minHeight: "180px", maxHeight: "180px" }}>
                    <img
                      src={beforePhoto}
                      alt="Antes"
                      className="w-100 h-100 object-cover"
                      style={{ objectFit: "cover", width: "100%", height: "180px" }}
                    />
                    <div className="position-absolute top-2 right-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setBeforePhoto(null)}
                        className="rounded-circle shadow-lg d-flex align-items-center justify-content-center p-2 hover-scale"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, setBeforePhoto)}
                    className="border border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center cursor-pointer hover-bg-purple shadow-sm-hover transition-all flex flex-column align-items-center justify-content-center bg-gray-50"
                    style={{ minHeight: "180px" }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      id="before-photo-input"
                      className="d-none"
                      onChange={(e) => handleImageUpload(e, setBeforePhoto)}
                    />
                    <label htmlFor="before-photo-input" className="cursor-pointer d-flex flex-column align-items-center mb-0">
                      <div className="p-3 bg-white rounded-circle shadow-sm mb-2 text-amber-500">
                        <Plus size={24} />
                      </div>
                      <span className="fw-semibold text-gray-700 block mb-1">Cargar Foto Antes</span>
                      <small className="text-muted">Arrastrá una imagen o hacé click para buscar</small>
                    </label>
                  </div>
                )}
              </Col>

              {/* Foto Después */}
              <Col md={6}>
                <div className="text-center mb-2">
                  <span className="badge bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-pill">FOTO DESPUÉS</span>
                </div>
                
                {afterPhoto ? (
                  <div className="position-relative border border-2 border-dashed rounded-2xl overflow-hidden shadow-sm aspect-video bg-gray-50 flex items-center justify-center group" style={{ minHeight: "180px", maxHeight: "180px" }}>
                    <img
                      src={afterPhoto}
                      alt="Después"
                      className="w-100 h-100 object-cover"
                      style={{ objectFit: "cover", width: "100%", height: "180px" }}
                    />
                    <div className="position-absolute top-2 right-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setAfterPhoto(null)}
                        className="rounded-circle shadow-lg d-flex align-items-center justify-content-center p-2 hover-scale"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, setAfterPhoto)}
                    className="border border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center cursor-pointer hover-bg-purple shadow-sm-hover transition-all flex flex-column align-items-center justify-content-center bg-gray-50"
                    style={{ minHeight: "180px" }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      id="after-photo-input"
                      className="d-none"
                      onChange={(e) => handleImageUpload(e, setAfterPhoto)}
                    />
                    <label htmlFor="after-photo-input" className="cursor-pointer d-flex flex-column align-items-center mb-0">
                      <div className="p-3 bg-white rounded-circle shadow-sm mb-2 text-emerald-500">
                        <Plus size={24} />
                      </div>
                      <span className="fw-semibold text-gray-700 block mb-1">Cargar Foto Después</span>
                      <small className="text-muted">Arrastrá una imagen o hacé click para buscar</small>
                    </label>
                  </div>
                )}
              </Col>
            </Row>
          </div>

          <div className="d-flex justify-content-end gap-3 mt-5 border-top pt-3">
            <Button
              variant="outline-secondary"
              onClick={onHide}
              disabled={loading}
              className="rounded-xl px-4 py-2 fw-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="purple"
              disabled={loading}
              className="rounded-xl px-5 py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-2 shadow"
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Guardando evolución...</span>
                </>
              ) : (
                <>
                  <span>Finalizar Turno</span>
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
