import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "finance-bypass-secret-studio-aura-32-chars-long");
if (process.env.NODE_ENV === "production" && !SECRET) {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET is not configured in production.");
}

/**
 * Genera un token de bypass firmado digitalmente con una validez de 2 horas.
 * @param {string} userId - ID del supervisor que autoriza
 * @param {string} businessId - ID de la empresa activa
 * @returns {string} - Token firmado base64
 */
export function generateBypassToken(userId, businessId) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 2; // 2 horas de validez
  const payload = JSON.stringify({ userId, businessId, expiresAt });
  
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
    
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

/**
 * Verifica la firma y expiración del token de bypass financiero.
 * @param {string} token - Token completo (payloadBase64.firma)
 * @returns {object|null} - El payload decodificado si es válido, null en caso contrario
 */
export function verifyBypassToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }
  
  try {
    const [payloadBase64, signature] = token.split(".");
    const payloadStr = Buffer.from(payloadBase64, "base64").toString("utf8");
    
    // Validar firma
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payloadStr)
      .digest("hex");
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(payloadStr);
    
    // Validar expiración
    if (payload.expiresAt < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error("Error al verificar token de bypass financiero:", error);
    return null;
  }
}
