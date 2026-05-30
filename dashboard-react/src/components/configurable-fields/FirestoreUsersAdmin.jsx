import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, Table, Button, Badge, Modal, Form, Alert, Dropdown, Spinner, Row, Col, InputGroup } from "react-bootstrap";
import { 
  Users, UserPlus, Shield, UserX, AlertTriangle, MoreVertical, 
  Ban, CheckCircle, Mail, Clipboard, ClipboardCheck, History, Settings, Eye,
  PlusCircle, RefreshCw, KeyRound, UserCheck, ShieldQuestion,
  Star, ChevronDown, ChevronUp, Search, Calendar, FolderOpen, CreditCard,
  Briefcase, BarChart2, Package, Cpu, FileText, Check, X, Info, Save, Lock, Trash2
} from "lucide-react";
import { doc, getDocs, setDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";
import { firestoreDb } from "../../firebase/client";
import { usePermissions } from "../../auth/PermissionProvider";

const AVAILABLE_PERMISSIONS = [
  { action: "view_finances", name: "💼 Ver Módulo de Finanzas", desc: "Permite ver balances, cajas y reportes financieros." },
  { action: "manage_settings", name: "⚙️ Administrar Configuración", desc: "Permite modificar variables de marca, agenda y flujos." },
  { action: "manage_users", name: "👑 Administrar Usuarios y Permisos", desc: "Acceso total para invitar, editar roles y permisos en Firestore." },
  { action: "appointments.view", name: "🗓️ Ver Agenda de Turnos", desc: "Visualizar el calendario de reservas." },
  { action: "clients.view", name: "👥 Ver Módulo de Clientes (CRM)", desc: "Ver historial y fichas técnicas de clientes." },
  { action: "services.view", name: "✂️ Ver Módulo de Servicios", desc: "Ver catálogo de servicios y precios." },
  { action: "team.view", name: "💼 Ver Módulo de Equipo", desc: "Visualizar personal asignado del salón." },
  { action: "inventory.view", name: "📦 Ver Módulo de Inventario", desc: "Administración de stock y productos." },
  { action: "sheets.view", name: "📊 Sincronizar Google Sheets", desc: "Exportación de registros a hojas de cálculo." },
  { action: "workflows.view", name: "🔄 Ver Módulo de Workflows", desc: "Configuración de flujos de automatización." },
  { action: "automations.view", name: "⚡ Ver Módulo de Automatizaciones", desc: "Reglas automatizadas de alertas y mensajes." },
];

const DEFAULT_ROLE_PERMISSIONS = {
  owner: AVAILABLE_PERMISSIONS.map(p => p.action),
  admin: [
    "manage_settings",
    "manage_users",
    "appointments.view",
    "clients.view",
    "services.view",
    "team.view",
    "inventory.view",
    "sheets.view"
  ],
  finanzas: [
    "view_finances",
    "appointments.view",
    "clients.view"
  ],
  recepcion: [
    "appointments.view",
    "clients.view",
    "services.view"
  ],
  profesional: [
    "appointments.view"
  ]
};

export default function FirestoreUsersAdmin() {
  const { hasPermission } = usePermissions();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("profesional");
  const [invitePermissions, setInvitePermissions] = useState(DEFAULT_ROLE_PERMISSIONS.profesional);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Edit Form State
  const [editRole, setEditRole] = useState("");
  const [editPermissions, setEditPermissions] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!firestoreDb) return;
    setLoading(true);
    setError("");
    try {
      const usersCol = collection(firestoreDb, "users");
      const snap = await getDocs(usersCol);
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setUsers(list);
    } catch (err) {
      console.error("Error fetching Firestore users:", err);
      setError("Error al conectar con Firestore para obtener la lista de colaboradores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sync default permissions when role selection changes during invitation
  useEffect(() => {
    setInvitePermissions(DEFAULT_ROLE_PERMISSIONS[inviteRole] || []);
  }, [inviteRole]);

  // Sync default permissions when role selection changes during editing
  const handleEditRoleChange = (selectedRole) => {
    setEditRole(selectedRole);
    setEditPermissions(DEFAULT_ROLE_PERMISSIONS[selectedRole] || []);
  };

  // Toggle single permission check during invite
  const handleInvitePermissionToggle = (action) => {
    setInvitePermissions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  // Toggle single permission check during edit
  const handleEditPermissionToggle = (action) => {
    setEditPermissions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  // Invite handler
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !firestoreDb) return;

    const emailKey = inviteEmail.trim().toLowerCase();
    setInviteLoading(true);
    setError("");
    setSuccess("");

    try {
      await setDoc(doc(firestoreDb, "users", emailKey), {
        uid: "",
        email: emailKey,
        displayName: inviteName.trim() || "",
        role: inviteRole,
        permissions: invitePermissions,
        active: true,
        createdAt: new Date(),
        lastAccess: null
      });

      setSuccess(`Usuario ${emailKey} registrado con éxito en Firestore.`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("profesional");
      await fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      setError("No se pudo guardar el colaborador en Firestore.");
    } finally {
      setInviteLoading(false);
    }
  };

  // Update Role/Permissions of existing user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser || !firestoreDb) return;

    setEditLoading(true);
    setError("");
    setSuccess("");

    try {
      const userRef = doc(firestoreDb, "users", selectedUser.id);
      await updateDoc(userRef, {
        role: editRole,
        permissions: editPermissions
      });

      setSuccess(`Colaborador ${selectedUser.email} actualizado exitosamente.`);
      setShowEditModal(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      setError("No se pudieron guardar las modificaciones en Firestore.");
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle Active/Inactive status directly
  const handleToggleActive = async (user) => {
    if (!firestoreDb) return;
    setError("");
    setSuccess("");
    const nextActive = !user.active;

    try {
      const userRef = doc(firestoreDb, "users", user.id);
      await updateDoc(userRef, {
        active: nextActive
      });

      setSuccess(
        `El estado de ${user.email} se actualizó a ${
          nextActive ? "Activo" : "Suspendido"
        }.`
      );
      await fetchUsers();
    } catch (err) {
      console.error("Error toggling active state:", err);
      setError("No se pudo cambiar el estado de acceso del colaborador.");
    }
  };

  // Remove member completely
  const handleRemoveUser = async (user) => {
    if (!firestoreDb) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${user.email} de Firestore? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const userRef = doc(firestoreDb, "users", user.id);
      await deleteDoc(userRef);
      setSuccess("Colaborador eliminado definitivamente de Firestore.");
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("No se pudo eliminar el colaborador.");
    }
  };

  // Filters logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const email = String(u.email || "").toLowerCase();
      const name = String(u.displayName || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = email.includes(q) || name.includes(q);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      
      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = u.active === true;
      if (statusFilter === "SUSPENDED") matchesStatus = u.active === false;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const getInitials = (u) => {
    const name = u?.displayName || "";
    if (!name) return u?.email?.substring(0, 2).toUpperCase() || "US";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="premium-workspace py-2 animate-fade-in">
      <style>{`
        .premium-workspace {
          font-family: 'Outfit', sans-serif !important;
          color: #1e1b4b;
          background-color: #fcfcff;
        }
        .premium-card {
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.05);
          border-radius: 20px;
          box-shadow: 0 10px 30px -10px rgba(124, 58, 237, 0.04);
          transition: all 0.3s ease;
        }
        .btn-gradient-purple {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          border: none;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 15px -3px rgba(124, 58, 237, 0.35);
          transition: all 0.25s ease;
        }
        .btn-gradient-purple:hover {
          background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
          box-shadow: 0 8px 25px -4px rgba(124, 58, 237, 0.4);
          transform: translateY(-1px);
        }
        .badge-active {
          background-color: rgba(16, 185, 129, 0.08) !important;
          color: #10b981 !important;
          border: 1.5px solid rgba(16, 185, 129, 0.15);
          font-weight: 700;
        }
        .badge-suspended {
          background-color: rgba(239, 68, 68, 0.08) !important;
          color: #ef4444 !important;
          border: 1.5px solid rgba(239, 68, 68, 0.15);
          font-weight: 700;
        }
        .avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
          font-size: 12px;
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 rounded-4 text-purple-600 shadow-sm" style={{ backgroundColor: "#f5f3ff" }}>
            <Users size={32} className="text-purple-600" />
          </div>
          <div>
            <h1 className="fw-black h3 text-dark mb-0">Usuarios y Permisos</h1>
            <p className="text-secondary mb-0 small mt-1">
              Administración directa de colaboradores y control granular de accesos en Google Cloud Firestore.
            </p>
          </div>
        </div>
        <Button
          className="d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill border-0 shadow-sm text-white fw-bold btn-gradient-purple"
          style={{ fontSize: "13px" }}
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus size={16} />
          <span>Invitar Colaborador</span>
        </Button>
      </div>

      {/* MESSAGES */}
      {(error || success) && (
        <div className="mb-4 animate-slide-in">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")} className="rounded-4 shadow-sm py-2.5">
              <div className="d-flex align-items-center gap-2 smaller">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess("")} className="rounded-4 shadow-sm py-2.5">
              <div className="d-flex align-items-center gap-2 smaller">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* FILTERS */}
      <div className="premium-card p-3.5 bg-white mb-4">
        <Row className="g-3 align-items-center">
          <Col xs={12} md={5}>
            <InputGroup className="rounded-pill overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <InputGroup.Text className="bg-white border-0 pe-0 text-muted">
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por nombre o correo electrónico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 px-2 py-2 small text-dark"
                style={{ fontSize: "13px" }}
              />
            </InputGroup>
          </Col>
          <Col xs={6} md={3}>
            <Form.Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-pill border px-3 py-2 text-capitalize small"
              style={{ fontSize: "13px", height: "38px" }}
            >
              <option value="all">Todos los Roles</option>
              <option value="owner">👑 Owner</option>
              <option value="admin">⚙️ Administrador</option>
              <option value="finanzas">💼 Gestor Financiero</option>
              <option value="recepcion">🗓️ Recepcionista</option>
              <option value="profesional">✂️ Profesional</option>
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-pill border px-3 py-2 text-capitalize small"
              style={{ fontSize: "13px", height: "38px" }}
            >
              <option value="all">Todos los Estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="SUSPENDED">Suspendidos</option>
            </Form.Select>
          </Col>
          <Col xs={12} md={1} className="text-md-end text-center">
            <Button
              variant="light"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setStatusFilter("all");
                fetchUsers();
              }}
              className="rounded-circle border p-2 text-secondary hover-text-dark"
              title="Refrescar datos"
              style={{ width: "38px", height: "38px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />
            </Button>
          </Col>
        </Row>
      </div>

      {/* USERS TABLE */}
      <div className="premium-card bg-white p-4">
        <h3 className="h6 fw-black text-dark mb-3.5 text-uppercase" style={{ letterSpacing: "0.03em" }}>
          Colaboradores Registrados ({filteredUsers.length})
        </h3>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" className="text-purple-600 mb-2" />
            <div className="text-muted small">Consultando registros en Firestore...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-5 border rounded-4 border-dashed bg-light bg-opacity-20">
            <Users size={32} className="text-muted mb-2" />
            <div className="fw-bold text-dark smaller">No se encontraron colaboradores</div>
            <p className="text-secondary smaller mb-0">Comprueba los filtros seleccionados o registra una nueva cuenta.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ borderRadius: "16px", border: "1px solid rgba(0, 0, 0, 0.03)" }}>
            <Table hover align="middle" className="mb-0">
              <thead className="bg-light">
                <tr style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "2px solid rgba(0,0,0,0.04)" }}>
                  <th className="p-3 fw-bold text-secondary">Colaborador</th>
                  <th className="p-3 fw-bold text-secondary">Correo Electrónico</th>
                  <th className="p-3 fw-bold text-secondary">Rol Firestore</th>
                  <th className="p-3 fw-bold text-secondary">UID de Firebase</th>
                  <th className="p-3 fw-bold text-secondary">Estado</th>
                  <th className="p-3 fw-bold text-secondary">Último Acceso</th>
                  <th className="p-3 fw-bold text-secondary text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isOwner = u.role === "owner";
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.02)" }}>
                      <td className="p-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar-circle">
                            {getInitials(u)}
                          </div>
                          <div>
                            <strong className="text-dark small d-block">
                              {u.displayName || "Invitado Pendiente"}
                            </strong>
                            <span className="text-muted smaller d-block mt-0.5" style={{ fontSize: "10px" }}>
                              {u.createdAt ? `Creado: ${new Date(u.createdAt.seconds * 1000 || u.createdAt).toLocaleDateString()}` : "Sin fecha"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-dark small">{u.email}</span>
                      </td>
                      <td className="p-3">
                        <Badge bg="purple-light" className="text-purple-600 px-2.5 py-1 rounded-pill" style={{ fontSize: "10.5px", border: "1px solid rgba(124, 58, 237, 0.1)", backgroundColor: "rgba(124, 58, 237, 0.04)" }}>
                          {u.role === "owner" ? "👑 Owner" : u.role === "admin" ? "⚙️ Administrador" : u.role === "finanzas" ? "💼 Finanzas" : u.role === "recepcion" ? "🗓️ Recepcionista" : "✂️ Profesional"}
                        </Badge>
                      </td>
                      <td className="p-3 font-monospace smaller text-secondary" style={{ fontSize: "11px" }}>
                        {u.uid ? `${u.uid.substring(0, 10)}...` : <span className="text-muted italic">Pendiente Login</span>}
                      </td>
                      <td className="p-3">
                        <Badge className={`rounded-pill px-2.5 py-1 ${u.active === true ? "badge-active" : "badge-suspended"}`} style={{ fontSize: "10.5px" }}>
                          {u.active === true ? "Activo" : "Suspendido"}
                        </Badge>
                      </td>
                      <td className="p-3 text-secondary smaller" style={{ fontSize: "11.5px" }}>
                        {u.lastAccess ? (
                          <span className="d-flex align-items-center gap-1">
                            <History size={12} className="text-purple-500" />
                            {new Date(u.lastAccess.seconds * 1000 || u.lastAccess).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : (
                          <span className="text-muted-opacity italic">Nunca</span>
                        )}
                      </td>
                      <td className="p-3 text-end">
                        {!isOwner ? (
                          <Dropdown align="end">
                            <Dropdown.Toggle as={Button} variant="link" className="p-0 text-muted shadow-none border-0 bg-transparent hover-text-dark">
                              <MoreVertical size={18} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-lg border rounded-3 p-1">
                              <Dropdown.Item
                                className="d-flex align-items-center gap-2 rounded-2 py-2 text-dark smaller"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setEditRole(u.role);
                                  setEditPermissions(u.permissions || []);
                                  setShowEditModal(true);
                                }}
                              >
                                <Settings size={14} className="text-purple-600" />
                                Editar Perfil / Permisos
                              </Dropdown.Item>

                              <Dropdown.Item
                                className="d-flex align-items-center gap-2 rounded-2 py-2 text-dark smaller"
                                onClick={() => handleToggleActive(u)}
                              >
                                <Ban size={14} className="text-secondary" />
                                {u.active === true ? "Suspender Acceso" : "Reactivar Acceso"}
                              </Dropdown.Item>

                              <Dropdown.Divider />

                              <Dropdown.Item
                                className="d-flex align-items-center gap-2 rounded-2 py-2 text-danger smaller"
                                onClick={() => handleRemoveUser(u)}
                              >
                                <Trash2 size={14} />
                                Eliminar de Firestore
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        ) : (
                          <span className="text-muted-opacity smaller font-bold italic" style={{ fontSize: "11px" }}>Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* INVITE MODAL */}
      <Modal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg"
        style={{ backdropFilter: "blur(4px)" }}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light border-0 py-3">
          <Modal.Title className="h5 fw-black d-flex align-items-center gap-2">
            <UserPlus className="text-purple-600" size={20} />
            <span>Invitar Nuevo Colaborador</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleInvite}>
          <Modal.Body className="p-4">
            <p className="text-muted small mb-4">
              Ingresa los datos comerciales del colaborador. Su cuenta de Google se enlazará automáticamente al iniciar sesión por primera vez.
            </p>

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Correo Electrónico de Google *</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    placeholder="ejemplo@gmail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="rounded-3 py-2 small"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Nombre y Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="rounded-3 py-2 small"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small">Rol en el Negocio *</Form.Label>
              <Form.Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-3 py-2 text-capitalize small"
              >
                <option value="admin">⚙️ Administrador</option>
                <option value="finanzas">💼 Gestor Financiero</option>
                <option value="recepcion">🗓️ Recepcionista</option>
                <option value="profesional">✂️ Profesional</option>
              </Form.Select>
            </Form.Group>

            <Form.Label className="fw-bold small text-purple-600 mb-2">Permisos Granulares Concedidos</Form.Label>
            <div className="border rounded-4 p-3.5 bg-light bg-opacity-20" style={{ maxHeight: "250px", overflowY: "auto" }}>
              <Row className="g-2">
                {AVAILABLE_PERMISSIONS.map((p) => {
                  const isChecked = invitePermissions.includes(p.action);
                  return (
                    <Col xs={12} md={6} key={p.action}>
                      <Form.Check 
                        type="checkbox"
                        id={`invite-perm-${p.action}`}
                        label={
                          <div>
                            <strong className="d-block smaller text-dark">{p.name}</strong>
                            <span className="text-secondary" style={{ fontSize: "9.5px", display: "block" }}>{p.desc}</span>
                          </div>
                        }
                        checked={isChecked}
                        onChange={() => handleInvitePermissionToggle(p.action)}
                        className="p-2 border rounded-3 bg-white"
                        style={{ fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "8px" }}
                      />
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light py-3">
            <Button
              variant="outline-secondary"
              onClick={() => setShowInviteModal(false)}
              className="rounded-pill px-4 small"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={inviteLoading}
              className="rounded-pill px-4.5 btn-gradient-purple small"
            >
              {inviteLoading ? <Spinner size="sm" /> : "Guardar en Firestore"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg"
        style={{ backdropFilter: "blur(4px)" }}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light border-0 py-3">
          <Modal.Title className="h5 fw-black d-flex align-items-center gap-2">
            <Settings className="text-purple-600" size={20} />
            <span>Editar Perfil y Permisos</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body className="p-4">
            <div className="alert alert-info border-0 p-3 rounded-4 smaller mb-4">
              Modificando permisos para: <strong className="text-dark">{selectedUser?.email}</strong>
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold small">Rol en el Negocio *</Form.Label>
              <Form.Select
                value={editRole}
                onChange={(e) => handleEditRoleChange(e.target.value)}
                className="rounded-3 py-2 text-capitalize small"
              >
                <option value="admin">⚙️ Administrador</option>
                <option value="finanzas">💼 Gestor Financiero</option>
                <option value="recepcion">🗓️ Recepcionista</option>
                <option value="profesional">✂️ Profesional</option>
              </Form.Select>
            </Form.Group>

            <Form.Label className="fw-bold small text-purple-600 mb-2">Permisos Granulares Concedidos</Form.Label>
            <div className="border rounded-4 p-3.5 bg-light bg-opacity-20" style={{ maxHeight: "250px", overflowY: "auto" }}>
              <Row className="g-2">
                {AVAILABLE_PERMISSIONS.map((p) => {
                  const isChecked = editPermissions.includes(p.action);
                  return (
                    <Col xs={12} md={6} key={p.action}>
                      <Form.Check 
                        type="checkbox"
                        id={`edit-perm-${p.action}`}
                        label={
                          <div>
                            <strong className="d-block smaller text-dark">{p.name}</strong>
                            <span className="text-secondary" style={{ fontSize: "9.5px", display: "block" }}>{p.desc}</span>
                          </div>
                        }
                        checked={isChecked}
                        onChange={() => handleEditPermissionToggle(p.action)}
                        className="p-2 border rounded-3 bg-white"
                        style={{ fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "8px" }}
                      />
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light py-3">
            <Button
              variant="outline-secondary"
              onClick={() => setShowEditModal(false)}
              className="rounded-pill px-4 small"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={editLoading}
              className="rounded-pill px-4.5 btn-gradient-purple small"
            >
              {editLoading ? <Spinner size="sm" /> : "Guardar Cambios"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
