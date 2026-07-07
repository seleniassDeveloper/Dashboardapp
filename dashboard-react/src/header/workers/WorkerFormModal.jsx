import React, { useEffect, useState, useMemo } from "react";
import { Modal, Row, Col, Form, Button, Alert, Spinner, Badge, Table, InputGroup, Card } from "react-bootstrap";
import { User, Mail, Phone, Calendar, Briefcase, Shield, Sparkles, Clock, DollarSign, Settings, CheckCircle, HelpCircle, Save } from "lucide-react";
import api from "../../lib/api.js";
import { useFormSchema } from "../../hooks/useFormSchema.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useWorkerForm } from "../../hooks/useWorkerForm.js";
import WorkerWizardMobile from "./mobile/WorkerWizardMobile.jsx";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function getRoleName(roleKey) {
  switch (String(roleKey).toLowerCase()) {
    case "owner":
      return "Owner";
    case "admin":
      return "Administrador";
    case "manager":
      return "Manager";
    case "professional":
      return "Profesional";
    case "reception":
      return "Recepción";
    case "viewer":
      return "Visualizador";
    default:
      return "Profesional";
  }
}


// Lista de Cargos predefinidos
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

// Lista de Roles de seguridad
const PRESET_ROLES = [
  { key: "owner", name: "Owner (Dueño)", desc: "Control total, finanzas y auditorías del salón." },
  { key: "admin", name: "Admin (Administrador)", desc: "Administración global sin acceso al cambio de dueño." },
  { key: "manager", name: "Manager (Gerente)", desc: "Gestión operativa, personal, agendas y reportes básicos." },
  { key: "professional", name: "Profesional", desc: "Ver su propia agenda, fichas técnicas de clientes y evolucionar." },
  { key: "reception", name: "Recepción", desc: "Agendar turnos, registrar cobros y base de datos de clientes." },
  { key: "viewer", name: "Viewer (Auditor)", desc: "Acceso de solo lectura para reportería y controles." }
];

// Especialidades chips
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

// Matriz de permisos por rol para el Tab 6
const PERMISSIONS_MATRIX = {
  owner: ["Agenda: Control Total", "Clientes: Ficha CRM y Privada", "Personal: Comisiones y Contratos", "Finanzas: Cierre de Caja y ERP", "Configuración: Módulos y Logins", "AI Copilot: Analíticas e Insights"],
  admin: ["Agenda: Control Total", "Clientes: Ficha CRM y Privada", "Personal: Horarios y Cargos", "Finanzas: Cierre de Caja", "Configuración: Módulos", "AI Copilot: Analíticas"],
  manager: ["Agenda: Control Total", "Clientes: Ficha CRM y Privada", "Personal: Horarios", "Finanzas: Solo Lectura", "AI Copilot: Analíticas"],
  professional: ["Agenda: Solo Citas Propias", "Clientes: Ficha CRM / Fórmulas Técnicas", "Personal: Solo Consulta", "Finanzas: Bloqueado"],
  reception: ["Agenda: Crear y Modificar", "Clientes: Crear y Consultar", "Personal: Horarios", "Finanzas: Registrar Transacción"],
  viewer: ["Agenda: Solo Lectura", "Clientes: Solo Lectura", "Personal: Solo Lectura", "Finanzas: Solo Lectura"]
};

