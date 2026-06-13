import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Dashboard
  { key: "dashboard_view", module: "dashboard", action: "dashboard.view", description: "Ver el panel de control principal" },
  { key: "dashboard_widgets_create", module: "dashboard", action: "dashboard.widgets.create", description: "Crear nuevos widgets en el panel" },
  { key: "dashboard_widgets_edit", module: "dashboard", action: "dashboard.widgets.edit", description: "Editar configuración de widgets" },
  { key: "dashboard_widgets_delete", module: "dashboard", action: "dashboard.widgets.delete", description: "Eliminar widgets del panel" },

  // Agenda (Appointments)
  { key: "appointments_view_all", module: "agenda", action: "appointments.view.all", description: "Ver la agenda de todos los colaboradores" },
  { key: "appointments_view_own", module: "agenda", action: "appointments.view.own", description: "Ver únicamente la agenda propia" },
  { key: "appointments_create", module: "agenda", action: "appointments.create", description: "Crear nuevas citas en la agenda" },
  { key: "appointments_edit", module: "agenda", action: "appointments.edit", description: "Modificar citas existentes" },
  { key: "appointments_cancel", module: "agenda", action: "appointments.cancel", description: "Cancelar citas" },
  { key: "appointments_reassign", module: "agenda", action: "appointments.reassign", description: "Reasignar citas a otros miembros del equipo" },
  { key: "appointments_changeStatus", module: "agenda", action: "appointments.changeStatus", description: "Cambiar el estado de las citas" },

  // Clientes
  { key: "clients_view_all", module: "clientes", action: "clients.view.all", description: "Ver listado completo de todos los clientes" },
  { key: "clients_view_assigned", module: "clientes", action: "clients.view.assigned", description: "Ver clientes asignados a su propia agenda" },
  { key: "clients_create", module: "clientes", action: "clients.create", description: "Registrar nuevos clientes en el sistema" },
  { key: "clients_edit", module: "clientes", action: "clients.edit", description: "Modificar datos de clientes existentes" },
  { key: "clients_delete", module: "clientes", action: "clients.delete", description: "Eliminar clientes del sistema" },
  { key: "clients_profile_view", module: "clientes", action: "clients.profile.view", description: "Ver perfil completo y ficha técnica del cliente" },
  { key: "clients_privateNotes_view", module: "clientes", action: "clients.privateNotes.view", description: "Visualizar notas clínicas y privadas" },
  { key: "clients_privateNotes_edit", module: "clientes", action: "clients.privateNotes.edit", description: "Crear y editar notas clínicas del cliente" },
  { key: "clients_financialHistory_view", module: "clientes", action: "clients.financialHistory.view", description: "Ver historial financiero y compras del cliente" },

  // Servicios
  { key: "services_view", module: "servicios", action: "services.view", description: "Ver catálogo de servicios y tarifas" },
  { key: "services_create", module: "servicios", action: "services.create", description: "Crear nuevos servicios en el catálogo" },
  { key: "services_edit", module: "servicios", action: "services.edit", description: "Modificar precios y configuraciones de servicios" },
  { key: "services_delete", module: "servicios", action: "services.delete", description: "Eliminar servicios del catálogo" },

  // Equipo
  { key: "team_view", module: "equipo", action: "team.view", description: "Ver lista del equipo y horarios del personal" },
  { key: "team_create", module: "equipo", action: "team.create", description: "Agregar nuevos profesionales al equipo" },
  { key: "team_edit", module: "equipo", action: "team.edit", description: "Modificar fichas, turnos y perfiles del personal" },
  { key: "team_delete", module: "equipo", action: "team.delete", description: "Eliminar personal del equipo" },
  { key: "team_commissions_view", module: "equipo", action: "team.commissions.view", description: "Ver tasas de comisiones asignadas al equipo" },

  // Finanzas
  { key: "finance_view", module: "finanzas", action: "finance.view", description: "Ver panel general de finanzas y facturación" },
  { key: "finance_revenue_view", module: "finanzas", action: "finance.revenue.view", description: "Ver estadísticas de ingresos totales" },
  { key: "finance_profit_view", module: "finanzas", action: "finance.profit.view", description: "Ver cálculo de rentabilidad del negocio" },
  { key: "finance_expenses_view", module: "finanzas", action: "finance.expenses.view", description: "Ver lista de gastos y egresos" },
  { key: "finance_expenses_create", module: "finanzas", action: "finance.expenses.create", description: "Registrar nuevos egresos o compras" },
  { key: "finance_expenses_edit", module: "finanzas", action: "finance.expenses.edit", description: "Modificar egresos registrados" },
  { key: "finance_expenses_delete", module: "finanzas", action: "finance.expenses.delete", description: "Eliminar egresos registrados" },
  { key: "finance_commissions_view", module: "finanzas", action: "finance.commissions.view", description: "Ver comisiones acumuladas y liquidación de staff" },
  { key: "finance_cashClosing_manage", module: "finanzas", action: "finance.cashClosing.manage", description: "Realizar y gestionar cierres y aperturas de caja" },
  { key: "finance_export", module: "finanzas", action: "finance.export", description: "Exportar reportes contables e históricos" },

  // Inventario
  { key: "inventory_view", module: "inventario", action: "inventory.view", description: "Ver catálogo de stock y productos" },
  { key: "inventory_create", module: "inventario", action: "inventory.create", description: "Crear nuevos productos en stock" },
  { key: "inventory_edit", module: "inventario", action: "inventory.edit", description: "Modificar cantidades y stock mínimo/máximo" },
  { key: "inventory_delete", module: "inventario", action: "inventory.delete", description: "Eliminar productos del inventario" },
  { key: "inventory_purchase_approve", module: "inventario", action: "inventory.purchase.approve", description: "Generar y aprobar órdenes de compra" },
  { key: "inventory_movements_view", module: "inventario", action: "inventory.movements.view", description: "Ver historial de movimientos de inventario" },

  // Sheets
  { key: "sheets_view", module: "planillas", action: "sheets.view", description: "Ver integraciones de planillas importadas" },
  { key: "sheets_import", module: "planillas", action: "sheets.import", description: "Importar nuevas planillas externas" },
  { key: "sheets_sync", module: "planillas", action: "sheets.sync", description: "Sincronizar datos con Google Sheets" },
  { key: "sheets_export", module: "planillas", action: "sheets.export", description: "Exportar reportes de negocio a planillas" },

  // Workflows
  { key: "workflows_view", module: "workflows", action: "workflows.view", description: "Ver listado y diseñador de workflows" },
  { key: "workflows_create", module: "workflows", action: "workflows.create", description: "Crear nuevos flujos y campañas visuales" },
  { key: "workflows_edit", module: "workflows", action: "workflows.edit", description: "Editar condiciones, nodos y disparadores" },
  { key: "workflows_delete", module: "workflows", action: "workflows.delete", description: "Eliminar workflows automáticos" },
  { key: "workflows_run", module: "workflows", action: "workflows.run", description: "Ejecutar manualmente y probar workflows" },
  { key: "workflows_logs_view", module: "workflows", action: "workflows.logs.view", description: "Ver historial de ejecuciones y logs" },

  // Automatizaciones
  { key: "automations_view", module: "automatizaciones", action: "automations.view", description: "Ver módulo de envíos masivos y recordatorios" },
  { key: "automations_edit", module: "automatizaciones", action: "automations.edit", description: "Editar plantillas de WhatsApp, Email y reglas de aviso" },
  { key: "automations_run", module: "automatizaciones", action: "automations.run", description: "Ejecutar disparadores masivos" },
  { key: "automations_integrations_manage", module: "automatizaciones", action: "automations.integrations.manage", description: "Configurar llaves de API e integraciones externas" },

  // Configuración
  { key: "settings_view", module: "configuración", action: "settings.view", description: "Ver pantalla de configuración general" },
  { key: "settings_edit", module: "configuración", action: "settings.edit", description: "Editar campos personalizados del salón" },
  { key: "branding_edit", module: "configuración", action: "branding.edit", description: "Modificar logotipo, colores e identidad de marca" },
  { key: "business_edit", module: "configuración", action: "business.edit", description: "Editar datos comerciales, horarios y dirección de la empresa" },

  // Usuarios (Colaboradores)
  { key: "members_view", module: "usuarios", action: "members.view", description: "Ver lista de miembros y colaboradores de la empresa" },
  { key: "members_invite", module: "usuarios", action: "members.invite", description: "Invitar nuevos colaboradores por correo" },
  { key: "members_edit", module: "usuarios", action: "members.edit", description: "Modificar roles y suspender colaboradores" },
  { key: "members_remove", module: "usuarios", action: "members.remove", description: "Eliminar colaborador de la empresa" },
  { key: "roles_view", module: "usuarios", action: "roles.view", description: "Ver la sección de roles del sistema" },
  { key: "roles_create", module: "usuarios", action: "roles.create", description: "Crear nuevos roles de acceso personalizados" },
  { key: "roles_edit", module: "usuarios", action: "roles.edit", description: "Editar configuraciones y descripciones de roles" },
  { key: "roles_delete", module: "usuarios", action: "roles.delete", description: "Eliminar roles personalizados sin usuarios asignados" },
  { key: "permissions_view", module: "usuarios", action: "permissions.view", description: "Visualizar matriz completa de permisos" },
  { key: "permissions_edit", module: "usuarios", action: "permissions.edit", description: "Modificar casillas de permisos asignados en la matriz" },

  // Auditoría
  { key: "audit_view", module: "auditoría", action: "audit.view", description: "Visualizar bitácora completa de eventos críticos del negocio" },

  // Marketing e Instagram
  { key: "marketing_view", module: "marketing", action: "marketing.view", description: "Ver panel de control de marketing y posts" },
  { key: "marketing_edit", module: "marketing", action: "marketing.edit", description: "Crear, editar, borrar y programar publicaciones de Instagram" }
];

