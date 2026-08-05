import prisma from "../prisma.js";
import OpenAI from "openai";
import { normalizePhone, sendText, sendButtons, sendList } from "./whatsapp.service.js";
import { createBookingCore } from "./booking.service.js";
import { getDayRangeInTz } from "../utils/dateUtils.js";

let openaiClient = null;
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos

export async function getOrCreateSession(businessId, phone) {
  const cleanPhone = normalizePhone(phone);
  let session = await prisma.whatsAppSession.findUnique({
    where: { businessId_phone: { businessId, phone: cleanPhone } }
  }).catch(() => null);

  const now = Date.now();

  if (session) {
    const elapsed = now - new Date(session.updatedAt).getTime();
    if (elapsed > SESSION_TTL_MS && session.state !== "MENU") {
      console.log(`[WhatsApp Bot] ⏰ TTL expirado (30m) para ${cleanPhone} en ${businessId}. Reiniciando sesión a MENU.`);
      session = await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: "MENU", context: {} }
      });
    }
  } else {
    session = await prisma.whatsAppSession.create({
      data: {
        businessId,
        phone: cleanPhone,
        state: "MENU",
        context: {}
      }
    });
  }

  return session;
}

export async function updateSession(sessionId, state, context = {}) {
  return await prisma.whatsAppSession.update({
    where: { id: sessionId },
    data: { state, context }
  });
}

/**
 * Procesa un mensaje entrante de WhatsApp mediante la máquina de estados
 */
export async function processBotMessage({ business, fromPhone, textContent, messageId }) {
  const cleanPhone = normalizePhone(fromPhone);
  const session = await getOrCreateSession(business.id, cleanPhone);
  const textUpper = (textContent || "").trim().toUpperCase();

  // Comandos globales de reinicio
  if (["HOLA", "MENU", "MENÚ", "INICIO", "REINICIAR", "0", "EMPEZAR"].includes(textUpper)) {
    await updateSession(session.id, "MENU", {});
    return await sendMainMenu(business, cleanPhone);
  }

  // Manejo de Staff Command: "/FIN <TEL>" para liberar Handoff Humano
  if (textContent.startsWith("/fin") || textContent.startsWith("/cerrar")) {
    const parts = textContent.split(" ");
    if (parts.length >= 2) {
      const targetPhone = normalizePhone(parts[1]);
      const targetSession = await prisma.whatsAppSession.findFirst({
        where: { businessId: business.id, phone: targetPhone }
      });
      if (targetSession) {
        await updateSession(targetSession.id, "MENU", {});
        await sendText(business, targetPhone, "🙌 El equipo ha finalizado la atención personalizada. ¡Escribe *MENU* cuando desees agendar otro turno!");
        await sendText(business, cleanPhone, `✅ Atención personalizada finalizada para el cliente ${targetPhone}.`);
        return;
      }
    }
  }

  // Ruteo según estado actual
  switch (session.state) {
    case "HUMAN_HANDOFF":
      return await handleHumanHandoffState(business, session, textContent);

    case "BOOKING_SERVICE":
      return await handleBookingServiceStep(business, session, textContent);

    case "BOOKING_DAY":
      return await handleBookingDayStep(business, session, textContent);

    case "BOOKING_SLOT":
      return await handleBookingSlotStep(business, session, textContent);

    case "BOOKING_CONFIRM":
      return await handleBookingConfirmStep(business, session, textContent);

    case "MY_APPOINTMENTS":
      return await handleMyAppointmentsStep(business, session, textContent);

    case "MENU":
    default:
      return await handleMenuSelection(business, session, textContent);
  }
}

/**
 * Envía el menú principal interactivo
 */
export async function sendMainMenu(business, phone) {
  const greeting = `¡Hola! 👋 Soy el asistente virtual de *${business.name}*.\n\n¿En qué te puedo ayudar hoy?`;
  
  const buttons = [
    { id: "btn_book", title: "📅 Agendar turno" },
    { id: "btn_services", title: "✂️ Servicios/Precios" },
    { id: "btn_human", title: "👤 Hablar con equipo" }
  ];

  return await sendButtons(business, phone, greeting, buttons);
}

