import React from "react";
import { Card, Spinner } from "react-bootstrap";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function KPIWidget({
  title,
  value,
  comparisonText = "vs anterior",
  percentage = 0,
  trend = "up", // "up" | "down" | "neutral"
  icon: Icon,
  color = "#10b981", // accent color
  loading = false,
  isEmpty = false,
}) {
  const withAlpha = (hex, alpha = 0.1) => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm rounded-4 bg-white p-3 d-flex flex-column justify-content-between h-100" style={{ minHeight: "120px" }}>
        <div className="d-flex justify-content-between align-items-start">
          <div className="w-70">
            <div className="placeholder col-6 bg-light mb-2 rounded" style={{ height: "14px" }}></div>
            <div className="placeholder col-8 bg-light rounded" style={{ height: "28px" }}></div>
          </div>
          <div className="rounded-4 p-2 bg-light" style={{ width: "40px", height: "40px" }}></div>
        </div>
        <div className="placeholder col-10 bg-light rounded mt-3" style={{ height: "12px" }}></div>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm rounded-4 bg-white p-3 d-flex flex-column justify-content-between h-100 hover-scale transition-all" style={{ minHeight: "120px" }}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <span className="text-muted small fw-semibold uppercase d-block mb-1" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>
            {title}
          </span>
          <h3 className="fw-black mb-0 text-dark" style={{ fontSize: "1.75rem", letterSpacing: "-0.03em" }}>
            {isEmpty ? "--" : value}
          </h3>
        </div>
        {Icon && (
          <div className="rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ background: withAlpha(color, 0.1), color: color }}>
            {React.isValidElement(Icon) ? Icon : React.createElement(Icon, { size: 20 })}
          </div>
        )}
      </div>

      <div className="d-flex align-items-center gap-1.5 mt-3">
        {trend === "up" && (
          <span className="d-inline-flex align-items-center text-success bg-success-subtle px-2 py-0.5 rounded-pill small fw-bold" style={{ fontSize: "11px", background: "rgba(16, 185, 129, 0.08)" }}>
            <ArrowUpRight size={12} className="me-0.5" />
            {percentage}%
          </span>
        )}
        {trend === "down" && (
          <span className="d-inline-flex align-items-center text-danger bg-danger-subtle px-2 py-0.5 rounded-pill small fw-bold" style={{ fontSize: "11px", background: "rgba(239, 68, 68, 0.08)" }}>
            <ArrowDownRight size={12} className="me-0.5" />
            {percentage}%
          </span>
        )}
        {trend === "neutral" && (
          <span className="d-inline-flex align-items-center text-muted bg-light px-2 py-0.5 rounded-pill small fw-bold" style={{ fontSize: "11px" }}>
            <Minus size={12} className="me-0.5" />
            {percentage}%
          </span>
        )}
        <span className="text-muted small ms-1" style={{ fontSize: "11px" }}>{comparisonText}</span>
      </div>
    </Card>
  );
}
