# AuraDash Suite — Manual de Pantallas y Funcionalidades

> Documentación organizada por módulos.

---

# 1. Módulo: Panel de Control (Dashboard)

Pantalla de inicio y central de monitoreo del negocio.

## A. Vista Principal del Dashboard

**Información en Pantalla**

- **Buscador Superior:** caja de texto que busca en tiempo real. Oculta los gadgets que no coinciden y desactiva el arrastre de widgets mientras la búsqueda está activa.
- **Gadgets KPI:** tarjetas flotantes con gradientes modernos que muestran:
    - **Facturación Total:** suma de cobros de citas completadas en el rango.
    - **Comisiones a Pagar:** monto acumulado para los profesionales (40%).
    - **Gastos:** suma de egresos registrados en el mes.
    - **Ganancia Neta:** facturación menos comisiones y gastos.
    - **Productos Críticos:** conteo de insumos por debajo del stock mínimo.
- **Gráfico de Facturación:** gráfico de barras (Recharts) que compara las ventas día a día o mes a mes.
- **Gráfico de Métodos de Pago:** gráfico de dona con el porcentaje cobrado en Efectivo, Débito, Crédito y Transferencia.
- **Agenda Rápida del Día:** tabla compacta con las citas de hoy (Cliente, Hora, Servicio, Profesional, Estado de Pago y botón de edición).

**Funcionalidades / Botones**

- **[Agregar Gadget]:** abre el modal de configuración de widgets.
- **[Limpiar Búsqueda]:** visible en la pantalla de "Sin Resultados" cuando el buscador no encuentra gadgets.
- **[Grip de Arrastre]:** permite reordenar visualmente los gadgets (solo visible sin búsqueda activa).

## B. Modal: Configuración de Gadgets (WidgetSettingsModal)

**Información / Formulario**

- Checkboxes para activar o desactivar cada widget de la pantalla principal.
- Configuración del tamaño del widget (1x1, 2x1, full ancho).
- Selector de color de fondo (tema clásico, HSL moderno, dark mode).

**Funcionalidades / Botones**

- **[Guardar Diseño]:** persiste la configuración del diseño en el perfil del usuario en PostgreSQL.

---

# 2. Módulo: Agenda Inteligente (Calendario)

Herramienta principal de agendamiento y control diario de citas.

## A. Vista General de Agenda

**Información en Pantalla**

- **Calendario Central (FullCalendar):** grilla de horarios con código de colores según el profesional asignado.
- **Barra Lateral Izquierda (Buscador de Huecos):** formulario rápido para encontrar huecos libres.
- **Lista de Espera:** panel con clientes anotados para hoy que esperan una cancelación.

## B. Barra Lateral: Lista de Espera y Buscador de Huecos

**Información / Formulario**

- **Buscador de Huecos:** selectores de Servicio, Profesional y Rango de Horas preferido.
- **Lista de Espera:** tarjetas con Nombre del Cliente, Teléfono, Servicio solicitado y Rango Horario deseado.

**Funcionalidades / Botones**

- **[Buscar Huecos]:** analiza la agenda y muestra los horarios disponibles. Al hacer clic en un horario sugerido abre el formulario de cita pre-completado.
- **[Añadir a Lista de Espera]:** abre un miniformulario para encolar a un cliente.
- **[Asignar Turno]:** convierte la tarjeta de la lista de espera en una cita cuando se libera un espacio.

## C. Modal: Crear / Editar Cita

**Información / Formulario**

- **Buscador de Cliente:** input con autocompletado. Si no existe, permite [+ Nuevo Cliente] para desplegar campos básicos.
- **Servicios:** selector múltiple con cálculo dinámico de duración total y precio acumulado en tiempo real.
- **Colaborador/Estilista:** selector del profesional responsable.
- **Horario:** Fecha, Hora de Inicio y Hora de Fin (calculada automáticamente según los servicios).
- **Notas de la Cita:** campo de texto libre (ej: "Alergia a decolorantes").

**Funcionalidades / Botones**

- **[Guardar Cita]:** registra la cita y valida que el profesional no tenga turnos solapados.
- **[Eliminar / Cancelar]:** cambia el estado a "Cancelado" y libera el espacio en el calendario.

## D. Modal: Detalle de Cita y Cobro

**Información / Formulario**

