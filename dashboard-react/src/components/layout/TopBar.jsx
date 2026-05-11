import React from "react";
import "./TopBar.css";
import { useBrand } from "../../header/name/BrandProvider";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Search, Bell, PenSquare, LogOut, Menu } from "lucide-react";

export default function TopBar({ onMenuClick, onEditBrand }) {
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
        <div className="topbar__brand-wrap">
          <h2 className="topbar__brand-name">{brand.companyName || "Mi Negocio"}</h2>
          {brand.slogan && <p className="topbar__brand-slogan">{brand.slogan}</p>}
        </div>
      </div>

      <div className="topbar__search">
        <div className="topbar__search-icon">
          <Search size={16} />
        </div>
        <input type="text" placeholder="Buscar citas, clientes o acciones... (⌘K)" className="topbar__search-input" />
      </div>

      <div className="topbar__actions">
        <button className="topbar__btn" title="Notificaciones">
          <Bell size={18} />
        </button>
        <button className="topbar__btn" title="Ajustes de Marca" onClick={onEditBrand}>
          <PenSquare size={18} />
        </button>
        <div className="topbar__divider" />
        <button className="topbar__btn topbar__btn--logout" title="Cerrar sesión" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
