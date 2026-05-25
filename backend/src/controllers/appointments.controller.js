import prisma from "../prisma.js";
import {
  validateAppointmentSlot,
  findAvailableWorkers,
} from "../services/appointmentAvailability.js";

/**
 * Traduce el motivo por el que un horario no está disponible a un código HTTP:
 *  - 404: el servicio o el profesional no existen
 *  - 400: el profesional no realiza ese servicio / fecha inválida
 *  - 409: el horario no es reservable (fuera de horario, día no laboral o solapamiento)
 */
function slotErrorStatus(code) {
  switch (code) {
    case "INVALID_SERVICE":
    case "INVALID_WORKER":
      return 404;
    case "WORKER_NOT_SERVICE":
    case "INVALID_DATE":
      return 400;
    case "OUTSIDE_SCHEDULE":
    case "DAY_OFF":
    case "CONFLICT":
    default:
      return 409;
  }
}

export async function getAppointments(req, res) {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        client: true,
        worker: true,
        service: true,
      },
    });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Error obteniendo citas:", error);

    return res.status(500).json({
      error: "Error obteniendo citas",
      detail: error?.message || "Unknown error",
    });
  }
}

export async function checkAppointmentAvailability(req, res) {
  try {
    const { workerId, serviceId, startsAt, excludeId } = req.query;

    if (!workerId || !serviceId || !startsAt) {
      return res.status(400).json({
        error: "Parámetros requeridos: workerId, serviceId, startsAt.",
      });
    }

    const result = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
      excludeAppointmentId: excludeId || null,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    return res.status(500).json({
      error: "Error verificando disponibilidad.",
      detail: error?.message || "Unknown error",
    });
  }
}

export async function createAppointment(req, res) {
  try {
    const { clientId, serviceId, workerId, startsAt, notes, status } = req.body;

    if (!clientId || !serviceId || !workerId || !startsAt) {
      return res.status(400).json({
        error: "Faltan datos: clientId, serviceId, workerId, startsAt.",
      });
    }

    const client = await prisma.client.findUnique({
      where: { id: String(clientId) },
      select: { id: true },
    });

    if (!client) {
      return res.status(400).json({ error: "Cliente inválido." });
    }

    const slot = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
    });

    if (!slot.available) {
      return res.status(slotErrorStatus(slot.code)).json({
        error: slot.reason || "El profesional no está disponible en ese horario.",
        code: slot.code || null,
        conflict: slot.conflict || null,
        availableWorkers: slot.availableWorkers || [],
      });
    }

    const appt = await prisma.appointment.create({
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        workerId: String(workerId),
        startsAt: new Date(startsAt),
        notes: notes || null,
        status: status || "PENDING",
      },
      include: {
        client: true,
        worker: true,
        service: true,
      },
    });

    return res.status(201).json(appt);
  } catch (e) {
    console.error("Error creando la cita:", e);

    return res.status(500).json({
      error: "Error creando la cita.",
      detail: e?.message || "Unknown error",
    });
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { clientId, serviceId, workerId, startsAt, notes, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Id inválido." });
    }

    if (!clientId || !serviceId || !workerId || !startsAt) {
      return res.status(400).json({
        error: "Faltan datos: clientId, serviceId, workerId, startsAt.",
      });
    }

    const client = await prisma.client.findUnique({
      where: { id: String(clientId) },
      select: { id: true },
    });

    if (!client) {
      return res.status(400).json({ error: "Cliente inválido." });
    }

    const slot = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
      excludeAppointmentId: id,
    });

    if (!slot.available) {
      return res.status(slotErrorStatus(slot.code)).json({
        error: slot.reason || "El profesional no está disponible en ese horario.",
        code: slot.code || null,
        conflict: slot.conflict || null,
        availableWorkers: slot.availableWorkers || [],
      });
    }

    const appt = await prisma.appointment.update({
      where: { id: String(id) },
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        workerId: String(workerId),
        startsAt: new Date(startsAt),
        notes: notes || null,
        status: status || undefined,
      },
      include: {
        client: true,
        worker: true,
        service: true,
      },
    });

    return res.status(200).json(appt);
  } catch (e) {
    console.error("Error actualizando la cita:", e);

    return res.status(500).json({
      error: "Error actualizando la cita.",
      detail: e?.message || "Unknown error",
    });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const id = String(req.params.id || "");

    if (!id) {
      return res.status(400).json({ error: "Id inválido." });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Error eliminando cita:", e);

    return res.status(500).json({
      error: "Error eliminando cita.",
      detail: e?.message || "Unknown error",
    });
  }
}

export async function getBusinessConfig(req, res) {
  try {
    let biz = await prisma.business.findFirst();
    if (!biz) {
      biz = await prisma.business.create({
        data: {
          name: "Aura Studio",
          slug: "mi-negocio",
          description: "Estudio de bienestar, estética y servicios profesionales.",
          bookingEnabled: true,
          bookingPrimaryColor: "#10b981",
          bookingConfirmationMessage: "¡Tu reserva ha sido confirmada con éxito!",
        },
      });
    }
    return res.json(biz);
  } catch (error) {
    console.error("Error obteniendo config del negocio:", error);
    return res.status(500).json({ error: "Error obteniendo configuración del negocio." });
  }
}

export async function updateBusinessConfig(req, res) {
  try {
    const {
      name,
      slug,
      logo,
      description,
      bookingEnabled,
      bookingPrimaryColor,
      bookingConfirmationMessage,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "El nombre y el slug del negocio son obligatorios." });
    }

    let biz = await prisma.business.findFirst();
    if (!biz) {
      biz = await prisma.business.create({
        data: {
          name,
          slug,
          logo: logo || null,
          description: description || null,
          bookingEnabled: bookingEnabled ?? true,
          bookingPrimaryColor: bookingPrimaryColor || "#10b981",
          bookingConfirmationMessage: bookingConfirmationMessage || "¡Tu reserva ha sido confirmada con éxito!",
        },
      });
    } else {
      biz = await prisma.business.update({
        where: { id: biz.id },
        data: {
          name,
          slug,
          logo: logo !== undefined ? logo : biz.logo,
          description: description !== undefined ? description : biz.description,
          bookingEnabled: bookingEnabled !== undefined ? bookingEnabled : biz.bookingEnabled,
          bookingPrimaryColor: bookingPrimaryColor !== undefined ? bookingPrimaryColor : biz.bookingPrimaryColor,
          bookingConfirmationMessage: bookingConfirmationMessage !== undefined ? bookingConfirmationMessage : biz.bookingConfirmationMessage,
        },
      });
    }

    return res.json(biz);
  } catch (error) {
    console.error("Error actualizando config del negocio:", error);
    return res.status(500).json({ error: "Error actualizando configuración del negocio." });
  }
}

