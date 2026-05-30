import React from "react";
import { Container, Button } from "react-bootstrap";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function UnauthorizedView() {
  const navigate = useNavigate();
  const { t } = useTranslation(["views", "common"]);

  // We define dynamic translations with fallback in case they are not in the locale files yet
  const title = t("unauthorized.title", "Acceso Restringido");
  const subtitle = t("unauthorized.subtitle", "No tienes permisos suficientes para acceder a esta sección.");
  const description = t(
    "unauthorized.description",
    "Tu rol actual en la empresa no cuenta con los privilegios necesarios para ver este contenido. Si crees que esto es un error, por favor contacta al administrador o dueño de la cuenta."
  );
  const goBackText = t("unauthorized.goBack", "Volver Atrás");
  const goHomeText = t("unauthorized.goHome", "Ir al Dashboard");

  return (
    <Container 
      className="d-flex align-items-center justify-content-center" 
      style={{ minHeight: "70vh", padding: "2rem" }}
    >
      <div 
        className="text-center p-5 rounded-4 shadow-lg position-relative overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 8px 32px 0 rgba(124, 58, 237, 0.08)",
        }}
      >
        {/* Glow effect */}
        <div 
          style={{
            position: "absolute",
            top: "-50px",
            left: "-50px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(255, 255, 255, 0) 70%)",
            filter: "blur(20px)",
            pointerEvents: "none"
          }}
        />

        <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)",
            border: "1px solid rgba(239, 68, 68, 0.3)"
          }}
        >
          <ShieldAlert size={40} className="text-danger" />
        </div>

        <h1 className="fw-bold h2 mb-3 text-dark" style={{ letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        
        <p className="text-secondary fw-semibold mb-3">
          {subtitle}
        </p>

        <p className="text-muted small mb-4 px-3" style={{ lineHeight: "1.6" }}>
          {description}
        </p>

        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center px-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(-1)}
            className="d-flex align-items-center justify-content-center gap-2 py-2 px-4 rounded-pill border-secondary border-opacity-25"
            style={{ fontWeight: 600, transition: "all 0.2s" }}
          >
            <ArrowLeft size={16} />
            {goBackText}
          </Button>

          <Button 
            onClick={() => navigate("/")}
            className="d-flex align-items-center justify-content-center gap-2 py-2 px-4 rounded-pill"
            style={{ 
              fontWeight: 600, 
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
              transition: "all 0.2s"
            }}
          >
            <Home size={16} />
            {goHomeText}
          </Button>
        </div>
      </div>
    </Container>
  );
}
