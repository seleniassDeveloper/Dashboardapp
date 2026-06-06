import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { 
  WIDGET_TYPES, 
  METRIC_OPTIONS, 
  RANGE_OPTIONS, 
  CHART_TYPES, 
  COLOR_PRESETS,
  getWidgetTypes,
  getMetricOptions,
  getRangeOptions,
  getChartTypes,
  getColorPresets
} from "./WidgetRegistry";
import { useTranslation } from "react-i18next";
import WidgetRenderer from "./WidgetRenderer";

// Mock data generator for real-time widget preview inside the modal
const getMockAppointments = () => {
  const now = new Date();
  
  // Helper to make ISO strings relative to today's date
  const relativeDateStr = (daysOffset, hour = 12) => {
    const d = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: "m1",
      startsAt: relativeDateStr(0, 10), // today 10:00
      status: "DONE",
      service: { name: "Corte Unisex", price: 5000 },
      worker: { firstName: "Andrea", lastName: "Gomez" },
      client: { firstName: "Juan", lastName: "Perez" },
      clientId: "c1"
    },
    {
      id: "m2",
      startsAt: relativeDateStr(-1, 14), // yesterday 14:00
      status: "CONFIRMED",
      service: { name: "Coloración", price: 15000 },
      worker: { firstName: "Andrea", lastName: "Gomez" },
      client: { firstName: "Maria", lastName: "Rodriguez" },
      clientId: "c2"
    },
    {
      id: "m3",
      startsAt: relativeDateStr(-2, 16), // 2 days ago 16:00
      status: "CANCELLED",
      service: { name: "Nutrición Capilar", price: 8000 },
      worker: { firstName: "Carlos", lastName: "Sanches" },
      client: { firstName: "Esteban", lastName: "Quito" },
      clientId: "c3"
    },
    {
      id: "m4",
      startsAt: relativeDateStr(0, 11), // today 11:00
      status: "CONFIRMED",
      service: { name: "Corte Unisex", price: 5000 },
      worker: { firstName: "Carlos", lastName: "Sanches" },
      client: { firstName: "Sofia", lastName: "Herrera" },
      clientId: "c4"
    },
    {
      id: "m5",
      startsAt: relativeDateStr(1, 15), // tomorrow 15:00
      status: "PENDING",
      service: { name: "Balayage", price: 25000 },
      worker: { firstName: "Andrea", lastName: "Gomez" },
      client: { firstName: "Laura", lastName: "Lopez" },
      clientId: "c5"
    },
    {
      id: "m6",
      startsAt: relativeDateStr(-5, 9), // 5 days ago 9:00
      status: "DONE",
      service: { name: "Manicuría", price: 4000 },
      worker: { firstName: "Lucía", lastName: "Diaz" },
      client: { firstName: "Maria", lastName: "Rodriguez" },
      clientId: "c2"
    },
    {
      id: "m7",
      startsAt: relativeDateStr(-12, 17), // 12 days ago 17:00
      status: "DONE",
      service: { name: "Coloración", price: 15000 },
      worker: { firstName: "Carlos", lastName: "Sanches" },
      client: { firstName: "Juan", lastName: "Perez" },
      clientId: "c1"
    }
  ];
};

const MOCK_CLIENTS = [
  { id: "c1", firstName: "Juan", lastName: "Perez" },
  { id: "c2", firstName: "Maria", lastName: "Rodriguez" },
  { id: "c3", firstName: "Esteban", lastName: "Quito" },
  { id: "c4", firstName: "Sofia", lastName: "Herrera" },
  { id: "c5", firstName: "Laura", lastName: "Lopez" }
];

const MOCK_WORKERS = [
  { id: "w1", firstName: "Andrea", lastName: "Gomez" },
  { id: "w2", firstName: "Carlos", lastName: "Sanches" },
  { id: "w3", firstName: "Lucía", lastName: "Diaz" }
];

const MOCK_SERVICES = [
  { id: "s1", name: "Corte Unisex", price: 5000 },
  { id: "s2", name: "Coloración", price: 15000 },
  { id: "s3", name: "Nutrición Capilar", price: 8000 },
  { id: "s4", name: "Balayage", price: 25000 },
  { id: "s5", name: "Manicuría", price: 4000 }
];

