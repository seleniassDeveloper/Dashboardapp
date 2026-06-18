
import React, { useState } from 'react';

export default function ManualContentEs() {
  const [zoomImg, setZoomImg] = useState(null);

  const handleImageClick = (e) => {
    if (e.target.tagName === 'IMG' && e.target.closest('.gallery')) {
      setZoomImg(e.target.src);
    }
  };

  return (
    <>
      <div className="manual-wrapper" onClick={handleImageClick}>
        
<div className="manual-layout"><aside className="manual-sidebar"><h3>Índice interactivo</h3><ul><li><a href="#modulo-1">Módulo 01: Panel de Control</a></li><li><a href="#modulo-2">Módulo 02: Agenda Inteligente</a></li><li><a href="#modulo-3">Módulo 03: Clientes</a></li><li><a href="#modulo-4">Módulo 04: Catálogo de Servicios</a></li><li><a href="#modulo-5">Módulo 05: Equipo de Trabajo y Liquidaciones</a></li><li><a href="#modulo-6">Módulo 06: Finanzas y Caja</a></li><li><a href="#modulo-7">Módulo 07: Inventario ERP</a></li><li><a href="#modulo-8">Módulo 08: Copilot Aura IA y Automatizaciones</a></li><li><a href="#modulo-9">Módulo 09: Sincronizador de Google Sheets</a></li><li><a href="#modulo-10">Módulo 010: Configuración General y Roles</a></li><li><a href="#modulo-11">Módulo 011: Generador de Contenido de Marketing e Instagram</a></li></ul></aside><div className="manual-main-content"><div className="manual-wrap">

  <div className="manual-cover">
    <span className="manual-badge">Documentación · Organizada por módulos</span>
    <h1>AuraDash Suite</h1>
    <p>Manual de Pantallas y Funcionalidades</p>
  </div>

  <div className="manual-legend">
    <h2>Cómo leer este documento</h2>
    <div className="manual-legend-grid">
      <div className="manual-leg"><span className="manual-swatch manual-sw-desc"></span><div><span className="manual-term">Texto descriptivo</span> — explica para qué sirve cada módulo o pantalla.</div></div>
      <div className="manual-leg"><span className="manual-swatch manual-sw-info"></span><div><span className="manual-term">Información en Pantalla</span> — qué datos ve el usuario (bloque verde).</div></div>
      <div className="manual-leg"><span className="manual-swatch manual-sw-func"></span><div><span className="manual-term">Funcionalidades / Formulario</span> — qué se puede hacer (bloque ámbar).</div></div>
      <div className="manual-leg"><span className="manual-swatch manual-sw-chip"></span><div><span className="manual-btn">Botón</span> — acciones clicables resaltadas como etiqueta.</div></div>
    </div>
  </div>

  {/**/}
  <section className="manual-module" id="modulo-1">
    <header>
      <div className="num">Módulo 01</div>
      <h2>Panel de Control (Dashboard)</h2>
      <div className="desc">Pantalla de inicio y central de monitoreo del negocio.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Vista Principal del Dashboard</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li><span className="manual-term">Buscador Superior:</span> <span className="manual-descr">busca en tiempo real. Oculta los gadgets que no coinciden y desactiva el arrastre de widgets mientras la búsqueda está activa.</span></li>
            <li><span className="manual-term">Gadgets KPI:</span> <span className="manual-descr">tarjetas flotantes con gradientes que muestran:</span>
              <ul>
                <li><span className="manual-term">Facturación Total</span> — suma de cobros de citas completadas en el rango.</li>
                <li><span className="manual-term">Comisiones a Pagar</span> — monto acumulado para los profesionales (40%).</li>
                <li><span className="manual-term">Gastos</span> — suma de egresos registrados en el mes.</li>
                <li><span className="manual-term">Ganancia Neta</span> — facturación menos comisiones y gastos.</li>
                <li><span className="manual-term">Productos Críticos</span> — insumos por debajo del stock mínimo.</li>
              </ul>
            </li>
            <li><span className="manual-term">Gráfico de Facturación:</span> <span className="manual-descr">barras (Recharts) que comparan ventas día a día o mes a mes.</span></li>
            <li><span className="manual-term">Gráfico de Métodos de Pago:</span> <span className="manual-descr">dona con el % cobrado en Efectivo, Débito, Crédito y Transferencia.</span></li>
            <li><span className="manual-term">Agenda Rápida del Día:</span> <span className="manual-descr">tabla con las citas de hoy (Cliente, Hora, Servicio, Profesional, Estado de Pago y edición).</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Agregar Gadget</span> abre el modal de configuración de widgets.</li>
            <li><span className="manual-btn">Limpiar Búsqueda</span> visible en "Sin Resultados" cuando no encuentra gadgets.</li>
            <li><span className="manual-btn">Grip de Arrastre</span> reordena visualmente los gadgets (solo sin búsqueda activa).</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Modal: Configuración de Gadgets <span className="manual-pill">WidgetSettingsModal</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li>Checkboxes para activar o desactivar cada widget de la pantalla principal.</li>
            <li>Configuración del tamaño del widget (1x1, 2x1, full ancho).</li>
            <li>Selector de color de fondo (tema clásico, HSL moderno, dark mode).</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul><li><span className="manual-btn">Guardar Diseño</span> persiste la configuración en el perfil del usuario en PostgreSQL.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/panel-panel1.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-panel2.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-qrcitapanel.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-vistadetalledecitapanel.png" alt="Captura de modulo-1" loading="lazy"/><img src="manual-assets/panel-informesiapanel.png" alt="Captura de modulo-1" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-2">
    <header>
      <div className="num">Módulo 02</div>
      <h2>Agenda Inteligente (Calendario)</h2>
      <div className="desc">Herramienta principal de agendamiento y control diario de citas.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Vista General de Agenda</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li><span className="manual-term">Calendario Central (FullCalendar):</span> <span className="manual-descr">grilla de horarios con código de colores según el profesional asignado.</span></li>
            <li><span className="manual-term">Botón "+ Nueva cita":</span> <span className="manual-descr">ubicado en el encabezado superior, permite agendar turnos de forma rápida abriendo el modal con los campos limpios sin necesidad de pulsar una celda horaria del calendario.</span></li>
            <li><span className="manual-term">Barra Lateral Izquierda (Buscador de Huecos):</span> <span className="manual-descr">formulario rápido para encontrar huecos libres.</span></li>
            <li><span className="manual-term">Lista de Espera:</span> <span className="manual-descr">clientes anotados para hoy que esperan una cancelación.</span></li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Barra Lateral: Lista de Espera y Buscador de Huecos</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li><span className="manual-term">Buscador de Huecos:</span> <span className="manual-descr">selectores de Servicio, Profesional y Rango de Horas preferido.</span></li>
            <li><span className="manual-term">Lista de Espera:</span> <span className="manual-descr">tarjetas con Nombre, Teléfono, Servicio solicitado y Rango Horario deseado.</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Buscar Huecos</span> analiza la agenda y muestra horarios disponibles; al elegir uno abre el formulario de cita pre-completado.</li>
            <li><span className="manual-btn">Añadir a Lista de Espera</span> abre un miniformulario para encolar a un cliente.</li>
            <li><span className="manual-btn">Asignar Turno</span> convierte la tarjeta de espera en una cita cuando se libera un espacio.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Modal: Crear / Editar Cita</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li><span className="manual-term">Buscador de Cliente:</span> <span className="manual-descr">input con autocompletado; si no existe permite [+ Nuevo Cliente].</span></li>
            <li><span className="manual-term">Servicios:</span> <span className="manual-descr">selector múltiple con cálculo dinámico de duración y precio en tiempo real.</span></li>
            <li><span className="manual-term">Colaborador/Estilista:</span> <span className="manual-descr">selector del profesional responsable.</span></li>
            <li><span className="manual-term">Horario:</span> <span className="manual-descr">Fecha, Hora de Inicio y Hora de Fin (calculada según los servicios).</span></li>
            <li><span className="manual-term">Notas de la Cita:</span> <span className="manual-descr">texto libre (ej: "Alergia a decolorantes").</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Guardar Cita</span> registra la cita y valida que el profesional no tenga turnos solapados.</li>
            <li><span className="manual-btn">Eliminar / Cancelar</span> cambia el estado a "Cancelado" y libera el espacio.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>D. Modal: Finalizar Servicio y Cobro (Checkout Flow) <span className="manual-pill">FinalizeServiceModal</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li>Resumen de la cita: Cliente, Servicios y Especialista responsable.</li>
            <li><span className="manual-term">Monto a Cobrar ($):</span> <span className="manual-descr">precio final real cobrado al cliente (se inicializa con el precio del servicio original pero permite aplicar descuentos o adicionales).</span></li>
            <li><span className="manual-term">Método de Pago:</span> <span className="manual-descr">Efectivo, Mercado Pago, Transferencia Bancaria, Tarjeta de Débito o Tarjeta de Crédito.</span></li>
            <li><span className="manual-term">Notas Clínicas / Evolución:</span> <span className="manual-descr">registro obligatorio del detalle técnico del trabajo realizado (ej: tonos de tintura, tiempo de pose, estado inicial) para el historial técnico.</span></li>
            <li><span className="manual-term">Recomendaciones Post-Cuidado:</span> <span className="manual-descr">indicaciones opcionales para que el cliente realice cuidados en su domicilio.</span></li>
            <li><span className="manual-term">Fotos de Evolución (Antes & Después):</span> <span className="manual-descr">carga visual interactiva de dos fotos (antes de empezar el trabajo y después de completarlo).</span></li>
            <li><span className="manual-term">Envío de Comprobante Digital:</span> <span className="manual-descr">opciones para enviar una factura en HTML vía correo electrónico (Gmail) y/o abrir la redirección de WhatsApp con un mensaje pre-completado detallando el servicio, profesional, monto y método de pago.</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Finalizar Turno</span> guarda la ficha técnica del servicio, registra la transacción en Finanzas, liquida la comisión al profesional, descuenta insumos del stock y cambia el estado de la cita a "Finalizada".</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/agenda-agendavista.png" alt="Captura de modulo-2" loading="lazy"/><img src="manual-assets/agenda-lista-de-espera.png" alt="Captura de modulo-2" loading="lazy"/><img src="manual-assets/agenda-detalle-de-ingresos-estimados-del-di-a.png" alt="Captura de modulo-2" loading="lazy"/><img src="manual-assets/agenda-2026-06-16-7.31.54-pm.png" alt="Captura de modulo-2" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-3">
    <header>
      <div className="num">Módulo 03</div>
      <h2>Clientes (CRM)</h2>
      <div className="desc">Directorio avanzado de clientes y fichas de salud/estética.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Vista Principal de Clientes</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li><span className="manual-term">Buscador:</span> <span className="manual-descr">filtra por Nombre, Teléfono o Email.</span></li>
            <li><span className="manual-term">Grilla de Clientes:</span> <span className="manual-descr">tarjetas con Nombre, Teléfono, última visita, Ticket Promedio y etiquetas (Activo, Inactivo, En Riesgo).</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">+ Registrar Cliente</span> abre el modal de creación.</li>
            <li><span className="manual-btn">Exportar Excel</span> descarga la base de clientes mapeada.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Panel Detalle del Cliente <span className="manual-pill">ClientDetailModal</span></h3>
        <p className="manual-tabs-note">Ficha del cliente unificada que se despliega al seleccionarlo. Cuenta con la opción de capturar o subir una foto de perfil (haciendo click en el avatar, que abre la webcam del dispositivo o un selector de archivos locales). Se divide en 4 pestañas:</p>
        <div className="manual-block info">
          <span className="manual-tag">Pestaña · Perfil y Estadísticas</span>
          <ul><li>Gráficos de gasto acumulado, ticket promedio, servicios más contratados y profesional favorito.</li></ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Pestaña · Ficha Técnica (Dossier)</span>
          <ul>
            <li>Fórmulas químicas (ej. "Tintura L'Oreal 7.1 (45g) + Oxidante 20 vol (60ml)"), marcas de esmalte, tipo de piel/cabello y contraindicaciones médicas.</li>
            <li><span className="manual-btn">Editar Ficha</span> modifica fórmulas y notas en tiempo real.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Pestaña · Historial de Visitas</span>
          <ul><li>Tabla cronológica: Fecha, Cita ID, Servicios, Profesional, Total cobrado y Estado de pago.</li></ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Pestaña · Evolución y Estilo (Línea de Tiempo y Galería)</span>
          <ul>
            <li>Layout side-by-side de doble columna:</li>
            <li><strong>Columna Izquierda:</strong> "Galería de Evolución Visual" que renderiza las fotos del "Antes" y "Después" tomadas en el checkout del servicio una al lado de la otra, etiquetadas y ordenadas cronológicamente con hover effects de zoom.</li>
            <li><strong>Columna Derecha:</strong> "Línea de Tiempo de Evolución" que detalla las notas clínicas de evolución técnica e indicaciones de cuidado.</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/consentimiento-2026-06-16-7.44.00-pm.png" alt="Captura de modulo-3" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-4">
    <header>
      <div className="num">Módulo 04</div>
      <h2>Catálogo de Servicios</h2>
      <div className="desc">Definición de tratamientos y su vinculación con los insumos.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Vista de Servicios</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Servicios agrupados por categorías (Coloración, Manicuría, Tratamientos, etc.).</li>
            <li>Cada fila: Nombre, Duración (min), Precio de venta, Color de agenda y Sucursales activas.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">+ Crear Servicio</span> abre el formulario de creación.</li>
            <li><span className="manual-btn">Editar</span> <span className="manual-btn">Borrar</span> disponibles en cada fila.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Modal: Formulario de Servicio</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li>Campos de Nombre, Categoría, Duración, Precio y Color en la agenda.</li>
            <li><span className="manual-term">Reglas de Consumo:</span> <span className="manual-descr">añadir insumos consumidos por sesión (ej: "Crema Oxidante 20 Vol", cantidad "100", unidad "ml").</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades</span>
          <ul><li><span className="manual-btn">Guardar</span> sincroniza el servicio y establece las reglas de consumo relacionales.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/servicios-2026-06-16-7.32.15-pm.png" alt="Captura de modulo-4" loading="lazy"/><img src="manual-assets/servicios-2026-06-16-7.32.48-pm.png" alt="Captura de modulo-4" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-5">
    <header>
      <div className="num">Módulo 05</div>
      <h2>Equipo de Trabajo y Liquidaciones</h2>
      <div className="desc">Control del personal, horarios y cálculo automatizado de comisiones.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Vista Principal del Personal</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Colaboradores con su cargo, sucursal asignada y estado de actividad.</li>
            <li><span className="manual-term">Indicadores de Desempeño:</span> <span className="manual-descr">retención de clientes nuevos y participación en las ventas globales.</span></li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Pestaña: Gestión de Horarios</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li>Tabla de lunes a domingo para cada profesional.</li>
            <li>Campos de Hora de Entrada, Hora de Salida y pausas (almuerzo) por día.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades</span>
          <ul><li><span className="manual-btn">Guardar Horario</span> aplica los límites al calendario para bloquear agendamientos fuera de turno.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Pestaña: Liquidación de Comisiones</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Selector de rango de fechas (Mes actual, Mes anterior, personalizado).</li>
            <li>Selector de Profesional.</li>
            <li><span className="manual-term">Resumen de Cuentas:</span>
              <ul>
                <li><span className="manual-term">Total Trabajos</span> — valor de todos los turnos atendidos.</li>
                <li><span className="manual-term">Comisión Acumulada</span> — el 40% (o el % configurado) del profesional.</li>
                <li><span className="manual-term">Pagos Realizados</span> — adelantos o liquidaciones previas.</li>
                <li><span className="manual-term">Saldo Pendiente</span> — diferencia a liquidar.</li>
              </ul>
            </li>
            <li><span className="manual-term">Detalle de Trabajos:</span> <span className="manual-descr">desglose por cita (fecha, cliente, servicios e importe).</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul><li><span className="manual-btn">Registrar Pago de Comisión</span> paga el saldo, crea un egreso financiero y pone en cero el saldo del profesional.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/personal-2026-06-16-7.34.13-pm.png" alt="Captura de modulo-5" loading="lazy"/><img src="manual-assets/personal-2026-06-16-7.34.42-pm.png" alt="Captura de modulo-5" loading="lazy"/><img src="manual-assets/personal-2026-06-16-7.37.04-pm.png" alt="Captura de modulo-5" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-6">
    <header>
      <div className="num">Módulo 06</div>
      <h2>Finanzas y Caja</h2>
      <div className="desc">Gestión de ingresos, egresos y control de efectivo diario.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Pestaña: Caja Diaria <span className="manual-pill">DailyCashClosing</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li><span className="manual-term">Monto de Apertura:</span> <span className="manual-descr">caja chica con la que se inicia el día.</span></li>
            <li><span className="manual-term">Movimiento Manual:</span> <span className="manual-descr">entradas (ej. cambio) o salidas (ej. café) directas de la caja física.</span></li>
            <li><span className="manual-term">Arqueo / Cierre:</span> <span className="manual-descr">efectivo físico real contado al final de la jornada.</span></li>
            <li><span className="manual-term">Balance del Sistema:</span> <span className="manual-descr">suma automática de pagos en Efectivo, Tarjeta y Transferencia.</span></li>
            <li><span className="manual-term">Diferencia de Caja:</span> <span className="manual-descr">discrepancia entre lo contado y lo registrado.</span></li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Abrir Caja</span> registra hora y monto de inicio de operaciones.</li>
            <li><span className="manual-btn">Registrar Movimiento</span> suma o resta efectivo de la caja chica.</li>
            <li><span className="manual-btn">Cerrar Caja</span> bloquea la edición del día, calcula diferencias e ingresa el reporte en el libro diario.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Pestaña: Historial de Gastos</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul><li>Tabla de gastos: Concepto, Categoría (Alquiler, Insumos, Impuestos, Sueldos), Fecha, Monto, Método de Pago y Estado (Pagado/Pendiente).</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul><li><span className="manual-btn">+ Registrar Gasto</span> abre formulario para añadir un nuevo gasto.</li></ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/finanzas-2026-06-16-7.38.39-pm.png" alt="Captura de modulo-6" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-7">
    <header>
      <div className="num">Módulo 07</div>
      <h2>Inventario ERP</h2>
      <div className="desc">Control total de stock, lotes FIFO, reposiciones y consumo.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Pestaña: Resumen General <span className="manual-pill">InventoryDashboard</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Valorización total del stock y % de productos cerca del límite crítico.</li>
            <li>Alertas de insumos agotados.</li>
            <li>Bitácora con los últimos 5 movimientos (entradas, salidas, ajustes).</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul><li><span className="manual-btn">Ver Bitácora Completa</span> redirige al historial de movimientos.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Pestaña: Catálogo de Stock <span className="manual-pill">ProductForm</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla / Ficha Técnica</span>
          <ul>
            <li><span className="manual-term">Estructura Avanzada de Ficha por Pestañas:</span>
              <ul>
                <li><span className="manual-term">Básico:</span> Nombre, Categoría, Unidad de Medida (ml, gr, Litros, unidades), Ubicación Interna, Descripción, Color e Icono personalizado.</li>
                <li><span className="manual-term">Stock &amp; Lotes:</span> Control de existencias (Stock Actual, Mínimo e Ideal) y conmutadores para activar el control de Vencimientos y seguimiento de Lotes/Batch en ingresos.</li>
                <li><span className="manual-term">Finanzas:</span> Costo de Compra, Precio de Venta sugerido e IVA o impuestos aplicables.</li>
                <li><span className="manual-term">Logística &amp; Envase:</span> Código SKU único, SKU del proveedor, Proveedor asociado, Días estimados de reposición (Lead Time), Peso físico, Volumen exacto, Dimensiones del envase (Largo/Ancho/Alto) y Código de barras/QR.</li>
              </ul>
            </li>
            <li><span className="manual-term">Badges en Tabla/Tarjetas:</span> Identificación visual inmediata si el producto requiere <i>"Control Lote"</i>, <i>"Control Vencimiento"</i> o si tiene <i>"Stock Crítico"</i>.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">+ Nuevo Producto</span> abre la ficha técnica avanzada tabulada para la carga completa.</li>
            <li><span className="manual-btn">+ / -</span> botones rápidos para ajustar stock sin abrir el formulario completo.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Pestaña: Control de Lotes (FIFO) <span className="manual-pill">BatchControl</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Lotes activos organizados por fecha de vencimiento.</li>
            <li>Cada tarjeta: Código de Lote, Producto, Cantidad Inicial/Actual, Costo Unitario y Días para Expirar (semáforo: Verde = Seguro, Amarillo = Vence pronto, Rojo = Expirado).</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul><li><span className="manual-btn">+ Registrar Nuevo Lote</span> carga mercadería (código, costo, cantidad, vencimiento). Aumenta el stock global automáticamente.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>D. Pestaña: Reposición de Stock <span className="manual-pill">PurchaseOrders</span> <span className="manual-pill">SupplierCRUD</span></h3>
        <p className="manual-tabs-note">Dividida en 2 sub-pestañas:</p>
        <div className="manual-block info">
          <span className="manual-tag">Sub-pestaña · Pedidos de Reposición</span>
          <ul>
            <li>Órdenes de compra con estados: BORRADOR, ENVIADO, CONFIRMADO, RECIBIDO y CANCELADO.</li>
            <li><span className="manual-term">Formulario de Pedido:</span> <span className="manual-descr">Proveedor, notas y grilla de productos, cantidades y precios pactados.</span></li>
            <li><span className="manual-btn">Crear Orden</span> genera el borrador.</li>
            <li><span className="manual-btn">Cambiar Estado a Recibido</span> crea los lotes FIFO e incrementa el stock general de los productos de la orden.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Sub-pestaña · Directorio de Proveedores</span>
          <ul>
            <li>Fichas con Nombre, Contacto, Teléfono, Email, Plazos de Pago (ej: "A 30 días") y Días de Entrega Promedio.</li>
            <li><span className="manual-term">CRUD de Proveedores</span> para añadir o editar.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>E. Pestaña: Reglas de Consumo <span className="manual-pill">ServiceConsumptionRules</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul><li>Grilla con la relación "Servicio X consume cantidad Y del producto Z".</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul><li><span className="manual-btn">Asociar Consumo</span> crea/modifica una regla (ej. "Alisado" con "Keratina Líquida (150ml)").</li></ul>
        </div>
      </div>

    </div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-8">
    <header>
      <div className="num">Módulo 08</div>
      <h2>Copilot Aura IA y Automatizaciones</h2>
      <div className="desc">Módulo de inteligencia operativa y flujos automáticos.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Vista Copilot Aura IA</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Sugerencias de la IA basadas en el análisis de datos de PostgreSQL:
              <ul>
                <li><span className="manual-term">Previsión de Días Vacíos</span> — sugiere campañas de descuento.</li>
                <li><span className="manual-term">Clientes Fugados</span> — clientes que no regresaron, con botón para enviar un cupón personalizado.</li>
                <li><span className="manual-term">Puntos de Quiebre de Stock</span> — estima cuándo se agotará un producto según el ritmo de turnos.</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Vista de Flujos de Trabajo (Workflows)</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul><li>Flujos activos e inactivos (ej. "Confirmación de Cita por Email", "Felicitación de Cumpleaños").</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">+ Crear Workflow</span> abre el constructor visual de automatizaciones.</li>
            <li><span className="manual-btn">Ver Historial de Ejecuciones</span> muestra logs de mensajes enviados, hora y fallos.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Constructor de Workflows</h3>
        <div className="manual-block func">
          <span className="manual-tag">Formulario de Configuración</span>
          <ul>
            <li><span className="manual-term">Desencadenante (Trigger):</span> <span className="manual-descr">Cita Creada, Cita Cancelada, Pago Recibido, Cumpleaños del Cliente, Cliente Inactivo.</span></li>
            <li><span className="manual-term">Condiciones:</span> <span className="manual-descr">filtros por Servicio, Profesional o Sucursal.</span></li>
            <li><span className="manual-term">Acción:</span> <span className="manual-descr">Enviar Email (plantillas), Enviar SMS, Notificar a Estilista o Disparar Webhook.</span></li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/workflow-2026-06-16-7.40.33-pm.png" alt="Captura de modulo-8" loading="lazy"/><img src="manual-assets/workflow-2026-06-16-7.41.42-pm.png" alt="Captura de modulo-8" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-9">
    <header>
      <div className="num">Módulo 09</div>
      <h2>Sincronizador de Google Sheets</h2>
      <div className="desc">Herramienta visual para importar bases de datos externas de clientes y servicios.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Pantalla de Configuración e Importación</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul><li>Campo para pegar la URL del documento de Google Sheets (o subir un CSV).</li></ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades</span>
          <ul><li><span className="manual-btn">Conectar Planilla</span> carga las primeras filas en memoria y abre la pantalla de mapeo.</li></ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Pantalla de Mapeo de Columnas</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li>Desplegables que listan las columnas de la planilla importada.</li>
            <li>El usuario empareja campos con columnas (ej: "Celular" en PostgreSQL ↔ "WhatsApp / Teléfono").</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades</span>
          <ul>
            <li><span className="manual-btn">Simular Importación</span> valida formatos (teléfonos, correos) y muestra registros listos y con errores (en rojo).</li>
            <li><span className="manual-btn">Procesar e Importar</span> guarda masivamente los registros válidos en la base Postgres de Neon Cloud.</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/importacion-2026-06-16-7.39.03-pm.png" alt="Captura de modulo-9" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-10">
    <header>
      <div className="num">Módulo 10</div>
      <h2>Configuración General y Roles (RBAC)</h2>
      <div className="desc">Administración de la identidad del negocio y permisos de seguridad del personal.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Configuración de Marca y Sucursales</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Formulario</span>
          <ul>
            <li><span className="manual-term">Datos del Salón:</span> <span className="manual-descr">Nombre, Teléfono, Sector e Industria.</span></li>
            <li><span className="manual-term">Personalización Visual:</span> <span className="manual-descr">Logo y paleta de colores corporativos (usados en la reserva pública).</span></li>
            <li><span className="manual-term">Slug de Reserva:</span> <span className="manual-descr">URL pública (ej. /booking/salon-aura).</span></li>
            <li><span className="manual-term">Lista de Sucursales:</span> <span className="manual-descr">CRUD de locales físicos con direcciones y teléfonos.</span></li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Matriz de Roles y Permisos <span className="manual-pill">RolesPermissionsPage</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Tabla de doble entrada (Matriz RBAC):
              <ul>
                <li><span className="manual-term">Filas</span> — más de 70 permisos por áreas (Agenda, Clientes, Finanzas, Inventario, Configuraciones, etc.).</li>
                <li><span className="manual-term">Columnas</span> — Roles (Owner/Dueño, Administrador, Encargado, Estilista, Recepción, Visualizador).</li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Checkboxes de la Matriz</span> tilda o destilda permisos individuales por rol.</li>
            <li><span className="manual-btn">Crear Rol Personalizado</span> nuevo rol (ej: "Estilista Junior") con accesos desde cero.</li>
            <li><span className="manual-btn">Guardar Cambios de Seguridad</span> aplica los permisos en caliente, impactando las sesiones activas.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Catálogo de Campos y Formularios Personalizados <span className="manual-pill">FieldRegistryEditor</span> <span className="manual-pill">FormSchemaEditor</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Definición</span>
          <ul>
            <li><span className="manual-term">Catálogo Global de Campos:</span> Define campos reutilizables asignados a entidades de la aplicación: <i>Empleado/Equipo, Cliente, Cita/Reserva, Servicio, y Workflows</i>.</li>
            <li><span className="manual-term">Campos Anidados (Subcampos):</span> Permite estructurar un campo con múltiples subcampos asociados (ej: en un campo "Dirección", agregar subcampos "Calle", "Número", "Piso", "CP"). Cada subcampo posee su propio tipo y regla de validación de obligatoriedad.</li>
            <li><span className="manual-term">Formularios Dinámicos:</span> Los esquemas de formularios (como el de "Alta de Empleado") renderizan estos campos y sus subcampos anidados agrupándolos lógicamente, realizando validaciones complejas de entrada en tiempo real.</li>
            <li><span className="manual-term">Persistencia JSON:</span> Los valores de los subcampos completados se guardan de forma anidada bajo la clave <span className="code">customFields.[fieldId].[subFieldId]</span> en formato JSON en PostgreSQL.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Guardar Catálogo</span> en el catálogo de campos persiste la lista global de definiciones de campos y subcampos.</li>
            <li><span className="manual-btn">Agregar Subcampo</span> dentro de un campo permite crear un subcampo anidado especificando su tipo (texto, número, selección, etc.) y si es obligatorio.</li>
            <li><span className="manual-btn">Guardar Formulario</span> en el editor de esquemas aplica el orden, visibilidad y validación de los campos/subcampos configurados para la creación y edición de registros.</li>
            <li><span className="manual-btn">Chevron Arriba / Abajo</span> reordena visualmente los campos y subcampos en la grilla y el formulario de carga.</li>
          </ul>
        </div>
      </div>

    <div className="manual-gallery"><img src="manual-assets/roles-2026-06-16-7.44.14-pm.png" alt="Captura de modulo-10" loading="lazy"/><img src="manual-assets/campos-2026-06-16-7.43.45-pm.png" alt="Captura de modulo-10" loading="lazy"/><img src="manual-assets/integraciones-2026-06-16-7.42.08-pm.png" alt="Captura de modulo-10" loading="lazy"/></div>
</div>
  </section>

  {/**/}
  <section className="manual-module" id="modulo-11">
    <header>
      <div className="num">Módulo 11</div>
      <h2>Generador de Contenido de Marketing e Instagram</h2>
      <div className="desc">Creador y editor visual de publicaciones para redes sociales integrado al historial visual y potenciado con IA.</div>
    </header>
    <div className="manual-module-body">

      <div className="manual-screen">
        <h3>A. Consentimiento y Autorización de Clientes <span className="manual-pill">ClientModal</span> <span className="manual-pill">ClientDetailModal</span></h3>
        <div className="manual-block info">
          <span className="manual-tag">Información / Privacidad</span>
          <ul>
            <li><span className="manual-term">Control de Consentimiento:</span> Opción de radio de Sí/No en el alta/edición de cliente que habilita el uso de su imagen con fines publicitarios.</li>
            <li><span className="manual-term">Banners de Advertencia:</span> En el historial visual del cliente, si no cuenta con el consentimiento activo, se muestra un aviso de alerta y se deshabilitan las opciones de publicación de Instagram.</li>
            <li><span className="manual-term">Flags de Historial Visual:</span> Tres checkboxes por cada fotografía cargada en el checkout:
              <ul>
                <li><span className="manual-term">Utilizar para Instagram:</span> Habilita la foto para el generador de publicaciones (requiere consentimiento de marketing activo).</li>
                <li><span className="manual-term">Mostrar en Portfolio:</span> Habilita la foto para ser mostrada en la reserva pública.</li>
                <li><span className="manual-term">Destacar Trabajo:</span> Resalta de forma prioritaria el resultado del servicio.</li>
              </ul>
            </li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Crear contenido para Instagram</span> en el historial visual recopila las fotos autorizadas seleccionadas y redirige al generador con las imágenes pre-cargadas.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>B. Asistente de Creación y Edición Visual <span className="manual-pill">MarketingView</span></h3>
        <p className="manual-tabs-note">Asistente paso a paso (Wizard) de 4 etapas para el diseño de publicaciones:</p>
        <div className="manual-block info">
          <span className="manual-tag">Paso 1 · Organización y Selección</span>
          <ul>
            <li>Modos de diseño: Una Imagen, Antes y Después (layout dual), Carrusel Multi Imagen y Carrusel Libre.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Paso 2 · Formato y Relación de Aspecto</span>
          <ul>
            <li>Formatos optimizados para redes sociales: Instagram Post (1:1), Story (9:16) y Portada de Reel. Mapea el lienzo con los ratios correctos.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Paso 3 · Personalización y Herramientas Visuales</span>
          <ul>
            <li>Superposición interactiva de logotipo del salón, nombre del negocio, marcas de agua personalizadas y textos libres con alineación seleccionable (arriba, al medio, abajo) y tipografías (clásica, moderna, manuscrita).</li>
            <li>Edición en vivo: Botones de rotación de imágenes individuales y arrastre/reordenamiento.</li>
          </ul>
        </div>
        <div className="manual-block info">
          <span className="manual-tag">Paso 4 · Copilot IA - Generación de Copy</span>
          <ul>
            <li>Llamado inteligente al modelo de IA para redactar pies de foto atractivos. Selección de rubro, servicio, tono (profesional, divertido, cercano, promocional) y llamada a la acción (CTA) deseada.</li>
            <li>Redacta de forma autónoma el texto del post, incorporando hashtags sugeridos y la información del servicio realizado.</li>
          </ul>
        </div>
        <div className="manual-block func">
          <span className="manual-tag">Funcionalidades / Botones</span>
          <ul>
            <li><span className="manual-btn">Generar Copy con IA</span> ejecuta el motor para redactar el post de manera inteligente.</li>
            <li><span className="manual-btn">Descargar ZIP</span> empaqueta todas las imágenes del carrusel en un único archivo comprimido en el cliente usando JSZip.</li>
            <li><span className="manual-btn">Copiar Post</span> copia el texto redactado y hashtags con un clic en el portapapeles.</li>
            <li><span className="manual-btn">Guardar Publicación</span> persiste el diseño en base de datos PostgreSQL como Borrador, Listo o Programado.</li>
          </ul>
        </div>
      </div>

      <div className="manual-screen">
        <h3>C. Biblioteca y Estado de Publicaciones</h3>
        <div className="manual-block info">
          <span className="manual-tag">Información en Pantalla</span>
          <ul>
            <li>Pestañas organizativas de contenidos:
              <ul>
                <li><span className="manual-term">Generados/Resumen:</span> Fotos autorizadas listas para usar y botón de nuevo diseño.</li>
                <li><span className="manual-term">Programados:</span> Calendario y lista de posts con fecha y hora programada.</li>
                <li><span className="manual-term">Borradores:</span> Diseños guardados a medio terminar.</li>
                <li><span className="manual-term">Publicados:</span> Historial de contenidos ya compartidos.</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </section>

</div>
</div></div>


      </div>

      {zoomImg && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' }}
          onClick={() => setZoomImg(null)}
        >
          <img src={zoomImg} style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} alt="Zoomed" />
        </div>
      )}
    </>
  );
}
