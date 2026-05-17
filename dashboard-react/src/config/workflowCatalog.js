export const TRIGGER_META = {
  appointment_before: {
    label: "Antes de la cita",
    description: "Se ejecuta X tiempo antes del turno.",
    configFields: [{ key: "minutesBefore", label: "Minutos antes", type: "number", default: 1440 }],
  },
  appointment_after: {
    label: "Después de la cita",
    description: "Cuando la cita cambia de estado.",
    configFields: [
      {
        key: "whenStatus",
        label: "Estado",
        type: "select",
        options: [
          { value: "DONE", label: "Finalizada" },
          { value: "CONFIRMED", label: "Confirmada" },
          { value: "CANCELLED", label: "Cancelada" },
        ],
        default: "DONE",
      },
    ],
  },
  appointment_created: {
    label: "Nueva cita creada",
    description: "Al agendar un turno nuevo.",
    configFields: [],
  },
  appointment_cancelled: {
    label: "Cita cancelada",
    description: "Cuando se cancela una reserva.",
    configFields: [],
  },
  client_inactive: {
    label: "Cliente inactivo",
    description: "Sin citas en X días.",
    configFields: [{ key: "inactiveDays", label: "Días sin cita", type: "number", default: 30 }],
  },
  schedule_daily: {
    label: "Diario (horario fijo)",
    description: "Corre todos los días a una hora.",
    configFields: [{ key: "time", label: "Hora (HH:mm)", type: "text", default: "09:00" }],
  },
};

export const ACTION_META = {
  send_whatsapp: {
    label: "Enviar WhatsApp",
    configFields: [
      {
        key: "template",
        label: "Plantilla",
        type: "select",
        options: [
          { value: "recordatorio_cita", label: "Recordatorio de cita" },
          { value: "recordatorio_corta", label: "Recordatorio corto" },
          { value: "confirmacion", label: "Confirmación" },
        ],
        default: "recordatorio_cita",
      },
    ],
  },
  send_email: {
    label: "Enviar email",
    configFields: [
      {
        key: "template",
        label: "Plantilla",
        type: "select",
        options: [
          { value: "confirmacion_reserva", label: "Confirmación reserva" },
          { value: "reactivacion", label: "Reactivación cliente" },
          { value: "promocion", label: "Promoción" },
        ],
        default: "confirmacion_reserva",
      },
    ],
  },
  send_reminder_email: {
    label: "Email recordatorio (sistema)",
    configFields: [],
  },
  notify_admin: {
    label: "Notificar al administrador",
    configFields: [{ key: "message", label: "Mensaje", type: "text", default: "Evento de workflow" }],
  },
  apply_discount: {
    label: "Aplicar descuento / cupón",
    configFields: [
      { key: "percent", label: "% descuento", type: "number", default: 10 },
      { key: "validDays", label: "Válido (días)", type: "number", default: 30 },
    ],
  },
};

export function triggerSummary(trigger) {
  if (!trigger?.type) return "—";
  const meta = TRIGGER_META[trigger.type];
  const cfg = trigger.config || {};
  if (trigger.type === "appointment_before") {
    const h = Math.round((cfg.minutesBefore || 0) / 60);
    return h >= 24 ? `${Math.round(h / 24)}d antes` : `${cfg.minutesBefore || 0} min antes`;
  }
  if (trigger.type === "client_inactive") return `${cfg.inactiveDays || 30} días inactivo`;
  if (trigger.type === "appointment_after") return `Al ${cfg.whenStatus === "DONE" ? "finalizar" : cfg.whenStatus}`;
  return meta?.label || trigger.type;
}

export function stepsSummary(steps) {
  if (!steps?.length) return "—";
  return steps
    .map((s) => ACTION_META[s.type]?.label || s.type)
    .join(" → ");
}
