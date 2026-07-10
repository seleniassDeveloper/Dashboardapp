// src/components/finance/mobile/FinancesMobile.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Bell, Plus, Calendar, LayoutGrid, Users, MoreHorizontal, Landmark } from "lucide-react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import api from "../../../lib/api.js";

// Screen imports
import ResumenScreen from "./ResumenScreen.jsx";
import GastosScreen from "./GastosScreen.jsx";
import CierreCajaScreen from "./CierreCajaScreen.jsx";
import NominasScreen from "./NominasScreen.jsx";
import ConciliacionScreen from "./ConciliacionScreen.jsx";
import ServiciosScreen from "./ServiciosScreen.jsx";
import EquipoScreen from "./EquipoScreen.jsx";
import SimuladorScreen from "./SimuladorScreen.jsx";
import ReportesScreen from "./ReportesScreen.jsx";
import AuditoriaScreen from "./AuditoriaScreen.jsx";

// Import CSS
import "./FinancesMobile.css";

export default function FinancesMobile({ dashboardData, expenseBranches, fetchDashboardData }) {
  const safeBranches = Array.isArray(expenseBranches) ? expenseBranches : [];
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get("tab") || "resumen";
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Quick expense FAB modal state
  const [showFabModal, setShowFabModal] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("insumos");
  const [branchId, setBranchId] = useState("");
  const [saving, setSaving] = useState(false);

  // Hide global topbar when mounted
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { detail: false }));
    };
  }, []);

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    try {
      setSaving(true);
      await api.post("/finances/expenses", {
        name: name.trim(),
        amount: Number(amount),
        category,
        branchId: branchId || null
      });
      setName("");
      setAmount("");
      setCategory("insumos");
      setBranchId("");
      setShowFabModal(false);
      
      // Reload financial data
      if (fetchDashboardData) fetchDashboardData();
      
      // If we are currently on the Gastos screen, it will automatically refresh because of state propagation.
    } catch (err) {
      console.error(err);
      alert("Error al registrar el egreso rápido.");
    } finally {
      setSaving(false);
    }
  };

  // Get screen title & back action
  const getHeaderProps = () => {
    switch (activeTab) {
      case "resumen":
        return { title: "Finanzas", isRoot: true };
      case "gastos_operativos":
        return { title: "Gastos Operativos", isRoot: false };
      case "gastos":
        return { title: "Cierre de Caja", isRoot: false };
      case "sueldos":
        return { title: "Nóminas", isRoot: false };
      case "conciliacion":
        return { title: "Conciliación Bancaria", isRoot: false };
      case "servicios":
        return { title: "Rentabilidad de Servicios", isRoot: false };
      case "profesionales":
        return { title: "Equipo / Profesionales", isRoot: false };
      case "simulador":
        return { title: "Simulador Financiero", isRoot: false };
      case "reportes":
        return { title: "Reportes / AFIP", isRoot: false };
      case "auditoria":
        return { title: "Auditoría de Seguridad", isRoot: false };
      default:
        return { title: "Finanzas", isRoot: true };
    }
  };

  const header = getHeaderProps();

  const handleBack = () => {
    setActiveTab("resumen");
  };

  return (
    <div className="fin-mobile">
      {/* 1. Sticky custom header */}
      <header className="f-header">
        {header.isRoot ? (
          <button 
            className="f-header__btn"
            onClick={() => window.dispatchEvent(new CustomEvent("open-more-sheet"))}
          >
            <Menu size={22} />
          </button>
        ) : (
          <button className="f-header__btn" onClick={handleBack}>
            <ArrowLeft size={22} />
          </button>
        )}

        <div className="f-header__title">
          <b>{header.title}</b>
          <span>Centro de Control ERP</span>
        </div>

        <button className="f-bell" onClick={() => setActiveTab("auditoria")}>
          <Bell size={20} />
        </button>
      </header>

      {/* 2. Scrollable top sub-navigation bar */}
      <nav className="f-subtabs">
        {[
          { key: "resumen", label: "Resumen" },
          { key: "gastos_operativos", label: "Gastos" },
          { key: "gastos", label: "Cierre Caja" },
          { key: "sueldos", label: "Nóminas" },
          { key: "conciliacion", label: "Conciliación" },
          { key: "servicios", label: "Servicios" },
          { key: "profesionales", label: "Equipo" },
          { key: "simulador", label: "Simulador" },
          { key: "reportes", label: "Reportes" },
          { key: "auditoria", label: "Auditoría" }
        ].map(tab => (
          <button
            key={tab.key}
            className={`f-subtab-btn ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 3. Screen Router Content Area */}
      <main className="f-content">
        {activeTab === "resumen" && (
          <ResumenScreen 
            dashboardData={dashboardData} 
            onTabChange={setActiveTab} 
          />
        )}
        {activeTab === "gastos_operativos" && (
          <GastosScreen 
            expenseBranches={safeBranches}
            onExpenseAdded={fetchDashboardData}
          />
        )}
        {activeTab === "gastos" && (
          <CierreCajaScreen 
            currentRevenue={dashboardData?.summary?.totalRevenues || 0}
          />
        )}
        {activeTab === "sueldos" && (
          <NominasScreen 
            professionalStats={dashboardData?.professionalProfitability || []}
          />
        )}
        {activeTab === "conciliacion" && (
          <ConciliacionScreen />
        )}
        {activeTab === "servicios" && (
          <ServiciosScreen 
            serviceStats={dashboardData?.serviceProfitability || []}
          />
        )}
        {activeTab === "profesionales" && (
          <EquipoScreen 
            professionalStats={dashboardData?.professionalProfitability || []}
          />
        )}
        {activeTab === "simulador" && (
          <SimuladorScreen 
            baseRevenue={dashboardData?.summary?.totalRevenues || 0}
            baseExpenses={dashboardData?.summary?.totalExpenses || 0}
          />
        )}
        {activeTab === "reportes" && (
          <ReportesScreen 
            recentTransactions={dashboardData?.recentTransactions || []}
            expenseBranches={safeBranches}
          />
        )}
        {activeTab === "auditoria" && (
          <AuditoriaScreen />
        )}
      </main>

      {/* 4. Custom bottom fixed tab bar */}
      <div className="f-tabbar">
        <button className="f-tab" onClick={() => navigate("/app/dashboard")}>
          <LayoutGrid size={22} />
          <span>Panel</span>
        </button>

        <button className="f-tab" onClick={() => navigate("/app/calendar")}>
          <Calendar size={22} />
          <span>Agenda</span>
        </button>

        <button className="f-fab" onClick={() => setShowFabModal(true)} aria-label="Nuevo egreso">
          <Plus size={28} />
        </button>

        <button className="f-tab" onClick={() => navigate("/app/clients")}>
          <Users size={22} />
          <span>Clientes</span>
        </button>

        <button className="f-tab" onClick={() => window.dispatchEvent(new CustomEvent("open-more-sheet"))}>
          <MoreHorizontal size={22} />
          <span>Más</span>
        </button>
      </div>

      {/* QUICK EXPENSE FAB MODAL */}
      <Modal show={showFabModal} onHide={() => setShowFabModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Registro Rápido de Gasto</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveExpense}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">Concepto *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej. Insumos tinturas, café, insumos..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">Importe ($) *</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ej. 8500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">Categoría *</Form.Label>
              <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="insumos">Insumos y Tinturas</option>
                <option value="alquiler">Alquiler</option>
                <option value="servicios">Servicios</option>
                <option value="marketing">Marketing</option>
                <option value="otros">Otros Gastos</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="small text-muted fw-bold">Sucursal</Form.Label>
              <Form.Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Gasto General</option>
                {safeBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={() => setShowFabModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={saving}>
              {saving ? <Spinner size="sm" /> : "Guardar Gasto"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
