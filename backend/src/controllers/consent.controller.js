import crypto from "crypto";
import prisma from "../prisma.js";
import { encryptData, decryptData } from "../utils/consentCrypto.js";
import { sendReminderEmail } from "../services/mailer.js";

// Helper to check if a template can be safely edited or if a new version is required
export async function getTemplates(req, res) {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "Contexto de negocio faltante." });
    }

    const templates = await prisma.consentTemplate.findMany({
      where: {
        businessId,
        active: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(templates);
  } catch (error) {
    console.error("GET TEMPLATES ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo plantillas." });
  }
}

export async function createTemplate(req, res) {
  try {
    const businessId = req.businessId;
    const { id, serviceId, name, body, requirements, whatToKnow, contraindications, preCare, postCare, collectAllergies } = req.body;

    if (!name || !body) {
      return res.status(400).json({ error: "El nombre y el cuerpo de la plantilla son obligatorios." });
    }

    const createdBy = req.user?.name || req.user?.email || "Admin";

    // Versioning: If it has an ID, we check if it is already "published" (has requests/records)
    // If it has requests or records, we MUST create a new version of the template.
    if (id) {
      const existing = await prisma.consentTemplate.findFirst({
        where: { id, businessId },
        include: { _count: { select: { requests: true, records: true } } }
      });

      if (!existing) {
        return res.status(404).json({ error: "Plantilla no encontrada." });
      }

      const hasHistory = (existing._count.requests + existing._count.records) > 0;

      if (hasHistory) {
        // Mark old one as inactive for new requests (do not delete to preserve history)
        await prisma.consentTemplate.update({
          where: { id: existing.id },
          data: { active: false }
        });

        // Create new row with incremented version
        const newVersion = await prisma.consentTemplate.create({
          data: {
            businessId,
            serviceId: serviceId || null,
            name,
            version: existing.version + 1,
            body,
            requirements,
            whatToKnow,
            contraindications,
            preCare,
            postCare,
            collectAllergies: collectAllergies !== undefined ? collectAllergies : true,
            active: true,
            createdBy,
          }
        });

        return res.status(201).json(newVersion);
      } else {
        // Safe to modify in-place (no signatures exist yet for this version)
        const updated = await prisma.consentTemplate.update({
          where: { id },
          data: {
            serviceId: serviceId || null,
            name,
            body,
            requirements,
            whatToKnow,
            contraindications,
            preCare,
            postCare,
            collectAllergies: collectAllergies !== undefined ? collectAllergies : true,
          }
        });
        return res.json(updated);
      }
    }

    // Creating a new template from scratch
    const newTemplate = await prisma.consentTemplate.create({
      data: {
        businessId,
        serviceId: serviceId || null,
        name,
        version: 1,
        body,
        requirements,
        whatToKnow,
        contraindications,
        preCare,
        postCare,
        collectAllergies: collectAllergies !== undefined ? collectAllergies : true,
        active: true,
        createdBy,
      }
    });

    return res.status(201).json(newTemplate);
  } catch (error) {
    console.error("CREATE TEMPLATE ERROR:", error);
    return res.status(500).json({ error: "Error guardando plantilla." });
  }
}

