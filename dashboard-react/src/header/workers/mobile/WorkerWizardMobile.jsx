import React, { useState, useMemo } from "react";
import { 
  X, ChevronLeft, Sparkles, Camera, Briefcase, Shield, 
  Clock, DollarSign, Calendar, Mail, Phone, CheckCircle, 
  Plus, Check, Info, Users, HelpCircle 
} from "lucide-react";
import "./WorkerWizardMobile.css";

const PRESET_CARGOS = [
  "Estilista",
  "Colorista",
  "Barbero",
  "Recepcionista",
  "Gerente",
  "Asistente",
  "Masajista",
  "Odontólogo",
  "Psicólogo"
];

const PRESET_SPECIALTIES = [
  "Corte",
  "Color",
  "Balayage",
  "Manicura",
  "Pedicura",
  "Depilación",
  "Tratamientos",
  "Barbería",
  "Estética Facial"
];

const ROLES_LIST = [
  { key: "professional", name: "Profesional", desc: "Ver su propia agenda y fichas técnicas de clientes." },
  { key: "reception", name: "Recepción", desc: "Agendar turnos, registrar cobros y base de datos." },
  { key: "manager", name: "Manager (Gerente)", desc: "Gestión operativa, personal, agendas y reportes." },
  { key: "admin", name: "Admin (Administrador)", desc: "Administración global sin acceso al cambio de dueño." }
];

