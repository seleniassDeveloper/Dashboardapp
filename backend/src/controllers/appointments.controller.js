import fs from "node:fs";
import path from "node:path";
import prisma from "../prisma.js";
import {
  validateAppointmentSlot,
  findAvailableWorkers,
  overlaps,
  addMinutes,
} from "../services/appointmentAvailability.js";
import { getDayRangeInTz } from "../utils/timezone.util.js";
import { sendReminderEmail } from "../services/mailer.js";
import { triggerWorkflows, recordStatusTransition } from "../services/workflowEngine.js";
import { syncGoogleCalendarToDb } from "../services/googleService.js";
import { uploadBase64Image } from "../services/storage.service.js";

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
    // Sincronizar Google Calendar a DB en tiempo real antes de listar
    try {
      if (req.businessId) {
        await syncGoogleCalendarToDb(req.businessId);
      }
    } catch (syncErr) {
      console.error("[Google Sync getAppointments Error]:", syncErr);
    }

    const whereClause = { businessId: req.businessId };

    // Si el rol es profesional, limitamos a sus propias citas
    if (req.user.role === "professional") {
      const emailToFind = req.user.email?.toLowerCase().trim();
      if (emailToFind) {
        const worker = await prisma.worker.findFirst({ where: { businessId: req.businessId,
            email: {
              equals: emailToFind,
              mode: "insensitive"
            }
          }
        });
        if (worker) {
          whereClause.workerId = worker.id;
        } else {
          whereClause.workerId = "non-existent-id";
        }
      } else {
        whereClause.workerId = "non-existent-id";
      }
    }

    const appointments = await prisma.appointment.findMany({ where: whereClause,
      orderBy: { startsAt: "asc" },
      include: {
        client: true,
        worker: true,
        service: true,
        sla: true,
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

    // Buscar el timezone del negocio
    const biz = await prisma.business.findUnique({
      where: { id: req.businessId },
      select: { timezone: true }
    });

    const result = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
      excludeAppointmentId: excludeId || null,
      timezone: biz?.timezone || "America/Argentina/Buenos_Aires"
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
    const { clientId, serviceId, workerId, startsAt, notes, status, bypassAvailability } = req.body;

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

    const isOwner = req.user?.role === "owner" || req.user?.email === "seleniadeveloper@gmail.com";
    const shouldBypass = bypassAvailability === true && isOwner;

    const biz = await prisma.business.findUnique({
      where: { id: req.businessId },
      select: { timezone: true }
    });
    const tz = biz?.timezone || "America/Argentina/Buenos_Aires";

    if (!shouldBypass) {
      const slot = await validateAppointmentSlot({
        workerId,
        serviceId,
        startsAt,
        timezone: tz
      });

      if (!slot.available) {
        return res.status(slotErrorStatus(slot.code)).json({
          error: slot.reason || "El profesional no está disponible en ese horario.",
          code: slot.code || null,
          conflict: slot.conflict || null,
          availableWorkers: slot.availableWorkers || [],
        });
      }
    }

    const serviceIds = String(serviceId).split(",");
    const services = await prisma.service.findMany({ where: { businessId: req.businessId,  id: { in: serviceIds }, businessId: req.businessId }
    });
    const orderedServices = serviceIds.map(id => services.find(s => s.id === id));

    const createdAppointments = await prisma.$transaction(async (tx) => {
      if (!shouldBypass) {
        // Re-validar solapamiento justo antes de crear
        const { start: txDayStart, end: txDayEnd } = getDayRangeInTz(startsAt, tz);
        const sameDayAppts = await tx.appointment.findMany({
          where: {
            workerId: String(workerId),
            startsAt: { gte: txDayStart, lte: txDayEnd },
            status: { not: "CANCELLED" }
          },
          include: { service: true }
        });
        
        const totalDuration = orderedServices.reduce((sum, s) => sum + (s.duration || 30), 0);
        const newTotalEnd = addMinutes(new Date(startsAt), totalDuration);
        
        for (const appt of sameDayAppts) {
          const apptEnd = addMinutes(new Date(appt.startsAt), appt.service?.duration || 30);
          if (overlaps(new Date(appt.startsAt), apptEnd, new Date(startsAt), newTotalEnd)) {
            throw new Error("CONFLICT");
          }
        }
      }

      let currentStartsAt = new Date(startsAt);
      const created = [];

      for (let i = 0; i < orderedServices.length; i++) {
        const svc = orderedServices[i];
        const appt = await tx.appointment.create({
          data: {
            clientId: String(clientId),
            serviceId: svc.id,
            workerId: String(workerId),
            startsAt: currentStartsAt,
            notes: notes ? `${notes} (${i + 1}/${orderedServices.length})` : `Reserva múltiple (${i + 1}/${orderedServices.length})`,
            status: status || "PENDING",
            businessId: req.businessId,
          },
          include: {
            client: true,
            worker: true,
            service: true,
            sla: true,
          },
        });

        created.push(appt);

        // Record transition immediately in transaction or await after
        await recordStatusTransition(req.businessId, appt.id, "CREATED", appt.status || "PENDING").catch(err => console.error("Error logging initial transition:", err));

        currentStartsAt = new Date(currentStartsAt.getTime() + (svc.duration || 30) * 60 * 1000);
      }
      
      return created;
    });

    for (const appt of createdAppointments) {
      import("../services/googleService.js")
        .then(({ syncAppointmentToGoogleCalendar }) => {
          syncAppointmentToGoogleCalendar(appt.id);
        })
        .catch((err) => console.error("Error importando googleService:", err));
        
      triggerWorkflows(req.businessId, "appointment_created", appt).catch(err => console.error("Error triggering workflows:", err));
    }

    return res.status(201).json(createdAppointments[0]);
  } catch (e) {
    console.error("Error creando la cita:", e);

    if (e.message === "CONFLICT") {
      return res.status(409).json({ error: "El horario seleccionado acaba de ser reservado por alguien más." });
    }

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

    if (String(serviceId).includes(",")) {
      return res.status(400).json({
        error: "No es posible editar una cita para asignarle múltiples servicios simultáneos. Si deseas servicios adicionales, debes crear citas nuevas."
      });
    }

    // Seguridad Multi-Tenant
    const existing = await prisma.appointment.findFirst({ where: { businessId: req.businessId, id }
    });
    if (!existing) {
      return res.status(404).json({ error: "Cita no encontrada en tu negocio." });
    }

    // Filtro Profesional
    if (req.user.role === "professional") {
      const emailToFind = req.user.email?.toLowerCase().trim();
      const worker = await prisma.worker.findFirst({ where: { businessId: req.businessId, email: { equals: emailToFind, mode: "insensitive" } }
      });
      // No puede cambiar la cita si no es de él, o si intenta reasignarla a otro
      if (!worker || existing.workerId !== worker.id || workerId !== worker.id) {
        return res.status(403).json({ error: "No tienes permisos para modificar citas de otros profesionales." });
      }
    }

    const client = await prisma.client.findUnique({
      where: { id: String(clientId) },
      select: { id: true },
    });

    if (!client) {
      return res.status(400).json({ error: "Cliente inválido." });
    }

    const biz = await prisma.business.findUnique({
      where: { id: req.businessId },
      select: { timezone: true }
    });

    const slot = await validateAppointmentSlot({
      workerId,
      serviceId,
      startsAt,
      excludeAppointmentId: id,
      timezone: biz?.timezone || "America/Argentina/Buenos_Aires"
    });

    if (!slot.available) {
      return res.status(slotErrorStatus(slot.code)).json({
        error: slot.reason || "El profesional no está disponible en ese horario.",
        code: slot.code || null,
        conflict: slot.conflict || null,
        availableWorkers: slot.availableWorkers || [],
      });
    }

    const oldStatus = existing.status;
    const isStatusChanged = status && status !== oldStatus;

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
        sla: true,
      },
    });

    if (isStatusChanged) {
      recordStatusTransition(req.businessId, id, oldStatus, status).catch(err => console.error(err));
      triggerWorkflows(req.businessId, "status_changed", appt).catch(err => console.error("Error triggering status changed workflows:", err));
      triggerWorkflows(req.businessId, status, appt).catch(err => console.error("Error triggering status workflows:", err));
    }

    // Sincronizar con Google Calendar en segundo plano
    import("../services/googleService.js")
      .then(({ syncAppointmentToGoogleCalendar }) => {
        syncAppointmentToGoogleCalendar(appt.id);
      })
      .catch((err) => console.error("Error importando googleService:", err));

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

    // Seguridad Multi-Tenant
    const existing = await prisma.appointment.findFirst({ where: { businessId: req.businessId, id }
    });
    if (!existing) {
      return res.status(404).json({ error: "Cita no encontrada en tu negocio." });
    }

    // Filtro Profesional
    if (req.user.role === "professional") {
      const emailToFind = req.user.email?.toLowerCase().trim();
      const worker = await prisma.worker.findFirst({ where: { businessId: req.businessId, email: { equals: emailToFind, mode: "insensitive" } }
      });
      if (!worker || existing.workerId !== worker.id) {
        return res.status(403).json({ error: "No tienes permisos para cancelar citas de otros profesionales." });
      }
    }

    if (existing.googleEventId) {
      import("../services/googleService.js")
        .then(({ deleteGoogleCalendarEvent }) => {
          deleteGoogleCalendarEvent(existing.businessId, existing.googleEventId);
        })
        .catch((err) => console.error("Error importando googleService:", err));
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
    const biz = await prisma.business.findUnique({
      where: { id: req.businessId }
    });
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
      bookingDownpaymentEnabled,
      bookingDownpaymentPercent,
      bookingDownpaymentAmount,
      bookingDownpaymentMethod,
      appointmentStatuses,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "El nombre y el slug del negocio son obligatorios." });
    }

    const cleanedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");

    // Check if slug is unique (excluding our own business)
    const existingWithSlug = await prisma.business.findFirst({ where: { businessId: req.businessId, 
        slug: cleanedSlug,
        NOT: { id: req.businessId }
      }
    });
    if (existingWithSlug) {
      return res.status(400).json({ error: "Este slug ya está en uso por otro salón." });
    }

    const updated = await prisma.business.update({
      where: { id: req.businessId },
      data: {
        name: name.trim(),
        slug: cleanedSlug,
        logo: logo || null,
        description: description || null,
        bookingEnabled: typeof bookingEnabled === "boolean" ? bookingEnabled : true,
        bookingPrimaryColor: bookingPrimaryColor || "#7c3aed",
        bookingConfirmationMessage: bookingConfirmationMessage || "¡Tu reserva ha sido confirmada con éxito!",
        bookingDownpaymentEnabled: typeof bookingDownpaymentEnabled === "boolean" ? bookingDownpaymentEnabled : false,
        bookingDownpaymentPercent: typeof bookingDownpaymentPercent !== "undefined" ? Number(bookingDownpaymentPercent) : 30,
        bookingDownpaymentAmount: bookingDownpaymentAmount ? Number(bookingDownpaymentAmount) : null,
        bookingDownpaymentMethod: bookingDownpaymentMethod || "mock_mercadopago",
        appointmentStatuses: appointmentStatuses !== undefined ? appointmentStatuses : undefined,
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error actualizando config del negocio:", error);
    return res.status(500).json({ error: "Error actualizando configuración del negocio." });
  }
}

export async function sendManualConfirmationEmail(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID de cita requerido." });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        worker: true,
        service: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "No se encontró la cita." });
    }

    let emailToSend = appointment.client?.email;

    if (req.body.email && req.body.email.trim()) {
      const inputEmail = req.body.email.trim();
      emailToSend = inputEmail;

      if (appointment.client && appointment.client.email !== inputEmail) {
        // Actualizar el correo del cliente en la base de datos para que quede guardado
        await prisma.client.update({
          where: { id: appointment.client.id },
          data: { email: inputEmail },
        });
        appointment.client.email = inputEmail;
      }
    }

    if (!emailToSend || !emailToSend.trim()) {
      return res.status(400).json({ error: "El cliente no posee un correo electrónico configurado." });
    }

    // Obtener información del negocio para personalizar el mail
    const biz = await prisma.business.findUnique({ where: { id: appointment.businessId } }) || { name: "Aura Studio" };

    // Formatear fecha y hora
    const formattedDate = new Date(appointment.startsAt).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const formattedTime = new Date(appointment.startsAt).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    const mailHtml = `
      <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 700;">¡Tu reserva está confirmada!</h2>
          <p style="color: #4b5563; font-size: 14px; margin-top: 5px;">Gracias por confiar en ${biz.name}</p>
        </div>
        
        <div style="padding: 20px 0;">
          <h3 style="color: #111827; font-size: 16px; margin-top: 0; margin-bottom: 15px; font-weight: 600;">Detalle de la cita:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 35%;">Servicio</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${appointment.service?.name || "Servicio General"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Precio</td>
              <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;">$${appointment.service?.price || 0}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Profesional</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${appointment.worker ? `${appointment.worker.firstName} ${appointment.worker.lastName}` : "Cualquier Profesional"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Fecha</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-transform: capitalize;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Hora</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${formattedTime} hs</td>
            </tr>
          </table>
        </div>
        
        <div style="padding: 15px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.5;">
            <strong>Nota:</strong> Si necesitas cancelar o reprogramar tu cita, por favor comunícate con nosotros con al menos 24 horas de anticipación.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${biz.name}. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    await sendReminderEmail({
      to: appointment.client.email.trim(),
      subject: `Reserva Confirmada: ${appointment.service?.name || "Servicio"} en ${biz.name}`,
      html: mailHtml,
      smtpConfig: biz?.integrations?.smtp
    });

    return res.status(200).json({
      success: true,
      message: "Email de confirmación enviado exitosamente.",
    });
  } catch (error) {
    console.error("Error al enviar email manual de confirmación:", error);
    let errMsg = "Error al enviar el email de confirmación.";
    if (error?.code === "EAUTH" || error?.message?.includes("BadCredentials") || error?.message?.includes("Username and Password not accepted")) {
      errMsg = "Las credenciales de correo (Gmail/SMTP) configuradas son incorrectas o inválidas. Por favor verifique EMAIL_USER y EMAIL_PASS (App Password).";
    } else if (error?.code === "ETIMEDOUT" || error?.code === "ECONNREFUSED") {
      errMsg = "Error de conexión SMTP (Timeout/Refused). Si estás en producción (ej. Render/Railway), estos proveedores bloquean los puertos SMTP salientes (25, 465, 587) por defecto. Solicita a soporte de tu hosting que los desbloquee para tu cuenta.";
    }
    return res.status(500).json({
      error: errMsg,
      detail: error?.message || "Unknown error",
    });
  }
}

export async function finalizeAppointment(req, res) {
  try {
    const { id } = req.params;
    const { note, recommendations, beforePhoto, afterPhoto, paymentMethod, finalPrice, sendEmail, selectedWorkflowIds } = req.body;

    if (!id) {
      return res.status(400).json({ error: "El ID de la cita es obligatorio." });
    }

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true, worker: true, service: true }
    });

    if (!appt) {
      return res.status(404).json({ error: "La cita no existe." });
    }

    // Normalize workflow IDs parameter to array if supplied
    let limitWorkflowIds = null;
    if (selectedWorkflowIds) {
      limitWorkflowIds = Array.isArray(selectedWorkflowIds) ? selectedWorkflowIds : [selectedWorkflowIds];
    }

    // 1. Update status to DONE and save payment details
    const updatedAppt = await prisma.appointment.update({
      where: { id },
      data: { 
        status: "DONE",
        paymentMethod: paymentMethod || null,
        finalPrice: finalPrice !== undefined && finalPrice !== null ? Number(finalPrice) : null,
      },
      include: { client: true, worker: true, service: true }
    });

    const oldStatus = appt.status;
    const isStatusChanged = oldStatus !== "DONE";
    if (isStatusChanged) {
      recordStatusTransition(appt.businessId, id, oldStatus, "DONE").catch(err => console.error(err));
      triggerWorkflows(appt.businessId, "status_changed", updatedAppt, limitWorkflowIds).catch(err => console.error("Error triggering status changed workflows:", err));
      triggerWorkflows(appt.businessId, "done", updatedAppt, limitWorkflowIds).catch(err => console.error("Error triggering done workflow:", err));
    }
    triggerWorkflows(appt.businessId, "payment_received", updatedAppt, limitWorkflowIds).catch(err => console.error("Error triggering payment_received workflow:", err));

    // Send email receipt if requested and client has email
    if (sendEmail && appt.client?.email) {
      try {
        const clientEmail = appt.client.email.trim();
        const clientName = `${appt.client.firstName} ${appt.client.lastName || ""}`;
        const serviceName = appt.service?.name || "Servicio General";
        const workerName = appt.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : "Profesional";
        
        const biz = await prisma.business.findUnique({
          where: { id: appt.businessId }
        });
        const businessName = biz?.name || "Aura Studio";
        const smtpConfig = biz?.integrations?.smtp;
        
        const receiptNumber = `AURA-${id.substring(0, 8).toUpperCase()}`;
        const chargedAmount = finalPrice !== undefined && finalPrice !== null ? Number(finalPrice) : (appt.service?.price || 0);
        const formattedPrice = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(chargedAmount);

        const receiptHtml = `
          <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-size: 36px; display: block; margin-bottom: 8px;">🧾</span>
              <h2 style="color: #9333ea; margin: 0; font-weight: 900; font-size: 22px;">¡Gracias por tu visita!</h2>
              <p style="color: #666; font-size: 13px; margin: 5px 0 0 0;">Comprobante de Servicio #${receiptNumber}</p>
            </div>
            
            <div style="background-color: #faf5ff; border: 1px dashed #9333ea; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
              <span style="color: #666; font-size: 13px; text-transform: uppercase; display: block; font-weight: bold; margin-bottom: 5px;">TOTAL ABONADO</span>
              <strong style="color: #7e22ce; font-size: 28px; font-weight: 900;">${formattedPrice}</strong>
              ${paymentMethod ? `<span style="color: #6b21a8; font-size: 12px; display: block; margin-top: 4px; font-weight: 600;">Método de Pago: ${paymentMethod}</span>` : ""}
            </div>

            <div style="margin: 20px 0; font-size: 13.5px;">
              <h4 style="color: #444; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px; font-weight: bold;">Detalles del Comprobante</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #666;"><b>Cliente:</b></td>
                  <td style="padding: 6px 0; text-align: right;"><strong>${clientName}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;"><b>Servicio:</b></td>
                  <td style="padding: 6px 0; text-align: right;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;"><b>Profesional:</b></td>
                  <td style="padding: 6px 0; text-align: right;">${workerName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;"><b>Fecha de Emisión:</b></td>
                  <td style="padding: 6px 0; text-align: right;">${new Date().toLocaleDateString("es-AR")}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px solid #f3f4f6; color: #888; font-size: 11px;">
              <strong>${businessName}</strong><br />
              Un socio registrado de AuraDash. Todos los derechos reservados.
            </div>
          </div>
        `;

        await sendReminderEmail({
          to: clientEmail,
          subject: `Comprobante de Pago #${receiptNumber} - ${businessName}`,
          html: receiptHtml,
          smtpConfig
        });
      } catch (emailErr) {
        console.error("Error sending receipt email:", emailErr);
      }
    }

    // 2. Save Clinical Note if present
    let clinicalNote = null;
    if (note && note.trim()) {
      clinicalNote = await prisma.clinicalNote.create({
        data: {
          appointmentId: id,
          clientId: appt.clientId,
          professionalId: appt.workerId,
          note: note.trim(),
          recommendations: recommendations ? recommendations.trim() : null
        }
      });
    }

    // Helper to save photos
    const savedPhotos = [];
    
    // Save before photo if present
    if (beforePhoto) {
      const beforeUrl = saveBase64Image(beforePhoto, "before", appt.clientId);
      if (beforeUrl) {
        const photoRecord = await prisma.appointmentPhoto.create({
          data: {
            appointmentId: id,
            clientId: appt.clientId,
            type: "before",
            imageUrl: beforeUrl
          }
        });
        savedPhotos.push(photoRecord);
      }
    }

    // Save after photo if present
    if (afterPhoto) {
      const afterUrl = saveBase64Image(afterPhoto, "after", appt.clientId);
      if (afterUrl) {
        const photoRecord = await prisma.appointmentPhoto.create({
          data: {
            appointmentId: id,
            clientId: appt.clientId,
            type: "after",
            imageUrl: afterUrl
          }
        });
        savedPhotos.push(photoRecord);
      }
    }

    // 3. Descuento automático de insumos del inventario (Consumo por Servicio con estrategia FIFO)
    try {
      const rules = await prisma.serviceConsumptionRule.findMany({ where: { businessId: req.businessId,  serviceId: appt.serviceId },
        include: { product: true }
      });

      for (const rule of rules) {
        const qtyToDeduct = rule.quantity;
        if (qtyToDeduct <= 0) continue;

        // FIFO: Descontar de lotes activos con stock > 0, ordenados por vencimiento ascendente
        const activeBatches = await prisma.productBatch.findMany({ where: { businessId: req.businessId, 
            productId: rule.productId,
            actualQty: { gt: 0 }
          },
          orderBy: { expirationDate: "asc" }
        });

        let remaining = qtyToDeduct;
        for (const batch of activeBatches) {
          if (remaining <= 0) break;

          if (batch.actualQty >= remaining) {
            await prisma.productBatch.update({
              where: { id: batch.id },
              data: { actualQty: batch.actualQty - remaining }
            });
            remaining = 0;
          } else {
            remaining -= batch.actualQty;
            await prisma.productBatch.update({
              where: { id: batch.id },
              data: { actualQty: 0 }
            });
          }
        }

        // Actualizar stock general en la tabla Product
        const newProductStock = Math.max(0, rule.product.stock - qtyToDeduct);
        await prisma.product.update({
          where: { id: rule.productId },
          data: { stock: newProductStock }
        });

        // Actualizar stock en la sucursal de la cita si aplica
        if (appt.branchId) {
          const bi = await prisma.branchInventory.findUnique({
            where: {
              productId_branchId: {
                productId: rule.productId,
                branchId: appt.branchId
              }
            }
          });
          if (bi) {
            await prisma.branchInventory.update({
              where: { id: bi.id },
              data: { stock: Math.max(0, bi.stock - qtyToDeduct) }
            });
          }
        }

        // Registrar en bitácora de movimientos
        await prisma.stockMovement.create({
          data: {
            productId: rule.productId,
            prevQty: rule.product.stock,
            newQty: newProductStock,
            diff: -qtyToDeduct,
            type: "automatic",
            reason: `Consumo automático por cita finalizada de ${appt.service.name}`,
            observation: `Cita #${id.slice(-5).toUpperCase()} - Cliente: ${appt.client ? appt.client.firstName : ""} ${appt.client ? appt.client.lastName : ""}`,
            branchId: appt.branchId || null,
            user: "Sistema Auto-Consumo"
          }
        });
      }
    } catch (invErr) {
      console.error("Error al procesar el descuento automático de inventario:", invErr);
    }

    return res.status(200).json({
      success: true,
      appointment: updatedAppt,
      clinicalNote,
      photos: savedPhotos
    });
  } catch (error) {
    console.error("Error al finalizar servicio:", error);
    return res.status(500).json({
      error: "Error al finalizar el servicio.",
      detail: error?.message || "Unknown error"
    });
  }
}

