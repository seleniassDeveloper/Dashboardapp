# Prompt para Antigravity — Dejar funcional la página pública de reservas GRATIS (AuraDash)

> Repo AuraDash. Backend Node/Express/Prisma en Render (`https://dashboard-api-r6j9.onrender.com`), frontend React/Vite en Vercel (`auradash.digital`). La reserva pública propia de AuraDash vive en:
> - Backend: `backend/src/controllers/public.controller.js` (`getPublicBusiness`, `getPublicServices`, `getPublicProfessionals`, `getPublicAvailability`, `createPublicBooking`) y `backend/src/routes/public.routes.js`.
> - Frontend: `dashboard-react/src/views/booking/PublicBookingPage.jsx` y el link `${origin}/booking/<slug>` que arma `dashboard-react/src/components/configurable-fields/BookingSettings.jsx`.
>
> OBJETIVO: que la página `https://auradash.digital/booking/<slug>` funcione gratis para TODOS los negocios, sin depender de la "Agenda de citas" de pago de Google Workspace. NO se maneja dinero.

## Diagnóstico verificado en producción (corregir)
1. La página carga el negocio, pero `GET /api/public/business/<slug>/services` y `/professionals` devuelven `[]` aunque el negocio exista. Resultado: el cliente no ve nada para reservar.
   - Causa probable: los servicios/profesionales no quedan marcados como disponibles online (`isActive`/`availableOnline` en `Service`, `availableOnline` en `Worker`), o no se asignan profesionales a servicios (`WorkerService`) ni horarios (`WorkerSchedule`).
2. FUGA DE SEGURIDAD: `GET /api/public/business/<slug>` devuelve el objeto `Business` COMPLETO, incluyendo `googleAccessToken`, `googleRefreshToken`, `googleCalendarId`, `ownerId`. Eso es público; si un negocio conecta Google, sus tokens quedarían expuestos.

## Cambios requeridos

### 1. Seguridad — no exponer datos sensibles en endpoints públicos
- En `getPublicBusiness`, devuelve SOLO los campos que la página de reservas necesita: `id` (si hace falta), `name`, `slug`, `logo`, `industry`, `description`, `bookingEnabled`, `bookingPrimaryColor`, `bookingConfirmationMessage`, `timezone`, y los de downpayment si se usan. NUNCA devuelvas `googleAccessToken`, `googleRefreshToken`, `googleCalendarId`, `ownerId`, ni `userId`. Usa un `select` explícito de Prisma.
- Revisa los demás endpoints públicos (`/services`, `/professionals`, `/availability`) y asegura que tampoco filtren datos internos.

### 2. Que la página de reservas no salga vacía
- Asegura que al crear servicios y profesionales (en onboarding y en el alta normal del dashboard) queden disponibles para reserva online por defecto:
  - `Service`: `isActive: true` y `availableOnline: true` por defecto.
  - `Worker`: `availableOnline: true` por defecto, con `WorkerSchedule` (jornada) y al menos un `WorkerService` (servicios que realiza).
- Agrega en el dashboard un toggle claro por servicio y por profesional: "Disponible para reservas online", para que el dueño controle qué se muestra.
- Si un negocio no tiene NADA disponible online, la página pública debe mostrar un mensaje amable ("Este negocio aún no tiene servicios disponibles para reserva online") en vez de quedar en blanco.

### 3. Verificar el flujo completo de reserva pública
- Confirma de punta a punta: elegir servicio(s) → elegir profesional (o "cualquiera") → ver horarios disponibles (respetando `timezone` del negocio, duración, jornada, bloqueos y no superposición) → crear la reserva (`createPublicBooking`) → mostrar confirmación.
- `createPublicBooking` debe revalidar disponibilidad en el momento de crear (evitar doble reserva) y crear el/los `Appointment` correctamente, filtrando todo por `businessId`.

### 4. Hacer visible el link de reservas en el dashboard
- En la pantalla de configuración de reservas, muestra el enlace `${origin}/booking/<slug>` bien visible, con botón "Copiar" y un "Abrir/Previsualizar". Deja claro que ESE es el enlace gratuito para compartir con clientes (no el de pago de Google).

### 5. Google Calendar = solo sincronización opcional (no de pago)
- Deja claro en la UI que conectar Google Calendar (cuenta Gmail gratuita) es OPCIONAL y solo sirve para que las citas aparezcan en el calendario personal del dueño. El campo `googleBookingUrl` (link de pago de Google) debe ser opcional y no requerido para reservar.

## Entregables
1. Endpoints públicos sin datos sensibles (`select` explícito; sin tokens).
2. Servicios y profesionales disponibles online por defecto + toggles en el dashboard.
3. Página `auradash.digital/booking/<slug>` funcional end-to-end y con mensaje amable si está vacía.
4. Link de reservas visible y copiable en el dashboard.
5. Pruebas: crear un servicio + un profesional con horario en un negocio nuevo, abrir su `/booking/<slug>`, ver horarios y completar una reserva; verificar que `/business/<slug>` ya no expone tokens.

## Criterios de aceptación
- Cualquier negocio puede recibir reservas gratis desde `auradash.digital/booking/<slug>` sin pagar Google Workspace.
- La página muestra servicios, profesionales y horarios reales (TZ correcta) y permite reservar.
- Ningún endpoint público expone `googleAccessToken`/`googleRefreshToken` ni otros datos internos.
- Conectar Google Calendar es opcional y solo sincroniza; no es requisito para reservar.
