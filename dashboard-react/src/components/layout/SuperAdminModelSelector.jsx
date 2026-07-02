import React, { useState, useRef, useEffect } from "react";
import { Shield, Check, ChevronDown } from "lucide-react";
import { useBusiness } from "../../auth/BusinessContext.jsx";
import { BUSINESS_MODELS } from "../../config/businessModels.js";
import api from "../../lib/api.js";
import "../language/LanguageSwitcher.css"; // Reusar los mismos estilos premium de LanguageSwitcher

const MODELS = [
  { slug: "salon", label: "Salón / Estética", flag: "💇‍♀️" },
  { slug: "barber", label: "Barbería", flag: "💈" },
  { slug: "clinic", label: "Clínica / Médica", flag: "🏥" },
  { slug: "gym", label: "Gimnasio / Socio", flag: "🏋️‍♂️" },
  { slug: "spa", label: "Spa & Wellness", flag: "💆‍♀️" },
  { slug: "custom", label: "Personalizado", flag: "⚙️" }
];

export default function SuperAdminModelSelector() {
  const { model, modelOverride, setModelOverride, business } = useBusiness();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  const current = MODELS.find((m) => m.slug === model) || MODELS[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectModel = (slug) => {
    setModelOverride(slug);
    setOpen(false);
  };

  const handleSaveToDatabase = async (e) => {
    e.stopPropagation();
    if (!business?.id) return;
    setSaving(true);
    try {
      const res = await api.put("/appointments/business", {
        name: business.name,
        slug: business.slug,
        model: model
      });
      if (res.data) {
        alert("Modelo de negocio guardado exitosamente en la base de datos.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar el modelo de negocio en la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`lang-switcher lang-switcher--default ${open ? "is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="lang-switcher__btn border border-danger-subtle"
        onClick={() => setOpen((v) => !v)}
        title="Simulador de Rubro (Súper-Admin)"
        style={{ color: "#dc3545", fontWeight: "700" }}
      >
        <Shield size={16} className="lang-switcher__globe text-danger" />
        <span className="lang-switcher__flag" aria-hidden style={{ fontSize: "14px", marginLeft: "2px" }}>
          {current.flag}
        </span>
        <span className="lang-switcher__label">{current.slug.toUpperCase()}</span>
        <ChevronDown size={14} className="lang-switcher__chev text-danger" />
      </button>

      {open && (
        <div className="lang-switcher__menu" role="menu" style={{ width: "220px" }}>
          <div className="px-3 py-2 border-bottom text-muted smaller uppercase fw-bold" style={{ fontSize: "9px", letterSpacing: "0.5px" }}>
            Cambiar Vista de Rubro
          </div>
          {MODELS.map((m) => {
            const active = m.slug === model;
            return (
              <button
                key={m.slug}
                type="button"
                role="menuitem"
                className={`lang-switcher__item ${active ? "is-active" : ""}`}
                onClick={() => handleSelectModel(m.slug)}
              >
                <span className="lang-switcher__flag" aria-hidden>
                  {m.flag}
                </span>
                <span className="lang-switcher__name">{m.label}</span>
                {active && <Check size={14} className="lang-switcher__check" />}
              </button>
            );
          })}
          {modelOverride && (
            <div className="p-2 border-top bg-light d-grid">
              <button
                type="button"
                className="btn btn-danger btn-sm rounded-pill py-1 fw-bold"
                style={{ fontSize: "10.5px" }}
                disabled={saving}
                onClick={handleSaveToDatabase}
              >
                {saving ? "Guardando..." : "💾 Guardar en DB"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill py-1 fw-bold mt-1"
                style={{ fontSize: "10.5px" }}
                onClick={() => setModelOverride(null)}
              >
                Resetear Vista
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
