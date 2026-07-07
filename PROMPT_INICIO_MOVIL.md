# Prompt — Construir la vista "Inicio" móvil de AuraDash (idéntica al template)

> Copia todo lo que sigue y pásalo a tu asistente de código (o úsalo como especificación). Está pensado para el stack real de AuraDash: **React 19 + Vite + react-bootstrap + lucide-react + recharts + framer-motion + i18n**, con el hook `useIsMobile` ya existente.

---

## CONTEXTO Y REGLAS (no negociables)

Estás trabajando en `dashboard-react/`. Debes construir la pantalla **Inicio** para móvil, idéntica al diseño de referencia, cumpliendo:

1. **NO tocar el backend.** Usa las mismas llamadas al API que ya existen (`api.get("/appointments")`, `api.get("/clients")`, etc.). Si un dato no existe aún, usa un placeholder y déjalo marcado con `// TODO: conectar dato real`.
2. **NO romper la vista de escritorio.** Todo el CSS nuevo va **scopeado bajo `.inicio-mobile`** y el componente solo se renderiza cuando `useIsMobile()` es `true`.
3. **Reutiliza lo que ya existe:** hook `useIsMobile` (`src/hooks/useIsMobile.js`), `AppointmentModal`, `ClientModal`, iconos de `lucide-react`, gráficos con `recharts` (ya instalado), animaciones con `framer-motion`.
4. Móvil = ancho ≤ 767px (el hook ya usa ese breakpoint).

### Integración (cómo montarlo sin afectar desktop)

En `src/views/DashboardView.jsx`, al inicio del render:

```jsx
import { useIsMobile } from "../hooks/useIsMobile";
import InicioMobile from "../components/dashboard/InicioMobile";

export default function DashboardView() {
  const isMobile = useIsMobile();
  if (isMobile) return <InicioMobile />;
  // ...resto del dashboard de escritorio SIN CAMBIOS...
}
```

Archivos a crear:
```
src/components/dashboard/InicioMobile.jsx
src/components/dashboard/InicioMobile.css
```

---

## DESIGN TOKENS (pega esto al inicio de InicioMobile.css)

```css
.inicio-mobile {
  /* Colores base */
  --im-bg: #f6f5fb;
  --im-card: #ffffff;
  --im-border: #efecf8;
  --im-shadow: 0 2px 12px rgba(30, 20, 60, 0.05);

  /* Púrpura principal (marca del template) */
  --im-purple: #7c5cfc;
  --im-purple-600: #6d4ae8;
  --im-purple-grad: linear-gradient(140deg, #7c5cfc 0%, #6a48e8 100%);
  --im-purple-soft: #ede9fe;

  /* Acentos */
  --im-pink: #ec4899;
  --im-pink-soft: #fce7f3;
  --im-amber: #f59e0b;
  --im-amber-soft: #fef3c7;
  --im-red: #ef4444;
  --im-red-soft: #fee2e2;
  --im-orange-soft: #ffedd5;
  --im-green: #10b981;
  --im-green-soft: #d1fae5;

  /* Texto */
  --im-text: #1e1b2e;
  --im-muted: #8b8a99;
  --im-label: #6b6a7b;

  /* Métricas */
  --im-radius: 20px;
  --im-radius-sm: 14px;
  --im-gap: 14px;

  background: var(--im-bg);
  min-height: 100vh;
  padding: 0 16px calc(96px + env(safe-area-inset-bottom, 0px));
  font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--im-text);
}
.inicio-mobile * { box-sizing: border-box; }
.inicio-mobile .im-card {
  background: var(--im-card);
  border: 1px solid var(--im-border);
  border-radius: var(--im-radius);
  box-shadow: var(--im-shadow);
}
.inicio-mobile .im-section-title {
  font-size: 17px; font-weight: 700; margin: 22px 2px 12px;
}
.inicio-mobile .im-pill-btn {
  background: var(--im-purple-soft); color: var(--im-purple-600);
  border: 0; border-radius: 999px; font-size: 12px; font-weight: 600;
  padding: 6px 14px;
}
```

---

## ESTRUCTURA Y ESPECIFICACIÓN POR SECCIÓN

El componente renderiza, en este orden vertical, dentro de `<div className="inicio-mobile">`:

### 1. Header (saludo)

```
[☰]  Hola, {nombre} 👋            [🔔²] [avatar]
     Lunes, 6 de Julio
```

