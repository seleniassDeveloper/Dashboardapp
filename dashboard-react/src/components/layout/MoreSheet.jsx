import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scissors, 
  Briefcase, 
  Package, 
  FileSpreadsheet, 
  GitBranch, 
  Zap, 
  Settings, 
  LogOut, 
  X,
  Sparkles,
  CreditCard,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useBusinessModel } from "../../hooks/useBusinessModel";
import { useTranslation } from "react-i18next";
import "./MoreSheet.css";

export default function MoreSheet({ isOpen, onClose, installPrompt, onInstallClick }) {
  const { logout } = useAuth();
  const { terms } = useBusinessModel();
  const { t } = useTranslation(["nav", "common"]);
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/", { replace: true });
  };

  const getLabel = (itemId, defaultText) => {
    if (!terms?.nav) return defaultText;
    const mapping = {
      services: "services",
      team: "team",
      inventory: "inventory",
      config: "settings"
    };
    const key = mapping[itemId];
    return terms.nav[key] || defaultText;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="moresheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="moresheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
          >
            <div className="moresheet__header">
              <h3>Más Opciones</h3>
              <button className="moresheet__close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            
            <div className="moresheet__content">
              {installPrompt && (
                <div className="moresheet__install-banner">
                  <Sparkles size={16} className="text-purple-600 animate-pulse" />
                  <div className="moresheet__install-info">
                    <strong>AuraDash App</strong>
                    <span>Instalar en tu pantalla de inicio</span>
                  </div>
                  <button onClick={onInstallClick} className="btn btn-premium btn-sm ms-auto py-1 px-3" style={{ background: "var(--color-pink-active)", color: "#fff", minHeight: "36px", border: "none" }}>
                    Instalar
                  </button>
                </div>
              )}
              
              <div className="moresheet__grid">
                <Link to="/app" className="moresheet__link" onClick={onClose}>
                  <LayoutDashboard size={20} />
                  <span>{getLabel("dashboard", t("menu.dashboard") || "Inicio")}</span>
                </Link>
                
                <Link to="/app/services" className="moresheet__link" onClick={onClose}>
                  <Scissors size={20} />
                  <span>{getLabel("services", t("menu.services") || "Servicios")}</span>
                </Link>
                
                <Link to="/app/team" className="moresheet__link" onClick={onClose}>
                  <Briefcase size={20} />
                  <span>{getLabel("team", t("menu.team") || "Equipo")}</span>
                </Link>
                
                <Link to="/app/inventory" className="moresheet__link" onClick={onClose}>
                  <Package size={20} />
                  <span>{getLabel("inventory", t("menu.inventory") || "Inventario")}</span>
                </Link>
                
                <Link to="/app/sheets-sync" className="moresheet__link" onClick={onClose}>
                  <FileSpreadsheet size={20} />
                  <span>{t("menu.sheets_sync") || "Sheets"}</span>
                </Link>
                
                <Link to="/app/workflows" className="moresheet__link" onClick={onClose}>
                  <GitBranch size={20} />
                  <span>{t("menu.workflows") || "Flujos"}</span>
                </Link>
                
                <Link to="/app/automations" className="moresheet__link" onClick={onClose}>
                  <Zap size={20} />
                  <span>{t("menu.automations") || "Automatización"}</span>
                </Link>
                
                <Link to="/app/finances" className="moresheet__link" onClick={onClose}>
                  <CreditCard size={20} />
                  <span>{t("menu.finances") || "Caja"}</span>
                </Link>
                
                <Link to="/app/settings" className="moresheet__link" onClick={onClose}>
                  <Settings size={20} />
                  <span>{getLabel("config", t("menu.config") || "Configuración")}</span>
                </Link>
              </div>
              
              <div className="moresheet__footer">
                <button onClick={handleLogout} className="moresheet__logout-btn">
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
