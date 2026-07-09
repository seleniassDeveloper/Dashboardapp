# Prompt — Pantalla "Progreso de Citas (SLA)" para app móvil (AuraDash) con CSS detallado

> Copia todo y pásalo a tu asistente de código. Stack real: **React 19 + Vite + react-bootstrap + lucide-react + i18n**, con `useIsMobile` ya existente. NO se toca el backend: se reutilizan los endpoints de citas que ya existen.

---

## CONTEXTO Y REGLAS (no negociables)

Construyes la pantalla **Progreso de Citas (SLA)** para móvil, idéntica al mockup: header, tarjeta "Resumen de Hoy" con barra de progreso y meta, 3 KPIs (Confirmadas / Pendiente / Sin seña), y tres grupos de citas — **Prioridad Alta (Sin seña)**, **Pendientes (Esperando confirmación)** y **Confirmadas** — más la tab bar inferior con FAB central.

Es una pantalla de "SLA de confirmación del día": mide cuántas citas del día están confirmadas vs. la meta (ej. 80%), y prioriza las que no tienen seña para cobrarlas por WhatsApp.

Reglas:
1. **NO tocar el backend.** Reutiliza los endpoints existentes de citas: `GET /appointments?date=hoy` (o el que ya use la Agenda), `PATCH /appointments/:id/status` para confirmar, y el flujo de seña/pago ya existente (`/appointments/:id/deposit` o el que uses en `PaymentModal`). WhatsApp abre `https://wa.me/<telefono>?text=...`.
2. **NO romper el escritorio.** Solo se monta cuando `useIsMobile()` es `true`; todo el CSS va scopeado bajo `.sla-mobile`. La vista de Agenda de escritorio queda intacta.
3. **El `status` de cada cita manda todo.** Normaliza cada cita a uno de tres estados: `"sin_sena"` | `"pendiente"` | `"confirmada"`. De ahí salen el color, el KPI, el grupo y el % de la barra. No dupliques lógica de color por fila.

### Arquitectura / archivos

```
src/hooks/useSlaProgress.js                                → citas del día, conteos, %, agrupación por estado
src/views/AgendaView.jsx (o donde vive la Agenda)          → isMobile ? <AppointmentsSLA/> : <AgendaDesktop/>
src/components/appointments/mobile/AppointmentsSLA.jsx      → ESTA pantalla (contenedor + grupos)
src/components/appointments/mobile/ApptCard.jsx            → tarjeta de cita (opcional, reutilizable)
src/components/appointments/mobile/AppointmentsSLA.css     → todo el CSS scopeado
```

`useSlaProgress` devuelve `{ confirmed, pending, noDeposit, total, pct, goalPct }` y expone `confirmAppt(id)`, `chargeDeposit(id)`, `openWhatsApp(appt)`.

---

## DESIGN TOKENS (pega al inicio de AppointmentsSLA.css)

```css
.sla-mobile {
  --c-bg-soft:#f8f7fc; --c-card:#fff; --c-border:#eeecf6; --c-shadow:0 2px 10px rgba(30,20,60,.04);
  --c-purple:#7c5cfc; --c-purple-600:#6d4ae8; --c-purple-soft:#ede9fe;
  --c-green:#10b981; --c-green-soft:#d1fae5;
  --c-amber:#f59e0b; --c-amber-soft:#fef3c7;
  --c-red:#ef4444;   --c-red-soft:#fee2e2;
  --c-track:#e9e7f2;
  --c-text:#1e1b2e; --c-muted:#8b8a99; --c-label:#6b6a7b;
  --c-radius:20px; --c-radius-sm:14px;
  background:var(--c-bg-soft); min-height:100vh; color:var(--c-text);
  font-family:-apple-system,"Segoe UI",Roboto,sans-serif;
  padding-bottom:calc(90px + env(safe-area-inset-bottom,0px));
}
.sla-mobile * { box-sizing:border-box; }
```

---

## SECCIÓN 1 — Header

Fila: botón redondo con `ChevronLeft` (izq, fondo blanco + sombra) + título centrado **"Progreso de Citas (SLA)"** (bold, 19px) + botón `SlidersHorizontal` en púrpura (der, sin fondo) que abre filtros.

