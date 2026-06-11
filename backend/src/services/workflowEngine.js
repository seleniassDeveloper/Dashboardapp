import crypto from "crypto";
import prisma from "../prisma.js";
import { sendReminderEmail } from "./mailer.js";

// Triggers: "appointment_created" (nueva-cita), "consent_signed" (consentimiento-firmado), "status_changed" (cambio-estado-cita)
export async function triggerWorkflows(businessId, triggerType, context) {
  if (!businessId) return;
  console.log(`[WorkflowEngine] Triggered "${triggerType}" for business "${businessId}"`, context);

  try {
    // 1. Get business and its active business model
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    if (!business) return;

    const modelSlug = business.model || "custom";
    const businessModel = await prisma.businessModel.findFirst({
      where: { slug: modelSlug }
    });

    if (!businessModel) {
      console.warn(`[WorkflowEngine] Business Model "${modelSlug}" not found for business "${businessId}"`);
      return;
    }

    // 2. Find all active workflows for this business model
    const workflows = await prisma.workflow.findMany({
      where: {
        status: "ACTIVE",
        businessModelId: businessModel.id
      }
    });

    // Normalize trigger types to support both db keys and human-friendly display keys
    const matchTrigger = (wfTriggerType) => {
      const type = String(wfTriggerType).toLowerCase();
      const normTrigger = String(triggerType).toLowerCase();
      if (type === normTrigger) return true;
      if (normTrigger === "appointment_created" && type === "nueva-cita") return true;
      if (normTrigger === "consent_signed" && type === "consentimiento-firmado") return true;
      if (normTrigger === "status_changed" && type === "cambio-estado-cita") return true;
      return false;
    };

    const matchingWorkflows = workflows.filter(w => w.trigger && matchTrigger(w.trigger.type));
    console.log(`[WorkflowEngine] Found ${matchingWorkflows.length} matching active workflows.`);

    for (const workflow of matchingWorkflows) {
      const startTime = Date.now();
      const stepLogs = [];
      let executionStatus = "SUCCESS";

      // Context extraction helpers
      let appointmentId = context.appointmentId || context.id;
      let appt = null;

      if (appointmentId) {
        appt = await prisma.appointment.findFirst({
          where: { id: appointmentId, businessId },
          include: { client: true, service: true, worker: true }
        });
      }

      const clientName = appt?.client ? `${appt.client.firstName} ${appt.client.lastName}` : "Cliente";
      const clientEmail = appt?.client?.email;
      const clientPhone = appt?.client?.phone;
      const serviceName = appt?.service?.name || "Servicio";
      const servicePrice = appt?.service?.price || 0;
      const workerName = appt?.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : "Profesional";

      // Execute flow steps/nodes
      // In AuraDash, steps is a list of nodes. Transitions define dependencies.
      // We can run the nodes sequentially or follow transitions. For simple actions, we execute action nodes.
      const actionNodes = Array.isArray(workflow.steps) 
        ? workflow.steps.filter(n => n.type === "action")
        : [];

      for (const node of actionNodes) {
        const subtype = String(node.subtype || node.type).toLowerCase();
        let stepResult = null;
        let stepError = null;

        try {
          if (subtype === "enviar-consentimiento" || subtype === "send_consent_request") {
            if (!appt) throw new Error("Cita o cliente no disponible en el contexto.");
            if (!clientEmail) throw new Error("El cliente no tiene un email configurado.");

            // Find matching ConsentTemplate
            let template = null;
            if (node.config?.templateId) {
              template = await prisma.consentTemplate.findFirst({
                where: { id: node.config.templateId, businessId, active: true }
              });
            } else {
              // Fallback to service-specific template, or general active template
              template = await prisma.consentTemplate.findFirst({
                where: { serviceId: appt.serviceId, businessId, active: true }
              });
              if (!template) {
                template = await prisma.consentTemplate.findFirst({
                  where: { businessId, active: true }
                });
              }
            }

            if (!template) {
              throw new Error(`No se encontró ninguna plantilla de consentimiento activa en el negocio.`);
            }

            // Create Consent Request
            const token = crypto.randomBytes(24).toString("hex");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const request = await prisma.consentRequest.create({
              data: {
                businessId,
                templateId: template.id,
                templateVersion: template.version,
                clientId: appt.clientId,
                appointmentId: appt.id,
                token,
                channel: "email",
                expiresAt,
                createdBy: "Workflow Automático",
                status: "PENDING"
              }
            });

            // Format Consent Email
            const appUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const signatureLink = `${appUrl}/consent/${token}`;

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h2 style="color: #7c3aed; margin-top: 0; font-weight: 800; font-size: 24px;">${business.name}</h2>
                  <p style="color: #666; font-size: 14px;">Formulario de Consentimiento Digital</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
                <p>Hola <strong>${clientName}</strong>,</p>
                <p>Para poder brindarte el mejor servicio de <strong>${serviceName}</strong>, necesitamos que leas y firmes el consentimiento informado correspondiente.</p>
                <p>Por favor, haz clic en el siguiente enlace para revisar los términos, indicar alergias o contraindicaciones y firmar digitalmente desde tu dispositivo:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signatureLink}" style="background-color: #7c3aed; color: #ffffff; padding: 14px 28px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.25);">
                    Firmar Consentimiento Online
                  </a>
                </div>

                <div style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 15px; border-radius: 6px; font-size: 13px; margin: 25px 0;">
                  <strong>Detalles del Turno:</strong><br />
                  • <b>Tratamiento:</b> ${serviceName}<br />
                  • <b>Profesional:</b> ${workerName}<br />
                  • <b>Fecha:</b> ${new Date(appt.startsAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}<br />
                  • <b>Hora:</b> ${new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
                </div>

                <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
                  Este enlace es seguro e intransferible, válido por 7 días.
                </p>
              </div>
            `;

            await sendReminderEmail({
              to: clientEmail,
              subject: `Firma requerida: Consentimiento para ${serviceName} - ${business.name}`,
              html: emailHtml
            });

            // Update appointment status to PENDING_CONSENT if configured
            const targetStatus = node.config?.targetStatus || "CONSENT_PENDING";
            
            // Fetch current business statuses to verify targetStatus is allowed
            let hasTargetStatus = true;
            if (business.appointmentStatuses) {
              const bStatuses = Array.isArray(business.appointmentStatuses) ? business.appointmentStatuses : [];
              hasTargetStatus = bStatuses.some(s => s.key === targetStatus);
            }

            if (hasTargetStatus) {
              // We'll update the status inside our loop
              await prisma.appointment.update({
                where: { id: appt.id },
                data: { status: targetStatus }
              });
              // Note: Transition will be logged inside updateAppointment or we can log it here.
              // To avoid duplication, let's trigger transition logging manually if needed, 
              // or let appointments.controller handle status transitions.
              // We can create a transition record here since it is updated via workflow!
              await recordStatusTransition(businessId, appt.id, appt.status, targetStatus);
            }

            stepResult = `Solicitud de consentimiento creada (${template.name} v${template.version}) y enviada a ${clientEmail}. Cita movida a estado ${targetStatus}.`;
          }

          else if (subtype === "cambiar-estado-cita" || subtype === "change_appointment_status" || subtype === "transition_status") {
            if (!appt) throw new Error("Cita no disponible en el contexto.");
            const targetStatus = node.config?.status;
            if (!targetStatus) throw new Error("No se especificó el estado destino en la configuración de la acción.");

            const oldStatus = appt.status;
            if (oldStatus !== targetStatus) {
              await prisma.appointment.update({
                where: { id: appt.id },
                data: { status: targetStatus }
              });
              await recordStatusTransition(businessId, appt.id, oldStatus, targetStatus);
              stepResult = `Cita cambiada de estado de "${oldStatus}" a "${targetStatus}" exitosamente.`;
            } else {
              stepResult = `La cita ya se encontraba en el estado "${targetStatus}". No se realizaron cambios.`;
            }
          }

          else if (subtype === "enviar-comprobante" || subtype === "send_receipt") {
            if (!appt) throw new Error("Cita no disponible en el contexto.");
            if (!clientEmail) throw new Error("El cliente no tiene un email configurado.");

            // Create beautiful receipt HTML
            const receiptNumber = `AURA-${appt.id.substring(0, 8).toUpperCase()}`;
            const formattedPrice = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(servicePrice);

            const receiptHtml = `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 25px;">
                  <span style="font-size: 32px; display: block; margin-bottom: 8px;">🧾</span>
                  <h2 style="color: #10b981; margin: 0; font-weight: 900; font-size: 22px;">¡Gracias por tu pago!</h2>
                  <p style="color: #666; font-size: 13px; margin: 5px 0 0 0;">Comprobante de Servicio #${receiptNumber}</p>
                </div>
                
                <div style="background-color: #f0fdf4; border: 1px dashed #10b981; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                  <span style="color: #666; font-size: 13px; text-uppercase: true; display: block; font-weight: bold; margin-bottom: 5px;">TOTAL PAGADO</span>
                  <strong style="color: #065f46; font-size: 28px; font-weight: 900;">${formattedPrice}</strong>
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
                  <strong>${business.name}</strong><br />
                  A AuraDash Partner Business. Todos los derechos reservados.
                </div>
              </div>
            `;

            await sendReminderEmail({
              to: clientEmail,
              subject: `Comprobante de Pago #${receiptNumber} - ${business.name}`,
              html: receiptHtml
            });

            stepResult = `Comprobante de pago generado (${receiptNumber}) y enviado por email a ${clientEmail} exitosamente.`;
          }

          // CUSTOM OUTBOUND WEBHOOK (HTTP POST/GET/PUT/DELETE)
          else if (node.integrationType === "webhook") {
            const url = node.config?.url;
            if (!url) throw new Error("No se especificó la URL de destino del Webhook.");

            const method = node.config?.method || "POST";
            let headers = {};
            if (node.config?.headers) {
              try {
                headers = JSON.parse(node.config.headers);
              } catch (e) {
                throw new Error("Formato JSON inválido en las cabeceras del Webhook.");
              }
            }

            let body = undefined;
            if (method !== "GET" && node.config?.body) {
              body = processTemplateVars(node.config.body, {
                cliente: clientName,
                fecha: appt ? new Date(appt.startsAt).toLocaleDateString("es-AR") : "",
                hora: appt ? new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "",
                profesional: workerName,
                servicio: serviceName,
                saldo: appt ? `$${appt.finalPrice || servicePrice}` : "",
                sucursal: business.name
              });
            }

            const response = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json",
                ...headers
              },
              body
            });

            const responseText = await response.text();
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 150)}`);
            }

            stepResult = `Webhook enviado con éxito a ${url}. Respuesta: ${responseText.substring(0, 100)}`;
          }

          // CUSTOM EMAIL INTEGRATION
          else if (node.integrationType === "email") {
            if (!clientEmail) throw new Error("El cliente no tiene un email configurado.");
            const subjectTemplate = node.config?.subject || "Notificación de Cita";
            const messageTemplate = node.config?.message || "Hola {{cliente}}!";

            const contextVars = {
              cliente: clientName,
              fecha: appt ? new Date(appt.startsAt).toLocaleDateString("es-AR") : "",
              hora: appt ? new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "",
              profesional: workerName,
              servicio: serviceName,
              saldo: appt ? `$${appt.finalPrice || servicePrice}` : "",
              sucursal: business.name
            };

            const subject = processTemplateVars(subjectTemplate, contextVars);
            const message = processTemplateVars(messageTemplate, contextVars);

            await sendReminderEmail({
              to: clientEmail,
              subject,
              html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
                  <h2 style="color: #7c3aed; margin-top: 0;">${business.name}</h2>
                  <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
                  <p style="white-space: pre-wrap;">${message}</p>
                  <hr style="border: 0; border-top: 1px solid #eee; margin-top: 25px; margin-bottom: 10px;" />
                  <p style="font-size: 11px; color: #888; text-align: center;">Automatizado por AuraDash Suite.</p>
                </div>
              `
            });

            stepResult = `Email personalizado enviado con éxito a ${clientEmail}. Asunto: "${subject}"`;
          }

          // CUSTOM WHATSAPP LOG/REDIRECT
          else if (node.integrationType === "whatsapp") {
            const messageTemplate = node.config?.message || "Hola {{cliente}}!";
            const contextVars = {
              cliente: clientName,
              fecha: appt ? new Date(appt.startsAt).toLocaleDateString("es-AR") : "",
              hora: appt ? new Date(appt.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "",
              profesional: workerName,
              servicio: serviceName,
              saldo: appt ? `$${appt.finalPrice || servicePrice}` : "",
              sucursal: business.name
            };
            const message = processTemplateVars(messageTemplate, contextVars);
            stepResult = `[WhatsApp simulado / Link generado para enviar a ${clientPhone || "cliente"}]: "${message}"`;
          }

          else {
            // General actions like notifications or fallback task creation
            stepResult = `Acción de tipo ${subtype} no requiere procesamiento especial en backend o ejecutada exitosamente.`;
          }

          stepLogs.push({
            nodeName: node.name || subtype,
            nodeType: node.type,
            status: "SUCCESS",
            result: stepResult
          });
        } catch (err) {
          console.error(`[WorkflowEngine] Error running node ${node.id} (${subtype}):`, err);
          executionStatus = "FAILED";
          stepError = err.message || String(err);
          stepLogs.push({
            nodeName: node.name || subtype,
            nodeType: node.type,
            status: "FAILED",
            error: stepError
          });
        }
      }

      // Log execution to DB
      const runTimeMs = Date.now() - startTime;
      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          status: executionStatus,
          triggerType,
          runTimeMs,
          logs: {
            create: stepLogs.map(l => ({
              nodeName: l.nodeName,
              nodeType: l.nodeType,
              status: l.status,
              result: l.result || null,
              error: l.error || null
            }))
          }
        }
      });

      // Update run count
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: {
          runCount: { increment: 1 },
          lastRunAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error(`[WorkflowEngine] Critical error executing workflows:`, error);
  }
}