export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.businessId;

    const existing = await prisma.consentTemplate.findFirst({
      where: { id, businessId },
      include: { _count: { select: { requests: true, records: true } } }
    });

    if (!existing) {
      return res.status(404).json({ error: "Plantilla no encontrada." });
    }

    // If it has signatures, mark inactive. Otherwise, delete completely.
    if ((existing._count.requests + existing._count.records) > 0) {
      await prisma.consentTemplate.update({
        where: { id },
        data: { active: false }
      });
    } else {
      await prisma.consentTemplate.delete({
        where: { id }
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("DELETE TEMPLATE ERROR:", error);
    return res.status(500).json({ error: "Error eliminando plantilla." });
  }
}

export async function createConsentRequest(req, res) {
  try {
    const businessId = req.businessId;
    const { templateId, clientId, appointmentId, channel, sentTo } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: "El templateId es obligatorio." });
    }

    const template = await prisma.consentTemplate.findFirst({
      where: { id: templateId, businessId }
    });

    if (!template) {
      return res.status(404).json({ error: "Plantilla de consentimiento no encontrada." });
    }

    // Generate secure random opaque token
    const token = crypto.randomBytes(24).toString("hex");
    // Expire in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const createdBy = req.user?.name || req.user?.email || "Admin";

    const request = await prisma.consentRequest.create({
      data: {
        businessId,
        templateId,
        templateVersion: template.version,
        clientId: clientId || null,
        appointmentId: appointmentId || null,
        token,
        channel: channel || "link",
        sentTo: sentTo || null,
        expiresAt,
        createdBy,
        status: "PENDING"
      }
    });

    return res.status(201).json(request);
  } catch (error) {
    console.error("CREATE REQUEST ERROR:", error);
    return res.status(500).json({ error: "Error generando solicitud de consentimiento." });
  }
}

