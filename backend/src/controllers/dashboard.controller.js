import prisma from "../prisma.js";

// Obtener todos los widgets del usuario para el negocio activo
export async function getWidgets(req, res) {
  try {
    const userId = req.user.uid;
    const businessId = req.businessId;

    if (!businessId) {
      return res.status(400).json({ error: "No se especificó el negocio." });
    }

    let widgets = await prisma.dashboardWidget.findMany({
      where: { userId, businessId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    // Si el usuario no tiene widgets para este negocio, inicializar defaults
    if (widgets.length === 0) {
      const defaults = [
        {
          userId,
          businessId,
          position: 0,
          title: "Próximas Citas (SLA)",
          type: "upcoming_appointments",
          config: { color: "#3b82f6", range: "TODAY" },
          layout: { x: 0, y: 0, w: 4, h: 5 },
        },
        {
          userId,
          businessId,
          position: 1,
          title: "Requiere Atención",
          type: "attention",
          config: { color: "#ef4444", range: "ALL" },
          layout: { x: 4, y: 0, w: 4, h: 5 },
        },
        {
          userId,
          businessId,
          position: 2,
          title: "Agenda de Citas",
          type: "calendar",
          config: { color: "#10b981", range: "ALL" },
          layout: { x: 8, y: 0, w: 4, h: 5 },
        },
        {
          userId,
          businessId,
          position: 3,
          title: "Horas Pico de Reserva",
          type: "chart",
          config: { metric: "peak_hours", entity: "appointments", chartType: "bar", range: "THIS_MONTH", color: "#3b82f6" },
          layout: { x: 0, y: 5, w: 6, h: 4 },
        },
        {
          userId,
          businessId,
          position: 4,
          title: "Ventas por Servicio (Mix de Salón)",
          type: "chart",
          config: { metric: "services_sales", entity: "services", chartType: "pie", range: "THIS_MONTH", color: "#ec4899" },
          layout: { x: 6, y: 5, w: 6, h: 4 },
        },
        {
          userId,
          businessId,
          position: 5,
          title: "Carga de Trabajo (Citas por Estilista)",
          type: "chart",
          config: { metric: "workers_load", entity: "workers", chartType: "bar", range: "THIS_MONTH", color: "#d97706" },
          layout: { x: 0, y: 9, w: 6, h: 4 },
        },
        {
          userId,
          businessId,
          position: 6,
          title: "AI Copilot Insights",
          type: "ai_insight",
          config: {
            color: "#8b5cf6",
            range: "THIS_MONTH",
            insights: [
              "El volumen de facturación en cortes y balayage ha crecido un 15% gracias a la retención de clientes.",
              "Se detecta saturación horaria los sábados por la tarde, considera habilitar agendas extras.",
            ],
          },
          layout: { x: 6, y: 9, w: 6, h: 4 },
        },
      ];

      // Insertar en base de datos
      await prisma.dashboardWidget.createMany({ data: defaults });
      
      // Consultar de nuevo con los IDs asignados
      widgets = await prisma.dashboardWidget.findMany({
        where: { userId, businessId },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      });
    }

    return res.json(widgets);
  } catch (error) {
    console.error("[dashboard] getWidgets:", error?.message || error);
    return res.status(500).json({ error: "Error interno al obtener widgets." });
  }
}

// Crear un nuevo widget
export async function createWidget(req, res) {
  try {
    const userId = req.user.uid;
    const businessId = req.businessId;
    const { title, type, config, layout, position } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: "El título y tipo de widget son obligatorios." });
    }

    const count = await prisma.dashboardWidget.count({ where: { userId, businessId } });

    const widget = await prisma.dashboardWidget.create({
      data: {
        userId,
        businessId,
        title,
        type,
        config: config || {},
        layout: layout || { x: 0, y: 100, w: 6, h: 4 },
        position: position !== undefined ? Number(position) : count,
      },
    });

    return res.status(201).json(widget);
  } catch (error) {
    console.error("[dashboard] createWidget:", error?.message || error);
    return res.status(500).json({ error: "Error interno al crear widget." });
  }
}

// Actualizar un widget (configuración, título o posición)
export async function updateWidget(req, res) {
  try {
    const userId = req.user.uid;
    const businessId = req.businessId;
    const { id } = req.params;
    const { title, config, layout, position } = req.body;

    const existing = await prisma.dashboardWidget.findFirst({
      where: { id, userId, businessId }
    });
    if (!existing) {
      return res.status(404).json({ error: "Widget no encontrado o no pertenece a este negocio." });
    }

    const widget = await prisma.dashboardWidget.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(config !== undefined && { config }),
        ...(layout !== undefined && { layout }),
        ...(position !== undefined && { position: Number(position) }),
      },
    });

    return res.json(widget);
  } catch (error) {
    console.error("[dashboard] updateWidget:", error?.message || error);
    return res.status(500).json({ error: "Error interno al actualizar widget." });
  }
}

// Actualizar múltiples layouts y posiciones en lote (Drag & Drop)
export async function updateLayouts(req, res) {
  try {
    const userId = req.user.uid;
    const businessId = req.businessId;
    const { layouts } = req.body; // Array de { id, position, layout: { x, y, w, h } }

    if (!Array.isArray(layouts)) {
      return res.status(400).json({ error: "Formato de layouts incorrecto. Debe ser un arreglo." });
    }

    const updates = layouts.map((item, index) =>
      prisma.dashboardWidget.updateMany({
        where: { id: item.id, userId, businessId },
        data: {
          layout: item.layout,
          position: item.position !== undefined ? Number(item.position) : index,
        },
      })
    );

    await prisma.$transaction(updates);

    return res.json({ ok: true, message: "Layouts y posiciones actualizados." });
  } catch (error) {
    console.error("[dashboard] updateLayouts:", error?.message || error);
    return res.status(500).json({ error: "Error interno al guardar distribución." });
  }
}

// Eliminar un widget
export async function deleteWidget(req, res) {
  try {
    const userId = req.user.uid;
    const businessId = req.businessId;
    const { id } = req.params;

    const existing = await prisma.dashboardWidget.findFirst({
      where: { id, userId, businessId }
    });
    if (!existing) {
      return res.status(404).json({ error: "Widget no encontrado o sin permisos." });
    }

    await prisma.dashboardWidget.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("[dashboard] deleteWidget:", error?.message || error);
    return res.status(500).json({ error: "Error interno al eliminar widget." });
  }
}

// Restaurar widgets por defecto
export async function restoreDefaults(req, res) {
  try {
    const userId = req.user.uid;
    const businessId = req.businessId;
    await prisma.dashboardWidget.deleteMany({
      where: { userId, businessId }
    });
    return res.json({ success: true, message: "Widgets restaurados a sus valores por defecto." });
  } catch (error) {
    console.error("[dashboard] restoreDefaults:", error?.message || error);
    return res.status(500).json({ error: "Error al restaurar widgets." });
  }
}
