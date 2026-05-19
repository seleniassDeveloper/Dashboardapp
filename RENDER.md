# Backend en Render (gratis)

Si Railway sigue con Railpack o 502, usá **Render** con el mismo Dockerfile.

## Pasos

1. https://render.com → **New** → **Web Service**
2. Conectá **`seleniassDeveloper/Dashboardapp`**
3. **Runtime:** Docker
4. **Dockerfile path:** `./Dockerfile`
5. **Root directory:** vacío
6. **Environment variables** (mismas que Railway, ver `backend/.env.production.example`)
7. **Health Check Path:** `/health`
8. **Create Web Service**

Cuando esté live, copiá la URL (ej. `https://dashboard-api-xxxx.onrender.com`).

## Vercel

```bash
cd dashboard-react
./scripts/set-production-api.sh https://dashboard-api-xxxx.onrender.com
```

O en Vercel: `VITE_API_URL` = `https://....onrender.com/api` → Redeploy.

## Blueprint

También podés usar **New → Blueprint** y el archivo `render.yaml` del repo (completá `DATABASE_URL` y Firebase en el panel).