- Izquierda: botón menú hamburguesa (`Menu` de lucide, 24px) que dispara el `MoreSheet` (o `onMenuClick`).
- Título `Hola, {user.displayName || "Xu"} 👋` — 20px, weight 800.
- Subtítulo: fecha actual formateada en español (`new Date().toLocaleDateString("es", {weekday:'long', day:'numeric', month:'long'})`), 13px, `--im-muted`.
- Derecha: campana con badge numérico púrpura (top-right), y avatar circular con iniciales sobre `--im-purple`.

```css
.im-header { display:flex; align-items:center; justify-content:space-between; padding:18px 2px 14px; }
.im-header__left { display:flex; align-items:center; gap:12px; }
.im-header__greet h1 { font-size:20px; font-weight:800; margin:0; line-height:1.1; }
.im-header__greet p { font-size:13px; color:var(--im-muted); margin:2px 0 0; text-transform:capitalize; }
.im-header__actions { display:flex; align-items:center; gap:14px; }
.im-bell { position:relative; color:var(--im-text); }
.im-bell__badge { position:absolute; top:-6px; right:-6px; background:var(--im-purple);
  color:#fff; font-size:10px; font-weight:700; min-width:16px; height:16px; border-radius:999px;
  display:flex; align-items:center; justify-content:center; padding:0 4px; }
.im-avatar { width:40px; height:40px; border-radius:50%; background:var(--im-purple);
  color:#fff; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; }
```

### 2. Barra de búsqueda + botón "+"

```
[🔍  Buscar cita, cliente o servicio…        ]  [ + ]
```

- Input redondeado con lupa a la izquierda; abre el buscador (o `CommandPalette` en su versión móvil).
- A la derecha, botón cuadrado redondeado púrpura con icono `Plus` (blanco) → abre menú de creación rápida (o `AppointmentModal`).

```css
.im-searchrow { display:flex; gap:10px; align-items:center; margin-bottom:6px; }
.im-search { flex:1; display:flex; align-items:center; gap:10px; background:#fff;
  border:1px solid var(--im-border); border-radius:16px; padding:13px 16px; box-shadow:var(--im-shadow); }
.im-search input { border:0; outline:0; flex:1; font-size:16px; background:none; color:var(--im-text); }
.im-search input::placeholder { color:#a5a4b3; }
.im-add-btn { width:52px; height:52px; border-radius:16px; border:0; background:var(--im-purple);
  color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(124,92,252,.4); }
```

### 3. KPIs (carrusel horizontal de 4 tarjetas)

Scroll horizontal. Cada tarjeta: icono en cuadro tintado (top-left), etiqueta pequeña, **valor grande**, sublabel, y **pill de tendencia** abajo.

Datos (4 tarjetas):
1. `Clientes Activos` · icono `Users` (tinte púrpura) · **12** · "Hoy (↑2)" · pill verde `↗ +5.2%`
2. `Cancelaciones Hoy` · icono `XCircle` (tinte rojo) · **1** · "Lun → Hoy 1" · pill rojo `↗ 100%`
3. `Ocupación` · icono `Percent` (tinte naranja) · **78%** · "Hoy" + mini anillo donut · pill verde `↗ +8.1%`
4. `Profesional Top` · icono `Award` (tinte rosa) · **María** · "65% de citas" · pill verde `↗ +12%`

```css
.im-kpis { display:flex; gap:12px; overflow-x:auto; padding:4px 2px 6px;
  scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; }
.im-kpis::-webkit-scrollbar { display:none; }
.im-kpi { flex:0 0 150px; scroll-snap-align:start; padding:16px; border-radius:var(--im-radius);
  background:#fff; border:1px solid var(--im-border); box-shadow:var(--im-shadow); }
.im-kpi__icon { width:38px; height:38px; border-radius:12px; display:flex; align-items:center;
  justify-content:center; margin-bottom:14px; }
.im-kpi__icon--purple { background:var(--im-purple-soft); color:var(--im-purple-600); }
.im-kpi__icon--red { background:var(--im-red-soft); color:var(--im-red); }
.im-kpi__icon--orange { background:var(--im-orange-soft); color:var(--im-amber); }
.im-kpi__icon--pink { background:var(--im-pink-soft); color:var(--im-pink); }
.im-kpi__label { font-size:12px; color:var(--im-label); font-weight:500; }
.im-kpi__value { font-size:26px; font-weight:800; margin:2px 0; line-height:1.1; }
.im-kpi__sub { font-size:11px; color:var(--im-muted); }
.im-kpi__trend { display:inline-flex; align-items:center; gap:3px; margin-top:10px;
  font-size:11px; font-weight:700; padding:4px 8px; border-radius:999px; }
.im-kpi__trend--up { background:var(--im-green-soft); color:#059669; }
.im-kpi__trend--down { background:var(--im-red-soft); color:#dc2626; }
```

