import React from "react";
import Spinner from "react-bootstrap/Spinner";
import { Container, Button } from "react-bootstrap";
import { ShieldAlert, LogOut, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider.jsx";
import LoginScreen from "./LoginScreen.jsx";
import "./LoginScreen.css";

export default function LoginGate({ children }) {
  const { t } = useTranslation("auth");
  const {
    user,
    authLoading,
    firebaseConfigOk,
    logout,
    isUnauthorized,
    role,
    firestoreError,
    loginDemo,
    business,
    userStatus
  } = useAuth();

  const googleRedirectPending =
    typeof sessionStorage !== "undefined" && sessionStorage.getItem("authRedirectPending") === "1";

  if (authLoading) {
    return (
      <div className="auth-loading-screen d-flex min-vh-100 flex-column align-items-center justify-content-center gap-3"
           style={{ background: "radial-gradient(circle at 50% 50%, #fcfbff 0%, #f3ebff 100%)" }}>
        <Spinner animation="border" variant="secondary" role="status" style={{ color: "#7c3aed" }}>
          <span className="visually-hidden">{t("gate.loading")}</span>
        </Spinner>
        {googleRedirectPending && (
          <p className="text-muted small mb-0">{t("gate.completingGoogle")}</p>
        )}
      </div>
    );
  }

  if (!firebaseConfigOk) {
    return (
      <div className="auth-loading-screen d-flex min-vh-100 align-items-center justify-content-center px-3"
           style={{ background: "radial-gradient(circle at 50% 50%, #fcfbff 0%, #f3ebff 100%)" }}>
        <div className="text-center" style={{ maxWidth: 480 }}>
          <h1 className="h5 mb-3">{t("gate.firebaseMissingTitle")}</h1>
          <p
            className="small text-muted mb-0"
            dangerouslySetInnerHTML={{ __html: t("gate.firebaseMissingBody") }}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Si está autenticado pero no está autorizado en Firestore (o active = false)
  if (isUnauthorized || !role) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center py-5 min-vh-100"
        style={{
          background: "radial-gradient(circle at 50% 50%, #fcfbff 0%, #f3ebff 100%)",
          fontFamily: "'Outfit', sans-serif"
        }}
      >
        <Container style={{ maxWidth: "540px" }} className="animate-fade-in">
          <div 
            className="p-5 rounded-5 shadow-lg text-center"
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              boxShadow: "0 20px 50px rgba(124, 58, 237, 0.05)"
            }}
          >
            <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(244, 63, 94, 0.04) 100%)",
                border: "1px solid rgba(239, 68, 68, 0.25)"
              }}
            >
              <ShieldAlert size={40} className="text-danger" />
            </div>

            <h1 className="fw-black h3 mb-2.5 text-dark" style={{ letterSpacing: "-0.02em" }}>
              Acceso No Autorizado
            </h1>

            <p className="text-secondary fw-semibold mb-3 small">
              Tu cuenta de Google no cuenta con permisos activos para ingresar.
            </p>

            {firestoreError && (
              <div className="alert alert-danger border-0 p-3.5 rounded-4 text-start small mb-4 animate-fade-in" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#991b1b" }}>
                <strong className="d-block mb-1">⚠️ Error al acceder a Firestore:</strong>
                <span className="font-monospace smaller d-block mb-2" style={{ wordBreak: "break-all" }}>{firestoreError}</span>
                <span className="d-block text-secondary mt-2" style={{ fontSize: "11px", lineHeight: "1.4" }}>
                  Asegúrate de haber habilitado **Firestore Database** en la consola de Firebase y de configurar las reglas en modo de prueba o públicas en la pestaña <em>Rules</em>:
                  <pre className="mt-2 p-2 rounded text-white bg-dark smaller" style={{ fontSize: "9px" }}>
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                  </pre>
                </span>
              </div>
            )}

            {userStatus === "pending" ? (
              <div className="alert alert-warning border-0 p-3 rounded-4 smaller mb-4" style={{ backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#9a3412" }}>
                <strong>Tu cuenta está pendiente de activación.</strong> Un administrador debe aprobar tu acceso.
              </div>
            ) : userStatus === "rejected" ? (
              <div className="alert alert-danger border-0 p-3 rounded-4 smaller mb-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#991b1b" }}>
                Tu solicitud de acceso ha sido denegada por un administrador.
              </div>
            ) : (
              <div className="alert alert-warning border-0 p-3 rounded-4 smaller mb-4" style={{ backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#9a3412" }}>
                El correo <strong className="font-monospace text-dark d-block my-1 small">{user.email}</strong> no está registrado o fue desactivado temporalmente en la base de datos de Firestore.
              </div>
            )}

            <p className="text-muted smaller px-2 mb-4.5" style={{ lineHeight: "1.6" }}>
              Comunícate con el Propietario o Administrador de Aura Studio para solicitar el alta de tu cuenta y asignación de permisos correspondientes.
            </p>

            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3 pt-3 border-top border-opacity-10">
              <Button
                variant="outline-secondary"
                onClick={logout}
                className="rounded-pill px-4.5 py-2.5 smaller fw-bold d-flex align-items-center justify-content-center gap-2 hover-bg-light border-purple-opacity"
                style={{ fontSize: "12.5px", transition: "all 0.2s" }}
              >
                <LogOut size={15} />
                <span>Cerrar sesión activa</span>
              </Button>
              <Button
                variant="purple"
                onClick={loginDemo}
                className="rounded-pill px-4.5 py-2.5 smaller fw-bold d-flex align-items-center justify-content-center gap-2 text-white bg-purple-600 hover-bg-purple-700 border-0 shadow-sm"
                style={{ fontSize: "12.5px", transition: "all 0.2s" }}
              >
                <span>Acceder con Prueba Gratis (Demo)</span>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Si está autenticado pero no tiene negocio configurado en PostgreSQL, redirigir a Onboarding
  const isDemo = localStorage.getItem("auradash_demo_session") === "true";
  if (user && !business && !isDemo && import.meta.env.VITE_AUTH_DISABLED !== "true") {
    const OnboardingView = React.lazy(() => import("../views/OnboardingView.jsx"));
    return (
      <React.Suspense fallback={
        <div className="auth-loading-screen d-flex min-vh-100 flex-column align-items-center justify-content-center gap-3"
             style={{ background: "radial-gradient(circle at 50% 50%, #fcfbff 0%, #f3ebff 100%)" }}>
          <Spinner animation="border" variant="secondary" role="status" style={{ color: "#7c3aed" }}>
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      }>
        <OnboardingView />
      </React.Suspense>
    );
  }

  // Si está autenticado y tiene negocio, pero la suscripción no está activa/prueba vigente
  if (user && business && !isDemo && import.meta.env.VITE_AUTH_DISABLED !== "true" && import.meta.env.AUTH_DISABLED !== "true") {
    const ALLOWED = ["trialing", "active"];
    const trialEnds = business.trialEndsAt 
      ? new Date(business.trialEndsAt) 
      : new Date(new Date(business.createdAt || Date.now()).getTime() + 14 * 24 * 60 * 60 * 1000);
    const isTrialValid = business.subscriptionStatus !== "trialing" || (trialEnds > new Date());
    
    if (!ALLOWED.includes(business.subscriptionStatus) || !isTrialValid) {
      const PricingView = React.lazy(() => import("../views/PricingView.jsx"));
      return (
        <React.Suspense fallback={
          <div className="auth-loading-screen d-flex min-vh-100 flex-column align-items-center justify-content-center gap-3"
               style={{ background: "radial-gradient(circle at 50% 50%, #fcfbff 0%, #f3ebff 100%)" }}>
            <Spinner animation="border" variant="secondary" role="status" style={{ color: "#7c3aed" }}>
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </div>
        }>
          <PricingView blocked={true} subscriptionStatus={business.subscriptionStatus} />
        </React.Suspense>
      );
    }
  }

  return children;
}