// PUBLIC: Fetch consent details by token
export async function getPublicConsentDetails(req, res) {
  try {
    const { token } = req.params;

    const request = await prisma.consentRequest.findUnique({
      where: { token },
      include: {
        template: true,
        client: true,
        business: {
          select: {
            name: true,
            logo: true,
            slug: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: "Enlace no válido o inexistente." });
    }

    const now = new Date();
    if (request.status !== "PENDING") {
      return res.status(410).json({
        error: "Esta solicitud de consentimiento ya ha sido firmada o procesada.",
        status: request.status
      });
    }

    if (request.expiresAt < now) {
      // Mark as expired in DB
      await prisma.consentRequest.update({
        where: { id: request.id },
        data: { status: "EXPIRED" }
      });
      return res.status(410).json({ error: "Este enlace de consentimiento ha expirado." });
    }

    // Return request details & template verbatim contents
    return res.json({
      requestId: request.id,
      clientId: request.clientId,
      appointmentId: request.appointmentId,
      templateVersion: request.templateVersion,
      template: {
        id: request.template.id,
        name: request.template.name,
        body: request.template.body,
        requirements: request.template.requirements,
        whatToKnow: request.template.whatToKnow,
        contraindications: request.template.contraindications,
        preCare: request.template.preCare,
        postCare: request.template.postCare,
        collectAllergies: request.template.collectAllergies
      },
      client: request.client ? {
        firstName: request.client.firstName,
        lastName: request.client.lastName,
        email: request.client.email,
        phone: request.client.phone
      } : null,
      business: request.business
    });
  } catch (error) {
    console.error("GET PUBLIC CONSENT DETAILS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo datos del consentimiento." });
  }
}

// PUBLIC: Submit signature & sign consent
export async function signConsent(req, res) {
  try {
    const { token } = req.params;
    const { fullNameTyped, signatureImage, allergies, medicalDeclarations, accepted, email } = req.body;

    if (!fullNameTyped?.trim()) {
      return res.status(400).json({ error: "El nombre completo escrito es obligatorio." });
    }
    if (!signatureImage?.trim()) {
      return res.status(400).json({ error: "El trazo de la firma digital es obligatorio." });
    }
    if (!accepted) {
      return res.status(400).json({ error: "Debe marcar la casilla de aceptación de los términos." });
    }

    const request = await prisma.consentRequest.findUnique({
      where: { token },
      include: { template: true, client: true }
    });

    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }

    if (request.status !== "PENDING" || request.expiresAt < new Date()) {
      return res.status(400).json({ error: "La solicitud ha expirado o ya fue firmada." });
    }

    let clientId = request.clientId;

    // Failsafe for client creation if request did not specify one
    if (!clientId) {
      // Find or create a new client using the typed name and details provided
      const parsedDeclarations = medicalDeclarations || {};
      const clientPhone = parsedDeclarations.phone || "";
      const clientEmail = email || parsedDeclarations.email || "";

      let matchedClient = null;
      if (clientEmail) {
        matchedClient = await prisma.client.findFirst({
          where: { email: clientEmail, businessId: request.businessId }
        });
      }

      if (!matchedClient && clientPhone) {
        matchedClient = await prisma.client.findFirst({
          where: { phone: clientPhone, businessId: request.businessId }
        });
      }

      if (matchedClient) {
        clientId = matchedClient.id;
      } else {
        // Create new client
        const spaceIdx = fullNameTyped.trim().indexOf(" ");
        const firstName = spaceIdx > 0 ? fullNameTyped.substring(0, spaceIdx).trim() : fullNameTyped.trim();
        const lastName = spaceIdx > 0 ? fullNameTyped.substring(spaceIdx).trim() : "Cliente";

        const newClient = await prisma.client.create({
          data: {
            businessId: request.businessId,
            firstName,
            lastName,
            phone: clientPhone || null,
            email: clientEmail || null,
          }
        });
        clientId = newClient.id;
      }

      // Update the request to link this client
      await prisma.consentRequest.update({
        where: { id: request.id },
        data: { clientId }
      });
    }

    // Encrypt sensitive medical declarations & allergies in record
    const encryptedAllergies = encryptData(allergies || "");
    const encryptedDeclarations = encryptData(JSON.stringify(medicalDeclarations || {}));

    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    // Save Immutable Record
    const record = await prisma.consentRecord.create({
      data: {
        businessId: request.businessId,
        requestId: request.id,
        clientId,
        templateId: request.templateId,
        templateVersion: request.templateVersion,
        termsSnapshot: request.template.body,
        fullNameTyped,
        signatureImage,
        allergies: encryptedAllergies,
        medicalDeclarations: encryptedDeclarations,
        accepted: true,
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
      }
    });

    // Mark Request as Signed
    await prisma.consentRequest.update({
      where: { id: request.id },
      data: { status: "SIGNED" }
    });

    // Trigger workflows in background
    import("../services/workflowEngine.js")
      .then(({ triggerWorkflows }) => {
        if (request.appointmentId) {
          triggerWorkflows(request.businessId, "consent_signed", { appointmentId: request.appointmentId, consentRecordId: record.id }).catch(err => console.error(err));
        }
      })
      .catch(err => console.error("Error importing workflowEngine:", err));

    // Update Client's current medical summary (allergies and medicalNotes)
    // Client.allergies is kept as plain text on client sheet for easy alerts
    // Decrypted allergies stored on Client
    await prisma.client.update({
      where: { id: clientId },
      data: {
        allergies: allergies || null,
        medicalNotes: medicalDeclarations?.notes || null
      }
    });

    // Send copy by email if client has email
    const targetEmail = email || request.client?.email;
    if (targetEmail) {
      try {
        const mailBody = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">Copia de Consentimiento Firmado</h2>
            <p>Hola <strong>${fullNameTyped}</strong>,</p>
            <p>Has firmado exitosamente el consentimiento informado para el procedimiento: <strong>${request.template.name}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #7c3aed;">
              <h3 style="margin-top: 0; color: #444;">Detalles de la Firma</h3>
              <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${new Date().toLocaleString("es-AR")}</p>
              <p style="margin: 5px 0;"><strong>IP de Registro:</strong> ${ipAddress}</p>
              <p style="margin: 5px 0;"><strong>Navegador:</strong> ${userAgent.substring(0, 80)}...</p>
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #444;">Términos Aceptados</h3>
              <div style="background-color: #fff; border: 1px solid #eee; padding: 15px; border-radius: 6px; font-size: 13px; max-height: 200px; overflow-y: auto;">
                ${request.template.body.replace(/\n/g, "<br>")}
              </div>
            </div>

            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Este es un correo automático de seguridad y respaldo. Guarde este mensaje para su referencia legal.
            </p>
          </div>
        `;

        const biz = await prisma.business.findUnique({
          where: { id: request.businessId },
          select: { integrations: true }
        });
        const smtpConfig = biz?.integrations?.smtp;

        await sendReminderEmail({
          to: targetEmail,
          subject: `Copia firmada: ${request.template.name}`,
          html: mailBody,
          smtpConfig
        });
      } catch (mailError) {
        console.error("Error sending copy email to client:", mailError);
      }
    }

    return res.status(201).json({
      ok: true,
      recordId: record.id
    });
  } catch (error) {
    console.error("SIGN CONSENT ERROR:", error);
    return res.status(500).json({ error: "Error procesando la firma del consentimiento." });
  }
}

// ADMIN: Get signed consent records for a client
export async function getClientConsentRecords(req, res) {
  try {
    const { clientId } = req.query;
    const businessId = req.businessId;

    if (!clientId) {
      return res.status(400).json({ error: "El clientId es requerido." });
    }

    const records = await prisma.consentRecord.findMany({
      where: {
        clientId,
        businessId
      },
      include: {
        template: {
          select: {
            name: true
          }
        },
        request: {
          select: {
            appointment: {
              select: {
                startsAt: true,
                service: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Decrypt sensitive declarations on output
    const decryptedRecords = records.map(record => {
      let medicalDecls = null;
      try {
        const decryptedStr = decryptData(record.medicalDeclarations);
        medicalDecls = decryptedStr ? JSON.parse(decryptedStr) : null;
      } catch (decErr) {
        console.error("Error parsing decrypted medical declarations:", decErr);
      }

      return {
        ...record,
        allergies: decryptData(record.allergies),
        medicalDeclarations: medicalDecls
      };
    });

    return res.json(decryptedRecords);
  } catch (error) {
    console.error("GET CLIENT RECORDS ERROR:", error);
    return res.status(500).json({ error: "Error cargando historial de consentimientos." });
  }
}

// ADMIN/PUBLIC: Get specific record by ID
export async function getConsentRecordById(req, res) {
  try {
    const { id } = req.params;
    
    // Auth requirement check: if not logged in (e.g. public download PDF link),
    // we should still allow loading it if the user has direct link, but let's check
    // businessId if authenticated
    const businessId = req.businessId;

    const record = await prisma.consentRecord.findUnique({
      where: { id },
      include: {
        client: true,
        template: true,
        request: {
          include: {
            appointment: {
              include: {
                service: true,
                worker: true
              }
            }
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: "Registro de consentimiento no encontrado." });
    }

    if (businessId && record.businessId !== businessId) {
      return res.status(403).json({ error: "Acceso denegado a este consentimiento." });
    }

    let medicalDecls = null;
    try {
      const decryptedStr = decryptData(record.medicalDeclarations);
      medicalDecls = decryptedStr ? JSON.parse(decryptedStr) : null;
    } catch (decErr) {
      console.error("Error parsing decrypted declarations:", decErr);
    }

    return res.json({
      ...record,
      allergies: decryptData(record.allergies),
      medicalDeclarations: medicalDecls
    });
  } catch (error) {
    console.error("GET RECORD BY ID ERROR:", error);
    return res.status(500).json({ error: "Error cargando detalles del consentimiento." });
  }
}

// ADMIN: Get consent requests (pending or other) for a client
export async function getClientConsentRequests(req, res) {
  try {
    const { clientId } = req.query;
    const businessId = req.businessId;

    if (!clientId) {
      return res.status(400).json({ error: "El clientId es requerido." });
    }

    const requests = await prisma.consentRequest.findMany({
      where: {
        clientId,
        businessId
      },
      include: {
        template: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(requests);
  } catch (error) {
    console.error("GET CLIENT REQUESTS ERROR:", error);
    return res.status(500).json({ error: "Error cargando solicitudes de consentimiento del cliente." });
  }
}
