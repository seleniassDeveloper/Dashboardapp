# Prompt para Antigravity — Arreglar timeout en POST /billing/checkout (AuraDash)

> Repo AuraDash. Backend Node/Express/Prisma desplegado en **Render** (`dashboard-api`, URL `https://dashboard-api-r6j9.onrender.com`), base de datos **Neon (Postgres, plan free)**, frontend React/Vite en **Vercel** (`auradash.digital`). Al hacer clic en "Empezar Plan" (Pro/Business) la app muestra el modal "Error del Sistema" con: `AxiosError: timeout of 30000ms exceeded` en `POST /billing/checkout`. Hay que dejarlo funcionando de punta a punta: el checkout debe responder rápido y el correo de solicitud debe llegar a `auradash.digital@gmail.com`.

## Diagnóstico ya hecho (corrige todo esto, no re-investigues)
1. En `backend/src/controllers/billing.controller.js`, la rama `pro`/`business` de `checkout` **esperaba (`await`) el envío SMTP** antes de responder. El envío a Gmail desde Render se cuelga y dispara el timeout de 30s del frontend. (Ya está parcialmente cambiado a "fire-and-forget" en el repo; verifícalo y déjalo robusto: la respuesta HTTP NO debe esperar al correo.)
2. `backend/src/server.js` ejecutaba `prisma migrate deploy` al arrancar y daba **P3005** ("The database schema is not empty") porque la base de Neon se creó con `db push` sin baseline. (Ya está cambiado a `prisma db push --skip-generate` en el repo; verifícalo.)
3. **Cold start**: Render free y Neon free se duermen tras inactividad; la primera petición tarda 30-50s y supera el timeout de 30s del axios del frontend.
4. Posible: la tabla `Plan` no está sembrada y/o `PlanRequest` no existe en la base de producción.

## Cambios a aplicar

### A. Backend — checkout no bloqueante (confirmar)
- En `billing.controller.js`, la rama `pro`/`business`: guarda `planRequest` (rápido) y **dispara el correo en segundo plano** (`import(...).then(send).catch(log)`), respondiendo `200` de inmediato. Que NINGÚN `await` de correo quede en el camino de la respuesta.
- Envuelve `prisma.planRequest.create` con manejo de error claro (log + 500 solo si falla el guardado), pero que sea una operación rápida.

### B. Backend — arranque y migraciones (confirmar)
- En `server.js`, usar `prisma db push --skip-generate` en segundo plano (no `migrate deploy`). Que un fallo de esa tarea NO tumbe el server.

### C. Resiliencia de conexión a Neon (importante para los timeouts)
- Usa el **endpoint POOLED de Neon** en `DATABASE_URL` (el host con `-pooler`) y agrega parámetros recomendados por Prisma para serverless: `?sslmode=require&pgbouncer=true&connection_limit=1`. Documenta el valor exacto a poner en Render.
- Asegura que Prisma Client se instancie UNA sola vez (singleton en `src/prisma.js`) y no por request.

### D. Frontend — timeout y UX
- Sube el timeout de axios para la llamada de checkout (y peticiones que puedan toparse con cold start) de 30s a **60s**, en el cliente axios del frontend (busca `timeout: 30000`).
- En `PricingView.jsx`, al enviar el checkout, muestra estado de carga y un mensaje amable si tarda (p. ej. "Procesando, esto puede tardar unos segundos la primera vez").

### E. Mantener el backend despierto (evitar cold start)
- Crea un endpoint ligero ya existe (`/health`). Documenta en un README cómo configurar un **cron de uptime** (por ejemplo cron-job.org o el scheduler de Render) que haga GET a `https://dashboard-api-r6j9.onrender.com/health` cada 10 minutos para que Render no duerma el servicio.

### F. Datos en producción
- Asegura que existan las tablas y los planes en la base de Neon de producción:
  - `npx prisma db push` (crea tablas faltantes: `Plan`, `Subscription`, `Payment`, `WebhookEvent`, `PlanRequest`).
  - `npm run seed` (script `scripts/seed-plans.js`, siembra starter/pro/business). Hazlo idempotente (upsert).

## Despliegue y verificación
1. Commit + push de los cambios; confirma en Render que el deploy queda en **Live** (sin "failed", sin P3005 en logs; debe verse `[server] db push finished code=0`).
2. Prueba: con el servicio despierto, clic en "Empezar Plan" (Pro). El checkout debe responder en **menos de 3s** con "Tu solicitud ha sido enviada", sin el modal de error.
3. En los logs de Render debe aparecer `[Billing] Correo de solicitud enviado correctamente.` y el correo debe llegar a `auradash.digital@gmail.com` (revisar Spam).

## Criterios de aceptación
- `POST /billing/checkout` responde rápido (sin timeout) aun cuando el correo tarde.
- El correo de solicitud llega a `auradash.digital@gmail.com` con el botón "Aprobar Acceso Ahora" funcionando.
- El deploy en Render queda Live sin P3005 ni "deploy failed".
- Los planes están sembrados en la base de producción y todas las tablas existen.