- Resumen de la cita: Cliente, Servicios, Total a pagar.
- **Estado del Turno:** PENDIENTE, CONFIRMADO, REALIZADO y CANCELADO.
- **Método de Pago:** Efectivo, Débito, Crédito o Transferencia.

**Funcionalidades / Botones**

- **[Completar y Cobrar]:** registra el pago, liquida la comisión al profesional y descuenta insumos del inventario (si hay reglas de consumo).
- **[Enviar Recordatorio]:** abre WhatsApp Web con un mensaje formateado con los datos de la cita.

---

# 3. Módulo: Clientes (CRM)

Directorio avanzado de clientes y fichas de salud/estética.

## A. Vista Principal de Clientes

**Información en Pantalla**

- **Buscador:** filtra instantáneamente por Nombre, Teléfono o Email.
- **Grilla de Clientes:** tarjetas con Nombre, Teléfono, última visita, Ticket Promedio y etiquetas (Activo, Inactivo, En Riesgo de abandono).

**Funcionalidades / Botones**

- **[+ Registrar Cliente]:** abre el modal de creación de cliente.
- **[Exportar Excel]:** descarga la base de clientes mapeada.

## B. Panel Detalle del Cliente (ClientDetailModal)

Se divide en 4 pestañas:

### Pestaña: Perfil y Estadísticas
- Gráficos de gasto acumulado, ticket promedio, servicios más contratados y profesional favorito.

### Pestaña: Ficha Técnica (Dossier de Estética)
- Fórmulas químicas aplicadas (ej. "Tintura L'Oreal 7.1 (45g) + Oxidante 20 vol (60ml)"), marcas de esmalte preferidas, tipo de piel o cabello y contraindicaciones médicas.
- **[Editar Ficha]:** modifica las fórmulas y notas en tiempo real.

### Pestaña: Historial de Visitas
- Tabla cronológica de citas pasadas: Fecha, Cita ID, Servicios, Profesional, Total cobrado y Estado de pago.

### Pestaña: Galería Antes y Después
- Mosaico de imágenes que documentan los trabajos realizados.
- **[Subir Foto]:** carga imágenes directo al servidor/nube.

---

# 4. Módulo: Catálogo de Servicios

Definición de tratamientos y su vinculación con los insumos.

## A. Vista de Servicios

**Información en Pantalla**

- Lista de servicios agrupados por categorías (Coloración, Manicuría, Tratamientos, etc.).
- Cada fila muestra: Nombre, Duración (minutos), Precio de venta, Color de agenda y Sucursales activas.

**Funcionalidades / Botones**

- **[+ Crear Servicio]:** abre el formulario de creación.
- **[Editar / Borrar]:** disponible en cada fila.

## B. Modal: Formulario de Servicio

**Información / Formulario**

- Campos de Nombre, Categoría, Duración, Precio y Color de visualización en la agenda.
- **Sección de Reglas de Consumo:** permite añadir insumos que se consumen por sesión (ej: "Crema Oxidante 20 Vol", cantidad "100", unidad "ml").

**Funcionalidades**

- **[Guardar]:** sincroniza el servicio y establece las reglas de consumo relacionales.

---

# 5. Módulo: Equipo de Trabajo y Liquidaciones

Control del personal, horarios y cálculo automatizado de comisiones.

## A. Vista Principal del Personal

**Información en Pantalla**

- Listado de colaboradores con su cargo, sucursal asignada y estado de actividad.
- **Indicadores de Desempeño:** tasa de retención de clientes nuevos y participación en las ventas globales.

## B. Pestaña: Gestión de Horarios

**Información / Formulario**

- Tabla de lunes a domingo para cada profesional.
- Campos para Hora de Entrada, Hora de Salida y pausas (almuerzo) por cada día.

**Funcionalidades**

- **[Guardar Horario]:** aplica los límites horarios al calendario para bloquear agendamientos fuera de turno.

## C. Pestaña: Liquidación de Comisiones

**Información en Pantalla**

- Selector de rango de fechas (Mes actual, Mes anterior, rango personalizado).
- Selector de Profesional.
- **Resumen de Cuentas:**
    - **Total Trabajos:** valor de todos los turnos atendidos.
    - **Comisión Acumulada:** el 40% (u otro porcentaje configurado) que corresponde al profesional.
    - **Pagos Realizados:** adelantos o liquidaciones previas.
    - **Saldo Pendiente:** diferencia a liquidar.
