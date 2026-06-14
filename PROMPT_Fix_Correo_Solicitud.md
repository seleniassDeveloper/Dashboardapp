# Prompt para Antigravity — Arreglar el correo de solicitud de plan (Pro/Business)

> Repo AuraDash. Backend Node + Express + Prisma (PostgreSQL) desplegado en Render (`dashboard-api`), frontend React/Vite en Vercel. Problema: al hacer clic en "Empezar Plan" (Pro/Business) la UI muestra "Tu solicitud ha sido enviada" pero NO llega ningún correo a `auradash.digital@gmail.com`.

## Diagnóstico ya confirmado (no re-investigar, arréglalo)
1. En `backend/src/controllers/billing.controller.js`, dentro de `checkout`, cuando `planCode` es `pro` o `business`:
   - Primero hace `prisma.planRequest.create(...)` y DESPUÉS `sendReminderEmail(...)`, todo en un mismo `try/catch` que **silencia el error** (`console.warn`) y aun así responde "Tu solicitud ha sido enviada". Si el `create` falla, el correo nunca se intenta y el usuario ve éxito igual.
2. Los modelos `PlanRequest`, `Plan`, `Subscription`, `Payment`, `WebhookEvent` existen en `backend/prisma/schema.prisma` pero **no tienen archivos de migración** en `backend/prisma/migrations/` (la última es `20260504210000_drop_prisma_auth_users`).
3. El despliegue NO sincroniza el esquema: en `backend/package.json`, `start:prod` = `node src/server.js` y el `buildCommand` de `render.yaml` es solo `npm ci`. Por eso en la base de datos de producción esas tablas **no existen** → `prisma.planRequest.create` lanza error → no se envía el correo.

## Cambios requeridos

### 1. Sincronizar el esquema de la base en cada despliegue
- Genera la migración faltante para los modelos nuevos (`PlanRequest`, `Plan`, `Subscription`, `Payment`, `WebhookEvent` y cualquier campo nuevo de `Business` como `plan`, `subscriptionStatus`, `trialEndsAt`, `currentPeriodEnd`, `gracePeriodEndsAt`):
  - `npx prisma migrate dev --name billing_and_plan_requests` (en local) para crear el archivo de migración.
- Haz que el despliegue aplique migraciones automáticamente. Edita `render.yaml`:
  - `buildCommand: npm ci && npx prisma generate && npx prisma migrate deploy`
  - (o agrega un script `db:deploy` y úsalo). El objetivo: que TODA tabla de `schema.prisma` exista en producción tras cada deploy.
- Si por el estado actual de la base no se puede aplicar la migración limpia, deja documentado el comando de rescate una sola vez: `DATABASE_URL="<prod>" npx prisma db push`.

### 2. Que el correo se envíe aunque falle el guardado, y no fallar en silencio
En `billing.controller.js` (rama `pro`/`business` de `checkout`):
- Separa en dos `try/catch` independientes: uno para `prisma.planRequest.create` y otro para `sendReminderEmail`. Un fallo en el guardado NO debe impedir el envío del correo, y viceversa.
- Cambia los `console.warn` por `console.error` con el error completo, e incluye en la respuesta JSON un flag interno (p. ej. `emailSent: true/false`) para poder diagnosticar. Mantén el mensaje al usuario.
- Si `sendReminderEmail` lanza, NO devuelvas "solicitud enviada" como si todo hubiera ido bien; registra el fallo en logs claramente.

### 3. Verificación de configuración de correo al arrancar
- En `backend/src/services/mailer.js` (o en el arranque del server), si faltan `EMAIL_HOST`, `EMAIL_USER` o `EMAIL_PASS`, escribe un `console.warn("[mailer] Faltan credenciales SMTP: ...")` al iniciar, para detectarlo en los logs de Render.
- Confirma que `mailer.js` usa exactamente: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.

### 4. Variable de entorno del magic link
- En `billing.controller.js` el link de aprobación usa `process.env.API_URL`. Asegúrate de que exista esa variable en Render (o cámbiala por la URL del backend ya conocida) para que el botón "Aprobar Acceso Ahora" apunte correctamente a `https://dashboard-api-r6j9.onrender.com`.

## Entregables
1. Migración creada y `render.yaml` aplicando `prisma migrate deploy` en cada deploy.
2. `checkout` reescrito con manejo de errores separado y logs claros (sin silenciar fallos).
3. Aviso de credenciales SMTP faltantes en el arranque.
4. `README` corto con: variables de entorno de correo requeridas en Render, y cómo probar el flujo (hacer clic en "Empezar Plan" Pro y confirmar que llega el correo a `auradash.digital@gmail.com`).
5. Limpieza: borra el archivo temporal `backend/smtptest.mjs` si sigue existiendo.

## Criterio de aceptación
- Al hacer clic en "Empezar Plan" (Pro/Business), se crea el `PlanRequest` en la base de producción Y llega el correo a `auradash.digital@gmail.com` con el botón de aprobación funcionando.
- Si el correo falla, queda registrado en los logs de Render (no falla en silencio).
- Tras un nuevo despliegue, todas las tablas del `schema.prisma` existen en la base de producción.
