import React, { useEffect, useState } from "react";
import { useBrand } from "./BrandProvider";
import BrandModal from "./BrandModal";
import "./BrandHeader.css";

export default function BrandHeader() {
  const { brand } = useBrand();

  // El modal se abre SOLO si no hay nombre
  const hasCompanyName = Boolean(brand.companyName?.trim());

  const [showModal, setShowModal] = useState(!hasCompanyName);

  // Si el nombre pasa de vacío → válido, cerramos el modal
  useEffect(() => {
    if (hasCompanyName) {
      setShowModal(false);
    } else {
      setShowModal(true);
    }
  }, [hasCompanyName]);

  return (
    <>
      <header
        className={`brandHeader ${
          brand.darkMode ? "brandHeader--dark" : "brandHeader--light"
        }`}
      >
        <div
          className="brandHeader__image"
          style={{ backgroundImage: `url(${brand.coverImage})` }}
        />

        <div className="brandHeader__bar">
          <h1
            className="brandHeader__title"
            style={{
              color: brand.textColor,
              fontFamily: brand.fontFamily, // ✅ aquí
            }}
          >
            {hasCompanyName ? brand.companyName : " "}
          </h1>

          {/* Botón editar SOLO si ya hay nombre */}
          {hasCompanyName && (
            <button
              className="brandHeader__btn"
              onClick={() => setShowModal(true)}
            >
              <i className="fa-solid fa-pen"></i>
            </button>
          )}
        </div>
      </header>
      <BrandModal
        show={showModal}
        forceRequired={!hasCompanyName}
        onHide={() => {
          if (!hasCompanyName) return;
          setShowModal(false);
        }}
      />
    </>
  );
}
