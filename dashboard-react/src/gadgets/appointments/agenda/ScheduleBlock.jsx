import React from "react";

export default function ScheduleBlock({ block }) {
  // block: { startTime: "13:00", endTime: "14:00", reason: "Almuerzo" }
  const [startH, startM] = block.startTime.split(":").map(Number);
  const [endH, endM] = block.endTime.split(":").map(Number);
  
  const startsDecimal = startH + startM / 60;
  const endsDecimal = endH + endM / 60;
  
  const topOffset = (startsDecimal - 9) * 80;
  const height = (endsDecimal - startsDecimal) * 80;

  return (
    <div
      className="schedule-block-locked"
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
      }}
    >
      <div className="schedule-block-text">
        🔒 {block.reason || "Horario Bloqueado"}
      </div>
    </div>
  );
}
