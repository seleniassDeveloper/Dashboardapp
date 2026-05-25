import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const deleted = await prisma.dashboardWidget.deleteMany({});
    console.log(`Eliminados ${deleted.count} widgets anteriores para permitir que los nuevos gráficos por defecto se carguen en el dashboard.`);
  } catch (error) {
    console.error("Error al resetear los widgets:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
