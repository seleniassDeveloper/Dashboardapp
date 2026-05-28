import React, { useState } from "react";
import AppointmentCard from "./AppointmentCard";
import ScheduleBlock from "./ScheduleBlock";

export default function WorkerColumn({
  worker,
  appointments = [],
  scheduleBlocks = [],
  onEditAppointment,
  onUpdateStatus,
  onSendWhatsApp,
  onSendEmail,
  onMoveAppointment,
  onCreateAppointmentAt,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Generar 24 ranuras de media hora (de 09:00 a 21:00)
  const timeSlots = [];
  for (let h = 9; h < 21; h++) {
    timeSlots.push({ hour: h, minute: 0 });
    timeSlots.push({ hour: h, minute: 30 });
  }

  // Manejo de drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e, targetHour, targetMinute) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const apptId = e.dataTransfer.getData("apptId");
    if (!apptId) return;

    onMoveAppointment(apptId, worker.id, targetHour, targetMinute);
  };

  return (
    <div
      className={`agenda-worker-column ${isDragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* 1. Celdas transparentes de media hora para click rápido o soltado de citas */}
      {timeSlots.map((slot, index) => {
        const topPos = index * 40; // 40px por cada media hora
        return (
          <div
            key={index}
            className="drop-slot-cell timeline-empty-slot"
            style={{ top: `${topPos}px` }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, slot.hour, slot.minute)}
            onClick={() => onCreateAppointmentAt(worker.id, slot.hour, slot.minute)}
            title={`Hacer reserva con ${worker.firstName} a las ${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`}
          />
        );
      })}

      {/* 2. Bloques Horarios Bloqueados */}
      {scheduleBlocks.map((block) => (
        <ScheduleBlock key={block.id} block={block} />
      ))}

      {/* 3. Tarjetas de Citas */}
      {appointments.map((appt) => (
        <AppointmentCard
          key={appt.id}
          appt={appt}
          onEdit={onEditAppointment}
          onUpdateStatus={onUpdateStatus}
          onSendWhatsApp={onSendWhatsApp}
          onSendEmail={onSendEmail}
        />
      ))}
    </div>
  );
}
