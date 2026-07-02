// ============================================================
// AuraDash — Diccionario de terminología por modelo de negocio
// Ubicación sugerida: dashboard-react/src/config/terms.js
//
// El backend NO cambia (Client, Service, Appointment siguen igual).
// Esto solo cambia lo que se MUESTRA según business.model.
//
// Uso:
//   import { getTerms } from "@/config/terms";
//   const t = getTerms(business?.model);   // o vía un hook useTerms()
//   t.client.p  -> "Clientes" | "Pacientes"
//   t.appointment.s -> "Cita" | "Turno"
// ============================================================

// --- Modelo base (salón). Todos heredan de acá y sobreescriben lo que difiere. ---
const SALON = {
  // Entidades (s = singular, p = plural)
  client:       { s: "Cliente",      p: "Clientes" },
  patientish:   { s: "Cliente",      p: "Clientes" }, // alias por si hace falta
  appointment:  { s: "Cita",         p: "Citas" },
  service:      { s: "Servicio",     p: "Servicios" },
  professional: { s: "Estilista",    p: "Estilistas" },
  team:         { s: "Colaborador",  p: "Equipo" },
  record:       { s: "Ficha Técnica", p: "Fichas Técnicas" },
  formula:      { s: "Fórmula",      p: "Fórmulas" },
  commission:   { s: "Comisión",     p: "Comisiones" },
  branch:       { s: "Sucursal",     p: "Sucursales" },
  product:      { s: "Producto",     p: "Productos" },
  category:     { s: "Categoría",    p: "Categorías" },

  // Labels de menú / navegación
  nav: {
    panel: "Panel",
    agenda: "Agenda",
    clients: "Clientes",
    services: "Servicios",
    team: "Equipo",
    finance: "Finanzas",
    inventory: "Inventario",
    settings: "Configuración",
  },

  // Estados de cita
  statuses: {
    pending: "Pendiente",
    confirmed: "Confirmado",
    done: "Realizado",
    cancelled: "Cancelado",
  },

  // Ficha / historia
  profile: "Perfil y Estadísticas",
  history: "Historial de Visitas",
  gallery: "Galería Antes y Después",
  notes: "Notas de la Cita",
  consent: "Consentimientos",

  // Copilot IA
  lostClients: "Clientes Fugados",
};

// --- Medicina / Clínica: solo sobreescribe lo que cambia ---
const CLINIC = {
  client:       { s: "Paciente",     p: "Pacientes" },
  patientish:   { s: "Paciente",     p: "Pacientes" },
  appointment:  { s: "Turno",        p: "Turnos" },
  service:      { s: "Prestación",   p: "Prestaciones" },
  professional: { s: "Profesional",  p: "Profesionales" },
  team:         { s: "Profesional",  p: "Cuerpo Médico" },
  record:       { s: "Historia Clínica", p: "Historias Clínicas" },
  formula:      { s: "Diagnóstico",  p: "Diagnósticos" },
  commission:   { s: "Honorario",    p: "Honorarios" },
  branch:       { s: "Sede",         p: "Sedes" },
  product:      { s: "Insumo",       p: "Insumos" },
  category:     { s: "Especialidad", p: "Especialidades" },

  nav: {
    panel: "Panel",
    agenda: "Turnos",
    clients: "Pacientes",
    services: "Prestaciones",
    team: "Cuerpo Médico",
    finance: "Facturación",
    inventory: "Insumos",
    settings: "Configuración",
  },

  statuses: {
    pending: "Pendiente",
    confirmed: "Confirmado",
    done: "Atendido",
    cancelled: "Cancelado",
  },

  profile: "Perfil del Paciente",
  history: "Historial de Consultas",
  gallery: "Evolución y Estudios",
  notes: "Notas Clínicas / Evolución",
  consent: "Consentimiento Informado",

  lostClients: "Pacientes sin Seguimiento",
};

// --- Variante cardiología (opcional): "Prestación" = "Consulta" ---
const CARDIO = {
  service: { s: "Consulta", p: "Consultas" },
  professional: { s: "Médico", p: "Médicos" },
};

// Merge profundo simple (base + override, respetando {s,p} y objetos anidados)
function deepMerge(base, over = {}) {
  const out = { ...base };
  for (const k of Object.keys(over)) {
    out[k] =
      over[k] && typeof over[k] === "object" && !Array.isArray(over[k])
        ? deepMerge(base[k] || {}, over[k])
        : over[k];
  }
  return out;
}

// Registro por slug de modelo (los slugs vienen de defaultBusinessModels.js)
const MODELS = {
  salon: SALON,
  barber: SALON,                       // barbería usa el vocabulario de salón
  spa: SALON,
  gym: deepMerge(SALON, {              // gimnasio: cliente = socio, servicio = clase
    client: { s: "Socio", p: "Socios" },
    patientish: { s: "Socio", p: "Socios" },
    service: { s: "Clase", p: "Clases" },
    nav: { clients: "Socios", services: "Clases" },
  }),
  clinic: deepMerge(SALON, CLINIC),    // medicina / consultorio
  medicina: deepMerge(SALON, CLINIC),  // alias
  cardio: deepMerge(deepMerge(SALON, CLINIC), CARDIO), // cardiología
  personalizado: SALON,
};

// Normaliza modelos viejos (industry="Estética", etc.) a un slug
function normalizeModel(model = "") {
  const m = String(model).toLowerCase().trim();
  if (!m) return "salon";
  if (m.includes("card")) return "cardio";
  if (m.includes("clin") || m.includes("medic") || m.includes("consult") || m.includes("dent") || m.includes("odont")) return "clinic";
  if (m.includes("gym") || m.includes("gimnas") || m.includes("fitness")) return "gym";
  if (m.includes("barb")) return "barber";
  if (m.includes("spa")) return "spa";
  if (m.includes("salon") || m.includes("estet") || m.includes("belle") || m.includes("pelu") || m.includes("uñas") || m.includes("nails")) return "salon";
  return MODELS[m] ? m : "salon";
}

// API principal: devuelve el set de términos del modelo (con fallback a salón)
export function getTerms(model) {
  const slug = normalizeModel(model);
  return MODELS[slug] || MODELS.salon;
}

export { MODELS, normalizeModel };
