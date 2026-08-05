import fetch from "node-fetch";

/**
 * Normaliza un número telefónico para WhatsApp (E.164 sin +)
 * Ej: "+54 9 11 2233-4455" -> "5491122334455"
 */
export function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/**
 * Obtiene la configuración de WhatsApp del objeto integrations del negocio
 * @param {Object} business - Objeto Business de Prisma (o biz.integrations)
 */
export function getWhatsAppConfig(business) {
  const integrations = business?.integrations || business || {};
  const whatsapp = integrations.whatsapp || {};
  return {
    phoneId: whatsapp.phoneId || process.env.WHATSAPP_PHONE_ID,
    token: whatsapp.token || process.env.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_TOKEN,
    businessId: whatsapp.businessId,
    staffPhone: whatsapp.staffPhone ? normalizePhone(whatsapp.staffPhone) : null,
  };
}

/**
 * Envía un mensaje de texto simple por Meta Cloud API
 */
export async function sendText(whatsappConfig, toPhone, text) {
  const { phoneId, token } = typeof whatsappConfig === "object" && whatsappConfig.phoneId ? whatsappConfig : getWhatsAppConfig(whatsappConfig);

  if (!phoneId || !token) {
    throw new Error("WhatsApp no está configurado (falta Phone Number ID o Token de acceso).");
  }

  const cleanPhone = normalizePhone(toPhone);
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error(`Número de teléfono inválido para WhatsApp: ${toPhone}`);
  }

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: {
      preview_url: false,
      body: text
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = responseData?.error?.message || `HTTP ${response.status} en envío de WhatsApp`;
    console.error("[WhatsApp Service] Error enviando mensaje:", errorMsg, responseData);
    throw new Error(`Meta Cloud API Error: ${errorMsg}`);
  }

  console.log(`[WhatsApp Service] Mensaje de texto enviado con éxito a ${cleanPhone}`);
  return responseData;
}

/**
 * Envía un mensaje interactivo con botones (máx 3 botones)
 */
export async function sendButtons(whatsappConfig, toPhone, bodyText, buttons = []) {
  const { phoneId, token } = typeof whatsappConfig === "object" && whatsappConfig.phoneId ? whatsappConfig : getWhatsAppConfig(whatsappConfig);

  if (!phoneId || !token) {
    return sendText(whatsappConfig, toPhone, bodyText);
  }

  const cleanPhone = normalizePhone(toPhone);

  const formattedButtons = buttons.slice(0, 3).map((b, idx) => ({
    type: "reply",
    reply: {
      id: b.id || `btn_${idx}`,
      title: (b.title || b.text || "").slice(0, 20)
    }
  }));

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: formattedButtons }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.warn("[WhatsApp Service] Falló envío con botones, fallback a texto:", responseData);
    const fallbackText = `${bodyText}\n\nOpciones:\n` + buttons.map((b, i) => `${i + 1}. ${b.title || b.text}`).join("\n");
    return sendText({ phoneId, token }, toPhone, fallbackText);
  }

  return responseData;
}

/**
 * Envía un mensaje interactivo tipo lista (máx 10 items por sección)
 */
export async function sendList(whatsappConfig, toPhone, buttonTitle, bodyText, sections = []) {
  const { phoneId, token } = typeof whatsappConfig === "object" && whatsappConfig.phoneId ? whatsappConfig : getWhatsAppConfig(whatsappConfig);

  if (!phoneId || !token) {
    return sendText(whatsappConfig, toPhone, bodyText);
  }

  const cleanPhone = normalizePhone(toPhone);

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: (buttonTitle || "Ver opciones").slice(0, 20),
        sections: sections
      }
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.warn("[WhatsApp Service] Falló envío con lista, fallback a texto:", responseData);
    return sendText({ phoneId, token }, toPhone, bodyText);
  }

  return responseData;
}
