# Rediseño funcional tipo app — AuraDash (solo front, sin tocar backend)

Este documento hace dos cosas: **(1)** inventaría todos los componentes que ya existen en tu panel y **(2)** propone cómo reorganizarlos en una experiencia tipo app móvil, reutilizando lo que ya tienes. No se modifica ni una ruta del backend: todo es capa de presentación (qué se muestra, cómo y cuándo).

---

## Parte 1 — Inventario de componentes que ya tienes

Tu front tiene ~25 vistas, ~60 componentes y varios gadgets. Los agrupo por función real, no por carpeta.

### A. Núcleo diario (lo que un dueño usa desde el teléfono)

| Módulo | Componentes existentes | Ruta |
|---|---|---|
| **Panel / Inicio** | `KPIWidget`, `RevenueWidget`, `UpcomingAppointmentsWidget`, `AttentionWidget`, `ActivityFeedWidget`, `CalendarWidget`, `SmartReports`, `DashboardGrid`, `WidgetRenderer`, `WidgetRegistry` | `/app` |
| **Agenda / Citas** | `AppointmentsCalendar`, `Agenda`, `AgendaTimeline`, `AgendaFilters`, `AgendaSummary`, `AppointmentCard`, `AppointmentModal`, `AppointmentItem`, `AppointmentsList`, `WorkerColumn`, `ScheduleBlock`, `ConfirmMoveModal` | `/app/calendar` |
| **Clientes / CRM** | `ClientsView`, `ClientModal`, `ClientDetailModal`, `ClientsABMModal`, `FinalizeServiceModal` | `/app/clients` |
| **Caja / Finanzas (diario)** | `FinanceDashboard`, `DailyCashClosing`, `OperationalExpenses` | `/app/finances` |
| **Servicios** | `ServicesView`, `ServiceModal`, `ServiceDetailModal` | `/app/services` |
| **Equipo** | `TeamView`, `WorkerModal`, `WorkerFormModal`, `WorkersABMModal` | `/app/team` |

### B. Gestión avanzada (escritorio principalmente; en móvil, versión ligera o solo lectura)

| Módulo | Componentes existentes | Nota móvil |
|---|---|---|
| **Finanzas avanzadas** | `BankReconciliation`, `FinancialAudit`, `FinancialReports`, `FinancialSimulator`, `SalaryManagement`, `ProfessionalProfitability`, `ServiceProfitability` | Pesado. En móvil: solo consulta, no edición. |
| **Inventario** (12 componentes) | `InventoryDashboard`, `BarcodeScanner`, `BatchControl`, `BranchInventory`, `ProductForm`, `PurchaseOrders`, `SupplierCRUD`, `StockMovementHistory`, `ServiceConsumptionRules`, `ProductProfitability`, `InventorySimulator`, `InventoryAIInsights` | Solo `BarcodeScanner` tiene sentido táctil; el resto → escritorio. |
| **Automatización** | `WorkflowBuilder`, `WorkflowCanvas`, `WorkflowInspector`, `WorkflowNode`, `WorkflowSimulator`, `AutomationsView`, `GoogleSheetsSyncView` | El canvas es drag & drop → **nunca en móvil**. Solo estado + toggles. |
| **Configuración** (14 componentes) | Todo `configurable-fields/*` (`ActiveModulesEditor`, `BookingSettings`, `FieldRegistryEditor`, `FormSchemaEditor`, `UsersPermissionsSettings`, `ConsentSettings`, etc.), `SettingsView`, `RolesPermissionsPage` | Config compleja → escritorio; en móvil solo lo básico (marca, notificaciones). |
| **Reportes / SLA / Marketing** | `SlaStatsView`, `ServiceSlaStatsView`, `MarketingView`, `TemplatesView`, `HistoryView` | Consulta en móvil. |
| **SuperAdmin** | `SuperAdminBillingView`, `SaaSMetricsGrid`, `SuperAdminModelSelector` | Solo tu rol; escritorio. |

