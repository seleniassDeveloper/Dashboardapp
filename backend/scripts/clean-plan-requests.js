import prisma from "../src/prisma.js";

async function cleanProcessedRequests() {
  console.log("Iniciando limpieza de PlanRequests procesadas...");
  try {
    const result = await prisma.planRequest.deleteMany({
      where: {
        status: {
          in: ["APPROVED", "REJECTED"]
        }
      }
    });
    console.log(`✅ Limpieza completada. Se eliminaron ${result.count} solicitudes que ya no estaban pendientes.`);
  } catch (error) {
    console.error("❌ Error al limpiar las solicitudes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanProcessedRequests();
