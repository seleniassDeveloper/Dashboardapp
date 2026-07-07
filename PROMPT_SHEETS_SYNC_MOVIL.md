# Prompt — Módulo "Sincronizador Google Sheets" para app móvil (AuraDash)

> Copia todo lo que sigue y pásalo a tu asistente de código. Stack real: **React 19 + Vite + react-bootstrap + lucide-react + framer-motion + i18n + xlsx**, con `useIsMobile` ya existente. El backend NO se toca: se reutilizan los endpoints que ya usa `GoogleSheetsSyncView.jsx`.

---

## CONTEXTO Y REGLAS (no negociables)

Debes construir la versión **móvil** del módulo Sincronizador, idéntica a las 9 pantallas de referencia, cumpliendo:

1. **NO tocar el backend.** Reutiliza exactamente los endpoints que ya usa la vista de escritorio:
   - `POST /google/fetch-sheet` → lee la planilla y devuelve pestañas + encabezados.
   - `POST /google/import` → ejecuta la importación.
   - `GET /google/import-history` → historial. `DELETE /google/import-history/:id` → revertir.
   - `POST /google/import-history` → guarda el registro.
   - Export: `GET /clients`, `/inventory/products`, `/appointments`, `/finances/expenses`.
2. **NO romper el escritorio.** El componente móvil solo se monta cuando `useIsMobile()` es `true`; todo el CSS va scopeado bajo `.sheets-mobile`.
3. **Reutiliza la lógica que ya existe** en `GoogleSheetsSyncView.jsx`: `autoDetectMappingsLocal`, `handleAssignSheetType`, `handleMapChange`, `handleToggleField`, `handleAddCustomField`, `handleFileUpload`, `parseCSV`, `handleAnalyze`, `executeRealSync`, `downloadTemplate`, `fetchLivePreview`, `triggerDownload`, `triggerGoogleSheetsPushSync`.

### Arquitectura recomendada (front)

Para no duplicar la lógica, **extráela primero a un hook** y que móvil y escritorio la consuman:

```
src/hooks/useSheetsSync.js              → TODA la lógica y estado (mover desde GoogleSheetsSyncView)
src/views/GoogleSheetsSyncView.jsx      → decide: isMobile ? <SheetsSyncMobile/> : <SheetsSyncDesktop/>
src/components/sheets/SheetsSyncMobile.jsx   → contenedor móvil (máquina de estados de pantallas)
src/components/sheets/SheetsSyncMobile.css
src/components/sheets/mobile/            → una pantalla por archivo (ver abajo)
```

El estado clave que ya existe y que el móvil reutiliza:
`activeDirection` (import/export), `importMethod` (google/file), `step` (1–4), `sheetUrl`, `sheetsData`, `activeSheetId`, `progress`, `statusText`, `summary` `{created, reused, failed, skippedDetails}`, `importHistory`.

El móvil es un **wizard de pantalla completa**: cada paso ocupa toda la pantalla (no acordeón como en escritorio) y se navega con un stepper superior + botón "Continuar" inferior fijo.

---

## DESIGN TOKENS (pega al inicio de SheetsSyncMobile.css)

```css
.sheets-mobile {
  --sm-bg:#f6f5fb; --sm-card:#fff; --sm-border:#efecf8; --sm-shadow:0 2px 12px rgba(30,20,60,.05);
  --sm-purple:#7c5cfc; --sm-purple-600:#6d4ae8; --sm-purple-soft:#ede9fe;
  --sm-green:#10b981; --sm-green-soft:#d1fae5; --sm-sheets:#0f9d58; --sm-sheets-soft:#e6f4ea;
  --sm-blue:#3b82f6; --sm-blue-soft:#dbeafe; --sm-red:#ef4444; --sm-red-soft:#fee2e2;
  --sm-amber:#f59e0b; --sm-amber-soft:#fef3c7;
  --sm-text:#1e1b2e; --sm-muted:#8b8a99; --sm-label:#6b6a7b;
  --sm-radius:18px; --sm-radius-sm:14px;
  background:var(--sm-bg); min-height:100vh; color:var(--sm-text);
  font-family:-apple-system,"Segoe UI",Roboto,sans-serif;
  padding:0 16px calc(150px + env(safe-area-inset-bottom,0px)); /* espacio para botón + tabbar */
}
.sheets-mobile * { box-sizing:border-box; }
.sheets-mobile .sm-card { background:var(--sm-card); border:1px solid var(--sm-border);
  border-radius:var(--sm-radius); box-shadow:var(--sm-shadow); }
/* Botón primario inferior fijo (Continuar / Conectar / Finalizar) */
.sheets-mobile .sm-cta { position:fixed; left:16px; right:16px;
  bottom:calc(76px + env(safe-area-inset-bottom,0px)); z-index:30;
  height:52px; border:0; border-radius:16px; background:var(--sm-purple); color:#fff;
  font-size:16px; font-weight:700; box-shadow:0 8px 20px rgba(124,92,252,.4); }
.sheets-mobile .sm-cta:disabled { opacity:.5; }
.sheets-mobile .sm-back { display:flex; align-items:center; color:var(--sm-purple-600); background:none; border:0; }
```

