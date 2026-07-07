# Prompt — Módulo Flujos / Automatizaciones para app móvil (AuraDash) con CSS detallado

> Copia todo y pásalo a tu asistente de código. Stack real: **React 19 + Vite + react-bootstrap + lucide-react + recharts + i18n**, con `useIsMobile` ya existente. NO se toca el backend: se reutilizan los endpoints y catálogos que ya usa `WorkflowsView.jsx` + `WorkflowBuilder.jsx`.

---

## CONTEXTO Y REGLAS (no negociables)

Construyes la versión **móvil** del módulo de Flujos, idéntica a las 9 pantallas de referencia:
1. Lista de flujos (Mis flujos / Plantillas) + resumen
2. Nuevo Flujo — elegir método (Rápido / Visual / Plantilla)
3–6. Wizard de 4 pasos (Información → Disparador → Acción → Revisar y activar)
7. Detalle del flujo
8. Ejecuciones
9. Estadísticas

Reglas:
1. **NO tocar el backend.** Reutiliza los endpoints existentes: `GET /workflows`, `POST /workflows`, `PATCH /workflows/:id/status`, `DELETE /workflows/:id`, `GET /workflows/stats/summary`, `GET /workflows/executions`, y el simulador `POST /workflows/executions`.
2. **NO romper el escritorio.** Solo se monta cuando `useIsMobile()` es `true`; el `WorkflowBuilder` de escritorio queda intacto. Todo el CSS va scopeado bajo `.flows-mobile`.
3. **Reutiliza los catálogos reales** de `WorkflowBuilder.jsx`: `SYNC_TRIGGERS` (10 disparadores), `SYNC_ACTIONS` (7 acciones) y `SYNC_LOGIC` (Condición IF/ELSE, Retardo/Delay). No inventes disparadores nuevos.
4. **El Diseñador Visual (drag & drop) NO se edita en móvil**: solo se muestra en solo lectura; la edición visual queda en escritorio.

### Arquitectura / archivos

```
src/hooks/useWorkflows.js                          → lista, stats, executions, toggle status, delete
src/hooks/useWorkflowForm.js                       → estado del wizard (name, status, description, trigger, action, logic)
src/views/WorkflowsView.jsx                        → isMobile ? <FlowsMobile/> : <WorkflowsDesktop/>
src/components/workflows/mobile/FlowsMobile.jsx        → router de pantallas
src/components/workflows/mobile/FlowsList.jsx         → pantalla 1
src/components/workflows/mobile/NewFlowMethod.jsx      → pantalla 2
src/components/workflows/mobile/FlowWizard.jsx         → pantallas 3–6 (stepIndex 1..4)
src/components/workflows/mobile/FlowDetail.jsx         → pantalla 7
src/components/workflows/mobile/FlowExecutions.jsx     → pantalla 8
src/components/workflows/mobile/FlowStats.jsx          → pantalla 9
src/components/workflows/mobile/FlowsMobile.css        → todo el CSS scopeado
```

`FlowsMobile` mantiene `screen` ("list"|"method"|"wizard"|"detail"|"executions"|"stats") y el wizard su `stepIndex` (1..4).

---

## DESIGN TOKENS (pega al inicio de FlowsMobile.css)

