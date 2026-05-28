import React, { useState, useEffect } from "react";
import { Container, Button, Row, Col, Spinner, Alert, Badge, Card, Form } from "react-bootstrap";
import {
  Package, AlertTriangle, Activity, User, ShoppingCart,
  Layers, Scan, DollarSign, Building, Sliders, Bot, Scissors
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../lib/api.js";

// ERP inventory sub-modules
import InventoryDashboard from "../components/inventory/InventoryDashboard.jsx";
import ProductForm from "../components/inventory/ProductForm.jsx";
import StockMovementHistory from "../components/inventory/StockMovementHistory.jsx";
import SupplierCRUD from "../components/inventory/SupplierCRUD.jsx";
import PurchaseOrders from "../components/inventory/PurchaseOrders.jsx";
import BatchControl from "../components/inventory/BatchControl.jsx";
import BarcodeScanner from "../components/inventory/BarcodeScanner.jsx";
import ProductProfitability from "../components/inventory/ProductProfitability.jsx";
import BranchInventory from "../components/inventory/BranchInventory.jsx";
import InventorySimulator from "../components/inventory/InventorySimulator.jsx";
import InventoryAIInsights from "../components/inventory/InventoryAIInsights.jsx";
import ServiceConsumptionRules from "../components/inventory/ServiceConsumptionRules.jsx";

export default function InventoryView() {
  const { t } = useTranslation("views");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("resumen");

  // State populated from Neon Cloud DB
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rules, setRules] = useState([]);
  const [movements, setMovements] = useState([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashRes, prodRes, supRes, ruleRes, movRes] = await Promise.all([
        api.get("/inventory/dashboard"),
        api.get("/inventory/products"),
        api.get("/inventory/suppliers"),
        api.get("/inventory/rules"),
        api.get("/inventory/movements")
      ]);

      setDashboardData(dashRes.data);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
      setRules(Array.isArray(ruleRes.data) ? ruleRes.data : []);
      setMovements(Array.isArray(movRes.data) ? movRes.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos del inventario ERP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading && !dashboardData) {
    return (
      <div className="text-center py-5 text-muted animate-pulse" style={{ minHeight: "60vh", marginTop: "100px" }}>
        <Spinner animation="border" size="sm" className="me-2" variant="purple" />
        Analizando existencias contables y lotes en Neon Cloud PostgreSQL...
      </div>
    );
  }

  return (
    <Container fluid className="px-4 pb-4">
      {/* HEADER PRINCIPAL */}
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold h3 d-flex align-items-center gap-2 text-gray-900">
            <Package className="text-purple-600 animate-pulse" size={26} />
            <span>{t("inventory.title")}</span>
          </h1>
          <p className="text-muted mb-0">{t("inventory.subtitle")}</p>
        </div>
      </header>

      {error && <Alert variant="danger" className="rounded-2xl shadow-sm">{error}</Alert>}

      {/* TOP CATEGORIZED GRID NAVIGATION */}
      {dashboardData && (
        <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl mb-4">
          <Row className="g-3">
            {/* CATEGORÍA 1 */}
            <Col lg={3} sm={6}>
              <div className="fw-black text-gray-900 small mb-2 px-1 text-uppercase tracking-wider" style={{ fontSize: "10px", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px" }}>
                📦 Catálogo y Almacén
              </div>
              <div className="d-flex flex-column gap-1">
                <button
                  onClick={() => setActiveTab("resumen")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "resumen" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Package size={14} className={activeTab === "resumen" ? "text-white" : "text-purple-600"} />
                  <span>Resumen General</span>
                </button>

                <button
                  onClick={() => setActiveTab("productos")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "productos" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Package size={14} className={activeTab === "productos" ? "text-white" : "text-purple-600"} />
                  <span>Catálogo de Stock</span>
                </button>

                <button
                  onClick={() => setActiveTab("sucursales")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "sucursales" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Building size={14} className={activeTab === "sucursales" ? "text-white" : "text-purple-600"} />
                  <span>Existencias Sucursal</span>
                </button>

                <button
                  onClick={() => setActiveTab("escaner")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "escaner" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Scan size={14} className={activeTab === "escaner" ? "text-white" : "text-purple-600"} />
                  <span>Escáner Barra / QR</span>
                </button>
              </div>
            </Col>

            {/* CATEGORÍA 2 */}
            <Col lg={3} sm={6}>
              <div className="fw-black text-gray-900 small mb-2 px-1 text-uppercase tracking-wider" style={{ fontSize: "10px", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px" }}>
                🔄 Trazabilidad y Operación
              </div>
              <div className="d-flex flex-column gap-1">
                <button
                  onClick={() => setActiveTab("lotes")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "lotes" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Layers size={14} className={activeTab === "lotes" ? "text-white" : "text-purple-600"} />
                  <span>Lotes & FIFO</span>
                </button>

                <button
                  onClick={() => setActiveTab("movimientos")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "movimientos" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Activity size={14} className={activeTab === "movimientos" ? "text-white" : "text-purple-600"} />
                  <span>Auditoría Movimientos</span>
                </button>

                <button
                  onClick={() => setActiveTab("reglas")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "reglas" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Scissors size={14} className={activeTab === "reglas" ? "text-white" : "text-purple-600"} />
                  <span>Reglas de Consumo</span>
                </button>
              </div>
            </Col>

            {/* CATEGORÍA 3 */}
            <Col lg={3} sm={6}>
              <div className="fw-black text-gray-900 small mb-2 px-1 text-uppercase tracking-wider" style={{ fontSize: "10px", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px" }}>
                🛒 Abastecimiento y Compras
              </div>
              <div className="d-flex flex-column gap-1">
                <button
                  onClick={() => setActiveTab("proveedores")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "proveedores" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <User size={14} className={activeTab === "proveedores" ? "text-white" : "text-purple-600"} />
                  <span>Directorio Proveedores</span>
                </button>

                <button
                  onClick={() => setActiveTab("ordenes")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "ordenes" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <ShoppingCart size={14} className={activeTab === "ordenes" ? "text-white" : "text-purple-600"} />
                  <span>Reposición de Stock</span>
                </button>
              </div>
            </Col>

            {/* CATEGORÍA 4 */}
            <Col lg={3} sm={6}>
              <div className="fw-black text-gray-900 small mb-2 px-1 text-uppercase tracking-wider" style={{ fontSize: "10px", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px" }}>
                📊 Inteligencia Financiera
              </div>
              <div className="d-flex flex-column gap-1">
                <button
                  onClick={() => setActiveTab("rentabilidad")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "rentabilidad" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <DollarSign size={14} className={activeTab === "rentabilidad" ? "text-white" : "text-purple-600"} />
                  <span>Rentabilidad Insumos</span>
                </button>

                <button
                  onClick={() => setActiveTab("simulador")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "simulador" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Sliders size={14} className={activeTab === "simulador" ? "text-white" : "text-purple-600"} />
                  <span>Simulador Contable</span>
                </button>

                <button
                  onClick={() => setActiveTab("ia")}
                  className={`d-flex align-items-center gap-2 px-2.5 py-1.5 fw-semibold rounded-lg border-0 transition-all text-start ${
                    activeTab === "ia" ? "bg-purple-600 text-white shadow-sm" : "bg-transparent text-muted hover-bg-gray-50"
                  }`}
                  style={{ fontSize: "12.5px" }}
                >
                  <Bot size={14} className={activeTab === "ia" ? "text-white" : "text-purple-600"} />
                  <span>Copilot Aura IA</span>
                </button>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* RENDERIZADO ACTIVO DE CADA PESTAÑA */}
      {dashboardData && (
        <div className="animate-fade-in">
          {activeTab === "resumen" && (
            <InventoryDashboard 
              summary={dashboardData.summary}
              expiringSoon={dashboardData.expiringSoon}
              products={products}
              onTabChange={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "productos" && (
            <ProductForm 
              products={products}
              suppliers={suppliers}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "movimientos" && (
            <StockMovementHistory />
          )}

          {activeTab === "proveedores" && (
            <SupplierCRUD 
              suppliers={suppliers}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "ordenes" && (
            <PurchaseOrders 
              products={products}
              suppliers={suppliers}
            />
          )}

          {activeTab === "lotes" && (
            <BatchControl 
              products={products}
              suppliers={suppliers}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "escaner" && (
            <BarcodeScanner 
              products={products}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "rentabilidad" && (
            <ProductProfitability 
              products={products}
              rules={rules}
              movements={movements}
            />
          )}

          {activeTab === "sucursales" && (
            <BranchInventory 
              products={products}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "simulador" && (
            <InventorySimulator 
              products={products}
              rules={rules}
            />
          )}

          {activeTab === "ia" && (
            <InventoryAIInsights 
              products={products}
              suppliers={suppliers}
              movements={movements}
            />
          )}

          {activeTab === "reglas" && (
            <ServiceConsumptionRules 
              products={products}
              onRefresh={fetchAllData}
            />
          )}
        </div>
      )}
    </Container>
  );
}
