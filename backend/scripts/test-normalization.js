import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

function normalizeAppointment(a) {
  if (!a) return null;
  const startsAtVal = a.startsAt || a.start;
  const starts = new Date(startsAtVal);
  const pad = (n) => String(n).padStart(2, "0");
  
  const date = `${starts.getFullYear()}-${pad(starts.getMonth() + 1)}-${pad(starts.getDate())}`;
  const startTime = `${pad(starts.getHours())}:${pad(starts.getMinutes())}`;
  
  const duration = a.service?.duration || a.duration || 60;
  const end = new Date(starts.getTime() + duration * 60 * 1000);
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  const clientName = [a.client?.firstName, a.client?.lastName].filter(Boolean).join(" ") || a.title || "Cliente";
  const workerName = [a.worker?.firstName, a.worker?.lastName].filter(Boolean).join(" ") || "Profesional";
  const workerId = a.workerId || a.professionalId || a.stylistId;

  return {
    ...a,
    id: String(a.id),
    clientName,
    serviceName: a.service?.name || a.serviceName || "Servicio",
    services: a.services || (a.service ? [a.service] : []),
    date,
    startTime,
    endTime,
    workerId,
    workerName,
    status: a.status || "PENDING",
    depositStatus: a.senaStatus || a.depositStatus || "SIN_SENA",
    totalPrice: Number(a.service?.price || a.totalPrice || 0),
    depositAmount: Number(a.señaAmount || a.depositAmount || 0),
    startsAt: startsAtVal
  };
}

async function main() {
  try {
    const appts = await prisma.appointment.findMany({
      include: {
        client: true,
        worker: true,
        service: true,
      }
    });

    console.log("Normalizing", appts.length, "appointments...");
    appts.forEach((a) => {
      const norm = normalizeAppointment(a);
      console.log(`- ID: ${norm.id}, date: ${norm.date}, startTime: ${norm.startTime}, startsAt: ${norm.startsAt}`);
    });
    console.log("Success! No crashes.");
  } catch (error) {
    console.error("Crash during normalization:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