```css
.flows-mobile {
  --f-bg:#f8f7fc; --f-card:#fff; --f-border:#eeecf6; --f-shadow:0 2px 10px rgba(30,20,60,.04);
  --f-purple:#7c5cfc; --f-purple-600:#6d4ae8; --f-purple-soft:#efe9ff;
  --f-green:#10b981; --f-green-soft:#e7f7f0; --f-red:#ef4444; --f-red-soft:#fee2e2;
  --f-amber:#f59e0b; --f-amber-soft:#fef3c7;
  --f-text:#1e1b2e; --f-muted:#8b8a99; --f-label:#5b5a68;
  --f-radius:16px;
  background:var(--f-bg); min-height:100vh; color:var(--f-text);
  font-family:-apple-system,"Segoe UI",Roboto,sans-serif;
  padding:0 16px calc(84px + env(safe-area-inset-bottom,0px));
}
.flows-mobile * { box-sizing:border-box; }
.flows-mobile .f-card { background:var(--f-card); border:1px solid var(--f-border);
  border-radius:var(--f-radius); box-shadow:var(--f-shadow); }
.flows-mobile .f-topbar { display:flex; align-items:center; gap:12px; padding:16px 0; }
.flows-mobile .f-topbar__title { font-size:17px; font-weight:700; flex:1; }
.flows-mobile .f-icon-btn { background:none; border:0; color:var(--f-text); display:flex; padding:4px; }

/* Badges de estado del flujo */
.flows-mobile .f-badge { font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; }
.flows-mobile .f-badge--active { background:var(--f-green-soft); color:#047857; }
.flows-mobile .f-badge--draft  { background:#f0eef7; color:var(--f-muted); }

/* Toggle switch */
.flows-mobile .f-switch { width:44px; height:26px; border-radius:999px; background:#d8d5e8;
  position:relative; border:0; flex-shrink:0; }
.flows-mobile .f-switch--on { background:var(--f-purple); }
.flows-mobile .f-switch::after { content:""; position:absolute; top:3px; left:3px; width:20px; height:20px;
  border-radius:50%; background:#fff; transition:.2s; }
.flows-mobile .f-switch--on::after { left:21px; }

/* CTA inferior fijo (wizard) */
.flows-mobile .f-cta { position:fixed; left:16px; right:16px;
  bottom:calc(84px + env(safe-area-inset-bottom,0px)); height:52px; border:0; border-radius:14px;
  background:var(--f-purple); color:#fff; font-weight:700; font-size:16px; z-index:30;
  box-shadow:0 8px 24px rgba(124,92,252,.4); }

/* Fila seleccionable (disparadores, acciones) */
.flows-mobile .f-pick { display:flex; align-items:center; gap:12px; padding:14px; background:#fff;
  border:1px solid var(--f-border); border-radius:14px; margin-bottom:10px; }
.flows-mobile .f-pick--active { border-color:var(--f-purple); background:var(--f-purple-soft); }
.flows-mobile .f-pick__icon { width:38px; height:38px; border-radius:10px; background:#f3f1fb;
  display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.flows-mobile .f-pick__body { flex:1; min-width:0; }
.flows-mobile .f-pick__name { font-size:14px; font-weight:700; }
.flows-mobile .f-pick__desc { font-size:12px; color:var(--f-muted); }
.flows-mobile .f-pick__chev { color:#cbd5e1; flex-shrink:0; }
```

---

## PANTALLA 1 — Lista de Flujos (`FlowsList`)

Topbar: menú + "Flujos" + búsqueda. Tabs **"Mis flujos"** (activo) / **"Plantillas"** + botón filtro. Botón full-width púrpura **"+ Nuevo Flujo"** → pantalla 2.

**"Resumen general"** + dropdown período: 3 stats en fila (`128 Ejecuciones`, `96% Exitosas` verde, `3 Con errores` rojo) — de `GET /workflows/stats/summary`.

**Lista de flujos** (de `GET /workflows`): cada tarjeta = icono + nombre + badge (Activo/Borrador) + **toggle** (dispara `PATCH /workflows/:id/status`) + fila de mini-stats ("245 Ejecuciones · 98% Exitosas") + menú "..." (editar/eliminar/duplicar).

```css
.flows-mobile .f-tabs { display:flex; gap:20px; border-bottom:1px solid var(--f-border); margin-bottom:16px; }
.flows-mobile .f-tab { padding:10px 0; font-size:14px; font-weight:600; color:var(--f-muted);
  background:none; border:0; border-bottom:2px solid transparent; }
.flows-mobile .f-tab--active { color:var(--f-purple-600); border-bottom-color:var(--f-purple); }
.flows-mobile .f-newbtn { width:100%; height:52px; border:0; border-radius:14px; background:var(--f-purple);
  color:#fff; font-weight:700; font-size:15px; margin-bottom:18px; box-shadow:0 8px 20px rgba(124,92,252,.35); }
.flows-mobile .f-summary { padding:16px; margin-bottom:16px; }
.flows-mobile .f-summary__head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.flows-mobile .f-summary__stats { display:flex; justify-content:space-between; text-align:center; }
.flows-mobile .f-stat__num { font-size:22px; font-weight:800; }
.flows-mobile .f-stat--ok .f-stat__num { color:var(--f-green); }
.flows-mobile .f-stat--err .f-stat__num { color:var(--f-red); }
.flows-mobile .f-stat__label { font-size:12px; color:var(--f-muted); }
.flows-mobile .f-flow { display:flex; align-items:flex-start; gap:12px; padding:14px; margin-bottom:12px; }
.flows-mobile .f-flow__icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center;
  justify-content:center; flex-shrink:0; background:#f3f1fb; }
.flows-mobile .f-flow__body { flex:1; min-width:0; }
.flows-mobile .f-flow__top { display:flex; align-items:center; gap:8px; }
.flows-mobile .f-flow__name { font-size:14px; font-weight:700; }
.flows-mobile .f-flow__stats { font-size:12px; color:var(--f-muted); margin-top:6px; }
```

