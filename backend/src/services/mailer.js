import nodemailer from "nodemailer";


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
  connectionTimeout: 10000, // 10 segundos para no colgarse infinitamente
  greetingTimeout: 10000,
  socketTimeout: 10000,
  debug: true, // Habilitar logs detallados de nodemailer para ver por qué falla
  logger: true
});

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("[mailer] ADVERTENCIA: Faltan credenciales SMTP (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) en el entorno. Los correos fallarán.");
}


export async function sendReminderEmail({ to, subject, html, smtpConfig }) {
  if (!to) throw new Error("Email destino vacío");

  let activeTransporter = transporter;
  let fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.password) {
    console.log(`[mailer] Usando transportador SMTP personalizado para el correo: ${smtpConfig.user}`);
    const customPort = Number(smtpConfig.port || 587);
    const customSecure = customPort === 465 ? true : false; // 465 = direct TLS, others = STARTTLS
    
    activeTransporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: customPort,
      secure: customSecure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      debug: true,
      logger: true
    });
    
    fromAddress = `"${smtpConfig.user.split('@')[0]}" <${smtpConfig.user}>`;
  }

  await activeTransporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
  });
}
