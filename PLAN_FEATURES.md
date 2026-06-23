# Plan de Features por Tier — AuraDash

> Documento para revisión antes de implementar el gating.
> ✅ = Incluido | 🔒 = Bloqueado (muestra pantalla de upgrade) | ➖ = No aplica

---

## RESUMEN EJECUTIVO

| Plan | Precio sugerido | Usuarios | Sucursales |
|------|----------------|----------|------------|
| **Starter** | ARS $19.000/mes | Hasta 3 | 1 |
| **Pro** | ARS $49.000/mes | Hasta 10 | Hasta 3 |
| **Business** | ARS $99.000/mes | Ilimitados | Ilimitadas |

---

## 1. PANEL DE CONTROL (Dashboard)

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| KPIs: Facturación, Comisiones, Gastos, Ganancia neta | ✅ | ✅ | ✅ |
| Gráfico de facturación (últimos 30 días) | ✅ | ✅ | ✅ |
| Gráfico de métodos de pago | ✅ | ✅ | ✅ |
| Agenda rápida del día | ✅ | ✅ | ✅ |
| Widgets personalizables (drag & drop) | ✅ | ✅ | ✅ |
| KPI Productos críticos de stock | 🔒 PRO | ✅ | ✅ |
| Análisis histórico extendido (+90 días) | 🔒 PRO | ✅ | ✅ |
| Sugerencias IA (días vacíos, clientes fugados) | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 2. AGENDA / CALENDARIO

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Calendario con vistas día/semana/mes | ✅ | ✅ | ✅ |
| Crear / editar / cancelar citas | ✅ | ✅ | ✅ |
| Cobrar desde la cita (método de pago) | ✅ | ✅ | ✅ |
| Buscador de huecos libres | ✅ | ✅ | ✅ |
| Lista de espera | ✅ | ✅ | ✅ |
| Filtro por profesional / sucursal | ✅ | ✅ | ✅ |
| Enviar recordatorio WhatsApp manual desde la cita | ✅ | ✅ | ✅ |
| Historial de turnos | ✅ | ✅ | ✅ |
| Bloqueo de horarios del profesional | ✅ | ✅ | ✅ |
| Señas / depósito anticipado | 🔒 PRO | ✅ | ✅ |
| Calendario multi-sucursal simultáneo | 🔒 PRO | ✅ | ✅ |

---

## 3. CLIENTES / CRM

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Directorio de clientes (ver, crear, editar) | ✅ | ✅ | ✅ |
| Buscador en tiempo real | ✅ | ✅ | ✅ |
| Ficha técnica (fórmulas, alergias, notas) | ✅ | ✅ | ✅ |
| Historial de visitas | ✅ | ✅ | ✅ |
| Estadísticas del cliente (ticket, servicios favoritos) | ✅ | ✅ | ✅ |
| Etiquetas de estado (activo, inactivo, en riesgo) | ✅ | ✅ | ✅ |
| Exportar base de clientes (Excel/CSV) | ✅ | ✅ | ✅ |
| Galería Antes y Después | 🔒 PRO | ✅ | ✅ |
| Control de consentimiento de marketing/privacidad | 🔒 PRO | ✅ | ✅ |
| Segmentación avanzada (filtros múltiples) | 🔒 PRO | ✅ | ✅ |
| Detección automática de clientes fugados (IA) | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 4. SERVICIOS

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Catálogo de servicios (CRUD) | ✅ | ✅ | ✅ |
| Categorías, duración, precio | ✅ | ✅ | ✅ |
| Color de visualización en agenda | ✅ | ✅ | ✅ |
| Habilitación por sucursal | ✅ | ✅ | ✅ |
| Reglas de consumo de insumos | 🔒 PRO | ✅ | ✅ |
| Rentabilidad por servicio (margen de ganancia) | 🔒 PRO | ✅ | ✅ |

---

## 5. EQUIPO / PERSONAL

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Alta / edición de colaboradores | ✅ | ✅ | ✅ |
| Horarios semanales por profesional | ✅ | ✅ | ✅ |
| Indicadores básicos de desempeño | ✅ | ✅ | ✅ |
| Asignación a sucursal | ✅ | ✅ | ✅ |
| Liquidación de comisiones | 🔒 PRO | ✅ | ✅ |
| Registro de pago de comisiones | 🔒 PRO | ✅ | ✅ |
| Rentabilidad por profesional | 🔒 PRO | ✅ | ✅ |
| Roles y permisos (RBAC personalizado) | 🔒 PRO | ✅ | ✅ |

---

## 6. FINANZAS ⚠️ (Módulo presente en todos, con sub-features bloqueadas)

> El acceso al módulo de Finanzas está disponible en todos los planes.
> Las pestañas avanzadas se bloquean individualmente dentro del módulo.

