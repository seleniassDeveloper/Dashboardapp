import React from "react";
import "./TopBar.css";
import { useTranslation } from "react-i18next";
import { useBrand } from "../../header/name/BrandProvider";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, PenSquare, LogOut, Menu } from "lucide-react";
import LanguageSwitcher from "../language/LanguageSwitcher.jsx";
import SuperAdminModelSelector from "./SuperAdminModelSelector.jsx";
import { useIsMobile } from "../../hooks/useIsMobile.js";

export default function TopBar({ onMenuClick, onEditBrand, onSearchClick }) {
  const { t } = useTranslation("nav");
  const { brand } = useBrand();
  const { logout, business, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const getMobileTitle = () => {
    const path = location.pathname;
    if (path === "/app" || path === "/app/") return "Inicio";
    if (path.startsWith("/app/calendar")) return "Agenda";
    if (path.startsWith("/app/clients")) return "Clientes";
    if (path.startsWith("/app/team")) return "Equipo";
    if (path.startsWith("/app/sheets-sync")) return "Sincronizador";
    if (path.startsWith("/app/finance") || path.startsWith("/app/accounting")) return "Finanzas";
    if (path.startsWith("/app/workflows")) return "Flujos";
    return brand.companyName || business?.name || "AuraDash";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const isMac = typeof window !== "undefined" && (
    navigator.platform?.toUpperCase().indexOf("MAC") >= 0 ||
    navigator.userAgent?.toUpperCase().indexOf("MAC") >= 0
  );

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
    <header
      className={`topbar ${brand.coverImage ? "topbar--has-image" : ""}`}
      style={brand.coverImage ? { backgroundImage: `url(${brand.coverImage})` } : {}}
    >
      <div className="topbar__left">
        <button className="topbar__menu-btn" onClick={onMenuClick} aria-label={t("topbar.openMenu")}>
          <Menu size={20} />
        </button>
        <div className="topbar__brand-wrap" onClick={onEditBrand}>
          <h2 className="topbar__brand-name" translate="no">
            {isMobile ? getMobileTitle() : (brand.companyName || business?.name || t("topbar.myBusiness"))}
          </h2>
          {!isMobile && brand.slogan && <p className="topbar__brand-slogan" translate="no">{brand.slogan}</p>}
        </div>
      </div>

      <div className="topbar__search" onClick={onSearchClick} style={{ cursor: "pointer" }}>
        <div className="topbar__search-icon">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder={t("topbar.searchPlaceholder")}
          className="topbar__search-input"
          readOnly
          style={{ cursor: "pointer" }}
        />
        <kbd className="topbar__search-kbd">{isMac ? "⌘K" : "Ctrl+K"}</kbd>
      </div>

      <div className="topbar__actions">
        {(user?.email === "seleniadeveloper@gmail.com" || user?.email === "selenisdeveloper@gmail.com") && <SuperAdminModelSelector />}
        <LanguageSwitcher />
        <button className="topbar__btn topbar__btn--bell" title={t("topbar.notifications")}>
          <Bell size={18} />
        </button>
        <button className="topbar__btn" title={t("topbar.brandSettings")} onClick={onEditBrand}>
          <PenSquare size={18} />
        </button>
        <div className="topbar__divider" />
        <button className="topbar__btn topbar__btn--logout" title={t("topbar.logout")} onClick={handleLogout}>
          <LogOut size={18} />
        </button>
        <div className="topbar__avatar-wrapper">
          <div className="topbar__avatar">
            {getInitials(user)}
          </div>
        </div>
      </div>
    </header>
  );
}