// Helper to save base64 image
export function saveBase64Image(base64Data, filenamePrefix, clientId) {
  if (!base64Data || typeof base64Data !== "string") return null;
  
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    if (base64Data.startsWith("http://") || base64Data.startsWith("https://") || base64Data.startsWith("/uploads/")) {
      return base64Data;
    }
    return null;
  }

  const mimeType = matches[1];
  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, "base64");

  let ext = "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
  else if (mimeType.includes("webp")) ext = "webp";
  else if (mimeType.includes("gif")) ext = "gif";

  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `${filenamePrefix}_${clientId}_${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`;
}

export async function getSlaStats(req, res) {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio faltante." });
    }

    // 1. Fetch all transition histories for this business
    const histories = await prisma.appointmentStatusHistory.findMany({ where: { businessId },
      include: {
        appointment: {
          include: {
            client: true,
            service: true
          }
        }
      },
      orderBy: { transitionedAt: "desc" }
    });

    // 2. Calculate average duration per statusFrom
    const statusDurations = {};
    for (const h of histories) {
      if (h.durationSeconds === null || h.statusFrom === "CREATED") continue;
      if (!statusDurations[h.statusFrom]) {
        statusDurations[h.statusFrom] = { sumSeconds: 0, count: 0 };
      }
      statusDurations[h.statusFrom].sumSeconds += h.durationSeconds;
      statusDurations[h.statusFrom].count += 1;
    }

    const averages = Object.entries(statusDurations).map(([status, data]) => ({
      status,
      averageSeconds: Math.round(data.sumSeconds / data.count),
      count: data.count
    }));

    // 3. Format recent transitions
    const recentTransitions = histories.slice(0, 50).map(h => ({
      id: h.id,
      appointmentId: h.appointmentId,
      clientName: h.appointment?.client ? `${h.appointment.client.firstName} ${h.appointment.client.lastName}` : "Cliente",
      serviceName: h.appointment?.service?.name || "Servicio",
      statusFrom: h.statusFrom,
      statusTo: h.statusTo,
      transitionedAt: h.transitionedAt,
      durationSeconds: h.durationSeconds
    }));

    return res.json({
      averages,
      recentTransitions,
      totalTransitions: histories.length
    });
  } catch (error) {
    console.error("Error obtaining SLA stats:", error);
    return res.status(500).json({ error: "Error obteniendo estadísticas del SLA." });
  }
}

