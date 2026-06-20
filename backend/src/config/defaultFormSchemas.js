/** Catálogo maestro + asignaciones por componente */

export const REGISTRY_FIELDS = [
  { id: "firstName", type: "text", label: "Nombre", entities: ["worker", "client"], system: true },
  { id: "lastName", type: "text", label: "Apellido", entities: ["worker", "client"], system: true },
  { id: "roleTitle", type: "text", label: "Cargo / Rol", entities: ["worker"] },
  { id: "email", type: "email", label: "Email", entities: ["worker", "client", "appointment"], system: true },
  { id: "phone", type: "phone", label: "Teléfono / Celular", entities: ["worker", "client", "appointment"] },
  { id: "services", type: "services", label: "Servicios", entities: ["worker"], system: true },
  { id: "servicePricing", type: "servicePricing", label: "Tarifas por servicio", entities: ["worker"] },
  { id: "schedule", type: "schedule", label: "Horario laboral", entities: ["worker"], system: true },
  { id: "notes", type: "textarea", label: "Notas / Observaciones", entities: ["client", "appointment"] },
  { id: "clientFirstName", type: "text", label: "Nombre cliente", entities: ["appointment"], system: true },
  { id: "clientLastName", type: "text", label: "Apellido cliente", entities: ["appointment"], system: true },
  { id: "workerId", type: "workerSelect", label: "Profesional", entities: ["appointment"], system: true },
  { id: "serviceId", type: "serviceSelect", label: "Servicio", entities: ["appointment"], system: true },
  { id: "startsAt", type: "datetime", label: "Fecha y hora", entities: ["appointment"], system: true },
  { id: "price", type: "currency", label: "Precio", entities: ["appointment", "service"], system: true },
  { id: "name", type: "text", label: "Nombre", entities: ["service"], system: true },
  { id: "duration", type: "number", label: "Duración (min)", entities: ["service"], system: true },
  { id: "screenTitle", type: "text", label: "Título pantalla", entities: ["workflow"] },
  { id: "screenMessage", type: "textarea", label: "Mensaje", entities: ["workflow"] },
  { id: "confirmButton", type: "text", label: "Texto botón confirmar", entities: ["workflow"] },
  { id: "clientPhone", type: "phone", label: "Teléfono cliente", entities: ["workflow", "appointment"] },
  { id: "appointmentNotes", type: "textarea", label: "Notas cita", entities: ["workflow", "appointment"] },
];

const workerFields = REGISTRY_FIELDS.filter(f => f.entities.includes("worker"));
const clientFields = REGISTRY_FIELDS.filter(f => f.entities.includes("client"));
const appointmentFields = REGISTRY_FIELDS.filter(f => f.entities.includes("appointment"));
const serviceFields = REGISTRY_FIELDS.filter(f => f.entities.includes("service"));
const workflowScreenFields = REGISTRY_FIELDS.filter(f => f.entities.includes("workflow"));

function refs(ids, overrides = {}) {
  return ids.map((id) => ({
    id,
    enabled: true,
    required: overrides[id]?.required ?? false,
    ...overrides[id],
  }));
}