```css
.sla-mobile .sla-header { display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px; position:sticky; top:0; z-index:20; background:var(--c-bg-soft); }
.sla-mobile .sla-header__title { font-size:19px; font-weight:800; }
.sla-mobile .sla-iconbtn { width:44px; height:44px; border-radius:50%; border:0; background:#fff;
  color:var(--c-purple); display:flex; align-items:center; justify-content:center; box-shadow:var(--c-shadow); }
.sla-mobile .sla-iconbtn--plain { background:none; box-shadow:none; color:var(--c-purple-600); }
```

## SECCIÓN 2 — Resumen de Hoy (tarjeta lila con barra de progreso)

Tarjeta de fondo lila (`#f4f2ff`). Arriba: icono `CalendarDays` en cuadro lila + **"Resumen de Hoy"** (púrpura) con la fecha debajo ("Lunes, 9 de Julio") + a la derecha **"{N} citas / programadas"**.

Dentro, tarjeta blanca de progreso:
- Fila superior: **"Confirmación del día"** (izq) + **meta "80%"** en púrpura (der).
- Fila principal: **% grande** (ej. `75%`) en púrpura + barra de progreso. La barra tiene un **relleno** al `pct%` y una **línea punteada de meta** posicionada en `goalPct%` (`left:80%`).
- Leyenda centrada con 3 puntos: `● 6 confirmadas` (verde) · `● 1 pendiente` (ámbar) · `● 1 sin seña` (rojo).

El `pct` = `Math.round(confirmadas / total * 100)`. La meta `goalPct` es configurable (default 80).

```css
.sla-mobile .sla-summary { margin:4px 16px 0; padding:18px; border-radius:var(--c-radius);
  background:#f4f2ff; border:1px solid #e7e2ff; }
.sla-mobile .sla-summary__top { display:flex; align-items:flex-start; gap:12px; }
.sla-mobile .sla-summary__ico { width:46px; height:46px; border-radius:14px; background:#e5deff;
  color:var(--c-purple-600); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.sla-mobile .sla-summary__title { font-size:18px; font-weight:800; color:var(--c-purple-600); line-height:1.15; }
.sla-mobile .sla-summary__date { font-size:14px; color:var(--c-muted); margin-top:2px; }
.sla-mobile .sla-summary__count { margin-left:auto; text-align:right; }
.sla-mobile .sla-summary__count b { font-size:17px; font-weight:800; }
.sla-mobile .sla-summary__count span { display:block; font-size:12px; color:var(--c-muted); }

.sla-mobile .sla-progress-card { margin-top:16px; background:#fff; border-radius:var(--c-radius-sm); padding:16px; }
.sla-mobile .sla-progress__head { display:flex; justify-content:space-between; align-items:baseline; }
.sla-mobile .sla-progress__label { font-size:15px; font-weight:700; }
.sla-mobile .sla-progress__goal { font-size:13px; font-weight:700; color:var(--c-purple-600); }
.sla-mobile .sla-progress__row { display:flex; align-items:center; gap:14px; margin:8px 0 14px; }
.sla-mobile .sla-progress__pct { font-size:34px; font-weight:800; color:var(--c-purple); line-height:1; }
.sla-mobile .sla-bar { position:relative; flex:1; height:12px; border-radius:999px; background:var(--c-track); }
.sla-mobile .sla-bar__fill { height:100%; border-radius:999px; background:var(--c-purple); transition:width .4s ease; }
.sla-mobile .sla-bar__goal { position:absolute; top:-3px; bottom:-3px; width:2px; border-left:2px dashed var(--c-purple-600); }
.sla-mobile .sla-legend { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
.sla-mobile .sla-legend span { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--c-label); font-weight:600; }
.sla-mobile .sla-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
.sla-mobile .sla-dot--green { background:var(--c-green); }
.sla-mobile .sla-dot--amber { background:var(--c-amber); }
.sla-mobile .sla-dot--red   { background:var(--c-red); }
```

## SECCIÓN 3 — KPIs (3 tarjetas)

Grid de 3 columnas. Cada tarjeta: icono en cuadro tintado + valor grande + label del color.
- `CheckCircle2` verde · **{confirmadas.length}** · "Confirmadas"
- `Clock` ámbar · **{pendientes.length}** · "Pendiente"
- `CreditCard` rojo · **{sinSena.length}** · "Sin seña"

