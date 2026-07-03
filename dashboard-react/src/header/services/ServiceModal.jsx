import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Row, Col, Form, Button, Alert, Spinner, Badge, Table, InputGroup, Card } from "react-bootstrap";
import { User, Mail, Phone, Calendar, Briefcase, Shield, Sparkles, Clock, DollarSign, Settings, CheckCircle, HelpCircle, Save, Plus, Trash2, Package, Info } from "lucide-react";
import { useAppointmentsStore } from "../../gadgets/appointments/AppointmentsProvider.jsx";
import api from "../../lib/api.js";

import { useBusinessModel } from "../../hooks/useBusinessModel.js";

// Colores identificadores predefinidos
const PRESET_COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6b7280"  // Gray
];

export default function ServiceModal({ show, onHide, editService = null }) {
  const store = useAppointmentsStore?.();
  const refreshAll = store?.fetchServices;
  const { serviceCategories, terms } = useBusinessModel();

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // TAB 1: INFORMACIÓN BÁSICA
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!category && serviceCategories && serviceCategories.length > 0) {
      setCategory(serviceCategories[0]);
    }
  }, [serviceCategories, category]);
  const [status, setStatus] = useState("active");
  const [availableOnline, setAvailableOnline] = useState(true);
  const [color, setColor] = useState("#10b981");

  // TAB 2: PRECIO Y DURACIÓN
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [preparationMinutes, setPreparationMinutes] = useState("0");
  const [cleanupMinutes, setCleanupMinutes] = useState("0");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // TAB 3: PROFESIONALES ASIGNADOS
  const [availabilityMode, setAvailabilityMode] = useState("all"); // "all" | "selected"
  const [workersList, setWorkersList] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);

  // TAB 4: COMISIONES
  const [commissionType, setCommissionType] = useState("porcentaje"); // "porcentaje" | "fijo" | "ninguno"
  const [commissionValue, setCommissionValue] = useState("0");

  // TAB 5: RESERVAS ONLINE
  const [requiresApproval, setRequiresApproval] = useState(false);

  // TAB 6: INVENTARIO ASOCIADO
  const [productsList, setProductsList] = useState([]);
  const [associatedItems, setAssociatedItems] = useState([]); // Array of { productId, quantity }

  const isEditing = Boolean(editService && editService.id);
  const isDuplicating = Boolean(editService && !editService.id);

  // Cargar catálogos y profesionales
  useEffect(() => {
    if (show) {
      // Cargar colaboradores
      api.get("/workers")
        .then(res => setWorkersList(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Error loading workers:", err));

      // Cargar productos de inventario
      api.get("/inventory/products")
        .then(res => setProductsList(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Error loading products:", err));
    }
  }, [show]);

  // Setup form fields on mount or change
  useEffect(() => {
    if (!show) return;
    setError("");
    setSuccess("");
    setActiveTab("general");

    if (editService) {
      setName(editService.name || "");
      setDescription(editService.description || "");
      setCategory(editService.category || "Estilismo");
      setStatus(editService.status === "inactive" ? "inactive" : "active");
      setAvailableOnline(editService.availableOnline !== undefined ? editService.availableOnline : editService.status !== "hidden_online");
      setColor(editService.color || "#10b981");

      setPrice(editService.price || "");
      setDuration(editService.duration || "30");
      setPreparationMinutes(editService.preparationMinutes || "0");
      setCleanupMinutes(editService.cleanupMinutes || "0");
      setDepositRequired(editService.depositRequired || false);
      setDepositAmount(editService.depositAmount || "");

      const wIds = editService.workers ? editService.workers.map(w => w.workerId) : [];
      setSelectedWorkerIds(wIds);
      setAvailabilityMode(wIds.length === 0 ? "all" : "selected");

      setCommissionType(editService.commissionType || "porcentaje");
      setCommissionValue(editService.commissionValue || "0");

      setRequiresApproval(editService.requiresApproval || false);

      const items = editService.consumptionRules ? editService.consumptionRules.map(r => ({
        productId: r.productId,
        quantity: r.quantity
      })) : [];
      setAssociatedItems(items);
    } else {
      setName("");
      setDescription("");
      setCategory("Estilismo");
      setStatus("active");
      setAvailableOnline(true);
      setColor("#10b981");

      setPrice("");
      setDuration("30");
      setPreparationMinutes("0");
      setCleanupMinutes("0");
      setDepositRequired(false);
      setDepositAmount("");

      setSelectedWorkerIds([]);
      setAvailabilityMode("all");

      setCommissionType("porcentaje");
      setCommissionValue("40");

      setRequiresApproval(false);
      setAssociatedItems([]);
    }
  }, [show, editService]);

  // Validaciones comerciales reactivas
  const valid = useMemo(() => {
    const p = Number(String(price).replace(",", "."));
    const d = Number(duration);
    const dep = Number(depositAmount);
    const cVal = Number(commissionValue);

    if (!name.trim()) return false;
    if (!category.trim()) return false;
    if (!Number.isFinite(p) || p < 0) return false;
    if (!Number.isFinite(d) || d <= 0) return false;

    if (depositRequired) {
      if (!Number.isFinite(dep) || dep <= 0 || dep > p) return false;
    }

    if (commissionType === "porcentaje") {
      if (!Number.isFinite(cVal) || cVal < 0 || cVal > 100) return false;
    } else if (commissionType === "fijo") {
      if (!Number.isFinite(cVal) || cVal < 0) return false;
    }

    if (availabilityMode === "selected" && selectedWorkerIds.length === 0) return false;

    return true;
  }, [name, category, price, duration, depositRequired, depositAmount, commissionType, commissionValue, availabilityMode, selectedWorkerIds]);

  // Manejar adición de insumo consumido
  const handleAddAssociatedItem = () => {
    const firstProduct = productsList[0];
    if (!firstProduct) return;
    setAssociatedItems(prev => [...prev, { productId: firstProduct.id, quantity: 10 }]);
  };

  const handleUpdateAssociatedItem = (idx, field, val) => {
    setAssociatedItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, [field]: val };
    }));
  };

  const handleRemoveAssociatedItem = (idx) => {
    setAssociatedItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Guardar Servicio
  const handleSave = async () => {
    try {
      setError("");
      setSuccess("");

      if (!valid) {
        setError("Por favor, verifica que todos los campos requeridos y numéricos sean válidos.");
        return;
      }

      setSaving(true);
      const parsedPrice = Number(String(price).replace(",", "."));
      const parsedDuration = Number(duration);
      const parsedPrep = Number(preparationMinutes);
      const parsedCleanup = Number(cleanupMinutes);
      const parsedDeposit = depositRequired ? Number(depositAmount) : 0;
      const parsedCommValue = commissionType !== "ninguno" ? Number(commissionValue) : 0;

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim(),
        price: Math.round(parsedPrice),
        duration: Math.round(parsedDuration),
        preparationMinutes: Math.round(parsedPrep),
        cleanupMinutes: Math.round(parsedCleanup),
        depositRequired,
        depositAmount: Math.round(parsedDeposit),
        color,
        status,
        availableOnline,
        requiresApproval,
        commissionType,
        commissionValue: Math.round(parsedCommValue),
        workerIds: availabilityMode === "all" ? [] : selectedWorkerIds,
        inventoryItems: associatedItems.map(item => ({
          productId: item.productId,
          quantity: Math.round(Number(item.quantity))
        }))
      };

      if (isEditing) {
        await api.put(`/services/${editService.id}`, payload);
      } else {
        await api.post(`/services`, payload);
      }

      setSuccess("¡Servicio guardado con éxito!");
      if (typeof refreshAll === "function") refreshAll();
      setTimeout(() => {
        onHide?.();
      }, 1000);
    } catch (e) {
      console.error("Error saving service:", e);
      setError(e?.response?.data?.error || "Ocurrió un error al registrar el servicio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onHide}
      centered
      size="xl"
      backdrop="static"
      keyboard={!saving}
      dialogClassName="hegemonic-modal service-form-modal border-0 shadow-lg"
    >
      <Modal.Header closeButton={!saving} className="border-0 py-3.5 px-4 rounded-top" style={{ background: "rgba(248, 250, 252, 0.9)", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>
        <Modal.Title className="fw-black text-gray-900 d-flex align-items-center gap-2">
          <Sparkles className="text-purple-600 animate-pulse" size={22} />
          <span style={{ fontSize: "1.15rem" }}>{isEditing ? `Editar ${terms?.service?.s || "Servicio"}: ${name}` : isDuplicating ? `Duplicar ${terms?.service?.s || "Servicio"}: ${name}` : `Crear ${terms?.service?.s || "Servicio"} Comercial`}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0 bg-white rounded-bottom" style={{ minHeight: "560px" }}>
        {error && <Alert variant="danger" className="m-3.5 border-0 shadow-sm rounded-xl">{error}</Alert>}
        {success && <Alert variant="success" className="m-3.5 border-0 shadow-sm rounded-xl">{success}</Alert>}

        <Row className="g-0">
          {/* Menú lateral izquierdo */}
          <Col md={3} className="p-3.5 d-flex flex-column gap-2" style={{ backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0", minHeight: "560px", borderBottomLeftRadius: "24px" }}>
            <button
              onClick={() => setActiveTab("general")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "general" ? "text-white" : "bg-transparent text-muted hover-bg-purple-50"
              }`}
              style={activeTab === "general" ? { background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)" } : {}}
            >
              <Info size={18} />
              <span>Info Básica</span>
            </button>
            
            <button
              onClick={() => setActiveTab("pricing")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "pricing" ? "text-white" : "bg-transparent text-muted hover-bg-purple-50"
              }`}
              style={activeTab === "pricing" ? { background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)" } : {}}
            >
              <Clock size={18} />
              <span>Precios y Tiempos</span>
            </button>

            <button
              onClick={() => setActiveTab("professionals")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "professionals" ? "text-white" : "bg-transparent text-muted hover-bg-purple-50"
              }`}
              style={activeTab === "professionals" ? { background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)" } : {}}
            >
              <User size={18} />
              <span>{terms?.professional?.p || "Profesionales"}</span>
            </button>

            <button
              onClick={() => setActiveTab("commissions")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "commissions" ? "text-white" : "bg-transparent text-muted hover-bg-purple-50"
              }`}
              style={activeTab === "commissions" ? { background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)" } : {}}
            >
              <DollarSign size={18} />
              <span>{terms?.commission?.p || "Comisiones"}</span>
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`d-flex align-items-center gap-3 w-100 px-3 py-2.5 rounded-xl border-0 text-start fw-bold transition-all ${
                activeTab === "inventory" ? "text-white" : "bg-transparent text-muted hover-bg-purple-50"
              }`}
              style={activeTab === "inventory" ? { background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)" } : {}}
            >
              <Package size={18} />
              <span>{terms?.product?.p || "Insumos"} y Fórmulas</span>
            </button>
          </Col>

          {/* Área de contenido de pestañas */}
          <Col md={9} className="p-4 bg-white rounded-bottom d-flex flex-column justify-content-between">
            <div style={{ minHeight: "440px" }}>
              
              {/* TAB 1: INFORMACIÓN BÁSICA */}
              {activeTab === "general" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Información de ${terms?.service?.s || "Servicio"}</h3>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Nombre de ${terms?.service?.s || "Servicio"} *</Form.Label>
                        <Form.Control
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej: Balayage Premium, Profilaxis Dental..."
                          className="modern-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">{terms?.category?.s || "Categoría"} *</Form.Label>
                        <Form.Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="modern-input"
                        >
                          {serviceCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Estado Inicial</Form.Label>
                        <Form.Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="modern-input"
                        >
                          <option value="active">Activo (Disponible en sistema)</option>
                          <option value="inactive">Inactivo / Desactivado</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Card className="border p-3.5 rounded-2xl bg-light mt-1 mb-2">
                        <Form.Check
                          type="switch"
                          id="available-online-switch"
                          label={
                            <div>
                              <span className="fw-bold text-gray-800 smaller block">Disponible para Reservas Online</span>
                              <span className="text-muted" style={{fontSize: "11px"}}>Si está activo, se podrá agendar en línea desde tu página web pública de reservas.</span>
                            </div>
                          }
                          checked={availableOnline}
                          onChange={(e) => setAvailableOnline(e.target.checked)}
                          className="custom-switch"
                        />
                      </Card>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Descripción</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Breve reseña que verán los usuarios al agendar en línea."
                          className="modern-input"
                        />
                      </Form.Group>
                    </Col>
                    
                    {/* Picker de Color */}
                    <Col md={12}>
                      <Form.Group className="mt-2">
                        <Form.Label className="fw-semibold text-xs text-muted block mb-2">Color Identificador en Agenda</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setColor(c)}
                              className="rounded-circle border-0 cursor-pointer transition-all hover-scale"
                              style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: c,
                                border: color === c ? "3.5px solid #000" : "none",
                                transform: color === c ? "scale(1.15)" : "none"
                              }}
                            />
                          ))}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 2: PRECIOS Y DURACIÓN */}
              {activeTab === "pricing" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Precios y Tiempos de Reserva</h3>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Precio Base ($) *</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-gray-200 font-monospace fw-bold">$</InputGroup.Text>
                          <Form.Control
                            type="text"
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Ej: 15000"
                            className="modern-input font-monospace fw-bold text-purple-950"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Duración (Minutos) *</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number"
                            required
                            min={1}
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="modern-input font-monospace fw-bold"
                          />
                          <InputGroup.Text className="bg-light border-gray-200 text-xs font-semibold">minutos</InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Tiempo de Preparación previo (Opcional)</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number"
                            min={0}
                            value={preparationMinutes}
                            onChange={(e) => setPreparationMinutes(e.target.value)}
                            className="modern-input font-monospace"
                          />
                          <InputGroup.Text className="bg-light border-gray-200 text-xs">minutos</InputGroup.Text>
                        </InputGroup>
                        <Form.Text className="text-muted smaller">Bloquea la agenda del profesional antes de la cita.</Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold text-xs text-muted">Tiempo de Limpieza posterior (Opcional)</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="number"
                            min={0}
                            value={cleanupMinutes}
                            onChange={(e) => setCleanupMinutes(e.target.value)}
                            className="modern-input font-monospace"
                          />
                          <InputGroup.Text className="bg-light border-gray-200 text-xs">minutos</InputGroup.Text>
                        </InputGroup>
                        <Form.Text className="text-muted smaller">Bloquea la agenda después de la cita para esterilización o descanso.</Form.Text>
                      </Form.Group>
                    </Col>

                    {/* Reglas de Seña */}
                    <Col md={12} className="mt-4 border-top pt-3">
                      <Card className="border p-3.5 rounded-2xl bg-light">
                        <Form.Check
                          type="switch"
                          id="deposit-required-switch"
                          label={<span className="fw-bold text-gray-800 smaller">Requiere cobro de Seña / Pago a cuenta en reservas online</span>}
                          checked={depositRequired}
                          onChange={(e) => {
                            setDepositRequired(e.target.checked);
                            if (e.target.checked && !depositAmount) {
                              // Sugerir 30% del precio base por defecto
                              const suggested = Math.round(Number(price || 0) * 0.3);
                              setDepositAmount(suggested > 0 ? String(suggested) : "");
                            }
                          }}
                          className="custom-switch mb-3"
                        />
                        
                        {depositRequired && (
                          <Row className="g-2 animate-fade-in">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label className="fw-semibold text-xs text-muted">Monto de la Seña ($) *</Form.Label>
                                <InputGroup size="sm">
                                  <InputGroup.Text className="bg-white border-purple-200 font-monospace text-purple-900">$</InputGroup.Text>
                                  <Form.Control
                                    type="text"
                                    required
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="Ej: 4500"
                                    className="modern-input font-monospace text-purple-800"
                                  />
                                </InputGroup>
                                <Form.Text className="text-purple-700 smaller">Debe ser menor o igual al precio total.</Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* TAB 3: PROFESIONALES ASIGNADOS */}
              {activeTab === "professionals" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Asignación de {terms?.professional?.p || "Profesionales"}</h3>
                  <p className="text-muted smaller">Define qué {terms?.team?.p.toLowerCase() || "colaboradores"} están habilitados para realizar este trabajo en la sucursal.</p>
                  
                  <Form.Group className="mb-4 bg-light p-3 rounded-2xl border border-gray-100">
                    <Form.Check
                      type="radio"
                      id="avail-all"
                      name="availabilityMode"
                      label={<span className="fw-bold text-gray-800 small">Disponible para todos los {terms?.professional?.p.toLowerCase() || "profesionales"} (Predeterminado)</span>}
                      checked={availabilityMode === "all"}
                      onChange={() => setAvailabilityMode("all")}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      id="avail-selected"
                      name="availabilityMode"
                      label={<span className="fw-bold text-gray-800 small">Solo {terms?.professional?.p.toLowerCase() || "profesionales"} seleccionados</span>}
                      checked={availabilityMode === "selected"}
                      onChange={() => setAvailabilityMode("selected")}
                    />
                  </Form.Group>

                  {availabilityMode === "selected" && (
                    <Form.Group className="animate-fade-in">
                      <Form.Label className="fw-bold text-xs text-muted block mb-2.5">Listado de Profesionales Habilitados *</Form.Label>
                      <div className="border rounded-2xl p-3 bg-gray-50 overflow-auto" style={{ maxHeight: "240px" }}>
                        <Row className="g-2.5">
                          {workersList.map(worker => {
                            const isChecked = selectedWorkerIds.includes(worker.id);
                            return (
                              <Col md={6} key={worker.id}>
                                <Form.Check
                                  type="checkbox"
                                  id={`worker-${worker.id}`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    setSelectedWorkerIds(prev => 
                                      e.target.checked 
                                        ? [...prev, worker.id] 
                                        : prev.filter(id => id !== worker.id)
                                    );
                                  }}
                                  label={
                                    <span className="small text-gray-800 fw-semibold">
                                      {worker.firstName} {worker.lastName} <span className="text-muted font-normal">({worker.roleTitle || "Profesional"})</span>
                                    </span>
                                  }
                                  className="custom-checkbox"
                                />
                              </Col>
                            );
                          })}
                          {workersList.length === 0 && (
                            <div className="text-center text-muted py-3 smaller italic">No hay colaboradores registrados en el sistema.</div>
                          )}
                        </Row>
                      </div>
                    </Form.Group>
                  )}
                </div>
              )}

              {/* TAB 4: COMISIONES */}
              {activeTab === "commissions" && (
                <div className="animate-fade-in">
                  <h3 className="h6 fw-black text-gray-900 border-bottom pb-2 mb-3">Estructura Comercial de Comisiones</h3>
                  <p className="text-muted smaller">Configura la retribución que recibirá el colaborador al concretar la venta de este servicio técnico.</p>
                  
                  <Row className="g-4">
                    <Col md={7}>
                      <Row className="g-3">
                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-xs text-muted">Tipo de Liquidación de Comisión</Form.Label>
                            <Form.Select
                              value={commissionType}
                              onChange={(e) => {
                                setCommissionType(e.target.value);
                                if (e.target.value === "porcentaje" && Number(commissionValue) > 100) {
                                  setCommissionValue("40");
                                }
                              }}
                              className="modern-input"
                            >
                              <option value="porcentaje">Porcentaje de Facturación (%)</option>
                              <option value="fijo">Sueldo Fijo / Comisión Base ($)</option>
                              <option value="ninguno">Sin Comisión</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
 
                        {commissionType !== "ninguno" && (
                          <Col md={8}>
                            <Form.Group className="animate-fade-in">
                              <Form.Label className="fw-semibold text-xs text-muted">Valor de Comisión *</Form.Label>
                              <InputGroup>
                                <Form.Control
                                  type="number"
                                  min={0}
                                  value={commissionValue}
                                  onChange={(e) => setCommissionValue(e.target.value)}
                                  className="modern-input font-monospace fw-bold"
                                />
                                <InputGroup.Text className="bg-light border-gray-200 fw-bold">
                                  {commissionType === "porcentaje" ? "%" : "$"}
                                </InputGroup.Text>
                              </InputGroup>
                            </Form.Group>
                          </Col>
                        )}
                      </Row>
                    </Col>

                    {commissionType !== "ninguno" && (
                      <Col md={5}>
                        <Card className="border border-purple-100 p-3.5 rounded-2xl bg-purple-50 bg-opacity-35 shadow-inner">
                          <h4 className="fw-black text-purple-950 mb-2" style={{ fontSize: "12.5px" }}>Vista Previa en Liquidación</h4>
                          <p className="smaller text-purple-800 mb-3">Cálculo estimado basado en el precio base del servicio ({price ? `$${price}` : "$0"}):</p>
                          <div className="bg-white p-3 rounded-xl border border-purple-100 text-center">
                            <small className="text-muted text-xxs uppercase block tracking-wider fw-bold">Colaborador Cobrará</small>
                            <span className="h3 fw-black text-purple-700 block mt-1">
                              {commissionType === "porcentaje" 
                                ? `$${Math.round(Number(price || 0) * (Number(commissionValue || 0) / 100))}` 
                                : `$${commissionValue || 0}`}
                            </span>
                          </div>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </div>
              )}

              {/* TAB 6: INVENTARIO ASOCIADO */}
              {activeTab === "inventory" && (
                <div className="animate-fade-in">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h3 className="h6 fw-black text-gray-900 m-0">Insumos y Fórmulas de Consumo Técnico</h3>
                    <Button 
                      variant="outline-purple" 
                      size="sm" 
                      onClick={handleAddAssociatedItem}
                      className="py-1 px-3 rounded-xl fw-bold text-xs d-flex align-items-center gap-1.5"
                    >
                      <Plus size={13} />
                      <span>Agregar {terms?.product?.s || "Insumo"}</span>
                    </Button>
                  </div>
                  <p className="text-muted smaller">Vincula {terms?.product?.p.toLowerCase() || "insumos"} de tu inventario a esta {terms?.service?.s.toLowerCase() || "servicio"}.</p>

                  <div className="border rounded-2xl p-3 bg-gray-50 overflow-auto" style={{ maxHeight: "260px" }}>
                    <Table borderless responsive className="mb-0 text-xs">
                      <thead>
                        <tr className="text-muted text-start" style={{ fontSize: "10.5px" }}>
                          <th style={{ width: "55%" }}>{terms?.product?.s || "Producto"} / Insumo</th>
                          <th style={{ width: "30%" }}>Cantidad Consumida</th>
                          <th style={{ width: "15%" }} className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {associatedItems.map((item, idx) => {
                          const matchedProduct = productsList.find(p => p.id === item.productId);
                          const unitLabel = matchedProduct ? matchedProduct.unit : "unidad";

                          return (
                            <tr key={idx} className="border-bottom bg-white rounded-xl">
                              <td className="py-2.5">
                                <Form.Select
                                  value={item.productId}
                                  onChange={(e) => handleUpdateAssociatedItem(idx, "productId", e.target.value)}
                                  className="form-control-xs rounded-xl"
                                >
                                  {productsList.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                  ))}
                                </Form.Select>
                              </td>
                              <td className="py-2.5">
                                <InputGroup size="sm">
                                  <Form.Control
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateAssociatedItem(idx, "quantity", e.target.value)}
                                    className="form-control-xs font-monospace text-center rounded-l-xl"
                                  />
                                  <InputGroup.Text className="bg-light text-xxs font-bold rounded-r-xl border-gray-200">{unitLabel}</InputGroup.Text>
                                </InputGroup>
                              </td>
                              <td className="py-2.5 text-end">
                                <Button 
                                  variant="light" 
                                  size="sm" 
                                  className="p-1.5 border border-red-100 hover-bg-red-50"
                                  onClick={() => handleRemoveAssociatedItem(idx)}
                                >
                                  <Trash2 size={14} className="text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {associatedItems.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center py-4 text-muted small italic">
                              Sin insumos asignados. No se descontará stock automáticamente.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer de Acciones del Formulario */}
            <div className="d-flex justify-content-end gap-2 border-top pt-3.5">
              <Button variant="outline-secondary" onClick={onHide} disabled={saving} className="rounded-xl px-4 py-2 text-xs fw-bold">
                Cancelar
              </Button>
              <Button 
                variant="dark" 
                onClick={handleSave} 
                disabled={!valid || saving} 
                className="rounded-xl px-4 py-2.5 text-xs fw-bold d-flex align-items-center gap-2 shadow border-0"
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
                    <span>{isEditing ? "Guardar Cambios" : `Agregar ${terms?.service?.s || "Servicio"}`}</span>
                  </>
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
}