/**
 * Maneja la selección dentro del menú principal
 */
async function handleMenuSelection(business, session, textContent) {
  const textUpper = textContent.trim().toUpperCase();

  if (textUpper === "BTN_BOOK" || textUpper.includes("AGENDAR") || textUpper === "1") {
    return await startBookingFlow(business, session);
  }

  if (textUpper === "BTN_SERVICES" || textUpper.includes("SERVICIO") || textUpper.includes("PRECIO") || textUpper === "2") {
    return await sendServicesList(business, session.phone);
  }

  if (textUpper === "BTN_MY_APPTS" || textUpper.includes("MIS TURNOS") || textUpper.includes("CANCELAR") || textUpper === "3") {
    return await startMyAppointmentsFlow(business, session);
  }

  if (textUpper === "BTN_HUMAN" || textUpper.includes("HABLAR") || textUpper.includes("PERSONAL") || textUpper === "4") {
    return await startHumanHandoff(business, session, textContent);
  }

  // Si no matchea opciones principales, procesar consulta mediante IA acotada al negocio
  return await handleAIQA(business, session, textContent);
}

/**
 * Muestra lista de servicios y precios
 */
async function sendServicesList(business, phone) {
  const services = await prisma.service.findMany({
    where: { businessId: business.id, isActive: true, availableOnline: true },
    orderBy: { name: "asc" }
  });

  if (!services || services.length === 0) {
    return await sendText(business, phone, "Actualmente no hay servicios disponibles para reserva online.");
  }

  let text = `✨ *Servicios y Precios de ${business.name}:*\n\n`;
  services.forEach((s, idx) => {
    text += `${idx + 1}. *${s.name}*\n   ⏱️ Duración: ${s.duration} min | 💵 Precio: $${s.price}\n\n`;
  });

  text += `Escribe *MENU* o toca *Agendar turno* para reservar tu horario.`;

  return await sendButtons(business, phone, text, [
    { id: "btn_book", title: "📅 Agendar turno" },
    { id: "btn_human", title: "👤 Hablar con equipo" }
  ]);
}

/**
 * Inicia el flujo de Agendado -> Paso 1: Selección de Servicio
 */
async function startBookingFlow(business, session) {
  const services = await prisma.service.findMany({
    where: { businessId: business.id, isActive: true, availableOnline: true },
    take: 10
  });

  if (!services || services.length === 0) {
    return await sendText(business, session.phone, "No hay servicios disponibles en este momento. Por favor contacta al personal.");
  }

  await updateSession(session.id, "BOOKING_SERVICE", {});

  const rows = services.map(s => ({
    id: `svc_${s.id}`,
    title: s.name.slice(0, 24),
    description: `$${s.price} • ${s.duration} min`
  }));

  const sections = [{ title: "Servicios Disponibles", rows }];

  return await sendList(
    business,
    session.phone,
    "Ver Servicios",
    "📌 *Paso 1/3: Selecciona el servicio que deseas reservar:*",
    sections
  );
}

/**
 * Manejo Paso 1: Selección de servicio elegido
 */
