# Prompt de Implementación: Gating de Features por Plan — AuraDash

Implementá el sistema completo de gating de features por plan en el proyecto AuraDash.
El stack es React + Vite + Bootstrap en el frontend, Node.js + Express + Prisma en el backend.

---

## CONTEXTO

El modelo de negocio tiene 3 planes: `starter`, `pro`, `business`.
El campo `plan` ya existe en `business.plan` (viene de `useAuth()` → `business.plan`).
El campo `subscriptionStatus` también existe (`trialing | active | past_due | suspended`).

El objetivo es implementar gating granular:
- Módulos completos bloqueados (Inventario, Marketing, Copilot IA)
- Sub-features bloqueadas dentro de un módulo (pestañas de Finanzas, triggers de Automatizaciones, Import en Sheets)

---

## PASO 1 — Crear `planFeatures.js` (fuente de verdad única)

Crear el archivo `dashboard-react/src/lib/planFeatures.js` con este contenido exacto:

```js
// ─── MÓDULOS COMPLETOS ─────────────────────────────────────────────────────
// Módulos que se bloquean completos si el plan no los incluye
export const MODULE_ACCESS = {
  starter:  ["dashboard","agenda","clients","services","team","finances","automations","sheets","settings"],
  pro:      ["dashboard","agenda","clients","services","team","finances","automations","sheets","inventory","workflows","settings"],
  business: ["dashboard","agenda","clients","services","team","finances","automations","sheets","inventory","workflows","marketing","ai_copilot","settings"]
};

// ─── SUB-FEATURES ──────────────────────────────────────────────────────────
// Features individuales dentro de módulos. Clave: string único. Valor: plan mínimo requerido.
export const FEATURE_PLAN = {

  // Dashboard
  "dashboard.stock_kpi":            "pro",
  "dashboard.extended_history":     "pro",
  "dashboard.ai_suggestions":       "business",

  // Agenda
  "agenda.downpayment":             "pro",
  "agenda.multi_branch_calendar":   "pro",

  // Clientes
  "clients.gallery":                "pro",
  "clients.consent":                "pro",
  "clients.advanced_filters":       "pro",
  "clients.ai_churn":               "business",

  // Servicios
  "services.consumption_rules":     "pro",
  "services.profitability":         "pro",

  // Equipo
  "team.commissions":               "pro",
  "team.salary_payment":            "pro",
  "team.profitability":             "pro",
  "team.rbac":                      "pro",

  // Finanzas (pestañas dentro del módulo)
  "finances.export":                "pro",
  "finances.salaries":              "pro",
  "finances.service_profitability": "pro",
  "finances.pro_profitability":     "pro",
  "finances.bank_reconciliation":   "pro",
  "finances.simulator":             "pro",
  "finances.reports":               "pro",
  "finances.audit":                 "business",
  "finances.history_extended":      "pro",   // Starter solo ve 30 días

  // Automatizaciones (triggers)
  "automations.trigger_birthday":   "pro",
  "automations.trigger_inactive":   "pro",
  "automations.trigger_payment":    "pro",
  "automations.trigger_low_stock":  "pro",
  "automations.execution_logs":     "pro",
  "automations.notify_worker":      "pro",
  "automations.workflow_builder":   "pro",
  "automations.webhook_trigger":    "business",
  "automations.ai_campaigns":       "business",

  // Google Sheets
  "sheets.export_inventory":        "pro",
  "sheets.import":                  "pro",
  "sheets.column_mapping":          "pro",
  "sheets.import_history":          "pro",
  "sheets.import_from_url":         "pro",
  "sheets.auto_sync":               "business",

  // Inventario (módulo completo en pro, sub-features)
  "inventory.ai_prediction":        "business",

  // Configuración
  "settings.multi_branch":          "pro",
  "settings.unlimited_branches":    "business",
  "settings.unlimited_users":       "business",
  "settings.rbac":                  "pro",
  "settings.google_calendar":       "pro",
  "settings.mercadopago":           "pro",
};

const PLAN_ORDER = { starter: 0, pro: 1, business: 2 };

// ─── HELPERS ───────────────────────────────────────────────────────────────

/** ¿El plan actual puede acceder al módulo completo? */
export function hasModule(plan, moduleId) {
  return (MODULE_ACCESS[plan] || MODULE_ACCESS.starter).includes(moduleId);
}

/** ¿El plan actual puede usar esta sub-feature? */
export function hasFeature(plan, featureKey) {
  const required = FEATURE_PLAN[featureKey];
  if (!required) return true; // si no está definida, libre para todos
  return (PLAN_ORDER[plan] || 0) >= (PLAN_ORDER[required] || 0);
}

/** Nombre legible del plan mínimo requerido para una feature */
export function requiredPlanName(featureKey) {
  const required = FEATURE_PLAN[featureKey];
  return required ? { starter: "Starter", pro: "Pro", business: "Business" }[required] : null;
}
```

