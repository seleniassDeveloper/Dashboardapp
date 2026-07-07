# Prompt — Módulo Equipo & Nómina (Gestión de Personal) para app móvil (AuraDash) con CSS detallado

> Copia todo y pásalo a tu asistente de código. Stack real: **React 19 + Vite + react-bootstrap + lucide-react + recharts + i18n**, con `useIsMobile` ya existente. NO se toca el backend: se reutilizan los endpoints que ya usa `TeamView.jsx`.

---

## CONTEXTO Y REGLAS (no negociables)

Construyes la versión **móvil** del módulo Equipo & Nómina, idéntica a las 2 pantallas de referencia:
1. **Perfil de Colaboradores** (tarjetas del equipo)
2. **Rendimiento & Comisiones** (KPIs + liquidación + podio)

Reglas:
1. **NO tocar el backend.** Reutiliza los endpoints existentes: `GET /staff`, `GET /appointments`, `DELETE /workers/:id`.
2. **NO romper el escritorio.** El componente móvil solo se monta cuando `useIsMobile()` es `true`; todo el CSS va scopeado bajo `.team-mobile`.
3. **Reutiliza la lógica que ya existe** en `TeamView.jsx`: los cálculos `staffStats` (facturación, comisión, ocupación, retención por colaborador) y `dashboardMetrics` (totales del equipo), más el modal `WorkerFormModal` para alta/edición. Extrae esa lógica a un hook `useTeam` para compartirla con el escritorio.

### Arquitectura / archivos

```
src/hooks/useTeam.js                              → lógica: staff, appointments, staffStats, dashboardMetrics, delete
src/views/TeamView.jsx                            → isMobile ? <TeamMobile/> : <TeamDesktop/>
src/components/team/mobile/TeamMobile.jsx             → contenedor + tabs
src/components/team/mobile/CollaboratorsTab.jsx       → pantalla 1
src/components/team/mobile/PerformanceTab.jsx         → pantalla 2
src/components/team/mobile/TeamMobile.css             → todo el CSS scopeado
```

`TeamMobile` mantiene `activeTab` ("members" | "productivity") — igual que el estado actual del escritorio. Reutiliza `WorkerFormModal` para "Añadir Colaboradores" y para editar.

---

## DESIGN TOKENS (pega al inicio de TeamMobile.css)

```css
.team-mobile {
  --t-bg:#f8f7fc; --t-card:#ffffff; --t-border:#eeecf6; --t-shadow:0 2px 10px rgba(30,20,60,.04);
  --t-purple:#7c5cfc; --t-purple-600:#6d4ae8; --t-purple-soft:#ede9fe;
  --t-pink:#ec4899; --t-pink-soft:#fce7f3;
  --t-green:#10b981; --t-green-soft:#e7f7f0; --t-green-700:#047857;
  --t-blue:#3b82f6; --t-blue-soft:#eaf1fe;
  --t-amber:#f59e0b; --t-amber-soft:#fef3c7;
  --t-gold:#f59e0b; --t-silver:#94a3b8; --t-bronze:#d97706;
  --t-text:#1e1b2e; --t-muted:#8b8a99; --t-label:#6b6a7b;
  --t-radius:18px; --t-radius-sm:14px;
  background:var(--t-bg); min-height:100vh; color:var(--t-text);
  font-family:-apple-system,"Segoe UI",Roboto,sans-serif;
  padding:0 16px calc(84px + env(safe-area-inset-bottom,0px));
}
.team-mobile * { box-sizing:border-box; }
.team-mobile .t-card { background:var(--t-card); border:1px solid var(--t-border);
  border-radius:var(--t-radius); box-shadow:var(--t-shadow); }

/* Header (compartido) */
.team-mobile .t-header { display:flex; align-items:center; justify-content:space-between;
  padding:16px 2px; }
.team-mobile .t-header__title { font-size:17px; font-weight:700; }
.team-mobile .t-header__actions { display:flex; align-items:center; gap:14px; }
.team-mobile .t-bell { position:relative; }
.team-mobile .t-bell__dot { position:absolute; top:-2px; right:-2px; width:8px; height:8px;
  border-radius:50%; background:var(--t-pink); border:1.5px solid #fff; }
.team-mobile .t-avatar-sm { width:36px; height:36px; border-radius:50%; background:var(--t-purple);
  color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; }

/* Avatar con iniciales (color por colaborador) */
.team-mobile .t-avatar { border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-weight:700; flex-shrink:0; position:relative; }
.team-mobile .t-avatar__dot { position:absolute; bottom:2px; right:2px; width:12px; height:12px;
  border-radius:50%; background:var(--t-green); border:2px solid #fff; }

/* Segmented control de tabs */
.team-mobile .t-tabs { display:flex; gap:8px; margin:6px 0 18px; }
.team-mobile .t-tab { flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
  padding:12px 8px; border-radius:12px; font-size:13px; font-weight:700; border:1px solid var(--t-border);
  background:#fff; color:var(--t-label); }
.team-mobile .t-tab--active { border-color:var(--t-purple); color:var(--t-purple-600);
  background:var(--t-purple-soft); }
```

