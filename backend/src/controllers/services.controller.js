import prisma from "../prisma.js";

// POST /api/services
export async function createService(req, res) {
  try {
    const { name, price, duration, isActive, workerIds } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "El nombre del servicio es obligatorio." });
    }

    const parsedPrice = Number.parseInt(price, 10);
    const parsedDuration = Number.parseInt(duration, 10);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "price debe ser un número entero válido." });
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return res.status(400).json({ error: "duration debe ser un número entero > 0." });
    }

    const created = await prisma.service.create({
      data: {
        name: name.trim(),
        price: parsedPrice,
        duration: parsedDuration,
        isActive: typeof isActive === "boolean" ? isActive : true,
        businessId: req.businessId,
        workers: workerIds && Array.isArray(workerIds) ? {
          create: workerIds.map(wId => ({
            workerId: wId
          }))
        } : undefined
      },
      include: {
        workers: {
          include: {
            worker: true
          }
        }
      }
    });

    return res.json(created);
  } catch (e) {
    console.error("createService error:", e);

    // Error típico: name unique
    if (e?.code === "P2002") {
      return res.status(400).json({ error: "Ya existe un servicio con ese nombre." });
    }

    return res.status(500).json({ error: "Error creando servicio." });
  }
}

// GET /api/services
export async function listServices(req, res) {
  try {
    const active = req.query.active;

    const where =
      active === "true" ? { isActive: true, businessId: req.businessId } :
      active === "false" ? { isActive: false, businessId: req.businessId } :
      { businessId: req.businessId };

    const services = await prisma.service.findMany({
      where,
      include: {
        workers: {
          include: {
            worker: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(services);
  } catch (e) {
    console.error("listServices error:", e);
    return res.status(500).json({ error: "Error listando servicios." });
  }
}

// PUT /api/services/:id
export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const { name, price, duration, isActive, workerIds } = req.body;

    const existing = await prisma.service.findFirst({
      where: { id, businessId: req.businessId }
    });
    if (!existing) return res.status(404).json({ error: "Servicio no encontrado." });

    const data = {};

    if (name !== undefined) {
      if (!name?.trim()) return res.status(400).json({ error: "name inválido." });
      data.name = name.trim();
    }

    if (price !== undefined) {
      const parsedPrice = Number.parseInt(price, 10);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: "price debe ser un número entero válido." });
      }
      data.price = parsedPrice;
    }

    if (duration !== undefined) {
      const parsedDuration = Number.parseInt(duration, 10);
      if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({ error: "duration debe ser un número entero > 0." });
      }
      data.duration = parsedDuration;
    }

    if (isActive !== undefined) {
      data.isActive = Boolean(isActive);
    }

    if (workerIds !== undefined && Array.isArray(workerIds)) {
      // Borrar antiguos vínculos
      await prisma.workerService.deleteMany({
        where: { serviceId: id }
      });
      
      // Crear nuevos vínculos
      if (workerIds.length > 0) {
        data.workers = {
          create: workerIds.map(wId => ({
            workerId: wId
          }))
        };
      }
    }

    const updated = await prisma.service.update({
      where: { id },
      data,
      include: {
        workers: {
          include: {
            worker: true
          }
        }
      }
    });

    return res.json(updated);
  } catch (e) {
    console.error("updateService error:", e);

    if (e?.code === "P2002") {
      return res.status(400).json({ error: "Ya existe un servicio con ese nombre." });
    }

    return res.status(500).json({ error: "Error actualizando servicio." });
  }
}

// DELETE /api/services/:id
export async function deleteService(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findFirst({
      where: { id, businessId: req.businessId }
    });
    if (!existing) return res.status(404).json({ error: "Servicio no encontrado." });

    // Primero eliminamos en cascada las citas asociadas para evitar conflictos de clave foránea
    await prisma.appointment.deleteMany({
      where: { serviceId: id },
    });

    // Eliminamos los vínculos con colaboradores
    await prisma.workerService.deleteMany({
      where: { serviceId: id },
    });

    // Finalmente eliminamos el servicio
    await prisma.service.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteService error:", e);
    return res.status(500).json({ error: "Error eliminando servicio." });
  }
}