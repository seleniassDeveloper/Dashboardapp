import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button, Spinner } from "react-bootstrap";
import { useAuth } from "./AuthProvider.jsx";
import { usePermissions } from "./PermissionProvider.jsx";
import FinanceAccessModal from "../components/finances/FinanceAccessModal.jsx";

export default function FinanceProtectedRoute({ children }) {
  const navigate = useNavigate();
  const { role, financeUnlocked, authLoading } = useAuth();
  const { hasPermission } = usePermissions();

  const [showModal, setShowModal] = useState(true);

  // 1. Si está cargando la sesión, mostrar un loader y NO montar children (FinancesView)
  if (authLoading) {
    return (
      <div 
        className="d-flex align-items-center justify-content-center" 
        style={{ minHeight: "75vh" }}
      >
        <Spinner animation="border" variant="purple" />
      </div>
    );
  }

  const canViewFinance = hasPermission("view_finances");

  const isUnlocked = canViewFinance || financeUnlocked;

  const handleCancel = () => {
    setShowModal(false);
    navigate("/app"); // Redirigir a la pantalla principal (dashboard)
  };

  const handleSuccess = () => {
    setShowModal(false);
  };

  // 3. Si está autorizado, renderizar la vista financiera normalmente
  if (isUnlocked) {
    return <>{children}</>;
  }

  // 4. Si NO tiene permiso, mostrar la pantalla de bloqueo y el modal de acceso restringido
  // Esto previene que FinancesView se monte o haga peticiones HTTP
  return (
    <div 
      className="d-flex flex-column align-items-center justify-content-center border shadow-sm p-5 text-center animate-fade-in"
      style={{
        minHeight: "75vh",
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.25)"
      }}
    >
      <div 
        className="rounded-circle d-flex align-items-center justify-content-center text-white mb-4 shadow"
        style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
          border: "3px solid #ffffff",
          boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.3)"
        }}
      >
        <Lock size={32} />
      </div>
      <h2 className="fw-black h3 mb-2 text-dark">Acceso Restringido</h2>
      <p className="text-secondary small mb-4" style={{ maxWidth: "420px", fontSize: "14px", lineHeight: "1.5" }}>
        Esta sección contiene información financiera sensible del negocio. Ingresa credenciales autorizadas de supervisor para ver el contenido.
      </p>
      <div>
        <Button 
          variant="purple"
          onClick={() => setShowModal(true)}
          className="rounded-pill px-4 py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 shadow"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            boxShadow: "0 4px 14px 0 rgba(124, 58, 237, 0.3)"
          }}
        >
          Ingresar Credenciales
        </Button>
      </div>

      <FinanceAccessModal 
        show={showModal} 
        onHide={handleCancel} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
}