```css
.sla-mobile .sla-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:16px; }
.sla-mobile .sla-kpi { background:#fff; border:1px solid var(--c-border); border-radius:var(--c-radius-sm);
  box-shadow:var(--c-shadow); padding:14px 12px; display:flex; align-items:center; gap:10px; }
.sla-mobile .sla-kpi__ico { width:40px; height:40px; border-radius:12px; display:flex; align-items:center;
  justify-content:center; flex-shrink:0; }
.sla-mobile .sla-kpi__ico--green { background:var(--c-green-soft); color:#059669; }
.sla-mobile .sla-kpi__ico--amber { background:var(--c-amber-soft); color:#d97706; }
.sla-mobile .sla-kpi__ico--red   { background:var(--c-red-soft);   color:#dc2626; }
.sla-mobile .sla-kpi__value { font-size:20px; font-weight:800; line-height:1; }
.sla-mobile .sla-kpi__label { font-size:12px; font-weight:700; margin-top:2px; }
.sla-mobile .sla-kpi__label--green { color:#059669; }
.sla-mobile .sla-kpi__label--amber { color:#d97706; }
.sla-mobile .sla-kpi__label--red   { color:#dc2626; }
```

## SECCIÓN 4 — Grupos de citas (Sin seña / Pendientes / Confirmadas)

Cada grupo es una tarjeta con encabezado (icono + título + subtítulo + contador "{N} cita(s)"). El de **Sin seña** tiene fondo rojo suave (`--sla-group--danger`).

Encabezados:
- **Prioridad Alta** · `AlertCircle` rojo · subtítulo "Sin seña" · contador rojo.
- **Pendientes** · `Clock` ámbar · subtítulo "Esperando confirmación" · contador ámbar.
- **Confirmadas** · `CheckCircle2` verde · contador verde.

**Tarjeta de cita** (dentro de cada grupo): bloque de hora tintado a la izquierda (hora + día, ej. "9:30 a.m. / MIÉ"), luego nombre (bold) + servicio, y a la derecha el badge de estado. El color del bloque de hora y del badge depende del estado (rojo/ámbar/verde).

- **Sin seña**: acciones `WhatsApp` (outline verde) + **"Cobrar seña"** (botón rojo sólido). Badge "Sin seña".
- **Pendiente**: acciones `WhatsApp` + **"Confirmar"** (outline ámbar → `PATCH status=confirmada`). Badge "Esperando confirmación".
- **Confirmada**: fila compacta, muestra duración (`Clock` + "95 min"), badge verde "Confirmada" + chevron (tap → detalle). Muestra solo 1–2 y luego **"+ N citas más"**.

```css
.sla-mobile .sla-group { margin:8px 16px 0; padding:14px; border-radius:var(--c-radius); background:#fff;
  border:1px solid var(--c-border); box-shadow:var(--c-shadow); }
.sla-mobile .sla-group--danger { background:#fdf4f4; border-color:#f8dede; }
.sla-mobile .sla-group__head { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.sla-mobile .sla-group__title { font-size:16px; font-weight:800; }
.sla-mobile .sla-group__sub { font-size:13px; font-weight:700; }
.sla-mobile .sla-group__sub--red { color:var(--c-red); }
.sla-mobile .sla-group__sub--amber { color:var(--c-amber); }
.sla-mobile .sla-group__count { margin-left:auto; font-size:12px; font-weight:700; padding:4px 12px; border-radius:999px; }
.sla-mobile .sla-group__count--red { background:var(--c-red-soft); color:#dc2626; }
.sla-mobile .sla-group__count--amber { background:var(--c-amber-soft); color:#d97706; }
.sla-mobile .sla-group__count--green { background:var(--c-green-soft); color:#059669; }

.sla-mobile .sla-appt { display:flex; align-items:center; gap:12px; padding:12px; border-radius:var(--c-radius-sm);
  border:1px solid var(--c-border); background:#fff; }
.sla-mobile .sla-appt + .sla-appt { margin-top:10px; }
.sla-mobile .sla-appt--danger { border-color:#f6d5d5; }

.sla-mobile .sla-time { width:68px; flex-shrink:0; border-radius:12px; padding:10px 6px; text-align:center; line-height:1.15; }
.sla-mobile .sla-time--red { background:var(--c-red-soft); }
.sla-mobile .sla-time--amber { background:var(--c-amber-soft); }
.sla-mobile .sla-time--green { background:var(--c-green-soft); }
.sla-mobile .sla-time__h { font-size:15px; font-weight:800; }
.sla-mobile .sla-time__d { font-size:11px; font-weight:700; color:var(--c-muted); margin-top:2px; }

.sla-mobile .sla-appt__info { flex:1; min-width:0; }
.sla-mobile .sla-appt__name { font-size:16px; font-weight:800; }
.sla-mobile .sla-appt__svc { font-size:14px; color:var(--c-muted); margin:2px 0 4px; }
.sla-mobile .sla-appt__dur { display:inline-flex; align-items:center; gap:5px; font-size:13px; color:var(--c-muted); }

.sla-mobile .sla-status { font-size:12px; font-weight:700; padding:6px 12px; border-radius:999px; white-space:nowrap; }
.sla-mobile .sla-status--red { background:var(--c-red-soft); color:#dc2626; }
.sla-mobile .sla-status--amber { background:var(--c-amber-soft); color:#d97706; }
.sla-mobile .sla-status--green { background:var(--c-green-soft); color:#059669; }

.sla-mobile .sla-appt__actions { display:flex; gap:8px; margin-top:4px; }
.sla-mobile .sla-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; border-radius:12px;
  padding:9px 12px; font-size:13px; font-weight:700; border:1px solid var(--c-border); background:#fff; color:var(--c-text); }
.sla-mobile .sla-btn--wa { color:#128c7e; }
.sla-mobile .sla-btn--danger { background:var(--c-red); border-color:var(--c-red); color:#fff; }
.sla-mobile .sla-btn--confirm { border-color:var(--c-amber); color:#d97706; }

.sla-mobile .sla-chevron { color:#cbd5e1; flex-shrink:0; }
.sla-mobile .sla-morelink { display:block; width:100%; text-align:center; padding:12px; margin-top:4px;
  background:none; border:0; color:var(--c-purple-600); font-size:14px; font-weight:700; }
```

