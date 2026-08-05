import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";

export default function AgendaSubNav({ isEs = true }) {
  const location = useLocation();
  const isCalendar = location.pathname === "/app/calendar";
  const isSla = location.pathname === "/app/sla-today";

  return (
    <div className="d-inline-flex align-items-center bg-white p-1 rounded-pill border shadow-xs mb-3">
      <Link
        to="/app/calendar"
        className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 text-decoration-none transition-all ${
          isCalendar
            ? "btn-primary text-white shadow-xs"
            : "btn-light text-muted hover-text-dark"
        }`}
        style={{
          fontSize: "12.5px",
          backgroundColor: isCalendar ? "#7c3aed" : "transparent",
          borderColor: isCalendar ? "#7c3aed" : "transparent"
        }}
      >
        <Calendar size={14} />
        <span>{isEs ? "Calendario" : "Calendar"}</span>
      </Link>

      <Link
        to="/app/sla-today"
        className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 text-decoration-none transition-all ${
          isSla
            ? "btn-primary text-white shadow-xs"
            : "btn-light text-muted hover-text-dark"
        }`}
        style={{
          fontSize: "12.5px",
          backgroundColor: isSla ? "#7c3aed" : "transparent",
          borderColor: isSla ? "#7c3aed" : "transparent"
        }}
      >
        <Clock size={14} />
        <span>{isEs ? "SLA Citas Hoy" : "Today's SLA"}</span>
      </Link>
    </div>
  );
}
