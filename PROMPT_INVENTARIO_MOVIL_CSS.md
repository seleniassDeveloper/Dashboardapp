# Prompt — Inicio del módulo Inventario para app móvil (AuraDash) con CSS detallado

> Copia todo y pásalo a tu asistente de código. Stack real: **React 19 + Vite + react-bootstrap + lucide-react + i18n**, con `useIsMobile` ya existente. NO se toca el backend: se reutilizan los endpoints que ya usa `InventoryView.jsx`.

---

## CONTEXTO Y REGLAS (no negociables)

Construyes la pantalla **Inicio** del Centro de Control de Inventario para móvil, idéntica al mockup: header oscuro con buscador + escáner, resumen general (2×2), alertas de stock, últimos movimientos y acciones rápidas.

Reglas:
1. **NO tocar el backend.** Reutiliza los endpoints existentes: `GET /inventory/dashboard` (KPIs + alertas), `GET /inventory/movements` (últimos movimientos), `GET /inventory/products`. El escáner reutiliza `BarcodeScanner` y `GET /mobile-scans/pending`.
2. **NO romper el escritorio.** Solo se monta cuando `useIsMobile()` es `true`; todo el CSS va scopeado bajo `.inv-mobile`. El `InventoryView` de escritorio queda intacto.
3. **Reutiliza la lógica** de `InventoryDashboard.jsx` (KPIs, alertas de stock bajo/vencimiento). Extráela a un hook `useInventoryDashboard` para compartir con el escritorio.

### Arquitectura / archivos

```
src/hooks/useInventoryDashboard.js                      → KPIs, alertas, movimientos
src/views/InventoryView.jsx                             → isMobile ? <InventoryMobile/> : <InventoryDesktop/>
src/components/inventory/mobile/InventoryMobile.jsx         → router de pantallas (Inicio/Catálogo/Lotes/Más)
src/components/inventory/mobile/InventoryHome.jsx           → ESTA pantalla
src/components/inventory/mobile/InventoryMobile.css         → todo el CSS scopeado
```

---

## DESIGN TOKENS (pega al inicio de InventoryMobile.css)

```css
.inv-mobile {
  --i-bg:#f6f5fb; --i-card:#fff; --i-border:#eeecf6; --i-shadow:0 2px 10px rgba(30,20,60,.04);
  --i-purple:#7c5cfc; --i-purple-600:#6d4ae8; --i-purple-soft:#ede9fe;
  --i-dark:#2b1c54;                 /* header oscuro */
  --i-dark-grad:linear-gradient(160deg,#3a2470 0%,#2b1c54 100%);
  --i-green:#10b981; --i-green-soft:#e7f7f0;
  --i-red:#ef4444; --i-red-soft:#fde8e8;
  --i-orange:#f59e0b; --i-orange-soft:#fff1dd;
  --i-amber:#eab308; --i-amber-soft:#fef9c3;
  --i-blue:#3b82f6; --i-blue-soft:#e6effe;
  --i-text:#1e1b2e; --i-muted:#8b8a99; --i-label:#5b5a68;
  --i-radius:18px;
  background:var(--i-bg); min-height:100vh; color:var(--i-text);
  font-family:-apple-system,"Segoe UI",Roboto,sans-serif;
  padding-bottom:calc(84px + env(safe-area-inset-bottom,0px));
}
.inv-mobile * { box-sizing:border-box; }
.inv-mobile .i-card { background:var(--i-card); border:1px solid var(--i-border);
  border-radius:var(--i-radius); box-shadow:var(--i-shadow); }
.inv-mobile .i-see { font-size:13px; color:var(--i-purple-600); font-weight:600; background:none; border:0; }
.inv-mobile .i-section { display:flex; align-items:center; justify-content:space-between; margin:22px 4px 12px; }
.inv-mobile .i-section h3 { font-size:18px; font-weight:800; margin:0; }
.inv-mobile .i-section__time { font-size:12px; color:var(--i-muted); }
```

---

## SECCIÓN 1 — Header oscuro (gradiente púrpura) con buscador + escáner

Fondo `--i-dark-grad`, texto blanco, esquinas inferiores redondeadas. Fila: menú (izq) + centro **"Inventario"** (bold) con subtítulo "Centro de Control ERP" + campana con punto (der). Debajo: buscador "Buscar insumos, lotes o códigos" (fondo blanco) + botón cuadrado púrpura con icono `ScanLine` (abre `BarcodeScanner`).