### 4. Tarjeta "Agenda de Hoy" (gradiente púrpura, destacada)

Layout: header blanco sobre gradiente (icono `Calendar` + "Agenda de Hoy" + pill translúcido "Ver agenda"). Cuerpo en dos columnas: caja blanca de fecha (`LUN / 6 / JUL`) a la izquierda; a la derecha "Próximas citas" con timeline de 3 filas (hora · avatar · nombre + servicio · estado). Pie con 4 mini-stats.

Timeline (datos ejemplo):
- 10:00 · Camila Rodríguez · Coloración + Corte · badge "Confirmada"
- 12:30 · Valentina Pérez · Manicure Semipermanente · badge "Confirmada"
- 15:00 · Sofía Gómez · Brushing · badge "Pendiente" (ámbar)

Pie (4): `8 Citas hoy` · `6 Confirmadas` · `1 Pendientes` · `1 Sin seña` (cada uno con icono).

```css
.im-agenda { background:var(--im-purple-grad); border-radius:24px; padding:18px;
  color:#fff; margin-top:16px; box-shadow:0 10px 30px rgba(106,72,232,.35); }
.im-agenda__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.im-agenda__head h3 { font-size:16px; font-weight:700; margin:0; display:flex; align-items:center; gap:8px; }
.im-agenda__seeall { background:rgba(255,255,255,.2); color:#fff; border:0; border-radius:999px;
  font-size:12px; font-weight:600; padding:6px 14px; }
.im-agenda__body { display:flex; gap:16px; }
.im-agenda__date { background:#fff; color:var(--im-text); border-radius:16px; padding:14px 18px;
  text-align:center; flex-shrink:0; align-self:flex-start; }
.im-agenda__date .d-day { font-size:34px; font-weight:800; line-height:1; }
.im-agenda__date .d-wd, .im-agenda__date .d-mo { font-size:12px; font-weight:600; color:var(--im-muted); }
.im-agenda__list { flex:1; }
.im-agenda__list h4 { font-size:12px; opacity:.85; margin:0 0 10px; font-weight:600; }
.im-appt { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:13px; }
.im-appt__time { opacity:.85; width:44px; }
.im-appt__avatar { width:28px; height:28px; border-radius:50%; object-fit:cover; }
.im-appt__info { flex:1; min-width:0; }
.im-appt__name { font-weight:600; }
.im-appt__svc { font-size:11px; opacity:.75; }
.im-appt__badge { font-size:10px; font-weight:700; padding:3px 8px; border-radius:999px;
  background:rgba(255,255,255,.18); }
.im-appt__badge--pending { background:#fbbf24; color:#7c2d12; }
.im-agenda__stats { display:flex; justify-content:space-between; margin-top:16px;
  padding-top:14px; border-top:1px solid rgba(255,255,255,.18); }
.im-agenda__stat { display:flex; align-items:center; gap:6px; font-size:12px; }
.im-agenda__stat b { font-size:15px; }
```

### 5. Accesos Rápidos (fila de iconos)

Título "Accesos Rápidos" + fila con scroll horizontal de accesos: cada uno es un cuadro tintado púrpura con icono + label debajo.

Items: `Nueva Cita` (`CalendarPlus`), `Clientes` (`Users`), `Servicios` (`Scissors`), `Profesionales` (`User`), `Caja` (`Calculator`), `Reportes` (`BarChart3`), `Inventario` (`Package`). Cada uno navega a su ruta `/app/...` correspondiente.

```css
.im-quick { display:flex; gap:14px; overflow-x:auto; padding:2px; }
.im-quick::-webkit-scrollbar { display:none; }
.im-quick__item { flex:0 0 auto; display:flex; flex-direction:column; align-items:center;
  gap:8px; background:none; border:0; width:64px; }
.im-quick__icon { width:56px; height:56px; border-radius:18px; background:var(--im-purple-soft);
  color:var(--im-purple-600); display:flex; align-items:center; justify-content:center; }
.im-quick__label { font-size:11px; color:var(--im-label); font-weight:500; text-align:center; }
```