export const DEFAULT_FORM_SCHEMAS = [
  {
    key: "fields.registry",
    label: "Catálogo global de campos",
    schemaType: "registry",
    fields: REGISTRY_FIELDS,
  },
  // Legacy keys (compat)
  {
    key: "worker.create",
    label: "Nuevo empleado (legacy)",
    schemaType: "legacy",
    fields: workerFields.map((f) => ({ ...f, enabled: true, required: f.system, section: "datos" })),
  },
  {
    key: "worker.edit",
    label: "Editar empleado (legacy)",
    schemaType: "legacy",
    fields: [],
  },
  // Asignaciones por componente
  {
    key: "assign.worker.form.create",
    label: "Empleado — formulario alta",
    schemaType: "assignment",
    entity: "worker",
    component: "WorkerFormModal",
    fieldRefs: refs(
      ["firstName", "lastName", "roleTitle", "email", "phone", "services", "servicePricing", "schedule"],
      { firstName: { required: true }, lastName: { required: true }, services: { required: true }, schedule: { required: true } }
    ),
  },
  {
    key: "assign.worker.form.edit",
    label: "Empleado — formulario edición",
    schemaType: "assignment",
    entity: "worker",
    component: "WorkerFormModal",
    fieldRefs: refs(
      ["firstName", "lastName", "roleTitle", "email", "phone", "services", "servicePricing", "schedule"],
      { firstName: { required: true }, lastName: { required: true }, services: { required: true }, schedule: { required: true } }
    ),
  },
  {
    key: "assign.worker.card.view",
    label: "Empleado — tarjeta",
    schemaType: "assignment",
    entity: "worker",
    component: "TeamView",
    fieldRefs: refs(["firstName", "lastName", "roleTitle", "email", "phone", "schedule"]),
  },
  {
    key: "assign.client.form.create",
    label: "Cliente — alta",
    schemaType: "assignment",
    entity: "client",
    component: "ClientModal",
    fieldRefs: refs(["firstName", "lastName", "phone", "email", "notes"], {
      firstName: { required: true },
      lastName: { required: true },
    }),
  },
  {
    key: "assign.client.form.edit",
    label: "Cliente — edición",
    schemaType: "assignment",
    entity: "client",
    component: "ClientModal",
    fieldRefs: refs(["firstName", "lastName", "phone", "email", "notes"], {
      firstName: { required: true },
      lastName: { required: true },
    }),
  },
  {
    key: "assign.client.card.view",
    label: "Cliente — ficha",
    schemaType: "assignment",
    entity: "client",
    component: "ClientsABMModal",
    fieldRefs: refs(["firstName", "lastName", "phone", "email"]),
  },
  {
    key: "assign.appointment.form.modal",
    label: "Cita — modal",
    schemaType: "assignment",
    entity: "appointment",
    component: "AppointmentModal",
    fieldRefs: refs(
      ["clientFirstName", "clientLastName", "workerId", "serviceId", "startsAt", "price", "notes", "phone", "email"],
      {
        clientFirstName: { required: true },
        clientLastName: { required: true },
        workerId: { required: true },
        serviceId: { required: true },
        startsAt: { required: true },
      }
    ),
  },
  {
    key: "assign.appointment.detail.view",
    label: "Cita — detalle calendario",
    schemaType: "assignment",
    entity: "appointment",
    component: "AppointmentsCalendar",
    fieldRefs: refs(["clientFirstName", "clientLastName", "workerId", "serviceId", "startsAt", "notes"]),
  },
  {
    key: "assign.appointment.list.item",
    label: "Cita — ítem lista",
    schemaType: "assignment",
    entity: "appointment",
    component: "AppointmentItem",
    fieldRefs: refs(["clientFirstName", "clientLastName", "workerId", "serviceId", "startsAt"]),
  },
  {
    key: "assign.service.form.modal",
    label: "Servicio — modal",
    schemaType: "assignment",
    entity: "service",
    component: "ServiceModal",
    fieldRefs: refs(["name", "price", "duration"], {
      name: { required: true },
      price: { required: true },
      duration: { required: true },
    }),
  },
  {
    key: "assign.workflow.screen",
    label: "Workflow — pantallas",
    schemaType: "assignment",
    entity: "workflow",
    component: "WorkflowScreen",
    fieldRefs: refs(["screenTitle", "screenMessage", "confirmButton", "clientPhone", "appointmentNotes"]),
  },
];

export function resolveFieldsFromRegistry(registryFields, assignment) {
  const registry = Array.isArray(registryFields) ? registryFields : [];
  const refs = assignment?.fieldRefs || assignment?.fields || [];
  if (!refs.length) return [];

  return refs
    .filter((r) => r.enabled !== false)
    .map((ref) => {
      const base = registry.find((f) => f.id === ref.id);
      if (!base) return { ...ref, id: ref.id, label: ref.id, type: "text" };
      return {
        ...base,
        ...ref,
        label: ref.label || base.label,
        required: ref.required ?? base.required ?? false,
        enabled: ref.enabled !== false,
      };
    });
}
