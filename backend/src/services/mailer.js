import nodemailer from "nodemailer";
import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const lookupIPv4 = (hostname, options, callback) => {
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};


const isSecure = String(process.env.EMAIL_SECURE) === "true";
const port = Number(process.env.EMAIL_PORT || 465);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: port,
  secure: port === 465 ? true : isSecure, // Si es 465 forzamos true (TLS directo). Si es 587 false (STARTTLS).
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  lookup: lookupIPv4,
  connectionTimeout: 10000, // 10 segundos para no colgarse infinitamente
  greetingTimeout: 10000,
  socketTimeout: 10000,
  debug: true, // Habilitar logs detallados de nodemailer para ver por qué falla
  logger: true
});

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("[mailer] ADVERTENCIA: Faltan credenciales SMTP (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) en el entorno. Los correos fallarán.");
}


export async function sendReminderEmail({ to, subject, html, smtpConfig, attachments }) {
  if (!to) throw new Error("Email destino vacío");

  const extra = attachments && attachments.length ? { attachments } : {};

  let activeTransporter = transporter;
  let fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  let customPort = null;

  if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.password) {
    console.log(`[mailer] Usando transportador SMTP personalizado para el correo: ${smtpConfig.user}`);
    customPort = Number(smtpConfig.port || 587);
    const customSecure = customPort === 465 ? true : false; // 465 = direct TLS, others = STARTTLS
    
    activeTransporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: customPort,
      secure: customSecure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
      lookup: lookupIPv4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      debug: true,
      logger: true
    });
    
    fromAddress = `"${smtpConfig.user.split('@')[0]}" <${smtpConfig.user}>`;
  }

  try {
    await activeTransporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      ...extra,
    });
  } catch (error) {
    // Si falló el envío y estábamos usando el transportador personalizado con un puerto distinto a 465 (ej: 587)
    // intentamos hacer un fallback automático al puerto 465 (SSL/TLS directo) que suele evitar bloqueos de ISPs locales.
    if (smtpConfig && smtpConfig.host && customPort && customPort !== 465) {
      console.warn(`[mailer] Envío SMTP personalizado falló con puerto ${customPort}. Intentando fallback automático al puerto 465 (SSL/TLS)... Error:`, error.message);
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: 465,
          secure: true,
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
          },
          lookup: lookupIPv4,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
          debug: true,
          logger: true
        });
        await fallbackTransporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
          ...extra,
        });
        console.log(`[mailer] Envío exitoso en el reintento usando puerto 465 (SSL/TLS).`);
        return;
      } catch (fallbackError) {
        console.error(`[mailer] Reintento de fallback en puerto 465 también falló:`, fallbackError.message);
        throw fallbackError;
      }
    }
    
    // Si no es personalizado pero el default falló y usaba puerto != 465, y tenemos env vars disponibles
    if (!smtpConfig && process.env.EMAIL_HOST && Number(process.env.EMAIL_PORT || 465) !== 465) {
      const currentPort = Number(process.env.EMAIL_PORT || 465);
      console.warn(`[mailer] Envío SMTP global falló con puerto ${currentPort}. Intentando fallback automático al puerto 465 (SSL/TLS)... Error:`, error.message);
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          lookup: lookupIPv4,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
          debug: true,
          logger: true
        });
        await fallbackTransporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
          ...extra,
        });
        console.log(`[mailer] Envío global exitoso en el reintento usando puerto 465 (SSL/TLS).`);
        return;
      } catch (fallbackError) {
        console.error(`[mailer] Reintento global de fallback en puerto 465 también falló:`, fallbackError.message);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}
