# Prompt — Wizard "Nuevo Colaborador" para app móvil (AuraDash) con CSS detallado

> Copia todo y pásalo a tu asistente de código. Stack real: **React 19 + Vite + react-bootstrap + lucide-react + i18n**, con `useIsMobile` ya existente. NO se toca el backend: se reutiliza la lógica y el endpoint de guardado que ya usa `WorkerFormModal.jsx`.

---

## CONTEXTO Y REGLAS (no negociables)

Construyes la versión **móvil** del alta de colaborador: un **wizard de pantalla completa de 6 pasos** + pantalla intro + pantalla de revisión, idéntico a las 8 pantallas de referencia.

Pasos: **1. Información General · 2. Cargo y Rol · 3. Especialidades · 4. Horarios Semanales · 5. Comisiones · 6. Acceso al Sistema**, más **Intro** y **Revisar y Crear**.

Reglas:
1. **NO tocar el backend.** Reutiliza el mismo estado y el submit que ya tiene `WorkerFormModal.jsx` (campos: `name`, `phone`, `email`, `birthDate`, `status`, `cargo`, `role`, `specialties`, `schedule`, `commission` {type, value, base, payout}, `access`/`permissions`). El guardado usa el mismo endpoint que hoy (`POST /workers`). Los servicios para especialidades salen de `GET /services`.
2. **NO romper el escritorio.** El wizard móvil solo se monta cuando `useIsMobile()` es `true`; el `WorkerFormModal` de escritorio queda intacto. Todo el CSS va scopeado bajo `.worker-wizard`.
3. **Reutiliza la lógica**: extrae el estado y validaciones de `WorkerFormModal` a un hook `useWorkerForm` para que móvil (wizard) y escritorio (modal) lo compartan.

### Arquitectura / archivos

```
src/hooks/useWorkerForm.js                          → estado + validación + submit (desde WorkerFormModal)
src/header/workers/WorkerFormModal.jsx              → en móvil delega en <WorkerWizardMobile/>
src/header/workers/mobile/WorkerWizardMobile.jsx    → contenedor: maneja `stepIndex` (0..7)
src/header/workers/mobile/steps/*.jsx               → una pantalla por paso
src/header/workers/mobile/WorkerWizardMobile.css    → todo el CSS scopeado
```

`WorkerWizardMobile` mantiene `stepIndex` (0=intro, 1..6=pasos, 7=revisión). "Continuar" avanza, back/‹ retrocede, X cierra el wizard. Transición slide (framer-motion opcional).

---

## DESIGN TOKENS (pega al inicio de WorkerWizardMobile.css)

