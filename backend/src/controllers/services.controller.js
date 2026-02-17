import prisma from "../prisma.js";

// POST /api/services
export async function createService(req, res) {
  try {
    const { name, price, duration, isActive } = req.body;

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
      },
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
      active === "true" ? { isActive: true } :
      active === "false" ? { isActive: false } :
      {};

    const services = await prisma.service.findMany({
      where,
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
    const { name, price, duration, isActive } = req.body;

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

    const updated = await prisma.service.update({
      where: { id },
      data,
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

    const count = await prisma.appointment.count({ where: { serviceId: id } });
    if (count > 0) {
      return res.status(400).json({
        error: "No se puede eliminar: hay citas usando este servicio.",
      });
    }

    await prisma.service.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteService error:", e);
    return res.status(500).json({ error: "Error eliminando servicio." });
  }
}