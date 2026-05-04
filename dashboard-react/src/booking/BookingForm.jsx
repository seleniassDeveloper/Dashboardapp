import { useState } from "react";
import { createAppointment } from "../services/bookingService";

export default function BookingForm() {
  const [form, setForm] = useState({
    clientId: "",
    serviceId: "",
    workerId: "",
    startsAt: "",
  });

  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createAppointment(form);
      setMsg("Cita creada correctamente");
    } catch {
      setMsg("Error al crear la cita");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="clientId" placeholder="Cliente ID" onChange={handleChange} />
      <input name="serviceId" placeholder="Servicio ID" onChange={handleChange} />
      <input name="workerId" placeholder="Worker ID" onChange={handleChange} />
      <input type="datetime-local" name="startsAt" onChange={handleChange} />
      <button type="submit">Reservar</button>
      <p>{msg}</p>
    </form>
  );
}