```css
.worker-wizard {
  --w-bg:#ffffff; --w-card:#ffffff; --w-border:#e8e6f2; --w-shadow:0 2px 10px rgba(30,20,60,.05);
  --w-purple:#7c5cfc; --w-purple-600:#6d4ae8; --w-purple-soft:#efe9ff;
  --w-green:#10b981; --w-green-soft:#e7f7f0;
  --w-text:#1e1b2e; --w-muted:#8b8a99; --w-label:#5b5a68;
  --w-radius:14px;
  background:var(--w-bg); min-height:100vh; color:var(--w-text);
  font-family:-apple-system,"Segoe UI",Roboto,sans-serif;
  display:flex; flex-direction:column;
}
.worker-wizard * { box-sizing:border-box; }

/* Barra superior: ‹ · "Paso X de 6" · X */
.worker-wizard .w-topbar { display:flex; align-items:center; justify-content:space-between;
  padding:16px; }
.worker-wizard .w-topbar__center { font-size:13px; color:var(--w-muted); font-weight:600; }
.worker-wizard .w-icon-btn { background:none; border:0; color:var(--w-text); display:flex; padding:4px; }

/* Título de paso */
.worker-wizard .w-step-title { text-align:center; padding:4px 20px 20px; }
.worker-wizard .w-step-title h2 { font-size:22px; font-weight:800; margin:0; }
.worker-wizard .w-step-title p { font-size:14px; color:var(--w-muted); margin:6px 0 0; }

/* Cuerpo scrolleable */
.worker-wizard .w-body { flex:1; overflow-y:auto; padding:0 16px 120px; }

/* Campos */
.worker-wizard .w-field { margin-bottom:16px; }
.worker-wizard .w-field label { display:block; font-size:13px; color:var(--w-label); margin-bottom:7px; font-weight:600; }
.worker-wizard .w-field label .req { color:var(--w-purple); }
.worker-wizard .w-field input, .worker-wizard .w-field select, .worker-wizard .w-field textarea {
  width:100%; border:1px solid var(--w-border); border-radius:12px; padding:14px;
  font-size:16px; background:#fff; color:var(--w-text); }
.worker-wizard .w-field textarea { min-height:80px; resize:vertical; }

/* CTA inferior fijo */
.worker-wizard .w-cta { position:fixed; left:16px; right:16px;
  bottom:calc(20px + env(safe-area-inset-bottom,0px)); height:52px; border:0; border-radius:14px;
  background:var(--w-purple); color:#fff; font-weight:700; font-size:16px;
  display:flex; align-items:center; justify-content:center; gap:8px;
  box-shadow:0 8px 24px rgba(124,92,252,.4); z-index:30; }
.worker-wizard .w-cta:disabled { opacity:.5; }

/* Info box lila */
.worker-wizard .w-info { display:flex; gap:10px; align-items:flex-start; background:var(--w-purple-soft);
  border-radius:12px; padding:12px 14px; font-size:12px; color:var(--w-label); }
.worker-wizard .w-info svg { color:var(--w-purple-600); flex-shrink:0; margin-top:1px; }

/* Radio-card (rol, permisos) */
.worker-wizard .w-radio { display:flex; align-items:center; gap:12px; padding:14px;
  border:1.5px solid var(--w-border); border-radius:14px; margin-bottom:10px; background:#fff; }
.worker-wizard .w-radio--active { border-color:var(--w-purple); background:var(--w-purple-soft); }
.worker-wizard .w-radio__icon { width:40px; height:40px; border-radius:10px; background:#f3f1fb;
  display:flex; align-items:center; justify-content:center; color:var(--w-purple-600); flex-shrink:0; }
.worker-wizard .w-radio__body { flex:1; }
.worker-wizard .w-radio__title { font-size:14px; font-weight:700; }
.worker-wizard .w-radio__desc { font-size:12px; color:var(--w-muted); }
.worker-wizard .w-radio__mark { width:20px; height:20px; border-radius:50%; border:2px solid var(--w-border); flex-shrink:0; }
.worker-wizard .w-radio--active .w-radio__mark { border-color:var(--w-purple); background:var(--w-purple);
  box-shadow:inset 0 0 0 3px #fff; }

/* Checklist (especialidades, módulos) */
.worker-wizard .w-check { display:flex; align-items:center; gap:12px; padding:12px 4px; }
.worker-wizard .w-check__box { width:22px; height:22px; border-radius:6px; border:2px solid var(--w-border);
  display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.worker-wizard .w-check__box--on { background:var(--w-purple); border-color:var(--w-purple); color:#fff; }
.worker-wizard .w-check__label { font-size:15px; }
.worker-wizard .w-add-link { display:flex; align-items:center; gap:8px; color:var(--w-purple-600);
  font-weight:600; font-size:14px; padding:12px 4px; background:none; border:0; }

/* Toggle switch */
.worker-wizard .w-switch { width:44px; height:26px; border-radius:999px; background:#d8d5e8;
  position:relative; transition:.2s; flex-shrink:0; border:0; }
.worker-wizard .w-switch--on { background:var(--w-purple); }
.worker-wizard .w-switch::after { content:""; position:absolute; top:3px; left:3px; width:20px; height:20px;
  border-radius:50%; background:#fff; transition:.2s; }
.worker-wizard .w-switch--on::after { left:21px; }
```

---

## PANTALLA 0 — Intro (bottom-sheet o pantalla)

