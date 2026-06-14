import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Activando a todos los usuarios existentes...");
    const result = await prisma.user.updateMany({
      where: {
        status: "pending" // Ya que Prisma acaba de poner "pending" por defecto a todos al hacer push
      },
      data: {
        status: "active"
      }
    });
    console.log(`¡Éxito! Se actualizaron ${result.count} usuarios a estado 'active'.`);
  } catch (err) {
    console.error("Error al actualizar usuarios:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
