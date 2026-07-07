export function getClientStatus(client, appointments) {
  const clientAppts = appointments.filter((a) => a.clientId === client.id);
  const doneAppts = clientAppts.filter(
    (a) => a.status === "DONE" || a.status === "CONFIRMED"
  );
  const upcomingAppts = clientAppts.filter(
    (a) => new Date(a.startsAt) > new Date() &&
      (a.status === "PENDING" || a.status === "CONFIRMED")
  );
  const totalSpent = doneAppts.reduce(
    (sum, a) => sum + Number(a.service?.price || 0), 0
  );

  let status = "NUEVO";
  let days = null;

  if (doneAppts.length > 0) {
    const latest = doneAppts.reduce((acc, a) => {
      const date = new Date(a.startsAt);
      return date > acc ? date : acc;
    }, new Date(0));
    days = Math.floor(Math.abs(new Date() - latest) / (1000 * 60 * 60 * 24));

    if (doneAppts.length >= 5 && totalSpent >= 50000) status = "VIP";
    else if (doneAppts.length >= 2 && doneAppts.length <= 4) status = "FRECUENTE";
    else if (days <= 30 || upcomingAppts.length > 0) status = "ACTIVO";
    else if (days > 60) status = "INACTIVO";
    else status = "ACTIVO";
  }

  return { status, days, visits: doneAppts.length, totalSpent };
}
