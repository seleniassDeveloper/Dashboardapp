# Módulo de Suscripciones y Facturación (SaaS Billing) - MercadoPago

Este módulo permite monetizar tu SaaS cobrando suscripciones recurrentes a los salones (inquilinos) mediante MercadoPago, con soporte para planes Starter, Pro y Business, y suspensión automática de cuentas.

---

## 1. Configuración de Variables de Entorno (`.env`)

Para habilitar la facturación en producción, agrega las siguientes claves en los archivos de entorno correspondiente:

### Backend (`backend/.env`)
```env
# Token de acceso privado de MercadoPago (Modo Producción o Sandbox)
# Si no se define o comienza con "mock_", el backend entrará en MOCK MODE (simulado)
MP_ACCESS_TOKEN=APP_USR-xxxxxx-xxxxxx

# URL base de tu frontend react
APP_BASE_URL=https://tu-dashboard.com

# Habilitar o deshabilitar el cron job de facturación en el servidor
ENABLE_BILLING_JOB=true
```

### Frontend (`dashboard-react/.env`)
```env
# URL base de la API del Backend (asegúrate de que apunte a tu backend de producción)
VITE_API_URL=https://api.tu-dashboard.com/api
```

---

## 2. Flujo de Sandbox / Simulación Local (Mock Mode)

Para facilitar el desarrollo local sin necesidad de crear credenciales reales de MercadoPago:
1. **Inicia sin configurar** `MP_ACCESS_TOKEN` (o ponle un valor como `mock_token`).
2. Ve al panel de control en **Precios** o a la pestaña **Suscripción** dentro de **Configuración**.
3. Selecciona un plan (Starter, Pro o Business) y haz clic en **Contratar Plan**.
4. Serás redirigido a una página simulada en tu propio frontend que tiene el parámetro `mock_checkout=true`.
5. Se abrirá una ventana emergente: **MercadoPago Sandbox Simulator**.
6. Haz clic en **Simular Pago Exitoso**. Esto enviará peticiones webhook simuladas al backend de forma segura y actualizará tu salón a estado `active` con tu plan seleccionado de forma inmediata.

---

## 3. Configuración del Webhook en MercadoPago (Producción)

Cuando estés listo para salir a producción con pagos reales:
1. Entra a tu panel de desarrollador en [MercadoPago Developers](https://www.mercadopago.com.ar/developers).
2. Ve a **Webhooks** o **Notificaciones IPN**.
3. Configura la URL de notificaciones apuntando al endpoint público de tu backend:
   `https://api.tu-dashboard.com/api/billing/webhook`
4. Selecciona los eventos que deseas recibir:
   * **Suscripciones / Preapprovals** (`subscription_preapproval` / `preapproval`)
   * **Pagos** (`payment`)

El backend verificará automáticamente cada transacción consultando directamente a la API de MercadoPago usando tu `MP_ACCESS_TOKEN` privado antes de otorgar o bloquear accesos, asegurando una seguridad infranqueable.

---

## 4. Ejecución de Pruebas Unitarias Automatizadas

El sistema incluye pruebas automatizadas para validar:
1. Gating del middleware `checkTenant` (bloqueo `402` en cuentas suspendidas).
2. Idempotencia y registro de pagos mediante Webhook.
3. Transición de estados en cron jobs (pruebas vencidas y períodos de gracia).

Para correr las pruebas, ejecuta en la terminal del backend:
```bash
node src/tests/test_billing.js
```

---

## 5. Solicitud de Planes por Correo (Magic Link)

Al hacer clic en "Empezar Plan" en Pro o Business, el sistema enviará un correo con un "Magic Link" para aprobar el acceso con un solo clic.

**Requisitos en Render.com (Environment Variables):**
Para que este flujo funcione y los correos lleguen correctamente, debes configurar las siguientes variables en la pestaña **Environment** de tu Web Service en Render:
- `EMAIL_HOST` = `smtp.gmail.com`
- `EMAIL_PORT` = `465`
- `EMAIL_SECURE` = `true`
- `EMAIL_USER` = `auradash.digital@gmail.com`
- `EMAIL_PASS` = `[TU_CONTRASEÑA_DE_APLICACION_DE_GOOGLE]` (sin espacios)
- `EMAIL_FROM` = `AuraDash <auradash.digital@gmail.com>`
- `API_URL` = `https://dashboard-api-r6j9.onrender.com` (o la URL de tu backend en producción)

**Cómo probar el flujo:**
1. Ve al panel del Frontend.
2. Navega a **Configuración -> Facturación y Planes**.
3. Haz clic en **Empezar Plan** en Pro o Business.
4. Confirma que la UI muestre el mensaje de éxito.
5. Revisa la bandeja de entrada de `auradash.digital@gmail.com`. Te llegará un correo.
6. Haz clic en **✅ Aprobar Acceso Ahora** en el correo para otorgar acceso inmediato al negocio.
7. *Si el correo falla, revisa los "Logs" en el panel de Render, donde ahora se mostrará el error exacto (no fallará silenciosamente).*

---

## 6. Evitar Timeouts y Cold Starts (Render Free + Neon)

En planes gratuitos, tanto Render como Neon "duermen" tu servicio tras inactividad. Esto causa que la primera visita tarde hasta 30-50 segundos, lo que resulta en un Error 500 (Timeout).

**Para la Base de Datos (Neon DB):**
Debes usar el "Pooled Endpoint" (el enlace que termina en `-pooler`) en Render para gestionar mejor las conexiones serverless y evitar bloqueos (timeouts y `P1002`).
Asegúrate de que tu `DATABASE_URL` en Render tenga este formato exacto:
`postgres://user:pass@ep-nombredb-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1`

**Para el Servidor (Render):**
Para evitar que Render apague tu backend, configura un Uptime Cron.
1. Crea una cuenta gratuita en [cron-job.org](https://cron-job.org/) o similar.
2. Crea un nuevo cron job apuntando a la ruta de salud del backend:
   `https://dashboard-api-r6j9.onrender.com/health`
3. Configúralo para que se ejecute cada **10 minutos**. Esto mantendrá tu backend siempre despierto y los checkout responderán en menos de 2 segundos.
