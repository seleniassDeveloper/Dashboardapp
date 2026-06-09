import React, { useEffect, useState } from "react";
import { Card, Button, Spinner, Alert, ListGroup, Form, InputGroup } from "react-bootstrap";
import { Calendar, RefreshCw, Trash2, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Link2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../lib/api.js";

export default function GoogleSyncSettings() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState({ connected: false, googleCalendarId: "primary" });
  const [calendarIdInput, setCalendarIdInput] = useState("primary");
  const [savingCalendarId, setSavingCalendarId] = useState(false);
  const [bookingUrlInput, setBookingUrlInput] = useState("");
  const [savingBookingUrl, setSavingBookingUrl] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/google/status");
      if (res.data) {
        setStatus({
          connected: res.data.connected === true,
          googleCalendarId: res.data.googleCalendarId || "primary",
        });
        setCalendarIdInput(res.data.googleCalendarId || "primary");
        setBookingUrlInput(res.data.googleBookingUrl || "");
      }
    } catch (e) {
      console.error("Error al obtener estado de Google Calendar:", e);
      setError("No se pudo obtener el estado de la conexión de Google Calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Mostrar mensaje de éxito si viene de la redirección OAuth con éxito
    if (searchParams.get("google_sync") === "success") {
      setSuccess("¡Cuenta de Google Calendar vinculada con éxito!");
      // Limpiar query param para que no quede permanente
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("google_sync");
      setSearchParams(newParams);
    }
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      setError("");
      setSuccess("");
      const res = await api.get("/google/auth-url");
      if (res.data && res.data.url) {
        // Redirigir a Google Consent Screen
        window.location.href = res.data.url;
      } else {
        throw new Error("No se recibió la URL de autenticación.");
      }
    } catch (e) {
      console.error("Error al iniciar conexión de Google:", e);
      const errMsg = e.response?.data?.message || e.response?.data?.error || e.message || "Error al iniciar el proceso de autorización con Google.";
      setError(errMsg);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError("");
      setSuccess("");
      const res = await api.post("/google/sync");
      if (res.data && res.data.success) {
        setSuccess(`Sincronización finalizada. Nuevas citas añadidas desde Google Calendar: ${res.data.synced || 0}`);
      } else {
        setError(res.data.message || "Error al sincronizar citas con Google Calendar.");
      }
    } catch (e) {
      console.error("Error al sincronizar con Google Calendar:", e);
      setError("Ocurrió un error al intentar sincronizar citas en este momento.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCalendarId = async () => {
    try {
      setSavingCalendarId(true);
      setError("");
      setSuccess("");
      const res = await api.post("/google/calendar-id", { googleCalendarId: calendarIdInput });
      if (res.data && res.data.success) {
        setSuccess("ID de calendario de Google actualizado con éxito.");
        setStatus(prev => ({ ...prev, googleCalendarId: calendarIdInput }));
      }
    } catch (e) {
      console.error("Error al guardar calendar ID:", e);
      setError("No se pudo guardar el ID de calendario.");
    } finally {
      setSavingCalendarId(false);
    }
  };

  const handleSaveBookingUrl = async () => {
    try {
      setSavingBookingUrl(true);
      setError("");
      setSuccess("");
      const res = await api.post("/google/booking-url", { googleBookingUrl: bookingUrlInput });
      if (res.data && res.data.success) {
        setSuccess("Enlace de reservas de Google Calendar guardado con éxito.");
      }
    } catch (e) {
      console.error("Error al guardar booking URL:", e);
      setError("No se pudo guardar el enlace de reservas.");
    } finally {
      setSavingBookingUrl(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("¿Estás seguro de que deseas desvincular tu Google Calendar? Se detendrá la sincronización automática de citas.")) {
      return;
    }

    try {
      setDisconnecting(true);
      setError("");
      setSuccess("");
      const res = await api.post("/google/disconnect");
      if (res.data && res.data.success) {
        setSuccess("Google Calendar desvinculado con éxito.");
        setStatus({ connected: false, googleCalendarId: "primary" });
      }
    } catch (e) {
      console.error("Error al desconectar Google Calendar:", e);
      setError("No se pudo desvincular Google Calendar.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" role="status" className="mb-2" />
        <p className="text-muted">Cargando estado de la integración...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess("")} dismissible>{success}</Alert>}

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: "linear-gradient(135deg, #ffffff 0%, #fcfaff 100%)" }}>
        <div style={{ height: "6px", background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)" }} />
        <Card.Body className="p-4">
          <div className="d-flex align-items-start gap-3 mb-4">
            <div className="p-3 bg-light rounded-4 text-primary d-flex align-items-center justify-content-center" style={{ color: "#7c3aed", backgroundColor: "#f3e8ff" }}>
              <Calendar size={32} />
            </div>
            <div>
              <h2 className="h4 fw-bold mb-1">Google Calendar Sync</h2>
              <p className="text-muted mb-0">
                Vinculá la agenda de tu salón para sincronizar citas de forma automática y bidireccional.
              </p>
            </div>
          </div>

          <div className="bg-light p-3.5 rounded-4 mb-4 border border-light-subtle">
            <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              <ShieldCheck size={18} className="text-primary" />
              ¿Cómo vincular tu negocio y usar los enlaces de reserva de Google?
            </h3>
            <ol className="list-unstyled d-flex flex-column gap-3 mb-0 small text-secondary" style={{ paddingLeft: 0 }}>
              <li className="d-flex align-items-start gap-3">
                <span className="badge rounded-circle p-2 d-flex align-items-center justify-content-center text-white" style={{ width: "24px", height: "24px", minWidth: "24px", backgroundColor: "#7c3aed" }}>1</span>
                <div>
                  <strong className="text-dark d-block mb-0.5">Conecta tu cuenta de Google</strong>
                  Haz clic en el botón de abajo <strong>"Conectar Google Calendar"</strong> para autorizar al sistema a sincronizarse con tu agenda de Gmail.
                </div>
              </li>
              <li className="d-flex align-items-start gap-3">
                <span className="badge rounded-circle p-2 d-flex align-items-center justify-content-center text-white" style={{ width: "24px", height: "24px", minWidth: "24px", backgroundColor: "#7c3aed" }}>2</span>
                <div>
                  <strong className="text-dark d-block mb-0.5">Crea tu link de reservas oficial de Google</strong>
                  En tu computadora, ve a tu <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-primary fw-semibold text-decoration-underline" style={{ color: "#7c3aed" }}>Google Calendar <ExternalLink size={12} className="d-inline" /></a>, haz clic en <strong>"Crear"</strong> y luego en <strong>"Calendario de citas"</strong>. Configura tus horarios y servicios para obtener tu enlace público de reservas de Google (ej. <code>https://calendar.app.google/...</code>).
                </div>
              </li>
              <li className="d-flex align-items-start gap-3">
                <span className="badge rounded-circle p-2 d-flex align-items-center justify-content-center text-white" style={{ width: "24px", height: "24px", minWidth: "24px", backgroundColor: "#7c3aed" }}>3</span>
                <div>
                  <strong className="text-dark d-block mb-0.5">¡Citas sincronizadas de forma bidireccional!</strong>
                  Comparte tu enlace de reservas de Google con tus clientes. Cuando reserven, los turnos se guardarán en tu Google Calendar y **nuestra base de datos los importará automáticamente a tu Dashboard administrativo** (cada 10 minutos o al hacer clic en "Sincronizar Manualmente").
                </div>
              </li>
            </ol>
          </div>

          {!status.connected ? (
            <div className="p-4 border border-dashed rounded-4 text-center bg-white">
              <AlertTriangle className="text-warning mb-2" size={24} />
              <h4 className="h6 fw-bold mb-2">Integración no activa</h4>
              <p className="text-muted small mb-4">
                Tu cuenta todavía no está conectada. Hacé clic abajo para autorizar el acceso a tu Google Calendar.
              </p>
              <Button
                variant="primary"
                onClick={handleConnect}
                className="px-4 py-2 fw-semibold rounded-pill d-inline-flex align-items-center gap-2 border-0 shadow-sm hover-grow"
                style={{ backgroundColor: "#7c3aed", backgroundImage: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
              >
                Conectar Google Calendar
                <ExternalLink size={16} />
              </Button>
            </div>
          ) : (
            <div className="bg-white p-4 border rounded-4">
              <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 className="text-success" size={20} />
                  <span className="fw-semibold text-success">Google Calendar Conectado</span>
                </div>
              </div>

              {/* Entrada del ID del Calendario */}
              <div className="mb-4 bg-light p-3.5 rounded-4 border border-light-subtle">
                <Form.Group className="mb-0">
                  <Form.Label className="fw-semibold small text-dark d-flex align-items-center gap-2 mb-2">
                    <Calendar size={16} className="text-primary" />
                    ID de Calendario de Google
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="primary (Calendario principal)"
                      value={calendarIdInput}
                      onChange={(e) => setCalendarIdInput(e.target.value)}
                      disabled={savingCalendarId}
                      style={{ fontSize: "13px", borderRadius: "20px 0 0 20px" }}
                    />
                    <Button 
                      variant="primary" 
                      onClick={handleSaveCalendarId} 
                      disabled={savingCalendarId}
                      style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed", borderRadius: "0 20px 20px 0", fontSize: "13px", fontWeight: "600" }}
                    >
                      {savingCalendarId ? "Guardando..." : "Guardar ID"}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted small d-block mt-2">
                    Por defecto es <code>primary</code> (tu agenda personal). Si creaste un calendario secundario específico para tu negocio en Google Calendar (como tu calendario <strong>AuraDash</strong>), copia su <strong>ID de calendario</strong> en la configuración de Google (ej. <code>xxxx@group.calendar.google.com</code>) y pégalo aquí.
                  </Form.Text>
                </Form.Group>
              </div>

              {/* Entrada del Link de Reservas de Google Calendar */}
              <div className="mb-4 bg-light p-3.5 rounded-4 border border-light-subtle">
                <Form.Group className="mb-0">
                  <Form.Label className="fw-semibold small text-dark d-flex align-items-center gap-2 mb-2">
                    <Link2 size={16} className="text-primary" />
                    Enlace de Reserva de Google Calendar (Appointment Schedule)
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="url"
                      placeholder="https://calendar.app.google/..."
                      value={bookingUrlInput}
                      onChange={(e) => setBookingUrlInput(e.target.value)}
                      disabled={savingBookingUrl}
                      style={{ fontSize: "13px", borderRadius: "20px 0 0 20px" }}
                    />
                    <Button 
                      variant="primary" 
                      onClick={handleSaveBookingUrl} 
                      disabled={savingBookingUrl}
                      style={{ backgroundColor: "#7c3aed", borderColor: "#7c3aed", borderRadius: "0 20px 20px 0", fontSize: "13px", fontWeight: "600" }}
                    >
                      {savingBookingUrl ? "Guardando..." : "Guardar Link"}
                    </Button>
                  </InputGroup>
                  <Form.Text className="text-muted small d-block mt-2">
                    Pega el enlace público del <strong>Calendario de citas</strong> (Appointment Schedule) de Google que creaste para tu negocio. Este link se mostrará en tu sección de reservas online.
                  </Form.Text>
                </Form.Group>
              </div>

              <ListGroup variant="flush" className="mb-4 small">
                <ListGroup.Item className="d-flex align-items-center gap-2 px-0 bg-transparent py-2">
                  <ShieldCheck size={16} className="text-primary" />
                  Sincronización automática activa en segundo plano.
                </ListGroup.Item>
                <ListGroup.Item className="d-flex align-items-center gap-2 px-0 bg-transparent py-2">
                  <ShieldCheck size={16} className="text-primary" />
                  Sincronización bidireccional (los cambios en Google Calendar se importan al salón).
                </ListGroup.Item>
              </ListGroup>

              <div className="d-flex gap-3 flex-wrap">
                <Button
                  variant="outline-primary"
                  onClick={handleSync}
                  disabled={syncing}
                  className="rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 font-medium"
                  style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
                >
                  {syncing ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Sincronizar Manualmente
                    </>
                  )}
                </Button>

                <Button
                  variant="outline-danger"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 font-medium ms-auto"
                >
                  {disconnecting ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      Desvinculando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Desvincular Cuenta
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