### C. Transversales (viven en toda la app)

| Herramienta | Componente | Estado móvil |
|---|---|---|
| Layout | `DashboardLayout`, `TopBar`, `Sidebar` | Sidebar oculto en móvil ✅ |
| Navegación móvil | `MobileTabBar`, `MoreSheet` | Ya existen ✅ |
| Asistente IA | `AIChatFloating`, `AIChat`, `DynamicAIGadget` | Flotante, ideal para móvil ✅ |
| Búsqueda | `CommandPalette` (⌘K) | Es de teclado → en móvil usar buscador simple |
| **Vista profesional** | `ProfessionalMobileView` | **Ya construida para móvil** ✅ |
| Onboarding / Ayuda | `OnboardingView`, `HowItWorks`, `ManualView` | Reutilizables |

**Hallazgo clave:** ya tienes dos "modos" latentes en el código — el **dueño/admin** (panel completo) y el **profesional** (`ProfessionalMobileView`, pensado para el celular). El rediseño se apoya en esa distinción.

---

## Parte 2 — El rediseño tipo app

### Principio central: 2 usuarios, 1 código

- **Dueño/Admin** en el teléfono → app de gestión rápida (agendar, ver clientes, caja del día, KPIs).
- **Profesional** en el teléfono → su día de trabajo (sus citas + fotos), que ya tienes en `ProfessionalMobileView`.

En escritorio, ambos ven el panel completo de siempre. Nada de esto toca el backend.

### La estructura de la app (mantenemos tus 5 tabs)

Tu `MobileTabBar` ya define los 5 destinos correctos. Solo hay que llenar cada uno con una versión ligera:

```
┌─────────────────────────────────────────────┐
│  [Inicio] [Agenda] [Clientes] [Caja] [Más]   │  ← MobileTabBar (ya existe)
└─────────────────────────────────────────────┘
```

**1. Inicio (`/app`)** — resumen de un vistazo, no el dashboard de 843 líneas.
En móvil renderizar 1 columna con 3–4 tarjetas reutilizando widgets que ya tienes:
- `KPIWidget` → ingresos de hoy + citas de hoy (2 números grandes)
- `AttentionWidget` → "requiere atención" (cancelaciones, pagos pendientes)
- `UpcomingAppointmentsWidget` → próximas 3 citas
- Botón "Ver reporte completo" → abre `SmartReports` a pantalla completa (opcional)

**2. Agenda (`/app/calendar`)** — el trabajo del día.
- `AppointmentsCalendar` ya cambia a vista de día en móvil (línea 131). Mantener.
- FAB "+ Cita" → abre `AppointmentModal` (ya existe) a pantalla completa.
- Filtros (`AgendaFilters`) colapsados en un bottom-sheet, no en barra lateral.

**3. Clientes (`/app/clients`)** — lista de tarjetas (según `PLAN_CRM_MOVIL.md`).
- Tabla → tarjetas con Llamar/WhatsApp/Ver.
- FAB "+ Cliente" → `ClientModal`.
- Ficha → `ClientDetailModal` a pantalla completa.

**4. Caja (`/app/finances`)** — solo lo diario.
- Mostrar: ingresos del día, `DailyCashClosing`, botón rápido "+ Gasto" (`OperationalExpenses`).
- Ocultar en móvil: `BankReconciliation`, `FinancialAudit`, `FinancialReports`, `SalaryManagement`, simuladores. En su lugar, una tarjeta "Reportes avanzados → disponible en escritorio".

**5. Más (`MoreSheet`, ya existe)** — todo lo demás, estilo lista de ajustes iOS.
- Servicios, Equipo, Inventario, Automatización, Sheets, Flujos, Configuración.
- Los que no son aptos para móvil (Flujos con canvas) muestran una pantalla de solo lectura + "editar en escritorio".

