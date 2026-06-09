import React, { useEffect, useState } from "react";
import { Modal, Button, Form, InputGroup, Row, Col } from "react-bootstrap";
import { useBrand } from "./BrandProvider";

const FONT_OPTIONS = [
  {
    label: "Outfit (premium geometric)",
    value: "'Outfit', system-ui, -apple-system, sans-serif",
  },
  {
    label: "Space Grotesk (creative / tech)",
    value: "'Space Grotesk', system-ui, -apple-system, sans-serif",
  },
  {
    label: "Lora (serif luxury)",
    value: "'Lora', Georgia, serif",
  },
  {
    label: "Poppins (friendly rounded)",
    value: "'Poppins', system-ui, -apple-system, sans-serif",
  },
  {
    label: "Montserrat (modern bold)",
    value: "'Montserrat', system-ui, -apple-system, sans-serif",
  },
  {
    label: "Inter (clean neutral)",
    value: "'Inter', system-ui, -apple-system, sans-serif",
  },
];

const THEME_PRESETS = [
  {
    name: "Classic Minimal (Por defecto)",
    textColor: "#0f172a",
    dashboardBg: "#f8fafc",
    menuSelectionColor: "#0f172a",
    fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
  },
  {
    name: "Spas & Wellness (Esmeralda & Serif)",
    textColor: "#0f766e",
    dashboardBg: "#f0fdfa",
    menuSelectionColor: "#0d9488",
    fontFamily: "'Lora', Georgia, serif",
  },
  {
    name: "Barber & Wood (Ámbar y Madera)",
    textColor: "#78350f",
    dashboardBg: "#fef3c7",
    menuSelectionColor: "#b45309",
    fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
  },
  {
    name: "Clinical Blue (Médico / Dental)",
    textColor: "#1d4ed8",
    dashboardBg: "#f0f9ff",
    menuSelectionColor: "#2563eb",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  {
    name: "Creative Violet (Gimnasios / Fitness)",
    textColor: "#6d28d9",
    dashboardBg: "#f5f3ff",
    menuSelectionColor: "#7c3aed",
    fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif",
  },
];

export default function BrandModal({ show, onHide, forceRequired = false }) {
  const { brand, setBrand } = useBrand();

  const [companyName, setCompanyName] = useState("");
  const [userName, setUserName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [textColor, setTextColor] = useState("#1a1d24"); // lo usamos como accent
  const [coverUrl, setCoverUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [dashboardBg, setDashboardBg] = useState("#f8fafc");
  const [menuSelectionColor, setMenuSelectionColor] = useState("#7c3aed");

  const nameIsValid = companyName.trim().length > 0;

  useEffect(() => {
    if (!show) return;

    setCompanyName(brand.companyName || "");
    setUserName(brand.userName || "");
    setSlogan(brand.slogan || "");

    // ✅ si ya existía textColor lo respetamos, si no usamos accentColor
    setTextColor(brand.accentColor || brand.textColor || "#ffffff");

    const image = brand.coverImage || "";
    setPreview(image);
    setCoverUrl(image.startsWith("http") ? image : "");

    setFontFamily(brand.fontFamily || FONT_OPTIONS[0].value);
    setDashboardBg(brand.dashboardBg || "#f8fafc");
    setMenuSelectionColor(brand.menuSelectionColor || brand.accentColor || "#7c3aed");
  }, [show, brand]);

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setCoverUrl(url);
    setPreview(url.trim());
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setCoverUrl("");
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview("");
    setCoverUrl("");
  };

  const handleSave = () => {
    if (!nameIsValid) return;

    setBrand((prev) => ({
      ...prev,
      companyName: companyName.trim(),
      userName: userName.trim(),
      slogan: slogan.trim(),
      coverImage: preview || prev.coverImage,
      textColor,
      accentColor: textColor,
      fontFamily,
      dashboardBg,
      menuSelectionColor,
    }));

    window.location.reload(); // 🔥 fuerza todo
  };

  return (
    <Modal
      show={show}
      size="lg"
      centered
      onHide={onHide}
      backdrop={forceRequired ? "static" : true}
      keyboard={!forceRequired}
      dialogClassName="modal-brand-custom"
    >
      <Modal.Header closeButton={!forceRequired} className="border-bottom-0 pb-0">
        <Modal.Title className="fw-black text-dark" style={{ letterSpacing: "-0.02em" }}>Personalizar header</Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-3">
        <Form className="custom-form">
          <Row className="g-4">
            
            {/* Columna Izquierda: Ajustes de Texto */}
            <Col md={6} className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="fw-bold text-dark small mb-1.5">Tema preestablecido de diseño</Form.Label>
                <Form.Select
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (isNaN(idx)) return;
                    const preset = THEME_PRESETS[idx];
                    if (!preset) return;
                    setTextColor(preset.textColor);
                    setDashboardBg(preset.dashboardBg);
                    setMenuSelectionColor(preset.menuSelectionColor);
                    setFontFamily(preset.fontFamily);
                  }}
                  defaultValue=""
                  className="rounded-3 border-secondary-subtle small"
                  style={{ height: "42px", fontSize: "13px" }}
                >
                  <option value="" disabled>Seleccionar paleta sugerida...</option>
                  {THEME_PRESETS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted smaller">
                  Al elegir un tema se autocompletarán los colores y la tipografía sugeridos para ese nicho.
                </Form.Text>
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold text-dark small mb-1.5">Nombre de la empresa *</Form.Label>
                <Form.Control
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Peluquería Selenia"
                  className="rounded-3 border-secondary-subtle small"
                  style={{ height: "42px", fontSize: "13px" }}
                />
                {!nameIsValid && (
                  <Form.Text className="text-danger smaller">
                    El nombre es obligatorio.
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold text-dark small mb-1.5">Tu nombre de usuario / administrador</Form.Label>
                <Form.Control
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej: Selenia Sanchez"
                  className="rounded-3 border-secondary-subtle small"
                  style={{ height: "42px", fontSize: "13px" }}
                />
                <Form.Text className="text-muted smaller">
                  Se utilizará para los saludos y el perfil de la aplicación.
                </Form.Text>
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold text-dark small mb-1.5">Slogan / Indicaciones</Form.Label>
                <Form.Control
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ej: Estética Profesional & Spa"
                  className="rounded-3 border-secondary-subtle small"
                  style={{ height: "42px", fontSize: "13px" }}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold text-dark small mb-1.5">Fuente del dashboard</Form.Label>
                <Form.Select 
                  value={fontFamily} 
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="rounded-3 border-secondary-subtle small"
                  style={{ height: "42px", fontSize: "13px" }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.label} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Form.Select>
                <div style={{ marginTop: 8, fontFamily, fontSize: 12, fontStyle: "italic" }} className="text-muted">
                  Preview: El zorro rápido salta sobre el perro perezoso.
                </div>
              </Form.Group>
            </Col>

            {/* Columna Derecha: Imagen de Fondo y Colores */}
            <Col md={6} className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="fw-bold text-dark small mb-1.5">Fondo del header (URL o Archivo)</Form.Label>
                
                <InputGroup className="mb-2">
                  <Form.Control
                    value={coverUrl}
                    onChange={handleUrlChange}
                    placeholder="Pega un URL de imagen"
                    className="rounded-start-3 border-secondary-subtle small"
                    style={{ height: "42px", fontSize: "13px" }}
                  />
                  <Button variant="outline-secondary" onClick={clearImage} className="rounded-end-3 small">
                    Limpiar
                  </Button>
                </InputGroup>

                <Form.Label className="small text-muted mb-1">O subir imagen desde archivo</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} className="rounded-3 small" />

                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      marginTop: 12,
                      width: "100%",
                      height: 110,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                    }}
                    onError={() => setPreview("")}
                  />
                )}
              </Form.Group>

              <div className="d-grid gap-2 border-top pt-3">
                <Form.Label className="fw-bold text-dark small mb-1">Paleta de Colores Corporativos</Form.Label>
                <Row className="g-2">
                  <Col xs={4}>
                    <Form.Group>
                      <Form.Label className="smaller text-muted mb-1 d-block text-truncate">Color marca</Form.Label>
                      <Form.Control
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{ height: 40, padding: '4px', cursor: 'pointer' }}
                        className="rounded-3 border-secondary-subtle"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={4}>
                    <Form.Group>
                      <Form.Label className="smaller text-muted mb-1 d-block text-truncate">Fondo Dash</Form.Label>
                      <Form.Control
                        type="color"
                        value={dashboardBg}
                        onChange={(e) => setDashboardBg(e.target.value)}
                        style={{ height: 40, padding: '4px', cursor: 'pointer' }}
                        className="rounded-3 border-secondary-subtle"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={4}>
                    <Form.Group>
                      <Form.Label className="smaller text-muted mb-1 d-block text-truncate">Menú Activo</Form.Label>
                      <Form.Control
                        type="color"
                        value={menuSelectionColor}
                        onChange={(e) => setMenuSelectionColor(e.target.value)}
                        style={{ height: 40, padding: '4px', cursor: 'pointer' }}
                        className="rounded-3 border-secondary-subtle"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-top-0 pt-0">
        {!forceRequired && (
          <Button variant="outline-dark" onClick={onHide} className="rounded-pill px-4 small fw-bold">
            Cancelar
          </Button>
        )}
        <Button variant="primary" onClick={handleSave} disabled={!nameIsValid} className="rounded-pill px-4 small fw-bold border-0 bg-success">
          Guardar cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
}