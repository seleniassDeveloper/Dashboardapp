import crypto from "crypto";

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
if (!ENCRYPTION_KEY_RAW) {
  throw new Error("CRITICAL SECURITY ERROR: ENCRYPTION_KEY or JWT_SECRET must be configured in environment.");
}

const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_KEY_RAW, "consent-salt-v2", 32);
const IV_LENGTH = 12; // Standard IV length for AES-256-GCM

/**
 * Encrypts a plain text string using AES-256-GCM (Authenticated Encryption).
 * Returns hex-encoded 'iv:authTag:ciphertext'.
 * @param {string} text
 * @returns {string}
 */
export function encryptData(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Error al cifrar información sensible.");
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM, with backward compatibility for legacy AES-256-CBC.
 * If decryption fails, returns null instead of raw ciphertext (no plaintext leak failsafe).
 * @param {string} encryptedText
 * @returns {string|null}
 */
export function decryptData(encryptedText) {
  if (!encryptedText) return encryptedText;
  if (typeof encryptedText !== "string" || !encryptedText.includes(":")) return encryptedText;

  const parts = encryptedText.split(":");
  try {
    if (parts.length === 3) {
      // AES-256-GCM: iv:authTag:encryptedHex
      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } else if (parts.length === 2) {
      // Legacy AES-256-CBC: iv:encryptedHex
      const [ivHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const legacyKey = crypto.scryptSync(ENCRYPTION_KEY_RAW, "consent-salt", 32);
      const decipher = crypto.createDecipheriv("aes-256-cbc", legacyKey, iv);
      let decrypted = decipher.update(Buffer.from(encryptedHex, "hex"), undefined, "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }
  } catch (error) {
    console.error("Decryption failed:", error.message);
    return null;
  }
  return null;
}