async function handleBookingServiceStep(business, session, textContent) {
  let serviceId = null;

  if (textContent.startsWith("SVC_")) {
    serviceId = textContent.replace("SVC_", "").trim();
  } else {
    // Intentar buscar servicio por id o por coincidencia de nombre/número
    const services = await prisma.service.findMany({
      where: { businessId: business.id, isActive: true, availableOnline: true }
    });
    const idx = parseInt(textContent, 10) - 1;
    if (!isNaN(idx) && services[idx]) {
      serviceId = services[idx].id;
    } else {
      const match = services.find(s => s.name.toLowerCase().includes(textContent.toLowerCase()));
      if (match) serviceId = match.id;
    }
  }

  if (!serviceId) {
    return await sendText(business, session.phone, "Por favor selecciona un servicio válido de la lista.");
  }

  const selectedService = await prisma.service.findUnique({ where: { id: serviceId } });

  // Guardar servicio en contexto y avanzar a selección de día
  const newContext = { ...session.context, serviceId: selectedService.id, serviceName: selectedService.name, servicePrice: selectedService.price };
  await updateSession(session.id, "BOOKING_DAY", newContext);

  // Generar próximos 5 días habiles
  const daysOptions = [];
  const now = new Date();
  const daysShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = `${daysShort[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
    daysOptions.push({ id: `day_${dayStr}`, title: label });
  }

  return await sendButtons(
    business,
    session.phone,
    `Has elegido: *${selectedService.name}* ($${selectedService.price})\n\n📅 *Paso 2/3: Selecciona el día para tu turno:*`,
    daysOptions.slice(0, 3)
  );
}

/**
 * Manejo Paso 2: Selección de día
 */
async function handleBookingDayStep(business, session, textContent) {
  let dayISO = null;

  if (textContent.startsWith("DAY_")) {
    dayISO = textContent.replace("DAY_", "").trim();
  } else {
    // Si escribió la fecha YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(textContent)) {
      dayISO = textContent;
    }
  }

  if (!dayISO) {
    // Fallback: usar mañana si no reconoció el día
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    dayISO = tomorrow.toISOString().slice(0, 10);
  }

  const newContext = { ...session.context, date: dayISO };
  await updateSession(session.id, "BOOKING_SLOT", newContext);

  // Horarios sugeridos estándar para selección rápida
  const defaultSlots = ["09:00", "11:00", "14:00", "16:00", "18:00"];

  const buttons = defaultSlots.slice(0, 3).map(slot => ({
    id: `slot_${slot}`,
    title: `⏰ ${slot} hs`
  }));

  return await sendButtons(
    business,
    session.phone,
    `📅 Día elegido: *${dayISO}*\n\n⏰ *Paso 3/3: Selecciona el horario que prefieras:*`,
    buttons
  );
}

/**
 * Manejo Paso 3: Selección de horario
 */
async function handleBookingSlotStep(business, session, textContent) {
  let slotTime = null;

  if (textContent.startsWith("SLOT_")) {
    slotTime = textContent.replace("SLOT_", "").trim();
  } else if (/^\d{2}:\d{2}$/.test(textContent)) {
    slotTime = textContent;
  } else {
    slotTime = "10:00"; // Default
  }

  const newContext = { ...session.context, time: slotTime };
  await updateSession(session.id, "BOOKING_CONFIRM", newContext);

  const summary = `📌 *Confirmación de tu reserva:*\n\n` +
    `• *Servicio:* ${newContext.serviceName}\n` +
    `• *Fecha:* ${newContext.date}\n` +
    `• *Hora:* ${newContext.time} hs\n` +
    `• *Precio:* $${newContext.servicePrice}\n\n` +
    `¿Deseas confirmar la reserva?`;

  const buttons = [
    { id: "btn_confirm_yes", title: "✅ Confirmar turno" },
    { id: "btn_confirm_no", title: "❌ Cancelar" }
  ];

  return await sendButtons(business, session.phone, summary, buttons);
}

/**
 * Paso final: Confirmación atómica de la reserva
 */
async function handleBookingConfirmStep(business, session, textContent) {
  const textUpper = textContent.trim().toUpperCase();

  if (textUpper === "BTN_CONFIRM_YES" || textUpper.includes("CONFIRMAR") || textUpper === "SI" || textUpper === "SÍ") {
    try {
      const { serviceId, date, time } = session.context || {};

      const bookingResult = await createBookingCore({
        businessId: business.id,
        slug: business.slug,
        firstName: "Cliente WhatsApp",
        phone: session.phone,
        serviceId: serviceId,
        professionalId: "any",
        date: date,
        time: time,
        source: "whatsapp"
      });

      const { firstAppointment, service } = bookingResult;
      const turnCode = firstAppointment.id.slice(-6).toUpperCase();

      await updateSession(session.id, "MENU", {});

      const successMsg = `¡Tu turno ha sido confirmado y registrado con éxito! 🎉\n\n` +
        `📌 *Servicio:* ${service?.name}\n` +
        `📅 *Fecha:* ${date}\n` +
        `⏰ *Hora:* ${time} hs\n` +
        `🔢 *Nº de reserva:* #${turnCode}\n\n` +
        `¡Te esperamos en *${business.name}*!`;

      return await sendText(business, session.phone, successMsg);
    } catch (err) {
      console.error("[WhatsApp Bot] Error guardando reserva:", err);
      await updateSession(session.id, "MENU", {});
      return await sendText(business, session.phone, `Disculpa, el horario ya no se encuentra disponible (${err.message}). Por favor intenta con otro horario escribiendo *MENU*.`);
    }
  }

  // Si cancela
  await updateSession(session.id, "MENU", {});
  return await sendText(business, session.phone, "Proceso de reserva cancelado. Escribe *MENU* cuando desees intentar nuevamente.");
}

