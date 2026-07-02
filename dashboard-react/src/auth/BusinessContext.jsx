import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthProvider.jsx";

const BusinessContext = createContext(null);

export function mapIndustryToModel(industry) {
  if (!industry) return "salon";
  const ind = String(industry).toLowerCase().trim();
  if (ind.includes("estet") || ind.includes("salon") || ind.includes("pelu")) return "salon";
  if (ind.includes("barber")) return "barber";
  if (ind.includes("clinic") || ind.includes("odont") || ind.includes("dent") || ind.includes("med")) return "clinic";
  if (ind.includes("gym") || ind.includes("fit") || ind.includes("entren")) return "gym";
  if (ind.includes("spa")) return "spa";
  return "custom";
}

export function BusinessProvider({ children }) {
  const { business, userBusinesses, switchBusiness } = useAuth();

  // Override de modelo en memoria para sesión del Súper-Admin
  const [modelOverride, setModelOverride] = React.useState(null);

  const activeModel = useMemo(() => {
    if (modelOverride) return modelOverride;
    return business?.model || mapIndustryToModel(business?.industry) || "salon";
  }, [business, modelOverride]);

  const value = useMemo(() => ({
    business,
    userBusinesses,
    switchBusiness,
    logo: business?.logo || null,
    slug: business?.slug || "",
    name: business?.name || "",
    industry: business?.industry || "",
    model: activeModel,
    modelOverride,
    setModelOverride
  }), [business, userBusinesses, switchBusiness, activeModel, modelOverride]);

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  return ctx || {};
}
