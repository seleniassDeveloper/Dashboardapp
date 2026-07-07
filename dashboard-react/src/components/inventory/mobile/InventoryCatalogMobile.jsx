import React, { useState, useMemo } from "react";
import { Offcanvas, ListGroup, Form, Button, Badge, Spinner, Alert } from "react-bootstrap";
import { Search, Plus, Minus, Package, ChevronRight, PlusCircle, Sparkles, Trash2, Edit2, Sliders, DollarSign, Tag } from "lucide-react";
import api from "../../../lib/api.js";

function currency(n) {
  const num = Number(n);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}

export default function InventoryCatalogMobile({ products = [], suppliers = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState(null); // for Details Sheet
  const [adjustingId, setAdjustingId] = useState(null); // loading indicator for stock change
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // New product form state
  const [newForm, setNewForm] = useState({
    name: "",
    category: "",
    costPrice: "",
    salePrice: "",
    stock: "0",
    minStock: "5",
    unit: "unidad",
    barcode: "",
    location: "",
    providerId: ""
  });
  const [saving, setSaving] = useState(false);

  // Dynamic category list from products
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category).filter(Boolean));
    return ["Todos", ...Array.from(list)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.barcode || "").includes(searchTerm) ||
                            (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Handle rapid stock increase / decrease (+ / - buttons on card)
  const handleQuickAdjust = async (product, diff) => {
    try {
      setAdjustingId(product.id);
      setErrorMsg("");
      
      const payload = {
        productId: product.id,
        diff: Number(diff),
        type: diff > 0 ? "input" : "output",
        reason: diff > 0 ? "Ajuste rápido (+) catálogo móvil" : "Ajuste rápido (-) catálogo móvil"
      };

      await api.post("/inventory/movements", payload);
      
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(`No se pudo ajustar el stock de ${product.name}`);
    } finally {
      setAdjustingId(null);
    }
  };

  // Create new product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.costPrice || !newForm.minStock) {
      setErrorMsg("Por favor completa los campos obligatorios (*).");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const payload = {
        name: newForm.name.trim(),
        category: newForm.category.trim() || "General",
        costPrice: Number(newForm.costPrice),
        salePrice: newForm.salePrice ? Number(newForm.salePrice) : null,
        stock: Number(newForm.stock || 0),
        minStock: Number(newForm.minStock),
        unit: newForm.unit,
        barcode: newForm.barcode.trim() || null,
        location: newForm.location.trim() || null,
        providerId: newForm.providerId || null
      };

      await api.post("/inventory/products", payload);
      
      // Reset form & reload
      setNewForm({
        name: "",
        category: "",
        costPrice: "",
        salePrice: "",
        stock: "0",
        minStock: "5",
        unit: "unidad",
        barcode: "",
        location: "",
        providerId: ""
      });
      setShowAddSheet(false);
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.response?.data?.error || "Error al crear el producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inv-catalog-mobile animate-fade-in" style={{ paddingBottom: "30px" }}>
      {/* Header & Title */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="fw-black text-gray-900 h5 m-0 text-uppercase tracking-wider">Catálogo de Stock</h3>
        <Button 
          variant="purple" 
          onClick={() => setShowAddSheet(true)}
          className="rounded-xl px-3 py-2 text-white bg-purple-600 border-0 fw-bold small d-flex align-items-center gap-1 shadow-sm"
        >
          <Plus size={16} />
          <span>Añadir</span>
        </Button>
      </div>

      {errorMsg && <Alert variant="danger" className="rounded-xl smaller py-2 mb-3">{errorMsg}</Alert>}

      {/* Search Input */}
      <div className="i-search mb-3">
        <Search size={18} className="text-muted" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o código..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Horizontal Category Pill List */}
      <div className="d-flex overflow-auto gap-1.5 pb-2 mb-3 scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm rounded-pill px-3 py-1.5 border-0 fw-semibold text-nowrap transition-all ${
              selectedCategory === cat ? "bg-purple-600 text-white shadow-sm" : "bg-white text-muted border"
            }`}
            style={{ fontSize: "12px" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Card List */}
      <div className="d-grid gap-2.5">
        {filteredProducts.map(p => {
          const isLowStock = typeof p.stock === "number" && typeof p.minStock === "number" && p.stock < p.minStock;
          const isOutOfStock = p.stock <= 0;
          
          let badgeBg = "success-soft text-success";
          let badgeText = "Óptimo";
          if (isOutOfStock) {
            badgeBg = "danger-soft text-danger";
            badgeText = "Agotado";
          } else if (isLowStock) {
            badgeBg = "warning-soft text-warning";
            badgeText = "Bajo stock";
          }

          return (
            <div 
              key={p.id} 
              className="i-card p-3 d-flex align-items-center justify-content-between bg-white border"
              style={{ minHeight: "88px" }}
            >
              {/* Product Info (Click opens Details Sheet) */}
              <div 
                onClick={() => setSelectedProduct(p)} 
                className="flex-grow-1 min-width-0 pe-2 cursor-pointer"
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className={`badge rounded-pill px-2 py-0.5 small ${badgeBg}`} style={{ fontSize: "9px" }}>
                    {badgeText}
                  </span>
                  <span className="smaller text-muted text-uppercase tracking-wider font-semibold" style={{ fontSize: "9px" }}>
                    {p.category}
                  </span>
                </div>
                <strong className="text-gray-900 small d-block text-truncate mb-0.5">{p.name}</strong>
                <span className="smaller text-muted d-block">{currency(p.costPrice)} c/u</span>
              </div>

              {/* Stock Adjust Counter Controls */}
              <div className="d-flex align-items-center bg-light bg-opacity-60 border rounded-pill px-1.5 py-1 gap-2.5">
                <button 
                  onClick={() => handleQuickAdjust(p, -1)}
                  disabled={adjustingId === p.id || p.stock <= 0}
                  className="btn btn-xs rounded-circle border bg-white text-gray-700 p-1.5 d-flex align-items-center justify-content-center"
                  style={{ width: "28px", height: "28px" }}
                >
                  <Minus size={14} />
                </button>
                
                <span className="fw-black text-gray-900 small text-center" style={{ minWidth: "22px", fontSize: "14px" }}>
                  {adjustingId === p.id ? (
                    <Spinner animation="border" size="sm" style={{ width: "12px", height: "12px" }} className="text-purple-600" />
                  ) : (
                    p.stock
                  )}
                </span>

                <button 
                  onClick={() => handleQuickAdjust(p, 1)}
                  disabled={adjustingId === p.id}
                  className="btn btn-xs rounded-circle border bg-white text-gray-700 p-1.5 d-flex align-items-center justify-content-center"
                  style={{ width: "28px", height: "28px" }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-5 text-muted smaller bg-white rounded-2xl border">
            No se encontraron productos en esta categoría.
          </div>
        )}
      </div>

      {/* Product Details Sheet */}
      <Offcanvas 
        show={!!selectedProduct} 
        onHide={() => setSelectedProduct(null)} 
        placement="bottom" 
        className="inv-mobile-fab-sheet rounded-top-3xl border-0 shadow-lg"
        style={{ height: "auto" }}
      >
        {selectedProduct && (
          <>
            <Offcanvas.Header closeButton className="p-3 border-bottom bg-light">
              <Offcanvas.Title className="fw-black h6 text-gray-900 m-0">Detalles del Insumo</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-4">
              <div className="text-center mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-circle d-inline-flex mb-2">
                  <Package size={26} />
                </div>
                <h4 className="fw-black text-gray-900 h6 mb-1">{selectedProduct.name}</h4>
                <Badge bg="purple-soft" className="text-purple-600 rounded-pill px-2.5 py-1 smaller">{selectedProduct.category}</Badge>
              </div>

              <div className="d-grid gap-2 bg-light bg-opacity-40 p-3 rounded-2xl border small mb-4">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Stock actual:</span>
                  <strong className="text-gray-900">{selectedProduct.stock} {selectedProduct.unit}s</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Stock mínimo de seguridad:</span>
                  <strong className="text-gray-900">{selectedProduct.minStock} {selectedProduct.unit}s</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Precio Costo:</span>
                  <strong className="text-gray-900">{currency(selectedProduct.costPrice)}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Precio Venta sugerido:</span>
                  <strong className="text-gray-950">{selectedProduct.salePrice ? currency(selectedProduct.salePrice) : "No a la venta"}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Código de Barra:</span>
                  <strong className="text-mono">{selectedProduct.barcode || "Sin registrar"}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Ubicación física:</span>
                  <strong className="text-gray-900">{selectedProduct.location || "General"}</strong>
                </div>
                {selectedProduct.provider && (
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Proveedor principal:</span>
                    <strong className="text-purple-600">{selectedProduct.provider.name}</strong>
                  </div>
                )}
              </div>

              <Button 
                variant="light" 
                onClick={() => setSelectedProduct(null)} 
                className="w-100 rounded-xl py-2.5 fw-bold text-gray-800 bg-white border"
              >
                Cerrar Detalle
              </Button>
            </Offcanvas.Body>
          </>
        )}
      </Offcanvas>

      {/* Add Product Bottom Sheet */}
      <Offcanvas 
        show={showAddSheet} 
        onHide={() => setShowAddSheet(false)} 
        placement="bottom" 
        className="inv-mobile-fab-sheet rounded-top-3xl border-0 shadow-lg"
        style={{ height: "90vh" }}
      >
        <Offcanvas.Header closeButton className="p-3 border-bottom bg-light">
          <Offcanvas.Title className="fw-black h6 text-gray-900 m-0">Añadir Nuevo Producto</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-4 overflow-auto">
          <Form onSubmit={handleCreateProduct} className="d-grid gap-3.5">
            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">Nombre del Insumo *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Shampoo Pantene 400ml"
                value={newForm.name}
                onChange={(e) => setNewForm(p => ({ ...p, name: e.target.value }))}
                className="rounded-xl border-gray-200"
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">Categoría</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Shampoos, Tinturas"
                value={newForm.category}
                onChange={(e) => setNewForm(p => ({ ...p, category: e.target.value }))}
                className="rounded-xl border-gray-200"
              />
            </Form.Group>

            <div className="d-grid grid-cols-2 gap-3">
              <Form.Group>
                <Form.Label className="small fw-bold text-gray-700">Precio Costo *</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0"
                  value={newForm.costPrice}
                  onChange={(e) => setNewForm(p => ({ ...p, costPrice: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-bold text-gray-700">Precio Venta</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0 (Opcional)"
                  value={newForm.salePrice}
                  onChange={(e) => setNewForm(p => ({ ...p, salePrice: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
              </Form.Group>
            </div>

            <div className="d-grid grid-cols-2 gap-3">
              <Form.Group>
                <Form.Label className="small fw-bold text-gray-700">Stock Inicial *</Form.Label>
                <Form.Control
                  type="number"
                  value={newForm.stock}
                  onChange={(e) => setNewForm(p => ({ ...p, stock: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-bold text-gray-700">Stock Mínimo *</Form.Label>
                <Form.Control
                  type="number"
                  value={newForm.minStock}
                  onChange={(e) => setNewForm(p => ({ ...p, minStock: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  required
                />
              </Form.Group>
            </div>

            <div className="d-grid grid-cols-2 gap-3">
              <Form.Group>
                <Form.Label className="small fw-bold text-gray-700">Unidad de Medida</Form.Label>
                <Form.Select
                  value={newForm.unit}
                  onChange={(e) => setNewForm(p => ({ ...p, unit: e.target.value }))}
                  className="rounded-xl border-gray-200"
                >
                  <option value="unidad">unidad</option>
                  <option value="ml">ml</option>
                  <option value="gr">gramos</option>
                  <option value="litro">litros</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-bold text-gray-700">Ubicación Física</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej: Estante B"
                  value={newForm.location}
                  onChange={(e) => setNewForm(p => ({ ...p, location: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
              </Form.Group>
            </div>

            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">Código de Barra</Form.Label>
              <Form.Control
                type="text"
                placeholder="Escanea o ingresa EAN"
                value={newForm.barcode}
                onChange={(e) => setNewForm(p => ({ ...p, barcode: e.target.value }))}
                className="rounded-xl border-gray-200"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold text-gray-700">Proveedor</Form.Label>
              <Form.Select
                value={newForm.providerId}
                onChange={(e) => setNewForm(p => ({ ...p, providerId: e.target.value }))}
                className="rounded-xl border-gray-200"
              >
                <option value="">Selecciona proveedor...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2 mt-2">
              <Button 
                type="submit" 
                variant="purple" 
                disabled={saving}
                className="rounded-xl py-2.5 text-white bg-purple-600 hover-bg-purple-700 border-0 fw-bold"
              >
                {saving ? "Creando..." : "Guardar Producto"}
              </Button>
              <Button 
                variant="light" 
                onClick={() => setShowAddSheet(false)}
                className="rounded-xl py-2.5 text-gray-800 bg-white border"
              >
                Cancelar
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
