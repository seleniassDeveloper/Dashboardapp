// src/hooks/useSlaProgress.js
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppointmentsStore } from "../gadgets/appointments/AppointmentsProvider.jsx";
import api from "../lib/api.js";

// Helper to format WhatsApp phone numbers
function toWhatsAppPhone(rawPhone) {
  const raw = String(rawPhone || "").trim();
  if (!raw) return "";
  let cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned.slice(1).replace(/\D/g, "");
  }
  return cleaned.replace(/\D/g, "");
}

export function useSlaProgress() {
  const { appointments, fetchAppointments } = useAppointmentsStore();
  const [localMockAppts, setLocalMockAppts] = useState([]);

  // Generate mock appointments for today
  const mockAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return [
      {
        id: "mock-1",
        startsAt: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
        clientName: "Ana García",
        serviceName: "Deep Facial",
        duration: 60,
        status: "CONFIRMED",
        depositStatus: "SIN_SENA",
        client: { firstName: "Ana", lastName: "García", phone: "+5491134922342" },
        service: { name: "Deep Facial", duration: 60, price: 15000 },
        worker: { firstName: "Laura" }
      },
      {
        id: "mock-2",
        startsAt: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
        clientName: "Fernanda Rodríguez",
        serviceName: "Basic Manicure",
        duration: 45,
        status: "PENDING",
        depositStatus: "SIN_SENA",
        client: { firstName: "Fernanda", lastName: "Rodríguez", phone: "+5491134922342" },
        service: { name: "Basic Manicure", duration: 45, price: 8000 },
        worker: { firstName: "Lucía" }
      },
      {
        id: "mock-3",
        startsAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        clientName: "Camila López",
        serviceName: "Coloración + Corte",
        duration: 95,
        status: "CONFIRMED",
        depositStatus: "PAGADA",
        client: { firstName: "Camila", lastName: "López", phone: "+5491134922342" },
        service: { name: "Coloración + Corte", duration: 95, price: 30000 },
        worker: { firstName: "Marta" }
      },
      {
        id: "mock-4",
        startsAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
        clientName: "Valeria Ruiz",
        serviceName: "Perfilado de Cejas",
        duration: 30,
        status: "CONFIRMED",
        depositStatus: "PAGADA",
        client: { firstName: "Valeria", lastName: "Ruiz" },
        service: { name: "Perfilado de Cejas", duration: 30, price: 5000 },
        worker: { firstName: "Marta" }
      },
      {
        id: "mock-5",
        startsAt: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
        clientName: "Sofía Martínez",
        serviceName: "Peinado de Fiesta",
        duration: 60,
        status: "CONFIRMED",
        depositStatus: "PAGADA",
        client: { firstName: "Sofía", lastName: "Martínez" },
        service: { name: "Peinado de Fiesta", duration: 60, price: 12000 },
        worker: { firstName: "Laura" }
      },
      {
        id: "mock-6",
        startsAt: new Date(new Date().setHours(13, 30, 0, 0)).toISOString(),
        clientName: "Carolina Sosa",
        serviceName: "Pedicura Completa",
        duration: 50,
        status: "CONFIRMED",
        depositStatus: "PAGADA",
        client: { firstName: "Carolina", lastName: "Sosa" },
        service: { name: "Pedicura Completa", duration: 50, price: 9000 },
        worker: { firstName: "Lucía" }
      },
      {
        id: "mock-7",
        startsAt: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
        clientName: "Julieta Cardozo",
        serviceName: "Corte Unisex",
        duration: 40,
        status: "CONFIRMED",
        depositStatus: "PAGADA",
        client: { firstName: "Julieta", lastName: "Cardozo" },
        service: { name: "Corte Unisex", duration: 40, price: 7500 },
        worker: { firstName: "Laura" }
      },
      {
        id: "mock-8",
        startsAt: new Date(new Date().setHours(16, 30, 0, 0)).toISOString(),
        clientName: "Marta Benítez",
        serviceName: "Tratamiento de Keratina",
        duration: 120,
        status: "CONFIRMED",
        depositStatus: "PAGADA",
        client: { firstName: "Marta", lastName: "Benítez" },
        service: { name: "Tratamiento de Keratina", duration: 120, price: 25000 },
        worker: { firstName: "Marta" }
      }
    ];
  }, []);

  // Initialize mock list on mount
  useEffect(() => {
    setLocalMockAppts(mockAppointments);
  }, [mockAppointments]);

  // Filter today's appointments
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  const realTodayAppts = useMemo(() => {
    const list = Array.isArray(appointments) ? appointments : [];
    return list.filter(a => {
      if (!a || !a.startsAt || a.status === "CANCELLED") return false;
      return a.startsAt.startsWith(todayStr);
    });
  }, [appointments, todayStr]);

  const hasRealData = realTodayAppts.length > 0;
  const currentApptsList = hasRealData ? realTodayAppts : localMockAppts;

  // Helper to map appointment to one of three states: "sin_sena" | "pendiente" | "confirmada"
  const getNormalizedState = useCallback((a) => {
    if (!a) return "pendiente";
    if (a.status === "PENDING") {
      return "pendiente";
    }
    
    // Checked downpayment / seña status
    const isSenaPaid = 
      a.depositStatus === "PAGADA" || 
      a.senaStatus === "PAGADA" || 
      a.downpaymentStatus === "PAID" ||
      a.notes?.toLowerCase().includes("seña");

    if (isSenaPaid) {
      return "confirmada";
    } else {
      return "sin_sena";
    }
  }, []);

  // Filter lists based on state
  const confirmed = useMemo(() => {
    return currentApptsList.filter(a => a && getNormalizedState(a) === "confirmada");
  }, [currentApptsList, getNormalizedState]);

  const pending = useMemo(() => {
    return currentApptsList.filter(a => a && getNormalizedState(a) === "pendiente");
  }, [currentApptsList, getNormalizedState]);

  const noDeposit = useMemo(() => {
    return currentApptsList.filter(a => a && getNormalizedState(a) === "sin_sena");
  }, [currentApptsList, getNormalizedState]);

  const total = currentApptsList.length;
  
  const pct = useMemo(() => {
    return total ? Math.round(confirmed.length / total * 100) : 0;
  }, [confirmed, total]);

  const goalPct = 80;

  // Confirm appointment operation
  const confirmAppt = useCallback(async (id) => {
    if (String(id).startsWith("mock-")) {
      setLocalMockAppts(prev => 
        prev.map(x => x.id === id ? { ...x, status: "CONFIRMED", depositStatus: "PAGADA" } : x)
      );
      return;
    }
    
    const appt = currentApptsList.find(x => x.id === id);
    if (!appt) return;

    try {
      await api.put(`/appointments/${id}`, {
        clientId: appt.clientId,
        serviceId: appt.serviceId,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        status: "CONFIRMED"
      });
      fetchAppointments();
    } catch (e) {
      console.error("Error confirming appointment:", e);
      alert("Error al confirmar la cita.");
    }
  }, [currentApptsList, fetchAppointments]);

  // Charge deposit operation
  const chargeDeposit = useCallback(async (id) => {
    if (String(id).startsWith("mock-")) {
      setLocalMockAppts(prev => 
        prev.map(x => x.id === id ? { ...x, depositStatus: "PAGADA" } : x)
      );
      return;
    }

    const appt = currentApptsList.find(x => x.id === id);
    if (!appt) return;

    try {
      const updatedNotes = (appt.notes || "").trim() + " [seña pagada]";
      await api.put(`/appointments/${id}`, {
        clientId: appt.clientId,
        serviceId: appt.serviceId,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: updatedNotes,
        status: appt.status
      });
      fetchAppointments();
    } catch (e) {
      console.error("Error updating downpayment:", e);
      alert("Error al registrar el pago de la seña.");
    }
  }, [currentApptsList, fetchAppointments]);

  // Open WhatsApp notification
  const openWhatsApp = useCallback((appt) => {
    const phone = appt.client?.phone || appt.phone || "";
    const waPhone = toWhatsAppPhone(phone);
    if (!waPhone) {
      alert("El cliente no cuenta con un número de teléfono válido.");
      return;
    }

    const clientName = appt.clientName || `${appt.client?.firstName || ""} ${appt.client?.lastName || ""}`.trim() || "Cliente";
    const serviceName = appt.serviceName || appt.service?.name || "Servicio";
    const startsAtDate = new Date(appt.startsAt);
    const apptTime = startsAtDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    const isPending = appt.status === "PENDING";
    
    let text = "";
    if (isPending) {
      text = `Hola ${clientName}! 👋 Te escribimos de AuraDash para confirmar tu turno de ${serviceName} programado para hoy a las ${apptTime} hs. ¿Nos confirmas tu asistencia? ¡Muchas gracias!`;
    } else {
      const price = appt.service?.price || appt.price || 0;
      text = `Hola ${clientName}! 👋 Te escribimos para coordinar la seña de tu turno de ${serviceName} hoy a las ${apptTime} hs. El total estimado es de $${price}. ¿Nos confirmas cuando realices la seña? ¡Muchas gracias!`;
    }

    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, "_blank");
  }, []);

  return {
    confirmed,
    pending,
    noDeposit,
    total,
    pct,
    goalPct,
    confirmAppt,
    chargeDeposit,
    openWhatsApp,
    allAppointments: currentApptsList
  };
}