/**
 * Sube una foto asociada a una cita y la vincula con la cita, cliente, profesional y servicio correspondientes.
 */
export async function uploadAppointmentPhoto(req, res) {
  try {
    const { id } = req.params;
    const { photo, photoType, note } = req.body;

    if (!photo) {
      return res.status(400).json({ error: "La foto (base64) es obligatoria." });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { worker: true }
    });

    if (!appointment || appointment.businessId !== req.businessId) {
      return res.status(404).json({ error: "Cita no encontrada en tu negocio." });
    }

    // Seguridad: Si es un profesional, validar que la cita le pertenezca
    const userRole = String(req.user?.role || "").toLowerCase();
    const userEmail = String(req.user?.email || "").toLowerCase();
    const isOwnerOrAdmin = userRole === "owner" || userRole === "admin" || userEmail === "seleniadeveloper@gmail.com";

    if (!isOwnerOrAdmin) {
      const worker = await prisma.worker.findFirst({ where: { businessId: req.businessId,
          email: { equals: userEmail, mode: "insensitive" }
        }
      });
      if (!worker || appointment.workerId !== worker.id) {
        return res.status(403).json({ error: "Acceso denegado. Solo puedes subir fotos de tus citas asignadas." });
      }
    }

    // Subir la imagen usando el servicio de almacenamiento
    const imageUrl = await uploadBase64Image(photo, photoType || "other", appointment.clientId);
    if (!imageUrl) {
      return res.status(400).json({ error: "Error al procesar la imagen." });
    }

    // Crear el registro de la foto con sus relaciones
    const photoRecord = await prisma.appointmentPhoto.create({
      data: {
        appointmentId: id,
        clientId: appointment.clientId,
        professionalId: appointment.workerId,
        serviceId: appointment.serviceId,
        type: photoType || "other", // retrocompatibilidad
        photoType: photoType || "other",
        imageUrl,
        note: note ? note.trim() : null
      },
      include: {
        worker: {
          select: { firstName: true, lastName: true }
        },
        service: {
          select: { name: true }
        }
      }
    });

    return res.status(201).json(photoRecord);
  } catch (error) {
    console.error("Error al subir foto de la cita:", error);
    return res.status(500).json({
      error: "Error interno al subir la foto de la cita.",
      detail: error?.message || "Unknown error"
    });
  }
}