---

## PANTALLA 1 — Perfil de Colaboradores (`CollaboratorsTab`)

Header: menú + "Equipo & Nómina" (centro) + campana con punto + avatar "SS".
Bloque intro: **"Gestión de Personal"** (24px, weight 800) + subtítulo "Monitorea la facturación individual, liquidación de comisiones automáticas y rankings de retención."
Botón full-width púrpura **"+ Añadir Colaboradores"** → abre `WorkerFormModal`.
Segmented control de las 2 tabs (esta activa).

Título **"Colaboradores ({N})"**. Buscador "Buscar colaborador..." + botón filtro.

**Tarjeta por colaborador** (de `staffStats`):
- Avatar de color con iniciales + punto verde. Acciones editar (lápiz) y eliminar (papelera) arriba a la derecha.
- Nombre (bold) + cargo/rol debajo (púrpura si "Profesional") + especialidades en itálica (o "Sin especialidades configuradas").
- **"Próximo turno:"** con icono calendario + subtexto ("Hoy 14:30 – Corte + Peinado" o "Sin turnos próximos").
- **3 pills de KPI** en fila: `FACTURADO` (tinte púrpura), `COMISIÓN` (tinte verde), `OCUPACIÓN` (tinte rosa) — label pequeño arriba, valor grande abajo.
- **"Ocupación de Agenda"** + % a la derecha + barra de progreso (verde).

```css
.team-mobile .t-intro h1 { font-size:24px; font-weight:800; margin:0; }
.team-mobile .t-intro p { font-size:14px; color:var(--t-muted); margin:8px 0 16px; }
.team-mobile .t-addbtn { width:100%; height:52px; border:0; border-radius:16px; background:var(--t-purple);
  color:#fff; font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center;
  gap:8px; box-shadow:0 8px 20px rgba(124,92,252,.35); margin-bottom:16px; }

.team-mobile .t-section-title { font-size:17px; font-weight:700; margin:6px 0 12px; }
.team-mobile .t-search { display:flex; gap:10px; margin-bottom:16px; }
.team-mobile .t-search__box { flex:1; display:flex; align-items:center; gap:10px; background:#fff;
  border:1px solid var(--t-border); border-radius:14px; padding:12px 14px; }
.team-mobile .t-search__box input { border:0; outline:0; flex:1; font-size:16px; background:none; }
.team-mobile .t-search__filter { width:48px; border:1px solid var(--t-border); border-radius:14px;
  background:#fff; display:flex; align-items:center; justify-content:center; color:var(--t-label); }

.team-mobile .t-collab { padding:16px; margin-bottom:14px; position:relative; }
.team-mobile .t-collab__actions { position:absolute; top:14px; right:14px; display:flex; gap:8px; }
.team-mobile .t-collab__act { width:34px; height:34px; border-radius:10px; border:1px solid var(--t-border);
  background:#fff; display:flex; align-items:center; justify-content:center; }
.team-mobile .t-collab__act--del { color:var(--t-pink); }
.team-mobile .t-collab__head { display:flex; gap:12px; align-items:flex-start; margin-bottom:12px; }
.team-mobile .t-collab__head .t-avatar { width:56px; height:56px; font-size:18px; }
.team-mobile .t-collab__name { font-size:16px; font-weight:800; }
.team-mobile .t-collab__role { font-size:13px; color:var(--t-purple-600); font-weight:600; }
.team-mobile .t-collab__spec { font-size:12px; color:var(--t-muted); font-style:italic; margin-top:2px; }

.team-mobile .t-shift { display:flex; flex-direction:column; gap:2px; background:#faf9fd;
  border:1px solid var(--t-border); border-radius:12px; padding:10px 12px; margin-bottom:14px; }
.team-mobile .t-shift__label { font-size:12px; font-weight:600; display:flex; align-items:center; gap:6px; }
.team-mobile .t-shift__label svg { color:var(--t-purple-600); }
.team-mobile .t-shift__val { font-size:13px; color:var(--t-muted); }

.team-mobile .t-kpis { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:14px; }
.team-mobile .t-kpi { border-radius:12px; padding:10px 8px; text-align:center; }
.team-mobile .t-kpi--bill { background:var(--t-purple-soft); }
.team-mobile .t-kpi--comm { background:var(--t-green-soft); }
.team-mobile .t-kpi--occ  { background:var(--t-pink-soft); }
.team-mobile .t-kpi__label { font-size:10px; font-weight:700; letter-spacing:.04em; color:var(--t-label); text-transform:uppercase; }
.team-mobile .t-kpi__val { font-size:15px; font-weight:800; margin-top:3px; }
.team-mobile .t-kpi--bill .t-kpi__val { color:var(--t-purple-600); }
.team-mobile .t-kpi--comm .t-kpi__val { color:var(--t-green-700); }
.team-mobile .t-kpi--occ  .t-kpi__val { color:#be185d; }

.team-mobile .t-occ { }
.team-mobile .t-occ__head { display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px; }
.team-mobile .t-occ__head span:last-child { font-weight:800; }
.team-mobile .t-occ__bar { height:7px; background:#eee; border-radius:999px; overflow:hidden; }
.team-mobile .t-occ__fill { height:100%; background:var(--t-green); border-radius:999px; }
```

