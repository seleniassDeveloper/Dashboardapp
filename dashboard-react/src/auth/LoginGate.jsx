import React from "react";
import Spinner from "react-bootstrap/Spinner";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthProvider.jsx";
import LoginScreen from "./LoginScreen.jsx";
import "./LoginScreen.css";

export default function LoginGate({ children }) {
  const { t } = useTranslation("auth");
  const { user, authLoading, firebaseConfigOk, authDisabled } = useAuth();

  if (authDisabled) {
    return children;
  }

  const googleRedirectPending =
    typeof sessionStorage !== "undefined" && sessionStorage.getItem("authRedirectPending") === "1";

  if (authLoading) {
    return (
      <div className="auth-loading-screen d-flex min-vh-100 flex-column align-items-center justify-content-center gap-3">
        <Spinner animation="border" variant="secondary" role="status">
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
      <div className="auth-loading-screen d-flex min-vh-100 align-items-center justify-content-center px-3">
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

  return children;
}