---

## PASO 2 — Crear hooks `usePlan` y `useFeature`

Crear `dashboard-react/src/hooks/usePlanAccess.js`:

```js
import { useAuth } from "../auth/AuthProvider.jsx";
import { hasModule, hasFeature } from "../lib/planFeatures.js";

/** Devuelve el plan actual del negocio */
export function usePlan() {
  const { business } = useAuth();
  return business?.plan || "starter";
}

/** ¿El plan actual tiene acceso al módulo completo? */
export function useModuleAccess(moduleId) {
  const plan = usePlan();
  return hasModule(plan, moduleId);
}

/** ¿El plan actual tiene acceso a esta sub-feature? */
export function useFeatureAccess(featureKey) {
  const plan = usePlan();
  return hasFeature(plan, featureKey);
}
```

---

## PASO 3 — Crear componente `<ModuleGate>` (bloqueo de módulo completo)

Crear `dashboard-react/src/components/common/ModuleGate.jsx`:

```jsx
import React from "react";
import { Lock, ArrowUpRight } from "lucide-react";
import { useModuleAccess, usePlan } from "../../hooks/usePlanAccess.js";

const PLAN_COLORS = { starter: "#6366f1", pro: "#7c3aed", business: "#ec4899" };
const PLAN_NAMES  = { starter: "Starter", pro: "Pro", business: "Business" };

const MODULE_REQUIRED = {
  inventory: "pro", workflows: "pro",
  marketing: "business", ai_copilot: "business"
};

export default function ModuleGate({ moduleId, children }) {
  const plan    = usePlan();
  const allowed = useModuleAccess(moduleId);
  if (allowed) return children;

  const required = MODULE_REQUIRED[moduleId] || "pro";
  const color    = PLAN_COLORS[required];

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", minHeight:"65vh", padding:"2rem", textAlign:"center" }}>
      <div style={{ background:`${color}12`, border:`2px solid ${color}30`,
                    borderRadius:"20px", padding:"3rem 2.5rem", maxWidth:"440px" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:`${color}20`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      margin:"0 auto 1.5rem" }}>
          <Lock size={28} color={color} />
        </div>
        <h4 style={{ color, fontWeight:700, marginBottom:"0.5rem" }}>Módulo bloqueado</h4>
        <p style={{ color:"#6b7280", marginBottom:"1.5rem", lineHeight:1.6 }}>
          Este módulo está disponible desde el plan{" "}
          <strong style={{ color }}>{PLAN_NAMES[required]}</strong>.
          Tu plan actual es <strong>{PLAN_NAMES[plan]}</strong>.
        </p>
        <a href="/app/settings?tab=subscription"
           style={{ background:color, color:"white", padding:"0.65rem 1.6rem",
                    borderRadius:"10px", textDecoration:"none", fontWeight:600,
                    display:"inline-flex", alignItems:"center", gap:"0.4rem" }}>
          Ver planes <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}
```

---

## PASO 4 — Crear componente `<FeatureGate>` (bloqueo de sub-feature)

Crear `dashboard-react/src/components/common/FeatureGate.jsx`:

