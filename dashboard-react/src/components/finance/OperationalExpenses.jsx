import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Spinner, Alert, Badge, Modal } from "react-bootstrap";
import { TrendingDown, Plus, Trash2, Calendar, Filter, DollarSign, Building, Sparkles } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function OperationalExpenses({ onExpenseAdded }) {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Modal registration state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("insumos");
  const [branchId, setBranchId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchExpensesAndBranches = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [expRes, branchRes] = await Promise.all([
        api.get("/finances/expenses"),
        api.get("/finances/branches")
      ]);

      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los gastos u oficinas de la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndBranches();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const payload = {
        name: name.trim(),
        amount: Number.parseInt(amount, 10),
        category,
        branchId: branchId || null
      };

      await api.post("/finances/expenses", payload);
      
      setOkMsg("¡Gasto registrado con éxito en los libros contables!");
      setName("");
      setAmount("");
      setCategory("insumos");
      setBranchId("");
      setShowAddModal(false);
      
      // Refresh list
      await fetchExpensesAndBranches();

      // Trigger global recalculation in parent view if provided
      if (typeof onExpenseAdded === "function") {
        onExpenseAdded();
      }
    } catch (err) {
      console.error(err);
      setError("Error al guardar el egreso.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id, nameStr, amountVal) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar el gasto "${nameStr}" por ${currency(amountVal)}? Esta acción es irreversible y recalculará los balances.`);
    if (!confirm) return;

    try {
      setError("");
      setOkMsg("");
      await api.delete(`/finances/expenses/${id}`);
      
      setOkMsg(`Gasto "${nameStr}" eliminado correctamente de Neon DB.`);
      
      // Refresh list
      await fetchExpensesAndBranches();

      // Trigger global recalculation
      if (typeof onExpenseAdded === "function") {
        onExpenseAdded();
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el gasto de la base de datos.");
    }
  };

  // Calculations for KPIs based on current filtered/unfiltered list
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? Math.round(totalExpenses / expenses.length) : 0;
  
  // Find highest expense
  const highestExpense = expenses.reduce((max, e) => e.amount > (max?.amount || 0) ? e : max, null);

  // Category with highest total
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const leaderCategory = Object.keys(categoryTotals).reduce((maxCat, cat) => 
    categoryTotals[cat] > (categoryTotals[maxCat] || 0) ? cat : maxCat, "Ninguno"
  );

  // Map category to readable Spanish string and badge color
  const getCategoryMeta = (cat) => {
    switch (cat) {
      case "alquiler":
        return { label: "Alquiler", variant: "danger", style: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" } };
      case "servicios":
        return { label: "Servicios", variant: "primary", style: { backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" } };
      case "insumos":
        return { label: "Insumos y Tinturas", variant: "purple", style: { backgroundColor: "rgba(147, 51, 234, 0.1)", color: "#9333ea" } };
      case "marketing":
        return { label: "Marketing", variant: "warning", style: { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" } };
      default:
        return { label: "Otros Gastos", variant: "secondary", style: { backgroundColor: "rgba(107, 114, 128, 0.1)", color: "#6b7280" } };
    }
  };

  // Filter list
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? e.category === selectedCategory : true;
    const matchesBranch = selectedBranch ? e.branchId === selectedBranch : true;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  return (
    <div>
      {/* ALERTS */}
      {error && <Alert variant="danger" className="rounded-2xl shadow-sm mb-4">{error}</Alert>}
      {okMsg && <Alert variant="success" className="rounded-2xl shadow-sm mb-4">{okMsg}</Alert>}

      {/* KPI METRICS CARD GRID */}
      <Row className="g-4 mb-4">
        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl d-flex align-items-center justify-content-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Egreso Operativo Total</span>
                <h4 className="fw-black text-gray-900 mb-0 text-red-600">{currency(totalExpenses)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl d-flex align-items-center justify-content-center">
                <DollarSign size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Importe Egreso Promedio</span>
                <h4 className="fw-black text-gray-900 mb-0">{currency(avgExpense)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl d-flex align-items-center justify-content-center">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Mayor Egreso Operativo</span>
                <h4 className="fw-black text-gray-900 mb-0 small-title-override" style={{ fontSize: "16px", marginTop: "2px" }}>
                  {highestExpense ? `${highestExpense.name} (${currency(highestExpense.amount)})` : "Ninguno"}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl d-flex align-items-center justify-content-center">
                <Building size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Categoría de Mayor Gasto</span>
                <h4 className="fw-black text-gray-900 mb-0 capitalize-override" style={{ fontSize: "17px", textTransform: "capitalize" }}>
                  {leaderCategory === "Ninguno" ? "Ninguna" : getCategoryMeta(leaderCategory).label}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* FILTER BAR AND NEW BUTTON */}
      <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl mb-4">
        <Card.Body className="p-0">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
            <h3 className="h6 fw-black text-gray-900 mb-0 d-flex align-items-center gap-2">
              <Filter className="text-purple-600" size={18} />
              <span>Filtros y Búsqueda Avanzada de Gastos</span>
            </h3>
            <Button
              variant="purple"
              className="rounded-xl px-4 py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-2 shadow-sm border-0"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              <span>Registrar Gasto</span>
            </Button>
          </div>

          <Row className="g-3">
            <Col lg={4} md={6}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Buscar por concepto o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-200 rounded-xl"
                />
              </Form.Group>
            </Col>
            
            <Col lg={4} md={3}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border-gray-200 rounded-xl"
              >
                <option value="">Todas las Categorías</option>
                <option value="alquiler">Alquiler</option>
                <option value="servicios">Servicios</option>
                <option value="insumos">Insumos y Tinturas</option>
                <option value="marketing">Marketing</option>
                <option value="otros">Otros Gastos</option>
              </Form.Select>
            </Col>

            <Col lg={4} md={3}>
              <Form.Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="border-gray-200 rounded-xl"
              >
                <option value="">Todas las Sucursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* EXPENSES TABLE CARD */}
      <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl">
        <Card.Body className="p-0">
          <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
            <Calendar className="text-purple-600" size={18} />
            <span>Listado de Egresos Operativos Registrados</span>
          </h3>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="purple" />
              <p className="text-muted smaller mt-2">Cargando transacciones de egreso desde Neon...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-5 text-muted small bg-gray-50 rounded-2xl border border-gray-150">
              No se encontraron gastos registrados que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover responsive className="mb-0 align-middle">
                <thead>
                  <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                    <th className="ps-3 py-3">Fecha</th>
                    <th className="py-3">Concepto / Descripción</th>
                    <th className="py-3">Categoría</th>
                    <th className="py-3">Sucursal</th>
                    <th className="py-3 text-end">Monto Egresado</th>
                    <th className="pe-3 py-3 text-center" style={{ width: "80px" }}>Acción</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13.5px" }}>
                  {filteredExpenses.map((exp) => {
                    const catMeta = getCategoryMeta(exp.category);
                    return (
                      <tr key={exp.id} className="transition-all hover-row-focus">
                        <td className="ps-3 text-secondary py-3 fw-medium">
                          {new Date(exp.date).toLocaleDateString("es-AR")}
                        </td>
                        <td className="text-gray-900 py-3 fw-bold">
                          {exp.name}
                        </td>
                        <td className="py-3">
                          <span 
                            className="badge rounded-pill px-3 py-1.5 fw-bold"
                            style={{ 
                              ...catMeta.style, 
                              fontSize: "11px",
                              letterSpacing: "0.2px"
                            }}
                          >
                            {catMeta.label}
                          </span>
                        </td>
                        <td className="py-3 text-muted">
                          <span className="d-flex align-items-center gap-1.5">
                            <Building size={14} className="text-gray-400" />
                            <span>{exp.branch?.name || "General"}</span>
                          </span>
                        </td>
                        <td className="py-3 text-end fw-black text-red-600">
                          - {currency(exp.amount)}
                        </td>
                        <td className="pe-3 py-3 text-center">
                          <Button
                            variant="link"
                            className="text-red-500 hover-text-red-700 p-1 rounded-lg border-0 bg-transparent transition-all"
                            onClick={() => handleDeleteExpense(exp.id, exp.name, exp.amount)}
                            title="Eliminar registro de gasto"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* POPUP MODAL TO REGISTER GASTO (INLINE COMPONENT CONTEXT) */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered className="border-0 shadow-lg">
        <Modal.Header closeButton className="border-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <Plus className="text-purple-600" size={20} />
            <span>Registrar Nuevo Egreso Operativo</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateExpense}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="smaller text-muted fw-bold">Descripción / Concepto *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Toallas de algodón, Alquiler de local Palermo, Luz..."
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="border-gray-200 rounded-xl"
              >
                <option value="">Ninguna (Gasto General)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
            <Button variant="outline-secondary" onClick={() => setShowAddModal(false)} className="rounded-xl px-4" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="purple" disabled={saving} className="rounded-xl px-5 text-white bg-purple-600 hover-bg-purple-700 fw-bold shadow border-0">
              {saving ? <Spinner size="sm" /> : "Guardar Gasto"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
