# Prompt de Implementación: MercadoPago Cuenta Personal + Gating de Módulos por Plan

Usá este prompt completo en una nueva sesión de Claude para implementar todo de una vez.

---

## CONTEXTO DEL PROYECTO

Estoy desarrollando **AuraDash**, un SaaS multi-tenant para salones y negocios de estética. El stack es:

- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL (Neon) + Firebase Auth
- **Frontend**: React + Vite + Bootstrap
- **Pagos**: MercadoPago

El proyecto ya tiene una estructura de facturación construida. Necesito dos cosas:

1. **Adaptar el proveedor de MercadoPago para funcionar con cuenta personal** (no cuenta Business/empresa), usando Payment Preferences en lugar de Preapproval/suscripciones recurrentes.
2. **Implementar gating de módulos por plan** en frontend y backend, para que cada plan (starter/pro/business) desbloquee módulos específicos.

---

## PARTE 1: CAMBIO EN EL PROVIDER DE MERCADOPAGO

### Problema actual
El archivo `backend/src/services/billing/mercadopago.provider.js` usa el endpoint `/preapproval` de MercadoPago (suscripciones recurrentes automáticas). Ese endpoint **requiere cuenta Business con CUIT**. Con cuenta personal solo se puede usar `/checkout/preferences` (pago único).

### Solución
Reescribir `MercadoPagoProvider` para usar **Payment Preferences** (`/checkout/preferences`). Cada pago es único por período; la renovación se gestiona enviando un nuevo link de pago cuando vence.

### Cambios en `backend/src/services/billing/mercadopago.provider.js`

Reemplazar el método `createSubscription` por este nuevo método `createPaymentPreference`:

