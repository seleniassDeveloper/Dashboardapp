const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'seleniadeveloper@gmail.com' },
    include: { memberships: true }
  });

  if (!user || user.memberships.length === 0) {
    console.log("User not found or has no business memberships");
    return;
  }

  const businessId = user.memberships[0].businessId;
  console.log("Business ID:", businessId);

  // Fetch workflows to delete executions
  const workflows = await prisma.workflow.findMany({ where: { businessId } });
  const workflowIds = workflows.map(w => w.id);

  if (workflowIds.length > 0) {
    const executions = await prisma.workflowExecution.findMany({ where: { workflowId: { in: workflowIds } } });
    const executionIds = executions.map(e => e.id);
    
    if (executionIds.length > 0) {
      await prisma.workflowLog.deleteMany({ where: { executionId: { in: executionIds } } });
      await prisma.workflowExecution.deleteMany({ where: { id: { in: executionIds } } });
    }
    await prisma.workflow.deleteMany({ where: { businessId } });
  }

  // Fetch appointments to delete related records
  const appointments = await prisma.appointment.findMany({ where: { businessId } });
  const appointmentIds = appointments.map(a => a.id);
  
  if (appointmentIds.length > 0) {
    await prisma.clinicalHistory.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.clinicalNote.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.appointmentPhoto.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.appointmentStatusHistory.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.consentRequest.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    await prisma.serviceSla.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
  }

  await prisma.dataImportHistory.deleteMany({ where: { businessId } });
  await prisma.appointment.deleteMany({ where: { businessId } });
  await prisma.client.deleteMany({ where: { businessId } });
  
  await prisma.workerService.deleteMany({ where: { worker: { businessId } } });
  await prisma.workerSchedule.deleteMany({ where: { worker: { businessId } } });
  await prisma.worker.deleteMany({ where: { businessId } });
  
  await prisma.serviceProfessionalEstimate.deleteMany({ where: { service: { businessId } } });
  await prisma.serviceSlaConfig.deleteMany({ where: { businessId } });
  await prisma.service.deleteMany({ where: { businessId } });
  
  await prisma.expense.deleteMany({ where: { businessId } });
  await prisma.marketingPost.deleteMany({ where: { businessId } });
  
  console.log("Data deleted successfully for business:", businessId);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
