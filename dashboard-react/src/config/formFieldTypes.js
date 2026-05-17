/** Tipos de campo disponibles en el editor de formularios configurables */
export const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Texto corto" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "textarea", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "currency", label: "Monto ($)" },
  { value: "select", label: "Lista desplegable" },
  { value: "services", label: "Servicios (sistema)", systemOnly: true },
  { value: "servicePricing", label: "Tarifas por servicio (sistema)", systemOnly: true },
  { value: "schedule", label: "Horario laboral (sistema)", systemOnly: true },
  { value: "workerSelect", label: "Selector profesional (sistema)", systemOnly: true },
  { value: "serviceSelect", label: "Selector servicio (sistema)", systemOnly: true },
  { value: "datetime", label: "Fecha y hora (sistema)", systemOnly: true },
];

export const SECTION_LABELS = {
  datos: "Datos personales",
  contacto: "Contacto",
  trabajo: "Trabajo y horarios",
  otro: "Otros",
};

export const SYSTEM_FIELD_IDS = ["firstName", "lastName", "services", "schedule"];
