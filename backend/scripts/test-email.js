/**
 * Prueba directa de envío SMTP (Gmail).
 * Sirve para confirmar si la App Password y la config de correo funcionan,
 * aislado del resto de la app.
 *
 * USO (desde la carpeta backend, con internet):
 *   EMAIL_HOST=smtp.gmail.com EMAIL_PORT=465 EMAIL_SECURE=true \
 *   EMAIL_USER=auradash.digital@gmail.com EMAIL_PASS=cyrbqvrdpildeiyd \
 *   EMAIL_FROM="AuraDash <auradash.digital@gmail.com>" \
 *   node scripts/test-email.js
 *
 * O si ya tienes esas variables en backend/.env:
 *   node -r dotenv/config scripts/test-email.js
 */
import nodemailer from "nodemailer";

const cfg = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 465),
  secure: String(process.env.EMAIL_SECURE) === "true",
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};

console.log("Configuración detectada:");
console.log("  host:", cfg.host);
console.log("  port:", cfg.port);
console.log("  secure:", cfg.secure);
console.log("  user:", cfg.user);
console.log("  pass:", cfg.pass ? `(${cfg.pass.length} caracteres)` : "FALTA ❌");
console.log("");

if (!cfg.host || !cfg.user || !cfg.pass) {
  console.error("❌ Faltan variables EMAIL_HOST / EMAIL_USER / EMAIL_PASS. Pásalas por env.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: cfg.host,
  port: cfg.port,
  secure: cfg.secure,
  auth: { user: cfg.user, pass: cfg.pass },
});

try {
  console.log("1) Verificando login con Gmail...");
  await transporter.verify();
  console.log("   ✅ Login OK: Gmail acepta las credenciales.");

  console.log("2) Enviando correo de prueba a auradash.digital@gmail.com...");
  const info = await transporter.sendMail({
    from: cfg.from,
    to: "auradash.digital@gmail.com",
    subject: "✅ Prueba SMTP AuraDash",
    html: "<b>Si lees esto, el envío de correos funciona correctamente.</b>",
  });
  console.log("   ✅ Enviado. messageId:", info.messageId);
  console.log("\n🎉 TODO OK. Revisa la bandeja de auradash.digital@gmail.com (y Spam).");
} catch (e) {
  console.error("\n❌ FALLÓ EL ENVÍO. Error exacto:");
  console.error("  ", e.message);
  console.error("\nCausas típicas:");
  console.error("  - La verificación en 2 pasos NO está activa en la cuenta de Gmail.");
  console.error("  - La App Password es incorrecta o tiene espacios.");
  console.error("  - EMAIL_SECURE/EMAIL_PORT mal (usa 465 + true, o 587 + false).");
  process.exit(1);
}