## PANTALLA 2 — Nuevo Flujo: elegir método (`NewFlowMethod`)

Back + "Nuevo Flujo" + "Elige cómo quieres crear tu automatización". Dos tarjetas grandes:
- **⚡ Configuración Rápida** — "Crea tu flujo en pocos pasos con un formulario guiado." + botón **"Crear rápido"** → wizard (paso 1).
- **Diseñador Visual** — "Construye flujos avanzados arrastrando y conectando pasos." + botón outline **"Ver flujo (solo lectura)"** + nota "La edición visual está disponible en escritorio".

"O empieza desde una plantilla" + "Ver todas". Tarjeta de plantilla (de `TEMPLATES`): icono + nombre + chevron.

```css
.flows-mobile .f-method { padding:18px; margin-bottom:14px; text-align:center; }
.flows-mobile .f-method__icon { width:52px; height:52px; border-radius:14px; background:var(--f-purple-soft);
  color:var(--f-purple-600); display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
.flows-mobile .f-method__title { font-size:17px; font-weight:800; }
.flows-mobile .f-method__desc { font-size:13px; color:var(--f-muted); margin:6px 0 14px; }
.flows-mobile .f-method__btn { width:100%; height:46px; border-radius:12px; border:0; background:var(--f-purple);
  color:#fff; font-weight:700; }
.flows-mobile .f-method__btn--outline { background:#fff; border:1.5px solid var(--f-purple); color:var(--f-purple-600); }
.flows-mobile .f-method__note { font-size:11px; color:var(--f-muted); margin-top:10px; }
.flows-mobile .f-tpl { display:flex; align-items:center; gap:12px; padding:14px; }
.flows-mobile .f-tpl__icon { width:36px; height:36px; border-radius:10px; background:var(--f-green-soft);
  color:#047857; display:flex; align-items:center; justify-content:center; }
```

## WIZARD (pantallas 3–6): cabecera con barra de progreso

Todas comparten: back + "Nuevo Flujo" / "Paso X de 4" + barra de progreso segmentada (4 tramos).

```css
.flows-mobile .f-wiz-head { padding:16px 0 8px; }
.flows-mobile .f-wiz-head__sub { font-size:12px; color:var(--f-muted); }
.flows-mobile .f-progress { display:flex; gap:6px; margin:12px 0 20px; }
.flows-mobile .f-progress__seg { flex:1; height:5px; border-radius:999px; background:#e6e3f2; }
.flows-mobile .f-progress__seg--on { background:var(--f-purple); }
.flows-mobile .f-wiz-title { font-size:20px; font-weight:800; }
.flows-mobile .f-wiz-desc { font-size:13px; color:var(--f-muted); margin:4px 0 18px; }
.flows-mobile .f-field { margin-bottom:16px; }
.flows-mobile .f-field label { display:block; font-size:13px; color:var(--f-label); font-weight:600; margin-bottom:7px; }
.flows-mobile .f-field input, .flows-mobile .f-field select, .flows-mobile .f-field textarea {
  width:100%; border:1px solid var(--f-border); border-radius:12px; padding:14px; font-size:16px; background:#fff; }
.flows-mobile .f-field textarea { min-height:96px; resize:vertical; }
```

### Paso 1 — Información general
Campos: **Nombre del flujo\*** (input), **Estado de publicación** (select Borrador/Activo), **Descripción** (textarea con contador `0/160`). CTA "Continuar".