Encabezado: ✦ **"Nuevo Colaborador"** (con icono sparkles) + X. Subtítulo "Completa los pasos para crear el perfil".
**Stepper vertical numerado** con los 6 pasos (círculo con número + nombre; el 1 activo en púrpura). Caja info "Podrás editar esta información cuando lo necesites." Botón **"Comenzar"** → `stepIndex=1`.

```css
.worker-wizard .w-intro-head { display:flex; align-items:center; justify-content:space-between; padding:18px 16px 6px; }
.worker-wizard .w-intro-head h2 { font-size:20px; font-weight:800; display:flex; align-items:center; gap:8px; margin:0; }
.worker-wizard .w-vstep { display:flex; align-items:center; gap:14px; padding:12px 4px; }
.worker-wizard .w-vstep__num { width:34px; height:34px; border-radius:50%; border:2px solid var(--w-border);
  display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; color:var(--w-muted); }
.worker-wizard .w-vstep--active .w-vstep__num { border-color:var(--w-purple); color:var(--w-purple-600); }
.worker-wizard .w-vstep__label { font-size:15px; font-weight:600; }
.worker-wizard .w-vstep--active .w-vstep__label { color:var(--w-purple-600); }
```

## PASO 1 — Información General

Uploader de foto (círculo con icono cámara + "Agregar foto"). Campos: **Nombre completo\***, **Teléfono\*** (select de código país `+54` + input número), **Email**, **Fecha de nacimiento** (input date con icono calendario), **Estado** (segmented `Activo`/`Inactivo`). CTA "Continuar".

```css
.worker-wizard .w-photo { width:96px; height:96px; margin:0 auto 8px; border-radius:50%;
  background:var(--w-purple-soft); color:var(--w-purple-600); display:flex; align-items:center;
  justify-content:center; }
.worker-wizard .w-photo-label { text-align:center; color:var(--w-purple-600); font-weight:600;
  font-size:13px; margin-bottom:22px; }
.worker-wizard .w-phone { display:flex; gap:10px; }
.worker-wizard .w-phone select { width:96px; flex-shrink:0; }
.worker-wizard .w-segment { display:flex; gap:10px; }
.worker-wizard .w-segment__btn { flex:1; padding:13px; border-radius:12px; border:1.5px solid var(--w-border);
  background:#fff; font-weight:700; font-size:14px; color:var(--w-muted); }
.worker-wizard .w-segment__btn--on { border-color:var(--w-purple); color:var(--w-purple-600); background:var(--w-purple-soft); }
```

## PASO 2 — Cargo y Rol

**Cargo\*** (select "Seleccionar cargo"). **Rol en el sistema\*** = 4 radio-cards: `Profesional` (Realiza servicios y atiende clientes), `Recepcionista` (Gestiona citas y atención al cliente), `Administrador` (Gestiona operaciones y reportes), `Asistente` (Apoya en tareas operativas). **Observaciones (opcional)** textarea con contador `0/120`. Usa la clase `.w-radio` de los tokens.

## PASO 3 — Especialidades

"Selecciona en qué servicios se especializa". Buscador "Buscar especialidad...". **Checklist** con los servicios de `GET /services` (`.w-check`): Coloración, Corte, Manicure, Pedicure, Alisados, Tratamientos Capilares, Maquillaje, Depilación... Link **"+ Agregar especialidad personalizada"**. CTA "Continuar".

## PASO 4 — Horarios Semanales

"Define los días y horarios disponibles". Una fila por día (Lunes→Domingo): nombre del día + **toggle** de activación + hora inicio (`09:00`) + "–" + hora fin (`18:00`). Los días desactivados muestran "–". Link **"+ Agregar horario especial"**. Guarda en `schedule`.

```css
.worker-wizard .w-day { display:flex; align-items:center; gap:10px; padding:10px 0; }
.worker-wizard .w-day__name { width:76px; font-size:14px; font-weight:600; }
.worker-wizard .w-day__time { flex:1; text-align:center; padding:10px; border:1px solid var(--w-border);
  border-radius:10px; font-size:14px; background:#fff; }
.worker-wizard .w-day--off .w-day__time { background:#f6f5f9; color:var(--w-muted); }
.worker-wizard .w-day__sep { color:var(--w-muted); }
```

