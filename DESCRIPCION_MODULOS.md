# 📖 Manual de Pantallas y Funcionalidades Detalladas: AuraDash Suite

Este manual describe detalladamente qué información se muestra y qué funciones específicas se pueden realizar en **cada pantalla, pestaña, modal y formulario** de la aplicación AuraDash.

---

## 📈 1. Módulo: Panel de Control (Dashboard)
Es la pantalla de inicio y la central de monitoreo del negocio.

### A. Vista Principal del Dashboard
*   **Información en Pantalla**:
    *   **Buscador Superior**: Caja de texto que busca en tiempo real. Oculta los gadgets que no coinciden y desactiva el arrastre de widgets mientras la búsqueda está activa.
    *   **Gadgets KPI**: Tarjetas flotantes con gradientes modernos que muestran:
        *   *Facturación Total*: Suma de cobros de citas completadas en el rango.
        *   *Comisiones a Pagar*: Monto acumulado para los profesionales (40%).
        *   *Gastos*: Suma de egresos registrados en el mes.
        *   *Ganancia Neta*: Facturación menos comisiones y gastos.
        *   *Productos Críticos*: Conteo de insumos por debajo del stock mínimo.
    *   **Gráfico de Facturación**: Gráfico de barras (Recharts) que compara las ventas día a día o mes a mes.
    *   **Gráfico de Métodos de Pago**: Gráfico de dona que muestra el porcentaje cobrado en Efectivo, Débito, Crédito y Transferencia.
    *   **Agenda Rápida del Día**: Tabla compacta con las citas de hoy, mostrando Cliente, Hora, Servicio, Profesional, Estado de Pago (tildado/pendiente) y un botón de edición.
*   **Funcionalidades / Botones**:
    *   `[Agregar Gadget]`: Abre el modal de configuración de widgets.
    *   `[Limpiar Búsqueda]`: Visible en la pantalla de "Sin Resultados" cuando el buscador no encuentra gadgets.
    *   `[Grip de Arrastre]`: Permite reordenar visualmente los gadgets (solo visible cuando no hay búsqueda activa).

### B. Modal: Configuración de Gadgets (`WidgetSettingsModal`)
*   **Información / Formulario**:
    *   Checkboxes para activar o desactivar cada widget de la pantalla principal.
    *   Configuración del tamaño del widget (1x1, 2x1, full ancho).
    *   Selector de color de fondo (tema clásico, HSL moderno, dark mode).
*   **Funcionalidades / Botones**:
    *   `[Guardar Diseño]`: Persiste la configuración del diseño en el perfil del usuario en PostgreSQL.

---

## 📅 2. Módulo: Agenda Inteligente (Calendario)
La herramienta principal de agendamiento y control diario de citas.

### A. Vista General de Agenda
*   **Información en Pantalla**:
    *   **Calendario Central (FullCalendar)**: Grilla de horarios con código de colores según el profesional asignado a cada cita.
    *   **Barra Lateral Izquierda (Buscador de Huecos)**: Formulario rápido para encontrar huecos libres.
    *   **Lista de Espera**: Panel con clientes anotados para hoy que esperan una cancelación.

### B. Barra Lateral: Lista de Espera y Buscador de Huecos
*   **Información / Formulario**:
    *   *Buscador de Huecos*: Selectores de Servicio, Profesional y Rango de Horas preferido.
    *   *Lista de Espera*: Tarjetas compactas con el Nombre del Cliente, Teléfono, Servicio solicitado y Rango Horario deseado.
*   **Funcionalidades / Botones**:
    *   `[Buscar Huecos]`: Analiza la agenda y muestra en una lista los horarios disponibles. Al hacer clic en un horario sugerido, abre el formulario de cita pre-completado.
    *   `[Añadir a Lista de Espera]`: Abre un miniformulario para encolar a un cliente.
    *   `[Asignar Turno]`: Botón directo en cada tarjeta de la lista de espera para convertirla en una cita en el calendario cuando se libera un espacio.

