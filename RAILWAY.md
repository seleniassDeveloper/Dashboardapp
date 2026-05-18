# Desplegar el backend en Railway (5–10 min)

El frontend en Vercel **no puede** usar `localhost:3001`. Necesitás el API público en Railway.

## Si ves "Build failed" en Railway

### Error: `npm run build` + Vite / Rolldown

Railway está intentando **compilar el frontend React** (Vite). El API **no** usa Vite.

**Solución:**

1. Servicio → **Settings** → **Build** → **Builder:** elegí **Dockerfile** (no Nixpacks / Railpack por defecto).
2. **Root Directory:** vacío (raíz) **o** `backend`.
3. Repo: `seleniassDeveloper/Dashboardapp` (último push con `Dockerfile` en la raíz).
4. **Redeploy**.

En el repo ya no hay script `build` en la raíz (solo `build:all` local) para que Nixpacks no dispare Vite.

### Otros checks

1. **Variables:** `DATABASE_URL` obligatoria.
2. **Logs:** Deployments → deploy fallido → última línea en rojo.

## 1. Crear servicio

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Repo: `seleniassDeveloper/Dashboardapp`
3. **Settings** → **Root Directory:** vacío **o** `backend` (cualquiera de los dos funciona con el repo actual)
4. **Builder:** Dockerfile (detectado por `railway.toml`)

## 2. Variables de entorno (Railway → Variables)

| Variable | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Tu URL de Neon (la misma del `.env` local) |
| `FRONTEND_URL` | `https://dashboard-react-rust-eight.vercel.app` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Contenido completo del JSON de Firebase (una línea) |

Obtener JSON: Firebase Console → Configuración → Cuentas de servicio → Generar clave privada.

## 3. Dominio público

**Networking** → **Generate Domain** → copiá la URL, ej. `https://dashboardapp-production-xxxx.up.railway.app`

Probá: `https://TU-URL/health` → debe responder `"ok": true`

## 4. Conectar Vercel

En tu Mac, desde `dashboard-react`:

```bash
chmod +x scripts/set-production-api.sh
./scripts/set-production-api.sh https://TU-URL.up.railway.app
```

O manual en Vercel → **dashboard-react** → **Environment Variables**:

`VITE_API_URL` = `https://TU-URL.up.railway.app/api`

Luego **Redeploy**.

## 5. Verificar

Recargá https://dashboard-react-rust-eight.vercel.app/app — las citas deberían cargar.
