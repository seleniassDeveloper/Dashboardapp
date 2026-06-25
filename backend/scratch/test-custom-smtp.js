import nodemailer from "nodemailer";
import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const lookupIPv4 = (hostname, options, callback) => {
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

async function testCustomSmtp() {
  const host = "smtp.gmail.com";
  const port = 587;
  const user = "seleniadeveloper@gmail.com";
  const password = "bjadzlbgmbmjuxcy";

  console.log("Testing CUSTOM SMTP config:");
  console.log("Host:", host);
  console.log("Port:", port);
  console.log("User:", user);
  console.log("Password:", "****");

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: false, // 587 is STARTTLS, so secure is false
    auth: {
      user: user,
      pass: password,
    },
    lookup: lookupIPv4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: true,
    logger: true
  });

  try {
    const info = await transporter.sendMail({
      from: `"${user.split('@')[0]}" <${user}>`,
      to: "auradash.digital@gmail.com",
      subject: "Test custom SMTP from AuraDash",
      text: "This is a test email using custom SMTP settings.",
      html: "<b>This is a test email using custom SMTP settings.</b>"
    });
    console.log("\nSUCCESS! Custom SMTP message sent successfully.");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("\nFAILED! Error sending email with custom SMTP:", error);
  }
}

testCustomSmtp();
