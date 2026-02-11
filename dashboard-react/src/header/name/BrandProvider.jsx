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
  coverImage: "",
  darkMode: true,
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  textColor: "#ffffff",
  accentColor: "#ffffff",
};

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(() => {
    const saved = localStorage.getItem("brand");
    return saved ? { ...DEFAULT_BRAND, ...JSON.parse(saved) } : DEFAULT_BRAND;
  });

  useEffect(() => {
    localStorage.setItem("brand", JSON.stringify(brand));
  }, [brand]);

  // ✅ CSS tokens globales
  useEffect(() => {
    const root = document.documentElement;

 const accent = brand.accentColor || brand.textColor || "#ffffff";
    root.style.setProperty("--brand-accent", accent);
    root.style.setProperty("--brand-accent-soft", hexToRgba(accent, 0.12));
    root.style.setProperty("--brand-accent-border", hexToRgba(accent, 0.35));
    root.style.setProperty("--brand-font", brand.fontFamily || DEFAULT_BRAND.fontFamily);

    // opcional: dark mode token
    root.style.setProperty("--brand-dark", brand.darkMode ? "1" : "0");
  }, [brand.accentColor, brand.textColor, brand.fontFamily, brand.darkMode]);

  const value = useMemo(() => ({ brand, setBrand }), [brand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside BrandProvider");
  return ctx;
}