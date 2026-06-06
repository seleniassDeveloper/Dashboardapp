import fs from "node:fs";
import path from "node:path";
import prisma from "../prisma.js";
import {
  validateAppointmentSlot,
  findAvailableWorkers,
} from "../services/appointmentAvailability.js";
import { sendReminderEmail } from "../services/mailer.js";

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
    const whereClause = { businessId: req.businessId };

    // Si el rol es profesional, limitamos a sus propias citas
    if (req.user.role === "professional") {
      const emailToFind = req.user.email?.toLowerCase().trim();
      if (emailToFind) {
        const worker = await prisma.worker.findFirst({
          where: {
            businessId: req.businessId,
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

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
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

    if (!shouldBypass) {
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
    }

    const appt = await prisma.appointment.create({
      data: {
        clientId: String(clientId),
        serviceId: String(serviceId),
        workerId: String(workerId),
        startsAt: new Date(startsAt),
        notes: notes || null,
        status: status || "PENDING",
        businessId: req.businessId,
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

    // Seguridad Multi-Tenant
    const existing = await prisma.appointment.findFirst({
      where: { id, businessId: req.businessId }
    });
    if (!existing) {
      return res.status(404).json({ error: "Cita no encontrada en tu negocio." });
    }

    // Filtro Profesional
    if (req.user.role === "professional") {
      const emailToFind = req.user.email?.toLowerCase().trim();
      const worker = await prisma.worker.findFirst({
        where: { businessId: req.businessId, email: { equals: emailToFind, mode: "insensitive" } }
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

    // Seguridad Multi-Tenant
    const existing = await prisma.appointment.findFirst({
      where: { id, businessId: req.businessId }
    });
    if (!existing) {
      return res.status(404).json({ error: "Cita no encontrada en tu negocio." });
    }

    // Filtro Profesional
    if (req.user.role === "professional") {
      const emailToFind = req.user.email?.toLowerCase().trim();
      const worker = await prisma.worker.findFirst({
        where: { businessId: req.businessId, email: { equals: emailToFind, mode: "insensitive" } }
      });
      if (!worker || existing.workerId !== worker.id) {
        return res.status(403).json({ error: "No tienes permisos para cancelar citas de otros profesionales." });
      }
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
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "El nombre y el slug del negocio son obligatorios." });
    }

    const cleanedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");

    // Check if slug is unique (excluding our own business)
    const existingWithSlug = await prisma.business.findFirst({
      where: {
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
    const biz = (await prisma.business.findFirst()) || { name: "Aura Studio" };

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
    });

    return res.status(200).json({
      success: true,
      message: "Email de confirmación enviado exitosamente.",
    });
  } catch (error) {
    console.error("Error al enviar email manual de confirmación:", error);
    let errMsg = "Error al enviar el email de confirmación.";
    if (error?.code === "EAUTH" || error?.message?.includes("BadCredentials") || error?.message?.includes("Username and Password not accepted")) {
      errMsg = "Las credenciales de correo (Gmail/SMTP) configuradas en el archivo .env son incorrectas o inválidas. Por favor verifique EMAIL_USER y EMAIL_PASS (App Password) en el .env.";
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
    const { note, recommendations, beforePhoto, afterPhoto } = req.body;

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

    // 1. Update status to DONE
    const updatedAppt = await prisma.appointment.update({
      where: { id },
      data: { status: "DONE" },
      include: { client: true, worker: true, service: true }
    });

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
      const rules = await prisma.serviceConsumptionRule.findMany({
        where: { serviceId: appt.serviceId },
        include: { product: true }
      });

      for (const rule of rules) {
        const qtyToDeduct = rule.quantity;
        if (qtyToDeduct <= 0) continue;

        // FIFO: Descontar de lotes activos con stock > 0, ordenados por vencimiento ascendente
        const activeBatches = await prisma.productBatch.findMany({
          where: {
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
function saveBase64Image(base64Data, filenamePrefix, clientId) {
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


