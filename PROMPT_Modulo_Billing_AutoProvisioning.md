# Prompt: Implementar módulo de Billing + Auto-provisioning (AuraDash / DashboardOS)

> Pega este prompt a tu agente de código (Claude Code / Cursor). Está escrito para el stack actual:
> **Backend** Node + Express + Prisma (PostgreSQL), Firebase Auth, jobs cron, mailer.
> **Frontend** React + Vite (`dashboard-react`). Multi-tenant por modelo `Business` con `tenant.middleware.js` y RBAC.

---

## Contexto del sistema

El sistema es un SaaS multi-tenant para negocios de servicios (salones, clínicas, dental). Cada cliente = un registro `Business`. Hoy NO existe cobro de suscripción: el único pago es el "downpayment" de reservas del cliente final y está en `mock_mercadopago`. Quiero monetizar el SaaS: cobrar a cada `Business` una suscripción mensual/anual y **habilitar o bloquear el acceso automáticamente según el estado de pago**.

No reescribas lo existente. Crea un **módulo de billing nuevo** y engánchalo al middleware de tenant.

## Objetivo

1. Cobrar suscripciones recurrentes por planes (Starter / Pro / Business).
2. Tras un pago aprobado, **habilitar** el `Business` automáticamente (sin intervención manual).
3. Si el pago falla o se cancela, pasar a `past_due` y luego **suspender** el acceso.
4. Trial de 14 días al registrarse.

## Decisiones de implementación

- **Pasarela:** usa MercadoPago (suscripciones / `preapproval`) como principal porque el mercado es LATAM. Deja el código desacoplado detrás de una interfaz `PaymentProvider` para poder añadir Stripe después. Si prefieres Stripe, impleméntalo igual detrás de la misma interfaz.
- Todas las claves por variables de entorno (`.env`): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `BILLING_SUCCESS_URL`, `BILLING_CANCEL_URL`, `APP_BASE_URL`.
- Idempotencia obligatoria en el webhook (guarda `eventId` procesados).

## 1. Cambios en Prisma (`backend/prisma/schema.prisma`)

Agrega al modelo `Business`:

```prisma
plan                String   @default("starter")      // starter | pro | business
subscriptionStatus  String   @default("trialing")     // trialing | active | past_due | canceled | suspended
trialEndsAt         DateTime?
currentPeriodEnd    DateTime?
gracePeriodEndsAt   DateTime?
subscription        Subscription?
```

Crea modelos nuevos:

```prisma
model Plan {
  id          String   @id @default(cuid())
  code        String   @unique               // starter | pro | business
  name        String
  priceMonth  Int                            // en centavos
  priceYear   Int
  currency    String   @default("USD")
  maxUsers    Int?
  maxBranches Int?
  features    Json?
  isActive    Boolean  @default(true)
}

model Subscription {
  id                 String   @id @default(cuid())
  businessId         String   @unique
  business           Business @relation(fields: [businessId], references: [id])
  planCode           String
  status             String   @default("trialing")
  interval           String   @default("month")   // month | year
  provider           String   @default("mercadopago")
  providerSubId      String?                       // id de preapproval / subscription
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  payments           Payment[]
}

model Payment {
  id             String   @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  amount         Int
  currency       String
  status         String   // approved | rejected | pending | refunded
  providerPayId  String?
  paidAt         DateTime?
  createdAt      DateTime @default(now())
}

model WebhookEvent {
  id          String   @id @default(cuid())
  provider    String
  eventId     String   @unique
  type        String
  payload     Json
  processedAt DateTime @default(now())
}
```

Genera y aplica la migración (`npx prisma migrate dev --name billing`) y crea un **seed** con los 3 planes.

## 2. Backend

