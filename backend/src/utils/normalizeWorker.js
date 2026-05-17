export function normalizeWorker(w) {
  const services = (w.services || []).map((ws) => ({
    serviceId: String(ws.serviceId),
    customPrice: ws.customPrice ?? null,
    service: ws.service
      ? {
          id: ws.service.id,
          name: ws.service.name,
          price: ws.service.price,
          duration: ws.service.duration,
        }
      : null,
  }));

  return {
    id: w.id,
    firstName: w.firstName,
    lastName: w.lastName,
    email: w.email || "",
    phone: w.phone || "",
    roleTitle: w.roleTitle || "",
    customFields: w.customFields || {},
    serviceIds: services.map((s) => s.serviceId),
    servicePricing: services.reduce((acc, s) => {
      if (s.customPrice != null) acc[s.serviceId] = s.customPrice;
      return acc;
    }, {}),
    services,
    schedules: w.schedules || [],
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

export async function saveWorkerRelations(prisma, workerId, { serviceIds, schedules, servicePricing = {} }) {
  await prisma.workerService.deleteMany({ where: { workerId } });
  await prisma.workerSchedule.deleteMany({ where: { workerId } });

  if (serviceIds?.length) {
    await prisma.workerService.createMany({
      data: serviceIds.map((serviceId) => ({
        workerId,
        serviceId: String(serviceId),
        customPrice:
          servicePricing[String(serviceId)] != null && servicePricing[String(serviceId)] !== ""
            ? Number(servicePricing[String(serviceId)])
            : null,
      })),
      skipDuplicates: true,
    });
  }

  if (schedules?.length) {
    await prisma.workerSchedule.createMany({
      data: schedules.map((s) => ({
        workerId,
        dayOfWeek: Number(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    });
  }
}
