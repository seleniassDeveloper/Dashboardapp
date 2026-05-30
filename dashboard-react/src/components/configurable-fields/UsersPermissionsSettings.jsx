import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, Table, Button, Badge, Modal, Form, Alert, Dropdown, Spinner, Row, Col, InputGroup } from "react-bootstrap";
import { 
  Users, UserPlus, Shield, UserX, AlertTriangle, MoreVertical, 
  Ban, CheckCircle, Mail, Clipboard, ClipboardCheck, History, Settings, Eye,
  PlusCircle, RefreshCw, KeyRound, ArrowRightLeft, UserCheck, ShieldQuestion,
  Star, ChevronDown, ChevronUp, Search, Calendar, FolderOpen, CreditCard,
  Briefcase, BarChart2, Package, Cpu, FileText, Check, X, Info, Save, Lock, Trash2
} from "lucide-react";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { firestoreDb } from "../../firebase/client";
import api from "../../lib/api.js";
import { usePermissions } from "../../auth/PermissionProvider";

const AVAILABLE_PERMISSIONS = [
  { action: "view_finances", name: " Ver Módulo de Finanzas", desc: "Permite ver balances, cajas y reportes financieros." },
  { action: "manage_settings", name: " Administrar Configuración", desc: "Permite modificar variables de marca, agenda y flujos." },
  { action: "manage_users", name: " Administrar Usuarios y Permisos", desc: "Acceso total para invitar, editar roles y permisos en Firestore." },
  { action: "appointments.view", name: " Ver Agenda de Turnos", desc: "Visualizar el calendario de reservas." },
  { action: "clients.view", name: " Ver Módulo de Clientes (CRM)", desc: "Ver historial y fichas técnicas de clientes." },
  { action: "services.view", name: " Ver Módulo de Servicios", desc: "Ver catálogo de servicios y precios." },
  { action: "team.view", name: " Ver Módulo de Equipo", desc: "Visualizar personal asignado del salón." },
  { action: "inventory.view", name: " Ver Módulo de Inventario", desc: "Administración de stock y productos." },
  { action: "sheets.view", name: " Sincronizar Google Sheets", desc: "Exportación de registros a hojas de cálculo." },
  { action: "workflows.view", name: " Ver Módulo de Workflows", desc: "Configuración de flujos de automatización." },
  { action: "automations.view", name: " Ver Módulo de Automatizaciones", desc: "Reglas automatizadas de alertas y mensajes." },
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
  finance: [
    "view_finances",
    "appointments.view",
    "clients.view"
  ],
  reception: [
    "appointments.view",
    "clients.view",
    "services.view"
  ],
  professional: [
    "appointments.view"
  ],
  manager: [
    "appointments.view",
    "clients.view",
    "services.view",
    "team.view",
    "inventory.view"
  ]
};


// Helper to map Lucide Icons to modules
const getModuleIcon = (modName) => {
  const norm = String(modName || "").toLowerCase();
  if (norm.includes("finance") || norm.includes("caja") || norm.includes("pagos") || norm.includes("sueldo")) {
    return <CreditCard size={18} className="text-purple-600" />;
  }
  if (norm.includes("agenda") || norm.includes("cita") || norm.includes("calendario")) {
    return <Calendar size={18} className="text-purple-600" />;
  }
  if (norm.includes("client") || norm.includes("crm")) {
    return <Users size={18} className="text-purple-600" />;
  }
  if (norm.includes("team") || norm.includes("equip") || norm.includes("colabora") || norm.includes("worker")) {
    return <Briefcase size={18} className="text-purple-600" />;
  }
  if (norm.includes("dashboard") || norm.includes("indicador") || norm.includes("panel")) {
    return <BarChart2 size={18} className="text-purple-600" />;
  }
  if (norm.includes("inventar") || norm.includes("product") || norm.includes("stock")) {
    return <Package size={18} className="text-purple-600" />;
  }
  if (norm.includes("workflow") || norm.includes("automatiza") || norm.includes("bot")) {
    return <Cpu size={18} className="text-purple-600" />;
  }
  if (norm.includes("config") || norm.includes("ajuste") || modName.toLowerCase().includes("setting") || norm.includes("role")) {
    return <Settings size={18} className="text-purple-600" />;
  }
  return <FolderOpen size={18} className="text-purple-600" />;
};

