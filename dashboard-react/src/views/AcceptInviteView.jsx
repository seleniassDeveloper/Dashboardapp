import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Shield, Sparkles, AlertTriangle, CheckCircle, LogIn } from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function AcceptInviteView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, switchBusiness } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchInviteDetails() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/invitations/${token}`);
        if (res.data?.success) {
          setInvitation(res.data.invitation);
        }
      } catch (err) {
        console.error("Error loading invite details:", err);
        setError(err.response?.data?.error || "La invitación no es válida o ya ha expirado.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchInviteDetails();
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/invitations/accept", { token });
      if (res.data?.success) {
        setSuccess("¡Invitación aceptada con éxito! Redirigiéndote al panel...");
        // Cambiar de empresa al instante
        if (res.data.businessId) {
          await switchBusiness(res.data.businessId);
        }
        setTimeout(() => {
          navigate("/app");
        }, 2000);
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
      setError(err.response?.data?.error || "No se pudo aceptar la invitación.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    // Almacenar el token pendiente en localStorage para completarlo tras autenticarse
    localStorage.setItem("pending_invite_token", token);
    navigate("/app");
  };

  if (loading) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center min-vh-100 p-3"
        style={{ background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)" }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted small">Cargando detalles de tu invitación...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{
        background: "radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0) 90%), linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)"
      }}
    >
      <Container style={{ maxWidth: "540px" }}>
        <Card 
          className="border-0 shadow-lg p-4 p-md-5 rounded-4 position-relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255, 255, 255, 0.3)"
          }}
        >
          {/* Glow decoration */}
          <div 
            style={{
              position: "absolute",
              top: "-50px",
              left: "-50px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(255, 255, 255, 0) 70%)",
              filter: "blur(20px)",
              pointerEvents: "none"
            }}
          />

          {error && !invitation ? (
            <div className="text-center py-4">
              <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{ width: "64px", height: "64px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)" }}
              >
                <AlertTriangle size={32} className="text-danger" />
              </div>
              <h2 className="fw-bold h4 mb-2">Enlace no Válido</h2>
              <p className="text-muted small mb-4">{error}</p>
              <Button onClick={() => navigate("/")} className="rounded-pill px-4" variant="secondary">
                Ir a Inicio
              </Button>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="text-center mb-4">
                {invitation?.business?.logo ? (
                  <img 
                    src={invitation.business.logo} 
                    alt="Logo" 
                    className="rounded-circle shadow-sm border mb-3" 
                    style={{ width: "64px", height: "64px", objectFit: "cover" }}
                  />
                ) : (
                  <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle text-white shadow-sm"
                    style={{
                      width: "64px",
                      height: "64px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      fontSize: "24px",
                      fontWeight: "bold"
                    }}
                  >
                    {invitation?.business?.name?.substring(0, 2).toUpperCase() || "BI"}
                  </div>
                )}
                <h1 className="fw-black h3 text-dark mb-1" style={{ letterSpacing: "-0.02em" }}>
                  ¡Te invitaron a {invitation?.business?.name}!
                </h1>
                <p className="text-muted small">
                  Unite a su espacio de trabajo y empezá a operar en el equipo.
                </p>
              </div>

              {error && <Alert variant="danger" className="rounded-3 small">{error}</Alert>}
              {success && (
                <div className="text-center py-3">
                  <CheckCircle size={36} className="text-success mb-2" />
                  <Alert variant="success" className="rounded-3 small">{success}</Alert>
                </div>
              )}

              {!success && (
                <Card className="border bg-white rounded-3 p-3 mb-4 shadow-none">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-xl bg-light text-primary">
                      <Shield size={20} />
                    </div>
                    <div>
                      <div className="text-muted smaller">Rol Asignado</div>
                      <div className="fw-bold text-dark text-capitalize" style={{ fontSize: "15px" }}>
                        {invitation?.role}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Botones de acción */}
              {!success && (
                <div className="d-grid gap-3">
                  {user ? (
                    <Button
                      onClick={handleAccept}
                      disabled={submitting}
                      className="py-2.5 rounded-pill border-0 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      }}
                    >
                      {submitting ? (
                        <>
                          <Spinner size="sm" animation="border" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Aceptar Invitación y Unirme</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleLoginRedirect}
                      className="py-2.5 rounded-pill border-0 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{
                        background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                      }}
                    >
                      <LogIn size={16} />
                      <span>Iniciar Sesión para Unirme</span>
                    </Button>
                  )}

                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate("/")} 
                    className="rounded-pill border-opacity-25"
                    disabled={submitting}
                  >
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </Container>
    </div>
  );
}
