import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Modificando las fechas de las citas a la fecha de HOY (23 de Mayo de 2026)...");
  try {
    // Buscar todas las citas
    const appts = await prisma.appointment.findMany();

    if (appts.length === 0) {
      console.log("No se encontraron citas en la base de datos.");
      return;
    }

    // Actualizar todas las citas a hoy con diferentes horas
    const today = new Date();
    // Forzar fecha al 23 de Mayo de 2026
    today.setFullYear(2026);
    today.setMonth(4); // Mayo es 4 (0-indexed)
    today.setDate(23);

    for (let i = 0; i < appts.length; i++) {
      const appt = appts[i];
      const newStartsAt = new Date(today);
      // Poner una hora diferente para cada cita (ej: 10:00, 15:30)
      if (i === 0) {
        newStartsAt.setHours(10, 0, 0, 0);
      } else {
        newStartsAt.setHours(15, 30, 0, 0);
      }

      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          startsAt: newStartsAt,
          status: "CONFIRMED", // Asegurar que no estén canceladas para que sumen ingresos y citas activas
        },
      });
      console.log(`Cita [${appt.id}] actualizada a: ${newStartsAt}`);
    }

    console.log("¡Citas actualizadas exitosamente!");
  } catch (error) {
    console.error("Error al actualizar citas:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
