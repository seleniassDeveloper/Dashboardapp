import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Briefcase, 
  CreditCard, 
  Settings,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Zap,
  LogOut,
  CalendarCheck,
  Package,
  FileSpreadsheet,
  Lock,
  Sparkles,
  Clock
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useBrand } from "../../header/name/BrandProvider";
import { usePermissions } from "../../auth/PermissionProvider";
import "./Sidebar.css";
 
const MENU_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, path: "/app" },
  { id: "appointments", icon: CalendarCheck, path: "/app/calendar" },
  { id: "clients", icon: Users, path: "/app/clients" },
  { id: "services", icon: Scissors, path: "/app/services" },
  { id: "team", icon: Briefcase, path: "/app/team" },
  { id: "finances", icon: CreditCard, path: "/app/finances" },
  { id: "inventory", icon: Package, path: "/app/inventory" },
  { id: "sheets_sync", icon: FileSpreadsheet, path: "/app/sheets-sync" },
  
  // Grupo Automatización
  { id: "workflows", icon: GitBranch, path: "/app/workflows", isAutomation: true },
  { id: "automations", icon: Zap, path: "/app/automations", isAutomation: true },
  { id: "templates", icon: Sparkles, path: "/app/templates", isAutomation: true },
  { id: "history", icon: Clock, path: "/app/history", isAutomation: true },
  
  { id: "config", icon: Settings, path: "/app/settings" },
];
const MENU_ITEM_PERMISSIONS = {
  appointments: "appointments.view",
  clients: "clients.view",
  services: "services.view",
  team: "team.view",
  finances: "view_finances",
  inventory: "inventory.view",
  sheets_sync: "sheets.view",
  workflows: "workflows.view",
  automations: "automations.view",
  templates: "workflows.view",
  history: "workflows.view",
  config: ["manage_settings", "manage_users"],
};

export default function Sidebar({ 
  isCollapsed, 
  onToggle, 
  isOpen, 
  onClose,
  openWorkersABM,
  openClientsABM,
  openUsersAdmin,
  onEditBrand
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, role } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/app", { replace: true });
  };

  const getInitials = (u) => {
    const name = u?.displayName || "";
    if (!name) return u?.email?.substring(0, 2).toUpperCase() || "US";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const { hasPermission } = usePermissions();
  const { brand } = useBrand();
  const { t } = useTranslation(["nav", "common"]);

  const sidebarVariants = {
    expanded: { width: "var(--space-sidebar)" },
    collapsed: { width: "var(--space-sidebar-collapsed)" }
  };

  return (
    <motion.aside 
      className={`sidebar ${isOpen ? "sidebar--open" : ""}`}
      initial={false}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon" style={{ backgroundColor: brand.accentColor || "var(--text-primary)" }}>
            {brand.companyName ? brand.companyName.substring(0, 2).toUpperCase() : "SS"}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span 
                className="sidebar__logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {brand.companyName || "Systems Studio"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button className="sidebar__toggle" onClick={onToggle}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {MENU_ITEMS.filter((item) => {
          const isModuleActive = brand.activeModules?.[item.id] ?? true;
          if (!isModuleActive) return false;
          
          const requiredPermission = MENU_ITEM_PERMISSIONS[item.id];
          if (requiredPermission) {
            const hasPerm = hasPermission(requiredPermission);
            if (!hasPerm && item.id === "finances") {
              const showLockedModules = brand.showLockedModules ?? true;
              return showLockedModules;
            }
            return hasPerm;
          }
          return true;
        }).map((item, idx, arr) => {
          const requiredPermission = MENU_ITEM_PERMISSIONS[item.id];
          const hasItemPermission = requiredPermission ? hasPermission(requiredPermission) : true;
          const isActive = location.pathname === item.path || (item.path !== "/app" && location.pathname.startsWith(item.path));
          
          const handleClick = () => {
            onClose();
          };

          const isFirstAutomation = item.isAutomation && !arr[idx - 1]?.isAutomation;

          return (
            <React.Fragment key={item.id}>
              {isFirstAutomation && !isCollapsed && (
                <div 
                  className="sidebar__section-title px-3 pt-3 pb-1 text-uppercase fw-bold text-muted" 
                  style={{ fontSize: "9px", letterSpacing: "1.2px", opacity: 0.7 }}
                >
                  {t("menu.automation_section")}
                </div>
              )}
              <Link
                to={item.path}
                className={`sidebar__item ${isActive ? "sidebar__item--active" : ""} ${!hasItemPermission ? "sidebar__item--locked" : ""}`}
                onClick={handleClick}
                style={!hasItemPermission ? { opacity: 0.8 } : {}}
              >
                <div className="sidebar__item-icon">
                  {hasItemPermission ? (
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  ) : (
                    <Lock size={18} className="text-secondary" strokeWidth={2} />
                  )}
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      className="sidebar__item-label d-flex align-items-center justify-content-between w-100"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                    >
                      <span>{t(`menu.${item.id}`)}</span>
                      {!hasItemPermission && (
                        <Lock size={12} className="text-secondary opacity-75 ms-1" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !isCollapsed && (
                  <motion.div 
                    layoutId="active-pill"
                    className="sidebar__item-indicator"
                    style={{ backgroundColor: brand.accentColor || "var(--accent-primary)" }}
                  />
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Premium Profile Box */}
      {user && (
        <div 
          className="sidebar__profile mx-3 mb-2 p-2 rounded-4 d-flex align-items-center gap-2 border"
          style={{
            background: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(10px)",
            borderColor: "rgba(124, 58, 237, 0.08)",
            padding: isCollapsed ? "8px" : "12px",
            justifyContent: isCollapsed ? "center" : "flex-start"
          }}
        >
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Avatar" 
              className="rounded-circle border"
              style={{ width: "32px", height: "32px", objectFit: "cover", borderColor: "rgba(124, 58, 237, 0.15)" }}
            />
          ) : (
            <div 
              className="avatar-circle rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ 
                width: "32px", 
                height: "32px", 
                background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                fontSize: "11px",
                display: "inline-flex"
              }}
            >
              {getInitials(user)}
            </div>
          )}
          
          {!isCollapsed && (
            <div className="text-start text-truncate" style={{ maxWidth: "120px" }}>
              <strong className="text-dark small d-block text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.2" }}>
                {user.displayName || "Usuario"}
              </strong>
              <span className="text-muted d-block text-truncate" style={{ fontSize: "9.5px", lineHeight: "1.2" }}>
                {user.email}
              </span>
              <span 
                className="px-2 py-0.5 rounded-pill mt-1 d-inline-block text-purple-600 font-bold" 
                style={{ 
                  fontSize: "8.5px", 
                  border: "1.5px solid rgba(124, 58, 237, 0.12)", 
                  backgroundColor: "rgba(124, 58, 237, 0.03)",
                  letterSpacing: "0.02em",
                  fontWeight: 700
                }}
              >
                {role === "owner" ? "👑 Owner" : role === "admin" ? "⚙️ Admin" : role === "finanzas" ? "💼 Finanzas" : role === "recepcion" ? "🗓️ Recepción" : "✂️ Profesional"}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="sidebar__footer">
        <button className="sidebar__item sidebar__item--logout" onClick={handleLogout}>
          <div className="sidebar__item-icon">
            <LogOut size={20} />
          </div>
          {!isCollapsed && <span className="sidebar__item-label">{t("common:actions.exit")}</span>}
        </button>
      </div>
    </motion.aside>
  );
}
