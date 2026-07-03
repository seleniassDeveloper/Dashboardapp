// ============================================================
// AuraDash — Esquema de CAMPOS por modelo de negocio
// Ubicación sugerida: dashboard-react/src/config/fieldSchemas.js
//
// Los campos VARIABLES se guardan en JSON (clinicalData / formulaData /
// Business.configuration). El backend NO cambia: no hay columnas nuevas.
// DynamicForm.jsx renderiza estos campos según business.model.
//
// Uso:
//   import { getFields } from "@/config/fieldSchemas";
//   const clientFields  = getFields(model, "clientForm");
//   const clinicalFields = getFields(model, "clinicalEntry");
// ============================================================

// Tipos soportados por DynamicForm: text | textarea | number | date | select | checkbox
// Cada campo: { key, label, type, required?, options?, placeholder? }

const SALON = {
  clientForm: [
    { key: "hairType",   label: "Tipo de cabello", type: "text" },
    { key: "skinType",   label: "Tipo de piel",    type: "text" },
    { key: "allergies",  label: "Contraindicaciones / alergias", type: "text" },
    { key: "preferredBrand", label: "Marca preferida", type: "text" },
  ],
  clinicalEntry: [
    { key: "colorFormula",    label: "Fórmula de color", type: "text" },
    { key: "oxidant",         label: "Oxidante",         type: "text" },
    { key: "exposureTime",    label: "Tiempo de pose",   type: "text" },
    { key: "brandUsed",       label: "Marca utilizada",  type: "text" },
    { key: "techniqueApplied",label: "Técnica aplicada", type: "text" },
    { key: "expectedResult",  label: "Resultado esperado", type: "textarea" },
    { key: "postServiceObs",  label: "Observaciones post-servicio", type: "textarea" },
  ],
};

const CLINIC = {
  clientForm: [
    { key: "obraSocial",  label: "Obra Social / Prepaga", type: "text" },
    { key: "affiliateId", label: "N° de afiliado",        type: "text" },
    { key: "plan",        label: "Plan",                  type: "text" },
    { key: "bloodType",   label: "Grupo sanguíneo",       type: "select",
      options: ["A+","A-","B+","B-","AB+","AB-","O+","O-"] },
    { key: "allergies",   label: "Alergias",              type: "text" },
    { key: "chronicMeds", label: "Medicación actual",     type: "textarea" },
    { key: "emergencyContact", label: "Contacto de emergencia", type: "text" },
  ],
  clinicalEntry: [
    { key: "reason",     label: "Motivo de consulta", type: "textarea", required: true },
    { key: "antecedents",label: "Antecedentes",       type: "textarea" },
    { key: "allergies",  label: "Alergias",           type: "text" },
    { key: "medication", label: "Medicación",         type: "textarea" },
    { key: "diagnosis",  label: "Diagnóstico (CIE-10)", type: "text" },
    { key: "indications",label: "Indicaciones / receta", type: "textarea" },
    { key: "nextControl",label: "Próximo control",    type: "date" },
  ],
};

// Cardiología: hereda de clínica y suma campos cardiovasculares
const CARDIO = {
  clinicalEntry: [
    { key: "reason",       label: "Motivo de consulta", type: "textarea", required: true },
    { key: "bloodPressure",label: "Presión arterial (mmHg)", type: "text", placeholder: "120/80" },
    { key: "heartRate",    label: "Frecuencia cardíaca (lpm)", type: "number" },
    { key: "cholesterol",  label: "Colesterol total",   type: "number" },
    { key: "diagnosis",    label: "Diagnóstico",        type: "text" },
    { key: "medication",   label: "Medicación",         type: "textarea" },
    { key: "studies",      label: "Estudios solicitados", type: "text", placeholder: "ECG, Holter, laboratorio…" },
    { key: "indications",  label: "Indicaciones",       type: "textarea" },
    { key: "nextControl",  label: "Próximo control",    type: "date" },
  ],
};

const GYM = {
  clientForm: [
    { key: "goal",       label: "Objetivo",           type: "text" },
    { key: "medicalOk",  label: "Apto médico",        type: "checkbox" },
    { key: "injuries",   label: "Lesiones / limitaciones", type: "textarea" },
    { key: "plan",       label: "Plan / membresía",   type: "text" },
  ],
  clinicalEntry: [
    { key: "assessment", label: "Evaluación física",  type: "textarea" },
    { key: "routine",    label: "Rutina asignada",    type: "textarea" },
    { key: "progress",   label: "Progreso",           type: "textarea" },
  ],
};

// Merge por formulario: si un modelo no define un form, cae al de salón
function mergeSchema(base, over = {}) {
  const out = { ...base };
  for (const form of Object.keys(over)) out[form] = over[form];
  return out;
}

const SCHEMAS = {
  salon:  SALON,
  barber: SALON,
  spa:    SALON,
  gym:    mergeSchema(SALON, GYM),
  clinic: mergeSchema(SALON, CLINIC),
  medicina: mergeSchema(SALON, CLINIC),
  cardio: mergeSchema(mergeSchema(SALON, CLINIC), CARDIO),
  personalizado: SALON,
};

// Normaliza modelos viejos (industry="Estética", etc.) a un slug
function normalizeModel(model = "") {
  const m = String(model).toLowerCase().trim();
  if (m.includes("card")) return "cardio";
  if (m.includes("clin") || m.includes("medic") || m.includes("consult") || m.includes("dent") || m.includes("odont")) return "clinic";
  if (m.includes("gym") || m.includes("gimnas") || m.includes("fitness")) return "gym";
  if (m.includes("barb")) return "barber";
  if (m.includes("spa")) return "spa";
  return SCHEMAS[m] ? m : "salon";
}

// Devuelve el array de campos para un formulario y modelo dados
export function getFields(model, formName) {
  const slug = normalizeModel(model);
  const schema = SCHEMAS[slug] || SCHEMAS.salon;
  return schema[formName] || SCHEMAS.salon[formName] || [];
}

export { SCHEMAS, normalizeModel };