/**
 * Consulta y gestión de turnos del cliente
 */
async function startMyAppointmentsFlow(business, session) {
  const clients = await prisma.client.findMany({
    where: { businessId: business.id, phone: session.phone },
    select: { id: true }
  });

  if (!clients || clients.length === 0) {
    return await sendText(business, session.phone, "No tienes reservas registradas en este salón.");
  }

  const clientIds = clients.map(c => c.id);
  const appts = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      clientId: { in: clientIds },
      status: { in: ["PENDING", "CONFIRMED", "UNCONFIRMED"] },
      startsAt: { gte: new Date() }
    },
    include: { service: true },
    orderBy: { startsAt: "asc" }
  });

  if (appts.length === 0) {
    return await sendText(business, session.phone, "No tienes turnos próximos pendientes en este salón.");
  }

  await updateSession(session.id, "MY_APPOINTMENTS", { appointments: appts.map(a => a.id) });

  let text = `📅 *Tus Turnos Próximos:*\n\n`;
  appts.forEach((a, idx) => {
    const d = new Date(a.startsAt);
    const dateStr = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
    const timeStr = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    text += `${idx + 1}. *${a.service?.name}*\n   📆 ${dateStr} a las ${timeStr} hs (Estado: ${a.status})\n\n`;
  });

  text += `Para cancelar una cita, escribe *CANCELAR 1* (o el número correspondiente). Escribe *MENU* para regresar.`;

  return await sendText(business, session.phone, text);
}

async function handleMyAppointmentsStep(business, session, textContent) {
  const textUpper = textContent.trim().toUpperCase();

  if (textUpper.startsWith("CANCELAR")) {
    const parts = textUpper.split(" ");
    const idx = parseInt(parts[1], 10) - 1;

    const apptIds = session.context?.appointments || [];
    if (!isNaN(idx) && apptIds[idx]) {
      const apptId = apptIds[idx];
      await prisma.appointment.update({
        where: { id: apptId },
        data: { status: "CANCELLED" }
      });

      await updateSession(session.id, "MENU", {});
      return await sendText(business, session.phone, "✅ Tu cita ha sido cancelada exitosamente.");
    }
  }

  await updateSession(session.id, "MENU", {});
  return await sendMainMenu(business, session.phone);
}

/**
 * TAREA 5: Handoff Humano ("Hablar con alguien")
 */