## PASO 5 — Comisiones

**Tipo de comisión\*** (select "Porcentaje (%)"). **Valor de comisión\*** (input con sufijo `%`). Info box dinámica: "El profesional recibirá el **{valor}%** del precio de cada servicio que realice." **Base de cálculo** (select "Precio final del servicio"). **Pago de comisiones** (select "Quincenal"). Guarda en `commission`.

```css
.worker-wizard .w-suffix { position:relative; }
.worker-wizard .w-suffix input { padding-right:40px; }
.worker-wizard .w-suffix span { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:var(--w-muted); font-weight:600; }
```

## PASO 6 — Acceso al Sistema

"Configura sus permisos y acceso". **Permisos** = 3 radio-cards: `Acceso completo` (Puede gestionar todo), `Acceso limitado` (Accede a lo esencial para su rol), `Personalizado` (Configura permisos específicos). **Acceso a módulos** = checklist: Agenda, Clientes, Caja, Reportes, Inventario. CTA **"Revisar y crear"** → `stepIndex=7`.

## PANTALLA 7 — Revisar y Crear

"Verifica la información antes de crear". **Tarjeta resumen**: foto + nombre + badges (rol púrpura, estado verde). Lista de filas (icono + label + valor): Teléfono, Email, Cargo, Especialidades, Horario, Comisión ("30% sobre precio final"), Acceso. Botón **"✓ Crear colaborador"** (dispara el submit real → `POST /workers`) + link **"Volver"**.

```css
.worker-wizard .w-review-card { border:1px solid var(--w-border); border-radius:18px; padding:18px;
  box-shadow:var(--w-shadow); }
.worker-wizard .w-review-head { display:flex; align-items:center; gap:12px; padding-bottom:14px;
  border-bottom:1px solid var(--w-border); margin-bottom:6px; }
.worker-wizard .w-review-head img, .worker-wizard .w-review-head .w-ph { width:56px; height:56px;
  border-radius:50%; object-fit:cover; background:var(--w-purple-soft); }
.worker-wizard .w-review-name { font-size:16px; font-weight:800; }
.worker-wizard .w-review-badges { display:flex; gap:6px; margin-top:4px; }
.worker-wizard .w-badge { font-size:11px; font-weight:700; padding:3px 8px; border-radius:999px; }
.worker-wizard .w-badge--role { background:var(--w-purple-soft); color:var(--w-purple-600); }
.worker-wizard .w-badge--status { background:var(--w-green-soft); color:#047857; }
.worker-wizard .w-review-row { display:flex; align-items:center; gap:12px; padding:11px 0;
  border-bottom:1px solid #f2f0f9; font-size:14px; }
.worker-wizard .w-review-row:last-child { border-bottom:0; }
.worker-wizard .w-review-row svg { color:var(--w-purple-600); flex-shrink:0; }
.worker-wizard .w-review-row__label { color:var(--w-muted); }
.worker-wizard .w-review-row__val { margin-left:auto; font-weight:600; text-align:right; }
.worker-wizard .w-volver { display:block; text-align:center; color:var(--w-purple-600);
  font-weight:600; margin-top:12px; background:none; border:0; width:100%; }
```

---

## CRITERIOS DE ACEPTACIÓN

- Las 8 pantallas se ven idénticas al mockup en ≤767px: intro con stepper vertical, 6 pasos con su barra "Paso X de 6", y revisión final.
- El `WorkerFormModal` de escritorio (≥768px) queda **exactamente igual que antes**.
- Cero endpoints nuevos: el guardado usa el mismo `POST /workers`; las especialidades salen de `GET /services`.
- Toda la información recolectada por el wizard alimenta el mismo objeto de estado que el modal de escritorio (mismo `useWorkerForm`), así el backend recibe idéntico payload.
- Validación por paso: "Continuar" deshabilitado si faltan campos obligatorios (marcados con \*).
- Botones ≥44px, inputs `font-size:16px` (sin zoom iOS), CTA fijo respetando `safe-area-inset`.
- El contador de Observaciones limita a 120 caracteres; el % de comisión se refleja en vivo en la caja informativa.
```
