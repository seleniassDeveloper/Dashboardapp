import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { Scissors, Plus, Trash2, CheckCircle, Package, Sparkles } from "lucide-react";
import api from "../../lib/api.js";

const PRESETS_BY_INDUSTRY = {
  Salon: [
    { name: "Mezcla de Tintura", productName: "Oxidante", serviceName: "Color", quantity: 60, unit: "ml" },
    { name: "Lavado Premium", productName: "Shampoo", serviceName: "Lavado", quantity: 30, unit: "ml" },
    { name: "Nutrición Capilar", productName: "Acondicionador", serviceName: "Nutrición", quantity: 25, unit: "ml" }
  ],
  Barberia: [
    { name: "Afeitado Clásico", productName: "Loción", serviceName: "Afeitado", quantity: 15, unit: "ml" },
    { name: "Corte y Modelado", productName: "Cera", serviceName: "Corte", quantity: 5, unit: "gr" },
    { name: "Lavado Masculino", productName: "Shampoo", serviceName: "Corte", quantity: 20, unit: "ml" }
  ],
  Spa: [
    { name: "Masaje Descontracturante", productName: "Aceite", serviceName: "Masaje", quantity: 30, unit: "ml" },
    { name: "Exfoliación Facial", productName: "Crema", serviceName: "Facial", quantity: 40, unit: "gr" },
    { name: "Sesión de Vapor", productName: "Esencia", serviceName: "Sauna", quantity: 5, unit: "ml" }
  ],
  Clinica: [
    { name: "Consulta de Rutina", productName: "Kit", serviceName: "Consulta", quantity: 1, unit: "unidad" },
    { name: "Fisioterapia con Ultrasonido", productName: "Gel", serviceName: "Sesión", quantity: 50, unit: "ml" },
    { name: "Atención Pacientes", productName: "Guantes", serviceName: "Consulta", quantity: 1, unit: "unidad" }
  ]
};

