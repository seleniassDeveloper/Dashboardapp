import React, { useEffect, useState } from "react";
import { Container, Table, Badge, Button, Modal, Form, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Edit2, Shield, DollarSign, Users, Award, AlertCircle, Plus, Trash2 } from "lucide-react";
import api from "../lib/api.js";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function SuperAdminBillingView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ businesses: [], estimatedMRR: 0 });
  const [requests, setRequests] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState("");

  // Override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    name: "",
    ownerEmail: "",
    slug: "",
    industry: "",
    timezone: "",
    plan: "starter",
    subscriptionStatus: "active",
    trialEndsAt: "",
    currentPeriodEnd: "",
    gracePeriodEndsAt: "",
    provider: "free"
  });
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Create business modal state
  const [showCreateBizModal, setShowCreateBizModal] = useState(false);
  const [createBizForm, setCreateBizForm] = useState({
    name: "",
    ownerEmail: "",
    slug: "",
    industry: "",
    timezone: "America/Argentina/Buenos_Aires",
    plan: "starter",
    subscriptionStatus: "trialing",
    trialEndsAt: "",
    currentPeriodEnd: "",
    gracePeriodEndsAt: "",
    provider: "free"
  });
  const [createBizLoading, setCreateBizLoading] = useState(false);

  // Create request modal state
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [createRequestForm, setCreateRequestForm] = useState({
    businessId: "",
    requestedPlan: "starter",
    status: "PENDING"
  });
  const [createRequestLoading, setCreateRequestLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // User edit modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    displayName: "",
    email: "",
    status: "active",
    password: ""
  });
  const [userLoading, setUserLoading] = useState(false);

  // Audit logs & Cross-tenant states
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedCrossBizId, setSelectedCrossBizId] = useState("");
  const [crossTenantData, setCrossTenantData] = useState(null);
  const [crossTenantLoading, setCrossTenantLoading] = useState(false);

  const fetchAdminBillingData = async () => {
    setLoading(true);
    setError("");
    try {
      const [bizRes, reqsRes, usersRes, allUsersRes, logsRes] = await Promise.all([
        api.get("/admin/billing/businesses"),
        api.get("/admin/billing/requests"),
        api.get("/admin/users/pending"),
        api.get("/admin/users/all"),
        api.get("/admin/billing/audit-logs")
      ]);
      if (bizRes.data?.success) {
        setData(bizRes.data);
      }
      if (reqsRes.data?.success) {
        setRequests(reqsRes.data.requests);
      }
      if (usersRes.data?.success) {
        setPendingUsers(usersRes.data.users);
      }
      if (allUsersRes.data?.success) {
        setAllUsers(allUsersRes.data.users);
      }
      if (logsRes.data?.success) {
        setAuditLogs(logsRes.data.logs);
      }
    } catch (err) {
      console.error("Error fetching superadmin billing data:", err);
      setError("No tienes permisos de Administrador Global o el servidor no respondió.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCrossTenantData = async (bizId) => {
    if (!bizId) return;
    setCrossTenantLoading(true);
    setCrossTenantData(null);
    setError("");
    try {
      const res = await api.get(`/admin/billing/businesses/${bizId}/data`);
      if (res.data?.success) {
        setCrossTenantData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar los datos del inquilino.");
    } finally {
      setCrossTenantLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminBillingData();
  }, []);

  const handleOpenOverride = (biz) => {
    setSelectedBiz(biz);
    setOverrideForm({
      name: biz.name || "",
      ownerEmail: biz.ownerEmail || "",
      slug: biz.slug || "",
      industry: biz.industry || "",
      timezone: biz.timezone || "",
      plan: biz.plan || "starter",
      subscriptionStatus: biz.subscriptionStatus || "active",
      trialEndsAt: biz.trialEndsAt ? biz.trialEndsAt.substring(0, 10) : "",
      currentPeriodEnd: biz.currentPeriodEnd ? biz.currentPeriodEnd.substring(0, 10) : "",
      gracePeriodEndsAt: biz.gracePeriodEndsAt ? biz.gracePeriodEndsAt.substring(0, 10) : "",
      provider: biz.provider || "free"
    });
    setShowOverrideModal(true);
  };

  const handleSaveOverride = async () => {
    setOverrideLoading(true);
    setError("");
    try {
      const payload = {
        name: overrideForm.name,
        ownerEmail: overrideForm.ownerEmail,
        slug: overrideForm.slug,
        industry: overrideForm.industry,
        timezone: overrideForm.timezone,
        plan: overrideForm.plan,
        subscriptionStatus: overrideForm.subscriptionStatus,
        trialEndsAt: overrideForm.trialEndsAt || null,
        currentPeriodEnd: overrideForm.currentPeriodEnd || null,
        gracePeriodEndsAt: overrideForm.gracePeriodEndsAt || null,
        provider: overrideForm.provider
      };

      const res = await api.post(`/admin/billing/businesses/${selectedBiz.id}/override`, payload);
      if (res.data?.success) {
        setShowOverrideModal(false);
        await fetchAdminBillingData();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al aplicar la modificación manual.");
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleCreateBiz = async () => {
    setCreateBizLoading(true);
    setError("");
    try {
      const payload = {
        name: createBizForm.name,
        ownerEmail: createBizForm.ownerEmail,
        slug: createBizForm.slug,
        industry: createBizForm.industry || undefined,
        timezone: createBizForm.timezone || undefined,
        plan: createBizForm.plan,
        subscriptionStatus: createBizForm.subscriptionStatus,
        trialEndsAt: createBizForm.trialEndsAt || null,
        currentPeriodEnd: createBizForm.currentPeriodEnd || null,
        gracePeriodEndsAt: createBizForm.gracePeriodEndsAt || null,
        provider: createBizForm.provider
      };

      const res = await api.post("/admin/billing/businesses", payload);
      if (res.data?.success) {
        setShowCreateBizModal(false);
        setCreateBizForm({
          name: "",
          ownerEmail: "",
          slug: "",
          industry: "",
          timezone: "America/Argentina/Buenos_Aires",
          plan: "starter",
          subscriptionStatus: "trialing",
          trialEndsAt: "",
          currentPeriodEnd: "",
          gracePeriodEndsAt: "",
          provider: "free"
        });
        await fetchAdminBillingData();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear el nuevo negocio.");
    } finally {
      setCreateBizLoading(false);
    }
  };

  const handleDeleteBiz = async (bizId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este inquilino de forma definitiva? Se borrará el negocio y TODA su información asociada en cascada (servicios, clientes, citas, etc.). Esta acción no se puede deshacer.")) return;
    setError("");
    try {
      const res = await api.delete(`/admin/billing/businesses/${bizId}`);
      if (res.data?.success) {
        await fetchAdminBillingData();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al eliminar el negocio.");
    }
  };

  const handleCreateRequest = async () => {
    setCreateRequestLoading(true);
    setError("");
    try {
      const payload = {
        businessId: createRequestForm.businessId,
        requestedPlan: createRequestForm.requestedPlan,
        status: createRequestForm.status
      };

      const res = await api.post("/admin/billing/requests", payload);
      if (res.data?.success) {
        setShowCreateRequestModal(false);
        setCreateRequestForm({
          businessId: "",
          requestedPlan: "starter",
          status: "PENDING"
        });
        await fetchAdminBillingData();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear la solicitud de plan.");
    } finally {
      setCreateRequestLoading(false);
    }
  };

  const handleOpenUserModal = (u) => {
    setSelectedUser(u);
    setUserForm({
      displayName: u.name || "",
      email: u.email || "",
      status: u.status || "active",
      password: ""
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    setUserLoading(true);
    setError("");
    try {
      const payload = {
        displayName: userForm.displayName || undefined,
        email: userForm.email || undefined,
        status: userForm.status,
        password: userForm.password || undefined
      };
      const res = await api.patch(`/admin/users/${selectedUser.id}`, payload);
      if (res.data?.success) {
        setShowUserModal(false);
        await fetchAdminBillingData();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al modificar el usuario.");
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario de forma definitiva del sistema? Se removerán sus accesos y cuenta relacional.")) return;
    setUserLoading(true);
    setError("");
    try {
      const res = await api.delete(`/admin/users/${uid}`);
      if (res.data?.success) {
        setShowUserModal(false);
        await fetchAdminBillingData();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al eliminar el usuario.");
    } finally {
      setUserLoading(false);
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      await api.post(`/admin/billing/requests/${id}/approve`);
      await fetchAdminBillingData();
    } catch (err) {
      setError(err.response?.data?.error || "Error al aprobar la solicitud.");
    }
  };

  const handleRejectRequest = async (id) => {
    if (!window.confirm("¿Seguro que deseas rechazar esta solicitud?")) return;
    try {
      await api.post(`/admin/billing/requests/${id}/reject`);
      await fetchAdminBillingData();
    } catch (err) {
      setError(err.response?.data?.error || "Error al rechazar la solicitud.");
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta solicitud de la lista?")) return;
    try {
      await api.delete(`/admin/billing/requests/${id}`);
      await fetchAdminBillingData();
    } catch (err) {
      setError(err.response?.data?.error || "Error al eliminar la solicitud.");
    }
  };

  const handleCleanProcessed = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar todas las solicitudes procesadas (Aprobadas o Rechazadas)?")) return;
    try {
      const res = await api.delete(`/admin/billing/requests/processed`);
      alert(res.data.message || "Solicitudes procesadas eliminadas.");
      await fetchAdminBillingData();
    } catch (err) {
      setError(err.response?.data?.error || "Error al limpiar solicitudes.");
    }
  };

  const handleApproveUser = async (uid) => {
    try {
      await api.post(`/admin/users/${uid}/approve`);
      await fetchAdminBillingData();
    } catch (err) {
      setError(err.response?.data?.error || "Error al aprobar usuario.");
    }
  };

  const handleRejectUser = async (uid) => {
    if (!window.confirm("¿Seguro que deseas rechazar este usuario? No podrá ingresar al dashboard.")) return;
    try {
      await api.post(`/admin/users/${uid}/reject`);
      await fetchAdminBillingData();
    } catch (err) {
      setError(err.response?.data?.error || "Error al rechazar usuario.");
    }
  };

  const getStatusBadge = (status) => {
    const classMap = {
      trialing: "badge-sa-trialing",
      active: "badge-sa-active",
      past_due: "badge-sa-past_due",
      canceled: "badge-sa-canceled",
      suspended: "badge-sa-suspended"
    };
    const dotMap = {
      trialing: "🔵",
      active: "🟢",
      past_due: "🟡",
      canceled: "⚪",
      suspended: "🔴"
    };
    return (
      <span className={`badge-sa ${classMap[status] || "badge-sa-canceled"} text-uppercase`}>
        <span style={{ fontSize: "8px", verticalAlign: "middle" }}>{dotMap[status] || "⚪"}</span>
        {status}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const map = {
      starter: { bg: "rgba(100, 116, 139, 0.1)", color: "#475569", border: "rgba(100, 116, 139, 0.2)" },
      pro: { bg: "rgba(124, 58, 237, 0.1)", color: "#6d28d9", border: "rgba(124, 58, 237, 0.2)" },
      business: { bg: "rgba(236, 72, 153, 0.1)", color: "#db2777", border: "rgba(236, 72, 153, 0.2)" }
    };
    const style = map[plan] || map.starter;
    return (
      <span className="badge-sa text-uppercase" style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}`, padding: "0.25rem 0.6rem", fontSize: "0.7rem", fontWeight: "600", borderRadius: "9999px" }}>
        {plan}
      </span>
    );
  };

  const getUserStatusBadge = (status) => {
    const classMap = {
      active: "badge-sa-active",
      pending: "badge-sa-past_due",
      rejected: "badge-sa-suspended"
    };
    return (
      <span className={`badge-sa ${classMap[status] || "badge-sa-canceled"} text-uppercase`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" style={{ color: "#7c3aed" }} />
        <p className="text-muted mt-2 small">Cargando panel administrativo SaaS...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="sa-console-container py-4 px-md-5">
      <style>{`
        .sa-console-container {
          background: radial-gradient(circle at top right, rgba(124, 58, 237, 0.04), transparent 45%),
                      radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.03), transparent 45%),
                      #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: #1e293b;
        }

        .sa-header {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 10px 25px -5px rgba(148, 163, 184, 0.05);
        }

        .sa-kpi-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(226, 232, 240, 0.9) !important;
          border-radius: 20px !important;
          background: #ffffff !important;
        }

        .sa-kpi-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px -10px rgba(124, 58, 237, 0.12) !important;
          border-color: rgba(124, 58, 237, 0.25) !important;
        }

        .sa-card {
          border: 1px solid rgba(226, 232, 240, 0.9) !important;
          box-shadow: 0 10px 30px -10px rgba(148, 163, 184, 0.06) !important;
          border-radius: 20px !important;
          overflow: hidden;
          background: #ffffff !important;
          transition: all 0.3s ease;
        }

        .sa-card:hover {
          box-shadow: 0 15px 35px -5px rgba(148, 163, 184, 0.1) !important;
        }

        .sa-table {
          vertical-align: middle;
        }

        .sa-table th {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          color: #64748b;
          border-bottom: 2px solid #f1f5f9;
          padding: 0.7rem 0.8rem;
          background-color: #f8fafc;
        }

        .sa-table td {
          padding: 0.65rem 0.8rem;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .sa-table-container {
          max-height: 400px;
          overflow-y: auto;
        }

        /* Tab Selectors */
        .sa-tabs-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          background: rgba(241, 245, 249, 0.8);
          padding: 0.4rem;
          border-radius: 9999px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          width: fit-content;
        }

        .btn-sa-tab {
          border-radius: 9999px !important;
          padding: 0.5rem 1.5rem !important;
          font-weight: 600 !important;
          font-size: 0.85rem !important;
          border: none !important;
          transition: all 0.2s ease !important;
          color: #64748b !important;
          background: transparent !important;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-sa-tab:hover {
          color: #1e293b !important;
          background: rgba(255, 255, 255, 0.5) !important;
        }

        .btn-sa-tab.active {
          background: #ffffff !important;
          color: #7c3aed !important;
          box-shadow: 0 4px 12px -1px rgba(148, 163, 184, 0.12) !important;
        }

        .sa-row-hover {
          transition: background-color 0.2s ease;
        }

        .sa-row-hover:hover {
          background-color: rgba(241, 245, 249, 0.4);
        }

        /* Premium Buttons */
        .btn-premium-purple {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff !important;
          border: none;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-premium-purple:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
          filter: brightness(1.05);
        }

        .btn-premium-purple:active {
          transform: translateY(0);
        }

        .btn-premium-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff !important;
          border: none;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-premium-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);
          filter: brightness(1.05);
        }

        .btn-premium-success:active {
          transform: translateY(0);
        }

        /* Status Badges */
        .badge-sa {
          padding: 0.35rem 0.75rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          font-size: 0.7rem;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .badge-sa-active {
          background: rgba(16, 185, 129, 0.08);
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.18);
        }

        .badge-sa-trialing {
          background: rgba(59, 130, 246, 0.08);
          color: #1e40af;
          border: 1px solid rgba(59, 130, 246, 0.18);
        }

        .badge-sa-past_due {
          background: rgba(245, 158, 11, 0.08);
          color: #92400e;
          border: 1px solid rgba(245, 158, 11, 0.18);
        }

        .badge-sa-suspended {
          background: rgba(239, 68, 68, 0.08);
          color: #991b1b;
          border: 1px solid rgba(239, 68, 68, 0.18);
        }

        .badge-sa-canceled {
          background: rgba(100, 116, 139, 0.08);
          color: #334155;
          border: 1px solid rgba(100, 116, 139, 0.18);
        }

        /* Modals and Forms */
        .modal-content {
          border-radius: 24px !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.12) !important;
          overflow: hidden;
        }

        .modal-header {
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 1.5rem 1.75rem !important;
        }

        .modal-body {
          padding: 1.75rem !important;
        }

        .form-control, .form-select {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 0.6rem 0.9rem;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .form-control:focus, .form-select:focus {
          border-color: #a78bfa !important;
          box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.18) !important;
        }
      `}</style>
      <header className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3 sa-header">
        <div className="d-flex align-items-center gap-2">
          <Shield size={24} className="text-purple-600" />
          <div>
            <h1 className="fw-black h3 mb-1">Super-Admin Billing Console</h1>
            <p className="text-muted mb-0 small">Consola global para monitorear suscripciones, MRR e intervención de accesos.</p>
          </div>
        </div>
        {user?.email && (
          <div className="text-end small">
            <span className="text-muted small d-block mb-1">Sesión activa</span>
            <strong className="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-pill border border-purple-100 font-monospace small">{user.email}</strong>
          </div>
        )}
      </header>

      {/* Tab Selectors */}
      <div className="sa-tabs-container">
        <button
          onClick={() => setActiveTab("overview")}
          className={`btn-sa-tab ${activeTab === "overview" ? "active" : ""}`}
        >
          <span>📊 Resumen</span>
          {requests.length + pendingUsers.filter(u => u.status === "pending").length > 0 && (
            <Badge bg="danger" className="rounded-pill" style={{ padding: "0.25rem 0.5rem", fontSize: "0.68rem" }}>
              {requests.length + pendingUsers.filter(u => u.status === "pending").length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("businesses")}
          className={`btn-sa-tab ${activeTab === "businesses" ? "active" : ""}`}
        >
          <span>🏢 Inquilinos</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`btn-sa-tab ${activeTab === "users" ? "active" : ""}`}
        >
          <span>👥 Usuarios</span>
        </button>
        <button
          onClick={() => setActiveTab("auditLogs")}
          className={`btn-sa-tab ${activeTab === "auditLogs" ? "active" : ""}`}
        >
          <span>📋 Auditoría</span>
        </button>
        <button
          onClick={() => setActiveTab("crossTenant")}
          className={`btn-sa-tab ${activeTab === "crossTenant" ? "active" : ""}`}
        >
          <span>🔍 Vista Cross-Tenant</span>
        </button>
      </div>

      {error && <Alert variant="danger" className="border-0 shadow-sm mb-4 small">{error}</Alert>}

      {activeTab === "overview" && (
        <>
          {/* KPI Stats widgets */}
          <Row className="g-4 mb-4">
            <Col md={6} lg={4}>
              <Card className="border-0 shadow-sm rounded-4 sa-kpi-card">
                <Card.Body className="d-flex align-items-center gap-3 p-4">
                  <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <span className="text-muted smaller d-block mb-0.5">SaaS MRR Estimado</span>
                    <strong className="h3 fw-black text-dark">${data.estimatedMRR} USD</strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={4}>
              <Card className="border-0 shadow-sm rounded-4 sa-kpi-card">
                <Card.Body className="d-flex align-items-center gap-3 p-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-circle">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="text-muted smaller d-block mb-0.5">Total Inquilinos (Business)</span>
                    <strong className="h3 fw-black text-dark">{data.businesses?.length || 0}</strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={4}>
              <Card className="border-0 shadow-sm rounded-4 sa-kpi-card">
                <Card.Body className="d-flex align-items-center gap-3 p-4">
                  <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                    <Award size={24} />
                  </div>
                  <div>
                    <span className="text-muted smaller d-block mb-0.5">Suscripciones Activas</span>
                    <strong className="h3 fw-black text-dark">
                      {data.businesses?.filter(b => b.subscriptionStatus === "active").length || 0}
                    </strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {requests.length > 0 && (
            <Card className="border-0 shadow-sm rounded-4 mb-4 border-warning sa-card" style={{ background: "#fff", borderLeft: "4px solid #f59e0b" }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <AlertCircle className="text-warning" size={20} />
                    <h2 className="fw-bold h6 mb-0 text-dark">Solicitudes de Acceso Pendientes ({requests.length})</h2>
                  </div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="rounded-pill px-3"
                    onClick={handleCleanProcessed}
                  >
                    Limpiar procesadas
                  </Button>
                </div>
                
                <div className="sa-table-container">
                  <Table responsive className="mb-0 sa-table">
                    <thead>
                      <tr className="border-bottom text-muted smaller uppercase">
                        <th className="py-2.5">Fecha</th>
                        <th className="py-2.5">Negocio</th>
                        <th className="py-2.5">Plan Actual</th>
                        <th className="py-2.5">Plan Solicitado</th>
                        <th className="py-2.5 text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id} className="border-bottom small align-middle sa-row-hover">
                          <td className="py-3 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 fw-bold text-dark">{r.business?.name}</td>
                          <td className="py-3">{getPlanBadge(r.business?.plan)}</td>
                          <td className="py-3">{getPlanBadge(r.requestedPlan)}</td>
                          <td className="py-3 text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                className="rounded-pill px-3"
                                onClick={() => handleRejectRequest(r.id)}
                              >
                                Rechazar
                              </Button>
                              <Button 
                                variant="success" 
                                size="sm" 
                                className="rounded-pill px-3 text-white border-0"
                                onClick={() => handleApproveRequest(r.id)}
                              >
                                Aprobar Acceso
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="rounded-circle p-1"
                                onClick={() => handleDeleteRequest(r.id)}
                                title="Eliminar solicitud"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {pendingUsers.length > 0 && (
            <Card className="border-0 shadow-sm rounded-4 mb-4 border-primary sa-card" style={{ background: "#fff", borderLeft: "4px solid #3b82f6" }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Users className="text-primary" size={20} />
                  <h2 className="fw-bold h6 mb-0 text-dark">Nuevos Usuarios (Pendientes de Aprobación) ({pendingUsers.filter(u => u.status === "pending").length})</h2>
                </div>
                
                <div className="sa-table-container">
                  <Table responsive className="mb-0 sa-table">
                    <thead>
                      <tr className="border-bottom text-muted smaller uppercase">
                        <th className="py-2.5">Fecha</th>
                        <th className="py-2.5">Email</th>
                        <th className="py-2.5">Nombre</th>
                        <th className="py-2.5">Estado</th>
                        <th className="py-2.5 text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u) => (
                        <tr key={u.id} className="border-bottom small align-middle sa-row-hover">
                          <td className="py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 fw-bold text-dark">{u.email}</td>
                          <td className="py-3">{u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "-"}</td>
                          <td className="py-3">
                            {getUserStatusBadge(u.status)}
                          </td>
                          <td className="py-3 text-end">
                            <div className="d-flex justify-content-end gap-2">
                              {u.status !== "rejected" && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  className="rounded-pill px-3"
                                  onClick={() => handleRejectUser(u.id)}
                                >
                                  Rechazar
                                </Button>
                              )}
                              <Button 
                                variant="success" 
                                size="sm" 
                                className="rounded-pill px-3 text-white border-0"
                                onClick={() => handleApproveUser(u.id)}
                              >
                                Aprobar Acceso
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}

          {requests.length === 0 && pendingUsers.filter(u => u.status === "pending").length === 0 && (
            <Card className="border-0 shadow-sm rounded-4 p-5 text-center sa-card mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-circle mx-auto mb-3" style={{ width: "fit-content" }}>
                <Shield size={36} />
              </div>
              <h3 className="fw-bold text-dark h5 mb-2">¡Todo al día, Administrador!</h3>
              <p className="text-muted small mb-0">No hay nuevas solicitudes de planes ni usuarios pendientes de aprobación en este momento.</p>
            </Card>
          )}
        </>
      )}

      {activeTab === "businesses" && (
        <Card className="border-0 shadow-sm rounded-4 sa-card">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <h2 className="fw-bold h6 mb-0 text-dark">Empresas e Inquilinos ({data.businesses?.length || 0})</h2>
              <div className="d-flex gap-2">
                <Button
                  variant="purple"
                  size="sm"
                  onClick={() => setShowCreateRequestModal(true)}
                  className="rounded-pill px-3 py-1.5 btn-premium-purple d-inline-flex align-items-center gap-1.5"
                  style={{ fontSize: "12.5px" }}
                >
                  <Plus size={14} />
                  Crear Solicitud
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setShowCreateBizModal(true)}
                  className="rounded-pill px-3 py-1.5 btn-premium-success d-inline-flex align-items-center gap-1.5"
                  style={{ fontSize: "12.5px" }}
                >
                  <Plus size={14} />
                  Crear Negocio
                </Button>
              </div>
            </div>
            
            <div className="sa-table-container">
              <Table responsive className="mb-0 sa-table">
                <thead>
                  <tr className="border-bottom text-muted smaller uppercase">
                    <th className="py-2.5">Negocio / Info</th>
                    <th className="py-2.5">Plan</th>
                    <th className="py-2.5">Estado</th>
                    <th className="py-2.5">Vencimiento</th>
                    <th className="py-2.5">MRR</th>
                    <th className="py-2.5 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.businesses?.map((b) => (
                    <tr key={b.id} className="border-bottom small align-middle sa-row-hover">
                      <td className="py-3">
                        <strong className="text-dark d-block">{b.name}</strong>
                        <span className="text-muted smaller font-monospace d-block" style={{ fontSize: "10px", lineHeight: "1.3" }}>
                          ID: {b.id} <span className="text-slate-300">|</span> Slug: {b.slug}
                        </span>
                        {b.ownerEmail && (
                          <span className="text-muted smaller d-block mt-0.5" style={{ fontSize: "10px" }}>
                            📧 {b.ownerEmail}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {getPlanBadge(b.plan)}
                        <span className="text-muted smaller d-block font-monospace mt-0.5" style={{ fontSize: "9px" }}>
                          Método: {b.provider || "free"}
                        </span>
                      </td>
                      <td className="py-3">{getStatusBadge(b.subscriptionStatus)}</td>
                      <td className="py-3 text-muted" style={{ fontSize: "11.5px" }}>
                        {b.subscriptionStatus === "trialing" && b.trialEndsAt ? (
                          <span className="text-info fw-semibold">Trial: {new Date(b.trialEndsAt).toLocaleDateString()}</span>
                        ) : b.subscriptionStatus === "active" && b.currentPeriodEnd ? (
                          <span className="text-success fw-semibold">Renovación: {new Date(b.currentPeriodEnd).toLocaleDateString()}</span>
                        ) : b.trialEndsAt ? (
                          <span>Trial: {new Date(b.trialEndsAt).toLocaleDateString()}</span>
                        ) : b.currentPeriodEnd ? (
                          <span>Fin: {new Date(b.currentPeriodEnd).toLocaleDateString()}</span>
                        ) : "-"}
                      </td>
                      <td className="py-3 fw-bold text-success">${b.mrr}</td>
                      <td className="py-3 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleOpenOverride(b)}
                            className="rounded-pill px-3 py-1 font-bold d-inline-flex align-items-center gap-1.5"
                            style={{ fontSize: "11.5px" }}
                          >
                            <Edit2 size={12} />
                            Modificar
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteBiz(b.id)}
                            className="rounded-pill px-3 py-1 font-bold d-inline-flex align-items-center gap-1.5"
                            style={{ fontSize: "11.5px" }}
                          >
                            <Trash2 size={12} />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === "users" && (
        <Card className="border-0 shadow-sm rounded-4 mt-4 sa-card">
          <Card.Body className="p-4">
            <h2 className="fw-bold h6 mb-3 text-dark">Usuarios Registrados en el Sistema</h2>
            
            <div className="sa-table-container">
              <Table responsive className="mb-0 sa-table">
                <thead>
                  <tr className="border-bottom text-muted smaller uppercase">
                    <th className="py-2.5">Nombre / Email</th>
                    <th className="py-2.5">Negocios y Roles</th>
                    <th className="py-2.5">Estado de Cuenta</th>
                    <th className="py-2.5">Fecha de Registro</th>
                    <th className="py-2.5 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers?.map((u) => (
                    <tr key={u.id} className="border-bottom small align-middle sa-row-hover">
                      <td className="py-3">
                        <strong className="text-dark d-block">{u.name || "Usuario SaaS"}</strong>
                        <span className="text-muted smaller font-monospace">{u.email}</span>
                      </td>
                      <td className="py-3">
                        {u.memberships && u.memberships.length > 0 ? (
                          u.memberships.map((m, idx) => (
                            <div key={m.id || idx} className="mb-1">
                              <span className="fw-bold">{m.business?.name || "Sin nombre"}</span>{" "}
                              <Badge bg="purple" className="text-white text-uppercase" style={{ fontSize: "9px" }}>
                                {m.role || "colaborador"}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted smaller italic">Sin negocios asociados (Nuevo)</span>
                        )}
                      </td>
                      <td className="py-3">
                        {getUserStatusBadge(u.status || "active")}
                      </td>
                      <td className="py-3 text-muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 text-end">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleOpenUserModal(u)}
                          className="rounded-pill px-3 py-1 font-bold d-inline-flex align-items-center gap-1.5"
                          style={{ fontSize: "11.5px" }}
                        >
                          <Edit2 size={12} />
                          Modificar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!allUsers || allUsers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4 small">
                        No se encontraron usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === "auditLogs" && (
        <Card className="border-0 shadow-sm rounded-4 mt-4 sa-card animate-fade-in">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="fw-bold h6 mb-0 text-dark">Registro de Auditoría de Super-Admin</h2>
              <Button variant="outline-secondary" size="sm" onClick={fetchAdminBillingData} className="rounded-pill px-3">
                🔄 Recargar Logs
              </Button>
            </div>
            
            <div className="sa-table-container">
              <Table responsive className="mb-0 sa-table">
                <thead>
                  <tr className="border-bottom text-muted smaller uppercase">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">Acción</th>
                    <th className="py-2.5">Super-Admin</th>
                    <th className="py-2.5">IP</th>
                    <th className="py-2.5">Detalles / Negocio Afectado</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs?.map((log) => {
                    const meta = log.metadata || {};
                    return (
                      <tr key={log.id} className="border-bottom small align-middle sa-row-hover">
                        <td className="py-3 text-muted" style={{ whiteSpace: "nowrap" }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                        </td>
                        <td className="py-3">
                          <Badge bg="dark" className="text-white font-monospace text-uppercase" style={{ fontSize: "10px" }}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3 font-semibold text-purple-600">
                          {meta.userEmail || "Sistema"}
                        </td>
                        <td className="py-3 font-monospace text-muted smaller">
                          {meta.ip || "-"}
                        </td>
                        <td className="py-3">
                          <div className="fw-bold text-dark">{meta.name || "N/A"} {meta.slug ? `(${meta.slug})` : ""}</div>
                          <span className="text-muted smaller d-block">
                            {JSON.stringify(meta)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(!auditLogs || auditLogs.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4 small">
                        No se registraron acciones en el log de auditoría todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {activeTab === "crossTenant" && (
        <Card className="border-0 shadow-sm rounded-4 mt-4 sa-card animate-fade-in">
          <Card.Body className="p-4">
            <h2 className="fw-bold h6 mb-3 text-dark">Vista Cross-Tenant de Negocios (Modo Solo-Lectura)</h2>
            <p className="text-muted small mb-4">
              Esta sección permite consultar métricas contables, turnos recientes y miembros de cualquier inquilino del sistema. Las consultas quedan registradas en el log de auditoría.
            </p>

            {/* TODO: Implementar MFA e IP Allowlist en el backend para este bloque en el futuro */}
            {/* IP Allowlist placeholder check: if (userIp !== allowedIp) return <Alert variant='danger'>IP no autorizada para Cross-Tenant.</Alert>; */}

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small text-muted mb-1">Seleccionar Negocio a Inspeccionar</Form.Label>
              <div className="d-flex gap-2">
                <Form.Select
                  value={selectedCrossBizId}
                  onChange={(e) => setSelectedCrossBizId(e.target.value)}
                  className="small py-2"
                  style={{ maxWidth: "450px" }}
                >
                  <option value="">-- Elige un negocio del sistema --</option>
                  {data.businesses?.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Plan: {b.plan} - ID: {b.id.substring(0,8)}...)
                    </option>
                  ))}
                </Form.Select>
                <Button
                  onClick={() => handleFetchCrossTenantData(selectedCrossBizId)}
                  disabled={!selectedCrossBizId || crossTenantLoading}
                  className="btn-premium-purple px-4 rounded-pill d-flex align-items-center gap-1.5"
                >
                  {crossTenantLoading && <Spinner animation="border" size="sm" className="me-1" />}
                  <span>Inspeccionar</span>
                </Button>
              </div>
            </Form.Group>

            {crossTenantData && (
              <div className="border-top pt-4 mt-4 animate-fade-in">
                <h3 className="h6 fw-bold text-uppercase text-purple-600 mb-3 small" style={{ letterSpacing: "0.5px" }}>
                  Resultados de la Inspección
                </h3>
                
                <Row className="g-4 mb-4">
                  <Col md={3}>
                    <Card className="bg-light border-0 rounded-3 p-3">
                      <span className="text-muted small d-block mb-1">Total Clientes</span>
                      <strong className="h4 text-dark mb-0">{crossTenantData.metrics?.clients}</strong>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="bg-light border-0 rounded-3 p-3">
                      <span className="text-muted small d-block mb-1">Total Turnos</span>
                      <strong className="h4 text-dark mb-0">{crossTenantData.metrics?.appointments}</strong>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="bg-light border-0 rounded-3 p-3">
                      <span className="text-muted small d-block mb-1">Total Servicios</span>
                      <strong className="h4 text-dark mb-0">{crossTenantData.metrics?.services}</strong>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="bg-light border-0 rounded-3 p-3">
                      <span className="text-muted small d-block mb-1">Profesionales</span>
                      <strong className="h4 text-dark mb-0">{crossTenantData.metrics?.workers}</strong>
                    </Card>
                  </Col>
                </Row>

                <Row className="g-4">
                  <Col lg={5}>
                    <Card className="border rounded-3 p-3 bg-white h-100">
                      <h4 className="fw-bold h6 text-dark border-bottom pb-2 mb-3">Miembros del Negocio</h4>
                      <ul className="list-unstyled mb-0">
                        {crossTenantData.members?.map((m) => (
                          <li key={m.id} className="mb-2.5 pb-2 border-bottom last-border-0">
                            <strong className="text-dark small d-block">{m.user?.name || "Usuario"}</strong>
                            <span className="text-muted smaller font-monospace">{m.user?.email}</span>{" "}
                            <Badge bg="purple" className="text-white text-uppercase" style={{ fontSize: "8px" }}>
                              {m.role}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </Col>

                  <Col lg={7}>
                    <Card className="border rounded-3 p-3 bg-white h-100">
                      <h4 className="fw-bold h6 text-dark border-bottom pb-2 mb-3">Turnos Recientes</h4>
                      {crossTenantData.recentAppointments && crossTenantData.recentAppointments.length > 0 ? (
                        <div className="table-responsive">
                          <Table responsive size="sm" className="mb-0 small">
                            <thead>
                              <tr className="text-muted smaller">
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Profesional</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {crossTenantData.recentAppointments.map((app) => (
                                <tr key={app.id}>
                                  <td className="py-2 text-muted">{new Date(app.date).toLocaleDateString()}</td>
                                  <td className="py-2 fw-semibold text-dark">{app.client?.name || "N/A"}</td>
                                  <td className="py-2">{app.worker?.name || "N/A"}</td>
                                  <td className="py-2">
                                    <Badge bg={app.status === "DONE" ? "success" : "secondary"} className="text-uppercase" style={{ fontSize: "9px" }}>
                                      {app.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <span className="text-muted small italic">No hay citas registradas en este inquilino.</span>
                      )}
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Override Subscription Modal */}
      <Modal show={showOverrideModal} onHide={() => setShowOverrideModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold h5 text-dark d-flex align-items-center gap-2">
            <Shield size={20} className="text-purple-600" />
            <span>Modificar Datos y Suscripción del Negocio</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="alert alert-secondary border-0 p-3 rounded-3 small mb-4" style={{ backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" }}>
            <span><strong>ID Negocio:</strong> <span className="font-monospace small text-purple-600 fw-bold">{selectedBiz?.id}</span></span>
          </div>

          <Form onSubmit={(e) => { e.preventDefault(); handleSaveOverride(); }}>
            <Row className="g-4">
              {/* Columna 1: Información General */}
              <Col lg={6} className="border-end pe-lg-4">
                <h6 className="fw-bold text-uppercase text-purple-600 mb-3 small d-flex align-items-center gap-1.5" style={{ letterSpacing: "0.5px" }}>
                  <Users size={14} />
                  <span>Datos Generales</span>
                </h6>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Nombre del Negocio</Form.Label>
                  <Form.Control 
                    type="text"
                    value={overrideForm.name}
                    onChange={(e) => setOverrideForm({ ...overrideForm, name: e.target.value })}
                    className="small py-2"
                    placeholder="Nombre del negocio"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Email del Negocio (Dueño)</Form.Label>
                  <Form.Control 
                    type="email"
                    value={overrideForm.ownerEmail}
                    onChange={(e) => setOverrideForm({ ...overrideForm, ownerEmail: e.target.value })}
                    className="small py-2 font-monospace"
                    placeholder="ejemplo@negocio.com"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Slug (Identificador Web)</Form.Label>
                  <Form.Control 
                    type="text"
                    value={overrideForm.slug}
                    onChange={(e) => setOverrideForm({ ...overrideForm, slug: e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() })}
                    className="small py-2 font-monospace"
                    placeholder="slug-del-negocio"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Rubro</Form.Label>
                  <Form.Control 
                    type="text"
                    value={overrideForm.industry}
                    onChange={(e) => setOverrideForm({ ...overrideForm, industry: e.target.value })}
                    className="small py-2"
                    placeholder="Ej: Estética, Barbería"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Zona Horaria</Form.Label>
                  <Form.Control 
                    type="text"
                    value={overrideForm.timezone}
                    onChange={(e) => setOverrideForm({ ...overrideForm, timezone: e.target.value })}
                    className="small py-2 font-monospace"
                    placeholder="America/Argentina/Buenos_Aires"
                  />
                </Form.Group>
              </Col>

              {/* Columna 2: Suscripción y Fechas */}
              <Col lg={6} className="ps-lg-4">
                <h6 className="fw-bold text-uppercase text-purple-600 mb-3 small d-flex align-items-center gap-1.5" style={{ letterSpacing: "0.5px" }}>
                  <DollarSign size={14} />
                  <span>Suscripción y Fechas</span>
                </h6>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Plan</Form.Label>
                  <Form.Select 
                    value={overrideForm.plan}
                    onChange={(e) => setOverrideForm({ ...overrideForm, plan: e.target.value })}
                    className="small py-2"
                  >
                    <option value="starter">Starter ($19/mo)</option>
                    <option value="pro">Pro ($49/mo)</option>
                    <option value="business">Business ($99/mo)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Estado del SaaS</Form.Label>
                  <Form.Select 
                    value={overrideForm.subscriptionStatus}
                    onChange={(e) => setOverrideForm({ ...overrideForm, subscriptionStatus: e.target.value })}
                    className="small py-2"
                  >
                    <option value="trialing">Trialing (En Prueba)</option>
                    <option value="active">Active (Activo / Pago aprobado)</option>
                    <option value="past_due">Past Due (Pago demorado)</option>
                    <option value="canceled">Canceled (Cancelado)</option>
                    <option value="suspended">Suspended (Suspendido / Bloqueado)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Método / Proveedor de Pago</Form.Label>
                  <Form.Select 
                    value={overrideForm.provider}
                    onChange={(e) => setOverrideForm({ ...overrideForm, provider: e.target.value })}
                    className="small py-2"
                  >
                    <option value="free">Gratuito / Comp (Sin cargo)</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual">Manual / Override</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Fin de Trial</Form.Label>
                  <Form.Control 
                    type="date"
                    value={overrideForm.trialEndsAt}
                    onChange={(e) => setOverrideForm({ ...overrideForm, trialEndsAt: e.target.value })}
                    className="small py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Fin Período de Pago</Form.Label>
                  <Form.Control 
                    type="date"
                    value={overrideForm.currentPeriodEnd}
                    onChange={(e) => setOverrideForm({ ...overrideForm, currentPeriodEnd: e.target.value })}
                    className="small py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Fin Período de Gracia (Dunning)</Form.Label>
                  <Form.Control 
                    type="date"
                    value={overrideForm.gracePeriodEndsAt}
                    onChange={(e) => setOverrideForm({ ...overrideForm, gracePeriodEndsAt: e.target.value })}
                    className="small py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowOverrideModal(false)}
                className="rounded-pill px-4 small"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="purple" 
                disabled={overrideLoading}
                className="rounded-pill px-4 small text-white bg-purple-600 hover-bg-purple-700 border-0"
              >
                {overrideLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold h5 text-dark">
            Modificar Usuario Registrado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted mb-1">Nombre Completo</Form.Label>
              <Form.Control 
                type="text"
                value={userForm.displayName}
                onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                className="small py-2"
                placeholder="Nombre para mostrar"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted mb-1">Correo Electrónico</Form.Label>
              <Form.Control 
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="small py-2"
                placeholder="usuario@correo.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted mb-1">Estado del Acceso</Form.Label>
              <Form.Select 
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                className="small py-2"
              >
                <option value="active">Active (Activo / Acceso concedido)</option>
                <option value="pending">Pending (Pendiente de aprobación)</option>
                <option value="rejected">Rejected (Rechazado / Suspendido)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small text-muted mb-1">Cambiar Contraseña (Opcional)</Form.Label>
              <Form.Control 
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="small py-2"
                placeholder="Mínimo 6 caracteres (dejar vacío si no cambia)"
                minLength={6}
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <Button 
                variant="danger" 
                onClick={() => handleDeleteUser(selectedUser?.id)}
                disabled={userLoading}
                className="rounded-pill px-3 py-2 small fw-bold d-flex align-items-center gap-1.5"
                style={{ fontSize: "12.5px" }}
              >
                Eliminar Cuenta
              </Button>
              
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setShowUserModal(false)}
                  className="rounded-pill px-4 small"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  variant="purple" 
                  disabled={userLoading}
                  className="rounded-pill px-4 small text-white bg-purple-600 hover-bg-purple-700 border-0"
                >
                  {userLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Create Business Modal */}
      <Modal show={showCreateBizModal} onHide={() => setShowCreateBizModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold h5 text-dark d-flex align-items-center gap-2">
            <Plus size={20} className="text-success" />
            <span>Crear Nuevo Negocio (Inquilino)</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={(e) => { e.preventDefault(); handleCreateBiz(); }}>
            <Row className="g-4">
              {/* Columna 1: Información General */}
              <Col lg={6} className="border-end pe-lg-4">
                <h6 className="fw-bold text-uppercase text-success mb-3 small d-flex align-items-center gap-1.5" style={{ letterSpacing: "0.5px" }}>
                  <Users size={14} />
                  <span>Datos Generales</span>
                </h6>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Nombre del Negocio</Form.Label>
                  <Form.Control 
                    type="text"
                    value={createBizForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                        .replace(/[^a-z0-9\s-]/g, "") // remove special chars
                        .trim()
                        .replace(/\s+/g, "-"); // replace spaces with hyphens
                      setCreateBizForm({ ...createBizForm, name, slug });
                    }}
                    className="small py-2"
                    placeholder="Nombre del negocio"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Email del Negocio (Dueño)</Form.Label>
                  <Form.Control 
                    type="email"
                    value={createBizForm.ownerEmail}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, ownerEmail: e.target.value })}
                    className="small py-2 font-monospace"
                    placeholder="ejemplo@negocio.com"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Slug (Identificador Web)</Form.Label>
                  <Form.Control 
                    type="text"
                    value={createBizForm.slug}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, slug: e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() })}
                    className="small py-2 font-monospace"
                    placeholder="slug-del-negocio"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Rubro</Form.Label>
                  <Form.Control 
                    type="text"
                    value={createBizForm.industry}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, industry: e.target.value })}
                    className="small py-2"
                    placeholder="Ej: Estética, Barbería"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Zona Horaria</Form.Label>
                  <Form.Control 
                    type="text"
                    value={createBizForm.timezone}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, timezone: e.target.value })}
                    className="small py-2 font-monospace"
                    placeholder="America/Argentina/Buenos_Aires"
                  />
                </Form.Group>
              </Col>

              {/* Columna 2: Suscripción y Fechas */}
              <Col lg={6} className="ps-lg-4">
                <h6 className="fw-bold text-uppercase text-success mb-3 small d-flex align-items-center gap-1.5" style={{ letterSpacing: "0.5px" }}>
                  <DollarSign size={14} />
                  <span>Suscripción y Fechas</span>
                </h6>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Plan</Form.Label>
                  <Form.Select 
                    value={createBizForm.plan}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, plan: e.target.value })}
                    className="small py-2"
                  >
                    <option value="starter">Starter ($19/mo)</option>
                    <option value="pro">Pro ($49/mo)</option>
                    <option value="business">Business ($99/mo)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Estado del SaaS</Form.Label>
                  <Form.Select 
                    value={createBizForm.subscriptionStatus}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, subscriptionStatus: e.target.value })}
                    className="small py-2"
                  >
                    <option value="trialing">Trialing (En Prueba)</option>
                    <option value="active">Active (Activo / Pago aprobado)</option>
                    <option value="past_due">Past Due (Pago demorado)</option>
                    <option value="canceled">Canceled (Cancelado)</option>
                    <option value="suspended">Suspended (Suspendido / Bloqueado)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Método / Proveedor de Pago</Form.Label>
                  <Form.Select 
                    value={createBizForm.provider}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, provider: e.target.value })}
                    className="small py-2"
                  >
                    <option value="free">Gratuito / Comp (Sin cargo)</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual">Manual / Override</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Fin de Trial</Form.Label>
                  <Form.Control 
                    type="date"
                    value={createBizForm.trialEndsAt}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, trialEndsAt: e.target.value })}
                    className="small py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Fin Período de Pago</Form.Label>
                  <Form.Control 
                    type="date"
                    value={createBizForm.currentPeriodEnd}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, currentPeriodEnd: e.target.value })}
                    className="small py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small text-muted mb-1">Fin Período de Gracia (Dunning)</Form.Label>
                  <Form.Control 
                    type="date"
                    value={createBizForm.gracePeriodEndsAt}
                    onChange={(e) => setCreateBizForm({ ...createBizForm, gracePeriodEndsAt: e.target.value })}
                    className="small py-2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowCreateBizModal(false)}
                className="rounded-pill px-4 small"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="success" 
                disabled={createBizLoading}
                className="rounded-pill px-4 small text-white bg-success hover-bg-success-dark border-0"
              >
                {createBizLoading ? "Creando..." : "Crear Negocio"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Create Plan Request Modal */}
      <Modal show={showCreateRequestModal} onHide={() => setShowCreateRequestModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold h5 text-dark d-flex align-items-center gap-2">
            <Plus size={20} className="text-purple-600" />
            <span>Crear Solicitud de Cambio de Plan</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={(e) => { e.preventDefault(); handleCreateRequest(); }}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted mb-1">Seleccionar Negocio / Inquilino</Form.Label>
              <Form.Select 
                value={createRequestForm.businessId}
                onChange={(e) => setCreateRequestForm({ ...createRequestForm, businessId: e.target.value })}
                className="small py-2"
                required
              >
                <option value="">-- Seleccionar Negocio --</option>
                {data.businesses?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slug})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-muted mb-1">Plan Solicitado</Form.Label>
              <Form.Select 
                value={createRequestForm.requestedPlan}
                onChange={(e) => setCreateRequestForm({ ...createRequestForm, requestedPlan: e.target.value })}
                className="small py-2"
                required
              >
                <option value="starter">Starter ($19/mo)</option>
                <option value="pro">Pro ($49/mo)</option>
                <option value="business">Business ($99/mo)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small text-muted mb-1">Estado Inicial</Form.Label>
              <Form.Select 
                value={createRequestForm.status}
                onChange={(e) => setCreateRequestForm({ ...createRequestForm, status: e.target.value })}
                className="small py-2"
                required
              >
                <option value="PENDING">Pendiente de Aprobación (PENDING)</option>
                <option value="APPROVED">Aprobado Directo (APPROVED)</option>
                <option value="REJECTED">Rechazado (REJECTED)</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowCreateRequestModal(false)}
                className="rounded-pill px-4 small"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="purple" 
                disabled={createRequestLoading}
                className="rounded-pill px-4 small text-white bg-purple-600 hover-bg-purple-700 border-0"
              >
                {createRequestLoading ? "Creando..." : "Crear Solicitud"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
