import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, SlidersHorizontal, ChevronRight, Plus, ChevronDown, Check 
} from "lucide-react";
import { getClientStatus } from "../../../lib/clientStatus";

const AVATAR_COLORS = [
  { bg: "#ede9fe", text: "#7c5cfc" }, // purple
  { bg: "#fce7f3", text: "#ec4899" }, // pink
  { bg: "#dbeafe", text: "#3b82f6" }, // blue
  { bg: "#d1fae5", text: "#10b981" }, // green
  { bg: "#fef3c7", text: "#f59e0b" }  // amber
];

const BADGE_CLASS = {
  NUEVO: "c-badge--nuevo",
  FRECUENTE: "c-badge--frecuente",
  ACTIVO: "c-badge--activo",
  INACTIVO: "c-badge--inactivo",
  VIP: "c-badge--vip"
};

export default function ClientsList({ 
  clients, appointments, q, setQ, loading, onNavigate, onBack 
}) {
  const [statusFilter, setStatusFilter] = useState("TODOS"); // TODOS | VIP | ACTIVO | INACTIVO | NUEVO | FRECUENTE
  const [orderBy, setOrderBy] = useState("recent"); // recent | name | spent
  
  // Dropdown states
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showOrderMenu, setShowOrderMenu] = useState(false);

  const displayName = (c) => {
    const full = (c?.fullName || "").trim();
    if (full) return full;
    const fn = (c?.firstName || "").trim();
    const ln = (c?.lastName || "").trim();
    return `${fn} ${ln}`.trim() || "—";
  };

  const getClientColor = (id) => {
    const hash = id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (statusFilter === "TODOS") return true;
      const { status } = getClientStatus(c, appointments);
      return status === statusFilter;
    }).sort((a, b) => {
      if (orderBy === "name") {
        return displayName(a).localeCompare(displayName(b));
      }
      if (orderBy === "spent") {
        const spentA = getClientStatus(a, appointments).totalSpent;
        const spentB = getClientStatus(b, appointments).totalSpent;
        return spentB - spentA;
      }
      // default: "recent" (by createdAt)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [clients, appointments, statusFilter, orderBy]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Header */}
      <header className="c-header">
        <button className="c-back" onClick={onBack} aria-label="Volver">
          <ChevronLeft size={24} />
        </button>
        <span className="c-header__title">Clientes</span>
        <button className="c-back" aria-label="Filtros">
          <SlidersHorizontal size={18} />
        </button>
      </header>

      {/* Buscador */}
      <div className="c-search">
        <input 
          type="text" 
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..." 
        />
      </div>

      {/* Fila de filtros */}
      <div className="c-filters">
        <div 
          className="c-chip" 
          onClick={() => {
            setShowStatusMenu(!showStatusMenu);
            setShowOrderMenu(false);
          }}
        >
          <span>
            {statusFilter === "TODOS" ? "Todos los estados" : `Estado: ${statusFilter}`}
          </span>
          <ChevronDown size={14} />
        </div>

        <div 
          className="c-chip" 
          onClick={() => {
            setShowOrderMenu(!showOrderMenu);
            setShowStatusMenu(false);
          }}
        >
          <span>
            {orderBy === "recent" ? "↕ Más recientes" : orderBy === "name" ? "↕ Alfabético" : "↕ Mayor gasto"}
          </span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Dropdown status menu sheet/overlay */}
      {showStatusMenu && (
        <div style={{
          position: "absolute",
          top: "160px",
          left: "16px",
          right: "16px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid var(--c-border)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          zIndex: 50,
          padding: "8px 0"
        }}>
          {["TODOS", "VIP", "ACTIVO", "INACTIVO", "NUEVO", "FRECUENTE"].map((st) => (
            <div 
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setShowStatusMenu(false);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "600",
                color: statusFilter === st ? "var(--c-purple)" : "var(--c-text)",
                cursor: "pointer",
                borderBottom: "1px solid #f8f7fc"
              }}
            >
              <span>{st === "TODOS" ? "Todos los estados" : st}</span>
              {statusFilter === st && <Check size={16} />}
            </div>
          ))}
        </div>
      )}

      {/* Dropdown order menu sheet/overlay */}
      {showOrderMenu && (
        <div style={{
          position: "absolute",
          top: "160px",
          left: "16px",
          right: "16px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid var(--c-border)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          zIndex: 50,
          padding: "8px 0"
        }}>
          {[
            { id: "recent", label: "Más recientes" },
            { id: "name", label: "Alfabético" },
            { id: "spent", label: "Mayor facturado" }
          ].map((ord) => (
            <div 
              key={ord.id}
              onClick={() => {
                setOrderBy(ord.id);
                setShowOrderMenu(false);
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "600",
                color: orderBy === ord.id ? "var(--c-purple)" : "var(--c-text)",
                cursor: "pointer",
                borderBottom: "1px solid #f8f7fc"
              }}
            >
              <span>{ord.label}</span>
              {orderBy === ord.id && <Check size={16} />}
            </div>
          ))}
        </div>
      )}

      {/* Lista de clientes */}
      {loading ? (
        <div className="crm-mobile__empty">Cargando clientes...</div>
      ) : filteredClients.length === 0 ? (
        <div className="crm-mobile__empty">No se encontraron clientes.</div>
      ) : (
        <div className="c-list">
          {filteredClients.map((client) => {
            const { bg, text } = getClientColor(client.id);
            const { status } = getClientStatus(client, appointments);
            const name = displayName(client);
            const sub = client.phone || client.email || "Sin contacto";

            return (
              <div 
                className="c-client-row" 
                key={client.id}
                onClick={() => onNavigate("detail", client)}
              >
                <div className="c-avatar" style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: bg,
                  color: text,
                  fontSize: "14px"
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="c-client-row__info">
                  <div className="c-client-row__name">{name}</div>
                  <div className="c-client-row__sub">{sub}</div>
                </div>
                <span className={`c-badge ${BADGE_CLASS[status]}`}>
                  {status}
                </span>
                <ChevronRight size={18} className="c-chevron" />
              </div>
            );
          })}
        </div>
      )}

      {/* FAB button */}
      <button 
        className="c-fab" 
        onClick={() => onNavigate("edit", null)}
        aria-label="Agregar cliente"
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
