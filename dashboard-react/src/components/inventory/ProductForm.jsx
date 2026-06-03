import React, { useState, useMemo } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Badge, Modal, Alert } from "react-bootstrap";
import { 
  Plus, Edit3, Trash2, Tag, DollarSign, Package, AlertTriangle, 
  Building, Barcode, Grid, List, Scan, CheckCircle, Search, 
  Droplet, Sparkles, Scissors, Box, HelpCircle
} from "lucide-react";
import api from "../../lib/api.js";

const PRESET_COLORS = [
  { id: "violet", hex: "#8b5cf6", name: "Violeta", bg: "rgba(139, 92, 246, 0.08)", text: "#8b5cf6" },
  { id: "blue", hex: "#3b82f6", name: "Azul", bg: "rgba(59, 130, 246, 0.08)", text: "#3b82f6" },
  { id: "emerald", hex: "#10b981", name: "Verde", bg: "rgba(16, 185, 129, 0.08)", text: "#10b981" },
  { id: "pink", hex: "#ec4899", name: "Rosa", bg: "rgba(236, 72, 153, 0.08)", text: "#ec4899" },
  { id: "amber", hex: "#f59e0b", name: "Amarillo", bg: "rgba(245, 158, 11, 0.08)", text: "#f59e0b" },
  { id: "cyan", hex: "#06b6d4", name: "Cian", bg: "rgba(6, 182, 212, 0.08)", text: "#06b6d4" },
  { id: "red", hex: "#ef4444", name: "Rojo", bg: "rgba(239, 68, 68, 0.08)", text: "#ef4444" },
  { id: "gray", hex: "#6b7280", name: "Gris", bg: "rgba(107, 114, 128, 0.08)", text: "#6b7280" }
];

