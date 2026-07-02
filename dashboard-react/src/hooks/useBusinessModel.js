import { useBusiness } from "../auth/BusinessContext.jsx";
import { BUSINESS_MODELS } from "../config/businessModels.js";

export function useBusinessModel() {
  const { model } = useBusiness();
  const activeModel = model || "salon";
  
  // Obtener la configuración correspondiente o el de fallback 'salon'
  const config = BUSINESS_MODELS[activeModel] || BUSINESS_MODELS["salon"];

  return {
    model: activeModel,
    config,
    terms: config.terms,
    serviceCategories: config.serviceCategories,
    serviceTemplates: config.serviceTemplates,
    appointmentStatuses: config.appointmentStatuses,
    clinicalEntryType: config.clinicalEntryType
  };
}
