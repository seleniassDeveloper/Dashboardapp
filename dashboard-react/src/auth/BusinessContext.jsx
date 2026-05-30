import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthProvider.jsx";

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { business, userBusinesses, switchBusiness } = useAuth();

  const value = useMemo(() => ({
    business,
    userBusinesses,
    switchBusiness,
    logo: business?.logo || null,
    slug: business?.slug || "",
    name: business?.name || "",
    industry: business?.industry || ""
  }), [business, userBusinesses, switchBusiness]);

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