### 6. AI Copilot Insights

Tarjeta blanca: header (icono `Sparkles` + "AI Copilot Insights" + pill "Ver todas"). Caja interna suave con texto de insight en negrita + descripción, y una **mini área-chart (sparkline)** a la derecha. Link púrpura "Ver más insights →".

Texto ejemplo: **"Tus ingresos bajaron 18% esta semana"** / "en comparación con la anterior (debido al feriado de lunes)."

```css
.im-ai { padding:16px; margin-top:8px; }
.im-ai__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.im-ai__head h3 { font-size:15px; font-weight:700; margin:0; display:flex; gap:8px; align-items:center; }
.im-ai__head .ai-spark { color:var(--im-purple); }
.im-ai__box { background:linear-gradient(135deg,#f5f3ff,#faf9ff); border-radius:14px;
  padding:14px; display:flex; gap:12px; align-items:center; }
.im-ai__text { flex:1; }
.im-ai__text b { font-size:14px; }
.im-ai__text p { font-size:12px; color:var(--im-muted); margin:4px 0 0; }
.im-ai__spark { width:110px; height:48px; flex-shrink:0; }
.im-ai__more { color:var(--im-purple-600); font-size:13px; font-weight:600; margin-top:12px;
  display:inline-block; }
```

### 7. Requiere Atención (carrusel de 3 tarjetas)

Título + pill "Ver todo". Scroll horizontal de 3 tarjetas, cada una con icono tintado, título, sublabel, dato y chevron `>`:
1. `Clock` ámbar · "3 citas sin seña" · "Hoy" · "Total: $45.000"
2. `XCircle` rojo · "1 cancelación reciente" · "Hace 2h" · "Camila Rodríguez"
3. `Bell` púrpura · "2 recordatorios" · "Pendientes" · "Para hoy"

```css
.im-attn { display:flex; gap:12px; overflow-x:auto; padding:2px; }
.im-attn::-webkit-scrollbar { display:none; }
.im-attn__card { flex:0 0 78%; display:flex; align-items:center; gap:12px; padding:14px;
  border-radius:var(--im-radius-sm); background:#fff; border:1px solid var(--im-border); box-shadow:var(--im-shadow); }
.im-attn__icon { width:40px; height:40px; border-radius:12px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; }
.im-attn__body { flex:1; min-width:0; }
.im-attn__title { font-size:13px; font-weight:700; }
.im-attn__sub { font-size:11px; color:var(--im-muted); }
```

### 8. Dos gráficos (recharts)

**A. "Horas Pico de Reserva"** — `AreaChart` de recharts. Eje Y 0–100%, eje X horas 8→20. Relleno degradado púrpura translúcido, línea púrpura, con tooltip. Datos ejemplo por hora; pico marcado en 14:00 (95%).

**B. "Ventas por Servicio (Mix de Salón)"** — `PieChart` donut (innerRadius). Centro: "Total / $280.000 / Hoy". Leyenda a la derecha con colores:
- Coloración 40% (púrpura `#7c5cfc`)
- Corte 25% (violeta `#a78bfa`)
- Manicure 20% (rosa `#ec4899`)
- Brushing 15% (ámbar `#f59e0b`)

En móvil se apilan verticalmente (una debajo de la otra), cada una en su `im-card`.

```css
.im-chart { padding:16px; margin-top:12px; }
.im-chart h3 { font-size:14px; font-weight:700; margin:0 0 12px; }
.im-chart__wrap { width:100%; height:180px; }
.im-donut-legend { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
.im-donut-legend__row { display:flex; align-items:center; justify-content:space-between; font-size:13px; }
.im-donut-legend__dot { width:9px; height:9px; border-radius:50%; margin-right:8px; display:inline-block; }
```

Snippet recharts (área):

```jsx
<ResponsiveContainer width="100%" height={180}>
  <AreaChart data={horasData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
    <defs>
      <linearGradient id="imArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
      </linearGradient>
    </defs>
    <XAxis dataKey="hora" tickLine={false} axisLine={false} fontSize={11} stroke="#a5a4b3" />
    <YAxis tickFormatter={(v)=>`${v}%`} tickLine={false} axisLine={false} fontSize={11} stroke="#a5a4b3" />
    <Tooltip />
    <Area type="monotone" dataKey="valor" stroke="#7c5cfc" strokeWidth={2} fill="url(#imArea)" />
  </AreaChart>
</ResponsiveContainer>
```

