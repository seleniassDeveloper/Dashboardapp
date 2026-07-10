// src/components/finance/mobile/GastosScreen.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Sliders, DollarSign, ArrowDown, Calendar, RefreshCw, X, Plus } from "lucide-react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import api from "../../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function getCategoryColor(category) {
  switch (category) {
    case "alquiler": return "var(--f-red)";
    case "servicios": return "var(--f-blue)";
    case "insumos": return "var(--f-purple)";
    case "marketing": return "var(--f-amber)";
    default: return "var(--f-muted)";
  }
}

export default function GastosScreen({ expenseBranches, onExpenseAdded }) {
  const safeBranches = Array.isArray(expenseBranches) ? expenseBranches : [];
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Expense modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("insumos");
  const [branchId, setBranchId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/finances/expenses");
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Handle new expense
  const handleSave = async (e) => {
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
      setShowAddModal(false);
      fetchExpenses();
      if (onExpenseAdded) onExpenseAdded();
    } catch (err) {
      console.error(err);
      alert("Error al registrar el egreso.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = (exp.name || "").toLowerCase().includes(searchText.toLowerCase());
      const matchCategory = !selectedCategory || exp.category === selectedCategory;
      const matchBranch = !selectedBranch || exp.branchId === selectedBranch;
      return matchSearch && matchCategory && matchBranch;
    });
  }, [expenses, searchText, selectedCategory, selectedBranch]);

  // Derived metrics
  const metrics = useMemo(() => {
    const list = filteredExpenses;
    if (list.length === 0) {
      return { total: 0, avg: 0, max: 0, topCategory: "Ninguna" };
    }

    const total = list.reduce((sum, item) => sum + (item.amount || 0), 0);
    const avg = total / list.length;
    const max = Math.max(...list.map(item => item.amount || 0));

    // Category frequency
    const catMap = {};
    list.forEach(item => {
      catMap[item.category] = (catMap[item.category] || 0) + (item.amount || 0);
    });

    let topCat = "Ninguna";
    let topCatVal = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatVal) {
        topCat = cat;
        topCatVal = val;
      }
    });

    const formatCat = (c) => {
      if (c === "insumos") return "Insumos";
      return c.charAt(0).toUpperCase() + c.slice(1);
    };

    return {
      total,
      avg,
      max,
      topCategory: topCat === "Ninguna" ? "Ninguna" : formatCat(topCat)
    };
  }, [filteredExpenses]);

  return (
    <div className="animate-fade-in">
      {/* 4 KPIs grid */}
      <div className="f-kpi-grid mb-3">
        <div className="f-kpi">
          <div className="f-kpi__label">Total Egresos</div>
          <div className="f-kpi__value text-danger">{currency(metrics.total)}</div>
        </div>
        <div className="f-kpi">
          <div className="f-kpi__label">Promedio por Gasto</div>
          <div className="f-kpi__value">{currency(metrics.avg)}</div>
        </div>
        <div className="f-kpi">
          <div className="f-kpi__label">Mayor Gasto</div>
          <div className="f-kpi__value text-dark">{currency(metrics.max)}</div>
        </div>
        <div className="f-kpi">
          <div className="f-kpi__label">Mayor Categoría</div>
          <div className="f-kpi__value text-purple-600">{metrics.topCategory}</div>
        </div>
      </div>

      {/* Searchbar */}
      <div className="f-searchrow">
        <input 
          type="text" 
          placeholder="Buscar concepto..." 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Selectors */}
      <div className="f-filters">
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          <option value="alquiler">Alquiler</option>
          <option value="servicios">Servicios</option>
          <option value="insumos">Insumos y Tinturas</option>
          <option value="marketing">Marketing</option>
          <option value="otros">Otros</option>
        </select>

        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {safeBranches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* List section header */}
      <div className="f-section">
        <h3>Últimos Gastos</h3>
        <button className="btn btn-sm text-purple-600" onClick={fetchExpenses}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-5 text-muted">Cargando gastos operativos...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-5 text-muted">No se encontraron egresos.</div>
      ) : (
        <ul className="f-list mb-3">
          {filteredExpenses.map(exp => (
            <li className="f-row" key={exp.id}>
              <div className="f-row__info">
                <div 
                  className="f-row__ico" 
                  style={{ 
                    backgroundColor: `${getCategoryColor(exp.category)}18`,
                    color: getCategoryColor(exp.category)
                  }}
                >
                  <DollarSign size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="f-row__title text-truncate">{exp.name}</h4>
                  <small>
                    {new Date(exp.createdAt).toLocaleDateString("es-AR")} · {exp.branch?.name || "Gasto General"}
                  </small>
                </div>
              </div>
              <b className="f-neg">-{currency(exp.amount)}</b>
            </li>
          ))}
        </ul>
      )}

      {/* Register Gasto Button */}
      <button className="f-btn-purple" onClick={() => setShowAddModal(true)}>
        + Registrar Gasto
      </button>

      {/* ADD EXPENSE MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Registrar Gasto</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">Concepto *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej. Insumos de peluquería, luz..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">Importe ($) *</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ej. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">Categoría *</Form.Label>
              <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="alquiler">Alquiler</option>
                <option value="servicios">Servicios</option>
                <option value="insumos">Insumos y Tinturas</option>
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
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={saving}>
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
