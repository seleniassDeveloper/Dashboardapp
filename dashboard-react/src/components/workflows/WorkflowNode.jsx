import React from "react";
import { Badge } from "react-bootstrap";
import { 
  Zap, MessageSquare, Clock, GitFork, 
  UserPlus, DollarSign, Package, AlertCircle, 
  Trash2, Mail, Bell, ClipboardList, CheckSquare 
} from "lucide-react";

const NODE_COLORS = {
  trigger: {
    border: "border-orange-500",
    bg: "bg-orange-50 bg-opacity-90",
    text: "text-orange-700",
    badge: "bg-orange-600 text-white",
    glow: "rgba(249, 115, 22, 0.15)"
  },
  action: {
    border: "border-purple-500",
    bg: "bg-purple-50 bg-opacity-90",
    text: "text-purple-700",
    badge: "bg-purple-600 text-white",
    glow: "rgba(139, 92, 246, 0.15)"
  },
  condition: {
    border: "border-amber-500",
    bg: "bg-amber-50 bg-opacity-90",
    text: "text-amber-700",
    badge: "bg-amber-500 text-white",
    glow: "rgba(245, 158, 11, 0.15)"
  },
  delay: {
    border: "border-slate-500",
    bg: "bg-slate-50 bg-opacity-90",
    text: "text-slate-700",
    badge: "bg-slate-600 text-white",
    glow: "rgba(71, 85, 105, 0.15)"
  }
};

const ICON_MAP = {
  // Triggers
  "nueva-cita": Zap,
  "cita-confirmada": Zap,
  "cita-cancelada": Zap,
  "cita-finalizada": Zap,
  "cliente-nuevo": UserPlus,
  "cliente-inactivo": AlertCircle,
  "cumpleanos": SparklesIcon,
  "stock-bajo": Package,
  "producto-vencido": AlertCircle,
  "pago-recibido": DollarSign,
  
  // Actions
  "whatsapp": MessageSquare,
  "email": Mail,
  "notificacion": Bell,
  "crear-tarea": ClipboardList,
  "crear-nota": FileTextIcon,
  "cambiar-estado": CheckSquare,
  "descontar-stock": Package,
  "crear-pedido": FileSpreadsheetIcon
};

function SparklesIcon(props) { return <span {...props}>✨</span>; }
function FileTextIcon(props) { return <span {...props}>📝</span>; }
function FileSpreadsheetIcon(props) { return <span {...props}>📊</span>; }

export default function WorkflowNode({ 
  node, 
  active, 
  onSelect, 
  onDelete, 
  onDragStart,
  isExecuting 
}) {
  const meta = NODE_COLORS[node.type] || NODE_COLORS.action;
  const Icon = ICON_MAP[node.subtype] || (node.type === "trigger" ? Zap : node.type === "condition" ? GitFork : Clock);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`position-absolute rounded-2xl border bg-white shadow-lg transition-all ${meta.border} ${
        active ? "ring-2 ring-purple-600" : ""
      } ${isExecuting ? "animate-bounce border-success ring-4 ring-success ring-opacity-20" : ""}`}
      style={{
        left: node.x,
        top: node.y,
        width: "250px",
        cursor: "grab",
        zIndex: active ? 50 : 10,
        boxShadow: `0 10px 25px -5px ${meta.glow}, 0 8px 10px -6px ${meta.glow}`,
        userSelect: "none"
      }}
      onMouseDown={(e) => {
        // Prevent drag on input fields
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "BUTTON") return;
        onDragStart(e, node.id);
      }}
    >
      {/* Node Header */}
      <div className={`px-3 py-2.5 rounded-t-2xl d-flex align-items-center justify-content-between border-bottom ${meta.bg}`}>
        <div className="d-flex align-items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-white shadow-sm ${meta.text}`}>
            <Icon size={16} />
          </div>
          <div>
            <Badge className={`rounded-pill px-2 py-0.5 fw-bold ${meta.badge}`} style={{ fontSize: "9px" }}>
              {node.type.toUpperCase()}
            </Badge>
            <h4 className="fw-black text-gray-900 m-0 small-title-override mt-0.5" style={{ fontSize: "12px" }}>
              {node.name}
            </h4>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="btn btn-link p-0 text-muted hover-text-danger border-0 d-flex align-items-center"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Node Body */}
      <div className="p-3 bg-white rounded-b-2xl small" style={{ fontSize: "11.5px" }}>
        <p className="text-muted mb-0 fw-medium" style={{ lineHeight: "1.4" }}>
          {node.description || "Sin descripción de parámetros."}
        </p>

        {node.type === "condition" && (
          <div className="d-flex justify-content-between mt-2.5 pt-2 border-top text-muted font-bold">
            <span className="text-success d-flex align-items-center gap-1">🟢 SÍ</span>
            <span className="text-danger d-flex align-items-center gap-1">🔴 NO</span>
          </div>
        )}
      </div>

      {/* Input Connector (for all nodes except Triggers) */}
      {node.type !== "trigger" && (
        <div 
          className="position-absolute bg-purple-600 rounded-circle border border-white"
          style={{
            width: "10px",
            height: "10px",
            left: "-5px",
            top: "50%",
            transform: "translateY(-50%)",
            boxShadow: "0 0 8px #8b5cf6"
          }}
          title="Input Connector"
        />
      )}

      {/* Output Connector (for all nodes) */}
      {node.type !== "condition" && (
        <div 
          className="position-absolute bg-purple-600 rounded-circle border border-white"
          style={{
            width: "10px",
            height: "10px",
            right: "-5px",
            top: "50%",
            transform: "translateY(-50%)",
            boxShadow: "0 0 8px #8b5cf6"
          }}
          title="Output Connector"
        />
      )}

      {/* Bifurcated Output Connectors for Conditions */}
      {node.type === "condition" && (
        <>
          <div 
            className="position-absolute bg-success rounded-circle border border-white"
            style={{
              width: "10px",
              height: "10px",
              right: "-5px",
              top: "35%",
              transform: "translateY(-50%)",
              boxShadow: "0 0 8px #10b981"
            }}
            title="Yes Branch Output"
          />
          <div 
            className="position-absolute bg-danger rounded-circle border border-white"
            style={{
              width: "10px",
              height: "10px",
              right: "-5px",
              top: "65%",
              transform: "translateY(-50%)",
              boxShadow: "0 0 8px #ef4444"
            }}
            title="No Branch Output"
          />
        </>
      )}
    </div>
  );
}
