import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useBrand } from "./BrandProvider";
import BrandModal from "./BrandModal";

import "./BrandHeader.css";

import ServiceModal from "../services/ServiceModal";
import WorkerModal from "../workers/WorkerModal";

// ✅ Lazy (solo carga cuando se usa)
const WorkersListModal = lazy(() => import("../workers/WorkersListModal.jsx"));

export default function BrandHeader() {
  const { brand } = useBrand();

  const hasCompanyName = Boolean(brand.companyName?.trim());
  const [showBrandModal, setShowBrandModal] = useState(!hasCompanyName);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showWorkersList, setShowWorkersList] = useState(false);

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

  const openWorker = () => {
    setMenuOpen(false);
    setShowWorkerModal(true);
  };

  const openService = () => {
    setMenuOpen(false);
    setShowServiceModal(true);
  };

  const openWorkersList = () => {
    setMenuOpen(false);
    setShowWorkersList(true);
  };

  return (
    <>
      <header className={`brandHeader ${brand.darkMode ? "brandHeader--dark" : "brandHeader--light"}`}>
        <div className="brandHeader__image" style={{ backgroundImage: `url(${brand.coverImage})` }} />

        <div className="brandHeader__bar d-flex align-items-center justify-content-between">
          <h1
            className="brandHeader__title m-0"
            style={{ color: brand.textColor, fontFamily: brand.fontFamily }}
          >
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
                  <button type="button" className="brandHeader__menuItem" onClick={openWorker}>
                    <i className="fa-solid fa-user-plus me-2" />
                    Agregar trabajador
                  </button>

                  <button type="button" className="brandHeader__menuItem" onClick={openService}>
                    <i className="fa-solid fa-screwdriver-wrench me-2" />
                    Agregar servicio
                  </button>

                  <button type="button" className="brandHeader__menuItem" onClick={openWorkersList}>
                    <i className="fa-solid fa-users me-2" />
                    Ver trabajadores
                  </button>
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

      <WorkerModal show={showWorkerModal} onHide={() => setShowWorkerModal(false)} />
      <ServiceModal show={showServiceModal} onHide={() => setShowServiceModal(false)} />

      {/* ✅ Suspense para lazy */}
      {showWorkersList && (
        <Suspense fallback={null}>
          <WorkersListModal show={showWorkersList} onHide={() => setShowWorkersList(false)} />
        </Suspense>
      )}
    </>
  );
}