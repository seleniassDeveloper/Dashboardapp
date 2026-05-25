import React from "react";
import { AlertCircle, Clock, UserCheck, CalendarDays, ArrowRight } from "lucide-react";
import { Badge, Button } from "react-bootstrap";

export default function AttentionWidget({
  appointments = [],
  workers = [],
  onConfirmAppointment,
  onViewCalendar,
  onEditWorker,
}) {
  // 1. Citas PENDING
  const pendingAppointments = appointments.filter((a) => a.status === "PENDING");

  // 2. Colaboradores sin horarios (WorkerSchedule)
  // En base a workers, verificamos si tienen schedules vacíos
  const workersWithoutSchedule = workers.filter((w) => !w.schedules || w.schedules.length === 0);

  // 3. Citas de hoy a punto de empezar o atrasadas (ej: estado CONFIRMED y hora de inicio < ahora)
  const now = new Date();
  const needingFollowUp = appointments.filter((a) => {
    if (a.status !== "CONFIRMED") return false;
    const start = new Date(a.startsAt);
    // Citas que empezaron hace menos de 2 horas o empiezan en los próximos 30 minutos
    const diff = start.getTime() - now.getTime();
    return diff > -7200000 && diff < 1800000;
  });

  const alerts = [];

  // Agregar alertas reales
  pendingAppointments.forEach((a) => {
    alerts.push({
      id: `pending-${a.id}`,
      type: "pending_appt",
      title: `Cita pendiente de ${a.client?.firstName} ${a.client?.lastName || ""}`,
      subtitle: `${a.service?.name} · ${new Date(a.startsAt).toLocaleDateString()} a las ${new Date(a.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} hs`,
      icon: Clock,
      badgeText: "Pendiente",
      badgeBg: "warning",
      actionText: "Confirmar",
      onClick: () => onConfirmAppointment?.(a.id),
    });
  });

  workersWithoutSchedule.forEach((w) => {
    alerts.push({
      id: `worker-schedule-${w.id}`,
      type: "worker_schedule",
      title: `Profesional sin horario activo: ${w.firstName} ${w.lastName}`,
      subtitle: "Configurá su jornada laboral para habilitar reservas online.",
      icon: AlertCircle,
      badgeText: "Sin horario",
      badgeBg: "danger",
      actionText: "Editar",
      onClick: () => onEditWorker?.(w.id),
    });
  });

  needingFollowUp.forEach((a) => {
    alerts.push({
      id: `followup-${a.id}`,
      type: "followup",
      title: `Turno próximo/en curso: ${a.client?.firstName}`,
      subtitle: `Con ${a.worker?.firstName} · ${a.service?.name}`,
      icon: UserCheck,
      badgeText: "Operativo",
      badgeBg: "info",
      actionText: "Ver Agenda",
      onClick: () => onViewCalendar?.(),
    });
  });

  // Si no hay alertas reales, agregamos unas simuladas de negocio recomendadas
  if (alerts.length === 0) {
    alerts.push(
      {
        id: "simulated-1",
        type: "tip",
        title: "Optimización de horarios",
        subtitle: "Sábado en la tarde registra 95% de ocupación. Considerá agregar bloqueos de descanso.",
        icon: CalendarDays,
        badgeText: "Tip de IA",
        badgeBg: "success",
        actionText: "Ver Horarios",
        onClick: () => onViewCalendar?.(),
      }
    );
  }

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex flex-column gap-2.5 overflow-auto flex-grow-1" style={{ maxHeight: "380px" }}>
        {alerts.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between hover-scale transition-all"
              style={{ background: "#f9fafb" }}
            >
              <div className="d-flex gap-3 align-items-start">
                <div className="p-2 rounded-circle bg-white text-muted border shadow-sm mt-0.5 d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                  <IconComp size={15} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span className="fw-bold text-dark small">{item.title}</span>
                    <Badge bg={item.badgeBg} className="opacity-75" style={{ fontSize: "10px" }}>
                      {item.badgeText}
                    </Badge>
                  </div>
                  <div className="text-muted small" style={{ fontSize: "11px" }}>{item.subtitle}</div>
                </div>
              </div>

              <Button
                variant="outline-dark"
                size="sm"
                onClick={item.onClick}
                className="rounded-pill px-3 py-1 font-semibold small d-flex align-items-center gap-1"
                style={{ fontSize: "11px", borderColor: "#e5e7eb" }}
              >
                <span>{item.actionText}</span>
                <ArrowRight size={12} />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
