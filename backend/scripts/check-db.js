import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Conectando a la base de datos...");
  try {
    const clientsCount = await prisma.client.count();
    const apptsCount = await prisma.appointment.count();
    const workersCount = await prisma.worker.count();
    const servicesCount = await prisma.service.count();
    const widgetsCount = await prisma.dashboardWidget.count();

    console.log(`\n--- RESUMEN DE LA BASE DE DATOS ---`);
    console.log(`Clientes: ${clientsCount}`);
    console.log(`Citas: ${apptsCount}`);
    console.log(`Colaboradores: ${workersCount}`);
    console.log(`Servicios: ${servicesCount}`);
    console.log(`Widgets de Dashboard: ${widgetsCount}`);

    console.log(`\n--- CITAS DETALLE (Últimas 10) ---`);
    const appts = await prisma.appointment.findMany({
      take: 10,
      orderBy: { startsAt: "desc" },
      include: {
        client: true,
        worker: true,
        service: true
      }
    });

    if (appts.length === 0) {
      console.log("No hay citas registradas en la base de datos.");
    } else {
      appts.forEach((a, i) => {
        console.log(`[${i+1}] ID: ${a.id} | Fecha: ${a.startsAt} | Estado: ${a.status} | Cliente: ${a.client?.firstName || 'N/A'} | Servicio: ${a.service?.name || 'N/A'} | Precio: ${a.service?.price || 0}`);
      });
    }
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