// Helper to log SLA status transition
export async function recordStatusTransition(businessId, appointmentId, statusFrom, statusTo) {
  if (!appointmentId || !statusTo || statusFrom === statusTo) return;

  try {
    const now = new Date();

    // 1. Get the appointment to find its creation time (default fallback)
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) return;

    // 2. Find the last transition log to calculate duration spent in statusFrom
    const lastHistory = await prisma.appointmentStatusHistory.findFirst({
      where: { appointmentId },
      orderBy: { transitionedAt: "desc" }
    });

    let durationSeconds = null;
    if (lastHistory) {
      const diffMs = now.getTime() - lastHistory.transitionedAt.getTime();
      durationSeconds = Math.round(diffMs / 1000);
    } else {
      // First status transition: calculate from appointment creation
      const apptCreatedAt = appointment.createdAt || new Date();
      const diffMs = now.getTime() - apptCreatedAt.getTime();
      durationSeconds = Math.round(diffMs / 1000);
    }

    // 3. Create history record
    await prisma.appointmentStatusHistory.create({
      data: {
        appointmentId,
        statusFrom: statusFrom || "PENDING",
        statusTo,
        transitionedAt: now,
        durationSeconds: durationSeconds > 0 ? durationSeconds : 0,
        businessId
      }
    });

    console.log(`[SLA] Transitioned appt ${appointmentId} from "${statusFrom}" to "${statusTo}". Spent ${durationSeconds} seconds.`);
  } catch (err) {
    console.error("[SLA] Error recording status transition:", err);
  }
}