### El patrón técnico (idéntico para las 5 tabs)

Cada vista decide su presentación con el hook que ya tienes, sin duplicar lógica de datos:

```jsx
const isMobile = useIsMobile();
return isMobile ? <XxxMobile {...datos} /> : <XxxDesktop {...datos} />;
```

Reglas transversales del rediseño (todas front):

1. **Tablas → tarjetas.** Ninguna `<Table>` en móvil (Clientes, Equipo, Servicios, Inventario).
2. **Modales → bottom-sheets a pantalla completa.** Tus modales de react-bootstrap ya lo permiten con `fullscreen="sm-down"`.
3. **FAB por tab** para la acción principal (crear cita, crear cliente, agregar gasto).
4. **Nada de drag & drop en móvil.** `WorkflowCanvas` se reemplaza por lista + toggles de solo lectura.
5. **Divulgación progresiva.** Cada pantalla móvil = una tarea. Lo avanzado se esconde detrás de "ver más" o "escritorio".
6. **Botones ≥44px, inputs con font 16px** (evita zoom en iOS), respetar `safe-area-inset`.
7. **Reutilizar el asistente IA flotante** (`AIChatFloating`) como acceso rápido en móvil.

### Qué se reutiliza vs qué se crea nuevo

| Acción | Detalle |
|---|---|
| ♻️ Reutilizar tal cual | Todos los modales (`AppointmentModal`, `ClientModal`, `ClientDetailModal`, `ServiceModal`, `WorkerModal`), los widgets (`KPIWidget`, `AttentionWidget`, `UpcomingAppointmentsWidget`), `AIChatFloating`, `MobileTabBar`, `MoreSheet`, `ProfessionalMobileView`, PWA. |
| 🔧 Envolver / adaptar | `AppointmentsCalendar` (pulir vista día), `DailyCashClosing`, `OperationalExpenses`, `FinanceDashboard` (recortar a lo diario). |
| ✨ Crear nuevo (ligero) | `ClientsMobile` + `ClientCard`, `InicioMobile` (composición de widgets en 1 columna), `CajaMobile`, wrappers `XxxMobile` para las tabs, hooks `useClients`/`useAppointments` para separar lógica. |
| 🚫 No llevar a móvil | `WorkflowCanvas`/`WorkflowBuilder` (drag&drop), inventario avanzado, config compleja, SuperAdmin billing → mostrar "usar en escritorio". |

---

## Parte 3 — Orden de implementación (front, incremental)

Cada paso deja la app funcionando; nada rompe el escritorio ni el backend.

1. **Fundaciones** — patrón `XxxMobile`/`XxxDesktop` + extraer lógica a hooks. Empezar por **Clientes** (ya tienes el plan detallado en `PLAN_CRM_MOVIL.md`).
2. **Agenda** — pulir la vista de día + FAB + filtros en sheet.
3. **Inicio** — componer `InicioMobile` con 3–4 widgets existentes en 1 columna.
4. **Caja** — recortar a lo diario, mandar lo avanzado a escritorio.
5. **Más** — convertir `MoreSheet` en menú tipo ajustes y poner pantallas de solo lectura para lo no-táctil.
6. **Pulido global** — modales full-screen, safe-area, `TopBar` móvil simplificada, tap targets.

### Cómo verificar en cada paso
- DevTools en 375px: sin tablas, sin scroll horizontal, FAB visible y no tapado.
- Escritorio ≥768px intacto (misma UI de siempre).
- Backend sin cambios: mismas llamadas al API, solo cambia el render.

---

## Resumen en una frase

No necesitas rediseñar el sistema: necesitas **envolver lo que ya tienes** en 5 pantallas móviles simples (una por tab), reutilizando modales y widgets, escondiendo lo avanzado en "Más" o en escritorio, y aplicando el patrón `isMobile ? Mobile : Desktop`. Cero backend, todo front.
