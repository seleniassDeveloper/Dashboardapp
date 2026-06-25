import dotenv from "dotenv";
import { resolve } from "node:path";
dotenv.config({ path: resolve(process.cwd(), ".env") });

import prisma from "../src/prisma.js";
import crypto from "crypto";

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DE CRUD DE SUPERADMIN ===");

  const testSlug = `test-crud-slug-${Date.now()}`;
  const ownerEmail = `owner-crud-${Date.now()}@test.com`;

  // 1. Crear o buscar usuario para el test
  console.log("1. Buscando o creando usuario propietario...");
  let user = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: `usr-crud-test-${Date.now()}`,
        email: ownerEmail,
        name: "Propietario CRUD Test",
        status: "active"
      }
    });
  }
  console.log("✔ Usuario listo:", user.id, user.email);

  // Asegurar Rol Owner
  let ownerRole = await prisma.role.findFirst({
    where: { key: "owner", businessId: null }
  });
  if (!ownerRole) {
    ownerRole = await prisma.role.create({
      data: {
        key: "owner",
        name: "Owner / Dueño",
        description: "Acceso total del sistema.",
        isSystemRole: true
      }
    });
  }

  // 2. Crear negocio (Simulación de POST /admin/billing/businesses)
  console.log("\n2. Creando nuevo negocio (inquilino)...");
  const newBiz = await prisma.business.create({
    data: {
      name: "Negocio CRUD Test",
      slug: testSlug,
      plan: "pro",
      subscriptionStatus: "active",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      industry: "Estética",
      timezone: "America/Argentina/Buenos_Aires",
      ownerId: user.id
    }
  });
  console.log("✔ Negocio creado:", newBiz.id, newBiz.name, newBiz.slug);

  // Crear BusinessMember
  const member = await prisma.businessMember.create({
    data: {
      userId: user.id,
      businessId: newBiz.id,
      role: "owner",
      status: "ACTIVE",
      roleId: ownerRole.id
    }
  });
  console.log("✔ BusinessMember creado:", member.id);

  // Crear Suscripción
  const sub = await prisma.subscription.create({
    data: {
      businessId: newBiz.id,
      planCode: newBiz.plan,
      status: newBiz.subscriptionStatus,
      interval: "month",
      provider: "mercadopago",
      currentPeriodEnd: newBiz.currentPeriodEnd
    }
  });
  console.log("✔ Subscription creada:", sub.id);

  // Validar Slug Duplicado
  console.log("\n3. Validando restricción de slug único...");
  try {
    await prisma.business.create({
      data: {
        name: "Otro Negocio",
        slug: testSlug,
        plan: "starter"
      }
    });
    throw new Error("Fallo: Debería haber lanzado un error por slug duplicado.");
  } catch (err) {
    if (err.message.includes("Fallo:")) {
      throw err;
    }
    console.log("✔ Restricción de slug único validada correctamente.");
  }

  // 4. Crear solicitud de plan (Simulación de POST /admin/billing/requests)
  console.log("\n4. Creando solicitud de plan manually...");
  const newRequest = await prisma.planRequest.create({
    data: {
      businessId: newBiz.id,
      requestedPlan: "business",
      status: "PENDING",
      approvalToken: crypto.randomBytes(32).toString("hex")
    }
  });
  console.log("✔ Solicitud de plan creada:", newRequest.id, newRequest.requestedPlan, newRequest.status);

  // 5. Eliminar negocio y validar cascada (Simulación de DELETE /admin/billing/businesses/:id)
  console.log("\n5. Eliminando negocio y probando eliminación en cascada...");
  await prisma.business.delete({ where: { id: newBiz.id } });
  console.log("✔ Negocio eliminado de la base de datos.");

  // Comprobar cascada en Subscription
  const checkSub = await prisma.subscription.findUnique({ where: { businessId: newBiz.id } });
  if (checkSub) {
    throw new Error("Fallo: La suscripción no se eliminó en cascada.");
  }
  console.log("✔ Suscripción eliminada en cascada correctamente.");

  // Comprobar cascada en PlanRequest
  const checkRequest = await prisma.planRequest.findUnique({ where: { id: newRequest.id } }).catch(() => null);
  if (checkRequest) {
    throw new Error("Fallo: La solicitud de plan no se eliminó en cascada.");
  }
  console.log("✔ Solicitud de plan eliminada en cascada correctamente.");

  // Comprobar cascada en BusinessMember
  const checkMember = await prisma.businessMember.findUnique({
    where: { userId_businessId: { userId: user.id, businessId: newBiz.id } }
  });
  if (checkMember) {
    throw new Error("Fallo: La membresía no se eliminó en cascada.");
  }
  console.log("✔ Membresía eliminada en cascada correctamente.");

  // Limpieza de usuario test
  await prisma.user.delete({ where: { id: user.id } }).catch(() => null);

  console.log("\n==============================================");
  console.log("🎉 ¡TODAS LAS PRUEBAS DE CRUD DE SUPERADMIN PASARON CON ÉXITO! 🎉");
  console.log("==============================================");
}

runTests().catch((err) => {
  console.error("❌ ERROR EN LAS PRUEBAS:", err);
  process.exit(1);
});
