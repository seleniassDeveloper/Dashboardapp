import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useBrand } from "./BrandProvider";
import BrandModal from "./BrandModal";
import "./BrandHeader.css";

import ServiceModal from "../services/ServiceModal";
import WorkerModal from "../workers/WorkerModal";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useNavigate } from "react-router-dom";
import UsersAdminModal from "../../admin/UsersAdminModal.jsx";

// ✅ ABM
const WorkersABMModal = lazy(() => import("../workers/WorkersABMModal.jsx"));
const ClientsABMModal = lazy(() => import("../clients/ClientsABMModal.jsx"));

export default function BrandHeader() {
  const { brand } = useBrand();
  const { logout, isAdmin, business } = useAuth();
  const navigate = useNavigate();

  const hasCompanyName = Boolean(brand.companyName?.trim() || business?.name?.trim());
  const [showBrandModal, setShowBrandModal] = useState(!hasCompanyName);



  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [showWorkersABM, setShowWorkersABM] = useState(false);
  const [showClientsABM, setShowClientsABM] = useState(false);
  const [showUsersAdmin, setShowUsersAdmin] = useState(false);

  useEffect(() => {
    setShowBrandModal(!hasCompanyName);
  }, [hasCompanyName]);

  useEffect(() => {
    function onClickOutside(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const openWorkersABM = () => {
    setMenuOpen(false);
    setShowWorkersABM(true);
  };

  const openClientsABM = () => {
    setMenuOpen(false);
    setShowClientsABM(true);
  };

  return (
    <>
      <header className="brandHeader brandHeader--light">
        <div className="brandHeader__image" style={{ backgroundImage: `url(${brand.coverImage})` }} />

        <div className="brandHeader__bar d-flex align-items-center justify-content-between">
          <h1 className="brandHeader__title m-0" style={{ color: brand.textColor, fontFamily: brand.fontFamily }}>
            {hasCompanyName ? (brand.companyName || business?.name) : " "}
          </h1>

          <div className="brandHeader__actions d-flex align-items-center gap-2" ref={menuRef}>
            {hasCompanyName && (
              <button
                className="brandHeader__btn"
                onClick={() => setShowBrandModal(true)}
                aria-label="Editar marca"
                title="Editar"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
            )}

            <button
              className="brandHeader__btn brandHeader__btn--logout"
              onClick={async () => {
                await logout();
                navigate("/", { replace: true });
              }}
              title="Cerrar sesión"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Salir</span>
            </button>

            <button
              className="brandHeader__btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Abrir menú"
              title="Opciones"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>

            {menuOpen && (
              <div className="brandHeader__menu">
                {hasCompanyName ? (
                  <>
                    <button type="button" className="brandHeader__menuItem" onClick={openWorkersABM}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Administrar trabajadores
                    </button>

                    <button type="button" className="brandHeader__menuItem" onClick={openClientsABM}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Clientes
                    </button>

                    <div className="brandHeader__menuDivider" />
                  </>
                ) : null}

                {isAdmin ? (
                  <>
                    <button
                      type="button"
                      className="brandHeader__menuItem"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowUsersAdmin(true);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Usuarios (admin)
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </header>

      <BrandModal
        show={showBrandModal}
        forceRequired={!hasCompanyName}
        onHide={() => {
          if (!hasCompanyName) return;
          setShowBrandModal(false);
        }}
      />

      {/* modales rápidos */}
      <WorkerModal show={showWorkerModal} onHide={() => setShowWorkerModal(false)} />
      <ServiceModal show={showServiceModal} onHide={() => setShowServiceModal(false)} />

      {/* ABM: Workers */}
      {showWorkersABM && (
        <Suspense fallback={null}>
          <WorkersABMModal show={showWorkersABM} onHide={() => setShowWorkersABM(false)} />
        </Suspense>
      )}

      {/* ABM: Clients */}
      {showClientsABM && (
        <Suspense fallback={null}>
          <ClientsABMModal show={showClientsABM} onHide={() => setShowClientsABM(false)} />
        </Suspense>
      )}

      <UsersAdminModal show={showUsersAdmin} onHide={() => setShowUsersAdmin(false)} />
    </>
  );
}