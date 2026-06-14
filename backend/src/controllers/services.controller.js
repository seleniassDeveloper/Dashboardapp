import prisma from "../prisma.js";

// Helper para validar campos comerciales
function validateServiceData({
  name,
  price,
  duration,
  depositRequired,
  depositAmount,
  commissionType,
  commissionValue,
}) {
  if (name !== undefined && !name.trim()) {
    return "El nombre del servicio es obligatorio.";
  }

  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) {
      return "El precio base debe ser un número mayor o igual a 0.";
    }
  }

  if (duration !== undefined) {
    const d = Number(duration);
    if (!Number.isFinite(d) || d <= 0) {
      return "La duración estimada debe ser mayor a 0 minutos.";
    }
  }

  if (depositRequired) {
    const p = Number(price || 0);
    const dep = Number(depositAmount || 0);
    if (dep <= 0) {
      return "Si la seña es requerida, el monto de la seña debe ser mayor a 0.";
    }
    if (dep > p) {
      return "El monto de la seña no puede ser superior al precio total del servicio.";
    }
  }

  if (commissionType === "porcentaje" && commissionValue !== undefined) {
    const cVal = Number(commissionValue);
    if (!Number.isFinite(cVal) || cVal < 0 || cVal > 100) {
      return "El valor de la comisión porcentual debe estar entre 0% y 100%.";
    }
  }

  if (commissionType === "fijo" && commissionValue !== undefined) {
    const cVal = Number(commissionValue);
    if (!Number.isFinite(cVal) || cVal < 0) {
      return "El valor de la comisión de monto fijo debe ser un número mayor o igual a 0.";
    }
  }

  return null;
}

// POST /api/services
export async function createService(req, res) {
  try {
    const {
      name,
      description,
      category,
      price,
      duration,
      preparationMinutes,
      cleanupMinutes,
      depositRequired,
      depositAmount,
      color,
      status,
      requiresApproval,
      commissionType,
      commissionValue,
      workerIds,
      inventoryItems,
    } = req.body;

    const validationError = validateServiceData({
      name,
      price,
      duration,
      depositRequired,
      depositAmount,
      commissionType,
      commissionValue,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const parsedPrice = Math.round(Number(price));
    const parsedDuration = Math.round(Number(duration));
    const parsedPrep = preparationMinutes ? Math.round(Number(preparationMinutes)) : 0;
    const parsedCleanup = cleanupMinutes ? Math.round(Number(cleanupMinutes)) : 0;
    const parsedDeposit = depositRequired ? Math.round(Number(depositAmount)) : 0;
    const parsedCommValue = commissionType !== "ninguno" ? Math.round(Number(commissionValue || 0)) : 0;

    const currentStatus = status || "active";
    const isActive = currentStatus !== "inactive";
    const availableOnline = currentStatus !== "hidden_online";

    const created = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        category: category ? category.trim() : null,
        price: parsedPrice,
        duration: parsedDuration,
        preparationMinutes: parsedPrep,
        cleanupMinutes: parsedCleanup,
        depositRequired: Boolean(depositRequired),
        depositAmount: parsedDeposit,
        color: color || "#10b981",
        status: currentStatus,
        isActive,
        availableOnline,
        requiresApproval: Boolean(requiresApproval),
        commissionType: commissionType || "porcentaje",
        commissionValue: parsedCommValue,
        businessId: req.businessId,
        workers: workerIds && Array.isArray(workerIds) && workerIds.length > 0 ? {
          create: workerIds.map(wId => ({
            workerId: wId
          }))
        } : undefined,
        consumptionRules: inventoryItems && Array.isArray(inventoryItems) && inventoryItems.length > 0 ? {
          create: inventoryItems.map(item => ({
            productId: item.productId,
            quantity: Number(item.quantity)
          }))
        } : undefined
      },
      include: {
        workers: { include: { worker: true } },
        consumptionRules: { include: { product: true } }
      }
    });

    return res.json(created);
  } catch (e) {
    console.error("createService error:", e);
    if (e?.code === "P2002") {
      return res.status(400).json({ error: "Ya existe un servicio con ese nombre." });
    }
    return res.status(500).json({ error: "Error creando servicio." });
  }
}

