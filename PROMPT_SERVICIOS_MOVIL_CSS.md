# Prompt — Módulo Servicios (Gestión de catálogo) para app móvil (AuraDash) con CSS detallado

> Copia todo y pásalo a tu asistente de código. Stack real: **React 19 + Vite + react-bootstrap + lucide-react + i18n**, con `useIsMobile` ya existente. NO se toca el backend: se reutilizan los endpoints que ya usa `ServicesView.jsx`.

---

## CONTEXTO Y REGLAS (no negociables)

Construyes la pantalla **Servicios** para móvil, idéntica al mockup: header, buscador + filtros, KPIs, 4 pestañas (Catálogo / Reglas / SLA / Historial), acciones rápidas y lista de servicios. La pantalla mostrada es la pestaña **Catálogo**.

Reglas:
1. **NO tocar el backend.** Reutiliza los endpoints existentes: `GET /services`, `GET /workers`, `PATCH /services/:id/status`, `DELETE /services/:id`. SLA usa `/appointments/sla-service/stats`. Reglas de consumo usa `/inventory/rules`.
2. **NO romper el escritorio.** Solo se monta cuando `useIsMobile()` es `true`; todo el CSS va scopeado bajo `.svc-mobile`. El `ServicesView` de escritorio queda intacto.
3. **Reutiliza la lógica** de `ServicesView` (lista, filtros, toggle de estado) extrayéndola a un hook `useServices`. Los modales existentes se reutilizan: `ServiceModal` (crear/editar, 5 pestañas), `ServiceDetailModal` (ficha).

### Arquitectura / archivos

```
src/hooks/useServices.js                              → lista, filtros, KPIs, toggle status
src/views/ServicesView.jsx                            → isMobile ? <ServicesMobile/> : <ServicesDesktop/>
src/components/services/mobile/ServicesMobile.jsx        → contenedor + tabs
src/components/services/mobile/CatalogTab.jsx            → ESTA pantalla
src/components/services/mobile/ServiceCard.jsx           → tarjeta de servicio
src/components/services/mobile/ServicesMobile.css        → todo el CSS scopeado
```

`ServicesMobile` mantiene `activeTab` ("catalog" | "rules" | "sla" | "history").

---

## DESIGN TOKENS (pega al inicio de ServicesMobile.css)

```css
.svc-mobile {
  --s-bg:#f8f7fc; --s-card:#fff; --s-border:#eeecf6; --s-shadow:0 2px 10px rgba(30,20,60,.04);
  --s-purple:#7c5cfc; --s-purple-600:#6d4ae8; --s-purple-soft:#ede9fe;
  --s-green:#10b981; --s-green-soft:#e7f7f0;
  --s-orange:#f59e0b; --s-orange-soft:#fff1dd;
  --s-text:#1e1b2e; --s-muted:#8b8a99; --s-label:#5b5a68;
  --s-radius:16px;
  background:var(--s-bg); min-height:100vh; color:var(--s-text);
  font-family:-apple-system,"Segoe UI",Roboto,sans-serif;
  padding:0 16px calc(84px + env(safe-area-inset-bottom,0px));
}
.svc-mobile * { box-sizing:border-box; }
.svc-mobile .s-card { background:var(--s-card); border:1px solid var(--s-border);
  border-radius:var(--s-radius); box-shadow:var(--s-shadow); }
```

---

## SECCIÓN 1 — Header + buscador + filtros

Fila: menú (izq) + centro **"Servicios"** (bold, 19px) con subtítulo "Gestión de tu catálogo" + campana con punto (der). Debajo: buscador "Buscar servicios..." (ligado a `q`/`setQ` del hook) + botón **"Filtros"** (abre un bottom-sheet con los filtros de Categoría/Estado/Profesional/Reservas online).

