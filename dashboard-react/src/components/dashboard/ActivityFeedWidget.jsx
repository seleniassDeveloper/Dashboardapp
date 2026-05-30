import React from "react";
import { UserPlus, CalendarRange, CheckCircle2, XCircle, CreditCard, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ActivityFeedWidget({ appointments = [], clients = [] }) {
  const { i18n } = useTranslation("dashboard");
  const isEs = i18n.language === "es";

  // Combinar eventos y ordenar cronológicamente
  const events = [];

  // Formato de hora amigable
  const getRelativeTime = (date) => {
    const diffMs = new Date().getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isEs ? "Hace unos instantes" : "Just now";
    if (diffMins < 60) return isEs ? `Hace ${diffMins} min` : `${diffMins} min ago`;
    if (diffHours < 24) return isEs ? `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}` : `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    return isEs ? `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}` : `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  };

  // Citas creadas u ordenadas
  appointments.forEach((a) => {
    // Evento de creación (simulado en base a createdAt o startsAt de manera determinista)
    const time = a.createdAt ? new Date(a.createdAt) : new Date(new Date(a.startsAt).getTime() - 24 * 3600000);
    
    events.push({
      id: `appt-create-${a.id}`,
      time,
      type: "appointment",
      title: isEs ? "Nueva cita programada" : "New appointment scheduled",
      description: isEs 
        ? `Cliente: ${a.client?.firstName} ${a.client?.lastName || ""} con ${a.worker?.firstName || "Profesional"} (${a.service?.name || "Servicio"})`
        : `Client: ${a.client?.firstName} ${a.client?.lastName || ""} with ${a.worker?.firstName || "Professional"} (${a.service?.name || "Service"})`,
      icon: CalendarRange,
      color: "#3b82f6",
    });

    if (a.status === "DONE") {
      events.push({
        id: `appt-done-${a.id}`,
        time: new Date(a.startsAt), // terminó en la hora de la cita
        type: "status",
        title: isEs ? "Cita finalizada con éxito" : "Appointment completed successfully",
        description: isEs 
          ? `Se completó el servicio de ${a.service?.name} para ${a.client?.firstName}.`
          : `Completed service of ${a.service?.name} for ${a.client?.firstName}.`,
        icon: CheckCircle2,
        color: "#10b981",
      });
    }

    if (a.status === "CANCELLED") {
      events.push({
        id: `appt-cancel-${a.id}`,
        time: new Date(a.startsAt),
        type: "status",
        title: isEs ? "Cita cancelada" : "Appointment cancelled",
        description: isEs 
          ? `El turno de ${a.client?.firstName} para ${a.service?.name} fue cancelado.`
          : `Appointment of ${a.client?.firstName} for ${a.service?.name} was cancelled.`,
        icon: XCircle,
        color: "#ef4444",
      });
    }
  });

  // Clientes creados
  clients.forEach((c) => {
    const time = c.createdAt ? new Date(c.createdAt) : new Date();
    events.push({
      id: `client-create-${c.id}`,
      time,
      type: "client",
      title: isEs ? "Nuevo cliente registrado" : "New client registered",
      description: isEs 
        ? `${c.firstName} ${c.lastName || ""} se sumó a tu base de datos.`
        : `${c.firstName} ${c.lastName || ""} joined your database.`,
      icon: UserPlus,
      color: "#8b5cf6",
    });
  });

  // Si no hay eventos, agregamos sugerencias de bienvenida/automatización
  if (events.length === 0) {
    events.push({
      id: "ai-auto-1",
      time: new Date(),
      type: "system",
      title: isEs ? "Sistema inicializado" : "System initialized",
      description: isEs 
        ? "El Copilot de IA cargó los widgets por defecto del dashboard de forma exitosa."
        : "AI Copilot successfully loaded default dashboard widgets.",
      icon: Sparkles,
      color: "#d97706",
    });
  }

  // Ordenar por tiempo descendente (más recientes primero)
  const sorted = events.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);

  return (
    <div className="d-flex flex-column h-100">
      <div className="activity-timeline flex-grow-1 overflow-auto pe-1" style={{ maxHeight: "285px" }}>
        {sorted.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="d-flex gap-3 position-relative pb-4">
              {idx !== sorted.length - 1 && (
                <div
                  className="position-absolute"
                  style={{
                    left: "14px",
                    top: "28px",
                    bottom: 0,
                    width: "2px",
                    background: "#f3f4f6",
                  }}
                />
              )}
              <div
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: "30px",
                  height: "30px",
                  background: `${item.color}0d`,
                  color: item.color,
                  border: `1.5px solid ${item.color}1d`,
                  zIndex: 2,
                }}
              >
                <Icon size={14} />
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-baseline mb-0.5">
                  <span className="fw-bold text-dark small" style={{ fontSize: "12.5px" }}>{item.title}</span>
                  <span className="text-muted small" style={{ fontSize: "10.5px" }}>{getRelativeTime(item.time)}</span>
                </div>
                <p className="text-muted mb-0 small" style={{ fontSize: "11.5px", lineHeight: "1.4" }}>
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