---

## PANTALLA POR PANTALLA

### Pantalla 1 — Inicio "Sincronizador" (`SyncHome`)

Header con menú + campana + avatar (igual que Inicio). Bloque de título: icono verde de Sheets en cuadro tintado + "Sincronizador" (28px, weight 800) + subtítulo "Portal bidireccional contable para importar, exportar y descargar archivos del salón."

**Toggle de dirección** (segmented control): `Importar (Entrada)` (activo púrpura, icono `Database`) / `Exportar y Sincronizar (Salida)` (icono `Download`). Controla `activeDirection`.

Sección **"Importar desde"** (2 tarjetas tipo lista con chevron):
- `Google Sheets Link` — icono Sheets verde — "Pega el link de tu planilla de Google Drive." → va a Pantalla 2 con `importMethod="google"`.
- `Subir Archivo Local` — icono `UploadCloud` púrpura — "Sube un archivo .xlsx o .csv desde tu dispositivo." → abre selector de archivo (`handleFileUpload`), `importMethod="file"`.

Sección **"Plantillas oficiales"** — "Descarga, completa y vuelve a importar." Fila de 4 tarjetas (Clientes, Servicios, Profesionales, Citas), cada una con icono Sheets verde + label + icono descarga → llama `downloadTemplate(tipo)`.

```css
.sm-hero { display:flex; gap:14px; align-items:flex-start; padding:16px 2px; }
.sm-hero__icon { width:60px; height:60px; border-radius:16px; background:var(--sm-sheets-soft);
  color:var(--sm-sheets); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.sm-hero h1 { font-size:26px; font-weight:800; margin:0; line-height:1.05; }
.sm-hero p { font-size:14px; color:var(--sm-muted); margin:8px 0 0; }
.sm-toggle { display:flex; gap:8px; background:#efecf8; border-radius:16px; padding:5px; margin:16px 0; }
.sm-toggle__btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px;
  border:0; background:none; padding:12px 8px; border-radius:12px; font-size:13px; font-weight:700; color:var(--sm-label); }
.sm-toggle__btn--active { background:var(--sm-purple); color:#fff; box-shadow:0 4px 12px rgba(124,92,252,.35); }
.sm-source-card { display:flex; align-items:center; gap:14px; padding:16px; margin-bottom:12px; }
.sm-source-card__icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.sm-source-card__body { flex:1; }
.sm-source-card__body b { font-size:15px; }
.sm-source-card__body span { display:block; font-size:12px; color:var(--sm-muted); margin-top:2px; }
.sm-templates { display:flex; gap:12px; overflow-x:auto; padding:2px; }
.sm-templates::-webkit-scrollbar { display:none; }
.sm-template { flex:0 0 88px; display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:16px 8px; border-radius:14px; background:#fff; border:1px solid var(--sm-border); }
.sm-template__icon { width:40px; height:40px; border-radius:10px; background:var(--sm-sheets-soft);
  color:var(--sm-sheets); display:flex; align-items:center; justify-content:center; }
.sm-template__label { font-size:12px; font-weight:600; }
```

### Pantalla 2 — Selecciona origen (`SelectSource`)

Header: back + "Selecciona origen" + icono ayuda `HelpCircle`. Toggle `Google Sheets` / `Archivo Local` (controla `importMethod`).

Tarjeta central: icono link púrpura en círculo, "Pega el link de tu Google Sheet" (bold), texto "Asegúrate de que el acceso esté configurado como 'Cualquier persona con el enlace puede ver'." + input de URL (`sheetUrl`) con placeholder `https://docs.google.com/spreadsheets/d/...` + botón **"Conectar"** que dispara `handleAnalyze` (→ `POST /google/fetch-sheet`).

