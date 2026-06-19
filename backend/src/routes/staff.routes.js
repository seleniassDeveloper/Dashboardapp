import { Router } from "express";
import prisma from "../prisma.js";
import { normalizeWorker } from "../utils/normalizeWorker.js";

const router = Router();

// GET /api/staff - Lista consolidada de todo el staff
router.get("/", async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      include: {
        services: { include: { service: true } },
        schedules: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const consolidatedList = await Promise.all(
      workers.map(async (w) => {
        const normalized = normalizeWorker(w);

        const appointments = await prisma.appointment.findMany({
          where: {
            workerId: w.id,
            startsAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            status: {
              in: ["DONE", "CONFIRMED"],
            },
          },
          include: {
            service: true,
          },
        });

        // Facturación mensual
        const billing = appointments.reduce((sum, appt) => sum + Number(appt.service?.price || 0), 0);

        // Minutos ocupados en citas
        const occupiedMinutes = appointments.reduce((sum, appt) => sum + Number(appt.service?.duration || 30), 0);

        // Calcular minutos laborables semanales
        let weeklyWorkingMinutes = 0;
        (w.schedules || []).forEach((s) => {
          const [startH, startM] = (s.startTime || "09:00").split(":").map(Number);
          const [endH, endM] = (s.endTime || "18:00").split(":").map(Number);
          const startMins = startH * 60 + startM;
          const endMins = endH * 60 + endM;
          if (endMins > startMins) {
            weeklyWorkingMinutes += (endMins - startMins);
          }
        });

        if (weeklyWorkingMinutes === 0) {
          weeklyWorkingMinutes = 40 * 60;
        }

        const monthlyWorkingMinutes = weeklyWorkingMinutes * 4.33;
        const calculatedOccupancy = Math.round((occupiedMinutes / monthlyWorkingMinutes) * 100);
        const occupancy = Math.max(0, Math.min(100, calculatedOccupancy));

        // Buscar próximo turno
        const nextAppointment = await prisma.appointment.findFirst({
          where: {
            workerId: w.id,
            startsAt: {
              gt: now,
            },
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          orderBy: {
            startsAt: "asc",
          },
          include: {
            service: true,
          },
        });

        const nextTurnStr = nextAppointment
          ? `${new Date(nextAppointment.startsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })} ${new Date(nextAppointment.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs - ${nextAppointment.service?.name}`
          : "Sin turnos próximos";

        const customFields = normalized.customFields || {};

        return {
          id: w.id,
          firstName: w.firstName,
          lastName: w.lastName,
          email: w.email || "",
          phone: w.phone || "",
          cargo: w.roleTitle || customFields.cargo || "Estilista",
          rol: customFields.role || "professional",
          status: customFields.status || "Activo",
          entryDate: customFields.entryDate || now.toISOString().split("T")[0],
          photo: customFields.photo || null,
          specialties: customFields.specialties || [],
          commissions: customFields.commissions || { type: "porcentaje", services: 40, products: 10, monthlyBonus: 0, monthlyTarget: 0 },
          schedules: normalized.schedules,
          services: normalized.services,
          billing,
          occupancy: occupancy || 0,
          nextTurn: nextTurnStr,
          lastAccess: customFields.lastAccess || "Nunca",
        };
      })
    );

    res.json(consolidatedList);
  } catch (error) {
    console.error("Error obteniendo lista consolidada de staff:", error);
    res.status(500).json({ error: "Error obteniendo lista consolidada de staff." });
  }
});

// GET /api/staff/:id/profile - Consolidado
router.get("/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;

    const w = await prisma.worker.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        schedules: true,
      },
    });

    if (!w) {
      return res.status(404).json({ error: "Colaborador no encontrado." });
    }

    const normalized = normalizeWorker(w);

    // Calcular facturación mensual y ocupación en base a las citas del mes en curso
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        workerId: id,
        startsAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          in: ["DONE", "CONFIRMED"],
        },
      },
      include: {
        service: true,
      },
    });

    // Facturación mensual (suma de los precios de servicios realizados)
    const billing = appointments.reduce((sum, appt) => sum + Number(appt.service?.price || 0), 0);

    // Minutos ocupados en citas
    const occupiedMinutes = appointments.reduce((sum, appt) => sum + Number(appt.service?.duration || 30), 0);

    // Calcular minutos laborables semanales en base a su agenda
    let weeklyWorkingMinutes = 0;
    (w.schedules || []).forEach((s) => {
      const [startH, startM] = (s.startTime || "09:00").split(":").map(Number);
      const [endH, endM] = (s.endTime || "18:00").split(":").map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      if (endMins > startMins) {
        weeklyWorkingMinutes += (endMins - startMins);
      }
    });

    // Fallback de 40 horas si no tiene agenda configurada
    if (weeklyWorkingMinutes === 0) {
      weeklyWorkingMinutes = 40 * 60;
    }

    const monthlyWorkingMinutes = weeklyWorkingMinutes * 4.33; // 4.33 semanas promedio al mes
    const calculatedOccupancy = Math.round((occupiedMinutes / monthlyWorkingMinutes) * 100);
    // Asegurar un rango realista de 0 a 100
    const occupancy = Math.max(0, Math.min(100, calculatedOccupancy));

    // Buscar próximo turno
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        workerId: id,
        startsAt: {
          gt: now,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      include: {
        service: true,
      },
    });

    const nextTurnStr = nextAppointment
      ? `${new Date(nextAppointment.startsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })} ${new Date(nextAppointment.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs - ${nextAppointment.service?.name}`
      : "Sin turnos próximos";

    const customFields = normalized.customFields || {};

    res.json({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      email: w.email || "",
      phone: w.phone || "",
      cargo: w.roleTitle || customFields.cargo || "Estilista",
      rol: customFields.role || "professional", // Rol de permisos
      status: customFields.status || "Activo",
      entryDate: customFields.entryDate || now.toISOString().split("T")[0],
      photo: customFields.photo || null,
      specialties: customFields.specialties || [],
      commissions: customFields.commissions || { type: "porcentaje", services: 40, products: 10, monthlyBonus: 0, monthlyTarget: 0 },
      schedules: normalized.schedules,
      services: normalized.services,
      billing,
      occupancy: occupancy || 0,
      nextTurn: nextTurnStr,
      lastAccess: customFields.lastAccess || "Nunca",
    });
  } catch (error) {
    console.error("Error consolidando perfil del staff:", error);
    res.status(500).json({ error: "Error consolidando perfil del staff." });
  }
});

export default router;
