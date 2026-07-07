import React, { useState } from "react";
import { Offcanvas, ListGroup, Modal } from "react-bootstrap";
import { Home, ClipboardList, Layers, Menu, Plus, Scan, Package, ShoppingCart, PlusCircle, BarChart2 } from "lucide-react";
import InventoryHome from "./InventoryHome.jsx";
import InventoryCatalogMobile from "./InventoryCatalogMobile.jsx";
import ProductForm from "../ProductForm.jsx";
import BatchControl from "../BatchControl.jsx";
import SupplierCRUD from "../SupplierCRUD.jsx";
import PurchaseOrders from "../PurchaseOrders.jsx";
import ProductProfitability from "../ProductProfitability.jsx";
import BranchInventory from "../BranchInventory.jsx";
import InventorySimulator from "../InventorySimulator.jsx";
import InventoryAIInsights from "../InventoryAIInsights.jsx";
import ServiceConsumptionRules from "../ServiceConsumptionRules.jsx";
import BarcodeScanner from "../BarcodeScanner.jsx";
import "./InventoryMobile.css";

export default function InventoryMobile({ state }) {
  const [activeScreen, setActiveScreen] = useState("home"); // "home" | "catalog" | "batches" | "more"
  const [moreSubTab, setMoreSubTab] = useState(null); // null | "reposicion" | "proveedores" | "rentabilidad" | "sucursales" | "reglas" | "ia" | "simulador"
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const {
    products,
    suppliers,
    rules,
    movements,
    branchesCount,
    businessIndustry,
    refresh,
    alerts
  } = state;

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  const renderMoreScreen = () => {
    if (moreSubTab === "reposicion") {
      return (
        <div className="p-3 bg-white min-vh-100 animate-fade-in">
          <header className="mb-3 d-flex align-items-center gap-2">
            <button onClick={() => setMoreSubTab(null)} className="btn btn-sm btn-outline-purple rounded-xl">← Volver</button>
            <h4 className="m-0 fw-black text-gray-900 small text-uppercase">Pedidos de Reposición</h4>
          </header>
          <PurchaseOrders products={products} suppliers={suppliers} onRefresh={refresh} />
        </div>
      );
    }

    if (moreSubTab === "proveedores") {
      return (
        <div className="p-3 bg-white min-vh-100 animate-fade-in">
          <header className="mb-3 d-flex align-items-center gap-2">
            <button onClick={() => setMoreSubTab(null)} className="btn btn-sm btn-outline-purple rounded-xl">← Volver</button>
            <h4 className="m-0 fw-black text-gray-900 small text-uppercase">Directorio de Proveedores</h4>
          </header>
          <SupplierCRUD suppliers={suppliers} onRefresh={refresh} />
        </div>
      );
    }

    if (moreSubTab === "rentabilidad") {
      return (
        <div className="p-3 bg-white min-vh-100 animate-fade-in">
          <header className="mb-3 d-flex align-items-center gap-2">
            <button onClick={() => setMoreSubTab(null)} className="btn btn-sm btn-outline-purple rounded-xl">← Volver</button>
            <h4 className="m-0 fw-black text-gray-900 small text-uppercase">Rentabilidad Insumos</h4>
          </header>
          <ProductProfitability products={products} rules={rules} movements={movements} />
        </div>
      );
    }

    if (moreSubTab === "sucursales") {
      return (
        <div className="p-3 bg-white min-vh-100 animate-fade-in">
          <header className="mb-3 d-flex align-items-center gap-2">
            <button onClick={() => setMoreSubTab(null)} className="btn btn-sm btn-outline-purple rounded-xl">← Volver</button>
            <h4 className="m-0 fw-black text-gray-900 small text-uppercase">Existencias Sucursal</h4>
          </header>
          <BranchInventory products={products} onRefresh={refresh} />
        </div>
      );
    }

    if (moreSubTab === "reglas") {
      return (
        <div className="p-3 bg-white min-vh-100 animate-fade-in">
          <header className="mb-3 d-flex align-items-center gap-2">
            <button onClick={() => setMoreSubTab(null)} className="btn btn-sm btn-outline-purple rounded-xl">← Volver</button>
            <h4 className="m-0 fw-black text-gray-900 small text-uppercase">Reglas de Consumo</h4>
          </header>
          <ServiceConsumptionRules products={products} onRefresh={refresh} />
        </div>
      );
    }

    if (moreSubTab === "ia") {
      return (
        <div className="p-3 bg-white min-vh-100 animate-fade-in">
          <header className="mb-3 d-flex align-items-center gap-2">
            <button onClick={() => setMoreSubTab(null)} className="btn btn-sm btn-outline-purple rounded-xl">← Volver</button>
            <h4 className="m-0 fw-black text-gray-900 small text-uppercase">Copilot Aura IA</h4>
          </header>
          <InventoryAIInsights 
            products={products}
            suppliers={suppliers}
            movements={movements}
            rules={rules}
            showConsumptionRules={true}
            onTabChange={() => {}}
          />
        </div>
      );
    }

    if (moreSubTab === "simulador") {
      return (
        <div className="p-3 bg-white min-vh-100 animate-fade-in">
          <header className="mb-3 d-flex align-items-center gap-2">
            <button onClick={() => setMoreSubTab(null)} className="btn btn-sm btn-outline-purple rounded-xl">← Volver</button>
            <h4 className="m-0 fw-black text-gray-900 small text-uppercase">Simulador de Stock</h4>
          </header>
          <InventorySimulator products={products} onRefresh={refresh} />
        </div>
      );
    }

    return (
      <div className="p-4 bg-white min-vh-100 animate-fade-in">
        <h3 className="fw-black text-gray-900 h5 mb-3.5 text-uppercase">Más Módulos de Inventario</h3>
        <ListGroup variant="flush" className="gap-2">
          <ListGroup.Item onClick={() => setMoreSubTab("reposicion")} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center cursor-pointer">
            <div>
              <strong className="text-gray-900 small d-block">Pedidos de Reposición</strong>
              <span className="smaller text-muted">Órdenes de compra y recepciones</span>
            </div>
            <ShoppingCart size={18} className="text-purple-600" />
          </ListGroup.Item>

          <ListGroup.Item onClick={() => setMoreSubTab("proveedores")} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center cursor-pointer">
            <div>
              <strong className="text-gray-900 small d-block">Directorio de Proveedores</strong>
              <span className="smaller text-muted">Gestión de contactos de insumos</span>
            </div>
            <Menu size={18} className="text-purple-600" />
          </ListGroup.Item>

          <ListGroup.Item onClick={() => setMoreSubTab("rentabilidad")} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center cursor-pointer">
            <div>
              <strong className="text-gray-900 small d-block">Rentabilidad Insumos</strong>
              <span className="smaller text-muted">Costos de tratamiento y márgenes</span>
            </div>
            <BarChart2 size={18} className="text-purple-600" />
          </ListGroup.Item>

          {branchesCount > 1 && (
            <ListGroup.Item onClick={() => setMoreSubTab("sucursales")} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center cursor-pointer">
              <div>
                <strong className="text-gray-900 small d-block">Existencias Sucursal</strong>
                <span className="smaller text-muted">Distribución de stock entre locales</span>
              </div>
              <Home size={18} className="text-purple-600" />
            </ListGroup.Item>
          )}

          <ListGroup.Item onClick={() => setMoreSubTab("reglas")} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center cursor-pointer">
            <div>
              <strong className="text-gray-900 small d-block">Reglas de Consumo</strong>
              <span className="smaller text-muted">Descuento automático de fórmulas por cita</span>
            </div>
            <ClipboardList size={18} className="text-purple-600" />
          </ListGroup.Item>

          <ListGroup.Item onClick={() => setMoreSubTab("ia")} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center cursor-pointer">
            <div>
              <strong className="text-gray-900 small d-block">Copilot Aura IA</strong>
              <span className="smaller text-muted">Análisis predictivo de insumos</span>
            </div>
            <Menu size={18} className="text-purple-600" />
          </ListGroup.Item>

          <ListGroup.Item onClick={() => setMoreSubTab("simulador")} className="p-3 border rounded-xl bg-light bg-opacity-40 d-flex justify-content-between align-items-center cursor-pointer">
            <div>
              <strong className="text-gray-900 small d-block">Simulador de Stock</strong>
              <span className="smaller text-muted">Predecir quiebres y alertas de stock</span>
            </div>
            <Layers size={18} className="text-purple-600" />
          </ListGroup.Item>
        </ListGroup>
      </div>
    );
  };

  return (
    <div className="inv-mobile">
      {/* Active Screen Render */}
      {activeScreen === "home" && <InventoryHome state={state} onOpenScanner={handleOpenScanner} />}
      
      {activeScreen === "catalog" && (
        <div className="p-3 bg-white min-vh-100">
          <InventoryCatalogMobile products={products} suppliers={suppliers} onRefresh={refresh} />
        </div>
      )}
      
      {activeScreen === "batches" && (
        <div className="p-3 bg-white min-vh-100">
          <BatchControl products={products} suppliers={suppliers} onRefresh={refresh} />
        </div>
      )}
      
      {activeScreen === "more" && renderMoreScreen()}

      {/* Tab Bar Inferior */}
      <div className="mobile-tabbar">
        <button 
          onClick={() => { setActiveScreen("home"); setMoreSubTab(null); }} 
          className={`mobile-tabbar__item ${activeScreen === "home" ? "mobile-tabbar__item--active" : ""}`}
        >
          <Home size={20} />
          <span>Inicio</span>
        </button>

        <button 
          onClick={() => { setActiveScreen("catalog"); setMoreSubTab(null); }} 
          className={`mobile-tabbar__item ${activeScreen === "catalog" ? "mobile-tabbar__item--active" : ""}`}
        >
          <ClipboardList size={20} />
          <span>Catálogo</span>
        </button>

        <button 
          onClick={() => setShowFabMenu(true)} 
          className="mobile-tabbar__fab"
          aria-label="Menú de Creación"
        >
          <Plus size={24} />
        </button>

        <button 
          onClick={() => { setActiveScreen("batches"); setMoreSubTab(null); }} 
          className={`mobile-tabbar__item ${activeScreen === "batches" ? "mobile-tabbar__item--active" : ""}`}
        >
          <Layers size={20} />
          <span>Lotes</span>
        </button>

        <button 
          onClick={() => { setActiveScreen("more"); setMoreSubTab(null); }} 
          className={`mobile-tabbar__item ${activeScreen === "more" ? "mobile-tabbar__item--active" : ""}`}
        >
          <Menu size={20} />
          <span>Más</span>
        </button>
      </div>

      {/* FAB Drawer (Bottom Sheet) */}
      <Offcanvas show={showFabMenu} onHide={() => setShowFabMenu(false)} placement="bottom" className="inv-mobile-fab-sheet rounded-top-3xl border-0 shadow-lg" style={{ height: "auto" }}>
        <Offcanvas.Header closeButton className="p-3 border-bottom bg-light">
          <Offcanvas.Title className="fw-black h6 text-gray-900 m-0">Menú de Creación</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-2">
          <ListGroup variant="flush">
            <ListGroup.Item onClick={() => { setShowFabMenu(false); handleOpenScanner(); }} className="d-flex align-items-center gap-3">
              <Scan size={18} />
              <span>Escanear Código de Barras</span>
            </ListGroup.Item>
            <ListGroup.Item onClick={() => { setShowFabMenu(false); setActiveScreen("catalog"); }} className="d-flex align-items-center gap-3">
              <PlusCircle size={18} />
              <span>Añadir Producto</span>
            </ListGroup.Item>
            <ListGroup.Item onClick={() => { setShowFabMenu(false); setActiveScreen("more"); setMoreSubTab("reposicion"); }} className="d-flex align-items-center gap-3">
              <ShoppingCart size={18} />
              <span>Nueva Compra</span>
            </ListGroup.Item>
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Barcode Scanner Modal */}
      <Modal show={showScanner} onHide={handleCloseScanner} size="lg" centered className="border-0 shadow-lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold h6 text-gray-900 m-0">Escáner de Código de Barra</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 bg-light bg-opacity-40">
          <BarcodeScanner products={products} onRefresh={refresh} />
        </Modal.Body>
      </Modal>
    </div>
  );
}