```css
.svc-mobile .s-header { display:flex; align-items:center; justify-content:space-between; padding:16px 2px; }
.svc-mobile .s-header__title { text-align:center; }
.svc-mobile .s-header__title b { font-size:19px; font-weight:800; display:block; }
.svc-mobile .s-header__title span { font-size:13px; color:var(--s-muted); }
.svc-mobile .s-bell { position:relative; color:var(--s-text); }
.svc-mobile .s-bell::after { content:""; position:absolute; top:-1px; right:-1px; width:8px; height:8px;
  border-radius:50%; background:var(--s-purple); border:1.5px solid #fff; }
.svc-mobile .s-searchrow { display:flex; gap:10px; margin-bottom:16px; }
.svc-mobile .s-search { flex:1; display:flex; align-items:center; gap:10px; background:#fff;
  border:1px solid var(--s-border); border-radius:14px; padding:13px 16px; }
.svc-mobile .s-search input { border:0; outline:0; flex:1; font-size:16px; background:none; }
.svc-mobile .s-filters-btn { display:flex; align-items:center; gap:6px; background:#fff;
  border:1px solid var(--s-border); border-radius:14px; padding:0 16px; font-weight:600;
  color:var(--s-purple-600); font-size:14px; }
```

## SECCIÓN 2 — KPIs (carrusel horizontal de 4)

Scroll horizontal. Cada tarjeta: icono en cuadro tintado (centrado) + **valor grande** + label en 2 líneas.
- `36` · **Servicios activos** · icono `Scissors` púrpura
- `12` · **En reservas hoy** · icono `Clock` verde
- `4.8` · **Satisfacción promedio** · icono `Star` naranja
- `92%` · **SLA cumplido** · icono `TrendingUp` púrpura

```css
.svc-mobile .s-kpis { display:flex; gap:12px; overflow-x:auto; padding:2px; margin-bottom:8px; }
.svc-mobile .s-kpis::-webkit-scrollbar { display:none; }
.svc-mobile .s-kpi { flex:0 0 150px; padding:16px; border-radius:16px; background:#fff; text-align:center;
  border:1px solid var(--s-border); box-shadow:var(--s-shadow); }
.svc-mobile .s-kpi__icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center;
  justify-content:center; margin:0 auto 12px; }
.svc-mobile .s-kpi__icon--purple { background:var(--s-purple-soft); color:var(--s-purple-600); }
.svc-mobile .s-kpi__icon--green  { background:var(--s-green-soft);  color:var(--s-green); }
.svc-mobile .s-kpi__icon--orange { background:var(--s-orange-soft); color:var(--s-orange); }
.svc-mobile .s-kpi__value { font-size:24px; font-weight:800; }
.svc-mobile .s-kpi__label { font-size:12px; color:var(--s-label); margin-top:2px; line-height:1.25; }
```

## SECCIÓN 3 — Pestañas (Catálogo / Reglas / SLA / Historial)

Tabs con icono + texto; la activa subrayada en púrpura. Cambian `activeTab`.
- **Catálogo** (`LayoutGrid`) → lista de servicios (esta pantalla)
- **Reglas** (`SlidersHorizontal`) → reglas de consumo/comerciales (`/inventory/rules` + config del servicio)
- **SLA** (`Clock`) → métricas de SLA (`/appointments/sla-service/stats`)
- **Historial** (`FileText`) → historial de servicios

```css
.svc-mobile .s-tabs { display:flex; border-bottom:1px solid var(--s-border); margin-bottom:16px; }
.svc-mobile .s-tab { flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
  padding:12px 4px; font-size:13px; font-weight:600; color:var(--s-muted); background:none; border:0;
  border-bottom:2px solid transparent; }
.svc-mobile .s-tab--active { color:var(--s-purple-600); border-bottom-color:var(--s-purple); }
```

## SECCIÓN 4 — Acciones rápidas (grid de 4)

Cada acción = cuadro con icono púrpura + label en 2 líneas.
- `+` **Nuevo servicio** → abre `ServiceModal` (crear)
- `Barcode` **Escanear fórmula** → escáner para vincular insumos
- `Clock` **Ajustar tiempos** → editar duración/estimaciones SLA
- `BarChart3` **Ver SLA resumen** → pestaña SLA

```css
.svc-mobile .s-section-title { font-size:16px; font-weight:800; margin:8px 2px 12px; }
.svc-mobile .s-quick { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:8px; }
.svc-mobile .s-quick__item { display:flex; flex-direction:column; align-items:center; gap:10px;
  padding:16px 6px; border-radius:16px; background:#fff; border:1px solid var(--s-border); box-shadow:var(--s-shadow);
  color:var(--s-purple-600); }
.svc-mobile .s-quick__label { font-size:11px; font-weight:600; text-align:center; color:var(--s-label); line-height:1.2; }
```