Caja informativa inferior (fondo lila suave): icono escudo `ShieldCheck` + "Tu información está 100% segura / Solo importamos los datos que autorizas."

```css
.sm-connect { padding:22px 18px; text-align:center; margin-top:8px; }
.sm-connect__icon { width:64px; height:64px; border-radius:50%; background:var(--sm-purple-soft);
  color:var(--sm-purple-600); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
.sm-connect h3 { font-size:17px; font-weight:800; margin:0 0 6px; }
.sm-connect p { font-size:13px; color:var(--sm-muted); margin:0 0 16px; }
.sm-connect input { width:100%; border:1px solid var(--sm-border); border-radius:12px;
  padding:14px; font-size:16px; margin-bottom:12px; background:#faf9ff; }
.sm-connect__btn { width:100%; height:50px; border:0; border-radius:14px; background:var(--sm-purple);
  color:#fff; font-weight:700; font-size:15px; }
.sm-secure { display:flex; align-items:center; gap:12px; background:var(--sm-purple-soft);
  border-radius:14px; padding:14px; margin-top:16px; }
.sm-secure b { font-size:13px; color:var(--sm-purple-600); }
.sm-secure span { display:block; font-size:12px; color:var(--sm-label); }
```

### Stepper (compartido por pantallas 3–7)

Barra superior con 4 puntos: `1 Origen · 2 Mapear · 3 Revisar · 4 Importar`. El punto activo va relleno de púrpura, los completados con check, los futuros en gris. Refleja `step`.

```css
.sm-stepper { display:flex; align-items:center; justify-content:space-between; padding:16px 8px 20px; }
.sm-stepper__step { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; position:relative; }
.sm-stepper__dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center;
  justify-content:center; font-size:12px; font-weight:700; background:#e6e3f2; color:var(--sm-muted); z-index:2; }
.sm-stepper__dot--active { background:var(--sm-purple); color:#fff; }
.sm-stepper__dot--done { background:var(--sm-purple); color:#fff; }
.sm-stepper__label { font-size:11px; color:var(--sm-muted); }
.sm-stepper__label--active { color:var(--sm-purple-600); font-weight:700; }
.sm-stepper__line { position:absolute; top:14px; left:50%; width:100%; height:2px; background:#e6e3f2; z-index:1; }
.sm-stepper__line--done { background:var(--sm-purple); }
```

### Pantalla 3 — Paso 1: Origen / pestañas detectadas (`StepSource`)

Bajo el stepper: tarjeta "Google Sheet conectada / {nombre archivo} / {N} pestañas encontradas" (icono Sheets + link). Título "Pestañas detectadas" y lista de `sheetsData`: cada fila = nombre de pestaña + badge (`Sugerido` verde si autodetectada, `Sin asignar` gris) + chevron → abre selector de tipo (`handleAssignSheetType`). Botón fijo "Continuar" → `step=2`.

```css
.sm-connected { display:flex; align-items:center; gap:12px; padding:16px; margin-bottom:18px; }
.sm-connected b { font-size:14px; } .sm-connected span { font-size:12px; color:var(--sm-muted); }
.sm-tab-row { display:flex; align-items:center; justify-content:space-between; padding:16px;
  background:#fff; border:1px solid var(--sm-border); border-radius:14px; margin-bottom:10px; }
.sm-tab-row__name { font-weight:600; font-size:14px; }
.sm-badge { font-size:11px; font-weight:700; padding:4px 10px; border-radius:999px; }
.sm-badge--ok { background:var(--sm-green-soft); color:#059669; }
.sm-badge--none { background:#f0eef7; color:var(--sm-muted); }
```

### Pantalla 4 — Paso 2: Mapear columnas (`StepMap`)

"Mapea las columnas / Pestaña: {tipo}". Encabezados "Tu columna" / "Campo en AuraDash". Por cada encabezado del sheet, una fila: nombre de la columna origen (fijo) → **dropdown** para elegir el campo destino de AuraDash (o "Ignorar"). Usa `handleMapChange`. Los campos se autollenan con `autoDetectMappingsLocal`. Link inferior "+ Agregar campo personalizado" → `handleAddCustomField`. Botón "Continuar" → `step=3`.

