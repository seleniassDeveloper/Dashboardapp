# 🌟 Documentación de Producción: Suite Operativa de Estética & Agenda Inteligente

Bienvenida al centro de control del sistema de gestión para tu salón de estética. Este documento recopila de manera ordenada todos los accesos rápidos a los servidores, bases de datos, los formularios de agendamiento móvil (tanto públicos como para administración rápida) y el alcance operativo completo de la suite.

---

## 🔗 1. Enlaces del Ecosistema en Producción

Toda la infraestructura está configurada para operar en capas **100% gratuitas** y de alta disponibilidad (Neon PostgreSQL + Render + Vercel).

| Componente | Rol en el Sistema | Enlace URL de Producción |
| :--- | :--- | :--- |
| **Frontend (Vercel)** | Interfaz de Usuario & Dashboard Principal | 🌐 [https://dashboard-react-rust-eight.vercel.app](https://dashboard-react-rust-eight.vercel.app) |
| **Dashboard Admin** | Acceso al panel administrativo completo | 📊 [https://dashboard-react-rust-eight.vercel.app/app](https://dashboard-react-rust-eight.vercel.app/app) |
| **Backend API (Render)** | Servidor de peticiones y lógica de negocio | 🚀 [https://dashboard-api-r6j9.onrender.com](https://dashboard-api-r6j9.onrender.com) |
| **Base de Datos (Neon)** | Motor PostgreSQL de alta velocidad | 💾 `postgresql://neondb_owner:npg_VM2FqC6lgIdj@ep-young-dust-amzvmdkk.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require` |

---

## 📱 2. Agendamiento y Captura de Citas desde Móvil

Hemos optimizado el sistema para que las citas puedan ingresarse de dos maneras desde cualquier dispositivo móvil o tablet:

### A. Formulario Público de Clientes (Autogestión)
*   **Enlace de Reserva**: [https://dashboard-react-rust-eight.vercel.app/booking/aura-studio](https://dashboard-react-rust-eight.vercel.app/booking/aura-studio)
*   **Funcionamiento**:
    *   **Paso 1**: La cliente ingresa desde su teléfono móvil y visualiza tu catálogo interactivo con colores y marca personalizados.
    *   **Paso 2**: Elige el servicio deseado (ej. *Balayage*, *Esmaltado Semi*).
    *   **Paso 3**: Selecciona su profesional preferido o elige "Asignar automáticamente".
    *   **Paso 4**: Elige fecha y hora utilizando un **algoritmo en tiempo real** que calcula los huecos libres exactos del salón para evitar solapamientos.
    *   **Paso 5**: Introduce sus datos (Nombre, Teléfono, Email) y confirma la cita. Al completarse, se sincroniza instantáneamente con el panel de control.

### B. Formulario de Carga Rápida (Uso Exclusivo del Personal / Administrador)
*   **Enlace Rápido Móvil**: [https://dashboard-react-rust-eight.vercel.app/booking/aura-studio/add?token=aura-admin-token](https://dashboard-react-rust-eight.vercel.app/booking/aura-studio/add?token=aura-admin-token)
*   **¿Para qué sirve?**: Pensado para que tú o tus estilistas puedan agendar citas velozmente desde sus teléfonos móviles mientras están trabajando, o si reciben una reserva directa por llamada telefónica/Instagram.
*   **Ventajas Únicas del Carga Rápida**:
    *   🔑 **Bypass de Seguridad**: Utiliza el token administrativo seguro `aura-admin-token` para autorizar operaciones de base de datos sin obligar al estilista a ingresar sus credenciales completas de Google en su móvil personal.
    *   🔍 **Buscador de Clientes Integrado**: Puedes tipear las primeras letras del nombre de una cliente existente para rellenar sus datos automáticamente en un segundo.
    *   ➕ **Creación Exprés de Fichas**: Si es una cliente nueva, puedes crear su ficha de contacto directamente desde la misma pantalla.
    *   ⚡ **Agendado Express**: Selección en caliente del profesional, el servicio, fecha, y horario disponible para impacto en base de datos al instante.

---

## 🛠️ 3. Funcionamiento General y Alcance de la Aplicación

El sistema está diseñado específicamente para resolver las complejidades de salones de belleza y estética a través de **9 módulos operativos** completamente interconectados.

### Módulos del Sistema y sus Capacidades

#### 📈 1. Métricas de Negocio & Dashboard General
*   **Resumen Financiero en Tiempo Real**: Tarjetas KPI que calculan facturación total, comisiones de estilistas, gastos deducidos y ganancias netas del salón.
*   **Flujo de Facturación**: Un gráfico de barras interactivo de Recharts que compara visualmente las ventas por día y mes para analizar el crecimiento.
*   **Listado Operativo**: Control inmediato de las citas del día, estados de pago y accesos directos de edición rápida.

#### 📊 2. Sincronizador de Google Sheets Visual
*   **Carga Masiva**: Ideal para importar tu libreta de papel o planillas Excel antiguas en menos de 5 segundos.
*   **Mapeador Dinámico**: Un selector interactivo donde asocias las columnas de tu Excel (*"Nombre"*, *"WhatsApp"*, *"Servicio"*, *"Estilista"*, *"Importe"*) con los campos de la base de datos PostgreSQL.
*   **Simulador Seguro**: Muestra los datos mapeados en pantalla para que verifiques que estén correctos antes de guardarlos.

#### 📑 3. Ficha Avanzada del Cliente ("Dossier Clínico")
*   **Ficha de Coloración e Insumos**: Espacio especializado para guardar la combinación exacta de tinturas (ej: *L'Oréal 7.3 + Revelador 20 vol*), marcas de esmalte y observaciones médicas o alergias.
*   **Historial de Visitas**: Muestra todas las citas pasadas, ticket promedio y la estilista que lo atendió.
*   **Galería Antes y Después**: Subida y visualización interactiva de fotos de los cambios de look realizados.
*   **Reactivación Inteligente**: Alerta visual automática si el cliente no asiste desde hace **más de 45 días**. Incluye un botón para enviar un mensaje redactado automáticamente a su WhatsApp:
    > *"¡Hola [Nombre]! Te extrañamos en Aura Studio. Notamos que no nos visitas desde tu último servicio de [Servicio] con [Estilista]. ¡Te dejamos un 15% de descuento en tu próximo turno para consentirte de nuevo! Redirige aquí..."*

#### 📅 4. Agenda Inteligente & Lista de Espera
*   **Pantalla en Dos Columnas**: Mantiene el calendario visible de un lado y las herramientas automatizadas del otro.
*   **Lista de Espera Activa**: Permite anotar a clientes en espera de un hueco para hoy, indicando servicio y preferencia horaria.
*   **Detección de Huecos Vacíos**: El sistema analiza la agenda del día e identifica de forma autónoma los tramos horarios menos ocupados para sugerirlos proactivamente al agendar.
*   **WhatsApp Reminder**: Formatea y copia la plantilla de confirmación de cita al portapapeles con un solo botón.

#### 💰 5. Finanzas & Control de Caja
*   **Cálculo de Ganancia Real**: Deducción automatizada de los costos fijos (alquiler, luz, tinturas, etc.) y las comisiones del 40% del equipo para mostrar la ganancia real neta del negocio.
*   **Gráfico de Métodos de Pago**: Distribución circular interactiva de cobros en Efectivo, Visa, Mastercard o Transferencia Bancaria.

#### 👥 6. Comisiones & Liquidación de Estilistas
*   **Liquidador Automático al 40%**: Calcula los montos exactos a abonar a cada profesional según los turnos atendidos y completados en el mes.
*   **Porcentaje de Retención**: Analiza cuántos clientes nuevos deciden volver a agendar específicamente con cada estilista.
*   **Gráfico de Contribución**: Ranking visual de participación de ventas de cada colaborador en el total mensual del salón.

#### 📦 7. Control de Inventario
*   **Alertas de Stock Crítico**: Panel que avisa si un insumo (ej: *Pinceles*, *Tinturas*, *Clarificantes*) cae por debajo de su stock de seguridad.
*   **Modo Táctil de Ajuste**: Botones de `+` y `-` para aumentar o reducir cantidades rápidamente desde el móvil.
*   **Enlace Insumo ↔ Servicio**: Define cuánto insumo gasta cada servicio (ej: un *Balayage* descuenta automáticamente un tubo de tintura del inventario).
*   **Pedido Express a Proveedor**: Redacta una orden de compra formateada en texto plano lista para copiar y enviar al proveedor por WhatsApp con los insumos agotados.

#### 🤖 8. AI Copilot - Alertas Operativas de Negocio
*   Un panel con notificaciones de negocio inteligentes y ejecutables que te asisten en la toma de decisiones:
    *   *Día lento detectado (Jueves)*: Botón directo para lanzar una promoción 2x1.
    *   *Baja de facturación semanal*: Botón para abrir campaña de reactivación.
    *   *Fugas de Clientes*: Notificación directa con link de WhatsApp sobre las clientes en riesgo de abandono.

#### 📢 9. Generador de Contenido de Marketing e Instagram
*   **Reutilización del Historial Visual**: Permite aprovechar las fotografías del "Antes" y "Después" tomadas en el checkout de los servicios de clientes que hayan autorizado el uso de imagen.
*   **Asistente de Diseño (Wizard)**: Interfaz de 4 pasos para configurar:
    *   *Layout*: Una sola foto, Before/After comparativo o Carrusel Multi Imagen.
    *   *Formato*: Dimensiones optimizadas (1:1 Post, 9:16 Story, Portada Reel).
    *   *Personalización*: Inserción del logotipo del salón, nombre del negocio, marcas de agua translúcidas y textos flotantes con tipografías y alineaciones personalizadas. También soporta rotación 90° e reordenamiento de fotos.
*   **Generador de Copy por IA (Copilot IA)**: Redacta el pie de foto de Instagram con inteligencia artificial basado en el tipo de servicio, rubro y tono (profesional, divertido, promocional), e incluye hashtags relevantes y llamada a la acción (CTA).
*   **Exportación Directa**: Permite copiar el caption al portapapeles y empaquetar el carrusel completo en un ZIP del lado del cliente.

---

## 💡 Recomendaciones de Mantenimiento

1.  **Copias de Seguridad de Base de Datos**: Dado que estás en el plan Neon Serverless gratuito, puedes ver las tablas ingresando a tu consola de Neon en cualquier momento.
2.  **Caché del Frontend**: Cuando realices cambios en los colores o servicios, recuerda que el navegador de los clientes puede almacenar en caché las páginas por unas horas. Un refresco rápido forzado solucionará cualquier discrepancia visual.

---
*Este documento ha sido confeccionado y configurado en tu servidor de forma permanente para servir como manual técnico de tu Suite de Estética.*