### C. Modal: Crear / Editar Cita
*   **Información / Formulario**:
    *   *Buscador de Cliente*: Input con autocompletado para buscar clientes registrados. Si no existe, permite hacer clic en `[+ Nuevo Cliente]` para desplegar sus campos básicos.
    *   *Servicios*: Selector múltiple de servicios con cálculo dinámico de duración total y precio acumulado en tiempo real.
    *   *Colaborador/Estilista*: Selector del profesional responsable.
    *   *Horario*: Campos de Fecha, Hora de Inicio y Hora de Fin (calculada automáticamente según los servicios elegidos).
    *   *Notas de la Cita*: Campo de texto libre para indicaciones especiales (ej: "Alergia a decolorantes").
*   **Funcionalidades / Botones**:
    *   `[Guardar Cita]`: Registra la cita y valida que el profesional no tenga turnos solapados.
    *   `[Eliminar / Cancelar]`: Cambia el estado a "Cancelado" y libera el espacio en el calendario.

### D. Modal: Detalle de Cita y Cobro
*   **Información / Formulario**:
    *   Muestra el resumen de la cita: Cliente, Servicios, Total a pagar.
    *   *Estado del Turno*: Selector entre PENDIENTE, CONFIRMADO, REALIZADO y CANCELADO.
    *   *Método de Pago*: Selector de Efectivo, Débito, Crédito o Transferencia.
*   **Funcionalidades / Botones**:
    *   `[Completar y Cobrar]`: Registra el pago en finanzas, liquida la comisión al profesional y descuenta los insumos del inventario (si existen reglas de consumo).
    *   `[Enviar Recordatorio]`: Abre WhatsApp Web con un mensaje formateado con los datos de la cita.

---

## 👥 3. Módulo: Clientes (CRM)
Directorio avanzado de clientes y fichas de salud/estética.

### A. Vista Principal de Clientes
*   **Información en Pantalla**:
    *   **Buscador**: Filtra instantáneamente por Nombre, Teléfono o Email.
    *   **Grilla de Clientes**: Tarjetas con Nombre, Teléfono, Fecha de última visita, Ticket Promedio y etiquetas de estado (Activo, Inactivo, En Riesgo de abandono).
*   **Funcionalidades / Botones**:
    *   `[+ Registrar Cliente]`: Abre el modal de creación de cliente.
    *   `[Exportar Excel]`: Descarga la base de clientes mapeada.

### B. Panel Detalle del Cliente (`ClientDetailModal`)
Se divide en **4 pestañas**:
1.  **Pestaña: Perfil y Estadísticas**:
    *   *Información*: Gráficos de gasto acumulado, ticket promedio, servicios más contratados y profesional favorito.
2.  **Pestaña: Ficha Técnica (Dossier de Estética)**:
    *   *Información*: Fórmulas químicas aplicadas (ej. *"Tintura L'Oreal 7.1 (45g) + Oxidante 20 vol (60ml)"*), marcas de esmalte preferidas, tipo de piel o cabello, y contraindicaciones médicas.
    *   *Acción*: Botón `[Editar Ficha]` para modificar las fórmulas y notas en tiempo real.
3.  **Pestaña: Historial de Visitas**:
    *   *Información*: Tabla cronológica con todas las citas pasadas: Fecha, Cita ID, Servicios recibidos, Profesional que la atendió, Total cobrado y Estado de pago.
4.  **Pestaña: Galería Antes y Después**:
    *   *Información*: Mosaico de imágenes que documentan los trabajos realizados.
    *   *Acción*: Botón `[Subir Foto]` para cargar imágenes directo al servidor/nube.

---

## ✂️ 4. Módulo: Catálogo de Servicios
Definición de tratamientos y su vinculación con los insumos.

### A. Vista de Servicios
*   **Información en Pantalla**:
    *   Lista de servicios agrupados por categorías (Coloración, Manicuría, Tratamientos, etc.).
    *   Cada fila muestra: Nombre, Duración (minutos), Precio de venta, Color de agenda y Sucursales activas.