export default function WidgetSettingsModal({ show, onHide, onSave, widget = null }) {
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  // Opciones traducidas dinámicamente
  const widgetTypes = getWidgetTypes(isEs);
  const metricOptions = getMetricOptions(isEs);
  const rangeOptions = getRangeOptions(isEs);
  const chartTypes = getChartTypes(isEs);
  const colorPresets = getColorPresets(isEs);

  const isEdit = Boolean(widget?.id);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("kpi");
  const [metric, setMetric] = useState("appointments");
  const [range, setRange] = useState("THIS_MONTH");
  const [chartType, setChartType] = useState("bar");
  const [color, setColor] = useState("#10b981");
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(2);

  // Cargar valores iniciales si estamos editando
  useEffect(() => {
    if (!show) return;

    if (isEdit && widget) {
      setTitle(widget.title || "");
      setType(widget.type || "kpi");
      setMetric(widget.config?.metric || "appointments");
      setRange(widget.config?.range || "THIS_MONTH");
      setChartType(widget.config?.chartType || "bar");
      setColor(widget.config?.color || "#10b981");
      setWidth(widget.layout?.w || 4);
      setHeight(widget.layout?.h || 2);
    } else {
      setTitle("");
      setType("kpi");
      setMetric("appointments");
      setRange("THIS_MONTH");
      setChartType("bar");
      setColor("#10b981");
      setWidth(4);
      setHeight(2);
    }
  }, [show, isEdit, widget]);

  // Sincronizar dimensiones recomendadas por tipo de widget
  const handleTypeChange = (newType) => {
    setType(newType);
    const meta = widgetTypes[newType];
    if (meta) {
      setWidth(meta.defaultSize.w);
      setHeight(meta.defaultSize.h);
    }
  };

  const handleSave = () => {
    const payload = {
      title: title.trim() || widgetTypes[type].label,
      type,
      config: {
        metric,
        entity: metricOptions.find((m) => m.value === metric)?.entity || "appointments",
        chartType: type === "chart" ? chartType : "none",
        range,
        color,
      },
      layout: {
        w: Number(width),
        h: Number(height),
      },
    };

    if (isEdit) {
      onSave({ ...widget, ...payload });
    } else {
      onSave(payload);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="modal-premium border-0">
      <Modal.Header closeButton className="border-0 pb-0 bg-white rounded-top-4">
        <Modal.Title className="fw-black h5 text-dark">
          {isEdit ? (isEs ? "Configurar Bloque" : "Configure Block") : (isEs ? "Agregar Nuevo Bloque" : "Add New Block")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="py-4 bg-white">
        <Row className="g-4">
          {/* Columna Izquierda: Formulario de Configuración */}
          <Col md={7}>
            <Form className="custom-form d-grid gap-3">
              <Form.Group>
                <Form.Label className="fw-semibold small">{isEs ? "Nombre o Etiqueta" : "Name or Label"}</Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isEs ? "Ej: Ingresos Semanales, Próximas Citas..." : "e.g., Weekly Income, Upcoming Appointments..."}
                  className="modern-input"
                />
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{isEs ? "Tipo de Widget" : "Widget Type"}</Form.Label>
                    <Form.Select value={type} onChange={(e) => handleTypeChange(e.target.value)} className="modern-input">
                      {Object.entries(widgetTypes).map(([key, meta]) => (
                        <option key={key} value={key}>
                          {meta.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{isEs ? "Período Temporal" : "Time Period"}</Form.Label>
                    <Form.Select value={range} onChange={(e) => setRange(e.target.value)} className="modern-input">
                      {rangeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {(type === "kpi" || type === "chart") && (
                <Row className="g-3">
                  <Col md={type === "chart" ? 6 : 12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">{isEs ? "Métrica a Medir" : "Metric to Measure"}</Form.Label>
                      <Form.Select value={metric} onChange={(e) => setMetric(e.target.value)} className="modern-input">
                        {metricOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {type === "chart" && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">{isEs ? "Gráfico" : "Chart Type"}</Form.Label>
                        <Form.Select value={chartType} onChange={(e) => setChartType(e.target.value)} className="modern-input">
                          {chartTypes.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              )}

              <Form.Group>
                <Form.Label className="fw-semibold small">{isEs ? "Esquema de Color" : "Color Scheme"}</Form.Label>
                <div className="d-flex gap-2 flex-wrap mt-1">
                  {colorPresets.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setColor(p.value)}
                      className="rounded-circle border-0 position-relative p-0 hover-scale"
                      style={{
                        width: "28px",
                        height: "28px",
                        background: p.value,
                        boxShadow: color === p.value ? `0 0 0 3px #fff, 0 0 0 5px ${p.value}` : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      title={p.label}
                      aria-label={`Color ${p.label}`}
                    />
                  ))}
                </div>
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{isEs ? "Dimensiones (Ancho)" : "Dimensions (Width)"}</Form.Label>
                    <Form.Select value={width} onChange={(e) => setWidth(Number(e.target.value))} className="modern-input">
                      <option value={3}>{isEs ? "1/4 Ancho (3 col)" : "1/4 Width (3 col)"}</option>
                      <option value={4}>{isEs ? "1/3 Ancho (4 col)" : "1/3 Width (4 col)"}</option>
                      <option value={6}>{isEs ? "Mitad Ancho (6 col)" : "Half Width (6 col)"}</option>
                      <option value={8}>{isEs ? "2/3 Ancho (8 col)" : "2/3 Width (8 col)"}</option>
                      <option value={12}>{isEs ? "Ancho Completo (12 col)" : "Full Width (12 col)"}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">{isEs ? "Dimensiones (Alto)" : "Dimensions (Height)"}</Form.Label>
                    <Form.Select value={height} onChange={(e) => setHeight(Number(e.target.value))} className="modern-input">
                      <option value={2}>{isEs ? "Pequeño (2 filas)" : "Small (2 rows)"}</option>
                      <option value={3}>{isEs ? "Normal (3 filas)" : "Normal (3 rows)"}</option>
                      <option value={4}>{isEs ? "Mediano (4 filas)" : "Medium (4 rows)"}</option>
                      <option value={6}>{isEs ? "Grande (6 filas)" : "Large (6 rows)"}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Col>

          {/* Columna Derecha: Vista Previa en Vivo */}
          <Col md={5} className="border-start ps-md-4 d-flex flex-column justify-content-between">
            <div>
              <div className="small text-muted fw-bold mb-3 text-uppercase tracking-wider">
                {isEs ? "Vista Previa en Vivo" : "Live Preview"}
              </div>
              
              {/* Premium Preview Card Mockup */}
              <div 
                className="card-premium border-0 shadow-sm overflow-hidden" 
                style={{ 
                  background: "#ffffff", 
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  borderRadius: "16px",
                  minHeight: "240px",
                  maxHeight: "300px",
                  display: "flex", 
                  flexDirection: "column"
                }}
              >
                <div 
                  className="px-3.5 py-2.5 bg-light d-flex align-items-center justify-content-between border-bottom"
                  style={{ userSelect: "none" }}
                >
                  <span className="small text-dark fw-bold" style={{ fontSize: "12.5px" }}>
                    {title.trim() || widgetTypes[type]?.label || (isEs ? "Nuevo Bloque" : "New Block")}
                  </span>
                </div>
                
                <div className="p-3 flex-grow-1 overflow-auto d-flex flex-column justify-content-center">
                  <WidgetRenderer
                    widget={{
                      id: "preview-widget-id",
                      title: title.trim() || widgetTypes[type]?.label || "Preview",
                      type,
                      config: {
                        metric,
                        entity: metricOptions.find((m) => m.value === metric)?.entity || "appointments",
                        chartType: type === "chart" ? chartType : "none",
                        range,
                        color,
                      },
                      layout: {
                        w: Number(width),
                        h: Number(height),
                      },
                    }}
                    appointments={getMockAppointments()}
                    clients={MOCK_CLIENTS}
                    workers={MOCK_WORKERS}
                    services={MOCK_SERVICES}
                  />
                </div>
              </div>
              
              <div className="text-muted smaller mt-3 italic text-center" style={{ fontSize: "11px", lineHeight: "1.4" }}>
                {isEs 
                  ? "* Los datos y gráficos son simulados a fines de previsualizar el diseño en tiempo real." 
                  : "* Data and graphs are simulated to preview the design in real time."}
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 bg-white rounded-bottom-4">
        <Button variant="outline-dark" onClick={onHide} className="rounded-pill px-4">
          {isEs ? "Cancelar" : "Cancel"}
        </Button>
        <Button variant="dark" onClick={handleSave} className="rounded-pill px-4 btn-premium">
          {isEs ? "Guardar Bloque" : "Save Block"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
