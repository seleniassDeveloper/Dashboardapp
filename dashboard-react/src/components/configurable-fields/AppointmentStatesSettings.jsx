import React, { useEffect, useState } from "react";
import { Card, Form, Button, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { Plus, Trash2, Edit2, Check, X, ShieldAlert, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";

import { useBusinessModel } from "../../hooks/useBusinessModel.js";

export default function AppointmentStatesSettings() {
  const { t, i18n } = useTranslation("views");
  const { appointmentStatuses } = useBusinessModel();
  const isEs = i18n.language === "es";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [business, setBusiness] = useState(null);
  const [statuses, setStatuses] = useState([]);
  
  // Form state for adding/editing a status
  const [editingKey, setEditingKey] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/appointments/business");
      if (res.data) {
        setBusiness(res.data);
        const savedStatuses = res.data.appointmentStatuses;
        if (savedStatuses && Array.isArray(savedStatuses) && savedStatuses.length > 0) {
          setStatuses(savedStatuses);
        } else {
          setStatuses(appointmentStatuses);
        }
      }
    } catch (e) {
      console.error(e);
      setError(isEs ? "Error al cargar la configuración del negocio." : "Error loading business configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusiness();
  }, []);

  const handleAddStatus = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const key = newLabel
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_");

    if (statuses.some(s => s.key === key)) {
      setError(isEs ? "Ya existe un estado con esta clave o nombre." : "A status with this name already exists.");
      return;
    }

    const newStatus = {
      key,
      label: newLabel.trim(),
      color: newColor
    };

    setStatuses([...statuses, newStatus]);
    setNewLabel("");
    setNewColor("#3b82f6");
    setError("");
  };

  const handleDeleteStatus = (keyToDelete) => {
    // Prevent deleting core statuses
    if (["CANCELLED", "DONE", "IN_PROGRESS", "PENDING_PAYMENT"].includes(keyToDelete)) {
      setError(isEs ? "No puedes eliminar los estados nucleares del sistema (Cancelada, Finalizada, En Curso, Por Cobrar)." : "You cannot delete system core statuses.");
      return;
    }
    setStatuses(statuses.filter(s => s.key !== keyToDelete));
  };

  const startEdit = (status) => {
    setEditingKey(status.key);
    setNewLabel(status.label);
    setNewColor(status.color);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setNewLabel("");
    setNewColor("#3b82f6");
  };

  const handleSaveEdit = () => {
    if (!newLabel.trim()) return;
    setStatuses(statuses.map(s => {
      if (s.key === editingKey) {
        return { ...s, label: newLabel.trim(), color: newColor };
      }
      return s;
    }));
    setEditingKey(null);
    setNewLabel("");
    setNewColor("#3b82f6");
  };

  const handleSaveToDb = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const res = await api.put("/appointments/business", {
        name: business.name,
        slug: business.slug,
        appointmentStatuses: statuses
      });

      setBusiness(res.data);
      setSuccess(isEs ? "¡Estados de cita actualizados con éxito!" : "Appointment statuses updated successfully!");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || (isEs ? "Error al guardar los estados." : "Error saving statuses."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner size="sm" className="me-2" />
        <span>{isEs ? "Cargando configuración de estados…" : "Loading states configuration..."}</span>
      </div>
    );
  }

  return (
    <Card className="card-premium border bg-white p-4 rounded-2xl shadow-sm">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h5 fw-black text-gray-900 m-0 d-flex align-items-center gap-2">
            <Sparkles className="text-purple-600 animate-pulse" size={20} />
            {isEs ? "Estados de Citas del Workflow" : "Workflow Appointment States"}
          </h2>
          <p className="text-muted smaller mb-0 mt-0.5">
            {isEs 
              ? "Configura las etapas por las que transita un turno en tu negocio y mide los tiempos del embudo." 
              : "Configure the stages an appointment transitions through and measure funnel timings."}
          </p>
        </div>
        
        <Button 
          variant="purple" 
          onClick={handleSaveToDb} 
          disabled={saving}
          className="rounded-xl px-4 py-2 border-0 text-white bg-purple-600 hover-bg-purple-700 btn-purple fw-bold shadow-sm"
        >
          {saving ? (isEs ? "Guardando..." : "Saving...") : (isEs ? "Guardar Cambios" : "Save Changes")}
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")} className="rounded-xl small">{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")} className="rounded-xl small">{success}</Alert>}

      <Row className="g-4">
        {/* LEFT PANEL: CURRENT STATUSES LIST */}
        <Col lg={7}>
          <div className="border rounded-2xl p-3 bg-light bg-opacity-35">
            <span className="smaller text-muted fw-bold d-block mb-3 px-1">
              {isEs ? "FLUJO DE ESTADOS OPERATIVOS" : "OPERATIONAL STATES FLOW"}
            </span>

            <div className="d-flex flex-column gap-2">
              {statuses.map((status, index) => {
                const isCore = ["CANCELLED", "DONE"].includes(status.key);
                const isEditingThis = editingKey === status.key;

                return (
                  <div 
                    key={status.key} 
                    className="bg-white border rounded-xl p-3 d-flex align-items-center justify-content-between transition-all hover-row-focus"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <span className="text-muted small font-mono">#{index + 1}</span>
                      <span 
                        className="rounded-circle d-inline-block" 
                        style={{ width: "14px", height: "14px", backgroundColor: status.color }}
                      />
                      <div>
                        <strong className="text-gray-900 small">{status.label}</strong>
                        <span className="text-muted d-block font-mono" style={{ fontSize: "9.5px" }}>{status.key}</span>
                      </div>
                    </div>

                    <div className="d-flex gap-1">
                      {isEditingThis ? (
                        <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2.5 py-1.5 small">
                          {isEs ? "Editando" : "Editing"}
                        </Badge>
                      ) : (
                        <>
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="p-1.5 border rounded-lg hover-bg-gray-100"
                            onClick={() => startEdit(status)}
                            title={isEs ? "Editar" : "Edit"}
                          >
                            <Edit2 size={12} className="text-secondary" />
                          </Button>
                          {!isCore && (
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="p-1.5 border rounded-lg text-danger hover-bg-red-50"
                              onClick={() => handleDeleteStatus(status.key)}
                              title={isEs ? "Eliminar" : "Delete"}
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        {/* RIGHT PANEL: ADD OR EDIT FORM */}
        <Col lg={5}>
          <div className="border rounded-2xl p-4 bg-white shadow-sm">
            <span className="smaller text-purple-700 fw-bold d-block mb-3">
              {editingKey 
                ? (isEs ? "✏️ EDITAR ESTADO" : "✏️ EDIT STATE") 
                : (isEs ? "⚡ AGREGAR NUEVO ESTADO" : "⚡ ADD NEW STATE")}
            </span>

            <Form onSubmit={editingKey ? (e) => e.preventDefault() : handleAddStatus} className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">{isEs ? "Nombre del Estado *" : "State Label *"}</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder={isEs ? "Ej: En Tratamiento" : "e.g. In Treatment"}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="rounded-xl border-gray-200 small"
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">{isEs ? "Color Visual *" : "Visual Color *"}</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="border-0 p-0 rounded-circle"
                    style={{ width: "38px", height: "38px", cursor: "pointer" }}
                  />
                  <Form.Control
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="rounded-xl border-gray-200 small font-mono"
                    style={{ width: "110px" }}
                  />
                </div>
              </Form.Group>

              <div className="d-flex gap-2 pt-2">
                {editingKey ? (
                  <>
                    <Button 
                      variant="purple" 
                      onClick={handleSaveEdit} 
                      className="rounded-xl px-3 py-1.8 border-0 text-white bg-purple-600 hover-bg-purple-700 btn-purple fw-bold small flex-grow-1"
                    >
                      <Check size={14} className="me-1" />
                      {isEs ? "Aplicar" : "Apply"}
                    </Button>
                    <Button 
                      variant="light" 
                      onClick={cancelEdit} 
                      className="rounded-xl px-3 py-1.8 border small"
                    >
                      <X size={14} />
                    </Button>
                  </>
                ) : (
                  <Button 
                    type="submit"
                    variant="purple" 
                    className="rounded-xl px-3 py-2 border-0 text-white bg-purple-600 hover-bg-purple-700 btn-purple fw-bold small w-100"
                  >
                    <Plus size={14} className="me-1" />
                    {isEs ? "Agregar Estado" : "Add State"}
                  </Button>
                )}
              </div>
            </Form>

            <div className="mt-4 p-3 bg-light bg-opacity-50 rounded-xl border d-flex gap-2 align-items-start">
              <ShieldAlert className="text-amber-500 flex-shrink-0" size={16} />
              <div className="smaller text-muted" style={{ fontSize: "11px", lineHeight: "1.4" }}>
                <strong>{isEs ? "Sugerencia de Flujo:" : "Flow Recommendation:"}</strong><br />
                {isEs 
                  ? "Para flujos automatizados de consentimientos, se sugiere tener estados intermedios como 'Esperando Firma' y 'Firmado' para ordenar el trabajo."
                  : "For automated consent flows, intermediate states like 'Waiting Signature' and 'Signed' are recommended to organize work."}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
