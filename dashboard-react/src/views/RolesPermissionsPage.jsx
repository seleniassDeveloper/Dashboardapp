import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Spinner, InputGroup } from "react-bootstrap";
import { 
  Shield, ShieldAlert, ShieldCheck, UserPlus, Users, ToggleLeft, ToggleRight, 
  Trash2, Copy, Search, Filter, Save, RotateCcw, AlertTriangle, CheckCircle,
  PlusCircle, RefreshCw, KeyRound, ArrowRightLeft, UserCheck, ShieldQuestion
} from "lucide-react";
import api from "../lib/api.js";
import { usePermissions } from "../auth/PermissionProvider.jsx";
import { useTranslation } from "react-i18next";

export default function RolesPermissionsPage() {
  const { t, i18n } = useTranslation("views");
  const { hasPermission } = usePermissions();

  const [activeTab, setActiveTab] = useState("matrix"); // "matrix" | "staff" | "create-permission"

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search and filter state for matrix
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");

  // Modals state for roles
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit" | "duplicate"
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Role Form state
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);

  // Permission Matrix changes tracking state
  const [matrixChanges, setMatrixChanges] = useState({}); // { "roleId": ["perm1", "perm2"] }
  const [isMatrixDirty, setIsMatrixDirty] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Staff association tab state
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  // Custom permission tab state
  const [newPermissionAction, setNewPermissionAction] = useState("");
  const [newPermissionModule, setNewPermissionModule] = useState("");
  const [newPermissionDescription, setNewPermissionDescription] = useState("");
  const [creatingPermission, setCreatingPermission] = useState(false);

  // Load Matrix and Roles data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch visual matrix aggregated data
      const matrixRes = await api.get("/permission-matrix");
      if (matrixRes.data?.success) {
        const dbRoles = matrixRes.data.roles || [];
        const dbPerms = matrixRes.data.permissions || [];
        
        setRoles(dbRoles);
        setPermissions(dbPerms);

        // Pre-fill matrix changes from database state
        const initialMatrix = {};
        dbRoles.forEach(r => {
          initialMatrix[r.id] = r.permissions.map(rp => rp.permission.action);
        });
        setMatrixChanges(initialMatrix);
        setIsMatrixDirty(false);
      }
    } catch (err) {
      console.error("Error loading permission matrix:", err);
      setError(
        err.response?.data?.error || t("rolesPermissions.errors.loadMatrix")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load Members for Staff tab
  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setMembersError("");
      const res = await api.get("/members");
      if (res.data?.success) {
        setMembers(res.data.members || []);
        setInvitations(res.data.invitations || []);
      }
    } catch (err) {
      console.error("Error loading members:", err);
      setMembersError(err.response?.data?.error || t("rolesPermissions.errors.loadCollaborators"));
    } finally {
      setMembersLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "staff") {
      fetchMembers();
    }
  }, [activeTab, fetchMembers]);

  // Statistics summaries
  const stats = useMemo(() => {
    const totalRoles = roles.length;
    const systemRoles = roles.filter(r => r.isSystemRole).length;
    const customRoles = totalRoles - systemRoles;
    const totalPerms = permissions.length;
    const activeStaff = roles.reduce((sum, r) => sum + (r.userCount || 0), 0);

    return { totalRoles, systemRoles, customRoles, totalPerms, activeStaff };
  }, [roles, permissions]);

  // Filter modules lists
  const modulesList = useMemo(() => {
    const set = new Set();
    permissions.forEach(p => {
      if (p.module) set.add(p.module);
    });
    return Array.from(set).sort();
  }, [permissions]);

  // Filtered permissions list based on search and selected module
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = 
        p.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesModule = selectedModule === "all" || p.module === selectedModule;
      
      return matchesSearch && matchesModule;
    });
  }, [permissions, searchQuery, selectedModule]);

  // Checkbox toggle handler for matrix
  const handleMatrixToggle = (roleId, permissionAction) => {
    // Prevent modifying main system owner permissions
    const role = roles.find(r => r.id === roleId);
    if (role?.key === "owner" && !role.businessId) return;

    setMatrixChanges(prev => {
      const assigned = prev[roleId] || [];
      let updated;
      if (assigned.includes(permissionAction)) {
        updated = assigned.filter(a => a !== permissionAction);
      } else {
        updated = [...assigned, permissionAction];
      }

      // Check if actually dirty compared to current DB roles state
      const dbRole = roles.find(r => r.id === roleId);
      const dbActions = dbRole ? dbRole.permissions.map(rp => rp.permission.action) : [];
      
      const isDirty = roles.some(r => {
        const curActions = r.id === roleId ? updated : (prev[r.id] || []);
        const originalActions = r.permissions.map(rp => rp.permission.action);
        
        if (curActions.length !== originalActions.length) return true;
        return curActions.some(a => !originalActions.includes(a)) || originalActions.some(a => !curActions.includes(a));
      });

      setIsMatrixDirty(isDirty);

      return {
        ...prev,
        [roleId]: updated
      };
    });
  };

  // Bulk save matrix changes
  const handleSaveMatrix = async () => {
    setSavingMatrix(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch("/permission-matrix", { matrix: matrixChanges });
      if (res.data?.success) {
        setSuccess(t("rolesPermissions.success.matrixUpdated"));
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || t("rolesPermissions.dirtyMatrixBar.saveMatrixError"));
    } finally {
      setSavingMatrix(false);
    }
  };

  // Revert matrix changes
  const handleRevertMatrix = () => {
    const initialMatrix = {};
    roles.forEach(r => {
      initialMatrix[r.id] = r.permissions.map(rp => rp.permission.action);
    });
    setMatrixChanges(initialMatrix);
    setIsMatrixDirty(false);
    setSuccess(t("rolesPermissions.success.changesDiscarded"));
  };

  // Create role action
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setRoleName("");
    setRoleDescription("");
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  // Edit role description action
  const handleOpenEditModal = (role) => {
    if (role.isSystemRole) return;
    setModalMode("edit");
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  // Duplicate role action
  const handleOpenDuplicateModal = (role) => {
    setModalMode("duplicate");
    setRoleName(`${role.name} (${t("rolesPermissions.modal.duplicateCopySuffix", { defaultValue: "Copia" })})`);
    setRoleDescription(role.description || "");
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  // Save role mutation
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setRoleSaving(true);
    setError("");
    setSuccess("");

    try {
      let res;
      if (modalMode === "create") {
        res = await api.post("/roles", {
          name: roleName.trim(),
          description: roleDescription.trim()
        });
      } else if (modalMode === "edit") {
        res = await api.patch(`/roles/${selectedRole.id}`, {
          name: roleName.trim(),
          description: roleDescription.trim()
        });
      } else if (modalMode === "duplicate") {
        res = await api.post(`/roles/${selectedRole.id}/duplicate`, {
          name: roleName.trim(),
          description: roleDescription.trim()
        });
      }

      if (res.data?.success) {
        setSuccess(
          modalMode === "create" ? t("rolesPermissions.success.roleCreated") :
          modalMode === "edit" ? t("rolesPermissions.success.roleUpdated") : t("rolesPermissions.success.roleDuplicated")
        );
        setShowRoleModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || t("rolesPermissions.errors.saveRoleError"));
    } finally {
      setRoleSaving(false);
    }
  };

  // Delete custom role mutation
  const handleDeleteRole = async (role) => {
    if (role.isSystemRole) return;
    if (role.userCount > 0) {
      alert(t("rolesPermissions.errors.roleInUse", { name: role.name, count: role.userCount }));
      return;
    }

    if (!window.confirm(t("rolesPermissions.errors.deleteConfirm", { name: role.name }))) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      const res = await api.delete(`/roles/${role.id}`);
      if (res.data?.success) {
        setSuccess(t("rolesPermissions.success.roleDeleted", { name: role.name }));
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || t("rolesPermissions.errors.deleteError"));
    }
  };

  // Toggle active/inactive custom role
  const handleToggleActiveRole = async (role) => {
    if (role.isSystemRole) return;
    const nextStatus = !role.isActive;
    
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/roles/${role.id}`, { isActive: nextStatus });
      if (res.data?.success) {
        const statusText = nextStatus 
          ? t("rolesPermissions.table.statusActive") 
          : t("rolesPermissions.table.statusInactive");
        setSuccess(t("rolesPermissions.success.roleToggled", { name: role.name, status: statusText }));
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || t("rolesPermissions.errors.toggleError"));
    }
  };

  // Staff Tab: Handle dynamically changing a member's role
  const handleRoleChange = async (memberId, roleKey) => {
    setUpdatingMemberId(memberId);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch(`/members/${memberId}/role`, { roleKey });
      if (res.data?.success) {
        setSuccess(t("rolesPermissions.success.memberRoleUpdated"));
        await fetchMembers();
        await fetchData(); // refresh counters on roles list
      }
    } catch (err) {
      console.error("Error updating member role:", err);
      setError(err.response?.data?.error || t("rolesPermissions.errors.roleUpdateError"));
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Create Permission Form Submit Handler
  const handleCreatePermission = async (e) => {
    e.preventDefault();
    if (!newPermissionAction.trim() || !newPermissionModule.trim()) return;

    setCreatingPermission(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/roles/permissions/create", {
        action: newPermissionAction.toLowerCase().trim(),
        module: newPermissionModule.toLowerCase().trim(),
        description: newPermissionDescription.trim()
      });

      if (res.data?.success) {
        setSuccess(t("rolesPermissions.success.permCreated", { name: res.data.permission.action }));
        setNewPermissionAction("");
        setNewPermissionModule("");
        setNewPermissionDescription("");
        await fetchData(); // Refresh roles matrix and catalog
        setActiveTab("matrix"); // Back to matrix tab to view it
      }
    } catch (err) {
      console.error("Error creating custom permission:", err);
      setError(err.response?.data?.error || t("rolesPermissions.errors.createPermError"));
    } finally {
      setCreatingPermission(false);
    }
  };

  return (
    <Container fluid className="py-4 animate-fade-in">
      {/* HEADER SECTION */}
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-black h3 text-dark d-flex align-items-center gap-2">
            <Shield className="text-purple-600" size={28} />
            {t("rolesPermissions.title")}
          </h1>
          <p className="text-secondary mb-0 small">
            {t("rolesPermissions.subtitle")}
          </p>
        </div>
        {hasPermission("roles.create") && activeTab === "matrix" && (
          <Button
            onClick={handleOpenCreateModal}
            className="d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill border-0 shadow-sm text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
          >
            <UserPlus size={18} />
            <span className="fw-bold">{t("rolesPermissions.btnCreateRole")}</span>
          </Button>
        )}
      </header>

      {/* ALERTS */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="rounded-4 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-2">
            <ShieldAlert size={20} />
            <span>{error}</span>
          </div>
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")} className="rounded-4 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={20} />
            <span>{success}</span>
          </div>
        </Alert>
      )}

      {/* METRICS GRID */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="card-premium border-0 shadow-sm p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted smaller text-uppercase fw-semibold">{t("rolesPermissions.stats.totalRoles")}</div>
                <div className="display-6 fw-black mt-1">{stats.totalRoles}</div>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-circle">
                <Shield size={24} />
              </div>
            </div>
            <div className="text-muted smaller mt-3">
              <Badge bg="dark" className="me-1">{stats.systemRoles} {t("rolesPermissions.stats.systemRoles")}</Badge>
              <Badge bg="purple" className="text-white">{stats.customRoles} {t("rolesPermissions.stats.customRoles")}</Badge>
            </div>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="card-premium border-0 shadow-sm p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted smaller text-uppercase fw-semibold">{t("rolesPermissions.stats.totalPerms")}</div>
                <div className="display-6 fw-black mt-1">{stats.totalPerms}</div>
              </div>
              <div className="p-3 bg-success-50 text-success rounded-circle">
                <ShieldCheck size={24} />
              </div>
            </div>
            <div className="text-muted smaller mt-3">
              {t("rolesPermissions.stats.totalPermsDesc")}
            </div>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="card-premium border-0 shadow-sm p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted smaller text-uppercase fw-semibold">{t("rolesPermissions.stats.activeStaff")}</div>
                <div className="display-6 fw-black mt-1">{stats.activeStaff}</div>
              </div>
              <div className="p-3 bg-primary-50 text-primary rounded-circle">
                <Users size={24} />
              </div>
            </div>
            <div className="text-muted smaller mt-3">
              {t("rolesPermissions.stats.activeStaffDesc")}
            </div>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="card-premium border-0 shadow-sm p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted smaller text-uppercase fw-semibold">{t("rolesPermissions.stats.changes")}</div>
                <div className="display-6 fw-black mt-1">{isMatrixDirty ? t("rolesPermissions.stats.pending") : t("rolesPermissions.stats.saved")}</div>
              </div>
              <div className="p-3 bg-warning-50 text-warning rounded-circle">
                <RotateCcw size={24} />
              </div>
            </div>
            <div className="text-muted smaller mt-3">
              {isMatrixDirty ? t("rolesPermissions.stats.dirtyDesc") : t("rolesPermissions.stats.cleanDesc")}
            </div>
          </Card>
        </Col>
      </Row>

      {/* NAVIGATION TABS */}
      <div className="d-flex border-bottom mb-4" style={{ gap: "2px" }}>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-3 border-0 bg-transparent fw-bold small transition-all ${
            activeTab === "matrix" 
              ? "text-purple-600 border-bottom-3 border-purple-600" 
              : "text-secondary hover-text-dark"
          }`}
          style={{ 
            borderBottom: activeTab === "matrix" ? "3px solid #7c3aed" : "3px solid transparent",
            marginBottom: "-1px"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <Shield size={16} />
            {t("rolesPermissions.matrixTab")}
          </div>
        </button>

        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-3 border-0 bg-transparent fw-bold small transition-all ${
            activeTab === "staff" 
              ? "text-purple-600 border-bottom-3 border-purple-600" 
              : "text-secondary hover-text-dark"
          }`}
          style={{ 
            borderBottom: activeTab === "staff" ? "3px solid #7c3aed" : "3px solid transparent",
            marginBottom: "-1px"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <Users size={16} />
            {t("rolesPermissions.staffTab")}
          </div>
        </button>

        {hasPermission("permissions.edit") && (
          <button
            onClick={() => setActiveTab("create-permission")}
            className={`px-4 py-3 border-0 bg-transparent fw-bold small transition-all ${
              activeTab === "create-permission" 
                ? "text-purple-600 border-bottom-3 border-purple-600" 
                : "text-secondary hover-text-dark"
            }`}
            style={{ 
              borderBottom: activeTab === "create-permission" ? "3px solid #7c3aed" : "3px solid transparent",
              marginBottom: "-1px"
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <PlusCircle size={16} />
              {t("rolesPermissions.customPermTab")}
            </div>
          </button>
        )}
      </div>

      {loading && activeTab === "matrix" ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted small mt-2">{t("rolesPermissions.stats.loadingMatrix", { defaultValue: "Cargando matriz y roles relacionales..." })}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MATRIX & ROLES CRUD */}
          {activeTab === "matrix" && (
            <>
              {/* ROLES MANAGEMENT LIST */}
              <Card className="card-premium border-0 shadow-sm overflow-hidden mb-5 p-4 bg-white">
                <h2 className="fw-bold h5 mb-3 text-dark">{t("rolesPermissions.rolesListTitle")}</h2>
                <div className="table-responsive rounded-3 border">
                  <Table hover align="middle" className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 text-muted fw-bold small text-uppercase" style={{ width: "220px" }}>{t("rolesPermissions.table.roleName")}</th>
                        <th className="py-3 text-muted fw-bold small text-uppercase">{t("rolesPermissions.table.description")}</th>
                        <th className="py-3 text-muted fw-bold small text-uppercase text-center" style={{ width: "130px" }}>{t("rolesPermissions.table.collaborators")}</th>
                        <th className="py-3 text-muted fw-bold small text-uppercase text-center" style={{ width: "120px" }}>{t("rolesPermissions.table.type")}</th>
                        <th className="px-4 py-3 text-muted fw-bold small text-uppercase text-center" style={{ width: "160px" }}>{t("rolesPermissions.table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((r) => {
                        const isSystem = r.isSystemRole;
                        const canEdit = !isSystem && hasPermission("roles.edit");
                        const canDelete = !isSystem && hasPermission("roles.delete") && (r.userCount || 0) === 0;

                        return (
                          <tr key={r.id}>
                            <td className="px-4 py-3">
                              <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                <Shield size={16} className={isSystem ? "text-purple-600" : "text-secondary"} />
                                {r.name}
                              </div>
                              <span className="text-muted smaller d-block mt-0.5">{t("rolesPermissions.table.keyLabel", { defaultValue: "Clave:" })} {r.key}</span>
                            </td>
                            <td className="py-3 text-secondary small" style={{ fontSize: "12.5px" }}>
                              {r.description || t("rolesPermissions.table.noDesc")}
                            </td>
                            <td className="py-3 text-center">
                              <Badge bg="light" className="text-dark border px-3 py-1.5 rounded-pill fw-bold">
                                {r.userCount || 0} {t("rolesPermissions.table.active")}
                              </Badge>
                            </td>
                            <td className="py-3 text-center">
                              {isSystem ? (
                                <Badge bg="dark" className="px-3 py-1.5 rounded-pill text-white">{t("rolesPermissions.table.system")}</Badge>
                              ) : (
                                <Badge bg="purple" className="px-3 py-1.5 rounded-pill text-white">{t("rolesPermissions.table.custom")}</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="d-flex justify-content-center align-items-center gap-2">
                                <Button
                                  variant="light"
                                  size="sm"
                                  disabled={isSystem || !hasPermission("roles.edit")}
                                  onClick={() => handleToggleActiveRole(r)}
                                  className={`p-1 px-2 border rounded-xl ${
                                    r.isActive || isSystem ? "hover-bg-red-50" : "hover-bg-emerald-50"
                                  }`}
                                  title={isSystem ? t("rolesPermissions.table.alwaysActiveTitle") : r.isActive ? t("rolesPermissions.table.deactivateTitle") : t("rolesPermissions.table.activateTitle")}
                                >
                                  {r.isActive || isSystem ? (
                                    <ToggleRight size={14} className="text-success" />
                                  ) : (
                                    <ToggleLeft size={14} className="text-danger" />
                                  )}
                                </Button>
                                {hasPermission("roles.create") && (
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => handleOpenDuplicateModal(r)}
                                    title={t("rolesPermissions.table.duplicateTitle")}
                                    className="p-1 px-2 border"
                                  >
                                    <Copy size={14} className="text-primary" />
                                  </Button>
                                )}
                                {canEdit && (
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => handleOpenEditModal(r)}
                                    title={t("rolesPermissions.table.editTitle")}
                                    className="p-1 px-2 border"
                                  >
                                    <Users size={14} className="text-dark" />
                                  </Button>
                                )}
                                {canDelete ? (
                                  <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => handleDeleteRole(r)}
                                    title={t("rolesPermissions.table.deleteTitle")}
                                    className="p-1 px-2 border"
                                  >
                                    <Trash2 size={14} className="text-danger" />
                                  </Button>
                                ) : (
                                  !isSystem && (
                                    <span className="text-muted smaller" title={t("rolesPermissions.table.cannotDeleteTooltip", { defaultValue: "No se puede eliminar porque tiene usuarios asignados o no tenés permiso." })}>
                                      —
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card>

              {/* DYNAMIC PERMISSION MATRIX TABLE */}
              <Card className="card-premium border-0 shadow-sm overflow-hidden p-4 bg-white">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
                  <div>
                    <h2 className="fw-bold h5 mb-1 text-dark">{t("rolesPermissions.matrixTitle")}</h2>
                    <span className="text-muted smaller">{t("rolesPermissions.matrixDesc")}</span>
                  </div>
                  
                  {/* FILTERS */}
                  <div className="d-flex align-items-center gap-3 w-100 w-md-auto">
                    <InputGroup className="max-w-280 rounded-pill overflow-hidden border">
                      <InputGroup.Text className="bg-white border-0 pe-0 text-muted">
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder={t("rolesPermissions.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-0 px-2 py-2 small"
                        style={{ fontSize: "13px" }}
                      />
                    </InputGroup>

                    <Form.Select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="rounded-pill px-4 py-2 border text-capitalize small"
                      style={{ width: "180px", fontSize: "13px" }}
                    >
                      <option value="all">{t("rolesPermissions.allModules")}</option>
                      {modulesList.map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </Form.Select>
                  </div>
                </div>

                <div className="table-responsive rounded-3 border overflow-auto" style={{ maxHeight: "650px" }}>
                  <Table bordered hover align="middle" className="mb-0 matrix-table">
                    <thead className="bg-light sticky-top" style={{ zIndex: 10 }}>
                      <tr>
                        <th className="px-4 py-3 text-muted fw-bold small text-uppercase" style={{ minWidth: "260px", background: "#f8f9fa" }}>
                          {t("rolesPermissions.table.matrixActionHeader", { defaultValue: "Acción / Permiso del Sistema" })}
                        </th>
                        {roles.map((r) => (
                          <th 
                            key={r.id} 
                            className="py-3 text-center text-muted fw-bold small text-uppercase" 
                            style={{ minWidth: "120px", background: "#f8f9fa" }}
                          >
                            <div>{r.name}</div>
                            {!r.isActive && <Badge bg="danger" className="mt-1 text-white">{t("rolesPermissions.table.statusInactive")}</Badge>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPermissions.length === 0 ? (
                        <tr>
                          <td colSpan={roles.length + 1} className="text-center py-5 text-muted small">
                            {t("rolesPermissions.noPermsFound")}
                          </td>
                        </tr>
                      ) : (
                        filteredPermissions.map((p) => {
                          return (
                            <tr key={p.id}>
                              <td className="px-4 py-3">
                                <div className="fw-semibold text-dark small">{p.action}</div>
                                <div className="text-muted smaller mt-0.5" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>
                                  {p.description}
                                </div>
                                <Badge bg="secondary" className="mt-1 text-capitalize text-muted-opacity" style={{ fontSize: "8.5px" }}>
                                  {p.module}
                                </Badge>
                              </td>
                              {roles.map((r) => {
                                const isChecked = (matrixChanges[r.id] || []).includes(p.action);
                                const isOwnerRole = r.key === "owner" && !r.businessId;
                                const isDisabled = isOwnerRole || !hasPermission("permissions.edit");

                                return (
                                  <td key={r.id} className="text-center py-3">
                                    <Form.Check
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      onChange={() => handleMatrixToggle(r.id, p.action)}
                                      className="d-inline-block checkbox-custom-matrix"
                                      style={{ cursor: isDisabled ? "default" : "pointer" }}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>

              {/* FLOATING ACTION SAVE BAR FOR MATRIX */}
              {isMatrixDirty && (
                <div 
                  className="position-sticky bottom-0 w-100 bg-white border-top shadow-lg p-3.5 d-flex justify-content-between align-items-center animate-slide-up"
                  style={{
                    zIndex: 99,
                    margin: "30px -15px -24px -15px",
                    borderBottomLeftRadius: "24px",
                    borderBottomRightRadius: "24px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(8px)",
                    borderTop: "1px solid rgba(0,0,0,0.06)"
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <AlertTriangle className="text-warning" size={20} />
                    <div>
                      <div className="fw-bold text-dark small">{t("rolesPermissions.dirtyMatrixBar.title")}</div>
                      <div className="text-muted smaller">{t("rolesPermissions.dirtyMatrixBar.desc")}</div>
                    </div>
                  </div>
                  <div className="d-flex gap-3">
                    <Button
                      variant="outline-secondary"
                      disabled={savingMatrix}
                      onClick={handleRevertMatrix}
                      className="rounded-pill px-4 py-2 small fw-semibold"
                    >
                      <RotateCcw size={16} className="me-1.5" />
                      {t("rolesPermissions.dirtyMatrixBar.revert")}
                    </Button>
                    <Button
                      disabled={savingMatrix}
                      onClick={handleSaveMatrix}
                      className="rounded-pill px-4 py-2 border-0 text-white shadow-sm small fw-bold"
                      style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
                    >
                      {savingMatrix ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          {t("rolesPermissions.dirtyMatrixBar.saving")}
                        </>
                      ) : (
                        <>
                          <Save size={16} className="me-1.5" />
                          {t("rolesPermissions.dirtyMatrixBar.save")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: STAFF ROLE ASSOCIATION */}
          {activeTab === "staff" && (
            <Card className="card-premium border-0 shadow-sm p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                  <h2 className="fw-bold h5 mb-1 text-dark">{t("rolesPermissions.staff.title")}</h2>
                  <span className="text-muted smaller">{t("rolesPermissions.staff.desc")}</span>
                </div>
                <Button 
                  variant="light"
                  size="sm"
                  onClick={fetchMembers}
                  className="d-flex align-items-center gap-1.5 px-3 border"
                  disabled={membersLoading}
                >
                  <RefreshCw size={14} className={membersLoading ? "animate-spin" : ""} />
                  {t("rolesPermissions.staff.refreshBtn", { defaultValue: "Actualizar Lista" })}
                </Button>
              </div>

              {membersError && (
                <Alert variant="danger" className="rounded-3">{membersError}</Alert>
              )}

              {membersLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="purple" />
                  <p className="text-muted small mt-2">{t("rolesPermissions.staff.loading", { defaultValue: "Cargando colaboradores del negocio..." })}</p>
                </div>
              ) : (
                <div className="table-responsive rounded-3 border">
                  <Table hover align="middle" className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 text-muted fw-bold small text-uppercase">{t("rolesPermissions.staff.table.name")}</th>
                        <th className="py-3 text-muted fw-bold small text-uppercase">{t("rolesPermissions.staff.table.email")}</th>
                        <th className="py-3 text-muted fw-bold small text-uppercase text-center">{t("rolesPermissions.staff.table.assignedRole")}</th>
                        <th className="py-3 text-muted fw-bold small text-uppercase text-center">{t("rolesPermissions.staff.table.status", { defaultValue: "Estado" })}</th>
                        <th className="px-4 py-3 text-muted fw-bold small text-uppercase text-center" style={{ width: "240px" }}>{t("rolesPermissions.staff.table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-5 text-muted small">
                            {t("rolesPermissions.staff.noStaff")}
                          </td>
                        </tr>
                      ) : (
                        members.map((member) => {
                          const userProfile = member.user || {};
                          const currentRoleKey = member.role || "viewer";
                          const isSelf = member.userId === api.defaults.headers.common["x-user-id"] || false; // Simple check (usually handled securely on back)
                          
                          // Owners are protected from demotion/role change
                          const isProtectedOwner = currentRoleKey === "owner";

                          return (
                            <tr key={member.id}>
                              <td className="px-4 py-3">
                                <div className="d-flex align-items-center gap-3">
                                  {userProfile.avatar ? (
                                    <img 
                                      src={userProfile.avatar} 
                                      alt={userProfile.name || "Colaborador"} 
                                      className="rounded-circle border"
                                      style={{ width: "38px", height: "38px", objectFit: "cover" }}
                                    />
                                  ) : (
                                    <div 
                                      className="rounded-circle bg-purple-50 text-purple-600 d-flex align-items-center justify-content-center fw-bold"
                                      style={{ width: "38px", height: "38px", fontSize: "14px" }}
                                    >
                                      {(userProfile.firstName || "U").charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-bold text-dark">
                                      {userProfile.name || `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() || "Usuario SaaS"}
                                    </div>
                                    <span className="text-muted smaller d-block mt-0.5">ID: {member.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-secondary small">
                                {userProfile.email}
                              </td>
                              <td className="py-3 text-center">
                                <Badge 
                                  bg={isProtectedOwner ? "dark" : "purple"} 
                                  className="px-3 py-1.5 rounded-pill text-white text-capitalize"
                                  style={{ background: isProtectedOwner ? "#111827" : "#7c3aed" }}
                                >
                                  {member.roleRel?.name || member.role || "Viewer"}
                                </Badge>
                              </td>
                              <td className="py-3 text-center">
                                {member.status === "ACTIVE" ? (
                                  <Badge bg="success-50" className="text-success border border-success px-3 py-1.5 rounded-pill">{t("rolesPermissions.table.statusActive")}</Badge>
                                ) : member.status === "SUSPENDED" || member.status === "INACTIVE" || member.status === "INACTIVO" ? (
                                  <Badge bg="danger-50" className="text-danger border border-danger px-3 py-1.5 rounded-pill">{t("rolesPermissions.table.statusInactive")}</Badge>
                                ) : (
                                  <Badge bg="warning-50" className="text-warning border border-warning px-3 py-1.5 rounded-pill">{member.status}</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="d-flex align-items-center justify-content-center">
                                  <Form.Select
                                    size="sm"
                                    value={currentRoleKey}
                                    disabled={updatingMemberId === member.id || isProtectedOwner || !hasPermission("members.manage")}
                                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                    className="rounded-3 bg-light border-0 py-1.5 px-3 font-semibold text-dark shadow-xs"
                                    style={{ maxWidth: "200px", fontSize: "12.5px", cursor: isProtectedOwner ? "not-allowed" : "pointer" }}
                                  >
                                    {roles.map((r) => (
                                      <option key={r.id} value={r.key} disabled={!r.isActive}>
                                        {r.name} {!r.isActive ? `(${t("rolesPermissions.table.statusInactive")})` : ""}
                                      </option>
                                    ))}
                                  </Form.Select>
                                  {updatingMemberId === member.id && (
                                    <Spinner size="sm" animation="border" className="ms-2 text-purple-600" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card>
          )}

          {/* TAB 3: CREATE DYNAMIC CUSTOM PERMISSION */}
          {activeTab === "create-permission" && hasPermission("permissions.edit") && (
            <Row className="justify-content-center">
              <Col lg={7}>
                <Card className="card-premium border-0 shadow-sm p-4 bg-white">
                  <div className="text-center mb-4 pb-3 border-bottom">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-circle d-inline-block mb-3">
                      <KeyRound size={32} />
                    </div>
                    <h2 className="fw-black h4 text-dark">{t("rolesPermissions.customPerm.title")}</h2>
                    <p className="text-secondary small max-w-480 mx-auto mt-1">
                      {t("rolesPermissions.customPerm.desc")}
                    </p>
                  </div>

                  <Form onSubmit={handleCreatePermission}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold small">{t("rolesPermissions.customPerm.actionLabel")}</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder={t("rolesPermissions.customPerm.actionPlaceholder")}
                        value={newPermissionAction}
                        onChange={(e) => setNewPermissionAction(e.target.value)}
                        className="rounded-3 py-2"
                        style={{ fontSize: "13.5px" }}
                      />
                      <Form.Text className="text-muted smaller">
                        {t("rolesPermissions.customPerm.actionHint", { defaultValue: "Debe ser un identificador único en minúsculas separado por puntos. Ej: modulo.accion." })}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold small">{t("rolesPermissions.customPerm.moduleLabel")}</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder={t("rolesPermissions.customPerm.modulePlaceholder")}
                        value={newPermissionModule}
                        onChange={(e) => setNewPermissionModule(e.target.value)}
                        className="rounded-3 py-2"
                        style={{ fontSize: "13.5px" }}
                      />
                      <Form.Text className="text-muted smaller">
                        {t("rolesPermissions.customPerm.moduleHint", { defaultValue: "El nombre del módulo agrupará la fila del permiso en la cuadrícula visual de accesos." })}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold small">{t("rolesPermissions.customPerm.descLabel")}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder={t("rolesPermissions.customPerm.descPlaceholder")}
                        value={newPermissionDescription}
                        onChange={(e) => setNewPermissionDescription(e.target.value)}
                        className="rounded-3 py-2"
                        style={{ fontSize: "13.5px" }}
                      />
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        type="submit"
                        disabled={creatingPermission}
                        className="d-flex align-items-center justify-content-center gap-2 py-2.5 rounded-pill border-0 text-white shadow-sm fw-bold"
                        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
                      >
                        {creatingPermission ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            {t("rolesPermissions.customPerm.saving")}
                          </>
                        ) : (
                          <>
                            <PlusCircle size={18} />
                            {t("rolesPermissions.customPerm.btn")}
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* CREATE / EDIT / DUPLICATE ROLE MODAL */}
      <Modal
        show={showRoleModal}
        onHide={() => setShowRoleModal(false)}
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg"
      >
        <Modal.Header closeButton className="bg-light border-0 py-3">
          <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2">
            <Shield className="text-purple-600" size={20} />
            {modalMode === "create" ? t("rolesPermissions.modal.createTitle") :
             modalMode === "edit" ? t("rolesPermissions.modal.editTitle") : t("rolesPermissions.modal.duplicateTitle") + (selectedRole ? ": " + selectedRole.name : "")}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveRole}>
          <Modal.Body className="p-4">
            <p className="text-muted small mb-4">
              {modalMode === "create" ? t("rolesPermissions.modal.createDesc", { defaultValue: "Define un nuevo nivel de acceso. Su clave única (key) se autogenerará basándose en el nombre." }) :
               modalMode === "edit" ? t("rolesPermissions.modal.editDesc", { defaultValue: "Modifica el nombre o descripción del rol. Los roles predefinidos del sistema no se pueden alterar." }) :
               t("rolesPermissions.modal.duplicateDesc", { defaultValue: "Genera una copia idéntica de este rol. Todos los permisos asignados en la matriz se clonarán de forma atómica en el nuevo rol." })}
            </p>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">{t("rolesPermissions.modal.nameLabel")}</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder={t("rolesPermissions.modal.namePlaceholder")}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="rounded-3 py-2"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">{t("rolesPermissions.modal.descLabel")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder={t("rolesPermissions.modal.descPlaceholder")}
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="rounded-3 py-2"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light py-3">
            <Button
              variant="outline-secondary"
              onClick={() => setShowRoleModal(false)}
              className="rounded-pill px-4"
              disabled={roleSaving}
            >
              {t("rolesPermissions.modal.cancel")}
            </Button>
            <Button
              type="submit"
              className="rounded-pill px-4 border-0 text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
              disabled={roleSaving}
            >
              {roleSaving ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  {t("rolesPermissions.modal.saving")}
                </>
              ) : (
                modalMode === "create" ? t("rolesPermissions.modal.createBtn", { defaultValue: "Crear Rol" }) :
                modalMode === "edit" ? t("rolesPermissions.modal.save", { defaultValue: "Guardar Rol" }) : t("rolesPermissions.modal.duplicateBtn", { defaultValue: "Duplicar Rol" })
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