*   **Funcionalidades / Botones**:
    *   `[+ Crear Servicio]`: Abre el formulario de creación.
    *   `[Editar] / [Borrar]`: En cada fila.

### B. Modal: Formulario de Servicio
*   **Información / Formulario**:
    *   Campos de Nombre, Categoría, Duración, Precio y Color de visualización en la agenda.
    *   **Sección de Reglas de Consumo**: Permite añadir múltiples insumos que se consumen en cada sesión (ej: seleccionar "Crema Oxidante 20 Vol" e ingresar la cantidad "100" y la unidad "ml").
*   **Funcionalidades**:
    *   `[Guardar]`: Sincroniza el servicio y establece las reglas de consumo relacionales.

---

## 👥 5. Módulo: Equipo de Trabajo & Liquidaciones
Control del personal, horarios y cálculo automatizado de comisiones.

### A. Vista Principal del Personal
*   **Información en Pantalla**:
    *   Listado de colaboradores con su cargo, sucursal asignada y estado de actividad.
    *   **Indicadores de Desempeño**: Tasa de retención de clientes nuevos y participación en las ventas globales.

### B. Pestaña: Gestión de Horarios
*   **Información / Formulario**:
    *   Tabla de lunes a domingo para cada profesional.
    *   Campos para establecer Hora de Entrada, Hora de Salida y pausas (almuerzo) por cada día de la semana.
*   **Funcionalidades**:
    *   `[Guardar Horario]`: Aplica los límites horarios al calendario para bloquear agendamientos fuera de turno.

### C. Pestaña: Liquidación de Comisiones
*   **Información en Pantalla**:
    *   Selector de rango de fechas (ej: Mes actual, Mes anterior, rango personalizado).
    *   Selector de Profesional.
    *   **Resumen de Cuentas**:
        *   *Total Trabajos*: Valor de todos los turnos atendidos.
        *   *Comisión Acumulada*: El 40% (u otro porcentaje configurado) que le corresponde al profesional.
        *   *Pagos Realizados*: Adelantos o liquidaciones previas.
        *   *Saldo Pendiente*: Diferencia a liquidar.
    *   **Detalle de Trabajos**: Desglose fila por fila de cada cita atendida por el profesional con fecha, cliente, servicios prestados e importe.
*   **Funcionalidades / Botones**:
    *   `[Registrar Pago de Comisión]`: Abre un modal para pagar el saldo pendiente, lo que crea un egreso financiero en la contabilidad y pone en cero el saldo del profesional.

---

## 💰 6. Módulo: Finanzas & Caja
Gestión de ingresos, egresos y control de efectivo diario.

### A. Pestaña: Caja Diaria (`DailyCashClosing`)
*   **Información / Formulario**:
    *   *Monto de Apertura*: Caja chica con la que se inicia el día.
    *   *Registro de Movimiento Manual*: Formulario para registrar entradas (ej. cambio) o salidas (ej. compra de café) directas de la caja física, indicando concepto e importe.
    *   *Arqueo / Cierre*: Campos para que el recepcionista ingrese el efectivo físico real contado al final de la jornada.
    *   *Balance del Sistema*: Suma calculada automáticamente por el sistema de todos los pagos registrados en Efectivo, Tarjeta y Transferencia.
    *   *Diferencia de Caja*: Muestra la discrepancia exacta entre lo contado físicamente y lo registrado en el sistema.
*   **Funcionalidades / Botones**:
    *   `[Abrir Caja]`: Registra la hora y monto de inicio de operaciones.
    *   `[Registrar Movimiento]`: Suma o resta efectivo de la caja chica.
    *   `[Cerrar Caja]`: Bloquea la edición del día, calcula diferencias e ingresa el reporte en el libro diario.

### B. Pestaña: Historial de Gastos
*   **Información / Formulario**:
    *   Tabla con todos los gastos del salón: Concepto, Categoría (Alquiler, Insumos, Impuestos, Sueldos), Fecha, Monto, Método de Pago utilizado y Estado (Pagado/Pendiente).
