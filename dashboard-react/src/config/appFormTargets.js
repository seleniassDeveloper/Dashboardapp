/** Componentes de la app que consumen campos configurables */
export const FORM_TARGET_GROUPS = [
  {
    entity: "worker",
    label: "Empleados / Equipo",
    targets: [
      { key: "assign.worker.form.create", label: "Formulario — Nuevo empleado", component: "WorkerFormModal" },
      { key: "assign.worker.form.edit", label: "Formulario — Editar empleado", component: "WorkerFormModal" },
      { key: "assign.worker.card.view", label: "Tarjeta en lista de equipo", component: "TeamView" },
    ],
  },
  {
    entity: "client",
    label: "Clientes",
    targets: [
      { key: "assign.client.form.create", label: "Formulario — Nuevo cliente", component: "ClientModal" },
      { key: "assign.client.form.edit", label: "Formulario — Editar cliente", component: "ClientModal" },
      { key: "assign.client.card.view", label: "Ficha / lista de clientes", component: "ClientsABMModal" },
    ],
  },
  {
    entity: "appointment",
    label: "Citas",
    targets: [
      { key: "assign.appointment.form.modal", label: "Modal nueva / editar cita", component: "AppointmentModal" },
      { key: "assign.appointment.detail.view", label: "Detalle de cita (calendario)", component: "AppointmentsCalendar" },
      { key: "assign.appointment.list.item", label: "Ítem en agenda del día", component: "AppointmentItem" },
    ],
  },
  {
    entity: "service",
    label: "Servicios",
    targets: [
      { key: "assign.service.form.modal", label: "Modal servicio", component: "ServiceModal" },
    ],
  },
  {
    entity: "workflow",
    label: "Workflows",
    targets: [
      { key: "assign.workflow.screen", label: "Pantallas en flujos automáticos", component: "WorkflowScreen" },
    ],
  },
];

export const ALL_FORM_TARGETS = FORM_TARGET_GROUPS.flatMap((g) =>
  g.targets.map((t) => ({ ...t, entity: g.entity, groupLabel: g.label }))
);

export const REGISTRY_SCHEMA_KEY = "fields.registry";
