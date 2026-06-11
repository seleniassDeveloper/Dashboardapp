import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

/**
 * Uploads a base64 encoded image to either Firebase Storage or local filesystem fallback.
 * 
 * @param {string} base64Data - Base64 encoded image data (e.g. data:image/png;base64,...)
 * @param {string} filenamePrefix - Prefix for the saved filename
 * @param {string} clientId - Client ID associated with the photo
 * @returns {Promise<string|null>} Public URL of the uploaded image or null if invalid
 */
export async function uploadBase64Image(base64Data, filenamePrefix, clientId) {
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

  const filename = `${filenamePrefix}_${clientId}_${Date.now()}.${ext}`;

  // Check if Firebase Storage is configured
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (bucketName && admin.apps.length > 0) {
    try {
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(`appointments/${filename}`);
      
      await file.save(buffer, {
        metadata: { contentType: mimeType },
        public: true,
      });

      // Public URL on google cloud storage
      return `https://storage.googleapis.com/${bucketName}/appointments/${filename}`;
    } catch (err) {
      console.error("[Storage Service] Error uploading to Firebase Storage, falling back to local storage:", err);
    }
  }

  // Fallback to local folder
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`;
}