```css
.inv-mobile .i-header { background:var(--i-dark-grad); color:#fff;
  border-radius:0 0 24px 24px; padding:14px 16px 20px;
  padding-top:calc(14px + env(safe-area-inset-top,0px)); }
.inv-mobile .i-header__top { display:flex; align-items:center; justify-content:space-between; }
.inv-mobile .i-header__title { text-align:center; }
.inv-mobile .i-header__title b { font-size:19px; font-weight:800; display:block; }
.inv-mobile .i-header__title span { font-size:12px; opacity:.75; }
.inv-mobile .i-header__bell { position:relative; color:#fff; }
.inv-mobile .i-header__bell::after { content:""; position:absolute; top:-1px; right:-1px; width:8px; height:8px;
  border-radius:50%; background:var(--i-purple); border:1.5px solid var(--i-dark); }
.inv-mobile .i-searchrow { display:flex; gap:10px; margin-top:16px; }
.inv-mobile .i-search { flex:1; display:flex; align-items:center; gap:10px; background:#fff;
  border-radius:14px; padding:13px 16px; }
.inv-mobile .i-search input { border:0; outline:0; flex:1; font-size:16px; background:none; }
.inv-mobile .i-scan-btn { width:56px; border:0; border-radius:14px; background:var(--i-purple); color:#fff;
  display:flex; align-items:center; justify-content:center; }
```

## SECCIÓN 2 — Resumen General (grid 2×2)

Título "Resumen General" + hora ("Hoy, 9:41 AM"). Cuatro tarjetas (de `GET /inventory/dashboard`), cada una: icono en cuadro tintado + label + valor grande + sublínea:
- `Valor del inventario` · icono `Package` púrpura · **$2.350.480** · "↗ 8.3% vs mes anterior" (verde)
- `Insumos bajos` · icono `AlertTriangle` rojo · **14** · "Requieren atención" (rojo)
- `Próximos a vencer` · icono `CalendarClock` naranja · **7** · "En próximos 30 días"
- `Órdenes de compra` · icono `ShoppingCart` azul · **3** · "En curso"

```css
.inv-mobile .i-kpis { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:0 4px; }
.inv-mobile .i-kpi { padding:16px; border-radius:16px; background:#fff; border:1px solid var(--i-border);
  box-shadow:var(--i-shadow); }
.inv-mobile .i-kpi__icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center;
  justify-content:center; margin-bottom:12px; }
.inv-mobile .i-kpi__icon--purple { background:var(--i-purple-soft); color:var(--i-purple-600); }
.inv-mobile .i-kpi__icon--red    { background:var(--i-red-soft);    color:var(--i-red); }
.inv-mobile .i-kpi__icon--orange { background:var(--i-orange-soft); color:var(--i-orange); }
.inv-mobile .i-kpi__icon--blue   { background:var(--i-blue-soft);   color:var(--i-blue); }
.inv-mobile .i-kpi__label { font-size:13px; color:var(--i-label); }
.inv-mobile .i-kpi__value { font-size:22px; font-weight:800; margin:3px 0; }
.inv-mobile .i-kpi__sub { font-size:11px; color:var(--i-muted); }
.inv-mobile .i-kpi__sub--up  { color:var(--i-green); }
.inv-mobile .i-kpi__sub--warn { color:var(--i-red); }
```

## SECCIÓN 3 — Alertas de Stock

Título + "Ver todas". Tarjeta con filas (de las alertas del dashboard): icono triángulo tintado + nombre + subtexto (stock o vencimiento) + badge de severidad + chevron.
- `Shampoo Hidratante 1L` · "Stock actual: 2 unidades" · **Crítico** (rojo)
- `Coloración 7.1` · "Stock actual: 8 unidades" · **Bajo** (naranja)
- `Oxidante 20 Vol` · "Vence en 15 días" · **Vencer** (ámbar)

```css
.inv-mobile .i-alert { display:flex; align-items:center; gap:12px; padding:14px 16px;
  border-bottom:1px solid #f3f1f9; }
.inv-mobile .i-alert:last-child { border-bottom:0; }
.inv-mobile .i-alert__icon { width:38px; height:38px; border-radius:50%; display:flex; align-items:center;
  justify-content:center; flex-shrink:0; }
.inv-mobile .i-alert__icon--crit { background:var(--i-red-soft); color:var(--i-red); }
.inv-mobile .i-alert__icon--low  { background:var(--i-orange-soft); color:var(--i-orange); }
.inv-mobile .i-alert__icon--exp  { background:var(--i-amber-soft); color:var(--i-amber); }
.inv-mobile .i-alert__body { flex:1; min-width:0; }
.inv-mobile .i-alert__name { font-size:14px; font-weight:700; }
.inv-mobile .i-alert__sub { font-size:12px; color:var(--i-muted); }
.inv-mobile .i-alert__tag { font-size:13px; font-weight:700; display:flex; align-items:center; gap:4px; }
.inv-mobile .i-alert__tag--crit { color:var(--i-red); }
.inv-mobile .i-alert__tag--low  { color:var(--i-orange); }
.inv-mobile .i-alert__tag--exp  { color:var(--i-amber); }
```

