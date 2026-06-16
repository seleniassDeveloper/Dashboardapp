import prisma from "../backend/src/prisma.js";
import { getDayRangeInTz } from "../backend/src/utils/timezone.util.js";

async function test() {
  try {
    const slug = "auradashdigital";
    const biz = await prisma.business.findUnique({ where: { slug } });
    console.log("Biz:", biz.id, biz.timezone);

    const date = "2026-06-15";
    const time = "10:00";
    
    console.log("Testing timezone util...");
    const { start: dayStartInUTC } = getDayRangeInTz(date, biz.timezone);
    console.log("dayStartInUTC:", dayStartInUTC);
    
    const [startH, startM] = time.split(":").map(Number);
    const startsAt = new Date(dayStartInUTC.getTime() + (startH * 60 + startM) * 60 * 1000);
    console.log("startsAt:", startsAt);

    // Fetch a worker and service
    const worker = await prisma.worker.findFirst({ where: { businessId: biz.id }});
    const service = await prisma.service.findFirst({ where: { businessId: biz.id }});
    const client = await prisma.client.findFirst({ where: { businessId: biz.id }});

    if (!worker || !service || !client) {
      console.log("Missing data to simulate booking");
      return;
    }

    // Try a transaction
    await prisma.$transaction(async (tx) => {
      const { start: txDayStart, end: txDayEnd } = getDayRangeInTz(date, biz.timezone);
      console.log("txDayStart:", txDayStart, "txDayEnd:", txDayEnd);
      
      const appointment = await tx.appointment.create({
        data: {
          clientId: client.id,
          serviceId: service.id,
          workerId: worker.id,
          startsAt: startsAt,
          notes: "Testing 123",
          status: "PENDING",
          source: "online_booking",
          businessId: biz.id,
        }
      });
      console.log("Created appointment:", appointment.id);
      
      // Rollback immediately so we don't pollute local db
      throw new Error("ROLLBACK_ON_PURPOSE");
    });

  } catch (error) {
    if (error.message !== "ROLLBACK_ON_PURPOSE") {
      console.error("Caught error:", error);
    } else {
      console.log("Success (rolled back)!");
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