- **Detalle de Trabajos:** desglose fila por fila de cada cita atendida (fecha, cliente, servicios e importe).

**Funcionalidades / Botones**

- **[Registrar Pago de Comisión]:** paga el saldo pendiente, crea un egreso financiero y pone en cero el saldo del profesional.

---

# 6. Módulo: Finanzas y Caja

Gestión de ingresos, egresos y control de efectivo diario.

## A. Pestaña: Caja Diaria (DailyCashClosing)

**Información / Formulario**

- **Monto de Apertura:** caja chica con la que se inicia el día.
- **Registro de Movimiento Manual:** formulario para entradas (ej. cambio) o salidas (ej. compra de café) directas de la caja física.
- **Arqueo / Cierre:** campos para ingresar el efectivo físico real contado al final de la jornada.
- **Balance del Sistema:** suma automática de todos los pagos registrados en Efectivo, Tarjeta y Transferencia.
- **Diferencia de Caja:** discrepancia exacta entre lo contado físicamente y lo registrado en el sistema.

**Funcionalidades / Botones**

- **[Abrir Caja]:** registra la hora y monto de inicio de operaciones.
- **[Registrar Movimiento]:** suma o resta efectivo de la caja chica.
- **[Cerrar Caja]:** bloquea la edición del día, calcula diferencias e ingresa el reporte en el libro diario.

## B. Pestaña: Historial de Gastos

**Información / Formulario**

- Tabla con todos los gastos: Concepto, Categoría (Alquiler, Insumos, Impuestos, Sueldos), Fecha, Monto, Método de Pago y Estado (Pagado/Pendiente).

**Funcionalidades / Botones**

- **[+ Registrar Gasto]:** abre formulario para añadir un nuevo gasto.

---

# 7. Módulo: Inventario ERP

Control total de stock, lotes FIFO, reposiciones y consumo.

## A. Pestaña: Resumen General (InventoryDashboard)

**Información en Pantalla**

- Tarjetas con la valorización total del stock y porcentaje de productos cerca del límite crítico.
- Alertas de insumos agotados.
- Bitácora con los últimos 5 movimientos de stock (entradas, salidas, ajustes manuales).

**Funcionalidades / Botones**

- **[Ver Bitácora Completa]:** redirige a la pestaña de historial de movimientos.

## B. Pestaña: Catálogo de Stock (ProductForm)

**Información en Pantalla**

- Listado de productos con foto/ícono, categoría, código de barras, stock actual, stock mínimo y ubicación física (ej: "Estante A1").

**Funcionalidades / Botones**

- **[+ Nuevo Producto]:** abre un formulario lateral para crear un producto.
- **[Botones Rápidos + / -]:** ajustan cantidades de stock manualmente sin abrir el formulario completo.

## C. Pestaña: Control de Lotes (FIFO) (BatchControl)

**Información en Pantalla**

- Listado de lotes contables activos organizados por fecha de vencimiento.
- Cada tarjeta muestra: Código de Lote, Producto, Cantidad Inicial, Cantidad Actual, Costo Unitario y Días para Expirar (semáforo: Verde = Seguro, Amarillo = Vence pronto, Rojo = Expirado).

**Funcionalidades / Botones**

- **[+ Registrar Nuevo Lote]:** carga mercadería nueva (código de lote, costo, cantidad y vencimiento). Aumenta el stock global automáticamente.

## D. Pestaña: Reposición de Stock (PurchaseOrders y SupplierCRUD)

Dividida en 2 sub-pestañas:

### Pedidos de Reposición
- Listado de órdenes de compra con estados: BORRADOR, ENVIADO, CONFIRMADO, RECIBIDO y CANCELADO.
- **Formulario de Pedido:** selector de Proveedor, notas y grilla para añadir productos, cantidades y precios pactados.
- **[Crear Orden]:** genera el borrador.
- **[Cambiar Estado a Recibido]:** crea automáticamente los lotes FIFO correspondientes e incrementa el stock general de los productos de la orden.

### Directorio de Proveedores
- Fichas con Nombre, Persona de Contacto, Teléfono, Email, Plazos de Pago (ej: "A 30 días") y Días de Entrega Promedio.
- **CRUD de Proveedores:** añadir o editar proveedores.