export default function WorkerFormModal({
  show,
  onHide,
  mode = "create",
  initialData = null,
  onSaved,
}) {
  const isMobile = useIsMobile();
  const form = useWorkerForm({ show, mode, initialData, onSaved, onHide });

  const {
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
  } = form;

  if (isMobile) {
    return (
      <Modal show={show} onHide={onHide} fullscreen style={{ padding: 0 }}>
        <WorkerWizardMobile form={form} />
      </Modal>
    );
  }

  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onHide}
      centered
      size="xl"
      backdrop="static"
      keyboard={!saving}
      dialogClassName="worker-modal-1000px border-0 shadow-lg"
    >
      <Modal.Header closeButton={!saving} className="bg-light border-0 py-3.5 px-4 rounded-top">
        <Modal.Title className="fw-black text-gray-900 d-flex align-items-center gap-2">
          <Sparkles className="text-purple-600 animate-pulse" size={22} />
          <span>{isEdit ? `Configuración de Perfil: ${firstName} ${lastName}` : "Crear Perfil Profesional SaaS Enterprise"}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0 bg-white rounded-bottom" style={{ minHeight: "560px" }}>
        {schemaError && <Alert variant="warning" className="m-3.5 border-0 shadow-sm rounded-xl">{schemaError}</Alert>}
        {error && <Alert variant="danger" className="m-3.5 border-0 shadow-sm rounded-xl">{error}</Alert>}
        {success && <Alert variant="success" className="m-3.5 border-0 shadow-sm rounded-xl">{success}</Alert>}

        {schemaLoading ? (
          <div className="text-center py-5" style={{ minHeight: "560px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2 small">Cargando configuración de formulario…</p>
          </div>
        ) : (
          <Row className="g-0">
          {/* Navegación lateral izquierda para TABS (Estilo SaaS Enterprise) */}
          <Col md={3} className="bg-gray-50 border-end p-3 d-flex flex-column gap-1.5" style={{ minHeight: "560px" }}>
            <button
              onClick={() => setActiveTab("general")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "general" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-200"
              }`}
            >
              <User size={18} />
              <span>Info General</span>
            </button>
            <button
              onClick={() => setActiveTab("cargo_rol")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "cargo_rol" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-200"
              }`}
            >
              <Briefcase size={18} />
              <span>Cargo y Rol</span>
            </button>
            {isServicesEnabled && (
              <button
                onClick={() => setActiveTab("specialties")}
                className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                  activeTab === "specialties" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-200"
                }`}
              >
                <Sparkles size={18} />
                <span>Especialidades</span>
              </button>
            )}
            {isScheduleEnabled && (
              <button
                onClick={() => setActiveTab("schedules")}
                className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                  activeTab === "schedules" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-200"
                }`}
              >
                <Clock size={18} />
                <span>Horarios Semanales</span>
              </button>
            )}
            {isServicePricingEnabled && (
              <button
                onClick={() => setActiveTab("commissions")}
                className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                  activeTab === "commissions" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-200"
                }`}
              >
                <DollarSign size={18} />
                <span>Comisiones</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab("access")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "access" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-200"
              }`}
            >
              <Shield size={18} />
              <span>Acceso al Sistema</span>
            </button>
          </Col>

          {/* Área de Contenido de Pestañas */}
          <Col md={9} className="p-4 bg-white rounded-bottom d-flex flex-column justify-content-between">
            <div style={{ minHeight: "440px" }}>
              
              {/* TAB 1: INFORMACIÓN GENERAL */}
              {activeTab === "general" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Información General del Colaborador</h3>
                  <Row className="g-3">
                    {generalTabFields.map((field) => {
                      if (field.id === "firstName") {
                        return (
                          <Col md={6} key="firstName">
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted">
                                {field.label || "Nombre"}{" "}
                                {field.required && "*"}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                required={field.required}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Ej: Andrea"
                                className="rounded-xl border-gray-200"
                              />
                            </Form.Group>
                          </Col>
                        );
                      }

                      if (field.id === "lastName") {
                        return (
                          <Col md={6} key="lastName">
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted">
                                {field.label || "Apellido"}{" "}
                                {field.required && "*"}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                required={field.required}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Ej: Paez"
                                className="rounded-xl border-gray-200"
                              />
                            </Form.Group>
                          </Col>
                        );
                      }

                      if (field.id === "email") {
                        return (
                          <Col md={6} key="email">
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted">
                                {field.label || "Correo Electrónico"}{" "}
                                {field.required && "*"}
                              </Form.Label>
                              <Form.Control
                                type="email"
                                required={field.required}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Ej: andrea@salon.com"
                                className="rounded-xl border-gray-200"
                              />
                            </Form.Group>
                          </Col>
                        );
                      }

                      if (field.id === "phone") {
                        return (
                          <Col md={6} key="phone">
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted">
                                {field.label || "Teléfono de Contacto"}{" "}
                                {field.required && "*"}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                required={field.required}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Ej: +54 9 11 2345 6789"
                                className="rounded-xl border-gray-200"
                              />
                            </Form.Group>
                          </Col>
                        );
                      }

                      // Custom Field
                      const label = (
                        <>
                          {field.label}
                          {field.required ? " *" : ""}
                        </>
                      );
                      
                      const commonProps = {
                        value: customFieldValues[field.id] ?? "",
                        onChange: (e) => handleCustomFieldChange(field.id, e.target.value),
                        placeholder: field.placeholder || "",
                        className: "rounded-xl border-gray-200"
                      };

                      let control;
                      if (field.type === "textarea") {
                        control = <Form.Control as="textarea" rows={2} {...commonProps} />;
                      } else if (field.type === "select") {
                        control = (
                          <Form.Select {...commonProps}>
                            <option value="">Seleccionar…</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Form.Select>
                        );
                      } else if (field.type === "email") {
                        control = <Form.Control type="email" {...commonProps} />;
                      } else if (field.type === "phone") {
                        control = <Form.Control type="tel" {...commonProps} />;
                      } else if (field.type === "number" || field.type === "currency") {
                        control = <Form.Control type="number" {...commonProps} />;
                      } else {
                        control = <Form.Control type="text" {...commonProps} />;
                      }

                      return (
                        <Col md={field.type === "textarea" ? 12 : 6} key={field.id}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-muted">{label}</Form.Label>
                            {control}
                          </Form.Group>
                        </Col>
                      );
                    })}

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Fecha de Ingreso</Form.Label>
                        <Form.Control
                          type="date"
                          value={entryDate}
                          onChange={(e) => setEntryDate(e.target.value)}
                          className="rounded-xl border-gray-200"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Estado del Colaborador</Form.Label>
                        <Form.Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="rounded-xl border-gray-200"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Vacaciones">En Vacaciones</option>
                          <option value="Licencia">Licencia Laboral</option>
                          <option value="Suspendido">Suspendido</option>
                          <option value="Inactivo">Inactivo / Baja</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">URL Foto de Perfil (Opcional)</Form.Label>
                        <Form.Control
                          type="text"
                          value={photo}
                          onChange={(e) => setPhoto(e.target.value)}
                          placeholder="Ej: https://mi-salón.com/avatars/andrea.jpg"
                          className="rounded-xl border-gray-200"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 2: CARGO Y ROL */}
              {activeTab === "cargo_rol" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Definición de Cargo y Permisos de Sistema</h3>
                  <p className="text-muted smaller">El <strong>Cargo</strong> define la ocupación laboral del colaborador, mientras que el <strong>Rol</strong> define sus credenciales de seguridad en el software.</p>
                  
                  <Row className="g-4 mt-1">
                    {isRoleTitleEnabled && (
                      <Col md={6}>
                        <Card className="border p-3.5 rounded-2xl bg-light h-100">
                          <Form.Group>
                            <Form.Label className="fw-black text-gray-900 d-flex align-items-center gap-1.5 mb-2.5">
                              <Briefcase size={16} className="text-pink-500" />
                              <span>{enabledFields.find(f => f.id === "roleTitle")?.label || "Cargo (Función Laboral)"} {enabledFields.find(f => f.id === "roleTitle")?.required && "*"}</span>
                            </Form.Label>
                            <Form.Select
                              value={cargo}
                              onChange={(e) => setCargo(e.target.value)}
                              className="rounded-xl border-gray-200 focus-ring-purple"
                            >
                              {PRESET_CARGOS.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <div className="mt-3 text-muted small">
                            Aparecerá en el portal de reserva online y en las fichas para los clientes.
                          </div>
                        </Card>
                      </Col>
                    )}

                    <Col md={isRoleTitleEnabled ? 6 : 12}>
                      <Card className="border p-3.5 rounded-2xl bg-light h-100">
                        <Form.Group>
                          <Form.Label className="fw-black text-gray-900 d-flex align-items-center gap-1.5 mb-2.5">
                            <Shield size={16} className="text-purple-600" />
                            <span>Rol de Seguridad (Permisos)</span>
                          </Form.Label>
                          <Form.Select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="rounded-xl border-gray-200 focus-ring-purple"
                          >
                            {PRESET_ROLES.map(r => (
                              <option key={r.key} value={r.key}>{r.name}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                        <div className="mt-3 small text-purple-700 fw-medium bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                          ℹ️ {PRESET_ROLES.find(r => r.key === role)?.desc}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 3: ESPECIALIDADES */}
              {activeTab === "specialties" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Especialidades & Servicios Calificados</h3>
                  <p className="text-muted smaller">Seleccioná los chips de especialidades en los que trabaja este colaborador y asignale los servicios correspondientes.</p>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-xs text-muted block mb-2">Especialidades (Visual Chips)</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {PRESET_SPECIALTIES.map(spec => {
                        const active = selectedSpecialties.includes(spec);
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => handleToggleSpecialty(spec)}
                            className={`px-3.5 py-1.5 rounded-pill border fw-bold text-xs transition-all ${
                              active 
                                ? "bg-pink-600 border-pink-600 text-white shadow-sm" 
                                : "bg-light border-gray-200 text-muted hover-bg-gray-200"
                            }`}
                          >
                            {spec}
                          </button>
                        );
                      })}
                    </div>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="fw-bold text-xs text-muted block mb-2">Asociar Servicios Técnicos Específicos</Form.Label>
                    <div className="border rounded-2xl p-3 bg-gray-50 bg-opacity-50 overflow-auto" style={{ maxHeight: "220px" }}>
                      <Row className="g-2">
                        {servicesList.map(service => {
                          const checked = selectedServiceIds.includes(service.id);
                          return (
                            <Col md={6} key={service.id}>
                              <Form.Check
                                type="checkbox"
                                id={`service-${service.id}`}
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedServiceIds(prev => 
                                    e.target.checked ? [...prev, service.id] : prev.filter(id => id !== service.id)
                                  );
                                }}
                                label={
                                  <span className="small text-gray-800 fw-semibold">
                                    {service.name} <span className="text-muted font-normal">({service.duration} min / ${service.price})</span>
                                  </span>
                                }
                                className="custom-checkbox"
                              />
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  </Form.Group>
                </div>
              )}

              {/* TAB 4: HORARIOS */}
              {activeTab === "schedules" && (
                <div className="animate-fade-in">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3 flex-wrap gap-2">
                    <h3 className="h6 fw-black text-gray-900 m-0">Planificación Horaria Semanal</h3>
                    <Button 
                      variant="outline-purple" 
                      size="sm" 
                      onClick={handleCopySchedule}
                      className="py-1 px-3 rounded-xl fw-bold text-xs d-flex align-items-center gap-1.5"
                    >
                      <Clock size={13} />
                      <span>Copiar horario de Lunes a la semana</span>
                    </Button>
                  </div>
                  
                  <div className="overflow-auto border rounded-2xl bg-white shadow-inner scrollbar-none" style={{ maxHeight: "330px" }}>
                    <Table borderless className="align-middle mb-0 text-center text-xs">
                      <thead>
                        <tr className="bg-light text-muted border-bottom" style={{ fontSize: "10.5px" }}>
                          <th className="py-2">Habilitar</th>
                          <th>Día</th>
                          <th>Entrada</th>
                          <th>Salida</th>
                          <th>Inicio Descanso</th>
                          <th>Fin Descanso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s, idx) => {
                          const daysArr = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
                          return (
                            <tr key={s.dayOfWeek} className={s.active ? "border-bottom bg-white" : "border-bottom bg-gray-50 opacity-60"}>
                              <td className="py-2.5 ps-3">
                                <Form.Check
                                  type="switch"
                                  id={`active-${s.dayOfWeek}`}
                                  checked={s.active}
                                  onChange={(e) => {
                                    setSchedules(prev => prev.map(item => 
                                      item.dayOfWeek === s.dayOfWeek ? { ...item, active: e.target.checked } : item
                                    ));
                                  }}
                                  className="custom-switch"
                                />
                              </td>
                              <td className="fw-bold text-gray-800">{daysArr[s.dayOfWeek]}</td>
                              <td>
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  disabled={!s.active}
                                  value={s.startTime}
                                  onChange={(e) => {
                                    setSchedules(prev => prev.map(item => 
                                      item.dayOfWeek === s.dayOfWeek ? { ...item, startTime: e.target.value } : item
                                    ));
                                  }}
                                  className="form-control-xs rounded-lg text-center"
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  disabled={!s.active}
                                  value={s.endTime}
                                  onChange={(e) => {
                                    setSchedules(prev => prev.map(item => 
                                      item.dayOfWeek === s.dayOfWeek ? { ...item, endTime: e.target.value } : item
                                    ));
                                  }}
                                  className="form-control-xs rounded-lg text-center"
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  disabled={!s.active}
                                  value={s.breakStartTime}
                                  onChange={(e) => {
                                    setSchedules(prev => prev.map(item => 
                                      item.dayOfWeek === s.dayOfWeek ? { ...item, breakStartTime: e.target.value } : item
                                    ));
                                  }}
                                  className="form-control-xs rounded-lg text-center"
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="text"
                                  size="sm"
                                  disabled={!s.active}
                                  value={s.breakEndTime}
                                  onChange={(e) => {
                                    setSchedules(prev => prev.map(item => 
                                      item.dayOfWeek === s.dayOfWeek ? { ...item, breakEndTime: e.target.value } : item
                                    ));
                                  }}
                                  className="form-control-xs rounded-lg text-center"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              {/* TAB 5: COMISIONES */}
              {activeTab === "commissions" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Estructura de Comisiones y Objetivos</h3>
                  
                  <Row className="g-4">
                    {/* Campos de Configuración */}
                    <Col md={7}>
                      <Row className="g-3">
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-muted">Tipo de Liquidación</Form.Label>
                            <Form.Select
                              value={commissionType}
                              onChange={(e) => setCommissionType(e.target.value)}
                              className="rounded-xl border-gray-200 focus-ring-purple"
                            >
                              <option value="porcentaje">Porcentaje de Facturación (%)</option>
                              <option value="fijo">Sueldo Fijo por Turno ($)</option>
                              <option value="mixto">Mixto (Fijo Base + Porcentaje Reducido)</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-muted">Comisión por Servicios</Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="number"
                                value={commissionServices}
                                onChange={(e) => setCommissionServices(Number(e.target.value))}
                                className="rounded-xl border-gray-200"
                              />
                              <InputGroup.Text className="bg-light rounded-e-xl border-gray-200 fw-bold">{commissionType === "porcentaje" ? "%" : "$"}</InputGroup.Text>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-muted">Comisión por Productos</Form.Label>
                            <InputGroup>
                              <Form.Control
                                type="number"
                                value={commissionProducts}
                                onChange={(e) => setCommissionProducts(Number(e.target.value))}
                                className="rounded-xl border-gray-200"
                              />
                              <InputGroup.Text className="bg-light rounded-e-xl border-gray-200 fw-bold">%</InputGroup.Text>
                            </InputGroup>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-muted">Objetivo de Facturación Mensual</Form.Label>
                            <InputGroup>
                              <InputGroup.Text className="bg-light border-gray-200">$</InputGroup.Text>
                              <Form.Control
                                type="number"
                                value={monthlyTarget}
                                onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                                className="rounded-xl border-gray-200"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-muted">Bono de Cumplimiento Mensual</Form.Label>
                            <InputGroup>
                              <InputGroup.Text className="bg-light border-gray-200">$</InputGroup.Text>
                              <Form.Control
                                type="number"
                                value={monthlyBonus}
                                onChange={(e) => setMonthlyBonus(Number(e.target.value))}
                                className="rounded-xl border-gray-200"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Col>

                    {/* Simulador Interactivo */}
                    <Col md={5}>
                      <Card className="border p-3.5 rounded-2xl bg-purple-50 bg-opacity-40 h-100 shadow-sm d-flex flex-column justify-content-between">
                        <div>
                          <h4 className="h6 fw-black text-purple-950 mb-3 d-flex align-items-center gap-1.5">
                            <Sparkles size={16} className="text-purple-600 animate-pulse" />
                            <span>Simulador de Comisiones</span>
                          </h4>
                          
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-bold text-xxs text-purple-700 block mb-1 text-uppercase tracking-wider">Facturación Ejemplo</Form.Label>
                            <InputGroup size="sm">
                              <InputGroup.Text className="bg-white border-purple-200 font-monospace text-purple-800">$</InputGroup.Text>
                              <Form.Control
                                type="number"
                                value={simulatedRevenue}
                                onChange={(e) => setSimulatedRevenue(Number(e.target.value))}
                                className="border-purple-200 rounded-xl"
                              />
                            </InputGroup>
                            <Form.Range
                              min={100000}
                              max={3000000}
                              step={50000}
                              value={simulatedRevenue}
                              onChange={(e) => setSimulatedRevenue(Number(e.target.value))}
                              className="mt-2.5 accent-purple"
                            />
                          </Form.Group>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-inner">
                          <div className="d-flex justify-content-between small text-muted border-bottom pb-1.5 mb-1.5">
                            <span>Comisión Servicios ({commissionServices}{commissionType === "porcentaje" ? "%" : "$"}):</span>
                            <span className="fw-bold text-gray-900">{currency(simulatedOutcome.commission)}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between small text-muted border-bottom pb-1.5 mb-1.5">
                            <span>Bono por Objetivo ({monthlyBonus ? currency(monthlyBonus) : "$0"}):</span>
                            <span className={`fw-bold ${simulatedOutcome.achievedTarget ? "text-success" : "text-muted"}`}>
                              {simulatedOutcome.achievedTarget ? `+ ${currency(monthlyBonus)}` : "$0 (No alcanzado)"}
                            </span>
                          </div>

                          <div className="d-flex justify-content-between fw-black align-items-baseline text-purple-950 mt-2">
                            <span style={{ fontSize: "12px" }}>Ganancia Estimada:</span>
                            <span style={{ fontSize: "16px" }} className="text-purple-700">{currency(simulatedOutcome.finalEarnings)}</span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 6: ACCESO AL SISTEMA */}
              {activeTab === "access" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Permisos Efectivos e Identidad de Red</h3>
                  
                  <Row className="g-4">
                    <Col md={6}>
                      <Card className="border p-3.5 rounded-2xl bg-light h-100">
                        <div className="mb-3.5">
                          <small className="text-muted block text-uppercase tracking-wider text-xxs fw-bold">Rol de Acceso Seleccionado</small>
                          <div className="h5 fw-black text-purple-700 m-0 mt-0.5">{getRoleName(role)}</div>
                        </div>

                        <div className="mb-3.5">
                          <small className="text-muted block text-uppercase tracking-wider text-xxs fw-bold">Último Acceso al Dashboard</small>
                          <div className="small fw-semibold text-gray-800 m-0 mt-0.5">{initialData?.lastAccess || "Nunca ha ingresado"}</div>
                        </div>

                        <div>
                          <small className="text-muted block text-uppercase tracking-wider text-xxs fw-bold">Acceso a las Sucursales</small>
                          <div className="small fw-semibold text-gray-800 m-0 mt-0.5">Todas las Sucursales Activas</div>
                        </div>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card className="border p-3.5 rounded-2xl bg-white h-100">
                        <h4 className="fw-bold text-gray-900 mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: "13px" }}>
                          <CheckCircle size={15} className="text-emerald-500" />
                          <span>Permisos Efectivos</span>
                        </h4>
                        
                        <ul className="list-unstyled d-grid gap-1.5 mb-3" style={{ maxHeight: "170px", overflow: "auto" }}>
                          {activePermissions.map((perm, idx) => (
                            <li key={idx} className="small text-gray-700 d-flex align-items-center gap-2">
                              <span className="rounded-circle bg-emerald-100" style={{ width: "6px", height: "6px" }} />
                              <span>{perm}</span>
                            </li>
                          ))}
                        </ul>

                        <Button 
                          variant="purple" 
                          size="sm" 
                          className="w-100 py-2 rounded-xl fw-bold text-xs bg-purple-600 hover-bg-purple-700 text-white"
                          onClick={() => setShowMatrix(true)}
                        >
                          Ver Matriz Completa de Permisos
                        </Button>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

            </div>

            {/* Footer del Formulario */}
            <div className="d-flex justify-content-end gap-2 border-top pt-3.5">
              <Button variant="outline-secondary" onClick={onHide} disabled={saving} className="rounded-xl px-4 py-2 text-xs fw-bold">
                Cancelar
              </Button>
              <Button 
                variant="dark" 
                onClick={handleSave} 
                disabled={saving} 
                className="rounded-xl px-4 py-2.5 text-xs fw-bold d-flex align-items-center gap-2 shadow bg-purple-600 hover-bg-purple-700 text-white border-0"
                style={{ backgroundColor: "#9333ea" }}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" animation="border" className="text-white" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>{isEdit ? "Guardar Cambios" : "Agregar Colaborador"}</span>
                  </>
                )}
              </Button>
            </div>
          </Col>
        </Row>
        )}
      </Modal.Body>

      {/* MODAL / POPUP DE LA MATRIZ DE PERMISOS */}
      <Modal
        show={showMatrix}
        onHide={() => setShowMatrix(false)}
        centered
        size="lg"
        dialogClassName="permissions-matrix-modal"
      >
        <Modal.Header closeButton className="bg-light py-3 px-4 border-0">
          <Modal.Title className="fw-black text-gray-900 h6 m-0 d-flex align-items-center gap-2">
            <Shield size={16} className="text-purple-600" />
            <span>Matriz Detallada de Permisos por Rol</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Table responsive bordered hover className="align-middle mb-0 text-center text-xs">
            <thead>
              <tr className="bg-light text-muted" style={{ fontSize: "10.5px" }}>
                <th className="text-start py-2.5">Funcionalidad / Módulo</th>
                <th>Owner</th>
                <th>Admin</th>
                <th>Manager</th>
                <th>Profesional</th>
                <th>Recepción</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "12px" }}>
              <tr className="border-bottom">
                <td className="text-start fw-bold text-gray-800 py-2.5">Agenda / Turnos (Ver, agendar, cancelar)</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-warning fw-semibold">Propio</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-muted">—</td>
              </tr>
              <tr className="border-bottom">
                <td className="text-start fw-bold text-gray-800 py-2.5">Clientes y Fichas (Ver, crear, editar)</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-muted">Ver</td>
              </tr>
              <tr className="border-bottom">
                <td className="text-start fw-bold text-gray-800 py-2.5">Personal y Staff (Crear, sueldos, comisiones)</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-warning fw-semibold">Básico</td>
                <td className="text-warning fw-semibold">Horarios</td>
                <td className="text-muted">—</td>
                <td className="text-muted">—</td>
                <td className="text-muted">—</td>
              </tr>
              <tr className="border-bottom">
                <td className="text-start fw-bold text-gray-800 py-2.5">Finanzas ERP (Facturar, gastos, conciliación)</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-muted">Ver</td>
                <td className="text-muted">—</td>
                <td className="text-warning fw-semibold">Cobros</td>
                <td className="text-muted">Ver</td>
              </tr>
              <tr className="border-bottom">
                <td className="text-start fw-bold text-gray-800 py-2.5">AI Copilot (Insights analíticos de negocio)</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-success fw-bold">✓</td>
                <td className="text-muted">—</td>
                <td className="text-muted">—</td>
                <td className="text-muted">—</td>
              </tr>
            </tbody>
          </Table>
          <div className="mt-3 small text-muted bg-blue-50 p-2.5 rounded-xl border border-blue-100">
            💡 <strong>Nota sobre la Seguridad:</strong> La asignación de roles a nivel de red e inicio de sesión de Firebase se hereda en tiempo de ejecución al guardar estos cambios en la base de datos de Dashboard Aura.
          </div>
        </Modal.Body>
      </Modal>
    </Modal>
  );
}
