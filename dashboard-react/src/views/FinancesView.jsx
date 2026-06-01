import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Button, Modal, Form, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import {
  TrendingUp, TrendingDown, Landmark, ShieldCheck, DollarSign, Sparkles,
  Download, Plus, Scissors, Award, Clock, FileText, Lock
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { usePermissions } from "../auth/PermissionProvider.jsx";
import FinanceAccessModal from "../components/finances/FinanceAccessModal.jsx";

// ERP sub-modules
import FinanceDashboard from "../components/finance/FinanceDashboard.jsx";
import OperationalExpenses from "../components/finance/OperationalExpenses.jsx";
import FinancialReports from "../components/finance/FinancialReports.jsx";
import SalaryManagement from "../components/finance/SalaryManagement.jsx";
import BankReconciliation from "../components/finance/BankReconciliation.jsx";
import ServiceProfitability from "../components/finance/ServiceProfitability.jsx";
import ProfessionalProfitability from "../components/finance/ProfessionalProfitability.jsx";
import FinancialSimulator from "../components/finance/FinancialSimulator.jsx";
import DailyCashClosing from "../components/finance/DailyCashClosing.jsx";
import FinancialAudit from "../components/finance/FinancialAudit.jsx";


export default function FinancesView() {
  const { t } = useTranslation("views");
  const { hasPermission } = usePermissions();
  const { financeUnlocked } = useAuth();

  const hasFinancePermission = hasPermission("finance.view");
  const isFinanceUnlocked = hasFinancePermission || financeUnlocked;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAccessModal, setShowAccessModal] = useState(!isFinanceUnlocked);
  
  // Tab State Driven by URL SearchParams
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "resumen";
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  // Dynamic Dashboard Data loaded from Neon DB
  const [dashboardData, setDashboardData] = useState(null);
  
  // Expense Modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("insumos");
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseBranches, setExpenseBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/finances/dashboard");
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron calcular las métricas ERP contables.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFinanceUnlocked) {
      fetchDashboardData();
      
      // Fetch branches for expense select
      api.get("/finances/branches")
        .then(res => setExpenseBranches(Array.isArray(res.data) ? res.data : []))
        .catch(e => console.error(e));
    }
  }, [isFinanceUnlocked]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseName.trim() || !expenseAmount) return;

    try {
      setSavingExpense(true);
      const payload = {
        name: expenseName.trim(),
        amount: Number.parseInt(expenseAmount, 10),
        category: expenseCategory,
        branchId: selectedBranchId || null
      };

      await api.post("/finances/expenses", payload);
      setExpenseName("");
      setExpenseAmount("");
      setExpenseCategory("insumos");
      setSelectedBranchId("");
      setShowExpenseModal(false);
      
      // Reload financial data immediately
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar egreso en base de datos.");
    } finally {
      setSavingExpense(false);
    }
  };

  if (!isFinanceUnlocked) {
    return (
      <div 
        className="d-flex flex-column align-items-center justify-content-center border shadow-sm p-5 text-center animate-fade-in"
        style={{
          minHeight: "65vh",
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.25)"
        }}
      >
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center text-white mb-4 shadow"
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
            border: "3px solid #ffffff",
            boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.3)"
          }}
        >
          <Lock size={32} />
        </div>
        <h2 className="fw-black h3 mb-2 text-dark">Acceso Restringido</h2>
        <p className="text-secondary small mb-4" style={{ maxWidth: "420px", fontSize: "14px", lineHeight: "1.5" }}>
          Esta sección contiene información financiera sensible del negocio. Ingresa credenciales autorizadas de supervisor para ver el contenido.
        </p>
        <div>
          <Button 
            variant="purple"
            onClick={() => setShowAccessModal(true)}
            className="rounded-pill px-4 py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 shadow"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              boxShadow: "0 4px 14px 0 rgba(124, 58, 237, 0.3)"
            }}
          >
            Ingresar Credenciales
          </Button>
        </div>

        <FinanceAccessModal 
          show={showAccessModal} 
          onHide={() => setShowAccessModal(false)}
          onSuccess={() => {
            setShowAccessModal(false);
          }}
        />
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className="text-center py-5 text-muted" style={{ minHeight: "60vh" }}>
        <Spinner animation="border" size="sm" className="me-2" variant="purple" />
        Analizando libros contables en Neon Cloud PostgreSQL...
      </div>
    );
  }

  return (
    <Container fluid className="px-4 pb-4">
      {/* HEADER PRINCIPAL */}
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold h3 d-flex align-items-center gap-2">
            <Landmark className="text-purple-600 animate-pulse" size={26} />
            <span>{t("finances.title")}</span>
          </h1>
          <p className="text-muted mb-0">{t("finances.subtitle")}</p>
        </div>
        <div className="d-flex align-items-center gap-2.5">
          <Button
            variant="purple"
            className="rounded-xl px-4 py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowExpenseModal(true)}
          >
            <Plus size={18} />
            <span>{t("finances.newExpense")}</span>
          </Button>
          <Button
            variant="dark"
            className="rounded-xl px-4 py-2.5 fw-bold text-white bg-gray-900 d-flex align-items-center gap-2"
            onClick={() => setActiveTab("reportes")}
          >
            <Download size={18} />
            <span>{t("finances.reportsCenter")}</span>
          </Button>
        </div>
      </header>

      {error && <Alert variant="danger" className="rounded-2xl">{error}</Alert>}
      <Row className="g-4">
        {/* CONTENIDO ACTIVO DEL ERP (Columna Unificada de Ancho Completo) */}
        <Col xs={12}>
          {dashboardData && (
            <div className="animate-fade-in">
              {activeTab === "resumen" && (
                <FinanceDashboard 
                  summary={dashboardData.summary}
                  paymentMethods={dashboardData.paymentMethods}
                  branchComparison={dashboardData.branchComparison}
                  recentTransactions={dashboardData.recentTransactions}
                  onAddExpenseClick={() => setShowExpenseModal(true)}
                />
              )}

              {activeTab === "gastos_operativos" && (
                <OperationalExpenses 
                  onExpenseAdded={fetchDashboardData}
                />
              )}

              {activeTab === "gastos" && (
                <DailyCashClosing 
                  currentRevenue={dashboardData.summary.totalRevenues}
                />
              )}

              {activeTab === "sueldos" && (
                <SalaryManagement 
                  professionalStats={dashboardData.professionalProfitability}
                />
              )}

              {activeTab === "conciliacion" && (
                <BankReconciliation />
              )}

              {activeTab === "servicios" && (
                <ServiceProfitability 
                  serviceStats={dashboardData.serviceProfitability}
                />
              )}

              {activeTab === "profesionales" && (
                <ProfessionalProfitability 
                  professionalStats={dashboardData.professionalProfitability}
                />
              )}

              {activeTab === "simulador" && (
                <FinancialSimulator 
                  baseRevenue={dashboardData.summary.totalRevenues}
                  baseExpenses={dashboardData.summary.totalExpenses}
                />
              )}

              {activeTab === "reportes" && (
                <FinancialReports 
                  recentTransactions={dashboardData.recentTransactions}
                />
              )}

              {activeTab === "auditoria" && (
                <FinancialAudit />
              )}
            </div>
          )}
        </Col>
      </Row>

      {/* MODAL PARA AGREGAR NUEVO EGRESO */}
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} centered className="border-0 shadow-lg">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <Plus className="text-purple-600" size={20} />
            <span>Registrar Nuevo Egreso Operativo</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddExpense}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Descripción / Concepto *</Form.Label>
              <Form.Control
                type="text"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="Ej: Insumos de tintura, Luz, Alquiler..."
                className="border-gray-200 rounded-xl"
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Importe Egresado ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Ej: 35000"
                    className="border-gray-200 rounded-xl"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Categoría *</Form.Label>
                  <Form.Select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="border-gray-200 rounded-xl"
                  >
                    <option value="alquiler">Alquiler</option>
                    <option value="servicios">Servicios</option>
                    <option value="insumos">Insumos y Tinturas</option>
                    <option value="marketing">Marketing</option>
                    <option value="otros">Otros Gastos</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label className="smaller text-muted fw-bold">Sucursal Asociada (Opcional)</Form.Label>
              <Form.Select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="border-gray-200 rounded-xl"
              >
                <option value="">Ninguna (Gasto General)</option>
                {expenseBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button variant="outline-secondary" onClick={() => setShowExpenseModal(false)} className="rounded-xl px-4" disabled={savingExpense}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={savingExpense} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow">
              {savingExpense ? <Spinner size="sm" /> : "Guardar Gasto"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