| Feature / Pestaña | Starter | Pro | Business |
|-------------------|---------|-----|----------|
| **Resumen financiero** (dashboard básico) | ✅ Solo 30 días | ✅ Histórico completo | ✅ |
| **Gastos operativos** (ver y registrar gastos) | ✅ | ✅ | ✅ |
| **Caja diaria** (apertura, cierre, arqueo) | ✅ | ✅ | ✅ |
| **Historial de gastos** (ver, filtrar) | ✅ | ✅ | ✅ |
| Exportar gastos / reportes a Excel | 🔒 PRO | ✅ | ✅ |
| **Sueldos y Liquidaciones** | 🔒 PRO | ✅ | ✅ |
| **Rentabilidad por Servicio** | 🔒 PRO | ✅ | ✅ |
| **Rentabilidad por Profesional** | 🔒 PRO | ✅ | ✅ |
| **Conciliación Bancaria** | 🔒 PRO | ✅ | ✅ |
| **Simulador Financiero** | 🔒 PRO | ✅ | ✅ |
| **Reportes descargables** (PDF / Excel) | 🔒 PRO | ✅ | ✅ |
| **Auditoría Contable** (log de movimientos) | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 7. INVENTARIO ERP

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Módulo completo visible | 🔒 PRO | ✅ | ✅ |
| Catálogo de stock (CRUD) | 🔒 PRO | ✅ | ✅ |
| Control de lotes FIFO | 🔒 PRO | ✅ | ✅ |
| Alertas de stock crítico | 🔒 PRO | ✅ | ✅ |
| Órdenes de reposición | 🔒 PRO | ✅ | ✅ |
| Directorio de proveedores | 🔒 PRO | ✅ | ✅ |
| Reglas de consumo automático por servicio | 🔒 PRO | ✅ | ✅ |
| Dashboard de valorización de stock | 🔒 PRO | ✅ | ✅ |
| Exportar inventario a Excel | 🔒 PRO | ✅ | ✅ |
| Predicción de quiebre de stock (IA) | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 8. AUTOMATIZACIONES ⚠️ (Disponible en todos, con triggers/acciones limitados)

> El módulo de automatizaciones está presente en todos los planes.
> En Starter se incluyen las automatizaciones esenciales (recordatorios).

| Trigger / Acción | Starter | Pro | Business |
|-----------------|---------|-----|----------|
| **Trigger: Cita confirmada** → Recordatorio WhatsApp/Email | ✅ | ✅ | ✅ |
| **Trigger: Cita cancelada** → Notificación cliente | ✅ | ✅ | ✅ |
| **Trigger: Cita finalizada** → Mensaje de gracias | ✅ | ✅ | ✅ |
| **Acción: Enviar WhatsApp** | ✅ | ✅ | ✅ |
| **Acción: Enviar Email** | ✅ | ✅ | ✅ |
| **Trigger: Cumpleaños del cliente** → Cupón / Saludo | 🔒 PRO | ✅ | ✅ |
| **Trigger: Cliente inactivo** → Campaña de retención | 🔒 PRO | ✅ | ✅ |
| **Trigger: Pago recibido** → Confirmación automática | 🔒 PRO | ✅ | ✅ |
| **Trigger: Stock bajo** → Alerta al dueño | 🔒 PRO | ✅ | ✅ |
| **Historial de ejecuciones** (logs) | 🔒 PRO | ✅ | ✅ |
| **Acción: Notificar profesional** (push/WA) | 🔒 PRO | ✅ | ✅ |
| **Constructor visual de workflows** | 🔒 PRO | ✅ | ✅ |
| **Trigger: Webhook externo** (n8n, Zapier, etc.) | 🔒 BIZ | 🔒 BIZ | ✅ |
| **IA: Sugerencias automáticas de campañas** | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 9. GOOGLE SHEETS / SINCRONIZADOR ⚠️ (Export en todos, Import desde Pro)

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| **Exportar** clientes a Excel/Sheets | ✅ | ✅ | ✅ |
| **Exportar** citas a Excel/Sheets | ✅ | ✅ | ✅ |
| **Exportar** gastos a Excel/Sheets | ✅ | ✅ | ✅ |
| **Exportar** inventario a Excel/Sheets | 🔒 PRO | ✅ | ✅ |
| **Importar** clientes desde Google Sheets/CSV | 🔒 PRO | ✅ | ✅ |
| **Importar** servicios desde Google Sheets/CSV | 🔒 PRO | ✅ | ✅ |
| **Importar** gastos / citas históricas | 🔒 PRO | ✅ | ✅ |
| Mapeo visual de columnas | 🔒 PRO | ✅ | ✅ |
| Historial de importaciones | 🔒 PRO | ✅ | ✅ |
| Importar desde URL de Google Sheets | 🔒 PRO | ✅ | ✅ |
| Sincronización automática programada | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 10. MARKETING IA / INSTAGRAM

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Módulo completo visible | 🔒 BIZ | 🔒 BIZ | ✅ |
| Wizard de creación visual (Antes/Después, Carrusel) | 🔒 BIZ | 🔒 BIZ | ✅ |
| Superposición de logo y marca de agua | 🔒 BIZ | 🔒 BIZ | ✅ |
| Generador de copy / pie de foto con IA | 🔒 BIZ | 🔒 BIZ | ✅ |
| Hashtags recomendados por IA | 🔒 BIZ | 🔒 BIZ | ✅ |
| Biblioteca de contenidos | 🔒 BIZ | 🔒 BIZ | ✅ |
| Descarga ZIP del carrusel | 🔒 BIZ | 🔒 BIZ | ✅ |
| Programar publicaciones con fecha/hora | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 11. COPILOT IA

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Módulo completo visible | 🔒 BIZ | 🔒 BIZ | ✅ |
| Previsión de días vacíos con sugerencias | 🔒 BIZ | 🔒 BIZ | ✅ |
| Lista de clientes fugados + cupón personalizado | 🔒 BIZ | 🔒 BIZ | ✅ |
| Puntos de quiebre de stock (IA) | 🔒 BIZ | 🔒 BIZ | ✅ |
| Análisis de rentabilidad IA | 🔒 BIZ | 🔒 BIZ | ✅ |

