import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "consent-encryption-secret-key-aura-32");
if (process.env.NODE_ENV === "production" && !SECRET) {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET is not configured in production.");
}
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || SECRET;
if (process.env.NODE_ENV === "production" && !process.env.ENCRYPTION_KEY) {
  throw new Error("CRITICAL SECURITY ERROR: ENCRYPTION_KEY is not configured in production.");
}
const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_KEY_RAW, "consent-salt", 32);
const IV_LENGTH = 16;

/**
 * Encrypts a plain text string using AES-256-CBC.
 * Returns the hex-encoded IV and cipher text joined by ':'.
 * @param {string} text
 * @returns {string}
 */
export function encryptData(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
}

/**
 * Decrypts a hex-encoded IV:ciphertext string using AES-256-CBC.
 * If decryption fails, returns the original text.
 * @param {string} encryptedText
 * @returns {string}
 */
export function decryptData(encryptedText) {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  try {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    if (!ivHex || !encryptedHex) return encryptedText;

    const iv = Buffer.from(ivHex, "hex");
    const encryptedBytes = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedBytes, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    // Return original if it wasn't encrypted or decryption failed (failsafe)
    return encryptedText;
  }
}
