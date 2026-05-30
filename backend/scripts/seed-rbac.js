import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Agenda / Calendario
  { action: "agenda.view", description: "Ver la agenda de citas y disponibilidad" },
  { action: "agenda.create", description: "Crear nuevas citas en la agenda" },
  { action: "agenda.edit", description: "Modificar citas existentes" },
  { action: "agenda.cancel", description: "Cancelar citas agendadas" },
  { action: "agenda.reassign", description: "Reasignar citas a otros profesionales" },

  // Clientes
  { action: "clients.view", description: "Visualizar el listado y fichas de clientes" },
  { action: "clients.edit", description: "Crear y editar información de clientes" },
  { action: "clients.delete", description: "Eliminar fichas de clientes de forma permanente" },
  { action: "clients.privateNotes.view", description: "Ver notas clínicas o privadas de los clientes" },
  { action: "clients.financialHistory.view", description: "Ver historial de facturación de cada cliente" },

  // Finanzas / Caja
  { action: "finance.view", description: "Ver módulos financieros, comisiones y cierres de caja" },
  { action: "finance.export", description: "Exportar reportes de contabilidad y finanzas" },
  { action: "finance.expenses.edit", description: "Registrar y modificar gastos operativos" },

  // Inventario / ERP
  { action: "inventory.view", description: "Ver listado de productos, proveedores y stock" },
  { action: "inventory.edit", description: "Crear productos, lotes e ingresar movimientos de stock" },
  { action: "inventory.purchase.approve", description: "Aprobar órdenes de compra y facturas de proveedores" },

  // Workflows / Constructor
  { action: "workflows.view", description: "Ver el constructor y simulador de automatizaciones" },
  { action: "workflows.create", description: "Crear nuevos flujos de trabajo" },
  { action: "workflows.edit", description: "Modificar nodos, condiciones y simular flujos" },
  { action: "workflows.run", description: "Ejecutar y ver logs de ejecuciones de workflows" },

  // Automatizaciones Internas / WhatsApp / Email
  { action: "automations.view", description: "Ver integraciones de WhatsApp y plantillas de correo" },
  { action: "automations.edit", description: "Configurar automatizaciones internas de marketing y recordatorios" },
  { action: "automations.run", description: "Desencadenar envío de recordatorios masivos" },

  // Ajustes de Negocio
  { action: "settings.view", description: "Visualizar la configuración general del negocio" },
  { action: "settings.edit", description: "Modificar preferencias críticas, branding y onboarding" },

  // Usuarios del Negocio
  { action: "users.invite", description: "Invitar nuevos colaboradores por correo al negocio" },
  { action: "users.manage", description: "Administrar roles, suspender o remover miembros del negocio" },

  // Reportes y Analíticas
  { action: "reports.view", description: "Ver dashboard principal de KPIs y Smart Reports de IA" },
  { action: "reports.export", description: "Descargar reportes analíticos de datos del salón" }
];

const ROLES = [
  {
    key: "admin",
    name: "Admin / Dueño",
    description: "Acceso total y sin restricciones a todos los módulos y configuraciones del sistema.",
    permissions: PERMISSIONS.map(p => p.action) // Todos los permisos
  },
  {
    key: "manager",
    name: "Manager / Encargado",
    description: "Operación completa del negocio, gestión de stock, caja y agendas. Sin configuración de sistema crítica.",
    permissions: [
      "agenda.view", "agenda.create", "agenda.edit", "agenda.cancel", "agenda.reassign",
      "clients.view", "clients.edit", "clients.privateNotes.view", "clients.financialHistory.view",
      "finance.view", "finance.expenses.edit",
      "inventory.view", "inventory.edit", "inventory.purchase.approve",
      "workflows.view", "automations.view", "automations.edit",
      "settings.view", "reports.view", "reports.export"
    ]
  },
  {
    key: "professional",
    name: "Profesional / Staff",
    description: "Visualización restringida a su propia agenda, fichas de sus clientes y notas de tratamientos.",
    permissions: [
      "agenda.view", "agenda.create", "agenda.edit",
      "clients.view", "clients.privateNotes.view"
    ]
  },
  {
    key: "reception",
    name: "Recepción",
    description: "Gestión operativa del front-desk, agendamientos, clientes y lista de espera.",
    permissions: [
      "agenda.view", "agenda.create", "agenda.edit", "agenda.cancel", "agenda.reassign",
      "clients.view", "clients.edit",
      "inventory.view", "reports.view"
    ]
  },
  {
    key: "finance",
    name: "Finanzas / Contador",
    description: "Acceso restringido a reportes de facturación, egresos, caja y exportaciones contables.",
    permissions: [
      "clients.financialHistory.view",
      "finance.view", "finance.export", "finance.expenses.edit",
      "reports.view", "reports.export"
    ]
  },
  {
    key: "viewer",
    name: "Viewer / Solo lectura",
    description: "Acceso de solo lectura para supervisar agendas y listas básicas sin poder alterar nada.",
    permissions: [
      "agenda.view", "clients.view", "inventory.view", "settings.view", "reports.view"
    ]
  }
];

async function main() {
  console.log("Iniciando Seed de Roles y Permisos RBAC...");

  try {
    // 1. Insertar todos los permisos
    console.log("Guardando permisos...");
    const dbPermissions = [];
    for (const p of PERMISSIONS) {
      const dbP = await prisma.permission.upsert({
        where: { action: p.action },
        update: { description: p.description },
        create: { action: p.action, description: p.description }
      });
      dbPermissions.push(dbP);
    }
    console.log(`¡${dbPermissions.length} permisos inicializados!`);

    // 2. Insertar roles y sus asignaciones
    console.log("Guardando roles y configurando accesos...");
    for (const r of ROLES) {
      const dbRole = await prisma.role.upsert({
        where: { key: r.key },
        update: { name: r.name, description: r.description, isSystem: true },
        create: { key: r.key, name: r.name, description: r.description, isSystem: true }
      });

      // Limpiar relaciones anteriores de permisos para este rol
      await prisma.rolePermission.deleteMany({
        where: { roleId: dbRole.id }
      });

      // Crear las nuevas relaciones RolePermission
      const permissionsToAssign = dbPermissions.filter(p => r.permissions.includes(p.action));
      
      for (const p of permissionsToAssign) {
        await prisma.rolePermission.create({
          data: {
            roleId: dbRole.id,
            permissionId: p.id
          }
        });
      }
      console.log(`Rol "${r.name}" configurado con ${permissionsToAssign.length} permisos.`);
    }

    console.log("¡Seed RBAC completado de forma limpia y exitosa!");
  } catch (error) {
    console.error("Error durante la ejecución del seed RBAC:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
