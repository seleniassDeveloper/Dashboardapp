# Prompt para Antigravity — Re-activar bloqueo de módulos y desbloqueo SOLO por solicitud aprobada (AuraDash)

> Repo AuraDash. Backend Node/Express/Prisma en Render, frontend React/Vite en Vercel. SIN cobro de dinero por ahora: el acceso a módulos se desbloquea únicamente cuando YO (admin `seleniadeveloper@gmail.com`) apruebo una solicitud desde mi dashboard. Quiero volver a dejar los módulos BLOQUEADOS por defecto.

## Contexto del código actual (no romper)
- El bloqueo de módulos en el frontend lo decide `business.plan` en `dashboard-react/src/components/layout/Sidebar.jsx` (`PLAN_RESTRICTIONS`): `starter` bloquea casi todo, `pro` desbloquea más, `business` desbloquea todo.
- El muro de pago del backend (402) está en `backend/src/middleware/tenant.middleware.js`, controlado por `process.env.BILLING_ENFORCED`.
- Ya existe el flujo de solicitud/aprobación en `backend/src/controllers/billing.controller.js`:
  - `checkout` (planes pro/business) crea un `PlanRequest` (con `approvalToken`) y manda un correo de aviso.
  - `quickApprove` aprueba por enlace mágico y pone `business.plan = requestedPlan` + `subscriptionStatus = "active"`.
- Existe panel SaaS Admin (`adminBilling.routes.js` + `dashboard-react/src/components/configurable-fields/SuperAdminBillingView.jsx`).

## Lo que quiero

### 1. Módulos bloqueados por defecto
- Todo negocio NUEVO debe nacer con `plan = "starter"` (módulos avanzados bloqueados): Finanzas, Inventario, Flujos, Sheets, Integraciones, Marketing deben aparecer bloqueados hasta que yo apruebe. Busca dónde se crea el `Business` (onboarding/setup) y asegúralo.
- Verifica que `Sidebar.jsx` siga bloqueando según `business.plan` y que un negocio `starter` no pueda entrar a los módulos restringidos (ni por URL directa: protege también las rutas en el frontend y, si aplica, en el backend).

### 2. Desbloqueo SOLO por solicitud aprobada por mí
- Cuando un negocio pide acceso ("Empezar Plan"), se crea un `PlanRequest` en estado `PENDING` (ya existe).
- El correo de aviso debe ir a **`seleniadeveloper@gmail.com`** (hoy está hardcodeado a `auradash.digital@gmail.com`). Cámbialo a una variable de entorno `ADMIN_EMAIL` con default `seleniadeveloper@gmail.com`, y úsala como destinatario.
- La aprobación NO depende de dinero. Al aprobar, se pone `business.plan = requestedPlan` y se desbloquean los módulos de ese plan.

### 3. Aprobar desde MI dashboard (no solo por el enlace del correo)
- En el panel **SaaS Admin** (visible solo para `seleniadeveloper@gmail.com`), agrega una sección **"Solicitudes pendientes"** que liste los `PlanRequest` con estado `PENDING` (negocio, plan solicitado, fecha) y botones **Aprobar** y **Rechazar**.
- "Aprobar" debe hacer lo mismo que `quickApprove` (cambiar plan + marcar la solicitud `APPROVED`). "Rechazar" marca la solicitud `REJECTED` sin cambiar el plan.
- Crea el/los endpoints en `adminBilling.routes.js` protegidos para que SOLO `seleniadeveloper@gmail.com` (super-admin) pueda usarlos. Reutiliza la lógica de `quickApprove`.
- Mantén también el enlace mágico del correo como atajo, pero que el panel sea la vía principal.

### 4. No afectar a los negocios piloto
- Los 2 negocios piloto ya están en `plan = "business"` / `subscriptionStatus = "active"`. NO los toques: deben seguir con todo desbloqueado.

### 5. Interruptor de cobro
- Como por ahora NO se cobra, deja `BILLING_ENFORCED` documentado pero el bloqueo de módulos debe funcionar por `plan` independientemente de él. (El 402 de pago puede quedar desactivado; lo que importa es que los módulos estén bloqueados por plan y solo se abran al aprobar la solicitud.)

### 6. Limpiar la lista de solicitudes
- En el panel SaaS Admin, además de Aprobar/Rechazar, agrega la posibilidad de **limpiar/depurar la lista de solicitudes** (`PlanRequest`):
  - Botón **"Limpiar procesadas"** que elimine (o archive marcando un estado `ARCHIVED`) todas las solicitudes que ya estén `APPROVED` o `REJECTED`, para que la lista quede ordenada y solo muestre las `PENDING`.
  - Opción de **eliminar una solicitud individual** (botón borrar por fila).
  - Endpoints protegidos solo para el super-admin `seleniadeveloper@gmail.com`.
- Evita duplicados: si un mismo negocio envía varias veces la misma solicitud `PENDING` del mismo plan, no crees una nueva; actualiza/conserva una sola (upsert por `businessId + requestedPlan` mientras esté `PENDING`). Así la bandeja no se llena de repetidas.
- IMPORTANTE (aclaración): el sistema NO puede borrar los correos dentro del buzón de Gmail de `seleniadeveloper@gmail.com` (ya no se usa la Gmail API). Esa limpieza es manual en Gmail. Lo que sí se limpia desde el dashboard es la lista de `PlanRequest` en la base de datos. Para reducir el correo entrante, envía el aviso solo una vez por solicitud (sin reenvíos por duplicados).
- (Opcional) Agrega un script `backend/scripts/clean-plan-requests.js` que borre/archive las solicitudes ya procesadas, por si quiero limpiarlas desde la terminal.

## Entregables
1. Negocios nuevos nacen `starter` con módulos bloqueados (frontend + protección de rutas).
2. `ADMIN_EMAIL` configurable; correo de solicitud llega a `seleniadeveloper@gmail.com`.
3. Sección "Solicitudes pendientes" en el panel SaaS Admin con Aprobar/Rechazar, endpoints protegidos solo para el super-admin.
4. Aprobar desde el dashboard desbloquea los módulos del negocio (cambia `business.plan`).
5. Limpieza de la lista de solicitudes: botón "Limpiar procesadas", borrar individual, y deduplicación de solicitudes PENDING. (Opcional) script `clean-plan-requests.js`.
6. Pruebas: un negocio nuevo ve los módulos bloqueados; al pedir acceso aparece en mis solicitudes pendientes; al aprobar desde el dashboard, ese negocio ve los módulos desbloqueados tras recargar; los piloto no se ven afectados; al pulsar "Limpiar procesadas" desaparecen las aprobadas/rechazadas.

## Criterios de aceptación
- Por defecto, los módulos avanzados están bloqueados para cualquier negocio nuevo.
- La ÚNICA forma de desbloquear es que yo apruebe la solicitud (desde el dashboard o el enlace del correo a `seleniadeveloper@gmail.com`).
- No interviene ningún pago.
- Los 2 negocios piloto siguen con acceso completo.
- Puedo limpiar la lista de solicitudes procesadas desde el dashboard y no se acumulan duplicadas.
