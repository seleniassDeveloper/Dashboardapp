# Deploy en producción — Dashboard SaaS

Arquitectura objetivo:

| Capa | Servicio | Carpeta |
|------|----------|---------|
| Frontend | [Vercel](https://vercel.com) | `dashboard-react/` |
| API | [Railway](https://railway.app) | `backend/` |
| Base de datos | [Neon](https://neon.tech) o [Supabase](https://supabase.com) | PostgreSQL |
| Auth | [Firebase](https://console.firebase.google.com) | Cliente + Admin |

---

## 1. Base de datos (Neon o Supabase)

1. Creá un proyecto PostgreSQL.
2. Copiá la **connection string** con SSL (`?sslmode=require`).
3. Guardala como `DATABASE_URL` (la usarás en Railway).

En Neon/Supabase podés ejecutar migraciones desde tu máquina:

```bash
cd backend
cp .env.example .env
# Pegá DATABASE_URL en .env
npm ci
npx prisma migrate deploy
```

---

## 2. Firebase

### Cliente (frontend)

1. Firebase Console → tu proyecto → **Project settings** → **Your apps** → Web.
2. Copiá las variables `VITE_FIREBASE_*` (ver `dashboard-react/.env.production.example`).

### Dominios autorizados

**Authentication → Settings → Authorized domains**, agregá:

- `localhost` (desarrollo)
- Tu dominio de Vercel: `tu-app.vercel.app`
- Dominio custom si usás uno

Habilitá **Google** y/o **Email/Password** en **Sign-in method**.

### Admin (backend)

1. **Project settings → Service accounts → Generate new private key**.
2. En Railway, pegá el JSON completo en la variable `FIREBASE_SERVICE_ACCOUNT_JSON` (una sola línea).
3. **No** subas ese archivo a GitHub.

---

## 3. Backend en Railway

### Conectar el repositorio

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Elegí `seleniassDeveloper/Dashboardapp` (o tu repo).
3. **Root Directory:** vacío (raíz del monorepo, **no** `backend`)
4. **Builder:** **Dockerfile** · path `Dockerfile` (ver `RAILWAY.md`)
5. **NO** uses Railpack ni el repo `Aplicacion-Dashboard` para el API.

### Variables de entorno (Production)

| Variable | Ejemplo |
|----------|---------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` (Railway suele inyectar `PORT` automáticamente) |
| `DATABASE_URL` | `postgresql://...?sslmode=require` |
| `FRONTEND_URL` | `https://tu-app.vercel.app` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `{"type":"service_account",...}` |
| `ENABLE_REMINDERS_JOB` | `true` (opcional) |
| `EMAIL_*` | Si usás recordatorios por email |
| `OPENAI_API_KEY` | Si usás IA |

**Importante:** `AUTH_DISABLED` debe estar **sin definir** o en `false` en producción.

### Dominio público del API

1. Railway → tu servicio → **Settings** → **Networking** → **Generate Domain**.
2. Obtendrás algo como: `https://dashboard-api-production.up.railway.app`
3. La URL del API para el frontend es: `https://TU-DOMINIO-RAILWAY/api`

### Health check

Railway usa `GET /health`. Debe responder `{"ok":true,...}`.

### Deploy automático

Cada push a `main` en GitHub vuelve a desplegar si activaste **Auto Deploy** en Railway.

---

## 4. Frontend en Vercel

### Conectar el repositorio

1. [vercel.com](https://vercel.com) → **Add New Project** → importá el repo de GitHub.
2. **Root Directory:** `dashboard-react`
3. Framework: **Vite** (detectado por `vercel.json`).

### Variables de entorno (Production)

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://TU-DOMINIO-RAILWAY/api` |
| `VITE_AUTH_DISABLED` | `false` |
| `VITE_FIREBASE_API_KEY` | (Firebase) |
| `VITE_FIREBASE_AUTH_DOMAIN` | |
| `VITE_FIREBASE_PROJECT_ID` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | |

### Deploy automático

Cada push a `main` despliega en Vercel si el proyecto está vinculado.

### PWA

La app es instalable (service worker + `manifest`). Reemplazá `public/pwa-192.png` y `public/pwa-512.png` por tu logo cuando tengas branding final.

---

## 5. Orden recomendado de deploy

```
1. Base de datos + migraciones Prisma
2. Railway (backend) → copiar URL pública
3. Vercel (frontend) con VITE_API_URL apuntando al backend
4. Firebase: dominios autorizados (Vercel + localhost)
5. Railway: FRONTEND_URL = URL de Vercel
6. Probar login, citas, equipo
```

---

## 6. Desarrollo local

```bash
# Raíz del repo
cp backend/.env.example backend/.env
cp dashboard-react/.env.example dashboard-react/.env
npm install
cd backend && npm ci && cd ..
cd dashboard-react && npm ci && cd ..
cd backend && npx prisma migrate deploy && cd ..
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  
- Health: http://localhost:3001/health  

---

## 7. Checklist post-deploy

- [ ] `GET https://TU-API/health` → `ok: true`
- [ ] Login con email y Google en la URL de Vercel
- [ ] Crear cita / ver equipo sin errores CORS
- [ ] Token Bearer en peticiones (Network tab → Authorization header)
- [ ] `AUTH_DISABLED` no está en `true` en Railway ni Vercel
- [ ] Migraciones aplicadas (`prisma migrate deploy` en el start de Railway)

---

## 8. Estructura del monorepo

```
Dashboard/
├── backend/           → Railway (API Express + Prisma)
│   ├── Dockerfile
│   ├── railway.toml
│   └── prisma/
├── dashboard-react/   → Vercel (React + Vite + PWA)
│   ├── vercel.json
│   └── src/lib/api.js → cliente HTTP central (VITE_API_URL)
├── DEPLOY.md
└── package.json       → scripts dev locales
```

---

## 9. Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| CORS error | API caído (502) o `FRONTEND_URL` mal | Primero `/health` OK; luego `FRONTEND_URL=https://tu-app.vercel.app` sin `/` final |
| 502 Bad Gateway | Railpack/Vite en Railway | Repo `Dashboardapp` + builder **Dockerfile** |
| Build: vite static site | Repo `Aplicacion-Dashboard` | Cambiar source a `Dashboardapp` |
| 401 en todas las rutas | Token no enviado | Revisá `VITE_API_URL` y Firebase |
| Firebase Admin 500 | JSON de cuenta de servicio | `FIREBASE_SERVICE_ACCOUNT_JSON` en Railway |
| DB connection | SSL / URL incorrecta | `?sslmode=require` en Neon/Supabase |
| Página en blanco tras login Google | Dominio no autorizado | Firebase Authorized domains |
| Migraciones fallan | DB vacía o sin permisos | Ejecutá `npx prisma migrate deploy` con la misma `DATABASE_URL` |

---

## 10. Dominio propio (opcional)

**Vercel:** Settings → Domains → agregá `app.tudominio.com`.  
**Railway:** Settings → Custom Domain → `api.tudominio.com`.  
Actualizá `FRONTEND_URL`, `VITE_API_URL` y Firebase Authorized domains.