```javascript
async createPaymentPreference(business, plan, interval, email) {
  const isMock = !process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith("mock_");
  
  if (isMock) {
    const providerSubId = `mock_sub_${Math.random().toString(36).substr(2, 9)}`;
    const price = interval === "month" ? plan.priceMonth : plan.priceYear;
    const checkoutUrl = `/app/settings?tab=subscription&mock_checkout=true&providerSubId=${providerSubId}&planCode=${plan.code}&interval=${interval}&price=${price}`;
    return { providerSubId, checkoutUrl };
  }

  const price = interval === "month" ? plan.priceMonth : plan.priceYear;
  const priceARS = price; // precio ya en ARS
  const title = `${plan.name} - ${interval === "month" ? "Mensual" : "Anual"} | AuraDash`;
  const externalReference = `${business.id}__${plan.code}__${interval}__${Date.now()}`;

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [
        {
          title,
          quantity: 1,
          currency_id: "ARS",
          unit_price: priceARS
        }
      ],
      payer: { email },
      external_reference: externalReference,
      back_urls: {
        success: `${process.env.APP_BASE_URL}/app/settings?tab=subscription&payment=success`,
        failure: `${process.env.APP_BASE_URL}/app/settings?tab=subscription&payment=failure`,
        pending: `${process.env.APP_BASE_URL}/app/settings?tab=subscription&payment=pending`
      },
      auto_return: "approved",
      notification_url: `${process.env.APP_BASE_URL}/api/billing/webhook`,
      statement_descriptor: "AURADASH",
      expires: false
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MercadoPago preference creation failed: ${errText}`);
  }

  const data = await response.json();
  // Usamos external_reference como providerSubId para correlacionar con el webhook
  return {
    providerSubId: externalReference,
    checkoutUrl: data.init_point // usar sandbox_init_point para pruebas
  };
}
```

Actualizar también `parseEvent` para manejar pagos únicos (el webhook de MP para preferences llega como tipo `payment`):

```javascript
async parseEvent(payload, headers) {
  const eventId = payload.id ? String(payload.id) : `event_${Date.now()}`;
  const type = payload.type || "";
  const dataId = payload.data?.id || "";

  const isMock = !process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith("mock_") || String(dataId).startsWith("mock_");

  if (isMock) {
    if (type === "payment") {
      return {
        eventId,
        type: "payment",
        providerSubId: payload.mock_subscription_id || "mock_sub_xyz",
        externalReference: payload.mock_subscription_id || "mock_sub_xyz",
        status: payload.mock_status || "approved",
        amount: payload.mock_amount || 1900,
        providerPayId: dataId || "mock_pay_123",
        raw: payload
      };
    }
    return { eventId, type: "unknown", providerSubId: "", status: "unknown", amount: 0, raw: payload };
  }

  if (type === "payment") {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN.trim()}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch payment: ${await res.text()}`);
    const payment = await res.json();

    return {
      eventId,
      type: "payment",
      providerSubId: payment.external_reference || "",   // este es nuestro businessId__plan__interval__timestamp
      externalReference: payment.external_reference || "",
      status: payment.status,  // approved | rejected | pending | in_process
      amount: Math.round((payment.transaction_amount || 0)),
      providerPayId: String(payment.id),
      raw: payment
    };
  }

  return { eventId, type: "unknown", providerSubId: "", status: "unknown", amount: 0, raw: payload };
}
```

### Cambios en `backend/src/controllers/billing.controller.js`

En la función `checkout`, reemplazar la llamada a `paymentProvider.createSubscription(...)` por `paymentProvider.createPaymentPreference(...)`.

En la función `webhook`, actualizar la lógica para que cuando llega un `payment` con `status === "approved"`, extraiga el `businessId` y `planCode` del `externalReference` (formato: `businessId__planCode__interval__timestamp`) y active la suscripción:

```javascript
// Dentro del handler del webhook, reemplazar la búsqueda por providerSubId:
if (event.type === "payment" && event.status === "approved") {
  const parts = (event.externalReference || "").split("__");
  const businessId = parts[0];
  const planCode = parts[1];
  const interval = parts[2];

  if (!businessId || !planCode) {
    return res.status(200).json({ success: true, message: "External reference inválida" });
  }

  const now = new Date();
  const periodMs = interval === "year" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const currentPeriodEnd = new Date(now.getTime() + periodMs);

  await prisma.$transaction(async (tx) => {
    await tx.webhookEvent.create({
      data: { eventId: event.eventId, provider: "mercadopago", type: "payment", payload: event.raw || {} }
    });

    await tx.business.update({
      where: { id: businessId },
      data: {
        plan: planCode,
        subscriptionStatus: "active",
        currentPeriodEnd,
        gracePeriodEndsAt: null
      }
    });

    // Registrar pago
    let sub = await tx.subscription.findUnique({ where: { businessId } });
    if (!sub) {
      sub = await tx.subscription.create({
        data: {
          businessId,
          planCode,
          interval: interval || "month",
          providerSubId: event.externalReference,
          status: "active",
          currentPeriodEnd
        }
      });
    } else {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: "active", currentPeriodEnd, planCode, interval: interval || "month" }
      });
    }

    await tx.payment.create({
      data: {
        subscriptionId: sub.id,
        providerPayId: event.providerPayId || event.eventId,
        amount: event.amount,
        currency: "ARS",
        status: "succeeded",
        paidAt: now
      }
    });
  });

  return res.status(200).json({ success: true, message: "Pago registrado y suscripción activada." });
}
```

---

## PARTE 2: GATING DE MÓDULOS POR PLAN

### Mapa de módulos por plan

Crear el archivo `dashboard-react/src/lib/planFeatures.js`:

```javascript
// Módulos disponibles por plan
export const PLAN_MODULES = {
  starter: [
    "dashboard",
    "agenda",
    "clients",
    "services",
    "team",
    "settings"
  ],
  pro: [
    "dashboard",
    "agenda",
    "clients",
    "services",
    "team",
    "finances",
    "inventory",
    "workflows",
    "settings"
  ],
  business: [
    "dashboard",
    "agenda",
    "clients",
    "services",
    "team",
    "finances",
    "inventory",
    "workflows",
    "automations",
    "marketing",
    "sheets_sync",
    "ai_copilot",
    "settings"
  ]
};

export function hasModuleAccess(plan, moduleId) {
  const allowed = PLAN_MODULES[plan] || PLAN_MODULES["starter"];
  return allowed.includes(moduleId);
}

export const MODULE_LABELS = {
  dashboard: "Panel de Control",
  agenda: "Agenda",
  clients: "Clientes CRM",
  services: "Servicios",
  team: "Equipo",
  finances: "Finanzas",
  inventory: "Inventario ERP",
  workflows: "Workflows",
  automations: "Automatizaciones",
  marketing: "Marketing IA",
  sheets_sync: "Google Sheets Sync",
  ai_copilot: "Copilot IA",
  settings: "Configuración"
};

export const MODULE_PLAN_REQUIRED = {
  finances: "pro",
  inventory: "pro",
  workflows: "pro",
  automations: "business",
  marketing: "business",
  sheets_sync: "business",
  ai_copilot: "business"
};
```

### Hook `usePlanAccess`

Crear el archivo `dashboard-react/src/hooks/usePlanAccess.js`:

```javascript
import { useAuth } from "../auth/AuthProvider.jsx";
import { hasModuleAccess } from "../lib/planFeatures.js";

export function usePlanAccess(moduleId) {
  const { business } = useAuth();
  const plan = business?.plan || "starter";
  return hasModuleAccess(plan, moduleId);
}

export function usePlan() {
  const { business } = useAuth();
  return business?.plan || "starter";
}
```

### Componente `FeatureGate`

Crear el archivo `dashboard-react/src/components/common/FeatureGate.jsx`:

```jsx
import React from "react";
import { Lock } from "lucide-react";
import { usePlan } from "../../hooks/usePlanAccess.js";
import { hasModuleAccess, MODULE_PLAN_REQUIRED } from "../../lib/planFeatures.js";

const PLAN_NAMES = { starter: "Starter", pro: "Pro", business: "Business" };
const PLAN_COLORS = { starter: "#6366f1", pro: "#7c3aed", business: "#ec4899" };

export default function FeatureGate({ moduleId, children }) {
  const plan = usePlan();
  const hasAccess = hasModuleAccess(plan, moduleId);

  if (hasAccess) return children;

  const requiredPlan = MODULE_PLAN_REQUIRED[moduleId] || "pro";
  const color = PLAN_COLORS[requiredPlan];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      textAlign: "center",
      padding: "2rem"
    }}>
      <div style={{
        background: `${color}15`,
        border: `2px solid ${color}40`,
        borderRadius: "16px",
        padding: "3rem 2rem",
        maxWidth: "420px"
      }}>
        <Lock size={48} color={color} style={{ marginBottom: "1rem" }} />
        <h4 style={{ color, marginBottom: "0.5rem" }}>
          Módulo bloqueado
        </h4>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Este módulo está disponible desde el plan{" "}
          <strong style={{ color }}>{PLAN_NAMES[requiredPlan]}</strong>.
          Tu plan actual es <strong>{PLAN_NAMES[plan]}</strong>.
        </p>
        <a
          href="/app/settings?tab=subscription"
          style={{
            background: color,
            color: "white",
            padding: "0.6rem 1.5rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            display: "inline-block"
          }}
        >
          Ver planes y upgrades →
        </a>
      </div>
    </div>
  );
}
```

### Aplicar `FeatureGate` en el Router principal

En el archivo de rutas del frontend (probablemente `App.jsx` o `DashboardLayout.jsx`), envolver las rutas de módulos premium con `FeatureGate`. Por ejemplo:

```jsx
import FeatureGate from "./components/common/FeatureGate.jsx";

// Rutas protegidas por plan:
<Route path="finances" element={
  <FeatureGate moduleId="finances">
    <FinancesView />
  </FeatureGate>
} />

<Route path="inventory" element={
  <FeatureGate moduleId="inventory">
    <InventoryView />
  </FeatureGate>
} />

<Route path="workflows" element={
  <FeatureGate moduleId="workflows">
    <WorkflowsView />
  </FeatureGate>
} />

<Route path="automations" element={
  <FeatureGate moduleId="automations">
    <AutomationsView />
  </FeatureGate>
} />

<Route path="marketing" element={
  <FeatureGate moduleId="marketing">
    <MarketingView />
  </FeatureGate>
} />
```

### Aplicar bloqueo visual en la Sidebar

En `dashboard-react/src/components/layout/Sidebar.jsx`, importar `usePlan` y `hasModuleAccess` para mostrar un candado en los ítems bloqueados:

```jsx
import { usePlan } from "../../hooks/usePlanAccess.js";
import { hasModuleAccess } from "../../lib/planFeatures.js";
import { Lock } from "lucide-react";

// Dentro del componente:
const plan = usePlan();

// En cada ítem del menú que tenga moduleId:
const isLocked = !hasModuleAccess(plan, item.moduleId);

// Agregar al render del ítem:
{isLocked && <Lock size={12} style={{ opacity: 0.5, marginLeft: "auto" }} />}
// Y aplicar estilo semitransparente al ítem bloqueado
```

---

## PARTE 3: MIDDLEWARE BACKEND POR FEATURE (opcional pero recomendado)

Crear `backend/src/middleware/planFeature.middleware.js`:

```javascript
const PLAN_MODULES = {
  starter: ["dashboard", "agenda", "clients", "services", "team", "settings"],
  pro: ["dashboard", "agenda", "clients", "services", "team", "finances", "inventory", "workflows", "settings"],
  business: ["dashboard", "agenda", "clients", "services", "team", "finances", "inventory", "workflows", "automations", "marketing", "sheets_sync", "ai_copilot", "settings"]
};

export function requirePlanFeature(moduleId) {
  return (req, res, next) => {
    const plan = req.business?.plan || "starter";
    const allowed = PLAN_MODULES[plan] || PLAN_MODULES["starter"];
    if (!allowed.includes(moduleId)) {
      return res.status(403).json({
        error: "plan_upgrade_required",
        module: moduleId,
        currentPlan: plan,
        message: `Este módulo no está disponible en el plan ${plan}.`
      });
    }
    next();
  };
}
```

Agregar `req.business` en `tenant.middleware.js`:
```javascript
// Después de req.businessId = membership.businessId;
req.business = membership.business;
```

Usar el middleware en rutas sensibles, por ejemplo en `finances.routes.js`:
```javascript
import { requirePlanFeature } from "../middleware/planFeature.middleware.js";

router.get("/", requireAuth, checkTenant, requirePlanFeature("finances"), getFinances);
```

---

## VARIABLES DE ENTORNO NECESARIAS

En `backend/.env` agregar o actualizar:
```env
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxx-xxxxxxxx
APP_BASE_URL=https://tu-dominio.com
BILLING_ENFORCED=true
```

Para obtener el `MP_ACCESS_TOKEN` personal:
1. Ir a mercadopago.com.ar → iniciar sesión con tu cuenta personal
2. Ir a Tu negocio → Configuración → Credenciales
3. Copiar el **Access Token** de producción (empieza con `APP_USR-`)

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. Crear `planFeatures.js` y `usePlanAccess.js`
2. Crear `FeatureGate.jsx`
3. Aplicar `FeatureGate` en el router de React
4. Aplicar candado visual en la Sidebar
5. Reescribir `mercadopago.provider.js` con Payment Preferences
6. Actualizar el `webhook` handler en `billing.controller.js`
7. Crear middleware `planFeature.middleware.js` y aplicarlo en las rutas del backend
8. Configurar variables de entorno con el token de MP personal
9. Configurar el webhook en el panel de MercadoPago apuntando a `https://tu-dominio.com/api/billing/webhook`
10. Probar con modo sandbox antes de activar producción

---

## NOTAS IMPORTANTES

- Los pagos con cuenta personal de MP **no son recurrentes automáticos**. El cron job existente (`billing.job.js`) ya maneja el vencimiento: pasa el negocio a `past_due` cuando llega `currentPeriodEnd`. Para renovar, enviar un nuevo link de pago por email/WhatsApp.
- En **modo sandbox**: usar `sandbox_init_point` en lugar de `init_point` para las pruebas.
- El `external_reference` en el formato `businessId__planCode__interval__timestamp` es lo que permite correlacionar el webhook de pago con el negocio correcto sin necesidad de suscripciones persistentes en MP.
- Activar `BILLING_ENFORCED=true` en producción para que el middleware de tenant bloquee accesos sin suscripción activa.