const ROLES = [
  {
    key: "owner",
    name: "Owner / Dueño",
    description: "Propietario del negocio. Posee acceso total e irrestricto a todos los módulos y opciones de facturación.",
    permissions: PERMISSIONS.map(p => p.action) // Todos los permisos
  },
  {
    key: "admin",
    name: "Admin / Administrador",
    description: "Administrador general. Capacidad completa de gestión excepto alteración de datos comerciales críticos del negocio.",
    permissions: PERMISSIONS.filter(p => p.action !== "business.edit").map(p => p.action)
  },
  {
    key: "manager",
    name: "Manager / Encargado",
    description: "Responsable operativo. Gestión de agenda, clientes, servicios, staff e inventario básico.",
    permissions: [
      "dashboard.view",
      "appointments.view.all", "appointments.create", "appointments.edit", "appointments.cancel", "appointments.reassign", "appointments.changeStatus",
      "clients.view.all", "clients.create", "clients.edit", "clients.profile.view",
      "services.view", "services.create", "services.edit",
      "team.view", "team.create", "team.edit",
      "inventory.view", "inventory.create", "inventory.edit", "inventory.movements.view",
      "settings.view",
      "marketing.view", "marketing.edit"
    ]
  },
  {
    key: "professional",
    name: "Profesional / Estilista",
    description: "Estilista o terapeuta. Acceso exclusivo a su propia agenda, clientes agendados y notas clínicas.",
    permissions: [
      "dashboard.view",
      "appointments.view.own", "appointments.changeStatus",
      "clients.view.assigned", "clients.profile.view", "clients.privateNotes.view", "clients.privateNotes.edit"
    ]
  },
  {
    key: "reception",
    name: "Recepción / Front-desk",
    description: "Encargado de recepción. Creación, reasignación y cobro de citas, registro de clientes y catálogo de servicios.",
    permissions: [
      "dashboard.view",
      "appointments.view.all", "appointments.create", "appointments.edit", "appointments.cancel", "appointments.reassign", "appointments.changeStatus",
      "clients.view.all", "clients.create", "clients.edit", "clients.profile.view",
      "services.view",
      "inventory.view"
    ]
  },
  {
    key: "finance",
    name: "Finanzas / Contador",
    description: "Contador o auditor financiero. Acceso completo a ingresos, egresos, comisiones y cierres contables de caja.",
    permissions: [
      "dashboard.view",
      "finance.view", "finance.revenue.view", "finance.profit.view", "finance.expenses.view", "finance.expenses.create", "finance.expenses.edit", "finance.expenses.delete", "finance.commissions.view", "finance.cashClosing.manage", "finance.export",
      "audit.view"
    ]
  },
  {
    key: "viewer",
    name: "Viewer / Solo Lectura",
    description: "Acceso de solo lectura para supervisar agendas y listas básicas en módulos autorizados.",
    permissions: [
      "dashboard.view",
      "appointments.view.own"
    ]
  }
];

