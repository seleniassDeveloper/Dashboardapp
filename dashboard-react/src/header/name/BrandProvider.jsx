import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const BrandContext = createContext(null);

function hexToRgba(hex, alpha = 1) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const DEFAULT_BRAND = {
  companyName: "",
  slogan: "",
  coverImage: "",
  fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
  textColor: "#1a1d24",
  accentColor: "#0f172a",
  dashboardBg: "#f8fafc",
  menuSelectionColor: "#0f172a",
  activeModules: {
    finances: true,
    workflows: true,
    automations: true,
    team: true,
    services: true,
  },
};

/** Migra brand guardado: quita darkMode y fondos oscuros legacy. */
function normalizeBrand(saved) {
  if (!saved || typeof saved !== "object") return DEFAULT_BRAND;
  const { darkMode: _removed, ...rest } = saved;
  const merged = {
    ...DEFAULT_BRAND,
    ...rest,
    activeModules: {
      ...DEFAULT_BRAND.activeModules,
      ...(rest.activeModules || {}),
    },
  };

  // Migrate from old default green (#10b981) to the new landing page violet theme
  if (merged.accentColor === "#10b981") {
    merged.accentColor = "#7c3aed";
  }
  if (merged.menuSelectionColor === "#10b981") {
    merged.menuSelectionColor = "#7c3aed";
  }
  if (merged.dashboardBg === "#fafaf9") {
    merged.dashboardBg = "#f8fafc";
  }

  const bg = String(merged.dashboardBg || "");
  if (bg === "#111827" || bg === "#0f172a" || bg === "#0f0f10") {
    merged.dashboardBg = DEFAULT_BRAND.dashboardBg;
  }
  return merged;
}

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(() => {
    const saved = localStorage.getItem("brand");
    if (!saved) return DEFAULT_BRAND;
    try {
      return normalizeBrand(JSON.parse(saved));
    } catch {
      return DEFAULT_BRAND;
    }
  });

  useEffect(() => {
    localStorage.setItem("brand", JSON.stringify(brand));
  }, [brand]);

  // ✅ CSS tokens globales
  useEffect(() => {
    const root = document.documentElement;

    const accent = brand.accentColor || brand.textColor || "#7c3aed";
    const menuActive = brand.menuSelectionColor || accent;

    root.style.setProperty("--brand-accent", accent);
    root.style.setProperty("--brand-accent-soft", hexToRgba(accent, 0.12));
    root.style.setProperty("--brand-accent-border", hexToRgba(accent, 0.35));
    root.style.setProperty("--brand-font", brand.fontFamily || DEFAULT_BRAND.fontFamily);
    root.style.setProperty("--brand-bg", brand.dashboardBg || DEFAULT_BRAND.dashboardBg);
    root.style.setProperty("--brand-menu-active", menuActive);
    root.style.setProperty("--brand-menu-active-soft", hexToRgba(menuActive, 0.1));

  }, [brand.accentColor, brand.textColor, brand.fontFamily, brand.dashboardBg, brand.menuSelectionColor]);

  const value = useMemo(() => ({ brand, setBrand }), [brand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside BrandProvider");
  return ctx;
}