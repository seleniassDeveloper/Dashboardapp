import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  CalendarCheck
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useBrand } from "../../header/name/BrandProvider";
import "./Sidebar.css";

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/app" },
  { id: "appointments", label: "Agenda", icon: CalendarCheck, path: "/app/calendar" }, 
  { id: "clients", label: "Clientes", icon: Users, path: "/app/clients" },
  { id: "services", label: "Servicios", icon: Scissors, path: "/app/services" },
  { id: "team", label: "Equipo", icon: Briefcase, path: "/app/team" },
  { id: "finances", label: "Finanzas", icon: CreditCard, path: "/app/finances" },
  { id: "workflows", label: "Workflows", icon: GitBranch, path: "/app/workflows" },
  { id: "automations", label: "Automatizaciones", icon: Zap, path: "/app/automations" },
  { id: "config", label: "Configuración", icon: Settings, path: "/app/settings" },
];

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
  const { logout, isAdmin } = useAuth();
  const { brand } = useBrand();

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
        {MENU_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/app" && location.pathname.startsWith(item.path));
          
          const handleClick = (e) => {
            if (item.id === "config") {
              e.preventDefault();
              onEditBrand();
            }
            onClose();
          };

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar__item ${isActive ? "sidebar__item--active" : ""}`}
              onClick={handleClick}
            >
              <div className="sidebar__item-icon">
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span 
                    className="sidebar__item-label"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {item.label}
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
          );
        })}

        {isAdmin && (
          <button className="sidebar__item" onClick={openUsersAdmin}>
            <div className="sidebar__item-icon">
              <Settings size={20} />
            </div>
            {!isCollapsed && <span className="sidebar__item-label">Usuarios (Admin)</span>}
          </button>
        )}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__item sidebar__item--logout" onClick={logout}>
          <div className="sidebar__item-icon">
            <LogOut size={20} />
          </div>
          {!isCollapsed && <span className="sidebar__item-label">Salir</span>}
        </button>
      </div>
    </motion.aside>
  );
}
