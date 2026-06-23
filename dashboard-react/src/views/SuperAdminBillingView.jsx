import React, { useEffect, useState } from "react";
import { Container, Table, Badge, Button, Modal, Form, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { Edit2, Shield, DollarSign, Users, Award, AlertCircle } from "lucide-react";
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
    gracePeriodEndsAt: ""
  });
  const [overrideLoading, setOverrideLoading] = useState(false);

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

  const fetchAdminBillingData = async () => {
    setLoading(true);
    setError("");
    try {
      const [bizRes, reqsRes, usersRes, allUsersRes] = await Promise.all([
        api.get("/admin/billing/businesses"),
        api.get("/admin/billing/requests"),
        api.get("/admin/users/pending"),
        api.get("/admin/users/all")
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
    } catch (err) {
      console.error("Error fetching superadmin billing data:", err);
      setError("No tienes permisos de Administrador Global o el servidor no respondió.");
    } finally {
      setLoading(false);
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
      gracePeriodEndsAt: biz.gracePeriodEndsAt ? biz.gracePeriodEndsAt.substring(0, 10) : ""
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
        gracePeriodEndsAt: overrideForm.gracePeriodEndsAt || null
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
    const map = {
      trialing: "info",
      active: "success",
      past_due: "warning",
      canceled: "secondary",
      suspended: "danger"
    };
    return <Badge bg={map[status] || "light"} className="rounded-pill text-uppercase">{status}</Badge>;
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
    <Container fluid className="py-4 px-md-5">
      <header className="mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
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

      {error && <Alert variant="danger" className="border-0 shadow-sm mb-4 small">{error}</Alert>}

      {/* KPI Stats widgets */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={4}>
          <Card className="border-0 shadow-sm rounded-4" style={{ background: "#fff" }}>
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
          <Card className="border-0 shadow-sm rounded-4" style={{ background: "#fff" }}>
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
          <Card className="border-0 shadow-sm rounded-4" style={{ background: "#fff" }}>
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
        <Card className="border-0 shadow-sm rounded-4 mb-4 border-warning" style={{ background: "#fff", borderLeft: "4px solid #f59e0b" }}>
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
            
            <Table responsive className="mb-0">
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
                  <tr key={r.id} className="border-bottom small align-middle">
                    <td className="py-3 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 fw-bold text-dark">{r.business?.name}</td>
                    <td className="py-3"><Badge bg="secondary" className="uppercase">{r.business?.plan}</Badge></td>
                    <td className="py-3"><Badge bg="primary" className="uppercase">{r.requestedPlan}</Badge></td>
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
          </Card.Body>
        </Card>
      )}

      {pendingUsers.length > 0 && (
        <Card className="border-0 shadow-sm rounded-4 mb-4 border-primary" style={{ background: "#fff", borderLeft: "4px solid #3b82f6" }}>
          <Card.Body className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Users className="text-primary" size={20} />
              <h2 className="fw-bold h6 mb-0 text-dark">Nuevos Usuarios (Pendientes de Aprobación) ({pendingUsers.filter(u => u.status === "pending").length})</h2>
            </div>
            
            <Table responsive className="mb-0">
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
                  <tr key={u.id} className="border-bottom small align-middle">
                    <td className="py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 fw-bold text-dark">{u.email}</td>
                    <td className="py-3">{u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "-"}</td>
                    <td className="py-3">
                      <Badge bg={u.status === "pending" ? "warning" : "danger"} className="uppercase">{u.status}</Badge>
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
          </Card.Body>
        </Card>
      )}

      {/* List Card */}
      <Card className="border-0 shadow-sm rounded-4" style={{ background: "#fff" }}>
        <Card.Body className="p-4">
          <h2 className="fw-bold h6 mb-3 text-dark">Empresas e Inquilinos</h2>
          
          <Table responsive className="mb-0">
            <thead>
              <tr className="border-bottom text-muted smaller uppercase">
                <th className="py-2.5">Nombre Negocio</th>
                <th className="py-2.5">Email del Negocio</th>
                <th className="py-2.5">Slug</th>
                <th className="py-2.5">Plan</th>
                <th className="py-2.5">Estado</th>
                <th className="py-2.5">Fin Trial</th>
                <th className="py-2.5">Fin Período</th>
                <th className="py-2.5">MRR</th>
                <th className="py-2.5 text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.businesses?.map((b) => (
                <tr key={b.id} className="border-bottom small align-middle">
                  <td className="py-3">
                    <strong className="text-dark">{b.name}</strong>
                    <span className="text-muted smaller d-block mt-0.5" style={{ fontSize: "10.5px" }}>ID: {b.id}</span>
                  </td>
                  <td className="py-3 font-monospace text-muted small">{b.ownerEmail || "-"}</td>
                  <td className="py-3 font-monospace text-muted">{b.slug}</td>
                  <td className="py-3">
                    <Badge bg="light" className="text-dark border uppercase">{b.plan}</Badge>
                  </td>
                  <td className="py-3">{getStatusBadge(b.subscriptionStatus)}</td>
                  <td className="py-3">{b.trialEndsAt ? new Date(b.trialEndsAt).toLocaleDateString() : "-"}</td>
                  <td className="py-3">{b.currentPeriodEnd ? new Date(b.currentPeriodEnd).toLocaleDateString() : "-"}</td>
                  <td className="py-3 fw-bold text-success">${b.mrr}</td>
                  <td className="py-3 text-end">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Usuarios Registrados en el Sistema */}
      <Card className="border-0 shadow-sm rounded-4 mt-4" style={{ background: "#fff" }}>
        <Card.Body className="p-4">
          <h2 className="fw-bold h6 mb-3 text-dark">Usuarios Registrados en el Sistema</h2>
          
          <Table responsive className="mb-0">
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
                <tr key={u.id} className="border-bottom small align-middle">
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
                    <Badge bg={u.status === "active" ? "success" : u.status === "pending" ? "warning" : "danger"} className="uppercase">
                      {u.status || "active"}
                    </Badge>
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
        </Card.Body>
      </Card>

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
    </Container>
  );
}