## SECCIÓN 5 — Lista de servicios (`ServiceCard`)

Encabezado: **"Servicios ({N})"** + selector **"Ordenar: Nombre A-Z"**. Luego una tarjeta por servicio (de `GET /services`):
- Miniatura redonda (foto del servicio o color/inicial de fallback).
- Nombre (bold) + badge de categoría (púrpura suave).
- Fila de metadatos con iconos: **duración** (`Clock` + "90 min"), **precio** (`Diamond`/`Tag` + "$25.000").
- Fila inferior: avatar + profesional ("Selena S.") + **comisión** (`SlidersHorizontal` + "40% comisión").
- A la derecha: badge de estado (**Activo** verde / **Pausado** naranja) + chevron. Tap → `ServiceDetailModal`.

```css
.svc-mobile .s-list-head { display:flex; align-items:center; justify-content:space-between; margin:16px 2px 12px; }
.svc-mobile .s-list-head h3 { font-size:16px; font-weight:800; margin:0; }
.svc-mobile .s-sort { font-size:13px; color:var(--s-muted); display:flex; align-items:center; gap:4px; }

.svc-mobile .s-svc { display:flex; align-items:flex-start; gap:12px; padding:16px 4px;
  border-bottom:1px solid #f2f0f9; }
.svc-mobile .s-svc__img { width:56px; height:56px; border-radius:50%; object-fit:cover; flex-shrink:0;
  background:var(--s-purple-soft); }
.svc-mobile .s-svc__body { flex:1; min-width:0; }
.svc-mobile .s-svc__name { font-size:15px; font-weight:700; }
.svc-mobile .s-svc__meta { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:6px;
  font-size:13px; color:var(--s-label); }
.svc-mobile .s-svc__meta span { display:inline-flex; align-items:center; gap:4px; }
.svc-mobile .s-svc__meta svg { color:var(--s-muted); }
.svc-mobile .s-svc__cat { font-size:11px; font-weight:700; color:var(--s-purple-600);
  background:var(--s-purple-soft); padding:2px 8px; border-radius:999px; }
.svc-mobile .s-svc__pro { display:flex; align-items:center; gap:12px; margin-top:8px; font-size:13px; color:var(--s-label); }
.svc-mobile .s-svc__pro-av { width:22px; height:22px; border-radius:50%; object-fit:cover; }
.svc-mobile .s-svc__right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
.svc-mobile .s-badge { font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px; white-space:nowrap; }
.svc-mobile .s-badge--active { background:var(--s-green-soft); color:#047857; }
.svc-mobile .s-badge--paused { background:var(--s-orange-soft); color:#b45309; }
.svc-mobile .s-svc__chev { color:#cbd5e1; }
```

## SECCIÓN 6 — Tab bar inferior

Resumen · Agenda · **＋ FAB central** · Clientes · Más (reutiliza el patrón de la tab bar con FAB de los otros módulos). El FAB abre "Nuevo servicio".

---

## CRITERIOS DE ACEPTACIÓN

- La pantalla se ve idéntica al mockup en ≤767px: header, buscador+filtros, KPIs en carrusel, 4 pestañas, acciones rápidas y lista de servicios con badges de estado.
- El `ServicesView` de escritorio (≥768px) queda **exactamente igual que antes**.
- Cero endpoints nuevos: se reutilizan `/services`, `/workers`, `/services/:id/status`, `/appointments/sla-service/stats`, `/inventory/rules`.
- Crear/editar reutiliza `ServiceModal` (5 pestañas); la ficha reutiliza `ServiceDetailModal`.
- El toggle/estado del servicio se refleja con `PATCH` real; los badges Activo/Pausado coinciden con el mockup.
- Botones ≥44px, inputs `font-size:16px`, tab bar y FAB respetando `safe-area-inset`; sin scroll horizontal en el body (solo el carrusel de KPIs scrollea en X).
```