---

## 12. CONFIGURACIÓN / SETTINGS

| Feature | Starter | Pro | Business |
|---------|---------|-----|----------|
| Datos del negocio (nombre, logo, industria) | ✅ | ✅ | ✅ |
| Personalización visual (colores, slug de reserva) | ✅ | ✅ | ✅ |
| 1 sucursal | ✅ | ✅ | ✅ |
| Múltiples sucursales (hasta 3) | 🔒 PRO | ✅ | ✅ |
| Sucursales ilimitadas | 🔒 BIZ | 🔒 BIZ | ✅ |
| Hasta 3 usuarios | ✅ | ✅ | ✅ |
| Hasta 10 usuarios | 🔒 PRO | ✅ | ✅ |
| Usuarios ilimitados | 🔒 BIZ | 🔒 BIZ | ✅ |
| Roles y permisos personalizados (RBAC) | 🔒 PRO | ✅ | ✅ |
| Integración WhatsApp Business | ✅ (manual) | ✅ | ✅ |
| Integración SMTP (email propio) | ✅ | ✅ | ✅ |
| Integración Google Calendar | 🔒 PRO | ✅ | ✅ |
| Integración MercadoPago (señas) | 🔒 PRO | ✅ | ✅ |
| Formulario público de reservas | ✅ | ✅ | ✅ |
| Facturación y gestión de plan | ✅ | ✅ | ✅ |

---

## RESUMEN DE MÓDULOS COMPLETOS POR PLAN

| Módulo | Starter | Pro | Business |
|--------|---------|-----|----------|
| Panel de Control | ✅ Básico | ✅ Completo | ✅ + IA |
| Agenda | ✅ | ✅ + Multi-sucursal | ✅ |
| Clientes CRM | ✅ Básico | ✅ Completo | ✅ + IA |
| Servicios | ✅ | ✅ + Rentabilidad | ✅ |
| Equipo | ✅ Básico | ✅ + Liquidaciones | ✅ |
| **Finanzas** | ✅ **Limitado** | ✅ Completo | ✅ + Auditoría |
| Inventario ERP | 🔒 | ✅ | ✅ + IA |
| **Automatizaciones** | ✅ **Básico** | ✅ Completo | ✅ + IA + Webhooks |
| **Google Sheets** | ✅ **Export solo** | ✅ Import + Export | ✅ + Sync auto |
| Marketing IA | 🔒 | 🔒 | ✅ |
| Copilot IA | 🔒 | 🔒 | ✅ |
| Configuración | ✅ Básica | ✅ Completa | ✅ |

---

## PREGUNTAS PARA REVISAR

Antes de implementar, confirmar:

1. ¿El plan **Starter** puede ver el módulo de Finanzas con las pestañas bloqueadas visibles (para que el usuario sepa que existen y haga upgrade), o preferís ocultar directamente las pestañas bloqueadas?

2. En **Automatizaciones Starter**, ¿los recordatorios de cita incluyen también WhatsApp o solo email?

3. ¿El **formulario público de reservas** (booking page) tiene alguna limitación en Starter (ej: sin personalización de colores o sin señas)?

4. ¿Los precios están en ARS o USD? ¿O dual (ARS para Argentina, USD para otros países)?

5. ¿Hay un **período de prueba gratis** (trial)? El sistema tiene 14 días configurado — ¿se mantiene?