// GET /api/services
export async function listServices(req, res) {
  try {
    const { search, category, status, workerId, visibleOnline } = req.query;

    const where = { businessId: req.businessId };

    if (search && String(search).trim()) {
      where.name = {
        contains: String(search).trim(),
        mode: "insensitive"
      };
    }

    if (category && String(category).trim()) {
      where.category = String(category).trim();
    }

    if (status && String(status).trim()) {
      where.status = String(status).trim();
    }

    if (visibleOnline !== undefined) {
      where.availableOnline = visibleOnline === "true";
    }

    if (workerId && String(workerId).trim()) {
      where.workers = {
        some: {
          workerId: String(workerId).trim()
        }
      };
    }

    const services = await prisma.service.findMany({ where,
      include: {
        workers: {
          include: {
            worker: true
          }
        },
        consumptionRules: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
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
    const {
      name,
      description,
      category,
      price,
      duration,
      preparationMinutes,
      cleanupMinutes,
      depositRequired,
      depositAmount,
      color,
      status,
      requiresApproval,
      commissionType,
      commissionValue,
      workerIds,
      inventoryItems,
    } = req.body;

    const existing = await prisma.service.findFirst({ where: { id, businessId: req.businessId }
    });
    if (!existing) {
      return res.status(404).json({ error: "Servicio no encontrado." });
    }

    const validationError = validateServiceData({
      name,
      price,
      duration,
      depositRequired,
      depositAmount: depositRequired ? depositAmount : (existing.depositAmount || 0),
      commissionType: commissionType || existing.commissionType,
      commissionValue: commissionValue !== undefined ? commissionValue : existing.commissionValue,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Borrar de forma atómica los antiguos profesionales e insumos en una transacción
    await prisma.$transaction([
      workerIds !== undefined ? prisma.workerService.deleteMany({ where: { serviceId: id } }) : prisma.$executeRaw`SELECT 1`,
      inventoryItems !== undefined ? prisma.serviceConsumptionRule.deleteMany({ where: { serviceId: id } }) : prisma.$executeRaw`SELECT 1`,
    ]);

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (category !== undefined) updateData.category = category ? category.trim() : null;
    
    if (price !== undefined) updateData.price = Math.round(Number(price));
    if (duration !== undefined) updateData.duration = Math.round(Number(duration));
    if (preparationMinutes !== undefined) updateData.preparationMinutes = Math.round(Number(preparationMinutes));
    if (cleanupMinutes !== undefined) updateData.cleanupMinutes = Math.round(Number(cleanupMinutes));

    if (depositRequired !== undefined) {
      updateData.depositRequired = Boolean(depositRequired);
      updateData.depositAmount = depositRequired ? Math.round(Number(depositAmount)) : 0;
    }

    if (color !== undefined) updateData.color = color || "#10b981";

    if (status !== undefined) {
      updateData.status = status;
      updateData.isActive = status !== "inactive";
      updateData.availableOnline = status !== "hidden_online";
    }

    if (requiresApproval !== undefined) updateData.requiresApproval = Boolean(requiresApproval);
    if (commissionType !== undefined) updateData.commissionType = commissionType;
    
    if (commissionValue !== undefined) {
      updateData.commissionValue = commissionType !== "ninguno" ? Math.round(Number(commissionValue)) : 0;
    }

    // Volver a crear los vínculos granulados en el update de Prisma
    if (workerIds !== undefined && Array.isArray(workerIds) && workerIds.length > 0) {
      updateData.workers = {
        create: workerIds.map(wId => ({
          workerId: wId
        }))
      };
    }

    if (inventoryItems !== undefined && Array.isArray(inventoryItems) && inventoryItems.length > 0) {
      updateData.consumptionRules = {
        create: inventoryItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity)
        }))
      };
    }

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        workers: { include: { worker: true } },
        consumptionRules: { include: { product: true } }
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

// PATCH /api/services/:id/status
export async function toggleServiceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "hidden_online"].includes(status)) {
      return res.status(400).json({ error: "El estado provisto no es válido." });
    }

    const existing = await prisma.service.findFirst({ where: { id, businessId: req.businessId }
    });
    if (!existing) {
      return res.status(404).json({ error: "Servicio no encontrado." });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        status,
        isActive: status !== "inactive",
        availableOnline: status !== "hidden_online"
      },
      include: {
        workers: { include: { worker: true } },
        consumptionRules: { include: { product: true } }
      }
    });

    return res.json(updated);
  } catch (e) {
    console.error("toggleServiceStatus error:", e);
    return res.status(500).json({ error: "Error actualizando estado de servicio." });
  }
}

// DELETE /api/services/:id
export async function deleteService(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findFirst({ where: { id, businessId: req.businessId }
    });
    if (!existing) return res.status(404).json({ error: "Servicio no encontrado." });

    // Borrado relacional seguro en cascada
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { serviceId: id } }),
      prisma.workerService.deleteMany({ where: { serviceId: id } }),
      prisma.serviceConsumptionRule.deleteMany({ where: { serviceId: id } }),
      prisma.service.delete({ where: { id } })
    ]);

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteService error:", e);
    return res.status(500).json({ error: "Error eliminando servicio." });
  }
}