## SECCIÓN 4 — Últimos movimientos

Título + "Ver todas". Tarjeta con filas (de `GET /inventory/movements`): icono circular con flecha (abajo verde = salida, arriba púrpura = entrada) + tipo + subtexto + cantidad (der, con signo) + hora.
- ↓ `Salida por servicio` · "Coloración + Corte" · **−80 ml** · Hoy, 9:30 AM
- ↓ `Salida por servicio` · "Botox Capilar" · **−20 ml** · Hoy, 9:15 AM
- ↑ `Entrada por compra` · "Proveedor: Belleza Pro" · **+10 unidades** (verde) · Ayer, 4:20 PM

```css
.inv-mobile .i-mov { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid #f3f1f9; }
.inv-mobile .i-mov:last-child { border-bottom:0; }
.inv-mobile .i-mov__icon { width:40px; height:40px; border-radius:50%; display:flex; align-items:center;
  justify-content:center; flex-shrink:0; }
.inv-mobile .i-mov__icon--out { background:var(--i-green-soft); color:var(--i-green); }
.inv-mobile .i-mov__icon--in  { background:var(--i-purple-soft); color:var(--i-purple-600); }
.inv-mobile .i-mov__body { flex:1; min-width:0; }
.inv-mobile .i-mov__type { font-size:14px; font-weight:700; }
.inv-mobile .i-mov__sub { font-size:12px; color:var(--i-muted); }
.inv-mobile .i-mov__right { text-align:right; }
.inv-mobile .i-mov__qty { font-size:14px; font-weight:800; }
.inv-mobile .i-mov__qty--in { color:var(--i-green); }
.inv-mobile .i-mov__time { font-size:11px; color:var(--i-muted); }
```

## SECCIÓN 5 — Acciones rápidas

Título + fila de 4 accesos: cada uno = cuadro tintado con icono + label debajo.
- `Escanear` (`ScanLine` púrpura) → abre `BarcodeScanner`
- `Añadir producto` (`Package` púrpura) → abre `ProductForm`
- `Nueva compra` (`ShoppingCart` azul) → abre `PurchaseOrders`
- `Ver reportes` (`FileText` naranja) → abre rentabilidad/dashboard

```css
.inv-mobile .i-quick { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:0 4px; }
.inv-mobile .i-quick__item { display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:14px 6px; border-radius:16px; background:#fff; border:1px solid var(--i-border);
  box-shadow:var(--i-shadow); }
.inv-mobile .i-quick__icon { width:44px; height:44px; border-radius:14px; display:flex; align-items:center;
  justify-content:center; }
.inv-mobile .i-quick__icon--purple { background:var(--i-purple-soft); color:var(--i-purple-600); }
.inv-mobile .i-quick__icon--blue   { background:var(--i-blue-soft);   color:var(--i-blue); }
.inv-mobile .i-quick__icon--orange { background:var(--i-orange-soft); color:var(--i-orange); }
.inv-mobile .i-quick__label { font-size:11px; font-weight:600; text-align:center; color:var(--i-label); }
```

## SECCIÓN 6 — Tab bar inferior (específica de inventario)

Inicio (activo) · Catálogo · **＋ FAB central** · Lotes · Más. El FAB abre menú de creación (producto/compra/movimiento). Reutiliza el patrón de la tab bar con FAB de los otros módulos.

---

## CRITERIOS DE ACEPTACIÓN

- La pantalla se ve idéntica al mockup en ≤767px: header oscuro con buscador+escáner, resumen 2×2, alertas, movimientos y acciones rápidas.
- El `InventoryView` de escritorio (≥768px) queda **exactamente igual que antes**.
- Cero endpoints nuevos: se reutilizan `/inventory/dashboard`, `/inventory/movements`, `/inventory/products`, `/mobile-scans/pending`.
- El escáner abre el `BarcodeScanner` existente (cámara del teléfono).
- Los colores de severidad de alertas (crítico/bajo/vencer) y de movimientos (entrada/salida) coinciden con el mockup.
- Botones ≥44px, inputs `font-size:16px`, header respetando `safe-area-inset-top`, tab bar respetando `safe-area-inset-bottom`; sin scroll horizontal en el body.
```
