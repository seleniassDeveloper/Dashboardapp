# Guía Definitiva de Despliegue (Dashboard SaaS)

Esta guía contiene los pasos exactos para desplegar el backend (Railway o Render) y el frontend (Vercel) de forma exitosa y sin errores de CORS o 502.

## 1. Despliegue del Backend

El backend está diseñado para responder `200 OK` en el endpoint `/health` de forma independiente a la base de datos o Firebase. Esto garantiza que plataformas como Railway o Render puedan levantar el contenedor sin quedarse atascados en "Performing healthchecks".

### Opción A: Railway (Recomendado)

1. En Railway, crea un **New Project** -> **Deploy from GitHub repo**.
2. Selecciona tu repositorio `Dashboardapp`.
3. Ve a los **Settings** del servicio recién creado.
4. En la sección **Service**, asegúrate de que Railway use el `Dockerfile` que está en la raíz del proyecto.
   - Root Directory: `(vacío)`
   - Dockerfile Path: `Dockerfile`
5. En la sección **Variables**, agrega lo siguiente:
   - `NODE_ENV=production`
   - `PORT=3001` (Opcional, Railway inyecta el suyo, pero es buena práctica).
   - `DATABASE_URL=(tu connection string de Postgres, ej. Supabase o Neon)`
   - `FRONTEND_URL=https://dashboard-react-rust-eight.vercel.app`
   - `FIREBASE_SERVICE_ACCOUNT_JSON=(tu JSON minificado de Firebase)`
6. Espera a que termine el build. El healthcheck en `/health` responderá inmediatamente con `{"ok":true,"service":"dashboard-api"}` en cuanto Node arranque.
7. Una vez desplegado, copia el dominio público generado por Railway (ej. `https://tu-api.up.railway.app`).

### Opción B: Render (Alternativa si Railway falla)

Si Railway sigue dando problemas, usa Render. El repositorio ya incluye el archivo `render.yaml` que configura todo automáticamente.

1. En Render, haz clic en **New +** -> **Web Service**.
2. Conecta tu repositorio de GitHub `Dashboardapp`.
3. Render leerá `render.yaml` automáticamente. Si decides hacerlo manual:
   - Build Command: `npm ci`
   - Start Command: `npm run start:prod`
   - Root Directory: `backend`
   - Health Check Path: `/health`
4. Agrega las variables de entorno (`NODE_ENV`, `DATABASE_URL`, `FRONTEND_URL`, `FIREBASE_SERVICE_ACCOUNT_JSON`).
5. Despliega y copia el dominio público generado por Render (ej. `https://tu-api.onrender.com`).

---

## 2. Despliegue del Frontend (Vercel)

El frontend está configurado para consumir la API usando la variable `VITE_API_URL`.

1. En Vercel, crea un **New Project** y selecciona el repositorio `Dashboardapp`.
2. En la configuración del Framework Preset, selecciona **Vite**.
3. En **Root Directory**, selecciona `dashboard-react`.
4. En **Environment Variables**, debes agregar obligatoriamente:
   - `VITE_API_URL=https://DOMINIO_BACKEND/api`
     *(Reemplaza `DOMINIO_BACKEND` por la URL que copiaste de Railway o Render, asegúrate de NO poner `/api` dos veces ni barra final. Ej: `https://tu-api.up.railway.app/api`)*
5. Haz clic en **Deploy**.

---

## 3. Validación y Pruebas

Una vez desplegados ambos, realiza las siguientes pruebas:

1. **Prueba de Health Básica**: Entra a `https://DOMINIO_BACKEND/health`. Debe devolver:
   ```json
   {
     "ok": true,
     "service": "dashboard-api",
     "timestamp": "..."
   }
   ```
2. **Prueba de Readiness**: Entra a `https://DOMINIO_BACKEND/health/ready`. Esto validará que la base de datos y Firebase estén conectados correctamente.
3. **Prueba Frontend**: Abre la URL de Vercel. El dashboard debería cargar sin alertas de API en localhost y sin errores de CORS en la consola.
