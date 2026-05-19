# Backend en Railway (API Express)

Frontend en **Vercel**: https://dashboard-react-rust-eight.vercel.app/app  
API en **Railway**: solo el repo **`seleniassDeveloper/Dashboardapp`**.

---

## Error típico (lo que tenés ahora)

| Síntoma | Causa |
|---------|--------|
| **502** en `/health` | El servicio no corre Express (Railpack desplegó Vite + Caddy) |
| **CORS** en el navegador | El 502 no trae cabeceras CORS; al arreglar el API desaparece |
| Build log: `railpack` + `vite static site` | Repo o builder incorrectos |

---

## Configuración correcta (checklist)

### 1. Source
- Repo: **`seleniassDeveloper/Dashboardapp`**
- Rama: **`main`**
- **NO** uses `Aplicacion-Dashboard`

### 2. Build
| Campo | Valor |
|--------|--------|
| Builder | **Dockerfile** |
| Dockerfile path | `Dockerfile` |
| Root Directory | **vacío** (raíz del monorepo) |

El repo incluye `railway.json` y `railway.toml` para forzar Docker.

### 3. Variables (RAW)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
FRONTEND_URL=https://dashboard-react-rust-eight.vercel.app
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 4. Networking
- **Settings** del **servicio** → **Networking** → **Generate Domain**
- Ejemplo: `https://aplicacion-dashboard-production.up.railway.app`

### 5. Redeploy
Build logs deben mostrar **Docker**, no Railpack.  
Deploy logs: `[server] Dashboard API en 0.0.0.0:...`

### 6. Probar
`GET https://TU-DOMINIO.up.railway.app/health` → `{"ok":true,...}`

### 7. Vercel
`VITE_API_URL=https://TU-DOMINIO.up.railway.app/api` → **Redeploy**

```bash
cd dashboard-react
./scripts/set-production-api.sh https://TU-DOMINIO.up.railway.app
```

---

## Alternativa: Render (gratis)

Ver **`RENDER.md`** y `render.yaml` en la raíz del repo.

---

## Local

```bash
npm run dev
```

→ http://localhost:5173/app · API http://localhost:3001/health
