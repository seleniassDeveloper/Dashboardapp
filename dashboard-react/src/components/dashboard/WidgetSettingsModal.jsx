import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { WIDGET_TYPES, METRIC_OPTIONS, RANGE_OPTIONS, CHART_TYPES, COLOR_PRESETS } from "./WidgetRegistry";

export default function WidgetSettingsModal({ show, onHide, onSave, widget = null }) {
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
    const meta = WIDGET_TYPES[newType];
    if (meta) {
      setWidth(meta.defaultSize.w);
      setHeight(meta.defaultSize.h);
    }
  };

  const handleSave = () => {
    const payload = {
      title: title.trim() || WIDGET_TYPES[type].label,
      type,
      config: {
        metric,
        entity: METRIC_OPTIONS.find((m) => m.value === metric)?.entity || "appointments",
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
          {isEdit ? "Configurar Bloque" : "Agregar Nuevo Bloque"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="py-4 bg-white">
        <Form className="custom-form d-grid gap-3">
          <Form.Group>
            <Form.Label className="fw-semibold small">Nombre o Etiqueta</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Ingresos Semanales, Próximas Citas..."
              className="modern-input"
            />
          </Form.Group>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Tipo de Widget</Form.Label>
                <Form.Select value={type} onChange={(e) => handleTypeChange(e.target.value)} className="modern-input">
                  {Object.entries(WIDGET_TYPES).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Período Temporal</Form.Label>
                <Form.Select value={range} onChange={(e) => setRange(e.target.value)} className="modern-input">
                  {RANGE_OPTIONS.map((o) => (
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
                  <Form.Label className="fw-semibold small">Métrica a Medir</Form.Label>
                  <Form.Select value={metric} onChange={(e) => setMetric(e.target.value)} className="modern-input">
                    {METRIC_OPTIONS.map((o) => (
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
                    <Form.Label className="fw-semibold small">Gráfico</Form.Label>
                    <Form.Select value={chartType} onChange={(e) => setChartType(e.target.value)} className="modern-input">
                      {CHART_TYPES.map((o) => (
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
            <Form.Label className="fw-semibold small">Esquema de Color</Form.Label>
            <div className="d-flex gap-2 flex-wrap mt-1">
              {COLOR_PRESETS.map((p) => (
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
                <Form.Label className="fw-semibold small">Dimensiones (Ancho)</Form.Label>
                <Form.Select value={width} onChange={(e) => setWidth(Number(e.target.value))} className="modern-input">
                  <option value={3}>1/4 Ancho (3 col)</option>
                  <option value={4}>1/3 Ancho (4 col)</option>
                  <option value={6}>Mitad Ancho (6 col)</option>
                  <option value={8}>2/3 Ancho (8 col)</option>
                  <option value={12}>Ancho Completo (12 col)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Dimensiones (Alto)</Form.Label>
                <Form.Select value={height} onChange={(e) => setHeight(Number(e.target.value))} className="modern-input">
                  <option value={2}>Pequeño (2 filas)</option>
                  <option value={3}>Normal (3 filas)</option>
                  <option value={4}>Mediano (4 filas)</option>
                  <option value={6}>Grande (6 filas)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 bg-white rounded-bottom-4">
        <Button variant="outline-dark" onClick={onHide} className="rounded-pill px-4">
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleSave} className="rounded-pill px-4 btn-premium">
          Guardar Bloque
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
