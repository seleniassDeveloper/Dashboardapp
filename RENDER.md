# Despliegue en Render

Si Railway sigue dando problemas, Render es una excelente alternativa para tu backend Express + Prisma.

## Pasos para desplegar en Render

1. Entra a [Render](https://render.com) y crea una cuenta o inicia sesión.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio de GitHub `Dashboardapp`.
4. Render leerá automáticamente el archivo `render.yaml` y configurará todo.

## Configuración manual (si no usas `render.yaml`)

Si prefieres configurarlo a mano, usa estos valores:

- **Name**: `dashboard-api` (o el que prefieras)
- **Environment**: `Node`
- **Root Directory**: `backend`
- **Build Command**: `npm ci`
- **Start Command**: `npm run start:prod`

## Variables de Entorno (Environment Variables)

Asegúrate de agregar estas variables en la sección **Environment**:

- `NODE_ENV`: `production`
- `PORT`: `3001` (Opcional, Render suele inyectar su propio PORT)
- `DATABASE_URL`: `(tu string de conexión a PostgreSQL)`
- `FRONTEND_URL`: `https://dashboard-react-rust-eight.vercel.app`
- `FIREBASE_SERVICE_ACCOUNT_JSON`: `(tu JSON de Firebase minificado)`

## Health Check Path

Render te permite configurar un endpoint de Health Check (sección "Advanced").

- **Health Check Path**: `/health`

Con esto, Render no marcará el servicio como exitoso hasta que tu API responda con un 200 en `/health`. Ya configuramos el endpoint para que lo haga sin depender de la base de datos o Firebase, así que nunca fallará por problemas externos.
