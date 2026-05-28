import React from "react";
import { Card, Form, Row, Col, Button, Badge } from "react-bootstrap";
import { Settings, HelpCircle, Code, PlusCircle, CheckCircle } from "lucide-react";

export default function WorkflowInspector({ 
  node, 
  onUpdateNode 
}) {
  if (!node) {
    return (
      <Card className="card-premium border-0 shadow-sm bg-white p-4 h-100 d-flex flex-column justify-content-center align-items-center text-center text-muted">
        <Settings size={36} className="opacity-25 mb-2 animate-spin" style={{ animationDuration: "10s" }} />
        <h5 className="fw-bold">Inspector de Propiedades</h5>
        <p className="smaller px-3">Selecciona un nodo del canvas para configurar sus parámetros, mermas, condiciones y automatizaciones en Neon DB.</p>
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
            <h3 className="h6 fw-black text-gray-900 mb-0">Inspector: {node.name}</h3>
            <span className="smaller text-muted">ID: {node.id}</span>
          </div>
        </div>

        <Form className="d-grid gap-3">
          {/* General name */}
          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">Nombre del Nodo</Form.Label>
            <Form.Control
              type="text"
              value={node.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="rounded-xl border-gray-200 small"
            />
          </Form.Group>

          {/* Description */}
          <Form.Group>
            <Form.Label className="small fw-bold text-gray-700">Descripción / Nota</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={node.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="rounded-xl border-gray-200 small"
              placeholder="Ej: Manda WhatsApp al cliente para confirmar"
            />
          </Form.Group>

          {/* ==================== CONFIGURATION DEPENDING ON NODE TYPE ==================== */}

          {/* 1. COMMUNICATIONS: WHATSAPP, EMAIL, NOTIFICATIONS */}
          {(node.subtype === "whatsapp" || node.subtype === "email" || node.subtype === "notificacion") && (
            <div className="d-grid gap-3 pt-2 border-top">
              <span className="small fw-bold text-purple-700 d-block">Configuración de Mensajería</span>

              {node.subtype === "email" && (
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Asunto del Correo *</Form.Label>
                  <Form.Control
                    type="text"
                    value={node.config?.subject || ""}
                    onChange={(e) => handleConfigChange("subject", e.target.value)}
                    className="rounded-xl border-gray-200 small"
                    placeholder="Ej: Confirmación de Cita"
                  />
                </Form.Group>
              )}

              {node.subtype === "notificacion" && (
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Título de la Notificación *</Form.Label>
                  <Form.Control
                    type="text"
                    value={node.config?.title || ""}
                    onChange={(e) => handleConfigChange("title", e.target.value)}
                    className="rounded-xl border-gray-200 small"
                    placeholder="Ej: Alerta de Stock Crítico"
                  />
                </Form.Group>
              )}

              {/* Message Editor with variables */}
              <Form.Group>
                <div className="d-flex justify-content-between mb-1">
                  <Form.Label className="smaller text-muted fw-bold mb-0">Mensaje con Variables</Form.Label>
                  <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2" style={{ fontSize: "9px" }}>
                    Editor Dinámico
                  </Badge>
                </div>
                <Form.Control
                  id="message-editor"
                  as="textarea"
                  rows={4}
                  value={node.config?.message || ""}
                  onChange={(e) => handleConfigChange("message", e.target.value)}
                  className="rounded-xl border-gray-200 small font-mono"
                  placeholder="Escribe tu mensaje aquí..."
                  style={{ fontSize: "12px", lineHeight: "1.4" }}
                />
              </Form.Group>

              {/* Variable Chips Insertion Toolbar */}
              <div>
                <span className="smaller text-muted fw-semibold d-block mb-1.5">Inyectar variables:</span>
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
              <span className="small fw-bold text-purple-700 d-block">Configuración de Tarea</span>
              
              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">Prioridad de la Tarea</Form.Label>
                <Form.Select 
                  value={node.config?.priority || "MEDIA"}
                  onChange={(e) => handleConfigChange("priority", e.target.value)}
                  className="rounded-xl border-gray-200 small"
                >
                  <option value="ALTA">🚨 ALTA</option>
                  <option value="MEDIA">🟡 MEDIA</option>
                  <option value="BAJA">🟢 BAJA</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">Empleado Asignado</Form.Label>
                <Form.Select 
                  value={node.config?.assignee || "ESTILISTA_TURNO"}
                  onChange={(e) => handleConfigChange("assignee", e.target.value)}
                  className="rounded-xl border-gray-200 small"
                >
                  <option value="ESTILISTA_TURNO">Colaborador asignado al turno</option>
                  <option value="RECEPCION">Recepcionista / Coordinador</option>
                  <option value="ADMIN">Administrador General</option>
                </Form.Select>
              </Form.Group>
            </div>
          )}

          {/* 3. LOGICAL IF/ELSE CONDITIONS */}
          {node.type === "condition" && (
            <div className="d-grid gap-3 pt-2 border-top">
              <span className="small fw-bold text-purple-700 d-block">Bifurcación Condicional (IF)</span>

              <Row className="g-2">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Propiedad a Evaluar</Form.Label>
                    <Form.Select 
                      value={node.config?.property || "cliente.vip"}
                      onChange={(e) => handleConfigChange("property", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                    >
                      <option value="cliente.vip">¿Cliente es VIP?</option>
                      <option value="cliente.saldo">Saldo deudor del cliente</option>
                      <option value="cita.servicio">Servicio / Tratamiento contratado</option>
                      <option value="cita.importe">Importe total de la cita</option>
                      <option value="stock.cantidad">Cantidad de stock disponible</option>
                      <option value="cita.sucursal">Sucursal de atención</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Operador</Form.Label>
                    <Form.Select 
                      value={node.config?.operator || "=="}
                      onChange={(e) => handleConfigChange("operator", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                    >
                      <option value="==">Es igual a</option>
                      <option value="!=">Es diferente a</option>
                      <option value=">">Es mayor que</option>
                      <option value="<">Es menor que</option>
                      <option value="contains">Contiene el texto</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Valor</Form.Label>
                    <Form.Control
                      type="text"
                      value={node.config?.value ?? "true"}
                      onChange={(e) => handleConfigChange("value", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                      placeholder="Ej: true o Palermo"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          {/* 4. DELAY NODES */}
          {node.type === "delay" && (
            <div className="d-grid gap-3 pt-2 border-top">
              <span className="small fw-bold text-purple-700 d-block">Retardo de Ejecución (Delay)</span>

              <Row className="g-2">
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label className="smaller text-muted fw-bold">Cantidad de Tiempo</Form.Label>
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
                    <Form.Label className="smaller text-muted fw-bold">Unidad</Form.Label>
                    <Form.Select 
                      value={node.config?.timeUnit || "horas"}
                      onChange={(e) => handleConfigChange("timeUnit", e.target.value)}
                      className="rounded-xl border-gray-200 small"
                    >
                      <option value="minutos">Minutos</option>
                      <option value="horas">Horas</option>
                      <option value="dias">Días</option>
                      <option value="semanas">Semanas</option>
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
          <strong>Tip del sistema:</strong> Puedes referenciar las variables dinámicas del salón en cualquier caja de texto del workflow. Éstas serán calculadas automáticamente antes del envío.
        </span>
      </div>
    </Card>
  );
}