## SECCIÓN 5 — Tab bar inferior

**Agenda** (activa, `Calendar`) · **Clientes** (`Users`) · **＋ FAB central** púrpura (nueva cita) · **Reportes** (`BarChart3`) · **Más** (`MoreHorizontal`). Reutiliza el patrón de tab bar con FAB de los otros módulos, respetando `safe-area-inset`.

```css
.sla-mobile .sla-nav { position:fixed; left:0; right:0; bottom:0;
  height:calc(72px + env(safe-area-inset-bottom,0px)); padding-bottom:env(safe-area-inset-bottom,0px);
  background:#fff; border-top:1px solid var(--c-border); display:flex; align-items:center; justify-content:space-around; z-index:30; }
.sla-mobile .sla-nav__item { display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:0;
  color:var(--c-muted); font-size:11px; font-weight:600; }
.sla-mobile .sla-nav__item--active { color:var(--c-purple); }
.sla-mobile .sla-nav__fab { width:56px; height:56px; border-radius:50%; border:0; background:var(--c-purple); color:#fff;
  display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(124,92,252,.45); margin-top:-18px; }
```

---

## LÓGICA (hook useSlaProgress)

```js
const confirmed = appts.filter(a => a.status === "confirmada");
const pending   = appts.filter(a => a.status === "pendiente");
const noDeposit = appts.filter(a => a.status === "sin_sena");
const total = appts.length;
const pct = total ? Math.round(confirmed.length / total * 100) : 0;
// goalPct configurable (default 80)
```

Mapea el estado real del backend a `sin_sena | pendiente | confirmada` en un solo lugar (ej: sin seña pagada → `sin_sena`; agendada sin confirmar → `pendiente`; confirmada → `confirmada`).

---

## CRITERIOS DE ACEPTACIÓN

- La pantalla se ve idéntica al mockup en ≤767px: header, "Resumen de Hoy" con barra + línea de meta punteada, 3 KPIs, y los 3 grupos (Sin seña rojo, Pendientes ámbar, Confirmadas verde) con sus badges y acciones.
- La vista de escritorio (≥768px) queda **exactamente igual que antes**; el módulo solo se monta con `useIsMobile()===true` y todo el CSS está scopeado bajo `.sla-mobile`.
- El **% y la meta** se calculan de los datos reales; el relleno de la barra = `pct%` y la línea punteada = `goalPct%`.
- **Confirmar** hace `PATCH` real y mueve la cita al grupo Confirmadas (y sube el %). **Cobrar seña** dispara el flujo de pago/seña existente. **WhatsApp** abre `wa.me` con el teléfono del cliente.
- Cero endpoints nuevos: se reutilizan los de citas y el flujo de seña ya existentes.
- Botones ≥44px, `font-size:16px` en inputs, tab bar y FAB respetando `safe-area-inset`; sin scroll horizontal en el body.
```