export default function WorkerWizardMobile({ form }) {
  const {
    isEdit,
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
    handleToggleSpecialty,
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
    handleSave,
    saving,
    error,
    success
  } = form;

  const [stepIndex, setStepIndex] = useState(0); // 0=Intro, 1..6=Steps, 7=Review
  const [obsText, setObsText] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [customSpecs, setCustomSpecs] = useState([]);
  
  // Custom access permissions
  const [accessLevel, setAccessLevel] = useState("limitado"); // completo | limitado | personalizado
  const [modules, setModules] = useState({
    agenda: true,
    clientes: true,
    caja: false,
    reportes: false,
    inventario: false
  });

  const currentFullName = useMemo(() => {
    return `${firstName} ${lastName}`.trim();
  }, [firstName, lastName]);

  const handleFullNameChange = (val) => {
    const parts = val.trimStart().split(" ");
    const fn = parts[0] || "";
    const ln = parts.slice(1).join(" ") || "";
    setFirstName(fn);
    setLastName(ln);
  };

  const handleToggleModule = (m) => {
    setModules(prev => ({
      ...prev,
      [m]: !prev[m]
    }));
  };

  const handleToggleService = (id) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddCustomSpec = () => {
    const trimmed = searchSpec.trim();
    if (trimmed && !PRESET_SPECIALTIES.includes(trimmed) && !customSpecs.includes(trimmed)) {
      setCustomSpecs(prev => [...prev, trimmed]);
      handleToggleSpecialty(trimmed);
      setSearchSpec("");
    }
  };

  const handleDayToggle = (idx) => {
    setSchedules(prev => prev.map((s, i) => {
      if (i === idx) return { ...s, active: !s.active };
      return s;
    }));
  };

  const handleTimeChange = (idx, field, val) => {
    setSchedules(prev => prev.map((s, i) => {
      if (i === idx) return { ...s, [field]: val };
      return s;
    }));
  };

  // Stepper steps titles
  const stepsList = [
    "Información General",
    "Cargo y Rol",
    "Especialidades",
    "Horarios Semanales",
    "Comisiones",
    "Acceso al Sistema"
  ];

  // Validation rules for steps
  const isStepValid = () => {
    if (stepIndex === 1) {
      return firstName.trim() !== "" && phone.trim() !== "";
    }
    if (stepIndex === 2) {
      return cargo !== "";
    }
    if (stepIndex === 5) {
      return String(commissionServices).trim() !== "";
    }
    return true;
  };

  const nextStep = () => {
    if (isStepValid()) {
      setStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStepIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="worker-wizard">
      {/* TopBar */}
      {stepIndex > 0 && (
        <div className="w-topbar">
          <button className="w-icon-btn" onClick={prevStep} aria-label="Atrás">
            <ChevronLeft size={20} />
          </button>
          <span className="w-topbar__center">
            {stepIndex === 7 ? "Revisión final" : `Paso ${stepIndex} de 6`}
          </span>
          <button className="w-icon-btn" onClick={form.onHide} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
      )}

      {/* PANTALLA 0 — Intro */}
      {stepIndex === 0 && (
        <div>
          <div className="w-intro-head">
            <h2>
              <Sparkles size={20} className="text-purple-600" />
              <span>Nuevo Colaborador</span>
            </h2>
            <button className="w-icon-btn" onClick={form.onHide} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
          
          <div className="w-step-title" style={{ textAlign: "left", padding: "10px 16px 20px" }}>
            <p style={{ margin: 0 }}>Completa los pasos para crear el perfil.</p>
          </div>

          <div className="w-body" style={{ paddingBottom: "100px" }}>
            {/* Stepper vertical numerado */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              {stepsList.map((stepName, idx) => (
                <div key={idx} className={`w-vstep ${idx === 0 ? "w-vstep--active" : ""}`}>
                  <span className="w-vstep__num">{idx + 1}</span>
                  <span className="w-vstep__label">{stepName}</span>
                </div>
              ))}
            </div>

            {/* Info Box lila */}
            <div className="w-info" style={{ marginBottom: "20px" }}>
              <Info size={16} />
              <span>Podrás editar esta información cuando lo necesites.</span>
            </div>

            {/* CTA */}
            <button className="w-cta" onClick={() => setStepIndex(1)}>
              Comenzar
            </button>
          </div>
        </div>
      )}

      {/* PASO 1 — Información General */}
      {stepIndex === 1 && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="w-step-title">
            <h2>Información General</h2>
            <p>Datos básicos del colaborador</p>
          </div>

          <div className="w-body">
            {/* Photo Uploader */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              {photo ? (
                <div className="w-photo" style={{ overflow: "hidden" }}>
                  <img src={photo} alt="Vista previa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div className="w-photo">
                  <Camera size={32} />
                </div>
              )}
              <button 
                type="button" 
                className="w-photo-label"
                onClick={() => {
                  const url = window.prompt("Introduce la URL de la foto de perfil:", photo);
                  if (url !== null) setPhoto(url);
                }}
                style={{ background: "none", border: 0, outline: "none" }}
              >
                Agregar foto
              </button>
            </div>

            {/* Fields */}
            <div className="w-field">
              <label>Nombre completo <span className="req">*</span></label>
              <input 
                type="text" 
                placeholder="Ej: Valentina Pérez" 
                value={currentFullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
              />
            </div>

            <div className="w-field">
              <label>Teléfono <span className="req">*</span></label>
              <div className="w-phone">
                <select style={{ background: "#fff" }}>
                  <option value="+54">+54</option>
                  <option value="+1">+1</option>
                  <option value="+34">+34</option>
                  <option value="+56">+56</option>
                </select>
                <input 
                  type="tel" 
                  placeholder="11 1234-5678" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="w-field">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="ej: valentina@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="w-field">
              <label>Fecha de nacimiento</label>
              <input 
                type="date" 
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>

            <div className="w-field">
              <label>Estado</label>
              <div className="w-segment">
                <button 
                  type="button"
                  className={`w-segment__btn ${status === "Activo" ? "w-segment__btn--on" : ""}`}
                  onClick={() => setStatus("Activo")}
                >
                  Activo
                </button>
                <button 
                  type="button"
                  className={`w-segment__btn ${status === "Inactivo" ? "w-segment__btn--on" : ""}`}
                  onClick={() => setStatus("Inactivo")}
                >
                  Inactivo
                </button>
              </div>
            </div>

            <button className="w-cta" onClick={nextStep} disabled={!isStepValid()}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 2 — Cargo y Rol */}
      {stepIndex === 2 && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="w-step-title">
            <h2>Cargo y Rol</h2>
            <p>Define su posición y rol en el salón</p>
          </div>

          <div className="w-body">
            <div className="w-field">
              <label>Cargo <span className="req">*</span></label>
              <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
                <option value="">Seleccionar cargo</option>
                {PRESET_CARGOS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="w-field">
              <label>Rol en el sistema <span className="req">*</span></label>
              {ROLES_LIST.map(r => (
                <div 
                  key={r.key} 
                  className={`w-radio ${role === r.key ? "w-radio--active" : ""}`}
                  onClick={() => setRole(r.key)}
                >
                  <div className="w-radio__icon">
                    <Shield size={16} />
                  </div>
                  <div className="w-radio__body">
                    <div className="w-radio__title">{r.name}</div>
                    <div className="w-radio__desc">{r.desc}</div>
                  </div>
                  <span className="w-radio__mark" />
                </div>
              ))}
            </div>

            <div className="w-field">
              <label>Observaciones (opcional)</label>
              <textarea 
                placeholder="Ej: Encargada de turno tarde" 
                maxLength={120}
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
              />
              <div style={{ fontSize: "11px", color: "var(--w-muted)", textAlign: "right", marginTop: "4px" }}>
                {obsText.length}/120
              </div>
            </div>

            <button className="w-cta" onClick={nextStep} disabled={!isStepValid()}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 3 — Especialidades */}
      {stepIndex === 3 && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="w-step-title">
            <h2>Especialidades</h2>
            <p>Selecciona en qué servicios se especializa</p>
          </div>

          <div className="w-body">
            <div className="w-field" style={{ marginBottom: "12px" }}>
              <div className="w-phone" style={{ gap: "6px" }}>
                <input 
                  type="text" 
                  placeholder="Buscar especialidad..." 
                  value={searchSpec}
                  onChange={(e) => setSearchSpec(e.target.value)}
                  style={{ padding: "10px" }}
                />
                <button 
                  type="button" 
                  onClick={handleAddCustomSpec}
                  style={{
                    backgroundColor: "var(--w-purple)",
                    color: "#fff",
                    border: 0,
                    borderRadius: "10px",
                    width: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Specialties checklists */}
            <div style={{ marginBottom: "20px" }}>
              {PRESET_SPECIALTIES.concat(customSpecs).map((spec) => {
                const isChecked = selectedSpecialties.includes(spec);
                return (
                  <div 
                    key={spec} 
                    className="w-check"
                    onClick={() => handleToggleSpecialty(spec)}
                  >
                    <div className={`w-check__box ${isChecked ? "w-check__box--on" : ""}`}>
                      {isChecked && <Check size={14} />}
                    </div>
                    <span className="w-check__label">{spec}</span>
                  </div>
                );
              })}
            </div>

            {/* Associated backend services */}
            {servicesList.length > 0 && (
              <div className="w-field">
                <label>Servicios habilitados</label>
                <div style={{ border: "1px solid var(--w-border)", borderRadius: "12px", padding: "10px", backgroundColor: "#fff" }}>
                  {servicesList.map(svc => {
                    const isChecked = selectedServiceIds.includes(svc.id);
                    return (
                      <div 
                        key={svc.id} 
                        className="w-check"
                        onClick={() => handleToggleService(svc.id)}
                      >
                        <div className={`w-check__box ${isChecked ? "w-check__box--on" : ""}`}>
                          {isChecked && <Check size={14} />}
                        </div>
                        <span className="w-check__label" style={{ fontSize: "13px" }}>{svc.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button className="w-cta" onClick={nextStep} disabled={!isStepValid()}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 4 — Horarios Semanales */}
      {stepIndex === 4 && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="w-step-title">
            <h2>Horarios Semanales</h2>
            <p>Define los días y horarios disponibles</p>
          </div>

          <div className="w-body">
            {/* Days schedules list */}
            <div style={{ marginBottom: "20px" }}>
              {schedules.map((s, idx) => {
                const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
                return (
                  <div key={s.dayOfWeek} className={`w-day ${!s.active ? "w-day--off" : ""}`}>
                    <span className="w-day__name">{dayNames[idx]}</span>
                    
                    {/* Toggle activation switch */}
                    <button 
                      type="button" 
                      className={`w-switch ${s.active ? "w-switch--on" : ""}`}
                      onClick={() => handleDayToggle(idx)}
                    />
                    
                    {s.active ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                        <input 
                          type="text" 
                          value={s.startTime}
                          onChange={(e) => handleTimeChange(idx, "startTime", e.target.value)}
                          className="w-day__time"
                          style={{ padding: "8px 4px" }}
                        />
                        <span className="w-day__sep">–</span>
                        <input 
                          type="text" 
                          value={s.endTime}
                          onChange={(e) => handleTimeChange(idx, "endTime", e.target.value)}
                          className="w-day__time"
                          style={{ padding: "8px 4px" }}
                        />
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                        <div className="w-day__time">–</div>
                        <span className="w-day__sep">–</span>
                        <div className="w-day__time">–</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button className="w-cta" onClick={nextStep} disabled={!isStepValid()}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 5 — Comisiones */}
      {stepIndex === 5 && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="w-step-title">
            <h2>Comisiones</h2>
            <p>Configura el tipo y valor de comisión</p>
          </div>

          <div className="w-body">
            <div className="w-field">
              <label>Tipo de comisión <span className="req">*</span></label>
              <select value={commissionType} onChange={(e) => setCommissionType(e.target.value)}>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
                <option value="mixto">Esquema Mixto</option>
              </select>
            </div>

            <div className="w-field">
              <label>Valor de comisión <span className="req">*</span></label>
              <div className="w-suffix">
                <input 
                  type="number" 
                  value={commissionServices}
                  onChange={(e) => setCommissionServices(Number(e.target.value))}
                />
                <span>{commissionType === "fijo" ? "$" : "%"}</span>
              </div>
            </div>

            {/* Info Box dinámica */}
            <div className="w-info" style={{ marginBottom: "18px" }}>
              <Info size={16} />
              <span>
                El profesional recibirá el <b>{commissionServices}{commissionType === "fijo" ? "$" : "%"}</b> del precio de cada servicio que realice.
              </span>
            </div>

            <div className="w-field">
              <label>Base de cálculo</label>
              <select>
                <option value="final">Precio final del servicio</option>
                <option value="neto">Neto sin impuestos</option>
              </select>
            </div>

            <div className="w-field">
              <label>Pago de comisiones</label>
              <select>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>

            <button className="w-cta" onClick={nextStep} disabled={!isStepValid()}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 6 — Acceso al Sistema */}
      {stepIndex === 6 && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="w-step-title">
            <h2>Acceso al Sistema</h2>
            <p>Configura sus permisos y acceso</p>
          </div>

          <div className="w-body">
            <div className="w-field">
              <label>Permisos</label>
              
              <div 
                className={`w-radio ${accessLevel === "completo" ? "w-radio--active" : ""}`}
                onClick={() => setAccessLevel("completo")}
              >
                <div className="w-radio__icon">
                  <Shield size={16} />
                </div>
                <div className="w-radio__body">
                  <div className="w-radio__title">Acceso completo</div>
                  <div className="w-radio__desc">Puede gestionar todo en el sistema.</div>
                </div>
                <span className="w-radio__mark" />
              </div>

              <div 
                className={`w-radio ${accessLevel === "limitado" ? "w-radio--active" : ""}`}
                onClick={() => setAccessLevel("limitado")}
              >
                <div className="w-radio__icon">
                  <Shield size={16} />
                </div>
                <div className="w-radio__body">
                  <div className="w-radio__title">Acceso limitado</div>
                  <div className="w-radio__desc">Accede a lo esencial para su rol.</div>
                </div>
                <span className="w-radio__mark" />
              </div>

              <div 
                className={`w-radio ${accessLevel === "personalizado" ? "w-radio--active" : ""}`}
                onClick={() => setAccessLevel("personalizado")}
              >
                <div className="w-radio__icon">
                  <Shield size={16} />
                </div>
                <div className="w-radio__body">
                  <div className="w-radio__title">Personalizado</div>
                  <div className="w-radio__desc">Configura permisos específicos.</div>
                </div>
                <span className="w-radio__mark" />
              </div>
            </div>

            <div className="w-field">
              <label>Acceso a módulos</label>
              {Object.keys(modules).map((key) => (
                <div 
                  key={key} 
                  className="w-check"
                  onClick={() => handleToggleModule(key)}
                >
                  <div className={`w-check__box ${modules[key] ? "w-check__box--on" : ""}`}>
                    {modules[key] && <Check size={14} />}
                  </div>
                  <span className="w-check__label" style={{ textTransform: "capitalize" }}>{key}</span>
                </div>
              ))}
            </div>

            <button className="w-cta" onClick={() => setStepIndex(7)}>
              Revisar y crear
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA 7 — Revisar y Crear */}
      {stepIndex === 7 && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="w-step-title">
            <h2>Revisar y Crear</h2>
            <p>Verifica la información antes de crear</p>
          </div>

          <div className="w-body">
            {error && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", padding: "12px", borderRadius: "12px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>
                {error}
              </div>
            )}
            
            <div className="w-review-card">
              {/* Review header */}
              <div className="w-review-head">
                {photo ? (
                  <img src={photo} alt={currentFullName} />
                ) : (
                  <div className="w-ph" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "var(--w-purple)" }}>
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="w-review-name">{currentFullName}</div>
                  <div className="w-review-badges">
                    <span className="w-badge w-badge--role">{cargo || "Profesional"}</span>
                    <span className="w-badge w-badge--status">{status}</span>
                  </div>
                </div>
              </div>

              {/* Review rows */}
              <div className="w-review-row">
                <Phone size={16} />
                <span className="w-review-row__label">Teléfono</span>
                <span className="w-review-row__val">{phone}</span>
              </div>

              <div className="w-review-row">
                <Mail size={16} />
                <span className="w-review-row__label">Email</span>
                <span className="w-review-row__val">{email || "—"}</span>
              </div>

              <div className="w-review-row">
                <Briefcase size={16} />
                <span className="w-review-row__label">Cargo</span>
                <span className="w-review-row__val">{cargo}</span>
              </div>

              <div className="w-review-row">
                <Sparkles size={16} />
                <span className="w-review-row__label">Especialidades</span>
                <span className="w-review-row__val" style={{ maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedSpecialties.join(", ") || "Ninguna"}
                </span>
              </div>

              <div className="w-review-row">
                <Clock size={16} />
                <span className="w-review-row__label">Horario</span>
                <span className="w-review-row__val">
                  {schedules.filter(s => s.active).length} días activos
                </span>
              </div>

              <div className="w-review-row">
                <DollarSign size={16} />
                <span className="w-review-row__label">Comisión</span>
                <span className="w-review-row__val">
                  {commissionServices}{commissionType === "fijo" ? "$" : "%"} sobre precio final
                </span>
              </div>

              <div className="w-review-row">
                <Shield size={16} />
                <span className="w-review-row__label">Acceso</span>
                <span className="w-review-row__val" style={{ textTransform: "capitalize" }}>
                  Acceso {accessLevel}
                </span>
              </div>
            </div>

            <button className="w-cta" onClick={handleSave} disabled={saving}>
              {saving ? "Creando..." : "✓ Crear colaborador"}
            </button>

            <button className="w-volver" onClick={() => setStepIndex(6)}>
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
