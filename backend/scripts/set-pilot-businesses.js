import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const slugs = process.argv.slice(2);

  if (slugs.length === 0) {
    console.error("Uso: node scripts/set-pilot-businesses.js <slug-negocio-1> <slug-negocio-2> ...");
    process.exit(1);
  }

  console.log(`Promoviendo a los siguientes negocios al estado PILOTO: ${slugs.join(", ")}`);

  for (const slug of slugs) {
    const biz = await prisma.business.findUnique({ where: { slug } });
    if (!biz) {
      console.warn(`[WARNING] Negocio con slug '${slug}' no encontrado. Saltando...`);
      continue;
    }

    // Configurar fechas de vencimiento en el año 2999
    const farFutureDate = new Date("2999-12-31T23:59:59.000Z");

    await prisma.business.update({
      where: { id: biz.id },
      data: {
        plan: "business",
        subscriptionStatus: "active",
        trialEndsAt: farFutureDate,
        gracePeriodEndsAt: farFutureDate,
      }
    });

    // Si tiene un registro de suscripción, actualizarlo también
    const sub = await prisma.subscription.findUnique({ where: { businessId: biz.id } });
    if (sub) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planCode: "business",
          status: "active",
          currentPeriodEnd: farFutureDate,
          cancelAtPeriodEnd: false
        }
      });
    }

    console.log(`[SUCCESS] Negocio '${biz.name}' (${slug}) actualizado exitosamente a PILOTO VITALICIO.`);
  }

  console.log("Proceso finalizado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
