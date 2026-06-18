import prisma from "../prisma.js";

// Obtener todos los widgets del usuario
export async function getWidgets(req, res) {
  try {
    const userId = req.user.uid;
    let widgets = await prisma.dashboardWidget.findMany({ where: { businessId: req.businessId,  userId },
      orderBy: { createdAt: "asc" },
    });

    // Si el usuario no tiene widgets, inicializar con los widgets sugeridos por defecto
    if (widgets.length === 0) {
      const defaults = [
        {
          userId,
          title: "Próximas Citas (SLA)",
          type: "upcoming_appointments",
          config: { color: "#3b82f6", range: "ALL" },
          layout: { w: 4, h: 5 },
        },
        {
          userId,
          title: "Requiere Atención",
          type: "attention",
          config: { color: "#ef4444", range: "ALL" },
          layout: { w: 4, h: 5 },
        },
        {
          userId,
          title: "Agenda de Citas",
          type: "calendar",
          config: { color: "#10b981", range: "ALL" },
          layout: { w: 4, h: 5 },
        },
        {
          userId,
          title: "Horas Pico de Reserva",
          type: "chart",
          config: { metric: "peak_hours", entity: "appointments", chartType: "bar", range: "THIS_MONTH", color: "#3b82f6" },
          layout: { w: 6, h: 4 },
        },
        {
          userId,
          title: "Ventas por Servicio (Mix de Salón)",
          type: "chart",
          config: { metric: "services_sales", entity: "services", chartType: "pie", range: "THIS_MONTH", color: "#ec4899" },
          layout: { w: 6, h: 4 },
        },
        {
          userId,
          title: "Carga de Trabajo (Citas por Estilista)",
          type: "chart",
          config: { metric: "workers_load", entity: "workers", chartType: "bar", range: "THIS_MONTH", color: "#d97706" },
          layout: { w: 6, h: 4 },
        },
        {
          userId,
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
          layout: { w: 6, h: 4 },
        },
      ];

      // Insertar en base de datos
      await prisma.dashboardWidget.createMany({ data: defaults });
      
      // Consultar de nuevo para tener los IDs creados por la base de datos
      widgets = await prisma.dashboardWidget.findMany({ where: { businessId: req.businessId,  userId },
        orderBy: { createdAt: "asc" },
      });
    }

    return res.json(widgets);
  } catch (error) {
    console.error("Error obteniendo widgets:", error);
    return res.status(500).json({ error: "Error interno al obtener widgets." });
  }
}

// Crear un nuevo widget
export async function createWidget(req, res) {
  try {
    const userId = req.user.uid;
    const { title, type, config, layout } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: "El título y tipo de widget son obligatorios." });
    }

    const widget = await prisma.dashboardWidget.create({
      data: {
        userId,
        title,
        type,
        config: config || {},
        layout: layout || { x: 0, y: 100, w: 6, h: 4 },
      },
    });

    return res.status(201).json(widget);
  } catch (error) {
    console.error("Error creando widget:", error);
    return res.status(500).json({ error: "Error interno al crear widget." });
  }
}

// Actualizar un widget (configuración o título)
export async function updateWidget(req, res) {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { title, config, layout } = req.body;

    const widget = await prisma.dashboardWidget.update({
      where: { id, userId },
      data: {
        ...(title !== undefined && { title }),
        ...(config !== undefined && { config }),
        ...(layout !== undefined && { layout }),
      },
    });

    return res.json(widget);
  } catch (error) {
    console.error("Error actualizando widget:", error);
    return res.status(500).json({ error: "Error interno al actualizar widget." });
  }
}

// Actualizar múltiples layouts en lote (Drag & Drop)
export async function updateLayouts(req, res) {
  try {
    const userId = req.user.uid;
    const { layouts } = req.body; // Array de { id, layout: { x, y, w, h } }

    if (!Array.isArray(layouts)) {
      return res.status(400).json({ error: "Formato de layouts incorrecto. Debe ser un arreglo." });
    }

    const updates = layouts.map((item) =>
      prisma.dashboardWidget.update({
        where: { id: item.id, userId },
        data: { layout: item.layout },
      })
    );

    await prisma.$transaction(updates);

    return res.json({ ok: true, message: "Layouts actualizados." });
  } catch (error) {
    console.error("Error actualizando layouts en lote:", error);
    return res.status(500).json({ error: "Error interno al guardar distribución." });
  }
}

// Eliminar un widget
export async function deleteWidget(req, res) {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const existing = await prisma.dashboardWidget.findFirst({ where: { businessId: req.businessId,  id, userId } });
    if (!existing) {
      return res.status(404).json({ error: "Widget no encontrado o sin permisos." });
    }

    await prisma.dashboardWidget.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error eliminando widget:", error);
    return res.status(500).json({ error: "Error interno al eliminar widget." });
  }
}

// Restaurar widgets por defecto
export async function restoreDefaults(req, res) {
  try {
    const userId = req.user.uid;
    await prisma.dashboardWidget.deleteMany({
      where: { userId }
    });
    return res.json({ success: true, message: "Widgets restaurados a sus valores por defecto." });
  } catch (error) {
    console.error("Error restaurando widgets:", error);
    return res.status(500).json({ error: "Error al restaurar widgets." });
  }
}