```jsx
import React from "react";
import { Lock } from "lucide-react";
import { useFeatureAccess } from "../../hooks/usePlanAccess.js";
import { requiredPlanName } from "../../lib/planFeatures.js";

const PLAN_COLORS = { Starter:"#6366f1", Pro:"#7c3aed", Business:"#ec4899" };

/**
 * Uso:
 *   <FeatureGate featureKey="finances.salaries">
 *     <SalaryManagement />
 *   </FeatureGate>
 *
 *   O como tab bloqueada:
 *   <FeatureGate featureKey="finances.salaries" inline label="Sueldos">
 *     <SalaryManagement />
 *   </FeatureGate>
 */
export default function FeatureGate({ featureKey, children, inline = false, label = "" }) {
  const allowed  = useFeatureAccess(featureKey);
  if (allowed) return children;

  const planName = requiredPlanName(featureKey) || "Pro";
  const color    = PLAN_COLORS[planName] || "#7c3aed";

  // Versión inline: banner compacto dentro de una pestaña
  if (inline) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", minHeight:"40vh", padding:"2rem", textAlign:"center" }}>
        <div style={{ background:`${color}10`, border:`1.5px solid ${color}25`,
                      borderRadius:"14px", padding:"2rem 1.5rem", maxWidth:"380px" }}>
          <Lock size={24} color={color} style={{ marginBottom:"0.75rem" }} />
          <p style={{ margin:0, color:"#374151", fontWeight:600 }}>
            {label && <span>{label} · </span>}
            Disponible en plan <span style={{ color }}>{planName}</span>
          </p>
          <a href="/app/settings?tab=subscription"
             style={{ display:"inline-block", marginTop:"1rem", fontSize:"0.85rem",
                      color, fontWeight:600, textDecoration:"none" }}>
            Actualizar plan →
          </a>
        </div>
      </div>
    );
  }

  // Versión full: pantalla completa
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", minHeight:"60vh", padding:"2rem", textAlign:"center" }}>
      <div style={{ background:`${color}12`, border:`2px solid ${color}30`,
                    borderRadius:"20px", padding:"3rem 2.5rem", maxWidth:"420px" }}>
        <Lock size={36} color={color} style={{ marginBottom:"1rem" }} />
        <h5 style={{ color, fontWeight:700 }}>Feature bloqueada</h5>
        <p style={{ color:"#6b7280", marginBottom:"1.5rem" }}>
          Disponible desde el plan <strong style={{ color }}>{planName}</strong>.
        </p>
        <a href="/app/settings?tab=subscription"
           style={{ background:color, color:"white", padding:"0.6rem 1.4rem",
                    borderRadius:"8px", textDecoration:"none", fontWeight:600 }}>
          Ver planes →
        </a>
      </div>
    </div>
  );
}
```

---

## PASO 5 — Aplicar `<ModuleGate>` en las rutas del router

En `App.jsx` o el archivo de rutas principal, envolver las vistas de módulos premium:

```jsx
import ModuleGate from "./components/common/ModuleGate.jsx";

// Dentro del router:
<Route path="inventory" element={
  <ModuleGate moduleId="inventory"><InventoryView /></ModuleGate>
} />

<Route path="workflows" element={
  <ModuleGate moduleId="workflows"><WorkflowsView /></ModuleGate>
} />

<Route path="marketing" element={
  <ModuleGate moduleId="marketing"><MarketingView /></ModuleGate>
} />

<Route path="ai-copilot" element={
  <ModuleGate moduleId="ai_copilot"><AICopilotView /></ModuleGate>
} />
```

---

## PASO 6 — Aplicar `<FeatureGate>` en Finanzas (`FinancesView.jsx`)

En `FinancesView.jsx`, envolver cada tab con su FeatureGate. Buscar el bloque de tabs activas y reemplazar:

