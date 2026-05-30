import React from "react";
import { Card, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { Settings, HelpCircle, Code, PlusCircle, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function WorkflowInspector({ 
  node, 
  onUpdateNode 
}) {
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";

  if (!node) {
    return (
      <Card className="card-premium border-0 shadow-sm bg-white p-4 h-100 d-flex flex-column justify-content-center align-items-center text-center text-muted">
        <Settings size={36} className="opacity-25 mb-2 animate-spin" style={{ animationDuration: "10s" }} />
        <h5 className="fw-bold">{t("workflowsBuilder.inspector.title", { defaultValue: "Inspector de Propiedades" })}</h5>
        <p className="smaller px-3">{t("workflowsBuilder.inspector.empty", { defaultValue: "Selecciona un nodo del canvas para configurar sus parámetros, mermas, condiciones y automatizaciones." })}</p>
      </Card>
    );
  }

  // Handle standard fields change
  const handleChange = (field, value) => {
    onUpdateNode({
      ...node,
      [field]: value
    });
  };

  // Handle nested metadata config change
  const handleConfigChange = (key, value) => {
    onUpdateNode({
      ...node,
      config: {
        ...(node.config || {}),
        [key]: value
      }
    });
  };

  // Insert template variable into the active textarea
  const insertVariable = (variable) => {
    const textarea = document.getElementById("message-editor");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = node.config?.message || "";
    const updated = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
    
    handleConfigChange("message", updated);
    
    // Reset focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 50);
  };

  return (
    <Card className="card-premium border-0 shadow-sm bg-white p-4 h-100 overflow-auto scrollbar-none d-flex flex-column justify-content-between">
      <div>
        {/* Header */}
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <Settings className="text-purple-600 animate-pulse" size={20} />
          <div>
            <h3 className="h6 fw-black text-gray-900 mb-0">{isEs ? "Inspector" : "Inspector"}: {node.name}</h3>
            <span className="smaller text-muted">ID: {node.id}</span>
          </div>
        </div>

        <Form className="d-grid gap-3">
          {/* General name */}
          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">{isEs ? "Nombre del Nodo" : "Node Label"}</Form.Label>
            <Form.Control
              type="text"
              value={node.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="rounded-xl border-gray-200 small"
            />
          </Form.Group>

          {/* Description */}
          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">{t("workflowsBuilder.inspector.labelDesc")}</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={node.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="rounded-xl border-gray-200 small"
              placeholder={isEs ? "Ej: Manda WhatsApp al cliente para confirmar" : "e.g., Sends WhatsApp to customer to confirm"}
            />
          </Form.Group>

          {/* ==================== CONFIGURATION DEPENDING ON NODE TYPE ==================== */}

          {/* 1. COMMUNICATIONS: WHATSAPP, EMAIL, NOTIFICATIONS */}
          {(node.subtype === "whatsapp" || node.subtype === "email" || node.subtype === "notificacion") && (
            <div className="d-grid gap-3 pt-2 border-top">
              <span className="small fw-bold text-purple-700 d-block">{t("workflowsBuilder.inspector.messagingSection")}</span>

              {node.subtype === "email" && (
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">{isEs ? "Asunto del Correo *" : "Email Subject *"}</Form.Label>
                  <Form.Control
                    type="text"
                    value={node.config?.subject || ""}
                    onChange={(e) => handleConfigChange("subject", e.target.value)}
                    className="rounded-xl border-gray-200 small"
                    placeholder={isEs ? "Ej: Confirmación de Cita" : "e.g., Appointment Confirmation"}
                  />
                </Form.Group>
              )}

              {node.subtype === "notificacion" && (
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">{t("workflowsBuilder.inspector.messageTitle")}</Form.Label>
                  <Form.Control
                    type="text"
                    value={node.config?.title || ""}
                    onChange={(e) => handleConfigChange("title", e.target.value)}
                    className="rounded-xl border-gray-200 small"
                    placeholder={isEs ? "Ej: Alerta de Stock Crítico" : "e.g., Critical Stock Alert"}
                  />
                </Form.Group>
              )}

              {/* Message Editor with variables */}
              <Form.Group>
                <div className="d-flex justify-content-between mb-1">
                  <Form.Label className="smaller text-muted fw-bold mb-0">{isEs ? "Mensaje con Variables" : "Message with Variables"}</Form.Label>
                  <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2" style={{ fontSize: "9px" }}>
                    {isEs ? "Editor Dinámico" : "Dynamic Editor"}
                  </Badge>
                </div>
                <Form.Control
                  id="message-editor"
                  as="textarea"
                  rows={4}
                  value={node.config?.message || ""}
                  onChange={(e) => handleConfigChange("message", e.target.value)}
                  className="rounded-xl border-gray-200 small font-mono"
                  placeholder={t("workflowsBuilder.inspector.editorPlaceholder")}
                  style={{ fontSize: "12px", lineHeight: "1.4" }}
                />
              </Form.Group>

              {/* Variable Chips Insertion Toolbar */}
              <div>
                <span className="smaller text-muted fw-semibold d-block mb-1.5">{isEs ? "Inyectar variables:" : "Inject variables:"}</span>
                <div className="d-flex flex-wrap gap-1.5">
                  {["cliente", "fecha", "hora", "profesional", "servicio", "saldo", "sucursal"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="btn btn-xs btn-outline-purple bg-light bg-opacity-40 px-2 py-1 rounded-pill small fw-semibold text-purple-700 hover-bg-purple-100"
                      style={{ fontSize: "10.5px" }}
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CREATING INTERNAL TASKS OR ALERTS */}
          {node.subtype === "crear-tarea" && (
            <div className="d-grid gap-3 pt-2 border-top">
              <span className="small fw-bold text-purple-700 d-block">{t("workflowsBuilder.inspector.taskSection")}</span>
              
              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">{isEs ? "Prioridad de la Tarea" : "Task Priority"}</Form.Label>
                <Form.Select 
                  value={node.config?.priority || "MEDIA"}
                  onChange={(e) => handleConfigChange("priority", e.target.value)}
                  className="rounded-xl border-gray-200 small"
                >
                  <option value="ALTA">🚨 {isEs ? "ALTA" : "HIGH"}</option>
                  <option value="MEDIA">🟡 {isEs ? "MEDIA" : "MEDIUM"}</option>
                  <option value="BAJA">🟢 {isEs ? "BAJA" : "LOW"}</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">{isEs ? "Empleado Asignado" : "Assigned Employee"}</Form.Label>
                <Form.Select 
                  value={node.config?.assignee || "ESTILISTA_TURNO"}
                  onChange={(e) => handleConfigChange("assignee", e.target.value)}
                  className="rounded-xl border-gray-200 small"
                >
                  <option value="ESTILISTA_TURNO">{isEs ? "Colaborador asignado al turno" : "Staff assigned to appointment"}</option>
                  <option value="RECEPCION">{isEs ? "Recepcionista / Coordinador" : "Receptionist / Coordinator"}</option>
                  <option value="ADMIN">{isEs ? "Administrador General" : "General Administrator"}</option>
                </Form.Select>
              </Form.Group>
            </div>
          )}

          {/* 3. LOGICAL IF/ELSE CONDITIONS */}
          {node.type === "condition" && (
            <div className="d-grid gap-3 pt-2 border-top">
              <span className="small fw-bold text-purple-700 d-block">{t("workflowsBuilder.inspector.conditionSection")}</span>

              <Row className="g-2">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">{isEs ? "Propiedad a Evaluar" : "Property to Evaluate"}</Form.Label>
                    <Form.Select 
                      value={node.config?.property || "cliente.vip"}
                      onChange={(e) => handleConfigChange("property", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                    >
                      <option value="cliente.vip">{isEs ? "¿Cliente es VIP?" : "Is Client VIP?"}</option>
                      <option value="cliente.saldo">{isEs ? "Saldo deudor del cliente" : "Client unpaid balance"}</option>
                      <option value="cita.servicio">{isEs ? "Servicio / Tratamiento contratado" : "Service / Treatment booked"}</option>
                      <option value="cita.importe">{isEs ? "Importe total de la cita" : "Total appointment amount"}</option>
                      <option value="stock.cantidad">{isEs ? "Cantidad de stock disponible" : "Available stock amount"}</option>
                      <option value="cita.sucursal">{isEs ? "Sucursal de atención" : "Selected branch"}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">{isEs ? "Operador" : "Operator"}</Form.Label>
                    <Form.Select 
                      value={node.config?.operator || "=="}
                      onChange={(e) => handleConfigChange("operator", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                    >
                      <option value="==">{isEs ? "Es igual a" : "Equals"}</option>
                      <option value="!=">{isEs ? "Es diferente a" : "Does not equal"}</option>
                      <option value=">">{isEs ? "Es mayor que" : "Is greater than"}</option>
                      <option value="<">{isEs ? "Es menor que" : "Is less than"}</option>
                      <option value="contains">{isEs ? "Contiene el texto" : "Contains text"}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">{isEs ? "Valor" : "Value"}</Form.Label>
                    <Form.Control
                      type="text"
                      value={node.config?.value ?? "true"}
                      onChange={(e) => handleConfigChange("value", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                      placeholder={isEs ? "Ej: true o Palermo" : "e.g., true or Downtown"}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          {/* 4. DELAY NODES */}
          {node.type === "delay" && (
            <div className="d-grid gap-3 pt-2 border-top">
              <span className="small fw-bold text-purple-700 d-block">{t("workflowsBuilder.inspector.delaySection")}</span>

              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">{isEs ? "Cantidad de Tiempo" : "Time Duration"}</Form.Label>
                    <Form.Control
                      type="number"
                      value={node.config?.timeValue || 2}
                      onChange={(e) => handleConfigChange("timeValue", Number(e.target.value))}
                      className="rounded-xl border-gray-200 small"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">{isEs ? "Unidad" : "Unit"}</Form.Label>
                    <Form.Select 
                      value={node.config?.timeUnit || "horas"}
                      onChange={(e) => handleConfigChange("timeUnit", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                    >
                      <option value="minutos">{isEs ? "Minutos" : "Minutes"}</option>
                      <option value="horas">{isEs ? "Horas" : "Hours"}</option>
                      <option value="dias">{isEs ? "Días" : "Days"}</option>
                      <option value="semanas">{isEs ? "Semanas" : "Weeks"}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}
        </Form>
      </div>

      <div className="pt-3 border-top text-muted small mt-4 d-flex align-items-start gap-2 bg-light p-2.5 rounded-xl border">
        <Code size={16} className="text-purple-600 flex-shrink-0" />
        <span style={{ fontSize: "11px", lineHeight: "1.4" }}>
          <strong>{t("workflowsBuilder.inspector.tipTitle")}</strong> {t("workflowsBuilder.inspector.tipBody")}
        </span>
      </div>
    </Card>
  );
}
