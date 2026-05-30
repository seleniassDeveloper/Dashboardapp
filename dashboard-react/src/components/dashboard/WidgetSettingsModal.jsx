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
    <Modal show={show} onHide={onHide} centered className="modal-premium border-0">
      <Modal.Header closeButton className="border-0 pb-0 bg-white rounded-top-4">
        <Modal.Title className="fw-black h5 text-dark">
          {isEdit ? (isEs ? "Configurar Bloque" : "Configure Block") : (isEs ? "Agregar Nuevo Bloque" : "Add New Block")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="py-4 bg-white">
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