- `src/services/billing/paymentProvider.js`: interfaz con métodos `createSubscription(business, plan, interval)`, `cancelSubscription(sub)`, `verifyWebhook(req)`, `parseEvent(payload)`.
- `src/services/billing/mercadopago.provider.js`: implementación real con la API de MercadoPago (preapproval). Devuelve la `init_point`/URL de checkout.
- `src/controllers/billing.controller.js`:
  - `GET /api/billing/plans` — lista planes.
  - `GET /api/billing/subscription` — estado de la suscripción del business actual.
  - `POST /api/billing/checkout` — crea la suscripción en la pasarela y devuelve la URL de pago.
  - `POST /api/billing/cancel` — cancela al fin del periodo.
  - `POST /api/billing/webhook` — recibe eventos (¡ruta pública, sin auth, con verificación de firma!).
- `src/routes/billing.routes.js` y registrarlas en `app.js`. La ruta `/webhook` debe ir ANTES del middleware de tenant/auth.
- **Lógica del webhook** (idempotente vía `WebhookEvent`):
  - pago aprobado → `subscriptionStatus = active`, set `currentPeriodEnd`, crea `Payment`.
  - pago rechazado/pendiente recurrente → `past_due` + set `gracePeriodEndsAt = now + 5 días`.
  - cancelación → `canceled` al terminar el periodo.

## 3. Gating de acceso (lo que "habilita" el sistema)

En `src/middleware/tenant.middleware.js`, después de resolver el `Business`:

```js
const ALLOWED = ["trialing", "active"];
const isTrialValid = b.subscriptionStatus !== "trialing" || (b.trialEndsAt && b.trialEndsAt > new Date());
if (!ALLOWED.includes(b.subscriptionStatus) || !isTrialValid) {
  return res.status(402).json({
    error: "subscription_required",
    status: b.subscriptionStatus,
    message: "Tu suscripción no está activa."
  });
}
```

Excluir de este gating: rutas de `billing`, `auth`, `health` y `public` (reservas del cliente final deben seguir funcionando si así lo decides, o también bloquearlas si el negocio no paga — decídelo y deja un flag).

## 4. Jobs (reutiliza el cron existente en `src/jobs/`)

- `billing.job.js`:
  - Aviso por email (usa `mailer`) 3 días antes de `currentPeriodEnd`.
  - Si `past_due` y `gracePeriodEndsAt < now` → `subscriptionStatus = suspended`.
  - Si `trialing` y `trialEndsAt < now` y sin pago → `subscriptionStatus = past_due`.

## 5. Frontend (`dashboard-react`)

- Página `/precios` (pública) con las 3 tarjetas de plan y botón "Empezar".
- Flujo de alta: registro → crea `Business` en `trialing` → onboarding → banner "Te quedan X días de prueba".
- Pantalla `/configuracion/suscripcion`: plan actual, estado, próximo cobro, cambiar plan, cancelar, ver pagos.
- **Interceptor global**: si una respuesta es `402 subscription_required`, redirigir a `/precios` o a una pantalla "Reactiva tu cuenta" con el botón de pago.
- Banner de aviso cuando `past_due`.

## 6. Panel super-admin (para el dueño del SaaS)

- Vista que liste todos los `Business` con su `plan`, `subscriptionStatus`, `currentPeriodEnd` y MRR estimado.
- Acciones manuales: activar/suspender, otorgar días de cortesía, cambiar plan.
- Protегer con un rol `SUPERADMIN` (usa el RBAC existente).

## 7. Seguridad y calidad

- Webhook con verificación de firma + idempotencia.
- Nunca confiar en el frontend para el estado de pago; la verdad está en el webhook.
- Tests: unit del provider (mock), del gating del middleware (402 cuando suspended), y del webhook (pago aprobado → active). Reutiliza la carpeta `src/tests/`.
- Variables nuevas documentadas en `.env.example`.

## Entregables

1. Migración Prisma aplicada + seed de planes.
2. Módulo billing backend (provider, controller, rutas, webhook).
3. Gating en tenant middleware + exclusiones.
4. Job de dunning/suspensión.
5. Páginas de precios, suscripción y manejo del 402 en React.
6. Panel super-admin.
7. Tests y `.env.example` actualizado.
8. Un `README_BILLING.md` corto explicando cómo configurar las llaves de MercadoPago y probar el flujo end-to-end en sandbox.

Trabaja por fases, corre las migraciones y los tests, y no rompas los módulos existentes (CRM, citas, inventario, finanzas, workflows).