const PRESET_ICONS = [
  { id: "package", name: "Caja", component: Package },
  { id: "droplet", name: "Gota / Líquido", component: Droplet },
  { id: "sparkles", name: "Destellos / Premium", component: Sparkles },
  { id: "scissors", name: "Tijera / Herramienta", component: Scissors },
  { id: "box", name: "Envase / Pote", component: Box }
];

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ProductForm({ products = [], suppliers = [], onRefresh }) {
  // Navigation & Filters
  const [viewMode, setViewMode] = useState("card"); // 'card' | 'table'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states for Create/Edit
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Coloración");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("5");
  const [minStock, setMinStock] = useState("3");
  const [maxStock, setMaxStock] = useState("10");
  const [unit, setUnit] = useState("unidad");
  const [barcode, setBarcode] = useState("");
  const [location, setLocation] = useState("");
  const [providerId, setProviderId] = useState("");
  
  // Custom Fields (Color, Icon, Label)
  const [selectedColor, setSelectedColor] = useState("gray");
  const [selectedIcon, setSelectedIcon] = useState("package");
  const [customLabel, setCustomLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // Scanning Modal States
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanQtyChange, setScanQtyChange] = useState("1");
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanErrorMsg, setScanErrorMsg] = useState("");
  const [scanSuccessMsg, setScanSuccessMsg] = useState("");
  const [scanState, setScanState] = useState("idle"); // 'idle' | 'detected' | 'not_found'
  const [scanning, setScanning] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ["TODAS", ...Array.from(list)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchTerm)) ||
                          (p.label && p.label.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === "TODAS" || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setCategory("Coloración");
    setCostPrice("");
    setSalePrice("");
    setStock("5");
    setMinStock("3");
    setMaxStock("10");
    setUnit("unidad");
    setBarcode("");
    setLocation("");
    setProviderId("");
    setSelectedColor("gray");
    setSelectedIcon("package");
    setCustomLabel("");
    setShowCreateModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSalePrice(p.salePrice || "");
    setStock(p.stock);
    setMinStock(p.minStock);
    setMaxStock(p.maxStock || 10);
    setUnit(p.unit || "unidad");
    setBarcode(p.barcode || "");
    setLocation(p.location || "");
    setProviderId(p.providerId || "");
    setSelectedColor(p.color || "gray");
    setSelectedIcon(p.icon || "package");
    setCustomLabel(p.label || "");
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !costPrice || !minStock) return;

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        category,
        costPrice: Number(costPrice),
        salePrice: salePrice ? Number(salePrice) : null,
        stock: Number(stock),
        minStock: Number(minStock),
        maxStock: Number(maxStock),
        unit,
        barcode: barcode.trim() || null,
        location: location.trim() || null,
        providerId: providerId || null,
        color: selectedColor,
        icon: selectedIcon,
        label: customLabel.trim() || null
      };

      if (editingProduct) {
        await api.put(`/inventory/products/${editingProduct.id}`, payload);
        setShowEditModal(false);
      } else {
        await api.post("/inventory/products", payload);
        setShowCreateModal(false);
      }

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al guardar el insumo en el catálogo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar "${p.name}" del catálogo?`);
    if (!confirm) return;

    try {
      await api.delete(`/inventory/products/${p.id}`);
      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el producto del inventario.");
    }
  };

  // Scanning simulation flows
  const handleOpenScan = () => {
    setBarcodeInput("");
    setScanQtyChange("1");
    setScannedProduct(null);
    setScanErrorMsg("");
    setScanSuccessMsg("");
    setScanState("idle");
    setShowScanModal(true);
  };

  const handleSimulateBarcodeDisparo = (prodId) => {
    setScanErrorMsg("");
    setScanSuccessMsg("");
    const matched = products.find(p => p.id === prodId);
    if (matched) {
      setScannedProduct(matched);
      setBarcodeInput(matched.barcode || `779${Math.floor(100000 + Math.random() * 900000)}`);
      setScanState("detected");
    }
  };

  const handleScanLookup = () => {
    setScanErrorMsg("");
    setScanSuccessMsg("");
    if (!barcodeInput.trim()) return;

    const matched = products.find(p => p.barcode === barcodeInput.trim());
    if (matched) {
      setScannedProduct(matched);
      setScanState("detected");
    } else {
      setScanState("not_found");
    }
  };

  const handleSaveScanInventory = async () => {
    if (!scannedProduct || !scanQtyChange) return;

    try {
      setScanning(true);
      setScanErrorMsg("");
      setScanSuccessMsg("");

      const diff = Number(scanQtyChange);
      const payload = {
        productId: scannedProduct.id,
        diff,
        type: "input",
        reason: "Carga rápida por escaneo de código de barra"
      };

      const res = await api.post("/inventory/movements", payload);
      setScanSuccessMsg(`¡Stock cargado con éxito! Nuevo stock de ${scannedProduct.name}: ${res.data.newQty} unidades.`);
      setScannedProduct(prev => ({ ...prev, stock: res.data.newQty }));

      if (typeof onRefresh === "function") {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setScanErrorMsg("Error al actualizar existencias.");
    } finally {
      setScanning(false);
    }
  };

  const handleDeepLinkCreateFromScan = () => {
    setShowScanModal(false);
    handleOpenCreate();
    setBarcode(barcodeInput);
  };

  // Helper colors and icons
  const getProductColorPreset = (colorId) => {
    return PRESET_COLORS.find(c => c.id === colorId) || PRESET_COLORS[7]; // gray default
  };

  const renderProductIcon = (iconId, colorHex, size = 18) => {
    const found = PRESET_ICONS.find(i => i.id === iconId);
    const IconComp = found ? found.component : Package;
    return <IconComp size={size} style={{ color: colorHex }} />;
  };

  return (
    <div className="animate-fade-in">
      {/* FILTER BAR & ACTION BUTTONS */}
      <Card className="card-premium border shadow-sm bg-white p-3 rounded-2xl mb-4">
        <Row className="g-3 align-items-center">
          <Col md={4} xs={12}>
            <div className="position-relative">
              <Search className="position-absolute text-muted" size={16} style={{ left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <Form.Control
                type="text"
                placeholder="Buscar insumos por nombre, código o etiqueta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-200 rounded-xl small ps-5"
                style={{ height: "42px" }}
              />
            </div>
          </Col>
          <Col md={3} xs={12}>
            <Form.Select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)} 
              className="border-gray-200 rounded-xl small"
              style={{ height: "42px" }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === "TODAS" ? "Todas las Categorías" : cat}</option>
              ))}
            </Form.Select>
          </Col>
          
          <Col md={5} xs={12} className="d-flex justify-content-md-end gap-2 flex-wrap">
            {/* View Mode toggler */}
            <div className="btn-group border rounded-xl overflow-hidden shadow-sm" style={{ height: "42px" }}>
              <Button 
                variant={viewMode === "card" ? "dark" : "light"} 
                onClick={() => setViewMode("card")}
                className="d-flex align-items-center justify-content-center px-3 border-0 rounded-none bg-opacity-90"
              >
                <Grid size={16} />
              </Button>
              <Button 
                variant={viewMode === "table" ? "dark" : "light"} 
                onClick={() => setViewMode("table")}
                className="d-flex align-items-center justify-content-center px-3 border-0 rounded-none bg-opacity-90"
              >
                <List size={16} />
              </Button>
            </div>

            {/* Scan button */}
            <Button
              onClick={handleOpenScan}
              className="rounded-xl px-3 fw-bold text-gray-800 bg-white border border-gray-200 d-flex align-items-center gap-1.5 shadow-sm"
              style={{ height: "42px" }}
            >
              <Scan size={16} className="text-purple-600" />
              <span>Agregar por Escaneo</span>
            </Button>

            {/* Add product button */}
            <Button
              onClick={handleOpenCreate}
              className="rounded-xl px-4 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0 d-flex align-items-center gap-1.5 shadow-sm"
              style={{ height: "42px" }}
            >
              <Plus size={16} />
              <span>Añadir Producto</span>
            </Button>
          </Col>
        </Row>
      </Card>

      {/* RENDER PRODUCTS LISTS */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-5 text-muted small bg-white border rounded-2xl shadow-sm">
          <Package className="text-gray-300 mb-2" size={40} />
          <div>No se encontraron productos registrados que coincidan con la búsqueda.</div>
        </div>
      ) : viewMode === "card" ? (
        /* CARD GRID VIEW */
        <Row className="g-3">
          {filteredProducts.map(p => {
            const isLow = p.stock < p.minStock;
            const colorPreset = getProductColorPreset(p.color);
            return (
              <Col lg={3} md={4} sm={6} key={p.id}>
                <Card className="card-premium border shadow-sm bg-white h-100 rounded-2xl overflow-hidden transition-all hover-scale position-relative">
                  <Card.Body className="p-4 d-flex flex-column justify-content-between" style={{ minHeight: "220px" }}>
                    <div>
                      {/* Badge / Tag indicator */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <Badge 
                          style={{ backgroundColor: colorPreset.bg, color: colorPreset.text, border: `1px solid ${colorPreset.hex}25` }} 
                          className="rounded-pill px-2.5 py-1.5 d-flex align-items-center gap-1.5 fw-bold"
                        >
                          {renderProductIcon(p.icon, colorPreset.hex, 12)}
                          <span>{p.label || p.category}</span>
                        </Badge>

                        {isLow ? (
                          <Badge bg="danger-soft" className="text-danger rounded-pill px-2.5 py-1.5 fw-bold d-flex align-items-center gap-1">
                            <AlertTriangle size={11} className="animate-pulse" />
                            <span>Crítico</span>
                          </Badge>
                        ) : (
                          <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1.5 fw-bold">Óptimo</Badge>
                        )}
                      </div>

                      {/* Title & Details */}
                      <h4 className="fw-black text-gray-900 h6 mb-1 text-truncate" title={p.name}>{p.name}</h4>
                      <p className="text-muted smaller mb-3">{p.provider?.name || "Sin Proveedor Registrado"}</p>

                      <div className="d-flex justify-content-between align-items-baseline mb-2">
                        <span className="smaller text-muted">Stock actual:</span>
                        <strong className={isLow ? "text-danger fw-black" : "text-gray-900 fw-black"} style={{ fontSize: "16px" }}>
                          {p.stock} <span className="smaller font-normal">{p.unit}</span>
                        </strong>
                      </div>

                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="smaller text-muted">Precio costo:</span>
                        <strong className="text-gray-800 small">{currency(p.costPrice)}</strong>
                      </div>
                    </div>

                    {/* Action links */}
                    <div className="border-top pt-3 mt-3 d-flex justify-content-end gap-2.5">
                      <button 
                        className="btn btn-sm btn-light border p-2 rounded-xl text-gray-600" 
                        onClick={() => handleOpenEdit(p)}
                        title="Editar Producto"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        className="btn btn-sm btn-light border p-2 rounded-xl text-red-500 hover-bg-red-50" 
                        onClick={() => handleDelete(p)}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* TABLE VIEW */
        <Card className="card-premium border shadow-sm bg-white p-4 rounded-2xl">
          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                  <th className="ps-3 py-3">Identificador / Insumo</th>
                  <th className="py-3">Categoría</th>
                  <th className="py-3">Precio Costo</th>
                  <th className="py-3">Proveedor</th>
                  <th className="py-3 text-center">Stock Físico</th>
                  <th className="py-3 text-center">Estado Alerta</th>
                  <th className="pe-3 py-3 text-center" style={{ width: "90px" }}>Acción</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13.5px" }}>
                {filteredProducts.map(p => {
                  const isLow = p.stock < p.minStock;
                  const colorPreset = getProductColorPreset(p.color);
                  return (
                    <tr key={p.id} className="transition-all hover-row-focus">
                      <td className="ps-3 py-3">
                        <div className="d-flex align-items-center gap-2.5">
                          <div 
                            className="rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm"
                            style={{ backgroundColor: colorPreset.bg, border: `1px solid ${colorPreset.hex}25` }}
                          >
                            {renderProductIcon(p.icon, colorPreset.hex, 14)}
                          </div>
                          <div>
                            <div className="fw-bold text-gray-900">{p.name}</div>
                            {p.label && <span className="smaller text-muted bg-gray-50 px-1.5 py-0.5 rounded border">{p.label}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge bg="light" className="text-secondary border rounded-pill px-2.5 py-1.5" style={{ fontSize: "10.5px" }}>
                          {p.category}
                        </Badge>
                      </td>
                      <td className="py-3 fw-bold text-gray-800">{currency(p.costPrice)}</td>
                      <td className="py-3 text-muted small">{p.provider?.name || "Sin Proveedor"}</td>
                      <td className="py-3 text-center">
                        <strong style={{ fontSize: "14px" }} className={isLow ? "text-danger fw-black" : "text-gray-900 fw-bold"}>
                          {p.stock} {p.unit}
                        </strong>
                      </td>
                      <td className="py-3 text-center">
                        {isLow ? (
                          <Badge bg="danger-soft" className="text-danger rounded-pill px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
                            <AlertTriangle size={11} className="animate-pulse" />
                            <span>Crítico (Límite: {p.minStock})</span>
                          </Badge>
                        ) : (
                          <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1.5 fw-bold">Óptimo</Badge>
                        )}
                      </td>
                      <td className="pe-3 py-3 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <Button 
                            variant="link" 
                            className="text-purple-600 hover-text-purple-800 p-1 bg-transparent border-0"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit3 size={15} />
                          </Button>
                          <Button 
                            variant="link" 
                            className="text-red-500 hover-text-red-700 p-1 bg-transparent border-0"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* CREATE PRODUCT MODAL */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered className="border-0 shadow-lg animate-fade-in">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <Plus className="text-purple-600" size={20} />
            <span>Añadir Nuevo Insumo al Inventario</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4 d-grid gap-3">
            <Form.Group>
              <Form.Label className="smaller text-muted fw-bold">Nombre del Producto *</Form.Label>
              <Form.Control
                placeholder="Ej: Shampoo Profesional Keratina 1L"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-gray-200 rounded-xl"
                required
              />
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Categoría *</Form.Label>
                  <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="Coloración">Coloración</option>
                    <option value="Lavado">Lavado</option>
                    <option value="Tratamientos">Tratamientos</option>
                    <option value="Manicuría">Manicuría</option>
                    <option value="Estética">Estética</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Unidad de Medida *</Form.Label>
                  <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="unidad">Unidad</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="gr">Gramos (gr)</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* COLOR & ICON SELECTION */}
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold d-block mb-2">Color Identificador</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {PRESET_COLORS.map(col => (
                      <div
                        key={col.id}
                        onClick={() => setSelectedColor(col.id)}
                        className="rounded-circle cursor-pointer border transition-all hover-scale"
                        style={{
                          width: "24px",
                          height: "24px",
                          backgroundColor: col.hex,
                          borderColor: selectedColor === col.id ? "#111827" : "rgba(0,0,0,0.1)",
                          borderWidth: selectedColor === col.id ? "2.5px" : "1px",
                          boxShadow: selectedColor === col.id ? "0 0 4px rgba(0,0,0,0.2)" : "none"
                        }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Icono Representativo</Form.Label>
                  <div className="d-flex gap-2">
                    {PRESET_ICONS.map(ic => {
                      const IconComponent = ic.component;
                      const isSelected = selectedIcon === ic.id;
                      return (
                        <div
                          key={ic.id}
                          onClick={() => setSelectedIcon(ic.id)}
                          className={`p-2 border rounded-xl cursor-pointer hover-scale transition-all d-flex align-items-center justify-content-center ${
                            isSelected ? "border-dark bg-dark text-white" : "bg-light text-secondary"
                          }`}
                          style={{ width: "36px", height: "36px" }}
                          title={ic.name}
                        >
                          <IconComponent size={16} />
                        </div>
                      );
                    })}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Precio Costo ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="4500"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Precio Venta (Opcional)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="9000"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Inicial</Form.Label>
                  <Form.Control
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Min</Form.Label>
                  <Form.Control
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Ideal</Form.Label>
                  <Form.Control
                    type="number"
                    value={maxStock}
                    onChange={(e) => setMaxStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Etiqueta Rápida (Ej: Shampoo, Tinte)</Form.Label>
                  <Form.Control
                    placeholder="Ej: Tinte"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Proveedor Asociado</Form.Label>
                  <Form.Select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">Ninguno</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Ubicación Interna</Form.Label>
                  <Form.Control
                    placeholder="Ej: Estante A1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Código Barras/QR</Form.Label>
                  <Form.Control
                    placeholder="Ej: 779012..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)} className="rounded-xl px-4" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={saving} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow border-0">
              {saving ? <Spinner size="sm" /> : "Guardar Producto"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="border-0 shadow-lg animate-fade-in">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <Edit3 className="text-purple-600" size={20} />
            <span>Editar Ficha Técnica de Insumo</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4 d-grid gap-3">
            <Form.Group>
              <Form.Label className="smaller text-muted fw-bold">Nombre del Producto *</Form.Label>
              <Form.Control
                placeholder="Ej: Shampoo Profesional Keratina 1L"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-gray-200 rounded-xl"
                required
              />
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Categoría *</Form.Label>
                  <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="Coloración">Coloración</option>
                    <option value="Lavado">Lavado</option>
                    <option value="Tratamientos">Tratamientos</option>
                    <option value="Manicuría">Manicuría</option>
                    <option value="Estética">Estética</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Unidad de Medida *</Form.Label>
                  <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="unidad">Unidad</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="gr">Gramos (gr)</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* COLOR & ICON SELECTION */}
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold d-block mb-2">Color Identificador</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {PRESET_COLORS.map(col => (
                      <div
                        key={col.id}
                        onClick={() => setSelectedColor(col.id)}
                        className="rounded-circle cursor-pointer border transition-all hover-scale"
                        style={{
                          width: "24px",
                          height: "24px",
                          backgroundColor: col.hex,
                          borderColor: selectedColor === col.id ? "#111827" : "rgba(0,0,0,0.1)",
                          borderWidth: selectedColor === col.id ? "2.5px" : "1px",
                          boxShadow: selectedColor === col.id ? "0 0 4px rgba(0,0,0,0.2)" : "none"
                        }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Icono Representativo</Form.Label>
                  <div className="d-flex gap-2">
                    {PRESET_ICONS.map(ic => {
                      const IconComponent = ic.component;
                      const isSelected = selectedIcon === ic.id;
                      return (
                        <div
                          key={ic.id}
                          onClick={() => setSelectedIcon(ic.id)}
                          className={`p-2 border rounded-xl cursor-pointer hover-scale transition-all d-flex align-items-center justify-content-center ${
                            isSelected ? "border-dark bg-dark text-white" : "bg-light text-secondary"
                          }`}
                          style={{ width: "36px", height: "36px" }}
                          title={ic.name}
                        >
                          <IconComponent size={16} />
                        </div>
                      );
                    })}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Precio Costo ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="4500"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Precio Venta (Opcional)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="9000"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Actual *</Form.Label>
                  <Form.Control
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Min</Form.Label>
                  <Form.Control
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Stock Ideal</Form.Label>
                  <Form.Control
                    type="number"
                    value={maxStock}
                    onChange={(e) => setMaxStock(e.target.value)}
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Etiqueta Rápida (Ej: Shampoo, Tinte)</Form.Label>
                  <Form.Control
                    placeholder="Ej: Tinte"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Proveedor Asociado</Form.Label>
                  <Form.Select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">Ninguno</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Ubicación Interna</Form.Label>
                  <Form.Control
                    placeholder="Ej: Estante A1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Código Barras/QR</Form.Label>
                  <Form.Control
                    placeholder="Ej: 779012..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button variant="outline-secondary" onClick={() => setShowEditModal(false)} className="rounded-xl px-4" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={saving} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow border-0">
              {saving ? <Spinner size="sm" /> : "Guardar Cambios"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* SCANNING / FLOW MODAL */}
      <Modal show={showScanModal} onHide={() => setShowScanModal(false)} centered size="lg" className="border-0 shadow-lg animate-fade-in">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <Scan size={20} className="text-purple-600" />
            <span>Agregar Existencias por Escaneo</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row className="g-4">
            {/* LASER CAMERA SIMULATOR (Left Column) */}
            <Col md={6} xs={12}>
              <div className="p-4 bg-dark text-white rounded-2xl h-100 d-flex flex-column align-items-center justify-content-between" style={{ minHeight: "280px" }}>
                <div className="text-center w-100 mb-2">
                  <h5 className="small fw-bold text-white mb-1">Simulador de Cámara Láser</h5>
                  <p className="smaller text-gray-400 mb-0">Hacé click en un insumo para emular que la cámara del celular lee su código de barras.</p>
                </div>
                
                {/* Horizontal red laser line */}
                <div className="w-100 rounded-xl bg-black border border-gray-800 position-relative d-flex align-items-center justify-content-center my-3" style={{ height: "130px", overflow: "hidden" }}>
                  <div 
                    className="position-absolute bg-red-500 w-100 animate-pulse" 
                    style={{ 
                      height: "2.5px", 
                      boxShadow: "0 0 10px #ef4444, 0 0 20px #ef4444",
                      top: "50%",
                      left: 0,
                      transform: "translateY(-50%)"
                    }} 
                  />
                  <div className="text-center p-2 opacity-50">
                    <Barcode size={48} className="text-gray-400 mb-1" />
                    <div className="smaller text-gray-500">CÁMARA ACTIVA AURA</div>
                  </div>
                </div>

                <div className="w-100">
                  <Form.Label className="smaller text-gray-400 fw-bold d-block mb-1">Elegir producto para simular escaneo</Form.Label>
                  <Form.Select 
                    className="bg-gray-900 border-gray-800 text-white rounded-xl small"
                    onChange={(e) => handleSimulateBarcodeDisparo(e.target.value)}
                  >
                    <option value="">Selecciona un producto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.barcode || "Sin código"})</option>
                    ))}
                  </Form.Select>
                </div>
              </div>
            </Col>

            {/* SCANNING RESULTS AND ACTION FORM (Right Column) */}
            <Col md={6} xs={12}>
              <div className="d-flex flex-column justify-content-between h-100" style={{ minHeight: "280px" }}>
                <div>
                  <h5 className="small fw-bold text-gray-900 mb-3">Lectura del Código de Barras</h5>

                  {scanErrorMsg && <Alert variant="danger" className="rounded-xl smaller py-2 mb-2">{scanErrorMsg}</Alert>}
                  {scanSuccessMsg && <Alert variant="success" className="rounded-xl smaller py-2 mb-2">{scanSuccessMsg}</Alert>}

                  {/* Manual Barcode Input */}
                  <div className="p-3 bg-light rounded-xl border border-gray-150 mb-3">
                    <Form.Label className="smaller text-muted fw-bold d-block mb-1.5">Búsqueda Directa Manual</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        placeholder="Ej: 779012..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="border-gray-200 rounded-xl small"
                      />
                      <Button variant="dark" onClick={handleScanLookup} className="rounded-xl fw-bold text-white bg-gray-900 px-3 py-1.5 small">
                        Buscar
                      </Button>
                    </div>
                  </div>

                  {/* Flow states */}
                  {scanState === "detected" && scannedProduct && (
                    <div className="p-3 rounded-xl border border-purple-100 bg-purple-50 bg-opacity-30">
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="smaller text-purple-950 fw-bold">{scannedProduct.category}</span>
                        <Badge bg="purple" className="rounded-pill px-2.5 py-0.5" style={{ fontSize: "9px" }}>Registrado</Badge>
                      </div>
                      <h6 className="fw-black text-gray-900 mb-2">{scannedProduct.name}</h6>
                      <div className="d-flex justify-content-between smaller text-muted pt-2 border-top border-purple-100">
                        <span>Stock Actual: <strong>{scannedProduct.stock} {scannedProduct.unit}</strong></span>
                        <span>Costo: <strong>{currency(scannedProduct.costPrice)}</strong></span>
                      </div>
                    </div>
                  )}

                  {scanState === "not_found" && (
                    <div className="p-3 rounded-xl border border-warning-soft bg-warning bg-opacity-5 text-center">
                      <AlertTriangle size={24} className="text-warning mb-2" />
                      <div className="fw-bold small text-gray-900 mb-1">Código de barra no encontrado</div>
                      <p className="smaller text-muted mb-3">El código "{barcodeInput}" no pertenece a ningún insumo en stock.</p>
                      <Button 
                        variant="warning" 
                        onClick={handleDeepLinkCreateFromScan}
                        className="rounded-xl fw-bold text-dark w-100 small"
                      >
                        Crear Nuevo Producto con este Código
                      </Button>
                    </div>
                  )}

                  {scanState === "idle" && (
                    <div className="text-center py-4 text-muted smaller bg-gray-50 rounded-xl border border-gray-150">
                      Usa el simulador láser de la izquierda o escribe el código para cargar inventario en un clic.
                    </div>
                  )}
                </div>

                {/* Form to submit additions */}
                {scanState === "detected" && scannedProduct && (
                  <div className="pt-3 border-top border-gray-150">
                    <Form.Group className="mb-3">
                      <Form.Label className="smaller text-muted fw-bold">Cantidad de Unidades a Cargar</Form.Label>
                      <Form.Control
                        type="number"
                        value={scanQtyChange}
                        onChange={(e) => setScanQtyChange(e.target.value)}
                        className="border-gray-200 rounded-xl small"
                        required
                      />
                    </Form.Group>

                    <Button
                      variant="purple"
                      disabled={scanning || !scanQtyChange}
                      onClick={handleSaveScanInventory}
                      className="w-100 rounded-xl py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0 d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                    >
                      {scanning ? <Spinner size="sm" /> : <CheckCircle size={16} />}
                      <span>Agregar al Inventario</span>
                    </Button>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
          <Button variant="outline-secondary" onClick={() => setShowScanModal(false)} className="rounded-xl px-4 small">
            Cerrar Escáner
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
