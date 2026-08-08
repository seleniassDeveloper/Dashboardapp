import "dotenv/config";
import prisma from "../src/prisma.js";

/**
 * Script de auditoria de cuentas activas sin pago (Solo Lectura).
 * NO ejecuta operaciones de modificación/escritura (create/update/delete).
 * Lee la URL de la base de datos de process.env.DATABASE_URL.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL no esta configurada en el entorno.");
    process.exit(1);
  }

  console.log("\n========================================================");
  console.log("  AUDITORIA DE CUENTAS EN ESTADO 'ACTIVE' Y SUS PAGOS  ");
  console.log("========================================================\n");

  const results = await prisma.$queryRaw`
    SELECT b.id, b.name, b.plan, b."subscriptionStatus", b."enabledModules",
           b."currentPeriodEnd", b."createdAt",
           (SELECT COUNT(*)::int FROM "Subscription" s WHERE s."businessId" = b.id) AS tiene_suscripcion,
           (SELECT COUNT(*)::int FROM "Payment" p
              JOIN "Subscription" s2 ON p."subscriptionId" = s2.id
            WHERE s2."businessId" = b.id AND p.status = 'approved') AS pagos_aprobados
    FROM "Business" b
    WHERE b."subscriptionStatus" = 'active'
    ORDER BY b."createdAt" DESC;
  `;

  const sospechosos = results.filter(
    (row) => Number(row.tiene_suscripcion) === 0 && Number(row.pagos_aprobados) === 0
  );

  const formattedTable = results.map((row) => ({
    "ID Negocio": row.id,
    "Nombre": row.name,
    "Plan": row.plan,
    "Estado": row.subscriptionStatus,
    "Tiene Sub": Number(row.tiene_suscripcion) > 0 ? "SI" : "NO",
    "Pagos Aprobados": row.pagos_aprobados,
    "ACTIVADO SIN PAGO": Number(row.tiene_suscripcion) === 0 && Number(row.pagos_aprobados) === 0 ? "⚠️ SÍ" : "OK",
    "Fecha Creación": row.createdAt ? new Date(row.createdAt).toISOString().split("T")[0] : "N/A"
  }));

  console.table(formattedTable);

  console.log("\n--------------------------------------------------------");
  console.log(`Total de negocios con subscriptionStatus = 'active': ${results.length}`);
  console.log(`Cuentas activadas SIN suscripción ni pago (posibles vulnerados): ${sospechosos.length}`);
  console.log("--------------------------------------------------------\n");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error ejecutando auditoria:", e);
  await prisma.$disconnect();
  process.exit(1);
});
