import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, Users, CreditCard, Menu } from "lucide-react";
import { useBusinessModel } from "../../hooks/useBusinessModel";
import { useTranslation } from "react-i18next";
import "./MobileTabBar.css";

export default function MobileTabBar({ onMoreClick, activeTab }) {
  const location = useLocation();
  const { terms } = useBusinessModel();
  const { t } = useTranslation(["nav", "common"]);

  const getLabel = (itemId, defaultText) => {
    if (!terms?.nav) return defaultText;
    const mapping = {
      dashboard: "panel",
      appointments: "agenda",
      clients: "clients",
      finances: "finance"
    };
    const key = mapping[itemId];
    return terms.nav[key] || defaultText;
  };

  const isActive = (path) => {
    if (path === "/app" && location.pathname === "/app") return true;
    if (path !== "/app" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="mobile-tabbar">
      <Link to="/app" className={`mobile-tabbar__item ${isActive("/app") ? "mobile-tabbar__item--active" : ""}`}>
        <LayoutDashboard size={20} />
        <span>{getLabel("dashboard", t("menu.dashboard") || "Panel")}</span>
      </Link>
      
      <Link to="/app/calendar" className={`mobile-tabbar__item ${isActive("/app/calendar") ? "mobile-tabbar__item--active" : ""}`}>
        <CalendarCheck size={20} />
        <span>{getLabel("appointments", t("menu.appointments") || "Agenda")}</span>
      </Link>
      
      <Link to="/app/clients" className={`mobile-tabbar__item ${isActive("/app/clients") ? "mobile-tabbar__item--active" : ""}`}>
        <Users size={20} />
        <span>{getLabel("clients", t("menu.clients") || "Clientes")}</span>
      </Link>
      
      <Link to="/app/finances" className={`mobile-tabbar__item ${isActive("/app/finances") ? "mobile-tabbar__item--active" : ""}`}>
        <CreditCard size={20} />
        <span>{getLabel("finances", t("menu.finances") || "Caja")}</span>
      </Link>
      
      <button 
        onClick={onMoreClick} 
        className={`mobile-tabbar__item ${activeTab === "more" ? "mobile-tabbar__item--active" : ""}`}
      >
        <Menu size={20} />
        <span>Más</span>
      </button>
    </div>
  );
}
