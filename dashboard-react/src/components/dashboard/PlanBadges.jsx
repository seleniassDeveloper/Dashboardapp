import React, { useState } from "react";
import {
  Calendar, Users, Scissors, CreditCard, Package, Zap,
  FileSpreadsheet, GitBranch, Sparkles, Camera, Lock,
  CheckCircle2, ArrowUpRight, ChevronDown, ChevronUp, X
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider.jsx";

// ─── Configuración de planes ────────────────────────────────────────────────

const PLAN_CONFIG = {
  starter: {
    name: "Starter",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  pro: {
    name: "Pro",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7)",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  business: {
    name: "Business",
    color: "#db2777",
    gradient: "linear-gradient(135deg, #db2777, #ec4899)",
    bg: "#fdf2f8",
    border: "#fbcfe8",
  },
};

// ─── Módulos con su estado por plan ─────────────────────────────────────────

const MODULES = [
  {
    id: "agenda",
    icon: Calendar,
    label: "Agenda",
    starter: "Completa",
    pro: "+ Multi-sucursal · Señas",
    business: null,
    starterOk: true,
  },
  {
    id: "clients",
    icon: Users,
    label: "Clientes CRM",
    starter: "Básico",
    pro: "+ Galería · Segmentación",
    business: "+ Detección IA de clientes fugados",
    starterOk: true,
  },
  {
    id: "services",
    icon: Scissors,
    label: "Servicios",
    starter: "Catálogo completo",
    pro: "+ Reglas de consumo · Rentabilidad",
    business: null,
    starterOk: true,
  },
  {
    id: "finances",
    icon: CreditCard,
    label: "Finanzas",
    starter: "Caja · Gastos (30 días)",
    pro: "+ Sueldos · Conciliación · Reportes",
    business: "+ Auditoría contable",
    starterOk: true,
    starterLimited: true,
  },
  {
    id: "automations",
    icon: Zap,
    label: "Automatizaciones",
    starter: "Recordatorios básicos",
    pro: "+ Cumpleaños · Retención · Builder",
    business: "+ Webhooks · Campañas IA",
    starterOk: true,
    starterLimited: true,
  },
  {
    id: "sheets",
    icon: FileSpreadsheet,
    label: "Google Sheets",
    starter: "Solo exportar",
    pro: "+ Importar · Mapeo de columnas",
    business: "+ Sincronización automática",
    starterOk: true,
    starterLimited: true,
  },
  {
    id: "inventory",
    icon: Package,
    label: "Inventario ERP",
    starter: null,
    pro: "Stock · Lotes · Proveedores",
    business: "+ Predicción IA",
    starterOk: false,
  },
  {
    id: "workflows",
    icon: GitBranch,
    label: "Workflows",
    starter: null,
    pro: "Constructor visual completo",
    business: null,
    starterOk: false,
  },
  {
    id: "marketing",
    icon: Camera,
    label: "Marketing IA",
    starter: null,
    pro: null,
    business: "Generador Instagram · Copy IA",
    starterOk: false,
  },
  {
    id: "ai_copilot",
    icon: Sparkles,
    label: "Copilot IA",
    starter: null,
    pro: null,
    business: "Predicciones · Sugerencias · IA",
    starterOk: false,
  },
];

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function PlanBadge({ plan }) {
  const cfg = PLAN_CONFIG[plan];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "0.7rem",
      fontWeight: 700,
      background: cfg.gradient,
      color: "white",
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    }}>
      {cfg.name}
    </span>
  );
}

function ModuleRow({ mod, currentPlan }) {
  const planOrder = { starter: 0, pro: 1, business: 2 };
  const current   = planOrder[currentPlan] || 0;
  const Icon      = mod.icon;

  const getStatus = (planLevel) => {
    if (current >= planLevel) return "active";
    return "locked";
  };

  const starterStatus  = mod.starterOk ? (mod.starterLimited ? "limited" : "active") : "locked";
  const proStatus      = mod.pro ? (current >= 1 ? "active" : "locked") : "na";
  const businessStatus = mod.business ? (current >= 2 ? "active" : "locked") : "na";

  const rowActive = starterStatus !== "locked" || proStatus === "active" || businessStatus === "active";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "200px 1fr 1fr 1fr",
      gap: "0.5rem",
      alignItems: "center",
      padding: "0.6rem 0.75rem",
      borderRadius: "10px",
      background: rowActive ? "transparent" : "#fafafa",
      borderBottom: "1px solid #f3f4f6",
    }}>
      {/* Módulo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Icon size={15} color={rowActive ? "#374151" : "#9ca3af"} />
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: rowActive ? "#111827" : "#9ca3af" }}>
          {mod.label}
        </span>
      </div>

      {/* Starter */}
      <Cell status={starterStatus} text={mod.starter} plan="starter" />

      {/* Pro */}
      <Cell status={proStatus} text={mod.pro} plan="pro" />

      {/* Business */}
      <Cell status={businessStatus} text={mod.business} plan="business" />
    </div>
  );
}