export default function UsersPermissionsSettings() {
  const { hasPermission } = usePermissions();

  const [roles, setRoles] = useState([]);
  const [permissionsList, setPermissionsList] = useState([]); 
  const [members, setMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sidebar search filter for roles
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  // Editor states
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState(null);
  const [rolePermissionsSelected, setRolePermissionsSelected] = useState([]); 
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);

  // Module Accordion expanded state
  const [expandedModules, setExpandedModules] = useState({});

  // Modals state
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showLogMetadataModal, setShowLogMetadataModal] = useState(false);
  const [selectedLogMetadata, setSelectedLogMetadata] = useState(null);

  // Matrix Bulk Edit changes state
  const [matrixChanges, setMatrixChanges] = useState({});
  const [isMatrixDirty, setIsMatrixDirty] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [matrixSearchQuery, setMatrixSearchQuery] = useState("");
  const [matrixModuleFilter, setMatrixModuleFilter] = useState("all");

  // Modals and Invite States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedUserForEditRole, setSelectedUserForEditRole] = useState(null);
  const [newUserRole, setNewUserRole] = useState("professional");
  const [savingUserRole, setSavingUserRole] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("professional");
  const [invitePermissions, setInvitePermissions] = useState(DEFAULT_ROLE_PERMISSIONS.professional);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Guided wizard, tabs and transferring states
  const [invitations, setInvitations] = useState([]);
  const [inviteStep, setInviteStep] = useState(1);
  const [activeTabColumn3, setActiveTabColumn3] = useState("members");
  const [selectedExistingUserToTransfer, setSelectedExistingUserToTransfer] = useState("");

  useEffect(() => {
    setInvitePermissions(DEFAULT_ROLE_PERMISSIONS[inviteRole] || []);
  }, [inviteRole]);

  useEffect(() => {
    if (showInviteModal) {
      setInviteStep(1);
    }
  }, [showInviteModal]);


  const fetchMembersAndRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch active business members for user counts
      try {
        const membersRes = await api.get("/members");
        if (membersRes.data?.success) {
          setMembers(membersRes.data.members || []);
          setInvitations(membersRes.data.invitations || []);
        }
      } catch (err) {
        console.warn("Could not fetch members for counts:", err);
      }

      // Fetch roles list
      const rolesRes = await api.get("/roles");
      if (rolesRes.data?.success) {
        const dbRoles = rolesRes.data.roles || [];
        setRoles(dbRoles);
        
        // Find if selectedRoleForEdit exists, or default to first
        if (dbRoles.length > 0) {
          const matched = selectedRoleForEdit ? dbRoles.find(r => r.id === selectedRoleForEdit.id) : null;
          const activeRole = matched || dbRoles[0];
          setSelectedRoleForEdit(activeRole);
          const initialPermissions = activeRole.permissions?.map(p => p.permission?.action).filter(Boolean) || [];
          setRolePermissionsSelected(initialPermissions);

          // Populate Matrix Changes state for Matrix Modal
          const initialMatrix = {};
          dbRoles.forEach(r => {
            initialMatrix[r.id] = r.permissions?.map(rp => rp.permission?.action).filter(Boolean) || [];
          });
          setMatrixChanges(initialMatrix);
          setIsMatrixDirty(false);
        }
      }

      // Fetch complete system permissions catalog
      const permissionsRes = await api.get("/roles/permissions/all");
      if (permissionsRes.data?.success) {
        setPermissionsList(permissionsRes.data.permissions || []);
      }

      // Fetch audit logs
      if (hasPermission("reports.view")) {
        const auditRes = await api.get("/audit-logs");
        if (auditRes.data?.success) {
          setAuditLogs(auditRes.data.logs || []);
        }
      }
    } catch (err) {
      console.error("Error fetching SaaS members/roles:", err);
      setError(
        err.response?.data?.error || "Error al conectar con el servidor para obtener los colaboradores."
      );
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    fetchMembersAndRoles();
  }, [hasPermission]);

  // Statistics
  const stats = useMemo(() => {
    const totalRoles = roles.length;
    const systemRoles = roles.filter(r => r.isSystemRole).length;
    const customRoles = totalRoles - systemRoles;
    const totalPerms = permissionsList.length;
    
    // Uniq active members assigned to any role
    const activeStaff = members.filter(m => m.status === "ACTIVE").length;

    return { totalRoles, systemRoles, customRoles, totalPerms, activeStaff };
  }, [roles, permissionsList, members]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const map = {};
    permissionsList.forEach(p => {
      if (!p) return;
      const mod = p.module || "Otros";
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    });
    return map;
  }, [permissionsList]);

  // Filtered Roles based on sidebar search
  const filteredRoles = useMemo(() => {
    return roles.filter(r => 
      r.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(roleSearchQuery.toLowerCase())
    );
  }, [roles, roleSearchQuery]);

  // Filtered Matrix Permissions based on search query in Matrix Modal
  const filteredMatrixPermissions = useMemo(() => {
    return permissionsList.filter(p => {
      if (!p) return false;
      const matchesSearch = 
        p.action.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(matrixSearchQuery.toLowerCase());
      const matchesModule = matrixModuleFilter === "all" || p.module === matrixModuleFilter;
      return matchesSearch && matchesModule;
    });
  }, [permissionsList, matrixSearchQuery, matrixModuleFilter]);

  // Unique list of modules
  const uniqueModulesList = useMemo(() => {
    const set = new Set();
    permissionsList.forEach(p => {
      if (p?.module) set.add(p.module);
    });
    return Array.from(set).sort();
  }, [permissionsList]);

  const membersWithThisRole = useMemo(() => {
    if (!selectedRoleForEdit) return [];
    const activeMembers = members.filter(m => m.role === selectedRoleForEdit.key);
    
    // Map pending invitations with this role so they appear instantly in the UI
    const pendingInvites = invitations
      .filter(inv => inv.role === selectedRoleForEdit.key && inv.status === "PENDING")
      .map(inv => ({
        id: inv.id,
        isInvitation: true,
        status: "PENDING",
        role: inv.role,
        user: {
          email: inv.email,
          name: inv.email.split("@")[0] || "Invitado",
          avatar: null
        }
      }));
      
    return [...activeMembers, ...pendingInvites];
  }, [members, invitations, selectedRoleForEdit]);

  const otherMembers = useMemo(() => {
    if (!selectedRoleForEdit) return [];
    return members.filter(m => m.role !== selectedRoleForEdit.key && m.role !== "owner");
  }, [members, selectedRoleForEdit]);

  const hasUnsavedPermissions = useMemo(() => {
    if (!selectedRoleForEdit) return false;
    const dbPermissions = selectedRoleForEdit.permissions?.map(p => p.permission?.action).filter(Boolean) || [];
    if (dbPermissions.length !== rolePermissionsSelected.length) return true;
    return !dbPermissions.every(p => rolePermissionsSelected.includes(p));
  }, [selectedRoleForEdit, rolePermissionsSelected]);


  // Toggle Accordion Module
  const toggleModuleExpanded = (modName) => {
    setExpandedModules(prev => ({
      ...prev,
      [modName]: !prev[modName]
    }));
  };

  // Select a role from left column
  const handleRoleSelect = (role) => {
    setSelectedRoleForEdit(role);
    const assignedActions = role.permissions?.map(rp => rp.permission?.action).filter(Boolean) || [];
    setRolePermissionsSelected(assignedActions);
  };

  const handleToggleUserStatus = async (member) => {
    setError("");
    setSuccess("");
    const nextStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      // 1. Sync PostgreSQL Status
      await api.patch(`/members/${member.id}/status`, { status: nextStatus });
      
      // 2. Sync Firestore active field
      if (firestoreDb) {
        const emailKey = member.user.email.toLowerCase().trim();
        const docRef = member.userId ? doc(firestoreDb, "users", member.userId) : doc(firestoreDb, "users", emailKey);
        await updateDoc(docRef, {
          active: nextStatus === "ACTIVE"
        });
      }
      
      setSuccess(`Estado de acceso actualizado para ${member.user.email}.`);
      await fetchMembersAndRoles();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al actualizar estado del colaborador.");
    }
  };

  const handleRemoveUser = async (member) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${member.user.email}?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      // 1. Sync PostgreSQL
      await api.delete(`/members/${member.id}`);
      
      // 2. Sync Firestore
      if (firestoreDb) {
        const emailKey = member.user.email.toLowerCase().trim();
        const docRef = member.userId ? doc(firestoreDb, "users", member.userId) : doc(firestoreDb, "users", emailKey);
        await deleteDoc(docRef);
      }
      
      setSuccess(`Colaborador ${member.user.email} eliminado definitivamente del sistema.`);
      await fetchMembersAndRoles();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al eliminar colaborador.");
    }
  };

  const handleSaveUserRole = async () => {
    if (!selectedUserForEditRole) return;
    setError("");
    setSuccess("");
    setSavingUserRole(true);
    try {
      // 1. Sync PostgreSQL
      await api.patch(`/members/${selectedUserForEditRole.id}/role`, { roleKey: newUserRole });
      
      // 2. Sync Firestore
      if (firestoreDb) {
        const emailKey = selectedUserForEditRole.user.email.toLowerCase().trim();
        const docRef = selectedUserForEditRole.userId ? doc(firestoreDb, "users", selectedUserForEditRole.userId) : doc(firestoreDb, "users", emailKey);
        await updateDoc(docRef, {
          role: newUserRole,
          permissions: DEFAULT_ROLE_PERMISSIONS[newUserRole] || []
        });
      }
      
      setSuccess(`Rol del colaborador ${selectedUserForEditRole.user.email} actualizado exitosamente.`);
      setShowChangeRoleModal(false);
      setSelectedUserForEditRole(null);
      await fetchMembersAndRoles();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al reasignar el rol del colaborador.");
    } finally {
      setSavingUserRole(false);
    }
  };

  const handleInvitePermissionToggle = (action) => {
    setInvitePermissions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !firestoreDb) return;

    const emailKey = inviteEmail.trim().toLowerCase();
    setInviteLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Guardar en Firestore
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

      // 2. Guardar en PostgreSQL
      try {
        await api.post("/members/invite", {
          email: emailKey,
          role: inviteRole,
          firstName: inviteName.trim().split(" ")[0] || "Colaborador",
          lastName: inviteName.trim().split(" ").slice(1).join(" ") || "SaaS"
        });
      } catch (pgErr) {
        console.warn("Backend members invite warning:", pgErr);
      }

      setSuccess(`Colaborador ${emailKey} invitado y registrado exitosamente con sincronización dual.`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("professional");
      await fetchMembersAndRoles();
    } catch (err) {
      console.error("Error creating user:", err);
      setError("No se pudo registrar la invitación en Firestore.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (invitationId, email) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar la invitación para ${email}?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      // 1. Cancel in PostgreSQL
      await api.post("/invitations/cancel", { id: invitationId });
      
      // 2. Sync Firestore: delete doc
      if (firestoreDb) {
        const emailKey = email.toLowerCase().trim();
        await deleteDoc(doc(firestoreDb, "users", emailKey));
      }
      
      setSuccess(`Invitación para ${email} cancelada con éxito.`);
      await fetchMembersAndRoles();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al cancelar la invitación.");
    }
  };

  const handleAssignExistingUser = async (memberId, userEmail) => {
    if (!selectedRoleForEdit) return;
    setError("");
    setSuccess("");
    try {
      // 1. Sync PostgreSQL
      await api.patch(`/members/${memberId}/role`, { roleKey: selectedRoleForEdit.key });
      
      // 2. Sync Firestore
      if (firestoreDb) {
        const emailKey = userEmail.toLowerCase().trim();
        const memberObj = members.find(m => m.id === memberId);
        const docRef = memberObj?.userId ? doc(firestoreDb, "users", memberObj.userId) : doc(firestoreDb, "users", emailKey);
        await updateDoc(docRef, {
          role: selectedRoleForEdit.key,
          permissions: selectedRoleForEdit.permissions?.map(p => p.permission?.action).filter(Boolean) || []
        });
      }
      
      setSuccess(`Colaborador ${userEmail} reasignado al rol '${selectedRoleForEdit.name}' exitosamente.`);
      setSelectedExistingUserToTransfer("");
      await fetchMembersAndRoles();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al transferir colaborador.");
    }
  };


  // Toggle permission checkbox in middle column
  const handleCheckboxToggle = (action) => {
    // Prevent modifying main system owner permissions
    if (selectedRoleForEdit?.key === "owner" && !selectedRoleForEdit.businessId) return;

    setRolePermissionsSelected(prev => {
      if (prev.includes(action)) {
        return prev.filter(a => a !== action);
      } else {
        return [...prev, action];
      }
    });
  };

  // Save current role's modified permissions
  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForEdit) return;
    setSavingRolePermissions(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.patch(`/roles/${selectedRoleForEdit.id}/permissions`, {
        actions: rolePermissionsSelected
      });

      if (res.data?.success) {
        setSuccess(`Permisos para el rol '${selectedRoleForEdit.name}' actualizados con éxito.`);
        await fetchMembersAndRoles();
      }
    } catch (err) {
      console.error("Error al guardar permisos del rol:", err);
      setError(err.response?.data?.error || "No se pudieron actualizar los permisos del rol.");
    } finally {
      setSavingRolePermissions(false);
    }
  };

  // Quick duplicate role handler
  const handleDuplicateCurrentRole = async () => {
    if (!selectedRoleForEdit) return;
    const newName = `${selectedRoleForEdit.name} (Copia)`;
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/roles/${selectedRoleForEdit.id}/duplicate`, {
        name: newName,
        description: `Copia duplicada de ${selectedRoleForEdit.name}.`
      });
      if (res.data?.success) {
        setSuccess(`Rol '${newName}' duplicado exitosamente con todos sus permisos.`);
        await fetchMembersAndRoles();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al duplicar el rol.");
    }
  };

  // Matrix Modal: Toggle bulk checkboxes
  const handleMatrixToggle = (roleId, permissionAction) => {
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

      setIsMatrixDirty(true);
      return {
        ...prev,
        [roleId]: updated
      };
    });
  };

  // Matrix Modal: Bulk Save
  const handleSaveMatrix = async () => {
    setSavingMatrix(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.patch("/permission-matrix", { matrix: matrixChanges });
      if (res.data?.success) {
        setSuccess("Matriz completa de accesos sincronizada exitosamente con Neon Postgres.");
        setShowMatrixModal(false);
        await fetchMembersAndRoles();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al actualizar la matriz completa.");
    } finally {
      setSavingMatrix(false);
    }
  };

  // Calculate permission statistics per module for the selected role
  const getModulePermissionStats = (modName) => {
    const permsInMod = groupedPermissions[modName] || [];
    const total = permsInMod.length;
    const enabled = permsInMod.filter(p => rolePermissionsSelected.includes(p.action)).length;
    return { enabled, total };
  };

  // Dynamic state helpers for visual cards
  const getModuleState = (enabled, total) => {
    if (total === 0) return { label: "Sin permisos", badgeClass: "badge-sinacceso", hasLock: true };
    const pct = (enabled / total) * 100;
    if (pct >= 80) return { label: "Completo", badgeClass: "badge-completo", hasLock: false };
    if (pct >= 30) return { label: "Parcial", badgeClass: "badge-parcial", hasLock: false };
    return { label: "Sin acceso", badgeClass: "badge-sinacceso", hasLock: true };
  };

  // Dual-Column Visual Quick Info Card helper
  const visualPerms = useMemo(() => {
    if (!selectedRoleForEdit) return { canDo: [], cannotDo: [] };
    const roleKey = selectedRoleForEdit.key;

    let canDo = [];
    let cannotDo = [];

    if (roleKey === "owner") {
      canDo = [
        "Acceso total e ilimitado a todos los datos del negocio",
        "Gestionar y asignar roles y permisos de todo el personal",
        "Visualizar y modificar balances financieros y cierres de caja",
        "Configurar automatizaciones, bots e integraciones de software"
      ];
      cannotDo = [];
    } else if (roleKey === "admin") {
      canDo = [
        "Gestión completa de la agenda y citas de colaboradores",
        "Administración del catálogo de clientes y servicios",
        "Control total de inventario y compras a proveedores",
        "Ver balances de caja y reportes contables del negocio"
      ];
      cannotDo = [
        "Modificar o suspender al usuario Owner principal",
        "Alterar datos de auditoría crítica y bitácoras"
      ];
    } else if (roleKey === "manager") {
      canDo = [
        "Planificación y gestión diaria de la agenda de citas",
        "Modificar y registrar fichas de clientes en el CRM",
        "Administración de servicios y categorías del catálogo",
        "Control operativo de stock y reposición de inventario"
      ];
      cannotDo = [
        "Ver balances financieros, caja y egresos del salón",
        "Editar o duplicar roles y permisos del sistema",
        "Acceder a la bitácora de auditoría histórica en Neon",
        "Exportar reportes avanzados de rendimiento financiero"
      ];
    } else if (roleKey === "finance") {
      canDo = [
        "Visualizar reportes financieros e informes de egresos",
        "Gestionar cobros de citas y cierres de caja diarios",
        "Administrar liquidaciones de sueldos y comisiones"
      ];
      cannotDo = [
        "Modificar o asignar citas en la agenda del salón",
        "Editar la base de datos de servicios o productos",
        "Modificar credenciales o roles del equipo de trabajo"
      ];
    } else if (roleKey === "professional") {
      canDo = [
        "Visualizar su agenda de citas asignadas del día",
        "Registrar servicios prestados en fichas de clientes",
        "Ver cálculo estimativo de sus comisiones generadas"
      ];
      cannotDo = [
        "Acceder a la información de facturación general",
        "Ver agendas o programaciones de otros profesionales",
        "Modificar configuraciones globales del establecimiento"
      ];
    } else {
      const hasAgenda = rolePermissionsSelected.includes("agenda.view") || rolePermissionsSelected.includes("agenda.manage");
      const hasClients = rolePermissionsSelected.includes("clients.view") || rolePermissionsSelected.includes("clients.manage");
      const hasFinances = rolePermissionsSelected.includes("finances.view") || rolePermissionsSelected.includes("finance.view");
      const hasRoles = rolePermissionsSelected.includes("roles.manage") || rolePermissionsSelected.includes("permissions.edit");

      if (hasAgenda) canDo.push("Ver y gestionar agenda de citas");
      if (hasClients) canDo.push("Administrar fichas de clientes");
      if (rolePermissionsSelected.includes("services.manage")) canDo.push("Modificar catálogo de servicios");
      if (rolePermissionsSelected.includes("inventory.view")) canDo.push("Revisar existencias de inventario");

      if (!hasFinances) cannotDo.push("Ver balances financieros y cierres");
      if (!hasRoles) cannotDo.push("Modificar accesos y roles del staff");
      cannotDo.push("Acceder a bitácoras de auditoría");
      if (!rolePermissionsSelected.includes("reports.view")) cannotDo.push("Visualizar reportes avanzados");

      if (canDo.length === 0) {
        canDo.push("Visualizar panel básico sin acciones");
      }
    }

    return { canDo: canDo.slice(0, 4), cannotDo: cannotDo.slice(0, 4) };
  }, [selectedRoleForEdit, rolePermissionsSelected]);

  // Check critical restrictions
  const restrictions = useMemo(() => {
    const hasFinance = rolePermissionsSelected.includes("finances.view") || rolePermissionsSelected.includes("finance.view");
    const hasRolesEdit = rolePermissionsSelected.includes("roles.manage") || rolePermissionsSelected.includes("permissions.edit");
    const hasReports = rolePermissionsSelected.includes("reports.view");
    return { hasFinance, hasRolesEdit, hasReports };
  }, [rolePermissionsSelected]);

  // Parsing dynamic logs from Postgres Audit Log
  const renderLogMessage = (log) => {
    let actionLabel = "realizó cambios en";
    let detailPill = null;

    if (log.action === "role_permissions_updated") {
      actionLabel = "editó permisos del rol";
    } else if (log.action === "role_created") {
      actionLabel = "creó el rol personalizado";
    } else if (log.action === "role_changed") {
      actionLabel = "asignó usuarios al rol";
    }

    let metaObj = {};
    if (log.metadata) {
      if (typeof log.metadata === "string") {
        try {
          metaObj = JSON.parse(log.metadata);
        } catch (e) {}
      } else {
        metaObj = log.metadata;
      }

      if (metaObj.added && metaObj.added.length > 0) {
        detailPill = (
          <span className="badge ms-2" style={{ fontSize: "10px", verticalAlign: "middle", backgroundColor: "rgba(16, 185, 129, 0.08)", color: "#059669", border: "1.5px solid rgba(16, 185, 129, 0.2)", fontWeight: "600" }}>
            Agregó: {metaObj.added.join(", ")}
          </span>
        );
      } else if (metaObj.removed && metaObj.removed.length > 0) {
        detailPill = (
          <span className="badge ms-2" style={{ fontSize: "10px", verticalAlign: "middle", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#dc2626", border: "1.5px solid rgba(239, 68, 68, 0.2)", fontWeight: "600" }}>
            Eliminó: {metaObj.removed.join(", ")}
          </span>
        );
      } else if (metaObj.permissionsCount) {
        detailPill = (
          <span className="badge ms-2" style={{ fontSize: "10px", verticalAlign: "middle", backgroundColor: "rgba(124, 58, 237, 0.08)", color: "#7c3aed", border: "1.5px solid rgba(124, 58, 237, 0.2)", fontWeight: "600" }}>
            {metaObj.permissionsCount} perms
          </span>
        );
      }
    }

    const userName = log.user?.name || log.userId || "Sistema";
    const entityName = metaObj.roleKey || metaObj.name || log.entity || "—";

    return (
      <div className="d-flex align-items-center flex-wrap gap-1.5" style={{ fontSize: "12.5px" }}>
        <span className="fw-bold" style={{ color: "#111827" }}>{userName}</span>
        <span style={{ color: "#4b5563" }}>{actionLabel}</span>
        <strong style={{ color: "#6d28d9", fontWeight: "700" }}>{entityName}</strong>
        {detailPill}
      </div>
    );
  };

  return (
    <div className="premium-workspace py-2 animate-fade-in">
      {/* Dynamic Embedded CSS styles for unmatched UI premium finish */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        
        .three-column-grid {
          display: grid;
          grid-template-columns: minmax(320px, 380px) 1fr minmax(300px, 360px);
          gap: 24px;
          align-items: stretch;
        }

        @media (max-width: 1200px) {
          .three-column-grid {
            grid-template-columns: 1fr;
          }
        }

        .premium-workspace {
          font-family: 'Outfit', sans-serif !important;
          color: #1e1b4b;
          background-color: #fcfcff;
        }

        .premium-card {
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.05);
          border-radius: 20px;
          box-shadow: 0 10px 30px -10px rgba(124, 58, 237, 0.04), 0 1px 3px rgba(0,0,0,0.01);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-card:hover {
          box-shadow: 0 20px 40px -15px rgba(124, 58, 237, 0.07);
        }

        .role-card-item {
          border: 1px solid rgba(0, 0, 0, 0.05);
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          text-align: left;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: visible;
          outline: none !important;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .role-card-item:hover {
          transform: translateY(-2px);
          border-color: rgba(124, 58, 237, 0.2);
          box-shadow: 0 8px 20px -6px rgba(124, 58, 237, 0.06);
        }

        .role-card-item--active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.045) 0%, rgba(139, 92, 246, 0.01) 100%) !important;
          border-color: #7c3aed !important;
          box-shadow: 0 10px 25px -8px rgba(124, 58, 237, 0.12) !important;
        }

        .role-card-item--active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #7c3aed 0%, #a78bfa 100%);
          border-radius: 4px 0 0 4px;
        }

        .simulate-btn {
          background: #ffffff;
          border: 1.5px solid rgba(124, 58, 237, 0.35);
          color: #7c3aed;
          font-weight: 700;
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 12px;
          transition: all 0.25s ease;
        }

        .simulate-btn:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #ffffff !important;
          border-color: transparent;
          box-shadow: 0 6px 16px -4px rgba(124, 58, 237, 0.3);
          transform: scale(1.01);
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

        .module-sleek-row {
          border: 1px solid rgba(0, 0, 0, 0.04);
          background: #ffffff;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
        }

        .module-sleek-row:hover {
          background: rgba(124, 58, 237, 0.012);
          border-color: rgba(124, 58, 237, 0.15);
        }

        .module-sleek-row--expanded {
          border-color: rgba(124, 58, 237, 0.25) !important;
          background: rgba(124, 58, 237, 0.015) !important;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          margin-bottom: 0;
        }

        .module-sleek-content {
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.25);
          border-top: none;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          padding: 20px;
          margin-bottom: 12px;
          animation: slideDown 0.22s cubic-bezier(0, 0, 0.2, 1);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-square-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-custom-matrix-inline {
          background: #fcfcff;
          border: 1px solid rgba(0, 0, 0, 0.03);
          border-radius: 12px;
          padding: 12px 14px 12px 40px !important;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .checkbox-custom-matrix-inline:hover {
          background: #f4f0ff;
          border-color: rgba(124, 58, 237, 0.18);
        }

        .checkbox-custom-matrix-inline .form-check-input {
          width: 18px;
          height: 18px;
          margin-left: -28px !important;
          margin-top: 3px;
          border-color: rgba(124, 58, 237, 0.35);
          cursor: pointer;
        }

        .checkbox-custom-matrix-inline .form-check-input:checked {
          background-color: #7c3aed;
          border-color: #7c3aed;
        }

        .badge-completo {
          background-color: rgba(16, 185, 129, 0.08) !important;
          color: #10b981 !important;
          border: 1.5px solid rgba(16, 185, 129, 0.15);
          font-weight: 700;
        }

        .badge-parcial {
          background-color: rgba(245, 158, 11, 0.08) !important;
          color: #f59e0b !important;
          border: 1.5px solid rgba(245, 158, 11, 0.15);
          font-weight: 700;
        }

        .badge-sinacceso {
          background-color: rgba(239, 68, 68, 0.08) !important;
          color: #ef4444 !important;
          border: 1.5px solid rgba(239, 68, 68, 0.15);
          font-weight: 700;
        }

        .audit-log-row {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(124, 58, 237, 0.08);
          transition: all 0.2s ease;
        }

        .audit-log-row:hover {
          background: rgba(124, 58, 237, 0.015);
        }

        .audit-log-row:last-child {
          border-bottom: none;
        }

        .matrix-table th {
          background-color: #f8fafc !important;
          font-weight: 700;
          color: #475569;
          border-bottom-width: 2px !important;
        }

        .matrix-table td {
          padding: 10px 14px !important;
        }

        .pulse-btn {
          animation: pulseGlow 1.8s infinite alternate;
          border: 2px solid #7c3aed !important;
        }
        @keyframes pulseGlow {
          from { box-shadow: 0 4px 15px -3px rgba(124, 58, 237, 0.35); }
          to { box-shadow: 0 0 16px 5px rgba(124, 58, 237, 0.6); }
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-4 text-purple-600 shadow-sm" style={{ backgroundColor: "#f5f3ff" }}>
            <Shield size={32} className="text-purple-600" />
          </div>
          <div>
            <h1 className="fw-black h3 text-dark mb-0 d-flex align-items-center gap-2">
              Roles y Permisos
            </h1>
            <p className="text-secondary mb-0 small mt-1">
              Gestioná los roles del sistema, asigná permisos y controlá el acceso de tu equipo.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2.5">
          <Button
            variant="outline-secondary"
            onClick={() => setShowMatrixModal(true)}
            className="d-flex align-items-center gap-2 px-3.5 py-2 rounded-pill bg-white shadow-xs fw-bold text-dark font-size-13 hover-scale-subtle"
            style={{ fontSize: "13px", borderColor: "rgba(0,0,0,0.12)" }}
          >
            <FolderOpen size={16} />
            <span>Ver Matriz de Permisos</span>
          </Button>

          <Button
            onClick={() => setShowInviteModal(true)}
            className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0 shadow-sm text-white fw-bold btn-gradient-purple hover-scale-subtle"
            style={{ fontSize: "13px" }}
          >
            <UserPlus size={16} />
            <span>Invitar Colaborador</span>
          </Button>
        </div>

      </div>

      {/* METRICS ROW */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <div className="premium-card p-4 bg-white d-flex align-items-center gap-3">
            <div className="stat-square-icon" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
              <Shield size={20} />
            </div>
            <div>
              <div className="text-muted smaller text-uppercase fw-bold" style={{ fontSize: "10.5px", letterSpacing: "0.02em" }}>Roles del sistema</div>
              <div className="h4 fw-black mt-0.5 mb-0 text-dark">{stats.systemRoles}</div>
              <div className="text-muted smaller mt-0.5" style={{ fontSize: "11px" }}>
                <span className="text-purple-600 fw-bold">{stats.customRoles} personalizados</span>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="premium-card p-4 bg-white d-flex align-items-center gap-3">
            <div className="stat-square-icon" style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}>
              <Users size={20} />
            </div>
            <div>
              <div className="text-muted smaller text-uppercase fw-bold" style={{ fontSize: "10.5px", letterSpacing: "0.02em" }}>Usuarios activos</div>
              <div className="h4 fw-black mt-0.5 mb-0 text-dark">{stats.activeStaff}</div>
              <div className="text-muted smaller mt-0.5" style={{ fontSize: "11px" }}>
                En <span className="text-success fw-bold">{stats.totalRoles} roles</span> comerciales
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="premium-card p-4 bg-white d-flex align-items-center gap-3">
            <div className="stat-square-icon" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div className="text-muted smaller text-uppercase fw-bold" style={{ fontSize: "10.5px", letterSpacing: "0.02em" }}>Permisos totales</div>
              <div className="h4 fw-black mt-0.5 mb-0 text-dark">{stats.totalPerms}</div>
              <div className="text-muted smaller mt-0.5" style={{ fontSize: "11px" }}>
                Agrupados en <span className="text-primary fw-bold">{Object.keys(groupedPermissions).length} módulos</span>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={6} md={3}>
          <div className="premium-card p-4 bg-white d-flex align-items-center gap-3">
            <div className="stat-square-icon" style={{ backgroundColor: "#fff7ed", color: "#f97316" }}>
              <Star size={20} />
            </div>
            <div>
              <div className="text-muted smaller text-uppercase fw-bold" style={{ fontSize: "10.5px", letterSpacing: "0.02em" }}>Roles personalizados</div>
              <div className="h4 fw-black mt-0.5 mb-0 text-dark">{stats.customRoles}</div>
              <div className="text-muted smaller mt-0.5" style={{ fontSize: "11px" }}>
                Creados a medida para tu salón
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ERROR / SUCCESS ALERTS */}
      {(error || success) && (
        <div className="mb-4 animate-slide-in">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")} className="rounded-4 shadow-sm py-2.5">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess("")} className="rounded-4 shadow-sm py-2.5">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* THREE COLUMN INTEGRATED WORKSPACE */}
      <div className="three-column-grid mb-4" style={{ marginTop: "32px" }}>
        {/* COLUMN 1: ROLES SELECTION LIST */}
        <div className="premium-card rounded-4 bg-white p-4 h-100 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h6 fw-black text-dark mb-0 text-uppercase" style={{ letterSpacing: "0.03em" }}>Roles</h3>
            {hasPermission("roles.create") && (
              <Button
                onClick={() => alert("La creación de nuevos roles comerciales está deshabilitada en esta versión de desarrollo local.")}
                variant="light"
                size="sm"
                className="d-flex align-items-center gap-1 border rounded-pill px-2.5 py-1 text-purple-600 hover-scale-subtle smaller fw-bold"
                style={{ fontSize: "11px", borderColor: "rgba(0,0,0,0.06)" }}
              >
                <PlusCircle size={13} />
                <span>Nuevo Rol</span>
              </Button>
            )}
          </div>

          {/* Role search filter */}
          <InputGroup className="rounded-pill overflow-hidden border mb-3" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <InputGroup.Text className="bg-white border-0 pe-0 text-muted">
              <Search size={14} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar rol..."
              value={roleSearchQuery}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
              className="border-0 px-2 py-1.5 small text-dark"
              style={{ fontSize: "12.5px" }}
            />
          </InputGroup>

          <div className="d-flex flex-column overflow-auto flex-grow-1" style={{ maxHeight: "680px", gap: "12px" }}>
            {filteredRoles.length === 0 ? (
              <div className="text-center py-4 text-muted small">No se encontraron roles.</div>
            ) : (
              filteredRoles.map((r) => {
                const isSelected = selectedRoleForEdit?.id === r.id;
                const isSystem = r.isSystemRole;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    className={`role-card-item w-100 ${isSelected ? "role-card-item--active" : ""}`}
                  >
                    {/* Cabecera: Icono + Nombre y Badge */}
                    <div className="d-flex justify-content-between align-items-start w-100 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-3 text-purple-600" style={{ backgroundColor: isSelected ? "rgba(124, 58, 237, 0.12)" : "#f3f4f6" }}>
                          <Shield size={18} className={isSelected ? "text-purple-600" : "text-secondary"} />
                        </div>
                        <span className="fw-bold text-dark" style={{ fontSize: "16px", letterSpacing: "-0.01em" }}>
                          {r.name}
                        </span>
                      </div>
                      {isSystem ? (
                        <span className="badge rounded-pill px-2.5 py-1" style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "rgba(124, 58, 237, 0.08)", color: "#7c3aed", border: "1.5px solid rgba(124, 58, 237, 0.15)" }}>Sistema</span>
                      ) : (
                        <span className="badge rounded-pill px-2.5 py-1 text-white" style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#7c3aed", border: "1.5px solid #6d28d9" }}>Personalizado</span>
                      )}
                    </div>

                    {/* Descripción completa sin cortar */}
                    <div className="role-card-desc flex-grow-1 my-2">
                      <p className="mb-0" style={{ fontSize: "13px", lineHeight: "1.45", whiteSpace: "normal", color: "#4b5563" }}>
                        {r.description || "Acceso operativo en el salón."}
                      </p>
                    </div>

                    {/* Colaboradores asignados en una línea separada al final */}
                    <div className="d-flex align-items-center gap-2 pt-2 border-top w-100 mt-2" style={{ fontSize: "12px", color: "#4b5563" }}>
                      <Users size={14} style={{ color: "#6b7280" }} />
                      {(() => {
                        const activeCount = members.filter(m => m.role === r.key && m.status === "ACTIVE").length;
                        const pendingCount = invitations.filter(inv => inv.role === r.key && inv.status === "PENDING").length;
                        const totalColaboradores = activeCount + pendingCount;
                        return (
                          <span>{totalColaboradores} {totalColaboradores === 1 ? "colaborador asignado" : "colaboradores asignados"}</span>
                        );
                      })()}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-3 pt-2 border-top text-center">
            <Button
              variant="link"
              className="text-decoration-none text-muted smaller d-inline-flex align-items-center gap-1.5 hover-text-dark p-0"
              style={{ fontSize: "12px" }}
            >
              <Eye size={14} />
              <span>Ver roles inactivos (0)</span>
            </Button>
          </div>
        </div>

        {/* COLUMN 2: PERMISSIONS ACCORDION */}
        <div className="editor-column-wrap">
          {selectedRoleForEdit ? (
            <div className="premium-card rounded-4 bg-white p-4 h-100 d-flex flex-column">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 pb-2 border-bottom">
                <div>
                  <h3 className="h6 fw-black text-dark mb-0 text-uppercase" style={{ letterSpacing: "0.03em" }}>Permisos del rol</h3>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="fw-black" style={{ fontSize: "15px", color: "#6d28d9" }}>{selectedRoleForEdit.name}</span>
                    {selectedRoleForEdit.isSystemRole ? (
                      <span className="badge rounded-pill px-2 py-0.5" style={{ fontSize: "9px", fontWeight: "700", backgroundColor: "rgba(124, 58, 237, 0.08)", color: "#7c3aed", border: "1.5px solid rgba(124, 58, 237, 0.15)" }}>Sistema</span>
                    ) : (
                      <span className="badge rounded-pill px-2 py-0.5 text-white" style={{ fontSize: "9px", fontWeight: "700", backgroundColor: "#7c3aed", border: "1.5px solid #6d28d9" }}>Personalizado</span>
                    )}
                    <span className="badge badge-completo rounded-pill" style={{ fontSize: "9px", fontWeight: "700" }}>
                      {selectedRoleForEdit.key === "owner" ? "Total Bypass" : 
                       selectedRoleForEdit.key === "admin" ? "Nivel de acceso: Alto" :
                       selectedRoleForEdit.key === "manager" ? "Nivel de acceso: Medio" : "Nivel de acceso: Básico"}
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-1.5 align-self-sm-center">
                  {!selectedRoleForEdit.isSystemRole && hasPermission("roles.delete") && (
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleDuplicateCurrentRole()}
                      className="border rounded-pill px-2.5 py-1.5 fw-semibold text-secondary smaller"
                      style={{ fontSize: "11px" }}
                    >
                      Duplicar Rol
                    </Button>
                  )}
                  {selectedRoleForEdit.key === "owner" && !selectedRoleForEdit.businessId ? (
                    <span className="text-muted smaller fw-bold py-1.5 px-3 border rounded-pill bg-light" style={{ fontSize: "11px" }}>Total Bypass</span>
                  ) : (
                    <Button
                      onClick={handleSaveRolePermissions}
                      disabled={savingRolePermissions}
                      className={`border-0 text-white rounded-pill px-3 py-1.5 fw-bold shadow-xs smaller d-flex align-items-center gap-1 hover-scale-subtle btn-gradient-purple ${hasUnsavedPermissions ? "pulse-btn" : ""}`}
                      style={{ fontSize: "11px" }}
                    >
                      <Save size={12} />
                      <span>Guardar Cambios</span>
                    </Button>
                  )}
                </div>
              </div>

              {selectedRoleForEdit.key === "owner" && !selectedRoleForEdit.businessId && (
                <Alert variant="warning" className="rounded-4 smaller border shadow-xs py-2 px-3 mb-3" style={{ fontSize: "11.5px" }}>
                  El rol Owner tiene acceso completo e inalterable en el backend.
                </Alert>
              )}

              {/* Dual-Column Visual Quick Info Card */}
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div className="p-3 rounded-4 h-100" style={{ backgroundColor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                    <div className="d-flex align-items-center gap-1.5 mb-2">
                      <div className="p-1 rounded-3 text-success d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(16, 185, 129, 0.12)" }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="fw-bold text-success" style={{ fontSize: "11.5px" }}>Puede hacer</span>
                    </div>
                    <ul className="list-unstyled d-grid gap-1.5 m-0 text-dark" style={{ fontSize: "11px" }}>
                      {visualPerms.canDo.map((item, idx) => (
                        <li key={idx} className="d-flex align-items-start gap-1">
                          <span className="text-success mt-0.5 flex-shrink-0">•</span>
                          <span style={{ lineHeight: "1.3" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="p-3 rounded-4 h-100" style={{ backgroundColor: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.12)" }}>
                    <div className="d-flex align-items-center gap-1.5 mb-2">
                      <div className="p-1 rounded-3 text-danger d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                        <Lock size={10} strokeWidth={3} />
                      </div>
                      <span className="fw-bold text-danger" style={{ fontSize: "11.5px" }}>No puede hacer</span>
                    </div>
                    <ul className="list-unstyled d-grid gap-1.5 m-0 text-dark" style={{ fontSize: "11px" }}>
                      {visualPerms.cannotDo.length === 0 ? (
                        <li className="text-success fw-bold d-flex align-items-start gap-1">
                          <span>•</span>
                          <span>Acceso total sin restricciones</span>
                        </li>
                      ) : (
                        visualPerms.cannotDo.map((item, idx) => (
                          <li key={idx} className="d-flex align-items-start gap-1">
                            <span className="text-danger mt-0.5 flex-shrink-0">•</span>
                            <span style={{ lineHeight: "1.3", color: "#64748b" }}>{item}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </Col>
              </Row>

              {/* Guía Paso a Paso Interactiva */}
              <div className="p-3 mb-3 rounded-4" style={{ backgroundColor: "#f5f3ff", border: "1.5px solid rgba(124, 58, 237, 0.12)" }}>
                <div className="fw-bold text-purple-600 mb-1" style={{ fontSize: "11px", letterSpacing: "0.03em" }}>⚙️ CÓMO MODIFICAR Y GUARDAR PERMISOS</div>
                <ol className="m-0 ps-3 text-secondary" style={{ fontSize: "11px", lineHeight: "1.45" }}>
                  <li>Marcá o desmarcá los permisos de los módulos desplegables de abajo.</li>
                  <li><b>Paso Crucial:</b> Hacé clic en el botón pulsante <span className="text-purple-600 fw-bold">"Guardar Cambios"</span> en la esquina superior para guardarlo en la base de datos. Si no lo haces, los cambios se perderán.</li>
                </ol>
              </div>

              {/* Banner flotante de advertencia si hay cambios sin guardar */}
              {hasUnsavedPermissions && (
                <div className="alert alert-warning py-2.5 px-3 rounded-4 mb-3 d-flex align-items-center gap-2 animate-bounce shadow-xs" style={{ fontSize: "11.5px", border: "1.5px dashed #f59e0b" }}>
                  <AlertTriangle size={15} className="text-warning flex-shrink-0" />
                  <div>
                    <strong>¡Tienes cambios locales sin guardar!</strong> Presioná el botón <span className="text-purple-600 fw-bold">"Guardar Cambios"</span> arriba a la derecha para actualizar en la nube.
                  </div>
                </div>
              )}

              <div className="mb-2 d-flex justify-content-between align-items-center">
                <span className="text-muted fw-bold small text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.03em" }}>Módulos y permisos</span>
                <Button 
                  variant="link" 
                  className="p-0 text-decoration-none text-purple-600 smaller font-bold" 
                  style={{ fontSize: "11px" }}
                  onClick={() => {
                    const allExpanded = {};
                    Object.keys(groupedPermissions).forEach(k => allExpanded[k] = true);
                    setExpandedModules(allExpanded);
                  }}
                >
                  Expandir todos
                </Button>
              </div>

              {/* Accordion modules list */}
              <div className="overflow-auto pe-1 flex-grow-1" style={{ maxHeight: "480px" }}>
                {Object.entries(groupedPermissions).map(([modName, permissions]) => {
                  const stats = getModulePermissionStats(modName);
                  const isExpanded = expandedModules[modName] || false;
                  const modState = getModuleState(stats.enabled, stats.total);
                  
                  // Module dynamic descriptions matching high-fidelity mockup
                  const modDescriptions = {
                    "Agenda": "Gestión de citas y programación de colaboradores.",
                    "Auditoría": "Registro histórico y logs de cambios del sistema.",
                    "Automatizaciones": "Flujos de trabajo, disparadores y bots automáticos.",
                    "Clientes": "Información, fichas técnicas e historial del CRM.",
                    "Configuración": "Ajustes generales, datos del negocio y marca.",
                    "Dashboard": "Panel de control central y widgets de métricas.",
                    "Equipo": "Comisiones, colaboradores y horarios de trabajo.",
                    "Finanzas": "Balances financieros, caja, cobros y egresos.",
                    "Inventario": "Existencias de productos, stock y proveedores.",
                    "Reportes": "Informes de rendimiento y analíticas del salón.",
                    "Planillas": "Plantillas, reportes Sheets y visualizadores."
                  };
                  const subtext = modDescriptions[modName] || "Políticas de accesos granulares del módulo.";

                  return (
                    <div key={modName} className="mb-2">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleModuleExpanded(modName)}
                        className={`module-sleek-row ${isExpanded ? "module-sleek-row--expanded" : ""}`}
                      >
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                          <div className="p-2 rounded-3" style={{ backgroundColor: "#f5f3ff" }}>
                            {getModuleIcon(modName)}
                          </div>
                          <div>
                            <span className="fw-bold text-dark text-capitalize d-block" style={{ fontSize: "12.5px" }}>{modName}</span>
                            <span className="text-secondary smaller" style={{ fontSize: "10.5px" }}>{subtext}</span>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge className={`${modState.badgeClass} rounded-pill px-2 py-1 font-size-9`} style={{ fontSize: "9px" }}>
                            {stats.enabled} / {stats.total} perms
                          </Badge>
                          <span className={`badge ${modState.badgeClass} rounded-pill px-2 py-1 font-size-9 d-flex align-items-center gap-1`} style={{ fontSize: "9px" }}>
                            {modState.hasLock && <Lock size={8} />}
                            {modState.label}
                          </span>
                          {isExpanded ? <ChevronUp size={14} className="text-secondary" /> : <ChevronDown size={14} className="text-secondary" />}
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="module-sleek-content d-grid gap-2.5">
                          {permissions.map((p) => {
                            const isChecked = rolePermissionsSelected.includes(p.action);
                            const isOwner = selectedRoleForEdit.key === "owner" && !selectedRoleForEdit.businessId;
                            const isDisabled = isOwner || !hasPermission("permissions.edit");

                            return (
                              <Form.Check
                                key={p.id}
                                type="checkbox"
                                id={`perm-editor-${p.id}`}
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => handleCheckboxToggle(p.action)}
                                label={
                                  <div className="ms-1">
                                    <span className="fw-bold small block-text" style={{ fontSize: "12px", color: "#111827" }}>{p.action}</span>
                                    <span className="d-block mt-0.5" style={{ fontSize: "11px", lineHeight: "1.3", color: "#4b5563" }}>{p.description}</span>
                                  </div>
                                }
                                className="checkbox-custom-matrix-inline m-0 d-flex align-items-start"
                                style={{ cursor: isDisabled ? "default" : "pointer" }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend bar */}
              <div className="d-flex justify-content-center align-items-center gap-4 pt-2 border-top mt-2 text-muted smaller" style={{ fontSize: "10.5px" }}>
                <span className="d-flex align-items-center gap-1.5"><span className="bullet-legend rounded-circle" style={{ width: "7px", height: "7px", backgroundColor: "#10b981", display: "inline-block" }}></span> Completo (80 - 100%)</span>
                <span className="d-flex align-items-center gap-1.5"><span className="bullet-legend rounded-circle" style={{ width: "7px", height: "7px", backgroundColor: "#f59e0b", display: "inline-block" }}></span> Parcial (30 - 79%)</span>
                <span className="d-flex align-items-center gap-1.5"><span className="bullet-legend rounded-circle" style={{ width: "7px", height: "7px", backgroundColor: "#ef4444", display: "inline-block" }}></span> Sin acceso (0 - 29%)</span>
              </div>
            </div>
          ) : (
            <div className="premium-card rounded-4 bg-white p-5 text-center d-flex flex-column align-items-center justify-content-center h-100">
              <ShieldQuestion size={48} className="text-muted mb-3" />
              <div className="fw-bold text-dark">No se ha seleccionado ningún rol</div>
              <p className="text-secondary smaller mt-1">Elegí un rol comercial de la columna izquierda para auditar o configurar sus permisos.</p>
            </div>
          )}
        </div>

        {/* COLUMN 3: USERS WITH THIS ROLE */}
        <div className="resumen-column-wrap">
          {selectedRoleForEdit ? (
            <div className="premium-card rounded-4 bg-white p-4 h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div>
                  <h3 className="h6 fw-black text-dark mb-0 text-uppercase" style={{ letterSpacing: "0.03em" }}>
                    Usuarios del Rol
                  </h3>
                  <p className="smaller mb-0 mt-0.5" style={{ color: "#4b5563", fontSize: "11px" }}>Gestioná accesos para {selectedRoleForEdit.name}</p>
                </div>
                <Button
                  onClick={() => {
                    setInviteRole(selectedRoleForEdit.key);
                    setShowInviteModal(true);
                  }}
                  variant="light"
                  size="sm"
                  className="d-flex align-items-center gap-1 border rounded-pill px-2.5 py-1 text-purple-600 hover-scale-subtle smaller fw-bold"
                  style={{ fontSize: "11px", borderColor: "rgba(0,0,0,0.06)" }}
                >
                  <UserPlus size={13} />
                  <span>Invitar Nuevo</span>
                </Button>
              </div>

              {/* Ayuda Paso a Paso: Asignación */}
              <div className="p-3 mb-3 rounded-4" style={{ backgroundColor: "#f0fdf4", border: "1.5px solid rgba(22, 163, 74, 0.12)" }}>
                <div className="fw-bold text-success mb-1" style={{ fontSize: "11px", letterSpacing: "0.03em" }}>👥 CÓMO VINCULAR USUARIOS</div>
                <ol className="m-0 ps-3 text-secondary" style={{ fontSize: "11px", lineHeight: "1.4" }}>
                  <li>Para usuarios <b>nuevos</b>: Hacé clic en <span className="text-success fw-bold">"Invitar Nuevo"</span> arriba.</li>
                  <li>Para usuarios <b>existentes</b>: Seleccioná la pestaña <span className="text-success fw-bold">"Asignar Existente"</span> abajo.</li>
                </ol>
              </div>

              {/* Tab Navigation */}
              <div className="d-flex border-bottom mb-3" style={{ fontSize: "12.5px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTabColumn3("members")}
                  className="btn pb-2 px-3 rounded-0 border-0 text-start font-semibold"
                  style={{
                    color: activeTabColumn3 === "members" ? "#7c3aed" : "#6b7280",
                    borderBottom: activeTabColumn3 === "members" ? "2.5px solid #7c3aed" : "2.5px solid transparent",
                    fontWeight: activeTabColumn3 === "members" ? "700" : "500",
                    background: "none",
                    boxShadow: "none"
                  }}
                >
                  Miembros ({membersWithThisRole.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabColumn3("assign")}
                  className="btn pb-2 px-3 rounded-0 border-0 text-start font-semibold"
                  style={{
                    color: activeTabColumn3 === "assign" ? "#7c3aed" : "#6b7280",
                    borderBottom: activeTabColumn3 === "assign" ? "2.5px solid #7c3aed" : "2.5px solid transparent",
                    fontWeight: activeTabColumn3 === "assign" ? "700" : "500",
                    background: "none",
                    boxShadow: "none"
                  }}
                >
                  Asignar Existente ({otherMembers.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-grow-1 overflow-auto pe-1 mb-4" style={{ maxHeight: "320px" }}>
                {activeTabColumn3 === "members" ? (
                  membersWithThisRole.length === 0 ? (
                    <div className="text-center py-4 text-muted small italic border border-dashed rounded-4 bg-light bg-opacity-30">
                      No hay colaboradores con este rol comercial asignado.
                    </div>
                  ) : (
                    <div className="d-grid gap-2">
                      {membersWithThisRole.map((m) => {
                        const isOwner = m.role === "owner";
                        const userInitials = m.user?.name ? m.user.name.substring(0, 2).toUpperCase() : (m.user?.email || "US").substring(0, 2).toUpperCase();
                        return (
                          <div key={m.id} className="p-3 rounded-4 border bg-white d-flex align-items-center justify-content-between shadow-xs">
                            <div className="d-flex align-items-center gap-2.5 text-truncate">
                              {m.user?.avatar ? (
                                <img src={m.user.avatar} alt="Avatar" className="rounded-circle border" style={{ width: "32px", height: "32px", objectFit: "cover" }} />
                              ) : (
                                <div className="avatar-circle rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", fontSize: "11px" }}>
                                  {userInitials}
                                </div>
                              )}
                              <div className="text-start text-truncate" style={{ maxWidth: "160px" }}>
                                <strong className="small d-block text-truncate" style={{ fontSize: "12px", lineHeight: "1.2", color: "#111827" }}>
                                  {m.user?.name || "Invitado Pendiente"}
                                </strong>
                                <span className="d-block text-truncate" style={{ fontSize: "10px", lineHeight: "1.2", color: "#4b5563" }}>
                                  {m.user?.email}
                                </span>
                                {m.isInvitation ? (
                                  <span className="badge rounded-pill mt-1" style={{ fontSize: "9px", backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#d97706", border: "1.5px solid rgba(245, 158, 11, 0.15)", fontWeight: "700" }}>
                                    Invitado (Pendiente)
                                  </span>
                                ) : (
                                  <Badge className={`rounded-pill mt-1 ${m.status === "ACTIVE" ? "badge-active" : "badge-suspended"}`} style={{ fontSize: "8.5px" }}>
                                    {m.status === "ACTIVE" ? "Activo" : "Suspendido"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {m.isInvitation ? (
                              <Dropdown align="end">
                                <Dropdown.Toggle as={Button} variant="link" className="p-0 text-muted shadow-none border-0 bg-transparent hover-text-dark">
                                  <MoreVertical size={16} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-lg border rounded-3 p-1">
                                  <Dropdown.Item
                                    className="d-flex align-items-center gap-2 rounded-2 py-2 text-danger smaller"
                                    onClick={() => handleCancelInvite(m.id, m.user.email)}
                                  >
                                    <Trash2 size={13} />
                                    Cancelar Invitación
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            ) : !isOwner && (
                              <Dropdown align="end">
                                <Dropdown.Toggle as={Button} variant="link" className="p-0 text-muted shadow-none border-0 bg-transparent hover-text-dark">
                                  <MoreVertical size={16} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-lg border rounded-3 p-1">
                                  <Dropdown.Item
                                    className="d-flex align-items-center gap-2 rounded-2 py-2 text-dark smaller"
                                    onClick={() => {
                                      setSelectedUserForEditRole(m);
                                      setNewUserRole(m.role);
                                      setShowChangeRoleModal(true);
                                    }}
                                  >
                                    <ArrowRightLeft size={13} className="text-purple-600" />
                                    Reasignar Rol
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    className="d-flex align-items-center gap-2 rounded-2 py-2 text-dark smaller"
                                    onClick={() => handleToggleUserStatus(m)}
                                  >
                                    <Ban size={13} className="text-secondary" />
                                    {m.status === "ACTIVE" ? "Suspender Acceso" : "Activar Acceso"}
                                  </Dropdown.Item>

                                  <Dropdown.Divider />

                                  <Dropdown.Item
                                    className="d-flex align-items-center gap-2 rounded-2 py-2 text-danger smaller"
                                    onClick={() => handleRemoveUser(m)}
                                  >
                                    <Trash2 size={13} />
                                    Eliminar del negocio
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="d-flex flex-column gap-3 p-2">
                    <div className="alert alert-info border-0 p-3 rounded-4 smaller" style={{ fontSize: "11.5px", lineHeight: "1.4" }}>
                      ℹ️ Transferí cualquier colaborador activo de tu negocio al rol <strong>{selectedRoleForEdit.name}</strong>. Esto actualizará instantáneamente sus accesos en Firestore y Postgres.
                    </div>
                    {otherMembers.length === 0 ? (
                      <div className="text-center py-4 text-muted small italic border border-dashed rounded-4 bg-light bg-opacity-30">
                        No hay otros colaboradores disponibles en el negocio para transferir.
                      </div>
                    ) : (
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small">Seleccioná un Colaborador *</Form.Label>
                        <Form.Select
                          value={selectedExistingUserToTransfer}
                          onChange={(e) => setSelectedExistingUserToTransfer(e.target.value)}
                          className="rounded-3 py-2 text-capitalize small"
                          style={{ fontSize: "13px" }}
                        >
                          <option value="">-- Seleccionar Colaborador --</option>
                          {otherMembers.map((om) => (
                            <option key={om.id} value={om.id}>
                              {om.user?.name || "Colaborador"} ({om.user?.email}) — Rol: {om.role}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          disabled={!selectedExistingUserToTransfer}
                          onClick={() => {
                            const chosen = otherMembers.find(om => om.id === selectedExistingUserToTransfer);
                            if (chosen) {
                              handleAssignExistingUser(chosen.id, chosen.user.email);
                            }
                          }}
                          className="w-100 mt-3 border-0 text-white rounded-pill px-4 py-2 fw-bold shadow-xs smaller d-flex align-items-center justify-content-center gap-1.5 hover-scale-subtle btn-gradient-purple"
                          style={{ fontSize: "12px" }}
                        >
                          <UserCheck size={14} />
                          <span>Confirmar y Cambiar a {selectedRoleForEdit.name}</span>
                        </Button>
                      </Form.Group>
                    )}
                  </div>
                )}
              </div>

              {/* Restricciones del rol Card */}
              <div className="mt-auto p-3 bg-light bg-opacity-45 rounded-4 border d-grid gap-1.5">
                <div className="fw-bold text-dark smaller mb-1" style={{ fontSize: "11px" }}>Restricciones del rol</div>
                {!restrictions.hasFinance && (
                  <div className="d-flex align-items-center gap-2 text-danger smaller" style={{ fontSize: "11px" }}>
                    <Lock size={12} className="flex-shrink-0" />
                    <span>No puede ver información financiera</span>
                  </div>
                )}
                {!restrictions.hasRolesEdit && (
                  <div className="d-flex align-items-center gap-2 text-danger smaller" style={{ fontSize: "11px" }}>
                    <Lock size={12} className="flex-shrink-0" />
                    <span>No puede editar roles y permisos</span>
                  </div>
                )}
                {!restrictions.hasReports && (
                  <div className="d-flex align-items-center gap-2 text-danger smaller" style={{ fontSize: "11px" }}>
                    <Lock size={12} className="flex-shrink-0" />
                    <span>No puede exportar reportes avanzados</span>
                  </div>
                )}
                {restrictions.hasFinance && restrictions.hasRolesEdit && restrictions.hasReports && (
                  <div className="d-flex align-items-center gap-2 text-success smaller" style={{ fontSize: "11px" }}>
                    <CheckCircle size={12} className="flex-shrink-0" />
                    <span>Sin restricciones críticas de visualización</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="premium-card rounded-4 bg-white p-5 text-center d-flex flex-column align-items-center justify-content-center h-100">
              <Users size={48} className="text-muted mb-3" />
              <div className="fw-bold text-dark">Sin rol activo</div>
              <p className="text-secondary smaller mt-1">Elegí un rol comercial de la columna izquierda para ver su resumen de seguridad.</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER SECTION: AUDIT LOGS TRAIL */}
      <div className="premium-card rounded-4 bg-white p-4 mb-2">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h3 className="h6 fw-black text-dark mb-0 text-uppercase" style={{ letterSpacing: "0.03em" }}>Últimos cambios en roles y permisos</h3>
          <Button
            variant="link"
            className="text-decoration-none text-purple-600 font-bold p-0 smaller d-flex align-items-center gap-1.5"
            style={{ fontSize: "12px" }}
          >
            <span>Ver bitácora completa</span>
            <ArrowRightLeft size={12} />
          </Button>
        </div>

        <div className="d-grid gap-1">
          {auditLogs.length === 0 ? (
            <div className="text-center py-3 text-muted small">No se registran cambios de accesos en el sistema.</div>
          ) : (
            auditLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="audit-log-row d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center text-white font-bold shadow-xs"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)",
                      fontSize: "10px"
                    }}
                  >
                    {log.user?.name ? log.user.name.substring(0, 2).toUpperCase() : "US"}
                  </div>
                  <div>
                    {renderLogMessage(log)}
                  </div>
                </div>
                <div className="text-muted smaller" style={{ fontSize: "11px" }}>
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MATRIX Dbird-eye VIEW MODAL */}
      <Modal
        show={showMatrixModal}
        onHide={() => setShowMatrixModal(false)}
        centered
        size="lg"
        backdrop="static"
        contentClassName="border-0 shadow-lg"
        style={{ backdropFilter: "blur(4px)" }}
      >
        <Modal.Header closeButton className="bg-light border-0 py-3">
          <Modal.Title className="h5 fw-black d-flex align-items-center gap-2">
            <FolderOpen className="text-purple-600" size={20} />
            <span>Matriz Visual Unificada de Permisos</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3 pb-2 border-bottom">
            <span className="text-muted smaller">Buscá y marca casillas por rol comercial y módulo del catálogo en Neon.</span>
            
            <div className="d-flex align-items-center gap-2.5 w-100 w-sm-auto">
              <InputGroup className="max-w-280 rounded-pill overflow-hidden border">
                <InputGroup.Text className="bg-white border-0 pe-0 text-muted">
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar..."
                  value={matrixSearchQuery}
                  onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  className="border-0 px-2 py-1.5 small"
                  style={{ fontSize: "12px" }}
                />
              </InputGroup>

              <Form.Select
                value={matrixModuleFilter}
                onChange={(e) => setMatrixModuleFilter(e.target.value)}
                className="rounded-pill px-3 py-1.5 border text-capitalize small"
                style={{ width: "160px", fontSize: "12px" }}
              >
                <option value="all">Todos</option>
                {uniqueModulesList.map(mod => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </Form.Select>
            </div>
          </div>

          <div className="table-responsive rounded-3 border overflow-auto" style={{ maxHeight: "420px" }}>
            <Table bordered hover align="middle" className="mb-0 matrix-table">
              <thead className="bg-light sticky-top" style={{ zIndex: 10 }}>
                <tr>
                  <th className="px-3 py-2 text-muted fw-bold small text-uppercase" style={{ minWidth: "220px", background: "#f8f9fa" }}>Permiso</th>
                  {roles.map((r) => (
                    <th key={r.id} className="py-2 text-center text-muted fw-bold small text-uppercase" style={{ minWidth: "100px", background: "#f8f9fa" }}>
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMatrixPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={roles.length + 1} className="text-center py-4 text-muted small">No se encontraron permisos.</td>
                  </tr>
                ) : (
                  filteredMatrixPermissions.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2">
                        <div className="fw-semibold text-dark small" style={{ fontSize: "12px" }}>{p.action}</div>
                        <Badge bg="secondary" className="mt-1 text-capitalize text-muted-opacity" style={{ fontSize: "8.5px" }}>{p.module}</Badge>
                      </td>
                      {roles.map((r) => {
                        const isChecked = (matrixChanges[r.id] || []).includes(p.action);
                        const isDisabled = r.key === "owner" && !r.businessId;
                        return (
                          <td key={r.id} className="text-center py-2">
                            <Form.Check
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => handleMatrixToggle(r.id, p.action)}
                              className="d-inline-block checkbox-custom-matrix m-0"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light py-3">
          <Button
            variant="outline-secondary"
            onClick={() => setShowMatrixModal(false)}
            className="rounded-pill px-4"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveMatrix}
            disabled={savingMatrix || !isMatrixDirty}
            className="rounded-pill px-4 border-0 text-white fw-bold shadow-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
          >
            {savingMatrix ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Metadata JSON Modal */}
      <Modal
        show={showLogMetadataModal}
        onHide={() => {
          setShowLogMetadataModal(false);
          setSelectedLogMetadata(null);
        }}
        centered
      >
        <Modal.Header closeButton className="py-3 border-0 bg-light">
          <Modal.Title className="h6 fw-bold">Metadata del Evento</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-dark text-light rounded-bottom">
          <pre className="m-0 small" style={{ fontFamily: "monospace", overflowX: "auto" }}>
            {JSON.stringify(selectedLogMetadata, null, 2)}
          </pre>
        </Modal.Body>
      </Modal>

      {/* CHANGE ROLE MODAL */}
      <Modal
        show={showChangeRoleModal}
        onHide={() => {
          setShowChangeRoleModal(false);
          setSelectedUserForEditRole(null);
        }}
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg"
        style={{ backdropFilter: "blur(4px)" }}
      >
        <Modal.Header closeButton className="py-3 border-0 bg-light">
          <Modal.Title className="h6 fw-bold d-flex align-items-center gap-2">
            <ArrowRightLeft className="text-purple-600" size={18} />
            <span>Reasignar Rol del Colaborador</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="alert alert-info border-0 p-3 rounded-4 smaller mb-4" style={{ fontSize: "12px" }}>
            Reasignando rol para: <strong className="text-dark">{selectedUserForEditRole?.user?.email}</strong>
          </div>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Nuevo Rol Comercial *</Form.Label>
            <Form.Select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="rounded-3 py-2 text-capitalize small"
              style={{ fontSize: "13px" }}
            >
              <option value="admin">⚙️ Administrador</option>
              <option value="finance">💼 Gestor Financiero</option>
              <option value="reception">🗓️ Recepcionista</option>
              <option value="professional">✂️ Profesional</option>
              <option value="manager">📋 Manager / Encargado</option>
            </Form.Select>
          </Form.Group>
          <p className="text-muted smaller mb-0" style={{ fontSize: "11px", lineHeight: "1.4" }}>
            * Al cambiar el rol, se restablecerán automáticamente los permisos predeterminados del nuevo rol en Google Cloud Firestore y PostgreSQL.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light py-3">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowChangeRoleModal(false);
              setSelectedUserForEditRole(null);
            }}
            className="rounded-pill px-4 small"
            style={{ fontSize: "12.5px" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUserRole}
            disabled={savingUserRole}
            className="rounded-pill px-4.5 btn-gradient-purple small"
            style={{ fontSize: "12.5px" }}
          >
            {savingUserRole ? <Spinner size="sm" /> : "Guardar Cambios"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* INVITE MODAL STEP-BY-STEP STEPS WIZARD */}
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
            <span>Paso {inviteStep} de 4: {
              inviteStep === 1 ? "Identificación del Colaborador" :
              inviteStep === 2 ? "Selección de Rol" :
              inviteStep === 3 ? "Ajustes Granulares de Permisos" : "Revisión y Confirmación"
            }</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          
          {/* Stepper bar indicator */}
          <div className="d-flex justify-content-between align-items-center mb-4 px-2 pb-3 border-bottom">
            {[
              { step: 1, label: "Identificación" },
              { step: 2, label: "Rol" },
              { step: 3, label: "Permisos" },
              { step: 4, label: "Resumen" }
            ].map((item) => {
              const isActive = inviteStep === item.step;
              const isCompleted = inviteStep > item.step;
              return (
                <div key={item.step} className="d-flex align-items-center gap-2">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ 
                      width: "28px", 
                      height: "28px", 
                      backgroundColor: isActive ? "#7c3aed" : isCompleted ? "#10b981" : "#e5e7eb",
                      fontSize: "11px",
                      transition: "all 0.25s ease"
                    }}
                  >
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : item.step}
                  </div>
                  <span className="small d-none d-md-inline" style={{ fontWeight: isActive ? "700" : "400", color: isActive ? "#7c3aed" : isCompleted ? "#10b981" : "#9ca3af" }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Content per Step */}
          {inviteStep === 1 && (
            <div className="animate-fade-in">
              <div className="alert alert-info border-0 p-3 rounded-4 smaller mb-4" style={{ fontSize: "12.5px" }}>
                💡 <strong>Paso 1:</strong> Ingresa el correo y nombre del colaborador. Para garantizar la autenticación correcta vía Firebase, el correo debe ser una cuenta válida de Google Gmail o Google Workspace.
              </div>
              <Row className="g-3">
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
                      style={{ fontSize: "13px" }}
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
                      style={{ fontSize: "13px" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          {inviteStep === 2 && (
            <div className="animate-fade-in">
              <div className="alert alert-info border-0 p-3 rounded-4 smaller mb-4" style={{ fontSize: "12.5px" }}>
                💡 <strong>Paso 2:</strong> Selecciona el nivel de acceso principal. Cada rol viene con una plantilla predefinida de permisos recomendados que podrás ajustar en el siguiente paso.
              </div>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold small">Rol en el Negocio *</Form.Label>
                <Form.Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-3 py-2 text-capitalize small"
                  style={{ fontSize: "13px" }}
                >
                  <option value="admin">⚙️ Administrador (Acceso Alto)</option>
                  <option value="finance">💼 Gestor Financiero (Acceso Medio - Contable)</option>
                  <option value="reception">🗓️ Recepcionista (Acceso Medio - Operativo)</option>
                  <option value="professional">✂️ Profesional (Acceso Básico)</option>
                  <option value="manager">📋 Manager / Encargado (Acceso Medio)</option>
                </Form.Select>
              </Form.Group>
            </div>
          )}

          {inviteStep === 3 && (
            <div className="animate-fade-in">
              <div className="alert alert-info border-0 p-3 rounded-4 smaller mb-3" style={{ fontSize: "12.5px" }}>
                💡 <strong>Paso 3:</strong> Revisa y otorga/remueve permisos individuales para este colaborador. Se han preseleccionado los permisos recomendados para el rol de <strong>{inviteRole}</strong>.
              </div>
              <Form.Label className="fw-bold small text-purple-600 mb-2">Permisos Granulares Concedidos</Form.Label>
              <div className="border rounded-4 p-3 bg-light bg-opacity-20" style={{ maxHeight: "280px", overflowY: "auto" }}>
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
                              <strong className="d-block smaller text-dark" style={{ fontSize: "11px" }}>{p.name}</strong>
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
            </div>
          )}

          {inviteStep === 4 && (
            <div className="animate-fade-in">
              <div className="alert alert-success border-0 p-3 rounded-4 smaller mb-4" style={{ fontSize: "12.5px" }}>
                🎉 <strong>Paso 4:</strong> Revisa el resumen final de la invitación antes de confirmarla. Al enviarla, los accesos se guardarán y sincronizarán inmediatamente.
              </div>
              
              <div className="p-4 bg-light rounded-4 border d-grid gap-3.5" style={{ fontSize: "13px" }}>
                <div className="row g-2">
                  <div className="col-4 text-secondary">Colaborador:</div>
                  <div className="col-8 fw-bold text-dark">{inviteName}</div>
                </div>
                <div className="row g-2">
                  <div className="col-4 text-secondary">Correo de Google:</div>
                  <div className="col-8 fw-bold text-dark">{inviteEmail}</div>
                </div>
                <div className="row g-2">
                  <div className="col-4 text-secondary">Rol Asignado:</div>
                  <div className="col-8"><span className="badge rounded-pill text-white text-capitalize" style={{ backgroundColor: "#7c3aed", fontSize: "10.5px" }}>{inviteRole}</span></div>
                </div>
                <div className="row g-2">
                  <div className="col-4 text-secondary">Permisos Totales:</div>
                  <div className="col-8 fw-bold text-purple-600">{invitePermissions.length} de {AVAILABLE_PERMISSIONS.length} módulos habilitados</div>
                </div>
              </div>
            </div>
          )}

        </Modal.Body>
        <Modal.Footer className="border-0 bg-light py-3 d-flex justify-content-between">
          <Button
            variant="outline-secondary"
            onClick={() => {
              if (inviteStep > 1) {
                setInviteStep(prev => prev - 1);
              } else {
                setShowInviteModal(false);
              }
            }}
            className="rounded-pill px-4 small"
            style={{ fontSize: "12.5px" }}
          >
            {inviteStep > 1 ? "Atrás" : "Cancelar"}
          </Button>

          {inviteStep < 4 ? (
            <Button
              onClick={() => {
                if (inviteStep === 1) {
                  if (!inviteEmail || !inviteName) {
                    alert("Por favor completa todos los campos obligatorios del Paso 1.");
                    return;
                  }
                  if (!inviteEmail.includes("@")) {
                    alert("El formato del correo electrónico de Google no es válido.");
                    return;
                  }
                }
                setInviteStep(prev => prev + 1);
              }}
              className="rounded-pill px-4.5 btn-gradient-purple small"
              style={{ fontSize: "12.5px" }}
            >
              <span>Siguiente Paso</span>
            </Button>
          ) : (
            <Button
              onClick={handleInvite}
              disabled={inviteLoading}
              className="rounded-pill px-4.5 btn-gradient-purple small"
              style={{ fontSize: "12.5px" }}
            >
              {inviteLoading ? <Spinner size="sm" /> : "Confirmar y Enviar Acceso"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
