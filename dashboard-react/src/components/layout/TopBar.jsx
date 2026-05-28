import React from "react";
import "./TopBar.css";
import { useTranslation } from "react-i18next";
import { useBrand } from "../../header/name/BrandProvider";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Search, Bell, PenSquare, LogOut, Menu } from "lucide-react";
import LanguageSwitcher from "../language/LanguageSwitcher.jsx";

export default function TopBar({ onMenuClick, onEditBrand }) {
  const { t } = useTranslation("nav");
  const { brand } = useBrand();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
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
        <div className="topbar__brand-wrap">
          <h2 className="topbar__brand-name">{brand.companyName || t("topbar.myBusiness")}</h2>
          {brand.slogan && <p className="topbar__brand-slogan">{brand.slogan}</p>}
        </div>
      </div>

      <div className="topbar__search">
        <div className="topbar__search-icon">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder={t("topbar.searchPlaceholder")}
          className="topbar__search-input"
        />
      </div>

      <div className="topbar__actions">
        <LanguageSwitcher />
        <button className="topbar__btn" title={t("topbar.notifications")}>
          <Bell size={18} />
        </button>
        <button className="topbar__btn" title={t("topbar.brandSettings")} onClick={onEditBrand}>
          <PenSquare size={18} />
        </button>
        <div className="topbar__divider" />
        <button className="topbar__btn topbar__btn--logout" title={t("topbar.logout")} onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