*   **Funcionalidades / Botones**:
    *   `[+ Registrar Gasto]`: Abre formulario para añadir un nuevo gasto.

---

## 📦 7. Módulo: Inventario ERP
Control total de stock, lotes FIFO, reposiciones y consumo.

### A. Pestaña: Resumen General (`InventoryDashboard`)
*   **Información en Pantalla**:
    *   Tarjetas con la valorización total del stock (costo de adquisición de todo el depósito) y porcentaje de productos cerca del límite crítico.
    *   Alertas de insumos agotados.
    *   Bitácora con los últimos 5 movimientos de stock registrados (entradas, salidas, ajustes manuales).
*   **Funcionalidades / Botones**:
    *   `[Ver Bitácora Completa]`: Redirige a la pestaña de historial de movimientos.

### B. Pestaña: Catálogo de Stock (`ProductForm`)
*   **Información en Pantalla**:
    *   Listado de productos con su foto/ícono, categoría, código de barras, stock actual, stock mínimo y ubicación física (ej: "Estante A1").
*   **Funcionalidades / Botones**:
    *   `[+ Nuevo Producto]`: Abre un formulario lateral para crear un producto.
    *   `[Botones Rápidos + / -]`: Permiten ajustar cantidades de stock manualmente en caliente sin abrir el formulario completo.

### C. Pestaña: Control de Lotes (FIFO) (`BatchControl`)
*   **Información en Pantalla**:
    *   Listado de lotes contables activos organizados por fecha de vencimiento.
    *   Cada tarjeta de lote muestra: Código de Lote, Producto, Cantidad Inicial, Cantidad Actual, Costo Unitario de Compra y Días para Expirar (con semáforo visual de alerta: Verde = Seguro, Amarillo = Vence pronto, Rojo = Expirado).
*   **Funcionalidades / Botones**:
    *   `[+ Registrar Nuevo Lote]`: Permite cargar mercadería nueva indicando su código de lote, costo, cantidad y vencimiento. Aumenta el stock global del producto automáticamente.

### D. Pestaña: Reposición de Stock (`PurchaseOrders` y `SupplierCRUD`)
Dividida en **2 sub-pestañas**:
1.  **Pedidos de Reposición**:
    *   *Información*: Listado de órdenes de compra con estados: BORRADOR, ENVIADO, CONFIRMADO, RECIBIDO y CANCELADO.
    *   *Formulario de Pedido*: Selector de Proveedor, notas y una grilla para añadir productos, cantidades y precios pactados.
    *   *Funcionalidades / Botones*:
        *   `[Crear Orden]`: Genera el borrador.
        *   `[Cambiar Estado a Recibido]`: Al confirmarse la recepción, el sistema crea automáticamente los lotes FIFO correspondientes en el almacén e incrementa el stock general de los productos contenidos en la orden.
2.  **Directorio de Proveedores**:
    *   *Información*: Fichas de proveedores con Nombre, Persona de Contacto, Teléfono, Email, Plazos de Pago (ej: "A 30 días") y Días de Entrega Promedio.
    *   *Funcionalidades*: CRUD para añadir o editar proveedores.

### E. Pestaña: Reglas de Consumo (`ServiceConsumptionRules`)
*   **Información en Pantalla**:
    *   Grilla que detalla la relación *"Servicio X consume cantidad Y del producto Z"*.
*   **Funcionalidades / Botones**:
    *   `[Asociar Consumo]`: Abre un formulario para crear o modificar una regla de consumo (ej. asociar "Servicio: Alisado" con "Insumo: Keratina Liquida (150ml)").

---

## 🤖 8. Módulo: Copilot Aura IA & Automatizaciones
El módulo de inteligencia operativa y flujos automáticos.

