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


export async function sendReminderEmail({ to, subject, html }) {
  if (!to) throw new Error("Email destino vacío");

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}
