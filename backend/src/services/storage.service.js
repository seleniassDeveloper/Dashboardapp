import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";
import { v2 as cloudinary } from "cloudinary";
import { ensureFirebaseAdmin } from "./firebaseAdmin.js";

// Configurar Cloudinary si existen las variables de entorno
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
  if (cloudinaryUrl) {
    cloudinary.config({ cloudinary_url: cloudinaryUrl });
  } else {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
  }
  console.log("[Storage Service] Cloudinary configurado y activo.");
}

/**
 * Uploads a base64 encoded image to Cloudinary (primary), Firebase Storage (secondary) or local filesystem (fallback).
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

  const filename = `${filenamePrefix}_${clientId}_${Date.now()}`;

  // 1. OPCIÓN PRIMARIA: Cloudinary (25 GB Free tier)
  const isCloudinaryConfigured = Boolean(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));

  if (isCloudinaryConfigured) {
    try {
      const folderPath = `crm/${clientId || "general"}`;

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
            public_id: filename,
            resource_type: "image",
            overwrite: true,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      if (uploadResult?.secure_url) {
        console.log(`[Storage Service] Imagen subida exitosamente a Cloudinary: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
      }
    } catch (err) {
      console.error("[Storage Service] Error al subir a Cloudinary, evaluando fallback:", err?.message || err);
    }
  }

  // 2. OPCIÓN SECUNDARIA: Firebase Storage
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (bucketName) {
    try {
      ensureFirebaseAdmin();
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(`appointments/${filename}.${ext}`);
      
      await file.save(buffer, {
        metadata: { contentType: mimeType },
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/appointments/${filename}.${ext}`;
      console.log(`[Storage Service] Imagen subida exitosamente a Firebase Storage: ${publicUrl}`);
      return publicUrl;
    } catch (err) {
      console.error("[Storage Service] Error al subir a Firebase Storage, recurriendo a disco local:", err?.message || err);
    }
  }

  // 3. FALLBACK: Disco local efímero
  console.warn("[Storage Service] Ni Cloudinary ni Firebase Storage están configurados. Usando disco local efímero.");
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fullFilename = `${filename}.${ext}`;
  const filePath = path.join(uploadsDir, fullFilename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${fullFilename}`;
}
