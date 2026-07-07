import { useEffect, useState, useMemo } from "react";
import api from "../lib/api.js";
import { useFormSchema } from "./useFormSchema.js";

const PRESET_ROLES = [
  { key: "owner", name: "Owner (Dueño)", desc: "Control total, finanzas y auditorías del salón." },
  { key: "admin", name: "Admin (Administrador)", desc: "Administración global sin acceso al cambio de dueño." },
  { key: "manager", name: "Manager (Gerente)", desc: "Gestión operativa, personal, agendas y reportes básicos." },
  { key: "professional", name: "Profesional", desc: "Ver su propia agenda, fichas técnicas de clientes y evolucionar." },
  { key: "reception", name: "Recepción", desc: "Agendar turnos, registrar cobros y base de datos de clientes." },
  { key: "viewer", name: "Viewer (Auditor)", desc: "Acceso de solo lectura para reportería y controles." }
];

const PERMISSIONS_MATRIX = {
  owner: ["Agenda: Control Total", "Clientes: Ficha CRM y Privada", "Personal: Comisiones y Contratos", "Finanzas: Cierre de Caja y ERP", "Configuración: Módulos y Logins", "AI Copilot: Analíticas e Insights"],
  admin: ["Agenda: Control Total", "Clientes: Ficha CRM y Privada", "Personal: Horarios y Cargos", "Finanzas: Cierre de Caja", "Configuración: Módulos", "AI Copilot: Analíticas"],
  manager: ["Agenda: Control Total", "Clientes: Ficha CRM y Privada", "Personal: Horarios", "Finanzas: Solo Lectura", "AI Copilot: Analíticas"],
  professional: ["Agenda: Solo Citas Propias", "Clientes: Ficha CRM / Fórmulas Técnicas", "Personal: Solo Consulta", "Finanzas: Bloqueado"],
  reception: ["Agenda: Crear y Modificar", "Clientes: Crear y Consultar", "Personal: Horarios", "Finanzas: Registrar Transacción"],
  viewer: ["Agenda: Solo Lectura", "Clientes: Solo Lectura", "Personal: Solo Lectura", "Finanzas: Solo Lectura"]
};

