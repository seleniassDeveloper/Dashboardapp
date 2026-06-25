import dotenv from "dotenv";
import prisma from "../src/prisma.js";
import { sendManualConfirmationEmail } from "../src/controllers/appointments.controller.js";

dotenv.config();

async function run() {
  const apptId = "cmqscs4ba0001fg01rcn2m2vr"; // Appointment for Fernando Sanchez
  console.log(`Simulating sendManualConfirmationEmail for appointment ID: ${apptId}`);

  const req = {
    params: { id: apptId },
    body: { email: "auradash.digital@gmail.com" }, // send to this email for testing
    user: { email: "seleniadeveloper@gmail.com", role: "owner" }
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log(`\nResponse Code: ${this.statusCode}`);
      console.log("Response Body:", JSON.stringify(data, null, 2));
      return this;
    }
  };

  try {
    await sendManualConfirmationEmail(req, res);
  } catch (err) {
    console.error("Unhandle controller error:", err);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