function Cell({ status, text, plan }) {
  const cfg = PLAN_CONFIG[plan];
  if (status === "na" || !text) {
    return <div style={{ fontSize: "0.75rem", color: "#d1d5db", textAlign: "center" }}>—</div>;
  }
  if (status === "locked") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", opacity: 0.4 }}>
        <Lock size={11} color="#9ca3af" />
        <span style={{ fontSize: "0.73rem", color: "#9ca3af" }}>{text}</span>
      </div>
    );
  }
  if (status === "limited") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
        <CheckCircle2 size={12} color="#f59e0b" />
        <span style={{ fontSize: "0.73rem", color: "#92400e" }}>{text}</span>
      </div>
    );
  }
  // active
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
      <CheckCircle2 size={12} color={cfg.color} />
      <span style={{ fontSize: "0.73rem", color: "#374151" }}>{text}</span>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function PlanBadges() {
  const { business } = useAuth();
  const plan    = business?.plan || "starter";
  const cfg     = PLAN_CONFIG[plan];
  const [open,  setOpen]    = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Calcular módulos bloqueados para el plan actual
  const planOrder = { starter: 0, pro: 1, business: 2 };
  const current   = planOrder[plan] || 0;
  const locked    = MODULES.filter(m => !m.starterOk && current < 1).length
                  + MODULES.filter(m => m.business && current < 2 && m.pro === null).length;

  // En Business ya tiene todo
  if (plan === "business" && !open) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #fdf2f8, #fff)",
        border: "1px solid #fbcfe8",
        borderRadius: "14px",
        padding: "0.75rem 1rem",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Sparkles size={16} color="#db2777" />
          <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#374151" }}>
            Tenés acceso a todas las funcionalidades del plan <span style={{ color: "#db2777" }}>Business</span>.
          </span>
        </div>
        <button onClick={() => setOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer",
                         fontSize: "0.75rem", color: "#db2777", fontWeight: 600 }}>
          Ver detalle
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: "white",
      border: `1px solid ${cfg.border}`,
      borderRadius: "16px",
      marginBottom: "1.5rem",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        background: cfg.gradient,
        padding: "0.85rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
            Tu plan actual: <strong>{cfg.name}</strong>
          </span>
          {plan !== "business" && (
            <span style={{ background: "rgba(255,255,255,0.2)", color: "white",
                           fontSize: "0.7rem", padding: "1px 8px", borderRadius: "999px" }}>
              {locked} módulo{locked !== 1 ? "s" : ""} bloqueado{locked !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {plan !== "business" && (
            <a href="/app/settings?tab=subscription"
               style={{ display: "flex", alignItems: "center", gap: "0.3rem",
                        background: "rgba(255,255,255,0.2)", color: "white",
                        padding: "0.3rem 0.75rem", borderRadius: "8px",
                        textDecoration: "none", fontSize: "0.75rem", fontWeight: 600 }}>
              Mejorar plan <ArrowUpRight size={13} />
            </a>
          )}
          <button onClick={() => setOpen(!open)}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none",
                           borderRadius: "8px", cursor: "pointer", color: "white",
                           padding: "0.3rem 0.5rem", display: "flex", alignItems: "center" }}>
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button onClick={() => setDismissed(true)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                           color: "rgba(255,255,255,0.7)", padding: "0.3rem",
                           display: "flex", alignItems: "center" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabla de features */}
      {open && (
        <div style={{ padding: "0.75rem 0.5rem 0.5rem" }}>
          {/* Encabezados */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr 1fr 1fr",
            gap: "0.5rem",
            padding: "0.4rem 0.75rem 0.6rem",
            borderBottom: "2px solid #f3f4f6",
            marginBottom: "0.25rem",
          }}>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>
              Módulo
            </div>
            {["starter", "pro", "business"].map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <PlanBadge plan={p} />
                {p === plan && (
                  <span style={{ fontSize: "0.68rem", color: "#6b7280" }}>← tu plan</span>
                )}
              </div>
            ))}
          </div>

          {/* Filas de módulos */}
          {MODULES.map(mod => (
            <ModuleRow key={mod.id} mod={mod} currentPlan={plan} />
          ))}

          {/* Leyenda */}
          <div style={{ display: "flex", gap: "1.25rem", padding: "0.75rem 0.75rem 0.25rem",
                        borderTop: "1px solid #f3f4f6", marginTop: "0.25rem" }}>
            {[
              { icon: <CheckCircle2 size={11} color="#6366f1" />, label: "Incluido" },
              { icon: <CheckCircle2 size={11} color="#f59e0b" />, label: "Incluido (limitado)" },
              { icon: <Lock size={11} color="#9ca3af" />, label: "Requiere upgrade" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                {item.icon}
                <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen colapsado */}
      {!open && (
        <div style={{ padding: "0.6rem 1.25rem 0.7rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {MODULES.filter(m => {
            const c = planOrder[plan] || 0;
            if (plan === "starter") return m.starterOk;
            if (plan === "pro")     return m.starterOk || m.pro;
            return true;
          }).slice(0, 7).map(mod => {
            const Icon = mod.icon;
            const isLimited = plan === "starter" && mod.starterLimited;
            return (
              <div key={mod.id} style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                background: isLimited ? "#fffbeb" : `${cfg.color}10`,
                border: `1px solid ${isLimited ? "#fde68a" : `${cfg.color}30`}`,
                borderRadius: "999px", padding: "3px 10px",
                fontSize: "0.72rem", color: isLimited ? "#92400e" : "#374151", fontWeight: 500,
              }}>
                <Icon size={11} color={isLimited ? "#f59e0b" : cfg.color} />
                {mod.label}
                {isLimited && <span style={{ fontSize: "0.65rem", color: "#d97706" }}>limitado</span>}
              </div>
            );
          })}
          {plan !== "business" && (
            <button onClick={() => setOpen(true)}
                    style={{ background: "none", border: `1px dashed ${cfg.color}50`,
                             borderRadius: "999px", padding: "3px 10px",
                             fontSize: "0.72rem", color: cfg.color, cursor: "pointer",
                             fontWeight: 500 }}>
              + ver todo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