// Helper function to process double mustache variables dynamically
function processTemplateVars(template, vars) {
  if (typeof template !== "string") return "";
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value !== undefined && value !== null ? String(value) : "");
  }
  return result;
}

// Inbound webhook executor
export async function triggerWorkflowByInboundWebhook(workflowId, payload, secret) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { businessModel: true }
  });

  if (!workflow) throw new Error("Workflow no encontrado.");
  if (workflow.status !== "ACTIVE") throw new Error("El workflow no está activo.");

  // Check trigger config
  const triggerConfig = workflow.trigger;
  if (triggerConfig?.type !== "webhook-inbound") {
    throw new Error("El workflow no está configurado para recibir peticiones webhook.");
  }

  if (triggerConfig.config?.secret && triggerConfig.config.secret !== secret) {
    throw new Error("Token secreto inválido.");
  }

  // Find a business that has this business model slug
  const businessModel = workflow.businessModel;
  if (!businessModel) throw new Error("El modelo de negocio asociado al workflow no existe.");

  const business = await prisma.business.findFirst({
    where: { model: businessModel.slug }
  });

  if (!business) throw new Error("No hay ningún negocio activo para este modelo de negocio.");

  const startTime = Date.now();
  const stepLogs = [];
  let executionStatus = "SUCCESS";

  const actionNodes = Array.isArray(workflow.steps) 
    ? workflow.steps.filter(n => n.type === "action")
    : [];

  // Parse variables from payload
  const clientName = payload.cliente || payload.name || "Cliente";
  const clientEmail = payload.email || payload.correo;
  const clientPhone = payload.telefono || payload.phone;
  const serviceName = payload.servicio || "Servicio";
  const servicePrice = payload.monto || payload.price || 0;
  const workerName = payload.profesional || "Profesional";

  const contextVars = {
    cliente: clientName,
    fecha: payload.fecha || new Date().toLocaleDateString("es-AR"),
    hora: payload.hora || new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    profesional: workerName,
    servicio: serviceName,
    saldo: `$${servicePrice}`,
    sucursal: business.name,
    ...payload
  };

  for (const node of actionNodes) {
    const subtype = String(node.subtype || node.type).toLowerCase();
    let stepResult = null;
    let stepError = null;

    try {
      if (node.integrationType === "webhook") {
        const url = node.config?.url;
        if (!url) throw new Error("No se especificó la URL de destino del Webhook.");

        const method = node.config?.method || "POST";
        let headers = {};
        if (node.config?.headers) {
          try { headers = JSON.parse(node.config.headers); } catch (e) { throw new Error("Cabeceras JSON inválidas."); }
        }

        let body = undefined;
        if (method !== "GET" && node.config?.body) {
          body = processTemplateVars(node.config.body, contextVars);
        }

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", ...headers },
          body
        });

        const responseText = await response.text();
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 150)}`);
        }
        stepResult = `Webhook enviado a ${url}. Respuesta: ${responseText.substring(0, 100)}`;
      } 
      else if (node.integrationType === "email") {
        if (!clientEmail) throw new Error("El cliente no tiene un email configurado.");
        const subject = processTemplateVars(node.config?.subject || "Notificación", contextVars);
        const message = processTemplateVars(node.config?.message || "Hola {{cliente}}!", contextVars);

        await sendReminderEmail({
          to: clientEmail,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #7c3aed; margin-top: 0;">${business.name}</h2>
              <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
              <p style="white-space: pre-wrap;">${message}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-top: 25px; margin-bottom: 10px;" />
              <p style="font-size: 11px; color: #888; text-align: center;">Automatizado por AuraDash Suite.</p>
            </div>
          `
        });
        stepResult = `Email enviado a ${clientEmail}.`;
      } 
      else if (node.integrationType === "whatsapp") {
        const message = processTemplateVars(node.config?.message || "Hola {{cliente}}!", contextVars);
        stepResult = `[WhatsApp simulado para ${clientPhone || "cliente"}]: "${message}"`;
      } 
      else {
        stepResult = `Acción de tipo ${subtype} completada.`;
      }

      stepLogs.push({
        nodeName: node.name || subtype,
        nodeType: node.type,
        status: "SUCCESS",
        result: stepResult
      });
    } catch (err) {
      executionStatus = "FAILED";
      stepError = err.message || String(err);
      stepLogs.push({
        nodeName: node.name || subtype,
        nodeType: node.type,
        status: "FAILED",
        error: stepError
      });
    }
  }

  // Save execution log to DB
  const runTimeMs = Date.now() - startTime;
  await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      status: executionStatus,
      triggerType: "webhook-inbound",
      runTimeMs,
      logs: {
        create: stepLogs.map(l => ({
          nodeName: l.nodeName,
          nodeType: l.nodeType,
          status: l.status,
          result: l.result || null,
          error: l.error || null
        }))
      }
    }
  });

  // Update run count
  await prisma.workflow.update({
    where: { id: workflow.id },
    data: {
      runCount: { increment: 1 },
      lastRunAt: new Date()
    }
  });

  return { status: executionStatus, logs: stepLogs };
}

