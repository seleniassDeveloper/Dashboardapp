# Plan — Confirmar cita desde el email y transicionar el workflow (AuraDash)

Objetivo: cuando el cliente toca **"Confirmar mi cita"** en el email, la cita pasa a **CONFIRMED** en el dashboard y eso **dispara automáticamente** el workflow de "Cita Confirmada" (transición al siguiente estado/acción).

---

## Lo que YA existe (no hay que construirlo)

Tras auditar el backend, esto ya está hecho:

1. **Motor de workflows** — `src/services/workflowEngine.js` con `triggerWorkflows(businessId, triggerType, context)`. Busca los workflows activos cuyo disparador coincide y corre sus pasos.
2. **La transición ya se dispara con el cambio de estado.** En `appointments.controller.js`, cuando cambia el estado de una cita:
   ```js
   // updateAppointment (~línea 354)
   recordStatusTransition(req.businessId, id, oldStatus, status);
   triggerWorkflows(req.businessId, "status_changed", appt);
   triggerWorkflows(req.businessId, status, appt);   // ← dispara "cita-confirmada"
   ```
   Es decir: **si la cita pasa a CONFIRMED, el workflow "Cita Confirmada" ya se ejecuta solo.**
3. **Envío de email** — `sendManualConfirmationEmail` + `mailer.js` (`sendReminderEmail`) + Gmail API. Ya se manda un email de cita.
4. **Rutas públicas con token** — ya tienes el patrón: `/public/consent/:token/sign`, reservas públicas, etc. (`public.routes.js` + `public.controller.js`).

**La única pieza que falta:** hoy el cambio de estado va por `PUT /appointments/:id`, que exige permiso `agenda.edit` (login). El cliente no puede hacerlo desde el email. Necesitamos un **endpoint público con token** que confirme la cita, y un **botón en el email** que lo llame.

---

## Lo que hay que construir (mínimo, sin romper nada)

### Paso 1 — Token de confirmación sin login (sin migración de BD)

Usa un token **firmado (HMAC/JWT)**, stateless, para no tocar el modelo Prisma. Crea `src/utils/appointmentToken.js`:

```js
import crypto from "crypto";
const SECRET = process.env.APPT_CONFIRM_SECRET || process.env.JWT_SECRET;

export function makeConfirmToken(appointmentId, businessId) {
  const payload = Buffer.from(JSON.stringify({
    a: appointmentId, b: businessId, t: Date.now()
  })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyConfirmToken(token) {
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()); }
  catch { return null; }
}
```

> Alternativa: agregar un campo `confirmToken String?` al modelo `Appointment` y una migración. Es más "clásico" pero requiere tocar la BD. El token firmado evita la migración; recomendado.

### Paso 2 — Endpoint público de confirmación

En `public.controller.js`, nueva función `confirmAppointmentByToken`, y regístrala en `public.routes.js`. Reutiliza **exactamente** la misma secuencia de transición que ya usa `updateAppointment`:

```js
// public.controller.js
import { verifyConfirmToken } from "../utils/appointmentToken.js";
import { triggerWorkflows, recordStatusTransition } from "../services/workflowEngine.js";

export async function confirmAppointmentByToken(req, res) {
  const data = verifyConfirmToken(req.params.token);
  if (!data) return res.status(400).send("Enlace inválido o vencido.");

  const appt = await prisma.appointment.findUnique({
    where: { id: data.a },
    include: { client: true, worker: true, service: true },
  });
  if (!appt || appt.businessId !== data.b) return res.status(404).send("Cita no encontrada.");

  // Idempotencia: solo transicionar si sigue pendiente
  if (appt.status === "CONFIRMED") {
    return res.redirect(`${process.env.PUBLIC_WEB_URL}/cita-confirmada?ok=1`);
  }
  if (appt.status !== "PENDING") {
    return res.redirect(`${process.env.PUBLIC_WEB_URL}/cita-confirmada?estado=${appt.status}`);
  }

  const oldStatus = appt.status;
  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: "CONFIRMED" },
    include: { client: true, worker: true, service: true },
  });

  // ── MISMA transición que el flujo autenticado → dispara el workflow ──
  recordStatusTransition(appt.businessId, appt.id, oldStatus, "CONFIRMED")
    .catch(e => console.error("recordStatusTransition", e?.message));
  triggerWorkflows(appt.businessId, "status_changed", updated)
    .catch(e => console.error("wf status_changed", e?.message));
  triggerWorkflows(appt.businessId, "confirmed", updated)   // ← "Cita Confirmada"
    .catch(e => console.error("wf confirmed", e?.message));

  return res.redirect(`${process.env.PUBLIC_WEB_URL}/cita-confirmada?ok=1`);
}
```