### Paso 2 — ¿Cuándo se dispara?
"Elige el disparador que iniciará este flujo". Lista de los **10 `SYNC_TRIGGERS`** (Nueva Cita, Cita Confirmada, Cita Cancelada, Cita Finalizada, Consentimiento Firmado, Cambio de Estado de Cita, Cliente Nuevo, Cliente Inactivo (60 días), Stock Bajo, Pago Recibido) con `.f-pick` (icono + nombre + chevron). Al tocar uno se marca `--active`. CTA "Continuar".

### Paso 3 — ¿Qué quieres que haga?
"Elige la acción que se ejecutará". Lista de las **7 `SYNC_ACTIONS`** (Enviar WhatsApp, Enviar Email (Gmail), Alerta Push interna, Crear Tarea para el equipo, Enviar Consentimiento, Cambiar Estado de Cita, Enviar Comprobante de pago). Debajo, subtítulo púrpura **"Agregar control (opcional)"** con las 2 `SYNC_LOGIC` (Condición IF/ELSE, Retardo/Delay). CTA "Continuar".

### Paso 4 — Revisa y activa
"Resumen de tu automatización". Tarjetas: **Disparador** (icono + nombre), **Acción** (icono + nombre), **Configuración** (Estado, Descripción). Bloque **"Probar antes de activar"** + botón outline **"Probar flujo"** (→ `POST /workflows/executions`). CTA **"Guardar y activar"** (→ `POST /workflows`).

```css
.flows-mobile .f-review-block { padding:16px; margin-bottom:12px; }
.flows-mobile .f-review-block h4 { font-size:12px; color:var(--f-muted); font-weight:700; text-transform:uppercase; margin:0 0 10px; }
.flows-mobile .f-review-item { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; }
.flows-mobile .f-review-item__icon { width:36px; height:36px; border-radius:10px; background:#f3f1fb;
  display:flex; align-items:center; justify-content:center; }
.flows-mobile .f-review-kv { display:flex; gap:12px; font-size:13px; padding:6px 0; }
.flows-mobile .f-review-kv__k { color:var(--f-muted); width:90px; flex-shrink:0; }
.flows-mobile .f-test { display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:14px 16px; }
.flows-mobile .f-test__btn { border:1.5px solid var(--f-purple); color:var(--f-purple-600); background:#fff;
  border-radius:10px; padding:8px 16px; font-weight:700; font-size:13px; }
```

## PANTALLA 7 — Detalle del flujo (`FlowDetail`)

Back + "..." menú. Icono + nombre + badge estado + **toggle**. Tabs: **Resumen** (activo) / Ejecuciones / Actividad.
Resumen: Disparador (icono + nombre), Acción (icono + nombre), **"Rendimiento (últimos 30 días)"** con 3 stats (Ejecuciones / Exitosas / Con errores), **Última ejecución** (fecha + badge). Botones **"Editar"** (outline) y **"Más acciones"** (dropdown: pausar, duplicar, eliminar).

```css
.flows-mobile .f-detail-head { display:flex; align-items:center; gap:12px; padding:14px 0; }
.flows-mobile .f-detail-head__icon { width:44px; height:44px; border-radius:12px; background:#f3f1fb;
  display:flex; align-items:center; justify-content:center; }
.flows-mobile .f-detail-head__name { font-size:16px; font-weight:800; }
.flows-mobile .f-perf { display:flex; justify-content:space-between; text-align:center; padding:16px;
  background:#faf9fd; border-radius:14px; margin:14px 0; }
.flows-mobile .f-actions-row { display:flex; gap:10px; }
.flows-mobile .f-actions-row button { flex:1; height:46px; border-radius:12px; font-weight:700; }
.flows-mobile .f-btn-outline { background:#fff; border:1.5px solid var(--f-purple); color:var(--f-purple-600); }
```

## PANTALLA 8 — Ejecuciones (`FlowExecutions`)

Back + "Ejecuciones" + filtro. Tabs: **Todas** / Exitosas / Con errores. Lista de `GET /workflows/executions`: cada fila = icono (WhatsApp verde / error rojo) + hora ("Hoy, 08:35") + cliente ("Cita de Camila Rodríguez") + badge (Exitosa verde / Con error rojo).

