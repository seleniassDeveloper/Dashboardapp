import React from "react";
import { Badge } from "react-bootstrap";
import { 
  Zap, MessageSquare, Clock, GitFork, 
  UserPlus, DollarSign, Package, AlertCircle, 
  Trash2, Mail, Bell, ClipboardList, CheckSquare 
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";

  const meta = NODE_COLORS[node.type] || NODE_COLORS.action;
  const Icon = node.icon || ICON_MAP[node.subtype] || (node.type === "trigger" ? Zap : node.type === "condition" ? GitFork : Clock);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`position-absolute bg-white transition-all duration-300 ${
        active ? "active-node-selected" : "inactive-node-shadow"
      } ${isExecuting ? "animate-pulse" : ""}`}
      style={{
        left: node.x,
        top: node.y,
        width: "260px",
        cursor: "grab",
        zIndex: active ? 50 : 10,
        userSelect: "none",
        border: active ? "1.5px solid #8b5cf6" : "1.5px solid rgba(226, 232, 240, 0.8)",
        borderLeft: active 
          ? "6px solid #8b5cf6" 
          : node.type === "trigger" 
            ? "6px solid #f97316" 
            : node.type === "condition" 
              ? "6px solid #f59e0b" 
              : node.type === "delay" 
                ? "6px solid #64748b" 
                : "6px solid #8b5cf6",
        borderRadius: "16px",
        overflow: "hidden"
      }}
      onMouseDown={(e) => {
        // Prevent drag on input fields
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "BUTTON") return;
        onDragStart(e, node.id);
      }}
    >
      {/* Node Header */}
      <div className="px-3 py-2.5 d-flex align-items-center justify-content-between border-bottom" style={{ background: "rgba(248, 250, 252, 0.5)" }}>
        <div className="d-flex align-items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-white shadow-sm ${meta.text}`}>
            {typeof Icon === "string" ? (
              <span style={{ fontSize: "14px", lineHeight: "1" }}>{Icon}</span>
            ) : (
              React.createElement(Icon, { size: 16 })
            )}
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
          {node.description || (isEs ? "Sin descripción de parámetros." : "No parameter description set.")}
        </p>

        {node.type === "condition" && (
          <div className="d-flex justify-content-between mt-2.5 pt-2 border-top text-muted font-bold">
            <span className="text-success d-flex align-items-center gap-1">{isEs ? "🟢 SÍ" : "🟢 YES"}</span>
            <span className="text-danger d-flex align-items-center gap-1">{isEs ? "🔴 NO" : "🔴 NO"}</span>
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
            boxShadow: "0 0 8px #8b5cf6",
            zIndex: 100
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
            boxShadow: "0 0 8px #8b5cf6",
            zIndex: 100
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
              boxShadow: "0 0 8px #10b981",
              zIndex: 100
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
              boxShadow: "0 0 8px #ef4444",
              zIndex: 100
            }}
            title="No Branch Output"
          />
        </>
      )}

      <style>{`
        .inactive-node-shadow {
          box-shadow: 0 4px 25px -5px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.02) !important;
        }
        .active-node-selected {
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15), 0 20px 25px -5px rgba(139, 92, 246, 0.12) !important;
        }
      `}</style>
    </div>
  );
}