### A. Vista Copilot Aura IA
*   **Información en Pantalla**:
    *   Notificaciones y sugerencias de la IA basadas en el análisis de datos de PostgreSQL:
        *   *Previsión de Días Vacíos*: Sugiere campañas de descuento.
        *   *Clientes Fugados*: Lista de clientes que no han regresado con un botón directo para enviarles un cupón personalizado.
        *   *Puntos de Quiebre de Stock*: Alertas preventivas que estiman cuándo se agotará un producto según el ritmo de turnos agendados.

### B. Vista de Flujos de Trabajo (Workflows)
*   **Información en Pantalla**:
    *   Listado de flujos automáticos activos e inactivos (ej. *"Confirmación de Cita por Email"*, *"Felicitación de Cumpleaños"*).
*   **Funcionalidades / Botones**:
    *   `[+ Crear Workflow]`: Abre el constructor visual de automatizaciones.
    *   `[Ver Historial de Ejecuciones]`: Muestra los logs de qué correos o mensajes se enviaron, a qué hora y si ocurrieron fallos.

### C. Constructor de Workflows
*   **Formulario de Configuración**:
    *   *Desencadenante (Trigger)*: Cita Creada, Cita Cancelada, Pago Recibido, Cumpleaños del Cliente, Cliente Inactivo.
    *   *Condiciones*: Filtros por Servicio, Profesional o Sucursal.
    *   *Acción*: Enviar Email (usando plantillas), Enviar SMS, Notificar a Estilista o Disparar Webhook.

---

## 📊 9. Sincronizador de Google Sheets
Herramienta visual para importar bases de datos externas de clientes y servicios.

### A. Pantalla de Configuración e Importación
*   **Información / Formulario**:
    *   Campo para pegar la URL del documento de Google Sheets (o subir un archivo CSV).
*   **Funcionalidades**:
    *   `[Conectar Planilla]`: Carga las primeras filas del documento en memoria y abre la pantalla de mapeo.

### B. Pantalla de Mapeo de Columnas
*   **Información / Formulario**:
    *   Desplegables que listan las columnas de la planilla importada.
    *   El usuario debe emparejar los campos de la base de datos de la suite (ej: campo "Celular" en PostgreSQL se corresponde con la columna "WhatsApp / Teléfono" de la planilla).
*   **Funcionalidades**:
    *   `[Simular Importación]`: Valida formatos (números de teléfono válidos, correos sin errores) y muestra una grilla con los registros listos y los registros con errores (resaltados en rojo).
    *   `[Procesar e Importar]`: Guarda de forma masiva los registros válidos en la base de datos relacional Postgres de Neon Cloud.

---

## ⚙️ 10. Configuración General & Roles (RBAC)
Administración de la identidad del negocio y permisos de seguridad del personal.

### A. Configuración de Marca y Sucursales
*   **Información / Formulario**:
    *   *Datos del Salón*: Nombre del negocio, Teléfono, Sector e Industry.
    *   *Personalización Visual*: Selector de Logo y paleta de colores corporativos (colores que se usarán en el formulario público de reserva de clientes).
    *   *Slug de Reserva*: Nombre de la URL pública (ej. `/booking/salon-aura`).
    *   *Lista de Sucursales*: CRUD para dar de alta locales físicos con sus direcciones y teléfonos.

### B. Matriz de Roles y Permisos (`RolesPermissionsPage`)
*   **Información en Pantalla**:
    *   Tabla de doble entrada (Matriz RBAC):
        *   *Filas*: Más de 70 permisos de sistema agrupados por áreas (Agenda, Clientes, Finanzas, Inventario, Configuraciones, etc.).
        *   *Columnas*: Roles del sistema (Owner/Dueño, Administrador, Encargado, Estilista, Recepción, Visualizador).
*   **Funcionalidades / Botones**:
    *   `[Checkboxes de la Matriz]`: Permite tildar o destildar permisos individuales para un rol.
    *   `[Crear Rol Personalizado]`: Permite crear un nuevo rol (ej: "Estilista Junior") y definir sus accesos desde cero.
    *   `[Guardar Cambios de Seguridad]`: Aplica los cambios de permisos en caliente de manera que impacten inmediatamente en las sesiones activas del equipo.