async function main() {
  console.log("Iniciando Seed de Roles y Permisos RBAC v3...");

  try {
    // 1. Guardar todos los permisos en la tabla Permission
    console.log("Guardando permisos granulares...");
    const dbPermissions = [];
    for (const p of PERMISSIONS) {
      const dbP = await prisma.permission.upsert({
        where: { action: p.action },
        update: { key: p.key, module: p.module, description: p.description },
        create: { action: p.action, key: p.key, module: p.module, description: p.description }
      });
      dbPermissions.push(dbP);
    }
    console.log(`¡${dbPermissions.length} permisos del sistema inicializados con éxito!`);

    // 2. Guardar roles del sistema y configurar sus relaciones con permisos
    console.log("Configurando roles del sistema...");
    for (const r of ROLES) {
      let dbRole = await prisma.role.findFirst({
        where: { key: r.key, businessId: null }
      });

      if (dbRole) {
        dbRole = await prisma.role.update({
          where: { id: dbRole.id },
          data: { name: r.name, description: r.description, isSystemRole: true, isActive: true }
        });
      } else {
        dbRole = await prisma.role.create({
          data: { key: r.key, name: r.name, description: r.description, isSystemRole: true, businessId: null, isActive: true }
        });
      }

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
      console.log(`Rol "${r.name}" configurado con ${permissionsToAssign.length} permisos asignados.`);
    }

    console.log("¡Seeding de RBAC v3 completado con éxito!");
  } catch (error) {
    console.error("Error durante la ejecución del seed RBAC v3:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