Snippet recharts (donut):

```jsx
<PieChart width={140} height={140}>
  <Pie data={ventasData} dataKey="value" innerRadius={45} outerRadius={62}
       paddingAngle={2} stroke="none">
    {ventasData.map((e,i)=><Cell key={i} fill={e.color} />)}
  </Pie>
</PieChart>
```

### 9. Carga de Trabajo (Citas por Estilista)

Tarjeta con lista de 4 estilistas: avatar + nombre + barra de progreso púrpura + %.
Datos: María López 85%, Juan Pérez 60%, Lucía Torres 40%, Ana Gómez 25%.

```css
.im-load { padding:16px; margin-top:12px; }
.im-load h3 { font-size:14px; font-weight:700; margin:0 0 14px; }
.im-load__row { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.im-load__avatar { width:32px; height:32px; border-radius:50%; object-fit:cover; }
.im-load__info { flex:1; }
.im-load__name { font-size:13px; font-weight:600; margin-bottom:4px; }
.im-load__bar { height:6px; border-radius:999px; background:#eee; overflow:hidden; }
.im-load__fill { height:100%; background:var(--im-purple); border-radius:999px; }
.im-load__pct { font-size:12px; font-weight:700; color:var(--im-label); width:38px; text-align:right; }
```

### 10. Bottom Tab Bar con FAB central

El template muestra: **Inicio · Agenda · (＋ FAB central) · Clientes · Más**. Tu `MobileTabBar` actual tiene 5 tabs planos; hay que agregar el **botón central flotante circular púrpura**. Modifica `MobileTabBar.jsx` para insertar, entre Agenda y Clientes, un botón `+` elevado que abre el menú de creación rápida (o `AppointmentModal`).

```css
.mobile-tabbar__fab { width:56px; height:56px; border-radius:50%; background:var(--im-purple, #7c5cfc);
  color:#fff; border:0; display:flex; align-items:center; justify-content:center; margin-top:-24px;
  box-shadow:0 8px 20px rgba(124,92,252,.45); }
```

---

## DATOS: usa esto como estructura (conecta lo real donde puedas)

```js
// TODO: reemplazar por datos reales del API donde corresponda
const kpis = [
  { key:"activos", label:"Clientes Activos", value:"12", sub:"Hoy (↑2)", trend:"+5.2%", up:true, icon:"purple" },
  { key:"cancel", label:"Cancelaciones Hoy", value:"1", sub:"Lun → Hoy 1", trend:"100%", up:false, icon:"red" },
  { key:"ocup", label:"Ocupación", value:"78%", sub:"Hoy", trend:"+8.1%", up:true, icon:"orange", ring:78 },
  { key:"top", label:"Profesional Top", value:"María", sub:"65% de citas", trend:"+12%", up:true, icon:"pink" },
];
const horasData = [ {hora:8,valor:20},{hora:10,valor:55},{hora:12,valor:78},{hora:14,valor:95},
  {hora:16,valor:70},{hora:18,valor:45},{hora:20,valor:25} ];
const ventasData = [
  { name:"Coloración", value:40, color:"#7c5cfc" },
  { name:"Corte", value:25, color:"#a78bfa" },
  { name:"Manicure", value:20, color:"#ec4899" },
  { name:"Brushing", value:15, color:"#f59e0b" },
];
```

---

## CRITERIOS DE ACEPTACIÓN

- En ancho ≤767px se ve **idéntico al template**: header con saludo, búsqueda + botón `+`, KPIs en carrusel, tarjeta púrpura de agenda, accesos rápidos, AI insights, requiere atención, dos gráficos, carga de trabajo, y tab bar con FAB central.
- En ancho ≥768px el dashboard de escritorio queda **exactamente igual que antes** (el CSS `.inicio-mobile` no filtra nada fuera de su scope).
- Sin scroll horizontal en el body (solo los carruseles internos scrollean en X).
- Botones táctiles ≥44px, inputs con `font-size:16px`, FAB respetando `safe-area-inset-bottom`.
- Sin errores en consola; los gráficos usan `recharts` (ya instalado), iconos de `lucide-react`.
- Ninguna llamada nueva al backend; se reutilizan endpoints existentes.
```