---

## PANTALLA 2 — Rendimiento & Comisiones (`PerformanceTab`)

Segmented control (esta activa). Fila: **"Resumen del equipo"** + dropdown de período ("Este mes").

**Grid 2×2 de KPIs** (cada uno con mini-sparkline de recharts):
- `Facturación Total del Equipo` · **$3,450.75** · sparkline púrpura (icono `DollarSign`)
- `Comisiones Estimadas a Pagar` · **$1,035.23** · "Cálculo automatizado" verde (icono `Coins`)
- `Ocupación Promedio` · **62%** · sparkline ámbar (icono `Activity`)
- `Ticket Promedio Global` · **$78.90** · "Retención Promedio: 74%" azul (icono `Package`)

Todos salen de `dashboardMetrics`.

**"Liquidación de Personal" / "Informe ejecutivo - Este mes"**: en móvil, en vez de tabla ancha, usar **filas-tarjeta** compactas: avatar + nombre/cargo, luego columnas pequeñas Ocupación %, Retención %, Facturado, y **Comisión Estimada** (verde, con el % de comisión debajo) + chevron. Datos de `staffStats`. Botón inferior **"Ver liquidación completa →"**.

**"Líderes de Desempeño" / "Top 3 del equipo por facturación"**: **podio** de 3 posiciones (2° izquierda más bajo, 1° centro más alto con corona dorada, 3° derecha), cada uno con avatar, nombre, facturado y "% del total". Debajo, **donut** (recharts) con "$3,450.75 / Total del equipo" en el centro + leyenda (nombre + % con punto de color).