/**
 * Elimina una foto de la base de datos (solo administradores).
 */
export async function deleteAppointmentPhoto(req, res) {
  try {
    const { photoId } = req.params;

    const photo = await prisma.appointmentPhoto.findUnique({
      where: { id: photoId },
      include: {
        appointment: true
      }
    });

    if (!photo || photo.appointment.businessId !== req.businessId) {
      return res.status(404).json({ error: "Foto no encontrada." });
    }

    // Seguridad: Solo administradores pueden eliminar
    const userRole = String(req.user?.role || "").toLowerCase();
    const userEmail = String(req.user?.email || "").toLowerCase();
    const isOwnerOrAdmin = userRole === "owner" || userRole === "admin" || userEmail === "seleniadeveloper@gmail.com";

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: "Acceso denegado. Solo los administradores pueden eliminar fotos." });
    }

    await prisma.appointmentPhoto.delete({
      where: { id: photoId }
    });

    // Eliminar archivo local si corresponde
    if (photo.imageUrl.startsWith("/uploads/")) {
      const localPath = path.join(process.cwd(), photo.imageUrl);
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch (err) {
          console.error("Error al eliminar foto local:", err);
        }
      }
    }

    return res.json({ success: true, message: "Foto eliminada correctamente del historial." });
  } catch (error) {
    console.error("Error al eliminar foto:", error);
    return res.status(500).json({
      error: "Error interno al eliminar la foto.",
      detail: error?.message || "Unknown error"
    });
  }
}

