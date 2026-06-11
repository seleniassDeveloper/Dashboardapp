import prisma from "../prisma.js";
import { recordStatusTransition } from "../services/workflowEngine.js";

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DE SLA DE EJECUCIÓN ===");

  // 1. Obtener o crear registros básicos para pruebas
  let business = await prisma.business.findFirst();
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: "Test Business",
        slug: "test-business",
      }
    });
  }
  const businessId = business.id;

  let client = await prisma.client.findFirst({ where: { businessId } });
  if (!client) {
    client = await prisma.client.create({
      data: {
        firstName: "María",
        lastName: "García",
        businessId
      }
    });
  }

  let worker = await prisma.worker.findFirst({ where: { businessId } });
  if (!worker) {
    worker = await prisma.worker.create({
      data: {
        firstName: "Lucas",
        lastName: "Pérez",
        businessId
      }
    });
  }

  // Crear un servicio con duración estimada de 20 minutos (1200 segundos)
  const service = await prisma.service.create({
    data: {
      name: `Servicio Test SLA ${Date.now()}`,
      price: 1500,
      duration: 20, // 20 mins
      estimatedDurationSec: 1200, // 1200 secs
      businessId
    }
  });

  // Configurar SLA para este servicio: inicio = CONFIRMED, fin = DONE, tolerancia = 10%
  // Límite duro = 30 minutos (1800 segundos)
  const slaConfig = await prisma.serviceSlaConfig.create({
    data: {
      businessId,
      serviceId: service.id,
      toleranceType: "percent",
      toleranceValue: 10.0,
      hardLimitSec: 1800, // 30 min
      startStatusKey: "CONFIRMED",
      endStatusKey: "DONE"
    }
  });

  console.log(`[Test] Registros creados. Servicio: ${service.name}. Config de SLA ID: ${slaConfig.id}`);

  // Helper para simular escenarios de tiempo
  async function testScenario(name, activeSeconds, expectedStatus, expectedWithinLimit) {
    console.log(`\n--- Escenario: ${name} (Segundos activos: ${activeSeconds}) ---`);

    // Crear cita
    const appointment = await prisma.appointment.create({
      data: {
        startsAt: new Date(),
        status: "PENDING",
        clientId: client.id,
        workerId: worker.id,
        serviceId: service.id,
        businessId
      }
    });

    // 1. Mover a CONFIRMED (iniciar SLA)
    await recordStatusTransition(businessId, appointment.id, "PENDING", "CONFIRMED");

    // Encontrar la transición inicial y backdatearla
    const startHistory = await prisma.appointmentStatusHistory.findFirst({
      where: { appointmentId: appointment.id, statusTo: "CONFIRMED" }
    });

    // Para simular que estuvo activo por `activeSeconds`,
    // backdateamos el inicio `activeSeconds` al pasado.
    const pastStart = new Date(Date.now() - (activeSeconds * 1000));
    await prisma.appointmentStatusHistory.update({
      where: { id: startHistory.id },
      data: { transitionedAt: pastStart }
    });

    // 2. Finalizar moviendo a DONE (consolidar SLA)
    await recordStatusTransition(businessId, appointment.id, "CONFIRMED", "DONE");

    // Para simular la duración del estado CONFIRMED, actualizamos el campo durationSeconds
    // del registro de transición que va de CONFIRMED a DONE.
    const endHistory = await prisma.appointmentStatusHistory.findFirst({
      where: { appointmentId: appointment.id, statusFrom: "CONFIRMED" }
    });
    
    await prisma.appointmentStatusHistory.update({
      where: { id: endHistory.id },
      data: { durationSeconds: activeSeconds }
    });

    // Forzar recalculo de SLA con los datos actualizados
    // (Para las pruebas llamamos al handler directamente para consolidar con los datos modificados)
    const { handleSlaTransition } = await import("../services/serviceSla.js");
    await handleSlaTransition(businessId, appointment.id, "CONFIRMED", "DONE");

    // Verificar resultado
    const finalSla = await prisma.serviceSla.findUnique({
      where: { appointmentId: appointment.id }
    });

    console.log("Resultado SLA Consolidado:");
    console.log(`- Estimado: ${finalSla.estimatedSec}s`);
    console.log(`- Real: ${finalSla.actualSec}s`);
    console.log(`- Variación: ${finalSla.varianceSec}s (${(finalSla.variancePct * 100).toFixed(1)}%)`);
    console.log(`- Estado Clasificado: ${finalSla.status} (Esperado: ${expectedStatus})`);
    console.log(`- Dentro del Límite: ${finalSla.withinLimit} (Esperado: ${expectedWithinLimit})`);
    console.log(`- Exceso (Overage): ${finalSla.overageSec}s`);

    if (finalSla.status !== expectedStatus) {
      throw new Error(`Fallo en el escenario "${name}". Se esperaba estado "${expectedStatus}" pero se obtuvo "${finalSla.status}"`);
    }

    if (finalSla.withinLimit !== expectedWithinLimit) {
      throw new Error(`Fallo en el escenario "${name}". Se esperaba withinLimit "${expectedWithinLimit}" pero se obtuvo "${finalSla.withinLimit}"`);
    }

    console.log(`✅ Escenario "${name}" superado con éxito.`);
  }

  try {
    // Escenario 1: Terminó Antes (15 mins = 900s)
    // Tolerancia 10% de 20 mins es 2 mins. Banda inferior = 18 mins (1080s).
    // 900s < 1080s -> debe ser "antes"
    await testScenario("Finaliza Antes", 900, "antes", true);

    // Escenario 2: A Tiempo (19 mins = 1140s)
    // 1080s <= 1140s <= 1320s -> debe ser "a_tiempo"
    await testScenario("A Tiempo", 1140, "a_tiempo", true);

    // Escenario 3: Excedido (25 mins = 1500s)
    // 1500s > 1320s -> debe ser "excedido", dentro del límite duro (1800s)
    await testScenario("Excedido Dentro de Límite", 1500, "excedido", true);

    // Escenario 4: Excedido Límite Duro (35 mins = 2100s)
    // 2100s > 1800s -> debe ser "excedido", withinLimit = false, overageSec = 300s
    await testScenario("Supera Límite Duro", 2100, "excedido", false);

    console.log("\n==============================================");
    console.log("🎉 ¡TODAS LAS PRUEBAS DE SLA SE COMPLETARON CON ÉXITO! 🎉");
    console.log("==============================================");
  } catch (error) {
    console.error("\n❌ ERROR EN LAS PRUEBAS DE SLA:", error);
    process.exit(1);
  }
}

runTests();
