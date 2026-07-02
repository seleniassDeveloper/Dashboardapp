export const BUSINESS_MODELS = {
  salon: {
    slug: "salon",
    name: "Estética y Bienestar / Peluquería",
    terms: {
      client: { s: "Cliente", p: "Clientes", gen: "m" },
      service: { s: "Servicio", p: "Servicios", gen: "m" },
      appointment: { s: "Turno", p: "Turnos", gen: "m" },
      professional: { s: "Estilista/Profesional", p: "Estilistas/Profesionales", gen: "m" },
      record: { s: "Ficha de Estética", p: "Fichas de Estética" }
    },
    serviceCategories: [
      "Peluquería",
      "Corte y Peinado",
      "Coloración",
      "Tratamiento Capilar",
      "Manicura y Pedicura",
      "Depilación",
      "Estética Corporal",
      "Estética Facial",
      "Masajes",
      "Otros"
    ],
    serviceTemplates: [
      { name: "Manicuría Básica", duration: 40, price: 12000, category: "Manicuría" },
      { name: "Limpieza Facial Profunda", duration: 60, price: 25000, category: "Facial" },
      { name: "Masaje Descontracturante", duration: 60, price: 30000, category: "Masajes" },
      { name: "Perfilado de Cejas", duration: 20, price: 8000, category: "Cejas y Pestañas" }
    ],
    appointmentStatuses: [
      { key: "PENDING", label: "Pendiente", color: "#d97706" },
      { key: "CONFIRMED", label: "Confirmada", color: "#10b981" },
      { key: "IN_PROGRESS", label: "En Servicio", color: "#3b82f6" },
      { key: "PENDING_PAYMENT", label: "Por Cobrar", color: "#ec4899" },
      { key: "CANCELLED", label: "Cancelada", color: "#ef4444" },
      { key: "DONE", label: "Finalizada", color: "#6b7280" }
    ],
    clinicalEntryType: "aesthetic",
    clinicalEntryTypes: [
      { value: "hair_formula", label: "Peluquería / Colorimetría" },
      { value: "aesthetic", label: "Estética / Spa / Manicuría" },
      { value: "clinical", label: "Consulta / Nota Técnica" }
    ]
  },
  barber: {
    slug: "barber",
    name: "Barbería y Peluquería",
    terms: {
      client: { s: "Cliente", p: "Clientes", gen: "m" },
      service: { s: "Servicio", p: "Servicios", gen: "m" },
      appointment: { s: "Turno", p: "Turnos", gen: "m" },
      professional: { s: "Barbero", p: "Barberos", gen: "m" },
      record: { s: "Ficha de Corte", p: "Fichas de Corte" }
    },
    serviceCategories: [
      "Cabello",
      "Barba",
      "Coloración",
      "Tratamiento",
      "Combos",
      "Otros"
    ],
    serviceTemplates: [
      { name: "Corte de Cabello Clásico", duration: 45, price: 15000, category: "Cabello" },
      { name: "Afeitado y Perfilado de Barba", duration: 30, price: 8000, category: "Barba" },
      { name: "Corte + Barba Premium", duration: 75, price: 20000, category: "Combos" },
      { name: "Coloración Completa", duration: 90, price: 35000, category: "Color" }
    ],
    appointmentStatuses: [
      { key: "PENDING", label: "Pendiente", color: "#d97706" },
      { key: "CONFIRMED", label: "Confirmado", color: "#10b981" },
      { key: "IN_PROGRESS", label: "En Sillón", color: "#3b82f6" },
      { key: "PENDING_PAYMENT", label: "Por Cobrar", color: "#ec4899" },
      { key: "CANCELLED", label: "Cancelado", color: "#ef4444" },
      { key: "DONE", label: "Finalizado", color: "#6b7280" }
    ],
    clinicalEntryType: "hair_formula",
    clinicalEntryTypes: [
      { value: "hair_formula", label: "Barbería / Corte y Color" },
      { value: "clinical", label: "Consulta / Nota Técnica" }
    ]
  },
  clinic: {
    slug: "clinic",
    name: "Clínica o Consultorio",
    terms: {
      client: { s: "Paciente", p: "Pacientes", gen: "m" },
      service: { s: "Consulta/Práctica", p: "Consultas/Prácticas", gen: "f" },
      appointment: { s: "Turno", p: "Turnos", gen: "m" },
      professional: { s: "Médico/Especialista", p: "Médicos/Especialistas", gen: "m" },
      record: { s: "Historia Clínica", p: "Historias Clínicas" }
    },
    serviceCategories: [
      "Consulta General",
      "Chequeo",
      "Odontología",
      "Nutrición",
      "Kinesiología",
      "Especialidad",
      "Otros"
    ],
    serviceTemplates: [
      { name: "Consulta Médica General", duration: 30, price: 20000, category: "Consulta" },
      { name: "Chequeo Preventivo Completo", duration: 45, price: 25000, category: "Evaluación" },
      { name: "Consulta Especializada", duration: 30, price: 35000, category: "Especialidad" }
    ],
    appointmentStatuses: [
      { key: "PENDING", label: "Sala de Espera", color: "#d97706" },
      { key: "CONFIRMED", label: "Confirmado", color: "#10b981" },
      { key: "IN_PROGRESS", label: "En Consulta", color: "#3b82f6" },
      { key: "PENDING_PAYMENT", label: "Por Facturar", color: "#ec4899" },
      { key: "CANCELLED", label: "Cancelado", color: "#ef4444" },
      { key: "DONE", label: "Atendido", color: "#6b7280" }
    ],
    clinicalEntryType: "clinical",
    clinicalEntryTypes: [
      { value: "clinical", label: "Clínica Médica / Evolución" },
      { value: "dentistry", label: "Odontología" }
    ]
  },
  gym: {
    slug: "gym",
    name: "Gimnasio o Fitness",
    terms: {
      client: { s: "Socio", p: "Socios", gen: "m" },
      service: { s: "Clase/Pase", p: "Clases/Pases", gen: "f" },
      appointment: { s: "Reserva", p: "Reservas", gen: "f" },
      professional: { s: "Entrenador", p: "Entrenadores", gen: "m" },
      record: { s: "Ficha de Entrenamiento", p: "Fichas de Entrenamiento" }
    },
    serviceCategories: [
      "Pase Libre",
      "Pilates",
      "Yoga",
      "Musculación",
      "Funcional",
      "Personalizado",
      "Otros"
    ],
    serviceTemplates: [
      { name: "Sesión Personal Trainer", duration: 60, price: 15000, category: "Entrenamiento" },
      { name: "Evaluación Física Inicial", duration: 45, price: 12000, category: "Evaluación" },
      { name: "Clase de Pilates Reformer", duration: 60, price: 10000, category: "Clases" }
    ],
    appointmentStatuses: [
      { key: "PENDING", label: "Reservado", color: "#d97706" },
      { key: "CONFIRMED", label: "Confirmado", color: "#10b981" },
      { key: "IN_PROGRESS", label: "En Clase", color: "#3b82f6" },
      { key: "PENDING_PAYMENT", label: "Impago", color: "#ec4899" },
      { key: "CANCELLED", label: "Cancelado", color: "#ef4444" },
      { key: "DONE", label: "Asistido", color: "#6b7280" }
    ],
    clinicalEntryType: "clinical",
    clinicalEntryTypes: [
      { value: "clinical", label: "Ficha Deportiva / Rutina" }
    ]
  },
  spa: {
    slug: "spa",
    name: "Spa & Wellness",
    terms: {
      client: { s: "Cliente", p: "Clientes", gen: "m" },
      service: { s: "Servicio/Tratamiento", p: "Servicios/Tratamientos", gen: "m" },
      appointment: { s: "Turno", p: "Turnos", gen: "m" },
      professional: { s: "Terapeuta", p: "Terapeutas", gen: "m" },
      record: { s: "Ficha de Bienestar", p: "Fichas de Bienestar" }
    },
    serviceCategories: [
      "Masajes",
      "Tratamiento Corporal",
      "Tratamiento Facial",
      "Circuitos",
      "Sauna",
      "Otros"
    ],
    serviceTemplates: [
      { name: "Circuito Spa Termal", duration: 90, price: 40000, category: "Circuitos" },
      { name: "Masaje Relajante con Piedras Calientes", duration: 60, price: 35000, category: "Masajes" },
      { name: "Exfoliación Corporal Completa", duration: 45, price: 28000, category: "Tratamientos" }
    ],
    appointmentStatuses: [
      { key: "PENDING", label: "Pendiente", color: "#d97706" },
      { key: "CONFIRMED", label: "Confirmada", color: "#10b981" },
      { key: "IN_PROGRESS", label: "En Cabina", color: "#3b82f6" },
      { key: "PENDING_PAYMENT", label: "Por Cobrar", color: "#ec4899" },
      { key: "CANCELLED", label: "Cancelada", color: "#ef4444" },
      { key: "DONE", label: "Finalizada", color: "#6b7280" }
    ],
    clinicalEntryType: "aesthetic",
    clinicalEntryTypes: [
      { value: "aesthetic", label: "Tratamiento de Spa / Masajes" },
      { value: "clinical", label: "Consulta / Nota de Bienestar" }
    ]
  },
  custom: {
    slug: "custom",
    name: "Personalizado",
    terms: {
      client: { s: "Cliente", p: "Clientes", gen: "m" },
      service: { s: "Servicio", p: "Servicios", gen: "m" },
      appointment: { s: "Turno", p: "Turnos", gen: "m" },
      professional: { s: "Profesional", p: "Profesionales", gen: "m" },
      record: { s: "Ficha de Registro", p: "Fichas de Registro" }
    },
    serviceCategories: [
      "General",
      "Premium",
      "Otros"
    ],
    serviceTemplates: [
      { name: "Servicio Estándar", duration: 30, price: 8000, category: "General" },
      { name: "Servicio Premium", duration: 60, price: 15000, category: "General" }
    ],
    appointmentStatuses: [
      { key: "PENDING", label: "Pendiente", color: "#d97706" },
      { key: "CONFIRMED", label: "Confirmado", color: "#10b981" },
      { key: "IN_PROGRESS", label: "En Proceso", color: "#3b82f6" },
      { key: "PENDING_PAYMENT", label: "Por Cobrar", color: "#ec4899" },
      { key: "CANCELLED", label: "Cancelado", color: "#ef4444" },
      { key: "DONE", label: "Completado", color: "#6b7280" }
    ],
    clinicalEntryType: "clinical",
    clinicalEntryTypes: [
      { value: "clinical", label: "Registro / Nota General" }
    ]
  }
};