```css
.sm-map-head { display:flex; justify-content:space-between; font-size:12px; color:var(--sm-muted);
  font-weight:600; padding:0 4px 8px; }
.sm-map-row { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.sm-map-row__src { flex:1; padding:12px; background:#f4f2fb; border-radius:12px; font-size:14px; font-weight:600; }
.sm-map-row__arrow { color:var(--sm-muted); flex-shrink:0; }
.sm-map-row__dst { flex:1; }
.sm-map-row__dst select { width:100%; padding:12px; border:1px solid var(--sm-border);
  border-radius:12px; font-size:14px; background:#fff; }
.sm-add-field { display:block; text-align:center; color:var(--sm-purple-600); font-weight:600;
  font-size:14px; margin-top:8px; }
```

### Pantalla 5 — Paso 3: Revisar (`StepReview`)

"Revisa los datos / Vista previa (primeras 5 filas)". Tabla compacta con scroll horizontal (Nombre, Teléfono, Email…) con las primeras filas parseadas. Debajo, **"Resumen estimado"** en tarjeta: `{summary.created} Se crearán` (verde), `{summary.reused} Se actualizarán` (azul), `{summary.failed} Con errores` (rojo), cada uno con su punto de color. Botón "Continuar" → dispara `executeRealSync` y pasa a `step=4`.

```css
.sm-preview { overflow-x:auto; padding:14px; }
.sm-preview table { width:100%; font-size:12px; border-collapse:collapse; }
.sm-preview th { text-align:left; color:var(--sm-muted); font-weight:600; padding:6px 10px; white-space:nowrap; }
.sm-preview td { padding:8px 10px; border-top:1px solid #f2f0f9; white-space:nowrap; }
.sm-summary { padding:16px; margin-top:14px; }
.sm-summary__row { display:flex; align-items:center; gap:10px; padding:8px 0; font-size:14px; }
.sm-summary__dot { width:9px; height:9px; border-radius:50%; }
.sm-summary__row b { margin-left:auto; font-weight:800; }
```

### Pantalla 6 — Paso 4: Importando (`StepImporting`)

"Importando datos... / Por favor no cierres la aplicación." **Donut de progreso circular grande** en el centro con `{progress}%` y "Procesando {x} de {y} pestañas". Debajo, lista de pestañas con barra: la activa muestra `120/200` con barra púrpura; las demás "Pendiente". Sin botón (avanza solo al completar `executeRealSync`). El donut se hace con SVG (círculo con `stroke-dasharray`) o un `PieChart` de recharts.

```css
.sm-importing { text-align:center; padding-top:20px; }
.sm-importing h3 { font-size:18px; font-weight:800; }
.sm-importing p { font-size:13px; color:var(--sm-muted); }
.sm-donut { width:180px; height:180px; margin:24px auto; position:relative; }
.sm-donut__pct { position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; }
.sm-donut__pct b { font-size:34px; font-weight:800; }
.sm-donut__pct span { font-size:12px; color:var(--sm-muted); }
.sm-prog-row { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
.sm-prog-row__name { font-size:13px; font-weight:600; width:90px; text-align:left; }
.sm-prog-row__bar { flex:1; height:6px; background:#eee; border-radius:999px; overflow:hidden; }
.sm-prog-row__fill { height:100%; background:var(--sm-purple); }
.sm-prog-row__val { font-size:12px; color:var(--sm-muted); width:60px; text-align:right; }
```

Donut SVG de referencia:
```jsx
const R=80, C=2*Math.PI*R;
<svg viewBox="0 0 180 180" className="sm-donut__svg">
  <circle cx="90" cy="90" r={R} fill="none" stroke="#ede9fe" strokeWidth="12"/>
  <circle cx="90" cy="90" r={R} fill="none" stroke="#7c5cfc" strokeWidth="12"
    strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-progress/100)}
    transform="rotate(-90 90 90)"/>
</svg>
```

### Pantalla 7 — Completado (`StepDone`)

Stepper con los 4 checks. "¡Importación completada! / Tu información se ha importado correctamente." Tarjeta resumen con `{created} Creados` (verde ✓), `{reused} Actualizados` (azul), `{failed} Con errores` (rojo ⚠). Botón secundario "Ver detalles" (abre modal con `summary.skippedDetails`), botón primario "Finalizar" (resetea el wizard → `step=1`). Tip inferior en caja lila: "Revisa los errores para completar tu importación sin problemas."

