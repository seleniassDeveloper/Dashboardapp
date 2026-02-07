import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const BrandContext = createContext(null);

const DEFAULT_BRAND = {
  companyName: "Tu empresa",
  coverImage:
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80",
  textColor: "#ffffff",
  darkMode: true,
};

const STORAGE_KEY = "dashboard_brand_v1";

function loadBrand() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_BRAND, ...JSON.parse(raw) } : DEFAULT_BRAND;
  } catch {
    return DEFAULT_BRAND;
  }
}

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(loadBrand);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
  }, [brand]);

  const value = useMemo(() => ({ brand, setBrand }), [brand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand debe usarse dentro de <BrandProvider />");
  return ctx;
}