async function startHumanHandoff(business, session, textContent) {
  await updateSession(session.id, "HUMAN_HANDOFF", { startedAt: new Date() });

  const wpConfig = business.integrations?.whatsapp;
  const staffPhone = wpConfig?.staffPhone ? normalizePhone(wpConfig.staffPhone) : null;

  if (staffPhone) {
    const alertMsg = `📩 *Atención Requerida:* El cliente con número *+${session.phone}* ha solicitado hablar con el personal.\n\n` +
      `Último mensaje recibido: "${textContent}"\n\n` +
      `Para finalizar la atención personalizada y reactivar el bot para este cliente, responde: */fin ${session.phone}*`;

    await sendText(business, staffPhone, alertMsg).catch(err => console.error("[WhatsApp Bot] Error al avisar al staffPhone:", err));
  }

  const clientMsg = `🙌 Le he avisado a nuestro equipo. Un integrante del personal te responderá a la brevedad.\n\n` +
    `*(El bot se encuentra en pausa para este chat. Escribe *MENU* en cualquier momento para volver al menú automático)*.`;

  return await sendText(business, session.phone, clientMsg);
}

async function handleHumanHandoffState(business, session, textContent) {
  // Si el cliente escribe MENU o CANCELAR, sale voluntariamente del handoff
  const textUpper = textContent.trim().toUpperCase();
  if (["MENU", "MENÚ", "INICIO", "VOLVER", "CANCELAR"].includes(textUpper)) {
    await updateSession(session.id, "MENU", {});
    return await sendMainMenu(business, session.phone);
  }

  // En handoff humano, el bot permanece en silencio para no interferir con el personal
  console.log(`[WhatsApp Bot] Chat ${session.phone} en HUMAN_HANDOFF. Omitiendo auto-respuesta.`);
}

/**
 * TAREA 4: IA acotada al negocio para texto libre y preguntas frecuentes (OpenAI gpt-4o-mini)
 */
async function handleAIQA(business, session, textContent) {
  const openai = getOpenAI();

  if (!openai) {
    // Fallback si no hay API key configurada
    return await sendButtons(
      business,
      session.phone,
      `Entendido. ¿Deseas agendar un turno o ver los servicios?`,
      [
        { id: "btn_book", title: "📅 Agendar turno" },
        { id: "btn_services", title: "✂️ Servicios" },
        { id: "btn_human", title: "👤 Hablar con equipo" }
      ]
    );
  }

  try {
    // Cargar contexto acotado del negocio
    const services = await prisma.service.findMany({
      where: { businessId: business.id, isActive: true },
      select: { name: true, price: true, duration: true }
    });

    const servicesInfo = services.map(s => `- ${s.name}: $${s.price} (${s.duration} min)`).join("\n");

    const systemPrompt = `Eres el asistente virtual inteligente de "${business.name}" (${business.industry || "Salón"}).
Tus respuestas deben ser breves, amables, concisas y basadas ÚNICAMENTE en la siguiente información del negocio:

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${business.name}
- Rubro: ${business.industry || "Servicios"}
- Descripción: ${business.description || "Atención personalizada"}
- Servicios y Precios:
${servicesInfo || "Consulte por servicios disponibles"}

REGLAS DE SEGURIDAD STRICTAS:
1. Responde de forma amable en un solo párrafo corto (máx 3 frases).
2. NUNCA prometas ni confirmes reservas por tu cuenta en el texto de la IA.
3. Si la pregunta es sobre agendar, reservar o sacar un turno, invita amablemente al cliente a tocar la opción "Agendar turno".
4. Si la consulta no está en los datos proporcionados, indica que pueden hablar con el equipo de trabajo.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textContent }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const aiAnswer = completion.choices[0]?.message?.content?.trim() || "Con gusto te ayudo a agendar tu turno.";

    return await sendButtons(
      business,
      session.phone,
      aiAnswer,
      [
        { id: "btn_book", title: "📅 Agendar turno" },
        { id: "btn_human", title: "👤 Hablar con equipo" }
      ]
    );
  } catch (err) {
    console.error("[WhatsApp Bot AI] Error en llamada a OpenAI:", err?.message || err);
    return await sendButtons(
      business,
      session.phone,
      `No comprendí bien tu consulta. ¿Deseas agendar un turno o hablar con el equipo?`,
      [
        { id: "btn_book", title: "📅 Agendar turno" },
        { id: "btn_human", title: "👤 Hablar con equipo" }
      ]
    );
  }
}