```css
.flows-mobile .f-exec { display:flex; align-items:center; gap:12px; padding:14px; background:#fff;
  border:1px solid var(--f-border); border-radius:14px; margin-bottom:10px; }
.flows-mobile .f-exec__icon { width:38px; height:38px; border-radius:50%; display:flex; align-items:center;
  justify-content:center; flex-shrink:0; }
.flows-mobile .f-exec__icon--ok { background:var(--f-green-soft); color:#047857; }
.flows-mobile .f-exec__icon--err { background:var(--f-red-soft); color:var(--f-red); }
.flows-mobile .f-exec__body { flex:1; min-width:0; }
.flows-mobile .f-exec__time { font-size:13px; font-weight:700; }
.flows-mobile .f-exec__sub { font-size:12px; color:var(--f-muted); }
```

## PANTALLA 9 — Estadísticas (`FlowStats`)

Back + "Estadísticas" + dropdown período. **Grid 2×2**: Ejecuciones (128, +12%), Tasa de éxito (96%, +5%), Con errores (3, −40%), Tiempo promedio (1.2s, −10%) — cada uno con delta verde/rojo. **"Ejecuciones por día"** + "Ver más" + **area chart** de recharts (rango del mes). **"Top flujos"**: ranking con nombre + barra + número de ejecuciones.

```css
.flows-mobile .f-metrics { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:14px 0 22px; }
.flows-mobile .f-metric { padding:16px; border:1px solid var(--f-border); border-radius:16px; background:#fff; }
.flows-mobile .f-metric__label { font-size:12px; color:var(--f-muted); }
.flows-mobile .f-metric__val { font-size:24px; font-weight:800; margin:4px 0; }
.flows-mobile .f-metric__delta { font-size:12px; font-weight:700; }
.flows-mobile .f-metric__delta--up { color:var(--f-green); }
.flows-mobile .f-metric__delta--down { color:var(--f-red); }
.flows-mobile .f-chart { padding:16px; margin-bottom:20px; }
.flows-mobile .f-chart__head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.flows-mobile .f-top-row { display:flex; align-items:center; gap:12px; padding:10px 0; }
.flows-mobile .f-top-row__rank { font-weight:800; color:var(--f-purple-600); width:16px; }
.flows-mobile .f-top-row__bar { flex:1; height:8px; background:#eee; border-radius:999px; overflow:hidden; }
.flows-mobile .f-top-row__fill { height:100%; background:var(--f-purple); border-radius:999px; }
.flows-mobile .f-top-row__num { font-weight:700; font-size:13px; width:44px; text-align:right; }
```

Snippet recharts (ejecuciones por día):
```jsx
<ResponsiveContainer width="100%" height={140}>
  <AreaChart data={dailyData} margin={{ top:8, right:6, left:-24, bottom:0 }}>
    <defs><linearGradient id="fArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.3}/>
      <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0}/>
    </linearGradient></defs>
    <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={10} stroke="#a5a4b3"/>
    <YAxis tickLine={false} axisLine={false} fontSize={10} stroke="#a5a4b3"/>
    <Area type="monotone" dataKey="v" stroke="#7c5cfc" strokeWidth={2} fill="url(#fArea)"/>
  </AreaChart>
</ResponsiveContainer>
```

---

## CRITERIOS DE ACEPTACIÓN

- Las 9 pantallas se ven idénticas al mockup en ≤767px: lista con resumen y toggles, elección de método, wizard de 4 pasos, detalle, ejecuciones y estadísticas.
- El `WorkflowBuilder` de escritorio (≥768px) queda **exactamente igual que antes**, incluido el Diseñador Visual con drag & drop.
- En móvil, el Diseñador Visual es **solo lectura**; la edición visual solo en escritorio.
- Cero endpoints nuevos: se reutilizan `/workflows`, `/workflows/:id/status`, `/workflows/stats/summary`, `/workflows/executions`.
- Los disparadores y acciones vienen de `SYNC_TRIGGERS` / `SYNC_ACTIONS` / `SYNC_LOGIC` (no hardcodear una lista paralela).
- El toggle de cada flujo actualiza el estado real vía `PATCH`.
- Botones ≥44px, inputs `font-size:16px`, CTA fijo respetando `safe-area-inset` sin tapar la tab bar; sin scroll horizontal en el body.
```