export function useWorkerForm({ show, mode = "create", initialData = null, onSaved, onHide }) {
  const isEdit = mode === "edit" && Boolean(initialData?.id);
  const schemaKey = isEdit ? "assign.worker.form.edit" : "assign.worker.form.create";

  const { enabledFields, loading: schemaLoading, error: schemaError } = useFormSchema(schemaKey, {
    enabled: show,
  });

  const isFirstNameEnabled = useMemo(() => enabledFields.some(f => f.id === "firstName"), [enabledFields]);
  const isLastNameEnabled = useMemo(() => enabledFields.some(f => f.id === "lastName"), [enabledFields]);
  const isEmailEnabled = useMemo(() => enabledFields.some(f => f.id === "email"), [enabledFields]);
  const isPhoneEnabled = useMemo(() => enabledFields.some(f => f.id === "phone"), [enabledFields]);
  const isRoleTitleEnabled = useMemo(() => enabledFields.some(f => f.id === "roleTitle"), [enabledFields]);
  const isServicesEnabled = useMemo(() => enabledFields.some(f => f.id === "services"), [enabledFields]);
  const isScheduleEnabled = useMemo(() => enabledFields.some(f => f.id === "schedule"), [enabledFields]);
  const isServicePricingEnabled = useMemo(() => enabledFields.some(f => f.id === "servicePricing"), [enabledFields]);

  const [customFieldValues, setCustomFieldValues] = useState({});

  const customFields = useMemo(() => {
    return enabledFields.filter(
      (f) => !["firstName", "lastName", "roleTitle", "email", "phone", "services", "servicePricing", "schedule"].includes(f.id)
    );
  }, [enabledFields]);

  const generalTabFields = useMemo(() => {
    return enabledFields.filter(
      (f) => !["roleTitle", "services", "servicePricing", "schedule"].includes(f.id)
    );
  }, [enabledFields]);

  const handleCustomFieldChange = (fieldId, val) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: val
    }));
  };

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // TAB 1 - GENERAL
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [status, setStatus] = useState("Activo");

  // TAB 2 - CARGO Y ROL
  const [cargo, setCargo] = useState("Estilista");
  const [role, setRole] = useState("professional");

  // TAB 3 - ESPECIALIDADES & SERVICIOS
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  // TAB 4 - HORARIOS
  const [schedules, setSchedules] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i + 1,
      active: i < 5, // Lunes a Viernes
      startTime: "09:00",
      endTime: "18:00",
      breakStartTime: "13:00",
      breakEndTime: "14:00"
    }))
  );

  // TAB 5 - COMISIONES
  const [commissionType, setCommissionType] = useState("porcentaje");
  const [commissionServices, setCommissionServices] = useState(40);
  const [commissionProducts, setCommissionProducts] = useState(10);
  const [monthlyBonus, setMonthlyBonus] = useState(0);
  const [monthlyTarget, setMonthlyTarget] = useState(1000000);

  // Simulador de comisiones
  const [simulatedRevenue, setSimulatedRevenue] = useState(1000000);

  // TAB 6 - ACCESO Y VER MATRIZ
  const [showMatrix, setShowMatrix] = useState(false);

  // Cargar lista de servicios
  useEffect(() => {
    if (show) {
      api.get("/services")
        .then(res => setServicesList(res.data || []))
        .catch(err => console.error("Error loading services:", err));
    }
  }, [show]);

  // Cargar datos iniciales al abrir o cambiar initialData
  useEffect(() => {
    if (!show) return;
    setError("");
    setSuccess("");
    setActiveTab("general");
    setShowMatrix(false);

    if (isEdit && initialData) {
      setFirstName(initialData.firstName || "");
      setLastName(initialData.lastName || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      
      const cf = initialData.customFields || {};
      setCargo(initialData.roleTitle || cf.cargo || "Estilista");
      setRole(cf.role || "professional");
      setPhoto(cf.photo || "");
      setEntryDate(cf.entryDate || new Date().toISOString().split("T")[0]);
      setStatus(cf.status || "Activo");
      setSelectedSpecialties(cf.specialties || []);

      const comm = cf.commissions || {};
      setCommissionType(comm.type || "porcentaje");
      setCommissionServices(comm.services ?? 40);
      setCommissionProducts(comm.products ?? 10);
      setMonthlyBonus(comm.monthlyBonus ?? 0);
      setMonthlyTarget(comm.monthlyTarget ?? 1000000);

      // Mapear horarios asignados
      const initialSchedules = Array.from({ length: 7 }, (_, idx) => {
        const dayNum = idx + 1;
        const matched = (initialData.schedules || []).find(s => Number(s.dayOfWeek) === dayNum);
        const extra = (cf.schedulesExtra || {})[dayNum] || {};

        return {
          dayOfWeek: dayNum,
          active: !!matched,
          startTime: matched?.startTime || "09:00",
          endTime: matched?.endTime || "18:00",
          breakStartTime: extra.breakStartTime || "13:00",
          breakEndTime: extra.breakEndTime || "14:00"
        };
      });
      setSchedules(initialSchedules);
      setSelectedServiceIds(initialData.serviceIds || []);

      // Cargar campos personalizados
      const userCf = {};
      Object.keys(cf).forEach(key => {
        if (!["photo", "entryDate", "status", "role", "specialties", "commissions", "schedulesExtra", "lastAccess"].includes(key)) {
          userCf[key] = cf[key];
        }
      });
      setCustomFieldValues(userCf);
    } else {
      // Valores por defecto para creación
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPhoto("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      setStatus("Activo");
      setCargo("Estilista");
      setRole("professional");
      setSelectedSpecialties([]);
      setSelectedServiceIds([]);
      setCommissionType("porcentaje");
      setCommissionServices(40);
      setCommissionProducts(10);
      setMonthlyBonus(0);
      setMonthlyTarget(1000000);
      setSchedules(
        Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i + 1,
          active: i < 5,
          startTime: "09:00",
          endTime: "18:00",
          breakStartTime: "13:00",
          breakEndTime: "14:00"
        }))
      );
      setCustomFieldValues({});
    }
  }, [show, isEdit, initialData]);

  // Copiar horario de lunes a toda la semana
  const handleCopySchedule = () => {
    const monday = schedules[0];
    if (!monday) return;
    setSchedules(prev => prev.map((s, idx) => {
      if (idx === 0) return s;
      return {
        ...s,
        startTime: monday.startTime,
        endTime: monday.endTime,
        breakStartTime: monday.breakStartTime,
        breakEndTime: monday.breakEndTime
      };
    }));
    setSuccess("Horario del Lunes copiado a toda la semana.");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Manejar cambio en especialidades chips
  const handleToggleSpecialty = (spec) => {
    setSelectedSpecialties(prev => 
      prev.includes(spec) ? prev.filter(x => x !== spec) : [...prev, spec]
    );
  };

  // Simulación dinámica de comisiones
  const simulatedOutcome = useMemo(() => {
    let commission = 0;
    if (commissionType === "porcentaje") {
      commission = Math.round(simulatedRevenue * (commissionServices / 100));
    } else if (commissionType === "fijo") {
      commission = Number(commissionServices);
    } else {
      commission = Number(commissionServices) + Math.round(simulatedRevenue * 0.1);
    }
    const achievedTarget = simulatedRevenue >= monthlyTarget;
    const finalEarnings = commission + (achievedTarget ? Number(monthlyBonus) : 0);

    return {
      commission,
      finalEarnings,
      achievedTarget,
      bonusEarned: achievedTarget ? Number(monthlyBonus) : 0
    };
  }, [simulatedRevenue, commissionType, commissionServices, monthlyBonus, monthlyTarget]);

  // Guardar Colaborador
  const handleSave = async () => {
    // Validación dinámica de campos obligatorios
    const fieldErrors = {};
    for (const field of enabledFields) {
      let val = "";
      if (field.id === "firstName") val = firstName;
      else if (field.id === "lastName") val = lastName;
      else if (field.id === "email") val = email;
      else if (field.id === "phone") val = phone;
      else if (field.id === "roleTitle") val = cargo;
      else if (field.id === "services") {
        if (field.required && selectedServiceIds.length === 0) {
          fieldErrors[field.id] = "Debes seleccionar al menos un servicio.";
        }
        continue;
      }
      else if (field.id === "schedule") {
        const activeDays = schedules.filter(s => s.active);
        if (field.required && activeDays.length === 0) {
          fieldErrors[field.id] = "Debes dejar al menos un día activo en el horario.";
        }
        continue;
      }
      else if (field.id === "servicePricing") {
        continue;
      } else {
        val = customFieldValues[field.id] || "";
      }

      if (field.required && !String(val || "").trim()) {
        fieldErrors[field.id] = `El campo ${field.label || field.id} es obligatorio.`;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      setError(Object.values(fieldErrors)[0]);
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Mapear horarios activos para la API
      const activeSchedules = schedules
        .filter(s => s.active)
        .map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime
        }));

      if (isScheduleEnabled && activeSchedules.length === 0 && enabledFields.find(f => f.id === "schedule")?.required) {
        setError("Debes dejar al menos un día activo en el horario.");
        setSaving(false);
        return;
      }

      // Estructurar extras de descansos
      const schedulesExtra = {};
      schedules.forEach(s => {
        schedulesExtra[s.dayOfWeek] = {
          breakStartTime: s.breakStartTime,
          breakEndTime: s.breakEndTime
        };
      });

      const payload = {
        firstName: isFirstNameEnabled ? firstName.trim() : "",
        lastName: isLastNameEnabled ? lastName.trim() : "",
        email: isEmailEnabled ? (email.trim() || null) : null,
        phone: isPhoneEnabled ? (phone.trim() || null) : null,
        roleTitle: isRoleTitleEnabled ? cargo : null,
        serviceIds: isServicesEnabled ? selectedServiceIds : [],
        schedules: isScheduleEnabled ? activeSchedules : [],
        customFields: {
          photo: photo.trim() || null,
          entryDate,
          status,
          role, // Rol de permisos
          specialties: isServicesEnabled ? selectedSpecialties : [],
          commissions: isServicePricingEnabled ? {
            type: commissionType,
            services: Number(commissionServices),
            products: Number(commissionProducts),
            monthlyBonus: Number(monthlyBonus),
            monthlyTarget: Number(monthlyTarget)
          } : {},
          schedulesExtra: isScheduleEnabled ? schedulesExtra : {},
          lastAccess: initialData?.lastAccess || "Nunca",
          ...customFieldValues
        }
      };

      const url = isEdit ? `/workers/${initialData.id}` : `/workers`;
      const res = isEdit ? await api.put(url, payload) : await api.post(url, payload);
      
      onSaved?.(res.data);
      onHide?.();
    } catch (e) {
      console.error("Error saving worker:", e);
      setError(e?.response?.data?.error || "Error al registrar o actualizar el miembro del equipo.");
    } finally {
      setSaving(false);
    }
  };

  const activePermissions = PERMISSIONS_MATRIX[role] || [];

  return {
    isEdit,
    enabledFields,
    schemaLoading,
    schemaError,
    isFirstNameEnabled,
    isLastNameEnabled,
    isEmailEnabled,
    isPhoneEnabled,
    isRoleTitleEnabled,
    isServicesEnabled,
    isScheduleEnabled,
    isServicePricingEnabled,
    customFieldValues,
    setCustomFieldValues,
    customFields,
    generalTabFields,
    handleCustomFieldChange,
    activeTab,
    setActiveTab,
    saving,
    setSaving,
    error,
    setError,
    success,
    setSuccess,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    photo,
    setPhoto,
    entryDate,
    setEntryDate,
    status,
    setStatus,
    cargo,
    setCargo,
    role,
    setRole,
    selectedSpecialties,
    setSelectedSpecialties,
    servicesList,
    selectedServiceIds,
    setSelectedServiceIds,
    schedules,
    setSchedules,
    commissionType,
    setCommissionType,
    commissionServices,
    setCommissionServices,
    commissionProducts,
    setCommissionProducts,
    monthlyBonus,
    setMonthlyBonus,
    monthlyTarget,
    setMonthlyTarget,
    simulatedRevenue,
    setSimulatedRevenue,
    showMatrix,
    setShowMatrix,
    handleCopySchedule,
    handleToggleSpecialty,
    simulatedOutcome,
    handleSave,
    activePermissions
  };
}