```css
.sm-done { text-align:center; padding-top:8px; }
.sm-done__check { width:64px; height:64px; border-radius:50%; background:var(--sm-green-soft);
  color:var(--sm-green); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
.sm-result { padding:8px 16px; margin:16px 0; }
.sm-result__row { display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid #f2f0f9; }
.sm-result__row:last-child { border-bottom:0; }
.sm-result__icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
.sm-result__num { font-size:20px; font-weight:800; }
.sm-result__label { color:var(--sm-label); font-size:14px; }
.sm-tip { display:flex; gap:10px; background:var(--sm-purple-soft); border-radius:14px;
  padding:14px; font-size:13px; color:var(--sm-label); margin-top:14px; }
```

### Pantalla 8 — Historial de importaciones (`ImportHistory`)

Header: back + "Historial de importaciones" + ayuda. Filtro dropdown "Todos los estados" (filtra por completado / con errores). Lista desde `GET /google/import-history`: cada fila = icono según formato (xlsx verde / csv rojo) + nombre archivo + badge estado (`Completado` verde / `Con errores` rojo) + fecha/hora + resumen "X creados + Y actualizados + Z errores" + chevron → abre detalle (y opción de revertir vía `DELETE /google/import-history/:id`).

```css
.sm-hist-filter { display:inline-flex; align-items:center; gap:8px; background:#fff;
  border:1px solid var(--sm-border); border-radius:999px; padding:8px 14px; font-size:13px;
  font-weight:600; margin-bottom:14px; }
.sm-hist-row { display:flex; align-items:center; gap:12px; padding:14px; background:#fff;
  border:1px solid var(--sm-border); border-radius:14px; margin-bottom:10px; }
.sm-hist-row__icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center;
  justify-content:center; flex-shrink:0; }
.sm-hist-row__icon--xlsx { background:var(--sm-sheets-soft); color:var(--sm-sheets); }
.sm-hist-row__icon--csv { background:var(--sm-red-soft); color:var(--sm-red); }
.sm-hist-row__body { flex:1; min-width:0; }
.sm-hist-row__top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.sm-hist-row__name { font-size:14px; font-weight:700; }
.sm-hist-row__meta { font-size:11px; color:var(--sm-muted); margin-top:4px; }
```

### Pantalla — Exportar (Salida)

Cuando `activeDirection === "export"`, en vez del wizard mostrar: selector de tipo (`Clientes / Inventario / Citas / Gastos` → `exportType`), selección de columnas (chips toggleables → `handleColumnToggle`), formato (`XLS / CSV / JSON` → `exportFormat`), vista previa (`fetchLivePreview` / `livePreview`), y dos botones: "Descargar" (`triggerDownload`) y "Sincronizar a Google Sheets" (`triggerGoogleSheetsPushSync`). Reutiliza los mismos estilos de tarjetas y chips.

---

## NAVEGACIÓN ENTRE PANTALLAS

`SheetsSyncMobile` mantiene un estado `screen` ("home" | "source" | "wizard" | "export" | "history") además del `step` del wizard. Transiciones con `framer-motion` (slide horizontal). El botón back del header retrocede de pantalla; en el wizard, retrocede de `step`.

La tab bar inferior (Inicio · Agenda · ＋ · Clientes · Más) permanece visible en todas las pantallas (este módulo se abre desde "Más").

---

## CRITERIOS DE ACEPTACIÓN

- Las 9 pantallas se ven idénticas al mockup en ≤767px: inicio, selecciona origen, wizard de 4 pasos (origen/pestañas → mapear → revisar → importando → completado) e historial.
- El escritorio (`SheetsSyncDesktop`, ≥768px) queda **exactamente igual que antes**.
- Cero endpoints nuevos: se reutilizan `fetch-sheet`, `import`, `import-history` y los de export.
- El stepper refleja `step`; el donut refleja `progress`; el resumen refleja `summary`.
- Botones ≥44px, inputs `font-size:16px`, CTA inferior fijo respetando `safe-area-inset` y sin tapar la tab bar.
- Sin scroll horizontal en el body (solo la tabla de preview y los carruseles scrollean en X).
- Nada de mapeo con drag&drop: en móvil el mapeo es con dropdowns (como en el mockup).
```