```jsx
import FeatureGate from "../components/common/FeatureGate.jsx";

// Pestañas bloqueadas en Starter:
{activeTab === "sueldos" && (
  <FeatureGate featureKey="finances.salaries" inline label="Sueldos y Liquidaciones">
    <SalaryManagement professionalStats={dashboardData.professionalProfitability} />
  </FeatureGate>
)}

{activeTab === "conciliacion" && (
  <FeatureGate featureKey="finances.bank_reconciliation" inline label="Conciliación Bancaria">
    <BankReconciliation />
  </FeatureGate>
)}

{activeTab === "servicios" && (
  <FeatureGate featureKey="finances.service_profitability" inline label="Rentabilidad por Servicio">
    <ServiceProfitability serviceStats={dashboardData.serviceProfitability} />
  </FeatureGate>
)}

{activeTab === "profesionales" && (
  <FeatureGate featureKey="finances.pro_profitability" inline label="Rentabilidad por Profesional">
    <ProfessionalProfitability professionalStats={dashboardData.professionalProfitability} />
  </FeatureGate>
)}

{activeTab === "simulador" && (
  <FeatureGate featureKey="finances.simulator" inline label="Simulador Financiero">
    <FinancialSimulator />
  </FeatureGate>
)}

{activeTab === "reportes" && (
  <FeatureGate featureKey="finances.reports" inline label="Reportes">
    <FinancialReports />
  </FeatureGate>
)}

{activeTab === "auditoria" && (
  <FeatureGate featureKey="finances.audit" inline label="Auditoría Contable">
    <FinancialAudit />
  </FeatureGate>
)}
```

También agregar `🔒` visual en los botones/tabs bloqueadas. Importar `useFeatureAccess`:

```jsx
import { useFeatureAccess } from "../hooks/usePlanAccess.js";

// Dentro del componente:
const canSalaries = useFeatureAccess("finances.salaries");
const canReports  = useFeatureAccess("finances.reports");
const canAudit    = useFeatureAccess("finances.audit");

// En el render del botón de tab:
<Button variant={activeTab === "sueldos" ? "primary" : "outline-secondary"}
        onClick={() => setActiveTab("sueldos")}>
  {!canSalaries && "🔒 "} Sueldos
</Button>
```

---

## PASO 7 — Aplicar `<FeatureGate>` en Automatizaciones (`AutomationsView.jsx`)

```jsx
import FeatureGate from "../components/common/FeatureGate.jsx";

// Envolver triggers premium en el constructor de workflows:
// Trigger: Cumpleaños
<FeatureGate featureKey="automations.trigger_birthday" inline label="Trigger: Cumpleaños">
  <TriggerBirthdayOption />
</FeatureGate>

// Trigger: Cliente Inactivo
<FeatureGate featureKey="automations.trigger_inactive" inline label="Trigger: Cliente Inactivo">
  <TriggerInactiveOption />
</FeatureGate>

// Historial de ejecuciones
<FeatureGate featureKey="automations.execution_logs" inline label="Historial de Ejecuciones">
  <ExecutionLogs />
</FeatureGate>

// Constructor visual completo
<FeatureGate featureKey="automations.workflow_builder" inline label="Constructor de Workflows">
  <WorkflowBuilder />
</FeatureGate>
```

---

## PASO 8 — Aplicar `<FeatureGate>` en Google Sheets (`GoogleSheetsSyncView.jsx`)

En `GoogleSheetsSyncView.jsx`, la variable `activeDirection` controla si es `"import"` o `"export"`.
Bloquear la dirección de importación en Starter:

```jsx
import FeatureGate from "../components/common/FeatureGate.jsx";
import { useFeatureAccess } from "../hooks/usePlanAccess.js";

const canImport = useFeatureAccess("sheets.import");

// En la sección de selección import/export:
<div>
  <Button onClick={() => setActiveDirection("export")}>📤 Exportar</Button>
  
  {canImport ? (
    <Button onClick={() => setActiveDirection("import")}>📥 Importar</Button>
  ) : (
    <Button disabled style={{ opacity: 0.5 }} title="Disponible desde plan Pro">
      🔒 Importar (Pro)
    </Button>
  )}
</div>

// Y envolver el bloque de importación completo:
{activeDirection === "import" && (
  <FeatureGate featureKey="sheets.import" inline label="Importar desde Google Sheets">
    {/* contenido actual del import */}
  </FeatureGate>
)}
```

---

## PASO 9 — Agregar candado en Sidebar (`Sidebar.jsx`)

En `dashboard-react/src/components/layout/Sidebar.jsx`:

