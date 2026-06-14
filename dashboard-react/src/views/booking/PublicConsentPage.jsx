import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Container, Card, Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
import { ShieldCheck, AlertTriangle, FileText, CheckCircle, RefreshCw, Printer, ArrowRight, Heart } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../lib/api.js";

export default function PublicConsentPage() {
  const { token } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedSignature, setSavedSignature] = useState("");
  const [consentData, setConsentData] = useState(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [medication, setMedication] = useState("");
  const [pregnant, setPregnant] = useState("no");
  const [otherConditions, setOtherConditions] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [hasSignature, setHasSignature] = useState(false);

  // Canvas ref for drawing signature
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fetch consent request details
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE_URL}/public/consent/${token}`)
      .then((res) => {
        setConsentData(res.data);
        if (res.data.client) {
          setFullName(`${res.data.client.firstName || ""} ${res.data.client.lastName || ""}`.trim());
          setClientEmail(res.data.client.email || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch consent request error:", err);
        setError(err.response?.data?.error || "La solicitud de consentimiento no es válida, ha expirado o ya fue firmada.");
        setLoading(false);
      });
  }, [token]);

  // Touch & Mouse Drawing Handlers
  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a103c";

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    
    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    
    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit Signature handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token || !accepted || !fullName.trim() || !hasSignature) return;

    setSigning(true);
    setError("");

    // Get Base64 image from canvas
    const signatureImage = canvasRef.current.toDataURL("image/png");

    const payload = {
      fullNameTyped: fullName.trim(),
      signatureImage,
      allergies,
      email: clientEmail.trim() || null,
      medicalDeclarations: {
        medication: medication.trim() || null,
        pregnant: pregnant === "yes",
        conditions: otherConditions.trim() || null,
        notes: otherConditions.trim() || null,
        phone: consentData?.client?.phone || ""
      },
      accepted: true
    };

    axios
      .post(`${API_BASE_URL}/public/consent/${token}/sign`, payload)
      .then(() => {
        setSavedSignature(signatureImage);
        setSuccess(true);
        setSigning(false);
      })
      .catch((err) => {
        console.error("Sign consent error:", err);
        setError(err.response?.data?.error || "Ocurrió un error al procesar tu firma. Por favor intenta de nuevo.");
        setSigning(false);
      });
  };

  // Print Mode Trigger
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Container className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: "80vh" }}>
        <Spinner animation="border" variant="purple" className="text-purple-600 mb-3" style={{ width: "3.5rem", height: "3.5rem" }} />
        <h4 className="text-purple-900 fw-bold animate-pulse">Cargando documento de consentimiento...</h4>
        <p className="text-muted small">Por favor espera un momento.</p>
      </Container>
    );
  }

  if (error && !consentData) {
    return (
      <Container className="py-5" style={{ maxWidth: "600px" }}>
        <Card className="border-0 shadow-lg p-4 text-center rounded-4 card-premium mt-5">
          <Card.Body>
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mb-3">
              <AlertTriangle size={36} />
            </div>
            <h4 className="fw-black text-purple-900 mb-3">Enlace No Válido</h4>
            <Alert variant="danger" className="border-0 rounded-3 text-start small mb-4">
              {error}
            </Alert>
            <p className="text-muted small">
              Si crees que esto es un error, por favor ponte en contacto con el establecimiento para que te generen una nueva solicitud de firma.
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="py-5" style={{ maxWidth: "700px" }}>
        <Card className="border-0 shadow-lg p-5 text-center rounded-4 card-premium mt-4 animate-fade-in print-hidden">
          <Card.Body>
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle d-inline-flex mb-4">
              <CheckCircle size={48} className="text-success animate-bounce" />
            </div>
            <h2 className="fw-black text-purple-900 mb-2">¡Firma Registrada!</h2>
            <p className="text-emerald-700 fw-bold mb-4">El consentimiento informado se ha guardado de forma inmutable.</p>
            
            <Alert variant="info" className="border-0 rounded-4 text-start p-4 mb-4 bg-purple-50 text-purple-900">
              <h5 className="fw-bold mb-2">¿Qué sigue ahora?</h5>
              <ul className="small mb-0 ps-3">
                <li className="mb-1">El salón ya tiene tu firma guardada en su ficha de cliente.</li>
                {clientEmail && <li className="mb-1">Te hemos enviado una copia en formato digital a: <strong>{clientEmail}</strong>.</li>}
                <li>Puedes descargar/guardar una copia física de lo firmado ahora mismo.</li>
              </ul>
            </Alert>

            <div className="d-grid gap-2 d-md-flex justify-content-center mt-4">
              <Button 
                variant="purple" 
                onClick={handlePrint}
                className="rounded-xl px-4 py-2.5 fw-bold text-white bg-purple-600 border-0 hover-bg-purple-700 shadow d-flex align-items-center justify-content-center gap-2"
              >
                <Printer size={18} />
                <span>Descargar / Imprimir copia</span>
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* PRINT LAYOUT FOR CUSTOMER REFERENCE */}
        <div className="print-only p-5 bg-white text-dark" style={{ display: "none" }}>
          <div style={{ borderBottom: "2px solid #7c3aed", paddingBottom: "15px", marginBottom: "20px" }}>
            <h2>Consentimiento Informado Digital</h2>
            <p style={{ margin: "5px 0" }} translate="no"><strong>Establecimiento:</strong> {consentData?.business?.name || "Aura Studio"}</p>
            <p style={{ margin: "5px 0" }}><strong>Procedimiento:</strong> {consentData?.template?.name}</p>
            <p style={{ margin: "5px 0" }}><strong>Fecha de firma:</strong> {new Date().toLocaleDateString("es-AR")} {new Date().toLocaleTimeString("es-AR")} hs</p>
          </div>

          <div style={{ marginBottom: "25px" }}>
            <h3>1. Términos y Condiciones Aceptados</h3>
            <div style={{ whiteSpace: "pre-wrap", fontSize: "12px", border: "1px solid #ddd", padding: "15px", borderRadius: "5px", background: "#fafafa" }}>
              {consentData?.template?.body}
            </div>
          </div>

          <div style={{ marginBottom: "25px" }}>
            <h3>2. Declaración de Salud</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>Alergias declaradas:</td>
                  <td style={{ padding: "8px 0" }}>{allergies || "Ninguna"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>Medicación actual:</td>
                  <td style={{ padding: "8px 0" }}>{medication || "Ninguna"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>¿Embarazo o Lactancia?:</td>
                  <td style={{ padding: "8px 0" }}>{pregnant === "yes" ? "Sí" : "No"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 0", fontWeight: "bold" }}>Otras observaciones:</td>
                  <td style={{ padding: "8px 0" }}>{otherConditions || "Ninguna"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ margin: "5px 0" }}><strong>Nombre Completo:</strong> {fullName}</p>
              <p style={{ margin: "5px 0", fontSize: "11px", color: "#666" }}>Declarado electrónicamente bajo el token: {token}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "12px" }}>Firma del Cliente:</p>
              <img src={savedSignature} alt="Firma digital" style={{ maxWidth: "200px", borderBottom: "1px solid #000" }} />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const { template, business } = consentData;

  return (
    <Container className="py-5 print-hidden" style={{ maxWidth: "800px" }}>
      {/* Header del Negocio */}
      <div className="text-center mb-4">
        {business?.logo ? (
          <img src={business.logo} alt={business.name} className="mb-2" style={{ maxHeight: "60px", borderRadius: "10px" }} />
        ) : (
          <div className="rounded-3 bg-purple-100 text-purple-700 d-inline-flex p-3 fw-bold mb-2 shadow-sm border border-purple-200">
            {business?.name?.substring(0, 2).toUpperCase() || "AS"}
          </div>
        )}
        <h4 className="text-muted smaller m-0 uppercase tracking-wider" translate="no">{business?.name || "Aura Studio"}</h4>
        <h2 className="fw-black text-purple-900 mt-1">{template.name}</h2>
        <span className="badge bg-purple-50 text-purple-700 px-3 py-1.5 rounded-pill fw-bold border border-purple-100 mt-2">
          Consentimiento Obligatorio v{consentData.templateVersion}
        </span>
      </div>

      {error && (
        <Alert variant="danger" className="rounded-xl border-0 shadow-sm mb-4">
          <AlertTriangle size={18} className="me-2" />
          <span>{error}</span>
        </Alert>
      )}

      <Form onSubmit={handleSubmit} className="d-grid gap-4">
        {/* SECCIÓN 1: CUERPO LEGAL Y TÉRMINOS */}
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4 card-premium">
          <Card.Body className="p-0">
            <h3 className="h6 fw-bold text-purple-800 mb-3 uppercase tracking-wide d-flex align-items-center gap-2 border-bottom pb-2">
              <FileText size={18} className="text-purple-600" />
              <span>Términos y Declaraciones del Procedimiento</span>
            </h3>
            
            <div 
              className="text-gray-700 bg-light p-3 rounded-3 mb-4 overflow-auto border shadow-inner scrollbar-thin"
              style={{ maxHeight: "280px", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}
            >
              {template.body}
            </div>

            {/* Cuidados, requisitos, contraindicaciones */}
            <Row className="g-3">
              {template.whatToKnow && (
                <Col md={12}>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-900 small">
                    <strong>💡 Lo que debes saber / Qué se te hará:</strong>
                    <p className="mb-0 mt-1">{template.whatToKnow}</p>
                  </div>
                </Col>
              )}

              {template.requirements && (
                <Col md={6}>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 small h-100">
                    <strong>✓ Requisitos previos / Qué cumplir:</strong>
                    <p className="mb-0 mt-1">{template.requirements}</p>
                  </div>
                </Col>
              )}

              {template.contraindications && (
                <Col md={6}>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-900 small h-100">
                    <strong>🚫 Contraindicaciones médicas:</strong>
                    <p className="mb-0 mt-1">{template.contraindications}</p>
                  </div>
                </Col>
              )}

              {template.preCare && (
                <Col md={6}>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-950 small h-100">
                    <strong>🗓️ Cuidados Pre-Procedimiento:</strong>
                    <p className="mb-0 mt-1">{template.preCare}</p>
                  </div>
                </Col>
              )}

              {template.postCare && (
                <Col md={6}>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 small h-100">
                    <strong>💆 Cuidados Post-Procedimiento:</strong>
                    <p className="mb-0 mt-1">{template.postCare}</p>
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* SECCIÓN 2: FORMULARIO DE DECLARACIÓN DE SALUD */}
        {template.collectAllergies && (
          <Card className="border-0 shadow-sm rounded-4 bg-white p-4 card-premium">
            <Card.Body className="p-0">
              <h3 className="h6 fw-bold text-purple-800 mb-3.5 uppercase tracking-wide d-flex align-items-center gap-2 border-bottom pb-2">
                <Heart size={18} className="text-pink-500 animate-pulse" />
                <span>Declaración de Salud Obligatoria</span>
              </h3>
              
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">¿Tiene alergias o sensibilidades?</Form.Label>
                    <Form.Control
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Ej: Penicilina, látex, cosméticos (deje vacío si no)"
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">¿Toma alguna medicación actual?</Form.Label>
                    <Form.Control
                      type="text"
                      value={medication}
                      onChange={(e) => setMedication(e.target.value)}
                      placeholder="Ej: Aspirinas, anticoagulantes, roacutan"
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">¿Está cursando embarazo o lactancia?</Form.Label>
                    <Form.Select 
                      value={pregnant} 
                      onChange={(e) => setPregnant(e.target.value)} 
                      className="border-gray-200 rounded-xl"
                    >
                      <option value="no">No</option>
                      <option value="yes">Sí, estoy embarazada o en período de lactancia</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">Email para recibir copia digital</Form.Label>
                    <Form.Control
                      type="email"
                      required={Boolean(!consentData.client?.email)}
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">Otras condiciones o comentarios médicos</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={otherConditions}
                      onChange={(e) => setOtherConditions(e.target.value)}
                      placeholder="Declare cualquier condición cardíaca, diabetes, problemas de cicatrización, etc."
                      className="border-gray-200 rounded-xl"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* SECCIÓN 3: FIRMA DIGITAL Y DOBLE CONFIRMACIÓN */}
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4 card-premium">
          <Card.Body className="p-0">
            <h3 className="h6 fw-bold text-purple-800 mb-3 uppercase tracking-wide d-flex align-items-center gap-2 border-bottom pb-2">
              <ShieldCheck size={18} className="text-purple-600" />
              <span>Firma y Consentimiento Legal</span>
            </h3>

            <Row className="g-3">
              <Col md={12} className="mb-2">
                <Form.Group>
                  <Form.Check 
                    type="checkbox"
                    id="checkbox-accept-terms"
                    required
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    label="Declaro bajo juramento que he leído la totalidad de este consentimiento informado, que comprendo los términos y declaro la veracidad de mi estado de salud."
                    className="fw-bold text-gray-800 small"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">Escribe tu Nombre Completo</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Selenia Sánchez"
                    className="border-gray-200 rounded-xl fw-bold text-gray-950 p-2.5 focus-ring-purple"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-baseline mb-1">
                    <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider m-0">Dibuja tu firma digital aquí</Form.Label>
                    <button 
                      type="button" 
                      onClick={clearSignature}
                      className="btn btn-link p-0 text-decoration-none text-red-600 fw-bold text-xxs"
                    >
                      Borrar / Rehacer
                    </button>
                  </div>

                  <div className="border rounded-xl bg-light overflow-hidden position-relative" style={{ height: "140px" }}>
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={138}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        cursor: "crosshair",
                        touchAction: "none"
                      }}
                    />
                    {!hasSignature && (
                      <div className="position-absolute top-50 start-50 translate-middle pointer-events-none text-muted smaller opacity-50 text-center w-100">
                        Usa el dedo o el mouse para firmar
                      </div>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Aviso de privacidad legal */}
            <p className="text-muted text-xxs mt-3 mb-0">
              Aviso legal: Al rellenar este formulario y firmar digitalmente, usted presta su libre consentimiento informado y autoriza el tratamiento de sus datos de salud con fines exclusivamente estéticos/médicos por parte de este establecimiento, en cumplimiento de las leyes de protección de datos personales. Su firma electrónica, IP ({window.location.hostname}) y datos de dispositivo quedan registrados como evidencia digital legal.
            </p>

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <Button
                variant="purple"
                type="submit"
                disabled={signing || !accepted || !fullName.trim() || !hasSignature}
                className="rounded-xl px-5 py-2.5 fw-bold text-white bg-purple-600 border-0 hover-bg-purple-700 shadow d-flex align-items-center gap-1.5"
              >
                {signing ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    <span>Procesando firma...</span>
                  </>
                ) : (
                  <>
                    <span>Firmar y Enviar Consentimiento</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Form>
    </Container>
  );
}
