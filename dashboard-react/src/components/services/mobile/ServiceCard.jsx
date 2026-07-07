import React from "react";
import { Clock, Tag, ChevronRight, SlidersHorizontal, User } from "lucide-react";
import { Badge } from "react-bootstrap";

function currency(n) {
  const num = Number(n);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}

export default function ServiceCard({ service, state }) {
  const { handleViewDetail } = state;

  const getInitials = (name) => {
    if (!name) return "S";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  };

  const getCommissionText = (s) => {
    if (s.commissionType === "ninguno" || !s.commissionValue) return "Sin comisión";
    if (s.commissionType === "porcentaje") return `${s.commissionValue}% comisión`;
    return `${currency(s.commissionValue)} comisión`;
  };

  // Get primary worker details
  const primaryWorker = service.workers && service.workers.length > 0 ? service.workers[0].worker : null;
  const multipleWorkers = service.workers && service.workers.length > 1;

  // Status badges mapping
  const renderStatusBadge = (statusVal) => {
    switch (String(statusVal).toLowerCase()) {
      case "active":
      case "activo":
        return <span className="s-badge s-badge--active">Activo</span>;
      case "hidden_online":
      case "hidden":
        return <span className="s-badge s-badge--paused">Pausado</span>;
      case "inactive":
      case "inactivo":
      default:
        return <span className="s-badge bg-danger-soft text-danger">Inactivo</span>;
    }
  };

  return (
    <div 
      className="s-svc" 
      onClick={() => handleViewDetail(service)}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Round Miniature Image / Fallback */}
      {service.photoUrl ? (
        <img 
          src={service.photoUrl} 
          alt={service.name} 
          className="s-svc__img" 
        />
      ) : (
        <div 
          className="s-svc__img d-flex align-items-center justify-content-center fw-bold text-white shadow-sm text-lg"
          style={{ backgroundColor: service.color || "#7c5cfc", color: "#fff", fontSize: "18px" }}
        >
          {getInitials(service.name)}
        </div>
      )}

      {/* Body Info */}
      <div className="s-svc__body">
        <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
          <span className="s-svc__name fw-bold text-gray-900">{service.name}</span>
          <span className="s-svc__cat">{service.category || "General"}</span>
        </div>

        {/* Metadata: Duration + Price */}
        <div className="s-svc__meta">
          <span>
            <Clock size={13} />
            {service.duration} min
          </span>
          <span>
            <Tag size={13} />
            {currency(service.price)}
          </span>
        </div>

        {/* Professional + Commission Row */}
        <div className="s-svc__pro">
          {primaryWorker ? (
            <>
              {primaryWorker.photo ? (
                <img 
                  src={primaryWorker.photo} 
                  alt={primaryWorker.firstName} 
                  className="s-svc__pro-av" 
                />
              ) : (
                <div 
                  className="s-svc__pro-av bg-purple-soft text-purple-600 d-flex align-items-center justify-content-center smaller fw-bold"
                  style={{ width: "22px", height: "22px", fontSize: "10px" }}
                >
                  {primaryWorker.firstName[0]}
                </div>
              )}
              <span className="smaller text-gray-700">
                {primaryWorker.firstName} {primaryWorker.lastName?.charAt(0)}.{multipleWorkers ? ` +${service.workers.length - 1}` : ""}
              </span>
            </>
          ) : (
            <>
              <div 
                className="s-svc__pro-av bg-emerald-50 text-emerald-600 d-flex align-items-center justify-content-center"
                style={{ width: "22px", height: "22px" }}
              >
                <User size={11} />
              </div>
              <span className="smaller text-emerald-700 fw-bold">Todos</span>
            </>
          )}
          
          <span className="d-flex align-items-center gap-1.5 text-muted smaller ms-2">
            <SlidersHorizontal size={12} />
            {getCommissionText(service)}
          </span>
        </div>
      </div>

      {/* Right side: Status and arrow chevron */}
      <div className="s-svc__right">
        {renderStatusBadge(service.status)}
        <ChevronRight size={16} className="s-svc__chev mt-1.5" />
      </div>
    </div>
  );
}