```jsx
import { useModuleAccess } from "../../hooks/usePlanAccess.js";
import { Lock } from "lucide-react";

// Para cada item del menú que tenga un moduleId, agregar:
const isLocked = !useModuleAccess(item.moduleId);

// En el JSX del item:
<NavLink to={item.path} className={...}>
  <item.icon size={18} />
  <span>{item.label}</span>
  {isLocked && (
    <Lock size={11} style={{ marginLeft:"auto", opacity:0.45, flexShrink:0 }} />
  )}
</NavLink>
```

Los `moduleId` a mapear en el array de items del sidebar:
```js
{ path:"/app/inventory",   moduleId:"inventory"  }
{ path:"/app/workflows",   moduleId:"workflows"  }
{ path:"/app/marketing",   moduleId:"marketing"  }
{ path:"/app/ai-copilot",  moduleId:"ai_copilot" }
```

---

## PASO 10 — Middleware backend por feature (`planFeature.middleware.js`)

Crear `backend/src/middleware/planFeature.middleware.js`:

```js
const MODULE_ACCESS = {
  starter:  ["dashboard","agenda","clients","services","team","finances","automations","sheets","settings"],
  pro:      ["dashboard","agenda","clients","services","team","finances","automations","sheets","inventory","workflows","settings"],
  business: ["dashboard","agenda","clients","services","team","finances","automations","sheets","inventory","workflows","marketing","ai_copilot","settings"]
};

const PLAN_ORDER = { starter: 0, pro: 1, business: 2 };

const FEATURE_PLAN = {
  "finances.salaries":     "pro",
  "finances.reports":      "pro",
  "finances.audit":        "business",
  "sheets.import":         "pro",
  "sheets.auto_sync":      "business",
  "automations.builder":   "pro",
  "automations.webhook":   "business",
  "inventory.access":      "pro",
  "marketing.access":      "business",
  "ai_copilot.access":     "business",
};

export function requireModule(moduleId) {
  return (req, res, next) => {
    const plan = req.business?.plan || "starter";
    if (!(MODULE_ACCESS[plan] || []).includes(moduleId)) {
      return res.status(403).json({
        error: "plan_upgrade_required",
        module: moduleId,
        currentPlan: plan,
        message: `El módulo '${moduleId}' no está disponible en el plan ${plan}.`
      });
    }
    next();
  };
}

export function requireFeature(featureKey) {
  return (req, res, next) => {
    const plan     = req.business?.plan || "starter";
    const required = FEATURE_PLAN[featureKey];
    if (required && (PLAN_ORDER[plan] || 0) < (PLAN_ORDER[required] || 0)) {
      return res.status(403).json({
        error: "plan_upgrade_required",
        feature: featureKey,
        currentPlan: plan,
        requiredPlan: required,
        message: `La feature '${featureKey}' requiere plan ${required}.`
      });
    }
    next();
  };
}
```

También agregar `req.business` en `tenant.middleware.js` (si no existe):
```js
// Luego de: req.businessId = membership.businessId;
req.business = membership.business;
```

Aplicar en rutas del backend:
```js
import { requireModule, requireFeature } from "../middleware/planFeature.middleware.js";

// inventory.routes.js
router.get("/", requireAuth, checkTenant, requireModule("inventory"), listProducts);

// finances.routes.js  
router.get("/salaries", requireAuth, checkTenant, requireFeature("finances.salaries"), listSalaryPayments);
router.get("/reports",  requireAuth, checkTenant, requireFeature("finances.reports"),  getReports);
router.get("/audit",    requireAuth, checkTenant, requireFeature("finances.audit"),    listAuditLogs);

// google.routes.js (importación)
router.post("/import",  requireAuth, checkTenant, requireFeature("sheets.import"),    importFromSheets);
```

---

## NOTAS FINALES

- Todos los cambios de plan son **en tiempo real** — el plan viene del context de React que ya fetchea el negocio al iniciar sesión.
- Si el usuario hace upgrade y recarga, los módulos se desbloquean automáticamente.
- El modo **mock/dev** (`AUTH_DISABLED=true`) bypasea todo el gating, igual que el billing.
- No eliminar el código de las features — solo envolverlo en `FeatureGate` o `ModuleGate`. Así cuando el usuario hace upgrade, el código ya está listo.
