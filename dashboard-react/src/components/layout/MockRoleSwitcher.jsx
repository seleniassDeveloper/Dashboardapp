import React, { useState } from "react";
import RoleSwitchValidationModal from "./RoleSwitchValidationModal.jsx";

export default function MockRoleSwitcher() {
  const [role, setRole] = useState(() => localStorage.getItem("x_mock_role") || "owner");
  const [requestedRole, setRequestedRole] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSelectRole = (e) => {
    const selected = e.target.value;
    if (selected === role) return;

    setRequestedRole(selected);
    setShowModal(true);
  };

  const handleValidationSuccess = () => {
    setShowModal(false);
    setRole(requestedRole);
    // Limpiar bypasses contables para forzar re-verificación
    sessionStorage.removeItem("finance_bypass_token");
    
    // Alerta de éxito con Toast / Popup
    alert("Modo de visualización actualizado.");
    
    // Recargar la ventana para actualizar Axios interceptors y renderizar la nueva sesión
    window.location.reload();
  };

  const handleValidationCancel = () => {
    setShowModal(false);
    setRequestedRole("");
  };

  return (
    <>
      <div 
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1.5px solid rgba(124, 58, 237, 0.4)",
          borderRadius: "16px",
          padding: "10px 14px",
          boxShadow: "0 10px 30px -5px rgba(124, 58, 237, 0.25)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "12px",
          fontWeight: "bold",
          color: "#5b21b6",
          transition: "all 0.3s ease"
        }}
      >
        <span style={{ letterSpacing: "-0.01em" }}>🔑 Mock Rol:</span>
        <select 
          value={role} 
          onChange={handleSelectRole}
          style={{
            border: "none",
            background: "transparent",
            fontWeight: "800",
            color: "#7c3aed",
            cursor: "pointer",
            outline: "none",
            fontSize: "12px",
            paddingRight: "5px"
          }}
        >
          <option value="owner">Owner / Dueño</option>
          <option value="admin">Admin / Administrador</option>
          <option value="finance">Finanzas / Contador</option>
          <option value="manager">Manager / Encargado</option>
          <option value="professional">Profesional / Estilista</option>
          <option value="reception">Recepción / Front-desk</option>
          <option value="viewer">Viewer / Solo Lectura</option>
        </select>
      </div>

      {showModal && (
        <RoleSwitchValidationModal 
          show={showModal}
          onHide={handleValidationCancel}
          requestedRole={requestedRole}
          onSuccess={handleValidationSuccess}
        />
      )}
    </>
  );
}
