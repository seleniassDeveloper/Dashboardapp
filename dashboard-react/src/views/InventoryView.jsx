import React, { useState, useEffect, useMemo } from "react";
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
  const [repoSubTab, setRepoSubTab] = useState("pedidos");

  // State populated from Neon Cloud DB
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rules, setRules] = useState([]);
  const [movements, setMovements] = useState([]);
  const [branchesCount, setBranchesCount] = useState(1);
  const [businessIndustry, setBusinessIndustry] = useState("Estética");

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashRes, prodRes, supRes, ruleRes, movRes, branchRes, bizRes] = await Promise.all([
        api.get("/inventory/dashboard"),
        api.get("/inventory/products"),
        api.get("/inventory/suppliers"),
        api.get("/inventory/rules"),
        api.get("/inventory/movements"),
        api.get("/finances/branches").catch(() => ({ data: [] })),
        api.get("/businesses/me").catch(() => null)
      ]);

      setDashboardData(dashRes.data);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setSuppliers(Array.isArray(supRes.data) ? supRes.data : []);
      setRules(Array.isArray(ruleRes.data) ? ruleRes.data : []);
      setMovements(Array.isArray(movRes.data) ? movRes.data : []);
      setBranchesCount(Array.isArray(branchRes.data) ? branchRes.data.length : 1);

      if (bizRes && bizRes.data && bizRes.data.business) {
        setBusinessIndustry(bizRes.data.business.industry || "Estética");
      }
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

  const showConsumptionRules = useMemo(() => {
    const norm = (businessIndustry || "").toLowerCase();
    const isBeautyOrSalon = ["estética", "estetica", "peluquería", "peluqueria", "salon", "salón", "barbería", "barberia", "bienestar", "spa"].some(term => norm.includes(term));
    return !isBeautyOrSalon;
  }, [businessIndustry]);

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

      {/* TOP PREMIUM HORIZONTAL NAVIGATION */}
      {dashboardData && (
        <div className="d-flex overflow-auto border-bottom mb-4 pb-1 scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`nav-tab-premium px-4 py-2 fw-bold text-nowrap border-0 transition-all bg-transparent ${
              activeTab === "resumen" ? "active text-purple-700 border-bottom-purple" : "text-muted hover-text-gray-900"
            }`}
            style={{
              fontSize: "14px",
              borderBottom: activeTab === "resumen" ? "2px solid #7c3aed" : "2px solid transparent"
            }}
          >
            Resumen General
          </button>
          <button
            onClick={() => setActiveTab("productos")}
            className={`nav-tab-premium px-4 py-2 fw-bold text-nowrap border-0 transition-all bg-transparent ${
              activeTab === "productos" ? "active text-purple-700 border-bottom-purple" : "text-muted hover-text-gray-900"
            }`}
            style={{
              fontSize: "14px",
              borderBottom: activeTab === "productos" ? "2px solid #7c3aed" : "2px solid transparent"
            }}
          >
            Catálogo de Stock
          </button>
          <button
            onClick={() => setActiveTab("reposicion")}
            className={`nav-tab-premium px-4 py-2 fw-bold text-nowrap border-0 transition-all bg-transparent ${
              activeTab === "reposicion" ? "active text-purple-700 border-bottom-purple" : "text-muted hover-text-gray-900"
            }`}
            style={{
              fontSize: "14px",
              borderBottom: activeTab === "reposicion" ? "2px solid #7c3aed" : "2px solid transparent"
            }}
          >
            Reposición de Stock
          </button>
          {branchesCount > 1 && (
            <button
              onClick={() => setActiveTab("sucursales")}
              className={`nav-tab-premium px-4 py-2 fw-bold text-nowrap border-0 transition-all bg-transparent ${
                activeTab === "sucursales" ? "active text-purple-700 border-bottom-purple" : "text-muted hover-text-gray-900"
              }`}
              style={{
                fontSize: "14px",
                borderBottom: activeTab === "sucursales" ? "2px solid #7c3aed" : "2px solid transparent"
              }}
            >
              Existencias Sucursal
            </button>
          )}
          {showConsumptionRules && (
            <button
              onClick={() => setActiveTab("reglas")}
              className={`nav-tab-premium px-4 py-2 fw-bold text-nowrap border-0 transition-all bg-transparent ${
                activeTab === "reglas" ? "active text-purple-700 border-bottom-purple" : "text-muted hover-text-gray-900"
              }`}
              style={{
                fontSize: "14px",
                borderBottom: activeTab === "reglas" ? "2px solid #7c3aed" : "2px solid transparent"
              }}
            >
              Reglas de Consumo
            </button>
          )}
          <button
            onClick={() => setActiveTab("rentabilidad")}
            className={`nav-tab-premium px-4 py-2 fw-bold text-nowrap border-0 transition-all bg-transparent ${
              activeTab === "rentabilidad" ? "active text-purple-700 border-bottom-purple" : "text-muted hover-text-gray-900"
            }`}
            style={{
              fontSize: "14px",
              borderBottom: activeTab === "rentabilidad" ? "2px solid #7c3aed" : "2px solid transparent"
            }}
          >
            Rentabilidad Insumos
          </button>
          <button
            onClick={() => setActiveTab("ia")}
            className={`nav-tab-premium px-4 py-2 fw-bold text-nowrap border-0 transition-all bg-transparent ${
              activeTab === "ia" ? "active text-purple-700 border-bottom-purple" : "text-muted hover-text-gray-900"
            }`}
            style={{
              fontSize: "14px",
              borderBottom: activeTab === "ia" ? "2px solid #7c3aed" : "2px solid transparent"
            }}
          >
            Copilot Aura IA
          </button>
        </div>
      )}

      {/* RENDERIZADO ACTIVO DE CADA PESTAÑA */}
      {dashboardData && (
        <div className="animate-fade-in">
          {activeTab === "resumen" && (
            <InventoryDashboard 
              summary={dashboardData.summary}
              products={products}
              movements={movements}
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

          {activeTab === "reposicion" && (
            <div className="animate-fade-in">
              <div 
                className="d-inline-flex p-1 rounded-3 border mb-4 gap-1" 
                style={{ 
                  backgroundColor: "#f3f4f6",
                  borderColor: "#e5e7eb"
                }}
              >
                <button
                  onClick={() => setRepoSubTab("pedidos")}
                  className="px-4 py-2 rounded-3 fw-bold border-0 transition-all"
                  style={{
                    fontSize: "13px",
                    cursor: "pointer",
                    backgroundColor: repoSubTab === "pedidos" ? "#ffffff" : "transparent",
                    color: repoSubTab === "pedidos" ? "#7c3aed" : "#6b7280",
                    boxShadow: repoSubTab === "pedidos" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  Pedidos de Reposición
                </button>
                <button
                  onClick={() => setRepoSubTab("proveedores")}
                  className="px-4 py-2 rounded-3 fw-bold border-0 transition-all"
                  style={{
                    fontSize: "13px",
                    cursor: "pointer",
                    backgroundColor: repoSubTab === "proveedores" ? "#ffffff" : "transparent",
                    color: repoSubTab === "proveedores" ? "#7c3aed" : "#6b7280",
                    boxShadow: repoSubTab === "proveedores" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  Directorio de Proveedores
                </button>
              </div>

              {repoSubTab === "pedidos" ? (
                <PurchaseOrders 
                  products={products} 
                  suppliers={suppliers} 
                  onRefresh={fetchAllData} 
                />
              ) : (
                <SupplierCRUD 
                  suppliers={suppliers} 
                  onRefresh={fetchAllData} 
                />
              )}
            </div>
          )}

          {activeTab === "rentabilidad" && (
            <ProductProfitability 
              products={products}
              rules={rules}
              movements={movements}
            />
          )}

          {activeTab === "sucursales" && branchesCount > 1 && (
            <BranchInventory 
              products={products}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === "ia" && (
            <InventoryAIInsights 
              products={products}
              suppliers={suppliers}
              movements={movements}
              rules={rules}
              showConsumptionRules={showConsumptionRules}
              onTabChange={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "reglas" && showConsumptionRules && (
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
