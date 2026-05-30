import React, { useMemo, useState, useEffect } from "react";
import { Modal, Row, Col, Card, Badge, Table, Button, Form, Alert, ProgressBar, Spinner } from "react-bootstrap";
import { 
  Calendar, CreditCard, Clock, MessageCircle, Cake, Sparkles, 
  AlertTriangle, ArrowRight, BookOpen, Activity, Award, User, 
  Heart, ShoppingBag, ShieldCheck, Save, FileText, CheckCircle 
} from "lucide-react";
import { API_BASE_URL } from "../../lib/api.js";
import api from "../../lib/api.js";
import { usePermissions } from "../../auth/PermissionProvider.jsx";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const host = API_BASE_URL.replace(/\/api$/, "");
  return `${host}${url}`;
};

export default function ClientDetailModal({ show, onHide, client, appointments = [] }) {
  const { hasPermission } = usePermissions();
  
  const canViewNotes = hasPermission("clients.privateNotes.view");
  const canEditNotes = hasPermission("clients.privateNotes.edit");
  const canViewFinance = hasPermission("clients.financialHistory.view");

  const [crmData, setCrmData] = useState(null);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [errorCrm, setErrorCrm] = useState("");
  const [activeTab, setActiveTab] = useState("resumen");

  // Edición de Notas Generales / Fórmulas
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedStatus, setNotesSavedStatus] = useState(""); // "success" | "error" | ""

  // Redirigir a resumen si no tiene permiso para notas clínicas y está en ella
  useEffect(() => {
    if (!canViewNotes && activeTab === "clinico") {
      setActiveTab("resumen");
    }
  }, [canViewNotes, activeTab]);

  useEffect(() => {
    if (show && client?.id) {
      setLoadingCrm(true);
      setErrorCrm("");
      api.get(`/crm/${client.id}`)
        .then(res => {
          setCrmData(res.data);
          setNotesText(res.data?.client?.notes || "");
        })
        .catch(err => {
          console.error("Error al cargar CRM del cliente:", err);
          setErrorCrm("No se pudieron cargar los detalles CRM avanzados del cliente.");
        })
        .finally(() => {
          setLoadingCrm(false);
        });
    }
  }, [show, client?.id]);

  // Filtrar citas del cliente locales (como fallback)
  const clientAppts = useMemo(() => {
    if (!client) return [];
    return appointments
      .filter((a) => a.clientId === client.id)
      .sort((a, b) => {
        const da = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const db = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return db - da;
      });
  }, [appointments, client?.id]);

  if (!client) return null;

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setNotesSavedStatus("");
      await api.put(`/clients/${client.id}`, {
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        email: client.email,
        notes: notesText
      });
      setNotesSavedStatus("success");
      setTimeout(() => setNotesSavedStatus(""), 4000);
    } catch (e) {
      console.error("Error guardando notas generales:", e);
      setNotesSavedStatus("error");
      setTimeout(() => setNotesSavedStatus(""), 4000);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSendWhatsApp = () => {
    const metrics = crmData?.metrics;
    const days = metrics?.daysSinceLastVisit || 45;
    const serviceName = metrics?.favoriteService && metrics.favoriteService !== "Ninguno" ? metrics.favoriteService : "tratamiento favorito";
    const text = `¡Hola ${client.firstName || ""}! Te escribimos de Aura Studio. 🌸 Notamos que pasaron unos ${days} días desde tu último servicio de ${serviceName}. Queremos ofrecerte un 15% de descuento en tu próximo turno para consentirte de nuevo. ¿Te reservamos un lugar para este fin de semana?`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${client.phone ? client.phone.replace(/\D/g, "") : ""}?text=${encoded}`, "_blank");
  };

  const initialFirst = (client.firstName && typeof client.firstName === "string" && client.firstName.length > 0) ? client.firstName.charAt(0).toUpperCase() : "";
  const initialLast = (client.lastName && typeof client.lastName === "string" && client.lastName.length > 0) ? client.lastName.charAt(0).toUpperCase() : "";

  // Render Loyalty Badge based on status
  const renderLoyaltyBadge = (status) => {
    switch (status) {
      case "VIP":
        return (
          <Badge bg="warning" className="text-dark rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm border border-warning" style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", color: "#fff" }}>
            <Award size={14} className="animate-bounce" />
            <span>Cliente VIP</span>
          </Badge>
        );
      case "ACTIVO":
        return (
          <Badge bg="success" className="text-white rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #34d399 0%, #059669 100%)" }}>
            <ShieldCheck size={14} />
            <span>Activo</span>
          </Badge>
        );
      case "INACTIVO":
        return (
          <Badge bg="danger" className="text-white rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)" }}>
            <AlertTriangle size={14} />
            <span>Inactivo</span>
          </Badge>
        );
      case "NUEVO":
      default:
        return (
          <Badge bg="info" className="text-white rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)" }}>
            <User size={14} />
            <span>Nuevo</span>
          </Badge>
        );
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="hegemonic-modal border-0">
      <Modal.Header closeButton className="border-0 pb-0 bg-light py-3 px-4">
        <Modal.Title className="fw-black text-dark d-flex align-items-center gap-2">
          <Sparkles className="text-purple-600" size={24} />
          <span>Ficha Avanzada CRM & Historial Clínico</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-white rounded-bottom">
        {/* SECCIÓN 1: Perfil Básicos */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-purple-100 text-purple-700 d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: 64, height: 64, fontSize: 22, border: "2px solid #e9d5ff" }}>
              {initialFirst}{initialLast || "C"}
            </div>
            <div>
              <h2 className="h4 fw-bold text-gray-900 m-0">{client.firstName || ""} {client.lastName || ""}</h2>
              <p className="text-muted mb-0 d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: "14px" }}>
                <span>📞 {client.phone || "Sin teléfono"}</span>
                <span>•</span>
                <span>📧 {client.email || "Sin correo"}</span>
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="light" className="text-dark border rounded-pill px-3 py-2 small d-flex align-items-center gap-1.5 shadow-sm">
              <Cake size={13} className="text-pink-500" />
              <span>Socio de Estética</span>
            </Badge>
            {crmData && renderLoyaltyBadge(crmData.metrics?.loyaltyStatus)}
          </div>
        </div>

        {/* Campaña de Marketing de Reactivación */}
        {crmData?.metrics?.loyaltyStatus === "INACTIVO" && (
          <Alert variant="danger" className="rounded-2xl mb-4 border-0 d-flex align-items-center justify-content-between flex-wrap gap-3 shadow-sm bg-red-50 text-red-800 p-3">
            <div className="d-flex align-items-center gap-2.5">
              <AlertTriangle size={22} className="text-red-500 animate-bounce" />
              <div>
                <strong className="block text-gray-900">Oportunidad de Reactivación CRM:</strong> 
                <span>El cliente no registra visitas hace <strong>{crmData.metrics.daysSinceLastVisit || 60} días</strong>. Sugerimos enviarle un mensaje personalizado.</span>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={handleSendWhatsApp} className="rounded-xl d-flex align-items-center gap-1.5 px-4 py-2 fw-bold border-0 bg-red-600 text-white shadow-sm hover-bg-red-700 transition-all">
              <MessageCircle size={16} />
              <span>Enviar Oferta por WhatsApp</span>
            </Button>
          </Alert>
        )}

        {/* MENÚ DE PESTAÑAS ESTILO CRM PREMIUM */}
        <div className="d-flex border-bottom mb-4 gap-2 overflow-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "resumen"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <Activity size={16} />
            <span>Métricas CRM</span>
          </button>
          
          {canViewNotes && (
            <button
              onClick={() => setActiveTab("clinico")}
              className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
                activeTab === "clinico"
                  ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                  : "bg-light text-muted hover-bg-gray-100"
              }`}
            >
              <BookOpen size={16} />
              <span>Historial Clínico & Fórmulas</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("timeline")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "timeline"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <Clock size={16} />
            <span>Evolución en Línea de Tiempo</span>
          </button>

          <button
            onClick={() => setActiveTab("turnos")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "turnos"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <Calendar size={16} />
            <span>Historial de Citas</span>
          </button>
        </div>

        {loadingCrm ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" className="text-purple-600" />
            <p className="text-muted mt-2 fw-semibold">Procesando y analizando historial de lealtad del cliente...</p>
          </div>
        ) : errorCrm ? (
          <div className="alert alert-warning border-0 rounded-2xl p-4">
            {errorCrm}
          </div>
        ) : (
          <div>
            {/* PESTAÑA 1: RESUMEN Y MÉTRICAS */}
            {activeTab === "resumen" && crmData && (
              <div>
                <Row className="g-4 mb-4">
                  {/* Cards KPIs Inteligentes */}
                  <Col md={9}>
                    <Row className="g-3">
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Facturación Total</div>
                          {canViewFinance ? (
                            <div className="h3 fw-black text-purple-700 mb-0">{currency(crmData.metrics.totalSpent)}</div>
                          ) : (
                            <div className="h4 fw-bold text-muted mb-0">🔒 Restringido</div>
                          )}
                          <small className="text-muted mt-1">Servicios finalizados</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Visitas Completadas</div>
                          <div className="h3 fw-black text-gray-800 mb-0">{crmData.metrics.totalVisits} visitas</div>
                          <small className="text-muted mt-1">Tratamientos realizados</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Ticket Promedio</div>
                          {canViewFinance ? (
                            <div className="h3 fw-black text-emerald-600 mb-0">{currency(crmData.metrics.avgTicket)}</div>
                          ) : (
                            <div className="h4 fw-bold text-muted mb-0">🔒 Restringido</div>
                          )}
                          <small className="text-muted mt-1">Gasto medio por turno</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Frecuencia de Retorno</div>
                          <div className="h3 fw-black text-gray-800 mb-0">
                            {crmData.metrics.visitFrequencyDays > 0 
                              ? `Cada ${crmData.metrics.visitFrequencyDays} días` 
                              : "Visita única"}
                          </div>
                          <small className="text-muted mt-1">Frecuencia promedio de visitas</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Última Visita</div>
                          <div className="h4 fw-bold text-gray-800 mb-0 py-1">
                            {crmData.metrics.daysSinceLastVisit !== null 
                              ? `Hace ${crmData.metrics.daysSinceLastVisit} días` 
                              : "Sin registros"}
                          </div>
                          <small className="text-muted mt-1">
                            {crmData.clinicalHistory?.[0]?.appointment?.startsAt
                              ? new Date(crmData.clinicalHistory[0].appointment.startsAt).toLocaleDateString("es-AR")
                              : ""}
                          </small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Próximos Turnos</div>
                          <div className="h3 fw-black text-indigo-600 mb-0">{crmData.metrics.upcomingVisitsCount} agendados</div>
                          <small className="text-muted mt-1">Reservas futuras activas</small>
                        </Card>
                      </Col>
                    </Row>
                  </Col>

                  {/* FIDELIDAD Y PREFERENCIAS */}
                  <Col md={3}>
                    <Card className="border-0 bg-purple-50 p-4 rounded-2xl h-100 d-flex flex-column justify-content-between shadow-sm">
                      <div>
                        <h4 className="h6 fw-bold text-purple-800 mb-2 uppercase tracking-wide d-flex align-items-center gap-1.5">
                          <Heart size={15} />
                          <span>Índice de Retención</span>
                        </h4>
                        <div className="d-flex align-items-baseline gap-2 mb-2">
                          <span className="h2 fw-black text-purple-900 mb-0">{crmData.metrics.retentionIndex}%</span>
                          <small className="text-purple-700 fw-bold">Fidelizado</small>
                        </div>
                        <ProgressBar 
                          now={crmData.metrics.retentionIndex} 
                          variant="purple" 
                          className="rounded-pill shadow-inner" 
                          style={{ height: "8px", backgroundColor: "#f3e8ff" }}
                        />
                      </div>
                      
                      <div className="mt-4 pt-3 border-top border-purple-100">
                        <div className="mb-3">
                          <small className="text-muted block smaller fw-bold uppercase">Servicio Favorito</small>
                          <div className="fw-bold text-gray-800 d-flex align-items-center gap-1.5 mt-0.5">
                            <ShoppingBag size={14} className="text-purple-500" />
                            <span>{crmData.metrics.favoriteService}</span>
                          </div>
                        </div>
                        <div>
                          <small className="text-muted block smaller fw-bold uppercase">Estilista Preferido</small>
                          <div className="fw-bold text-gray-800 d-flex align-items-center gap-1.5 mt-0.5">
                            <User size={14} className="text-purple-500" />
                            <span>{crmData.metrics.favoriteProfessional}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Resumen Histórico y Diagnóstico Rápido */}
                {canViewNotes && (
                  <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                    <h3 className="h6 fw-bold text-gray-900 mb-3 d-flex align-items-center gap-2">
                      <FileText size={18} className="text-purple-500" />
                      <span>Último Diagnóstico Clínico Registrado</span>
                    </h3>
                    
                    {crmData.clinicalHistory?.length > 0 ? (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                          <span className="badge bg-purple-100 text-purple-700 fw-bold px-3 py-1.5 rounded-lg">
                            {crmData.clinicalHistory[0].appointment?.service?.name || "Tratamiento"}
                          </span>
                          <small className="text-muted fw-semibold">
                            Por: {crmData.clinicalHistory[0].worker ? `${crmData.clinicalHistory[0].worker.firstName} ${crmData.clinicalHistory[0].worker.lastName}` : "Profesional"} • {new Date(crmData.clinicalHistory[0].createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                          </small>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 mb-3" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                          {crmData.clinicalHistory[0].note}
                        </div>
                        {crmData.clinicalHistory[0].recommendations && (
                          <div className="d-flex align-items-start gap-2 text-emerald-800 bg-emerald-50 bg-opacity-60 p-2.5 rounded-xl border border-emerald-100" style={{ fontSize: "13px" }}>
                            <span className="fw-bold">💡 Recomendación de Cuidado:</span>
                            <span>{crmData.clinicalHistory[0].recommendations}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-xl text-muted small">
                        Todavía no se han registrado fichas de evolución clínica para este cliente.
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}

            {/* PESTAÑA 2: HISTORIAL CLÍNICO Y FÓRMULAS */}
            {activeTab === "clinico" && canViewNotes && crmData && (
              <div>
                <Row className="g-4">
                  {/* Fórmulas Químicas y Preferencias Estables */}
                  <Col md={12}>
                    <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2 text-gray-900">
                          <BookOpen size={18} className="text-purple-500" />
                          <span>Fórmula Química de Coloración y Preferencias Generales</span>
                        </h3>
                        {notesSavedStatus === "success" && (
                          <span className="text-emerald-600 fw-bold small animate-pulse">✓ ¡Notas guardadas correctamente!</span>
                        )}
                        {notesSavedStatus === "error" && (
                          <span className="text-red-600 fw-bold small">⚠️ Error al guardar notas.</span>
                        )}
                      </div>
                      
                      <Form.Group className="mb-3">
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={notesText}
                          readOnly={!canEditNotes}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder={canEditNotes ? "Fórmulas de coloración frecuentes, tiempos de pose, productos favoritos del cliente, alergias..." : "No tienes permisos para editar estas notas clínicas."}
                          className="border-gray-200 rounded-xl p-3 focus-ring-purple shadow-sm-hover"
                          style={{ fontSize: "14px" }}
                        />
                      </Form.Group>

                      {canEditNotes && (
                        <div className="d-flex justify-content-end">
                          <Button
                            variant="purple"
                            disabled={savingNotes}
                            onClick={handleSaveNotes}
                            className="rounded-xl px-4 py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-1.5 shadow"
                          >
                            {savingNotes ? (
                              <>
                                <Spinner size="sm" animation="border" />
                                <span>Guardando...</span>
                              </>
                            ) : (
                              <>
                                <Save size={16} />
                                <span>Guardar Cambios</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </Card>
                  </Col>

                  {/* Evolución clínica registrada sesión por sesión */}
                  <Col md={12}>
                    <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                      <h3 className="h6 fw-bold mb-4 d-flex align-items-center gap-2 text-gray-900 border-bottom pb-3">
                        <Activity size={18} className="text-purple-500" />
                        <span>Historial Clínico Sesión por Sesión</span>
                      </h3>

                      {crmData.clinicalHistory?.length === 0 ? (
                        <div className="text-center py-5 text-muted small">
                          Aún no hay registros de evolución específicos para este cliente. Se agregarán automáticamente al finalizar servicios en la agenda.
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-4">
                          {crmData.clinicalHistory.map((noteRecord) => {
                            // Find matching photos for this appointment
                            const sessionPhotos = crmData.gallery?.filter(p => p.appointmentId === noteRecord.appointmentId) || [];
                            
                            return (
                              <div key={noteRecord.id} className="p-3 border rounded-2xl bg-light shadow-sm-hover transition-all">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom pb-2 mb-2">
                                  <div>
                                    <span className="badge bg-purple-100 text-purple-700 fw-bold px-2.5 py-1.5 rounded-lg me-2">
                                      {noteRecord.appointment?.service?.name || "Servicio"}
                                    </span>
                                    <span className="text-muted small fw-semibold">
                                      Estilista: {noteRecord.worker ? `${noteRecord.worker.firstName} ${noteRecord.worker.lastName}` : "Profesional"}
                                    </span>
                                  </div>
                                  <small className="text-purple-700 fw-bold bg-purple-50 rounded-pill px-3 py-1">
                                    📅 {new Date(noteRecord.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} hs
                                  </small>
                                </div>

                                <div className="text-gray-700 p-2 rounded bg-white border-left border-purple-500 mb-3" style={{ fontSize: "14px", borderLeft: "4px solid #9333ea" }}>
                                  <div className="fw-semibold text-xs text-muted mb-1 text-uppercase tracking-wider">Notas de Sesión</div>
                                  {noteRecord.note}
                                </div>

                                {noteRecord.recommendations && (
                                  <div className="mb-3 d-flex align-items-start gap-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100" style={{ fontSize: "13px" }}>
                                    <span className="fw-bold">🌱 Cuidados recomendados en casa:</span>
                                    <span>{noteRecord.recommendations}</span>
                                  </div>
                                )}

                                {/* Photos of this specific session */}
                                {sessionPhotos.length > 0 && (
                                  <div className="mt-3">
                                    <div className="fw-semibold text-xs text-muted mb-2 text-uppercase tracking-wider">Galería Antes y Después de la Sesión</div>
                                    <Row className="g-3">
                                      {sessionPhotos.map((photo) => (
                                        <Col xs={6} md={3} key={photo.id}>
                                          <div className="position-relative rounded-xl overflow-hidden border aspect-video shadow-sm" style={{ height: "130px" }}>
                                            <img
                                              src={getImageUrl(photo.imageUrl)}
                                              alt={photo.type}
                                              className="w-100 h-100 object-fit-cover"
                                              style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                            />
                                            <span 
                                              className={`position-absolute bottom-2 left-2 badge rounded-pill px-2.5 py-1 text-white fw-bold ${
                                                photo.type === "before" ? "bg-amber-500" : "bg-emerald-500"
                                              }`}
                                              style={{ fontSize: "10px", left: "8px", bottom: "8px" }}
                                            >
                                              {photo.type === "before" ? "Antes" : "Después"}
                                            </span>
                                          </div>
                                        </Col>
                                      ))}
                                    </Row>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* PESTAÑA 3: LÍNEA DE TIEMPO CRM */}
            {activeTab === "timeline" && crmData && (
              <div>
                <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                  <h3 className="h6 fw-bold mb-4 d-flex align-items-center gap-2 text-gray-900 border-bottom pb-3">
                    <Clock size={18} className="text-purple-500" />
                    <span>Línea de Tiempo de Evolución (Visual CRM)</span>
                  </h3>

                  {(() => {
                    const filteredTimeline = (crmData.timeline || []).filter(event => {
                      if (event.type === "clinical_note" && !canViewNotes) return false;
                      return true;
                    });

                    if (filteredTimeline.length === 0) {
                      return (
                        <div className="text-center py-5 text-muted small">
                          Sin eventos registrados en la línea de tiempo.
                        </div>
                      );
                    }

                    return (
                      <div className="position-relative ps-4 ms-2" style={{ borderLeft: "2px solid #e9d5ff" }}>
                        {filteredTimeline.map((event, index) => {
                          return (
                            <div key={event.id} className="position-relative mb-5 animate-fade-in">
                              {/* Dot indicator */}
                              <div 
                                className="position-absolute rounded-circle d-flex align-items-center justify-content-center shadow"
                                style={{ 
                                  left: "-32px", 
                                  top: "0px", 
                                  width: "24px", 
                                  height: "24px",
                                  backgroundColor: event.type === "creation" ? "#3b82f6" : event.type === "appointment" ? (event.status === "DONE" ? "#10b981" : "#f59e0b") : event.type === "clinical_note" ? "#8b5cf6" : "#ec4899",
                                  color: "#fff",
                                  fontSize: "10px"
                                }}
                              >
                                {event.type === "creation" ? "✓" : event.type === "appointment" ? "📅" : event.type === "clinical_note" ? "📝" : "🖼️"}
                              </div>

                              {/* Event Header */}
                              <div className="d-flex justify-content-between align-items-baseline mb-2 flex-wrap gap-2">
                                <h5 className="h6 fw-bold text-gray-900 m-0">{event.title}</h5>
                                <small className="text-purple-600 fw-bold bg-purple-50 rounded-pill px-2.5 py-0.5" style={{ fontSize: "12px" }}>
                                  {new Date(event.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} hs
                                </small>
                              </div>

                              {/* Event Body */}
                              <div className="p-3 rounded-xl bg-light border shadow-inner text-gray-700" style={{ fontSize: "13.5px" }}>
                                <p className="mb-0">{event.description}</p>
                                
                                {/* Specialized payload elements based on event type */}
                                {event.type === "appointment" && (
                                  <div className="mt-2 pt-2 border-top border-gray-200 d-flex flex-wrap gap-3 align-items-center">
                                    <span className={`badge ${
                                      event.status === "DONE" ? "bg-secondary" : event.status === "CONFIRMED" ? "bg-success" : event.status === "CANCELLED" ? "bg-danger" : "bg-warning"
                                    }`}>
                                      {event.status === "DONE" ? "Realizada" : event.status === "CONFIRMED" ? "Confirmada" : event.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                                    </span>
                                    {canViewFinance && (
                                      <span className="fw-bold text-dark">{currency(event.metadata.price)}</span>
                                    )}
                                    {event.metadata.notes && (
                                      <span className="text-muted smaller italic">"{event.metadata.notes}"</span>
                                    )}
                                  </div>
                                )}

                                {event.type === "clinical_note" && (
                                  <div className="mt-2 pt-2 border-top border-gray-200">
                                    <div className="text-muted smaller fw-bold uppercase">Recomendaciones:</div>
                                    <div className="text-emerald-800 bg-emerald-50 rounded p-2 mt-1">
                                      {event.metadata.recommendations || "Sin especificaciones especiales."}
                                    </div>
                                  </div>
                                )}

                              {event.type === "photos_session" && (
                                <div className="mt-3">
                                  <Row className="g-2">
                                    {event.metadata.photos?.map((photo) => (
                                      <Col xs={6} md={3} key={photo.id}>
                                        <div className="position-relative border rounded-lg overflow-hidden" style={{ height: "90px" }}>
                                          <img
                                            src={getImageUrl(photo.imageUrl)}
                                            alt={photo.type}
                                            className="w-100 h-100 object-fit-cover"
                                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                          />
                                          <span 
                                            className={`position-absolute bottom-1 left-1 badge rounded px-1.5 py-0.5 text-white fw-bold ${
                                              photo.type === "before" ? "bg-amber-500" : "bg-emerald-500"
                                            }`}
                                            style={{ fontSize: "8px", left: "4px", bottom: "4px" }}
                                          >
                                            {photo.type === "before" ? "Antes" : "Después"}
                                          </span>
                                        </div>
                                      </Col>
                                    ))}
                                  </Row>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                </Card>
              </div>
            )}

            {/* PESTAÑA 4: HISTORIAL COMPLETO DE CITAS */}
            {activeTab === "turnos" && (
              <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-gray-900 border-bottom pb-3">
                  <Calendar size={18} className="text-purple-500" />
                  <span>Historial de Citas del Cliente</span>
                </h3>
                
                {clientAppts.length === 0 ? (
                  <div className="text-muted py-4 text-center">No hay citas registradas para este cliente.</div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0 align-middle">
                      <thead>
                        <tr className="table-header-small" style={{ fontSize: "11px", backgroundColor: "#f9fafb" }}>
                          <th className="py-2.5">Fecha y Hora</th>
                          <th className="py-2.5">Servicio</th>
                          <th className="py-2.5">Profesional</th>
                          {canViewFinance && <th className="py-2.5">Precio</th>}
                          <th className="py-2.5">Estado</th>
                          <th className="py-2.5">Notas / Comentarios</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: "13px" }}>
                        {clientAppts.map((a) => (
                          <tr key={a.id} className="transition-all hover-bg-light">
                            <td className="text-secondary fw-semibold">
                              {(() => {
                                if (!a.startsAt) return "—";
                                const d = new Date(a.startsAt);
                                if (isNaN(d.getTime())) return "—";
                                return d.toLocaleString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " hs";
                              })()}
                            </td>
                            <td className="fw-bold text-gray-900">{a.service?.name}</td>
                            <td className="text-gray-700">{a.worker ? `${a.worker.firstName} ${a.worker.lastName}` : "General"}</td>
                            {canViewFinance && <td className="fw-black text-purple-700">{currency(a.service?.price)}</td>}
                            <td>
                              <Badge 
                                bg={a.status === "DONE" ? "secondary" : a.status === "CONFIRMED" ? "success" : a.status === "CANCELLED" ? "danger" : "warning"} 
                                className="rounded-pill px-2.5 py-1.5 fw-bold"
                              >
                                {a.status === "DONE" ? "Finalizada" : a.status === "CONFIRMED" ? "Confirmada" : a.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                              </Badge>
                            </td>
                            <td className="text-muted smaller italic">{a.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
        <Button variant="secondary" onClick={onHide} className="rounded-xl px-4 py-2 fw-semibold">
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