export default function ServiceConsumptionRules({ products = [], onRefresh }) {
  const [rules, setRules] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [industry, setIndustry] = useState("Estética");

  // Create form states
  const [serviceId, setServiceId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [ruleRes, serviceRes, bizRes] = await Promise.all([
        api.get("/inventory/rules"),
        api.get("/services"),
        api.get("/businesses/me").catch(() => null)
      ]);

      setRules(Array.isArray(ruleRes.data) ? ruleRes.data : []);
      setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);
      if (bizRes && bizRes.data && bizRes.data.business) {
        setIndustry(bizRes.data.business.industry || "Estética");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las fórmulas técnicas o servicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRule = async (e) => {
    if (e) e.preventDefault();
    if (!serviceId || !productId || !quantity) return;

    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const payload = {
        serviceId,
        productId,
        quantity: Number(quantity)
      };

      await api.post("/inventory/rules", payload);
      setOkMsg("¡Fórmula de consumo técnico vinculada con éxito!");
      
      setServiceId("");
      setProductId("");
      setQuantity("");

      await fetchData();

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError("Error al registrar la regla de consumo en el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id, serviceName, prodName) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar la regla de consumo de "${prodName}" para el servicio "${serviceName}"?`);
    if (!confirm) return;

    try {
      setError("");
      setOkMsg("");
      await api.delete(`/inventory/rules/${id}`);
      setOkMsg("Regla de consumo eliminada correctamente.");
      await fetchData();

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar la regla del servidor.");
    }
  };

  // Get dynamic presets based on detected industry
  const getIndustryPresets = () => {
    const norm = (industry || "").toLowerCase();
    let key = "Salon";
    if (norm.includes("barber")) key = "Barberia";
    else if (norm.includes("spa") || norm.includes("masaje") || norm.includes("bienestar")) key = "Spa";
    else if (norm.includes("clinic") || norm.includes("salud") || norm.includes("odont") || norm.includes("kinesio")) key = "Clinica";
    else if (norm.includes("peluquer") || norm.includes("estétic") || norm.includes("salon") || norm.includes("estil")) key = "Salon";

    const presets = PRESETS_BY_INDUSTRY[key] || PRESETS_BY_INDUSTRY.Salon;
    
    return presets.map(p => {
      const matchedProd = products.find(prod => 
        prod.name.toLowerCase().includes(p.productName.toLowerCase())
      );
      const matchedServ = services.find(serv => 
        serv.name.toLowerCase().includes(p.serviceName.toLowerCase())
      );
      
      return {
        ...p,
        matchedProductId: matchedProd ? matchedProd.id : null,
        matchedProductName: matchedProd ? matchedProd.name : null,
        matchedServiceId: matchedServ ? matchedServ.id : null,
        matchedServiceName: matchedServ ? matchedServ.name : null,
      };
    });
  };

  const applyPreset = (preset) => {
    if (preset.matchedServiceId) setServiceId(preset.matchedServiceId);
    if (preset.matchedProductId) setProductId(preset.matchedProductId);
    setQuantity(preset.quantity.toString());
    setOkMsg(`Sugerencia preseleccionada: ${preset.name}`);
  };

  const currentPresets = getIndustryPresets();

  return (
    <Row className="g-4 animate-fade-in">
      {/* Rules List (Left column) */}
      <Col lg={8}>
        <Card className="card-premium border shadow-sm bg-white p-4 rounded-2xl">
          <Card.Body className="p-0">
            <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
              <Scissors className="text-purple-600" size={20} />
              <span>Fórmulas y Consumos Automáticos por Tratamiento</span>
            </h3>
            <p className="text-muted smaller mb-4">Mapeá de forma técnica qué insumo y qué dosis (ml, gr, unidades) se descuentan automáticamente del stock físico de Neon DB al completar cada cita.</p>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="purple" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
                No hay reglas de descuento automático configuradas todavía.
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: "500px" }}>
                <Table hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                      <th className="ps-3 py-3">Tratamiento / Servicio</th>
                      <th className="py-3">Insumo Asociado</th>
                      <th className="py-3 text-center">Dosis de Consumo</th>
                      <th className="pe-3 py-3 text-center" style={{ width: "80px" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13.5px" }}>
                    {rules.map(r => (
                      <tr key={r.id} className="transition-all hover-row-focus">
                        <td className="ps-3 py-3.5 fw-bold text-gray-900">
                          {r.service?.name || "Servicio Eliminado"}
                        </td>
                        <td className="py-3.5">
                          <span className="d-flex align-items-center gap-1.5 fw-semibold text-purple-700">
                            <Package size={14} className="text-purple-500" />
                            <span>{r.product?.name || "Insumo Eliminado"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-center fw-bold text-gray-800">
                          {r.quantity} {r.product?.unit || "unidad"}s
                        </td>
                        <td className="pe-3 py-3.5 text-center">
                          <Button
                            variant="link"
                            className="text-red-500 hover-text-red-700 p-1 bg-transparent border-0"
                            onClick={() => handleDeleteRule(r.id, r.service?.name, r.product?.name)}
                            title="Eliminar regla de consumo"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* Rules Creation & Presets (Right column) */}
      <Col lg={4} className="d-flex flex-column gap-4">
        {/* Creation Form */}
        <Card className="card-premium border shadow-sm bg-white p-4 rounded-2xl">
          <Card.Body className="p-0">
            <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
              <Plus className="text-purple-600" size={18} />
              <span>Vincular Insumo a Tratamiento</span>
            </h3>

            {error && <Alert variant="danger" className="rounded-xl smaller py-2 mb-3">{error}</Alert>}
            {okMsg && <Alert variant="success" className="rounded-xl smaller py-2 mb-3">{okMsg}</Alert>}

            <Form onSubmit={handleCreateRule} className="d-grid gap-3">
              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">Elegir Servicio / Tratamiento *</Form.Label>
                <Form.Select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="border-gray-200 rounded-xl"
                  required
                >
                  <option value="">Selecciona el servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Precio: ${s.price})</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="smaller text-muted fw-bold">Asociar Insumo del Catálogo *</Form.Label>
                <Form.Select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="border-gray-200 rounded-xl"
                  required
                >
                  <option value="">Selecciona el insumo...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {p.unit})</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="smaller text-muted fw-bold">Dosis / Cantidad de Consumo *</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Ej: 80 (ml), 1 (unidad)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="border-gray-200 rounded-xl"
                  required
                />
                <Form.Text className="text-muted smaller">
                  Se descontará en la unidad métrica definida en la ficha del producto.
                </Form.Text>
              </Form.Group>

              <Button
                type="submit"
                variant="purple"
                disabled={saving || !serviceId || !productId || !quantity}
                className="rounded-xl py-3 fw-bold text-white bg-purple-600 hover-bg-purple-700 shadow border-0 d-flex align-items-center justify-content-center gap-1.5"
              >
                {saving ? <Spinner size="sm" /> : <CheckCircle size={16} />}
                <span>Vincular Insumo</span>
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* Industry Presets suggestions */}
        <Card className="card-premium border shadow-sm bg-white p-4 rounded-2xl">
          <Card.Body className="p-0">
            <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
              <Sparkles className="text-amber-500 animate-pulse" size={18} />
              <span>Plantillas sugeridas ({industry})</span>
            </h3>
            <p className="text-muted smaller mb-3">Recomendaciones estándar para vincular insumos a tratamientos típicos de tu rubro:</p>
            
            <div className="d-flex flex-column gap-2.5">
              {currentPresets.map((preset, idx) => {
                const canAutofill = preset.matchedProductId && preset.matchedServiceId;
                return (
                  <div 
                    key={idx}
                    className="p-3 border rounded-xl bg-light transition-all cursor-pointer hover-row-focus"
                    onClick={() => applyPreset(preset)}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <strong className="small text-gray-800">{preset.name}</strong>
                      {canAutofill ? (
                        <Badge bg="success-soft" className="text-success rounded-pill px-2 py-0.5 fw-bold" style={{ fontSize: "10px" }}>
                          Disponible
                        </Badge>
                      ) : (
                        <Badge bg="secondary-soft" className="text-secondary rounded-pill px-2 py-0.5" style={{ fontSize: "10px" }}>
                          Configurar
                        </Badge>
                      )}
                    </div>
                    <div className="smaller text-muted">
                      Consumo sugerido: <strong className="text-gray-800">{preset.quantity} {preset.unit}</strong> de <span className="text-purple-700 fw-medium">"{preset.productName}"</span> en <span className="text-purple-700 fw-medium">"{preset.serviceName}"</span>.
                    </div>
                    {!canAutofill && (
                      <div className="text-danger border-top pt-1.5 mt-1.5" style={{ fontSize: "10.5px" }}>
                        {!preset.matchedProductId && `• Registrar insumo con "${preset.productName}" `}
                        {!preset.matchedServiceId && `• Crear servicio con "${preset.serviceName}"`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