```css
.team-mobile .t-resumen { display:flex; align-items:center; justify-content:space-between; margin:4px 0 14px; }
.team-mobile .t-resumen h3 { font-size:16px; font-weight:700; margin:0; }
.team-mobile .t-period { display:inline-flex; align-items:center; gap:6px; background:#fff;
  border:1px solid var(--t-border); border-radius:10px; padding:8px 12px; font-size:13px; font-weight:600; }

.team-mobile .t-metrics { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:22px; }
.team-mobile .t-metric { border-radius:var(--t-radius); padding:14px; position:relative; overflow:hidden;
  border:1px solid var(--t-border); }
.team-mobile .t-metric--purple { background:linear-gradient(180deg,#f6f3ff,#fff); }
.team-mobile .t-metric--green  { background:linear-gradient(180deg,#eefaf4,#fff); }
.team-mobile .t-metric--amber  { background:linear-gradient(180deg,#fff8ec,#fff); }
.team-mobile .t-metric--blue   { background:linear-gradient(180deg,#eef4ff,#fff); }
.team-mobile .t-metric__icon { width:34px; height:34px; border-radius:10px; display:flex;
  align-items:center; justify-content:center; margin-bottom:10px; }
.team-mobile .t-metric__label { font-size:12px; color:var(--t-label); line-height:1.2; }
.team-mobile .t-metric__val { font-size:22px; font-weight:800; margin:4px 0; }
.team-mobile .t-metric__note { font-size:11px; font-weight:600; }
.team-mobile .t-metric__spark { height:34px; margin-top:6px; }

.team-mobile .t-liq-head { margin:4px 0 12px; }
.team-mobile .t-liq-head h3 { font-size:16px; font-weight:700; margin:0; }
.team-mobile .t-liq-head p { font-size:12px; color:var(--t-muted); margin:2px 0 0; }
.team-mobile .t-liq-row { display:flex; align-items:center; gap:10px; padding:12px 14px; background:#fff;
  border:1px solid var(--t-border); border-radius:14px; margin-bottom:10px; }
.team-mobile .t-liq-row .t-avatar { width:38px; height:38px; font-size:13px; }
.team-mobile .t-liq-row__id { flex:1; min-width:0; }
.team-mobile .t-liq-row__name { font-size:13px; font-weight:700; }
.team-mobile .t-liq-row__role { font-size:11px; color:var(--t-muted); }
.team-mobile .t-liq-row__col { text-align:center; font-size:12px; min-width:44px; }
.team-mobile .t-liq-row__col small { display:block; color:var(--t-muted); font-size:10px; }
.team-mobile .t-liq-row__comm { color:var(--t-green-700); font-weight:800; font-size:13px; text-align:right; min-width:56px; }
.team-mobile .t-liq-row__comm small { display:block; color:var(--t-muted); font-weight:600; }
.team-mobile .t-liq-more { display:flex; align-items:center; justify-content:center; gap:8px; width:100%;
  padding:14px; border:1px solid var(--t-border); border-radius:14px; background:#fff;
  color:var(--t-purple-600); font-weight:700; font-size:14px; margin-bottom:22px; }

/* Podio */
.team-mobile .t-podium { display:flex; align-items:flex-end; justify-content:center; gap:10px; margin-top:14px; }
.team-mobile .t-podium__place { flex:1; text-align:center; border-radius:16px; padding:14px 8px; border:1px solid var(--t-border); }
.team-mobile .t-podium__place--1 { background:#fffdf5; border-color:#fde68a; transform:translateY(-14px); }
.team-mobile .t-podium__place--2 { background:#f8fafc; }
.team-mobile .t-podium__place--3 { background:#fff8f3; }
.team-mobile .t-podium__rank { font-size:13px; font-weight:800; }
.team-mobile .t-podium__place--1 .t-podium__rank { color:var(--t-gold); }
.team-mobile .t-podium__place--2 .t-podium__rank { color:var(--t-silver); }
.team-mobile .t-podium__place--3 .t-podium__rank { color:var(--t-bronze); }
.team-mobile .t-podium .t-avatar { width:48px; height:48px; font-size:15px; margin:6px auto; }
.team-mobile .t-podium__name { font-size:12px; font-weight:700; }
.team-mobile .t-podium__bill { font-size:13px; font-weight:800; margin-top:2px; }
.team-mobile .t-podium__pct { font-size:11px; color:var(--t-muted); margin-top:2px; }

/* Donut + leyenda */
.team-mobile .t-donut { display:flex; align-items:center; gap:16px; padding:18px; margin-top:16px; }
.team-mobile .t-donut__chart { width:130px; height:130px; position:relative; flex-shrink:0; }
.team-mobile .t-donut__center { position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; }
.team-mobile .t-donut__total { font-size:15px; font-weight:800; }
.team-mobile .t-donut__caption { font-size:10px; color:var(--t-muted); }
.team-mobile .t-legend { flex:1; }
.team-mobile .t-legend__row { display:flex; align-items:center; justify-content:space-between;
  font-size:13px; padding:5px 0; }
.team-mobile .t-legend__dot { width:9px; height:9px; border-radius:50%; margin-right:8px; }
```

Snippets recharts:

```jsx
// Sparkline de KPI
<ResponsiveContainer width="100%" height={34}>
  <LineChart data={sparkData}>
    <Line type="monotone" dataKey="v" stroke="#7c5cfc" strokeWidth={2} dot={false} />
  </LineChart>
</ResponsiveContainer>

// Donut de aportes
<PieChart width={130} height={130}>
  <Pie data={topContrib} dataKey="value" innerRadius={44} outerRadius={62} paddingAngle={2} stroke="none">
    {topContrib.map((e,i)=><Cell key={i} fill={e.color} />)}
  </Pie>
</PieChart>
```

Colores de la leyenda/donut: 1° `#ec4899`, 2° `#34d399`, 3° `#6d4ae8` (o los que asignes por posición).

---

## CRITERIOS DE ACEPTACIÓN

- Las 2 pantallas se ven idénticas al mockup en ≤767px: pestaña de tarjetas de colaboradores (con KPIs y barra de ocupación) y pestaña de rendimiento (KPIs con sparklines, liquidación en filas-tarjeta, podio y donut).
- El escritorio (`TeamDesktop`, ≥768px) queda **exactamente igual que antes**.
- Cero endpoints nuevos: se reutilizan `/staff`, `/appointments`, `/workers/:id` y `staffStats`/`dashboardMetrics`.
- La tabla ancha de liquidación del escritorio se convierte en **filas-tarjeta** en móvil (nada de scroll horizontal en tablas).
- Editar/Eliminar colaborador funcionan (reutilizan `WorkerFormModal` y el delete existente).
- Botones ≥44px, inputs `font-size:16px`, todo respetando `safe-area-inset`.
- Sin scroll horizontal en el body.
```
