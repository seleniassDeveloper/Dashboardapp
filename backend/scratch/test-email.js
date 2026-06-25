import dotenv from "dotenv";
import nodemailer from "nodemailer";
import dns from "dns";

dotenv.config();

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const lookupIPv4 = (hostname, options, callback) => {
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

async function testEmail() {
  const isSecure = String(process.env.EMAIL_SECURE) === "true";
  const port = Number(process.env.EMAIL_PORT || 465);

  console.log("Config loaded from .env:");
  console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("EMAIL_PORT:", port);
  console.log("EMAIL_SECURE:", process.env.EMAIL_SECURE);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****" : "missing");

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: port === 465 ? true : isSecure,
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

  console.log("\nAttempting to send test email to auradash.digital@gmail.com...");
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_USER}" <${process.env.EMAIL_USER}>`,
      to: "auradash.digital@gmail.com",
      subject: "Test email from AuraDash",
      text: "This is a test email to verify SMTP settings.",
      html: "<b>This is a test email to verify SMTP settings.</b>"
    });
    console.log("\nSUCCESS! Message sent successfully.");
    console.log("Message ID:", info.messageId);
    console.log("Envelope:", info.envelope);
  } catch (error) {
    console.error("\nFAILED! Error sending email:", error);
  }
}

testEmail();