## E. Pestaña: Reglas de Consumo (ServiceConsumptionRules)

**Información en Pantalla**

- Grilla que detalla la relación "Servicio X consume cantidad Y del producto Z".

**Funcionalidades / Botones**

- **[Asociar Consumo]:** crea o modifica una regla (ej. "Servicio: Alisado" con "Insumo: Keratina Líquida (150ml)").

---

# 8. Módulo: Copilot Aura IA y Automatizaciones

Módulo de inteligencia operativa y flujos automáticos.

## A. Vista Copilot Aura IA

**Información en Pantalla**

- Notificaciones y sugerencias de la IA basadas en el análisis de datos de PostgreSQL:
    - **Previsión de Días Vacíos:** sugiere campañas de descuento.
    - **Clientes Fugados:** lista de clientes que no han regresado, con botón para enviarles un cupón personalizado.
    - **Puntos de Quiebre de Stock:** alertas preventivas que estiman cuándo se agotará un producto según el ritmo de turnos.

## B. Vista de Flujos de Trabajo (Workflows)

**Información en Pantalla**

- Listado de flujos automáticos activos e inactivos (ej. "Confirmación de Cita por Email", "Felicitación de Cumpleaños").

**Funcionalidades / Botones**

- **[+ Crear Workflow]:** abre el constructor visual de automatizaciones.
- **[Ver Historial de Ejecuciones]:** muestra los logs de correos/mensajes enviados, hora y fallos.

## C. Constructor de Workflows

**Formulario de Configuración**

- **Desencadenante (Trigger):** Cita Creada, Cita Cancelada, Pago Recibido, Cumpleaños del Cliente, Cliente Inactivo.
- **Condiciones:** filtros por Servicio, Profesional o Sucursal.
- **Acción:** Enviar Email (plantillas), Enviar SMS, Notificar a Estilista o Disparar Webhook.

---

# 9. Módulo: Sincronizador de Google Sheets

Herramienta visual para importar bases de datos externas de clientes y servicios.

## A. Pantalla de Configuración e Importación

**Información / Formulario**

- Campo para pegar la URL del documento de Google Sheets (o subir un archivo CSV).

**Funcionalidades**

- **[Conectar Planilla]:** carga las primeras filas en memoria y abre la pantalla de mapeo.

## B. Pantalla de Mapeo de Columnas

**Información / Formulario**

- Desplegables que listan las columnas de la planilla importada.
- El usuario empareja los campos de la base con las columnas (ej: "Celular" en PostgreSQL ↔ "WhatsApp / Teléfono" de la planilla).

**Funcionalidades**

- **[Simular Importación]:** valida formatos (teléfonos, correos) y muestra registros listos y registros con errores (en rojo).
- **[Procesar e Importar]:** guarda masivamente los registros válidos en la base Postgres de Neon Cloud.

---

# 10. Módulo: Configuración General y Roles (RBAC)

Administración de la identidad del negocio y permisos de seguridad del personal.

## A. Configuración de Marca y Sucursales

**Información / Formulario**

- **Datos del Salón:** Nombre del negocio, Teléfono, Sector e Industria.
- **Personalización Visual:** selector de Logo y paleta de colores corporativos (usados en el formulario público de reserva).
- **Slug de Reserva:** nombre de la URL pública (ej. /booking/salon-aura).
- **Lista de Sucursales:** CRUD para dar de alta locales físicos con direcciones y teléfonos.

## B. Matriz de Roles y Permisos (RolesPermissionsPage)

**Información en Pantalla**

- Tabla de doble entrada (Matriz RBAC):
    - **Filas:** más de 70 permisos agrupados por áreas (Agenda, Clientes, Finanzas, Inventario, Configuraciones, etc.).
    - **Columnas:** Roles del sistema (Owner/Dueño, Administrador, Encargado, Estilista, Recepción, Visualizador).

**Funcionalidades / Botones**

- **[Checkboxes de la Matriz]:** tilda o destilda permisos individuales para un rol.
- **[Crear Rol Personalizado]:** crea un nuevo rol (ej: "Estilista Junior") y define sus accesos desde cero.
- **[Guardar Cambios de Seguridad]:** aplica los permisos en caliente, impactando inmediatamente las sesiones activas del equipo.