En `public.routes.js`:
```js
router.get("/appointments/confirm/:token", confirmAppointmentByToken);
// (o POST si usas la página intermedia del Paso 4)
```

**Este es el corazón del cambio:** el endpoint no reimplementa nada del workflow; solo cambia el estado y llama al MISMO `triggerWorkflows` que ya existe. La transición al siguiente estado del workflow la resuelve el motor tal como hoy.

### Paso 3 — Botón "Confirmar mi cita" en el email

En `sendManualConfirmationEmail` (`appointments.controller.js`), genera el token y añade el botón. Además **ajusta el copy**: hoy el email dice "¡Tu reserva está confirmada!", pero si el objetivo es que el cliente confirme, debería pedir la acción.

```js
import { makeConfirmToken } from "../utils/appointmentToken.js";
// ...dentro de la función, antes de armar el HTML:
const confirmUrl = `${process.env.API_PUBLIC_URL}/api/public/appointments/confirm/${makeConfirmToken(appointment.id, appointment.businessId)}`;
```

Y en el HTML del mail, reemplaza el encabezado por un CTA:
```html
<div style="text-align:center; padding:24px 0;">
  <h2 style="color:#7c3aed; margin:0;">Confirma tu cita</h2>
  <p style="color:#4b5563; font-size:14px;">Toca el botón para confirmar tu reserva en ${biz.name}.</p>
  <a href="${confirmUrl}"
     style="display:inline-block; margin-top:16px; background:#7c3aed; color:#fff;
            padding:14px 28px; border-radius:10px; font-weight:700; text-decoration:none;">
    ✅ Confirmar mi cita
  </a>
</div>
```

### Paso 4 — Página de resultado (front, público) — recomendado

Crea una ruta pública `PublicConfirmPage` (mismo patrón que `PublicBookingPage`/`PublicConsentPage`): muestra "¡Gracias! Tu cita quedó confirmada ✅" leyendo el `?ok=1`. El endpoint del Paso 2 redirige ahí.

**Importante (anti-prefetch):** Gmail/Outlook a veces "pre-cargan" los links de un email, lo que podría confirmar solo. Para evitarlo, en vez de confirmar directo en el `GET`, haz que el botón lleve a `PublicConfirmPage`, y que ahí un botón **"Confirmar"** dispare un `POST /public/appointments/confirm/:token`. Así la confirmación siempre es una acción humana explícita.

---

## Cómo queda el flujo completo

1. Staff (o un workflow "Enviar Email") manda el correo con el botón **Confirmar mi cita**.
2. El cliente toca el botón → llega a la página pública → confirma.
3. `POST /public/appointments/confirm/:token` valida el token, pasa la cita a **CONFIRMED**.
4. Se llama a `triggerWorkflows(businessId, "confirmed", appt)` → **el workflow "Cita Confirmada" corre su siguiente acción** (ej. mandar WhatsApp, crear tarea, cambiar estado, etc.).
5. El **dashboard muestra la cita como Confirmada** automáticamente (lee el mismo registro).

## Checklist de seguridad

- Token firmado con secreto (`APPT_CONFIRM_SECRET`) y, si quieres, con expiración hasta la fecha de la cita.
- **Idempotente**: si ya está CONFIRMED, no vuelve a disparar el workflow (evita doble ejecución/doble WhatsApp).
- Confirmación por **POST desde la página**, no por GET directo (evita el prefetch de los clientes de correo).
- El endpoint valida que `appt.businessId === token.b`.

## Qué NO hay que hacer

- No hay que crear un motor de estados nuevo: la transición del workflow ya existe.
- No hay que modificar el frontend del dashboard (refleja el estado solo). Si quieres verlo en tiempo real sin recargar, es un extra opcional (polling o websocket), no parte de esta feature.

---

## Variables de entorno nuevas

```
APPT_CONFIRM_SECRET=<secreto largo aleatorio>
API_PUBLIC_URL=https://api.auradash.digital     # base del backend público
PUBLIC_WEB_URL=https://auradash.digital          # front para la página de resultado
```
