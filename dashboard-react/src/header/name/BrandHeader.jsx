import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useBrand } from "./BrandProvider";
import BrandModal from "./BrandModal";
import "./BrandHeader.css";

import ServiceModal from "../services/ServiceModal";
import WorkerModal from "../workers/WorkerModal";

// ✅ ABM
const WorkersABMModal = lazy(() => import("../workers/WorkersABMModal.jsx"));
const ClientsABMModal = lazy(() => import("../clients/ClientsABMModal.jsx"));

export default function BrandHeader() {
  const { brand } = useBrand();

  const hasCompanyName = Boolean(brand.companyName?.trim());
  const [showBrandModal, setShowBrandModal] = useState(!hasCompanyName);



  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [showWorkersABM, setShowWorkersABM] = useState(false);
  const [showClientsABM, setShowClientsABM] = useState(false);

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
      <header className={`brandHeader ${brand.darkMode ? "brandHeader--dark" : "brandHeader--light"}`}>
        <div className="brandHeader__image" style={{ backgroundImage: `url(${brand.coverImage})` }} />

        <div className="brandHeader__bar d-flex align-items-center justify-content-between">
          <h1 className="brandHeader__title m-0" style={{ color: brand.textColor, fontFamily: brand.fontFamily }}>
            {hasCompanyName ? brand.companyName : " "}
          </h1>

          {hasCompanyName && (
            <div className="brandHeader__actions d-flex align-items-center gap-2" ref={menuRef}>
              <button
                className="brandHeader__btn"
                onClick={() => setShowBrandModal(true)}
                aria-label="Editar marca"
                title="Editar"
                type="button"
              >
                <i className="fa-solid fa-pen" />
              </button>

              <button
                className="brandHeader__btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Abrir menú"
                title="Opciones"
                type="button"
              >
                <i className="fa-solid fa-ellipsis-vertical" />
              </button>

              {menuOpen && (
                <div className="brandHeader__menu">
                  <button type="button" className="brandHeader__menuItem" onClick={openWorkersABM}>
                    <i className="fa-solid fa-users me-2" />
                    Administrar trabajadores
                  </button>

                  <button type="button" className="brandHeader__menuItem" onClick={openClientsABM}>
                    <i className="fa-solid fa-address-book me-2" />
                    Clientes
                  </button>

                  {/* opcionales si quieres dejar accesos directos */}
                  <div className="brandHeader__menuDivider" />

                  {/* <button
                    type="button"
                    className="brandHeader__menuItem"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowWorkerModal(true);
                    }}
                  >
                    <i className="fa-solid fa-user-plus me-2" />
                    Agregar trabajador
                  </button> */}

                  {/* <button
                    type="button"
                    className="brandHeader__menuItem"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowServiceModal(true);
                    }}
                  >
                    <i className="fa-solid fa-screwdriver-wrench me-2" />
                    Agregar servicio
                  </button> */}
                </div>
              )}
            </div>
          )}
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
    </>
  );
}