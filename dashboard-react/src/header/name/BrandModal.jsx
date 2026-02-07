import React, { useEffect, useState } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { useBrand } from "./BrandProvider";

const FONT_OPTIONS = [
  {
    label: "Inter (clean)",
    value: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  },
  {
    label: "Poppins (friendly)",
    value: 'Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  },
  {
    label: "Montserrat (modern)",
    value: 'Montserrat, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  },
  {
    label: "Roboto (classic)",
    value: 'Roboto, system-ui, -apple-system, "Segoe UI", Arial',
  },
  { label: "Georgia (serif)", value: "Georgia, serif" },
];

export default function BrandModal({ show, onHide, forceRequired = false }) {
  const { brand, setBrand } = useBrand();

  const [companyName, setCompanyName] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [darkMode, setDarkMode] = useState(true);
  const [coverUrl, setCoverUrl] = useState("");
  const [preview, setPreview] = useState("");

  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);

  const nameIsValid = companyName.trim().length > 0;

  useEffect(() => {
    if (!show) return;

    setCompanyName(brand.companyName || "");
    setTextColor(brand.textColor || "#ffffff");
    setDarkMode(Boolean(brand.darkMode));

    const image = brand.coverImage || "";
    setPreview(image);
    setCoverUrl(image.startsWith("http") ? image : "");

    setFontFamily(brand.fontFamily || FONT_OPTIONS[0].value);
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
      coverImage: preview || prev.coverImage,
      textColor,
      darkMode,
      fontFamily, // ✅ guardamos fuente
    }));

    onHide();
  };

  return (
    <Modal
      show={show}
      centered
      onHide={onHide}
      backdrop={forceRequired ? "static" : true}
      keyboard={!forceRequired}
    >
      <Modal.Header closeButton={!forceRequired}>
        <Modal.Title>Personalizar header</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form className="d-grid gap-3">
          {/* Nombre */}
          <Form.Group>
            <Form.Label>Nombre de la empresa *</Form.Label>
            <Form.Control
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Peluquería Selenia"
            />
            {!nameIsValid && (
              <Form.Text className="text-danger">
                El nombre es obligatorio.
              </Form.Text>
            )}
          </Form.Group>

          {/* Fondo */}
          <Form.Group>
            <Form.Label>Fondo del header</Form.Label>

            <InputGroup className="mb-2">
              <Form.Control
                value={coverUrl}
                onChange={handleUrlChange}
                placeholder="Pega un URL de imagen"
              />
              <Button variant="outline-secondary" onClick={clearImage}>
                Limpiar
              </Button>
            </InputGroup>

            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
                onError={() => setPreview("")}
              />
            )}
          </Form.Group>

          {/* Color + Fuente */}
          <div className="d-flex gap-3">
            <Form.Group style={{ minWidth: 160 }}>
              <Form.Label>Color del texto</Form.Label>
              <Form.Control
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ height: 44 }}
              />
            </Form.Group>

            <Form.Group className="flex-grow-1">
              <Form.Label>Fuente del dashboard</Form.Label>
              <Form.Select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.label} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Form.Select>

              <div style={{ marginTop: 8, fontFamily, fontSize: 14 }}>
                Preview: El zorro rápido salta sobre el perro perezoso.
              </div>
            </Form.Group>
          </div>

          {/* Dark mode */}
          <Form.Check
            type="switch"
            label="Dark mode"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
          />
        </Form>
      </Modal.Body>

      <Modal.Footer>
        {!forceRequired && (
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
        )}

        <Button variant="dark" onClick={handleSave} disabled={!nameIsValid}>
          Guardar cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
}