/**
 * Actualiza los metadatos de una foto de cita (flags de marketing, portafolio y notas).
 */
export async function updateAppointmentPhotoMetadata(req, res) {
  try {
    const { photoId } = req.params;
    const { useForInstagram, showInPortfolio, highlightResult, note, photoType } = req.body;

    const photo = await prisma.appointmentPhoto.findUnique({
      where: { id: photoId },
      include: { appointment: true }
    });

    if (!photo || photo.appointment.businessId !== req.businessId) {
      return res.status(404).json({ error: "Foto no encontrada." });
    }

    const updated = await prisma.appointmentPhoto.update({
      where: { id: photoId },
      data: {
        useForInstagram: useForInstagram !== undefined ? Boolean(useForInstagram) : undefined,
        showInPortfolio: showInPortfolio !== undefined ? Boolean(showInPortfolio) : undefined,
        highlightResult: highlightResult !== undefined ? Boolean(highlightResult) : undefined,
        note: note !== undefined ? note : undefined,
        photoType: photoType !== undefined ? photoType : undefined,
        type: photoType !== undefined ? photoType : undefined, // Sync with type
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Error al actualizar metadatos de la foto:", error);
    return res.status(500).json({
      error: "Error interno al actualizar los metadatos de la foto.",
      detail: error?.message || "Unknown error"
    });
  }
}




