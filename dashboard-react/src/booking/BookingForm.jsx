import { useState, useEffect } from "react";
import { API_BASE_URL } from "../lib/api.js";

// Helper to convert hex to rgb string for CSS custom properties
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "124, 58, 237"; // default brand color purple
}

export default function BookingForm({ business, slug }) {
  const brandColor = business?.bookingPrimaryColor || "#7c3aed";
  const brandColorRgb = hexToRgb(brandColor);

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Selected services
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Step 2: Selected professional
  const [selectedWorkerId, setSelectedWorkerId] = useState("any");

  // Step 3: Date & Hour
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [selectedDateStr, setSelectedDateStr] = useState(""); // "YYYY-MM-DD"
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // "HH:MM"

  // Step 4: Personal details
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Success view data
  const [createdBookings, setCreatedBookings] = useState(null);

  // Fetch services and professionals on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        setErrorMsg("");
        
        const [resServices, resWorkers] = await Promise.all([
          fetch(`${API_BASE_URL}/public/business/${slug}/services`),
          fetch(`${API_BASE_URL}/public/business/${slug}/professionals`)
        ]);
        
        if (!resServices.ok || !resWorkers.ok) {
          throw new Error("No se pudo obtener la información de servicios o profesionales.");
        }
        
        const [dataServices, dataWorkers] = await Promise.all([
          resServices.json(),
          resWorkers.json()
        ]);
        
        setServices(dataServices);
        setProfessionals(dataWorkers);
      } catch (err) {
        console.error("Error loading booking details:", err);
        setErrorMsg(err.message || "Error al conectar con el servidor.");
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [slug]);

  // Fetch slots when date or worker changes
  const fetchSlotsForDate = async (dateStr, workerId) => {
    if (!dateStr) return;
    try {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      const serviceIdsStr = selectedServices.map(s => s.id).join(",");
      
      const url = `${API_BASE_URL}/public/business/${slug}/slots?date=${dateStr}&serviceId=${serviceIdsStr}&professionalId=${workerId}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("No se pudo obtener disponibilidad para esta fecha.");
      }
      const data = await res.json();
      setSlots(data);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Helper calculations for summary
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Filter professionals that can perform all selected services
  const eligibleWorkers = professionals.filter(w => {
    const serviceIds = selectedServices.map(s => s.id);
    return serviceIds.every(id => w.serviceIds.includes(id));
  });

  // Reset forward selections when step 1 changes
  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      let updated;
      if (exists) {
        updated = prev.filter(s => s.id !== service.id);
      } else {
        updated = [...prev, service];
      }
      // Reset worker and date if services changed
      setSelectedWorkerId("any");
      setSelectedDate(null);
      setSelectedDateStr("");
      setSelectedSlot(null);
      setSlots([]);
      return updated;
    });
  };

  // Reset forward selections when step 2 changes
  const handleWorkerChange = (workerId) => {
    setSelectedWorkerId(workerId);
    setSelectedDate(null);
    setSelectedDateStr("");
    setSelectedSlot(null);
    setSlots([]);
  };

  // Month navigation
  const prevMonth = () => {
    if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar generation
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonthOffset = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Shift Monday to 0
  };

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const offset = getFirstDayOfMonthOffset(currentYear, currentMonth);
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const weekdays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

  const calendarCells = [];
  for (let i = 0; i < offset; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
  }

  for (let d = 1; d <= daysCount; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isPast = cellDate < todayDate;
    
    const isSelected = selectedDateStr === cellDateStr;
    const isToday = cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
    
    calendarCells.push(
      <div
        key={`day-${d}`}
        className={`calendar-day-cell ${isPast ? "disabled" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
        onClick={() => {
          if (!isPast) {
            setSelectedDateStr(cellDateStr);
            setSelectedDate(cellDate);
            fetchSlotsForDate(cellDateStr, selectedWorkerId);
          }
        }}
      >
        {d}
      </div>
    );
  }

  // Formatting date header
  const formatSelectedDateHeader = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  // Step 4 phone and name validation
  const cleanPhone = form.phone.replace(/[\s\-+()]/g, '');
  const isPhoneValid = /^\d+$/.test(cleanPhone) && cleanPhone.length >= 8;
  const isFormValid = form.firstName.trim() !== "" && form.lastName.trim() !== "" && isPhoneValid;

  // Submit booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setSubmitting(true);
      setBookingError("");

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
        serviceId: selectedServices.map(s => s.id).join(","),
        professionalId: selectedWorkerId,
        date: selectedDateStr,
        time: selectedSlot
      };

      const res = await fetch(`${API_BASE_URL}/public/business/${slug}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Hubo un problema al procesar tu reserva.");
      }

      setCreatedBookings(data.bookings || [data.booking]);
      setStep(5); // Transition to success step
    } catch (err) {
      console.error(err);
      setBookingError(err.message || "Error de red al procesar la reserva. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Google Calendar URL generator
  const getGCalLink = () => {
    if (!createdBookings || createdBookings.length === 0) return "";
    
    // Sort booking appointments by startsAt to get the true start/end window
    const sorted = [...createdBookings].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    const firstAppt = sorted[0];
    const lastAppt = sorted[sorted.length - 1];
    
    const start = new Date(firstAppt.startsAt);
    
    // End is start of last appointment plus its service duration
    const lastSvcDuration = lastAppt.service?.duration || 30;
    const end = new Date(new Date(lastAppt.startsAt).getTime() + lastSvcDuration * 60 * 1000);
    
    const toUtcFormat = (d) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };
    
    const dates = `${toUtcFormat(start)}/${toUtcFormat(end)}`;
    const title = `Reserva en ${business.name}`;
    const servicesList = selectedServices.map(s => s.name).join(", ");
    
    const assignedWorker = firstAppt.worker 
      ? `${firstAppt.worker.firstName} ${firstAppt.worker.lastName}`
      : "Asignado automáticamente";
      
    const details = `Servicios: ${servicesList}\nProfesional: ${assignedWorker}\nConfirmación: ${business.bookingConfirmationMessage || "Confirmado"}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}`;
  };

  // Reset all states to do a new booking
  const handleReset = () => {
    setStep(1);
    setSelectedServices([]);
    setSelectedWorkerId("any");
    setSelectedDate(null);
    setSelectedDateStr("");
    setSlots([]);
    setSelectedSlot(null);
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      notes: ""
    });
    setCreatedBookings(null);
    setBookingError("");
  };

  // Loading skeleton state
  if (loadingData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="skeleton-block" style={{ height: "24px", width: "40%", borderRadius: "8px" }} />
        <div className="skeleton-block" style={{ height: "80px", width: "100%", borderRadius: "16px" }} />
        <div className="skeleton-block" style={{ height: "80px", width: "100%", borderRadius: "16px" }} />
        <div className="skeleton-block" style={{ height: "80px", width: "100%", borderRadius: "16px" }} />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
        <p style={{ color: "#ef4444", fontWeight: "600" }}>{errorMsg}</p>
        <button className="back-button" onClick={handleReset} style={{ marginTop: "16px" }}>
          Reintentar
        </button>
      </div>
    );
  }

  // Filter service items by search query
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="booking-form-wrapper" style={{ "--brand-color": brandColor, "--brand-color-rgb": brandColorRgb }}>
      <style>{`
        .booking-form-wrapper {
          position: relative;
        }

        /* Stepper Styling */
        .wizard-stepper {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          position: relative;
          padding: 0 10px;
        }
        .wizard-stepper::before {
          content: '';
          position: absolute;
          top: 16px;
          left: 10px;
          right: 10px;
          height: 3px;
          background: #e2e8f0;
          z-index: 1;
        }
        .wizard-stepper-progress {
          position: absolute;
          top: 16px;
          left: 10px;
          height: 3px;
          background: var(--brand-color);
          z-index: 2;
          transition: width 0.3s ease;
        }
        .step-dot {
          position: relative;
          z-index: 3;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #64748b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .step-dot.active {
          border-color: var(--brand-color);
          color: var(--brand-color);
          box-shadow: 0 0 0 4px rgba(var(--brand-color-rgb), 0.15);
        }
        .step-dot.completed {
          border-color: var(--brand-color);
          background: var(--brand-color);
          color: #ffffff;
        }
        .step-label {
          position: absolute;
          top: 38px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          color: #64748b;
          transform: translateX(-50%);
          left: 50%;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .step-dot.active .step-label {
          color: var(--brand-color);
          font-weight: 700;
        }
        .step-dot.completed .step-label {
          color: #0f172a;
        }

        /* Search input */
        .search-container {
          position: relative;
          margin-bottom: 20px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 14px;
          border: 2px solid #e2e8f0;
          font-size: 14px;
          transition: all 0.2s ease;
          color: #0f172a;
          outline: none;
        }
        .search-input:focus {
          border-color: var(--brand-color);
          box-shadow: 0 0 0 3px rgba(var(--brand-color-rgb), 0.08);
        }

        /* Service Cards styling */
        .services-list-container {
          padding-bottom: 120px; /* Spacer for bottom bar */
        }
        .service-card {
          padding: 18px;
          border-radius: 20px;
          border: 2px solid #f1f5f9;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.01);
        }
        .service-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .service-card.selected {
          border-color: var(--brand-color);
          background: rgba(var(--brand-color-rgb), 0.02);
          box-shadow: 0 4px 15px rgba(var(--brand-color-rgb), 0.05);
        }
        .custom-checkbox {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          border: 2.5px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
          margin-top: 2px;
        }
        .service-card.selected .custom-checkbox {
          border-color: var(--brand-color);
          background: var(--brand-color);
        }
        .custom-checkbox svg {
          fill: none;
          stroke: #ffffff;
          stroke-width: 3.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          width: 11px;
          height: 11px;
          display: none;
        }
        .service-card.selected .custom-checkbox svg {
          display: block;
        }
        .service-info {
          flex-grow: 1;
        }
        .service-header-line {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .service-title {
          font-weight: 700;
          font-size: 15px;
          color: #0f172a;
          line-height: 1.3;
          margin: 0;
        }
        .service-price {
          font-weight: 700;
          font-size: 16px;
          color: var(--brand-color);
          white-space: nowrap;
        }
        .service-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.4;
          margin: 0 0 8px 0;
        }
        .service-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
        }
        .service-card.selected .service-badge {
          background: rgba(var(--brand-color-rgb), 0.08);
          color: var(--brand-color);
        }

        /* Sticky bottom panel */
        .sticky-summary {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 580px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          border-radius: 24px 24px 0 0;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.06);
          box-sizing: border-box;
        }
        .summary-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .summary-text {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-total {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }
        .next-button {
          background: var(--brand-color);
          color: #ffffff;
          border: none;
          padding: 14px 26px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(var(--brand-color-rgb), 0.2);
        }
        .next-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(var(--brand-color-rgb), 0.3);
          opacity: 0.95;
        }
        .next-button:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Professional Selection styling */
        .professionals-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .professional-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 480px) {
          .professional-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .worker-card {
          padding: 20px 16px;
          border-radius: 20px;
          border: 2px solid #f1f5f9;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .worker-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.03);
        }
        .worker-card.selected {
          border-color: var(--brand-color);
          background: rgba(var(--brand-color-rgb), 0.02);
          box-shadow: 0 6px 18px rgba(var(--brand-color-rgb), 0.05);
        }
        .worker-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          border: 2.5px solid transparent;
          transition: all 0.2s ease;
        }
        .worker-card.selected .worker-avatar {
          border-color: var(--brand-color);
          background: var(--brand-color);
          color: #ffffff;
        }
        .worker-name {
          font-weight: 700;
          font-size: 15px;
          color: #0f172a;
          margin-bottom: 3px;
        }
        .worker-role {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        /* Calendar Styling */
        .calendar-wrapper {
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 16px;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 0 4px;
        }
        .calendar-title {
          font-weight: 700;
          font-size: 16px;
          color: #0f172a;
          text-transform: capitalize;
        }
        .calendar-nav-btn {
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
          color: #475569;
        }
        .calendar-nav-btn:hover:not(:disabled) {
          background: #e2e8f0;
          color: #0f172a;
        }
        .calendar-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .calendar-day-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          padding: 8px 0;
          text-align: center;
          text-transform: uppercase;
        }
        .calendar-day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 13.5px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .calendar-day-cell:hover:not(.disabled):not(.selected):not(.empty) {
          background: #f1f5f9;
        }
        .calendar-day-cell.selected {
          background: var(--brand-color);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(var(--brand-color-rgb), 0.25);
        }
        .calendar-day-cell.disabled {
          color: #cbd5e1;
          cursor: not-allowed;
          text-decoration: line-through;
          background: transparent;
        }
        .calendar-day-cell.today {
          border: 2px solid var(--brand-color);
          color: var(--brand-color);
        }
        .calendar-day-cell.today.selected {
          border-color: transparent;
          color: #ffffff;
        }
        .calendar-day-cell.empty {
          cursor: default;
          background: transparent;
          visibility: hidden;
        }

        /* Slots container */
        .slots-container {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px dashed #f1f5f9;
        }
        .slots-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        @media (min-width: 480px) {
          .slots-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .slot-btn {
          padding: 12px 8px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          outline: none;
        }
        .slot-btn:hover:not(.selected) {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .slot-btn.selected {
          background: var(--brand-color);
          color: #ffffff;
          border-color: var(--brand-color);
          box-shadow: 0 4px 10px rgba(var(--brand-color-rgb), 0.2);
        }

        /* Review and Form card */
        .summary-card {
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .summary-title {
          font-weight: 700;
          font-size: 15px;
          color: #0f172a;
          margin-bottom: 12px;
          border-bottom: 1.5px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          margin-bottom: 8px;
          color: #475569;
        }
        .summary-item strong {
          color: #0f172a;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          font-size: 14.5px;
          transition: all 0.2s ease;
          color: #0f172a;
          box-sizing: border-box;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--brand-color);
          box-shadow: 0 0 0 3px rgba(var(--brand-color-rgb), 0.08);
        }
        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        .validation-warning {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
        }

        /* Action buttons footer */
        .footer-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          gap: 12px;
        }
        .back-button {
          background: #ffffff;
          color: #475569;
          border: 2px solid #e2e8f0;
          padding: 14px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .back-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* Error block */
        .error-banner {
          background: #fef2f2;
          border: 2px solid #fecaca;
          color: #991b1b;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13.5px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Success screen animations */
        .success-card {
          text-align: center;
          padding: 24px 12px;
        }
        .success-icon-container {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .success-checkmark {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: block;
          stroke-width: 2.5;
          stroke: #fff;
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px #10b981;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s forwards;
        }
        .success-checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 2.5;
          stroke-miterlimit: 10;
          stroke: #10b981;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .success-checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 40px #10b981;
          }
        }

        .gcal-btn {
          background: #1a73e8;
          color: #ffffff;
          border: none;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          margin-top: 24px;
          box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
        }
        .gcal-btn:hover {
          background: #1557b0;
          box-shadow: 0 6px 18px rgba(26, 115, 232, 0.35);
          transform: translateY(-2px);
        }
        
        .another-booking-btn {
          margin-top: 14px;
          background: transparent;
          color: #475569;
          border: 2px solid #e2e8f0;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        .another-booking-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .details-box {
          background: #f8fafc;
          border: 1.5px dashed #cbd5e1;
          border-radius: 16px;
          padding: 18px;
          margin: 20px 0;
          text-align: left;
          font-size: 13.5px;
          color: #475569;
          line-height: 1.5;
        }
      `}</style>

      {/* Wizard Step Stepper (only steps 1-4) */}
      {step <= 4 && (
        <div className="wizard-stepper">
          <div 
            className="wizard-stepper-progress" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          <div className={`step-dot ${step >= 1 ? "completed" : ""} ${step === 1 ? "active" : ""}`}>
            1
            <span className="step-label">Servicios</span>
          </div>
          <div className={`step-dot ${step > 2 ? "completed" : ""} ${step === 2 ? "active" : ""}`}>
            2
            <span className="step-label">Personal</span>
          </div>
          <div className={`step-dot ${step > 3 ? "completed" : ""} ${step === 3 ? "active" : ""}`}>
            3
            <span className="step-label">Fecha</span>
          </div>
          <div className={`step-dot ${step > 4 ? "completed" : ""} ${step === 4 ? "active" : ""}`}>
            4
            <span className="step-label">Datos</span>
          </div>
        </div>
      )}

      {/* STEP 1: SELECT SERVICES */}
      {step === 1 && (
        <div className="services-list-container">
          <h2 className="step-title">Selecciona los servicios</h2>
          <p className="step-subtitle">Elige uno o más servicios que deseas reservar.</p>

          <div className="search-container">
            <svg className="search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredServices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px", color: "#64748b" }}>
              Ningún servicio coincide con tu búsqueda.
            </div>
          ) : (
            filteredServices.map(service => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              return (
                <div
                  key={service.id}
                  className={`service-card ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleService(service)}
                >
                  <div className="custom-checkbox">
                    <svg viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div className="service-info">
                    <div className="service-header-line">
                      <h3 className="service-title">{service.name}</h3>
                      <span className="service-price">
                        {service.price === 0 ? "Gratis" : `$${new Intl.NumberFormat("es-AR").format(service.price)}`}
                      </span>
                    </div>
                    {service.description && (
                      <p className="service-desc">{service.description}</p>
                    )}
                    <span className="service-badge">
                      ⏱ {service.duration || 30} min
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Sticky summary footer */}
          <div className="sticky-summary">
            <div className="summary-info">
              <span className="summary-text">
                {selectedServices.length} {selectedServices.length === 1 ? "servicio" : "servicios"} · {totalDuration} min
              </span>
              <span className="summary-total">
                Total: ${new Intl.NumberFormat("es-AR").format(totalPrice)}
              </span>
            </div>
            <button
              type="button"
              className="next-button"
              disabled={selectedServices.length === 0}
              onClick={() => setStep(2)}
            >
              Siguiente
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PROFESSIONAL */}
      {step === 2 && (
        <div className="professionals-container">
          <h2 className="step-title">Elige un profesional</h2>
          <p className="step-subtitle">Selecciona a quién prefieres para realizar tu cita.</p>

          {eligibleWorkers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div className="error-banner">
                ⚠️ Ninguno de nuestros profesionales realiza todos los servicios seleccionados al mismo tiempo.
              </div>
              <button type="button" className="back-button" onClick={() => setStep(1)} style={{ width: "100%" }}>
                Volver a Servicios
              </button>
            </div>
          ) : (
            <>
              <div className="professional-grid">
                {/* Any option */}
                <div 
                  className={`worker-card ${selectedWorkerId === "any" ? "selected" : ""}`}
                  onClick={() => handleWorkerChange("any")}
                >
                  <div className="worker-avatar">✨</div>
                  <div className="worker-name">Sin preferencia</div>
                  <div className="worker-role">El profesional disponible más rápido</div>
                </div>

                {eligibleWorkers.map(worker => {
                  const initials = `${worker.firstName?.charAt(0) || ""}${worker.lastName?.charAt(0) || ""}`.toUpperCase();
                  const isSelected = selectedWorkerId === worker.id;
                  return (
                    <div 
                      key={worker.id}
                      className={`worker-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleWorkerChange(worker.id)}
                    >
                      <div className="worker-avatar">{initials}</div>
                      <div className="worker-name">{worker.name}</div>
                      <div className="worker-role">{worker.roleTitle || "Profesional"}</div>
                    </div>
                  );
                })}
              </div>

              <div className="footer-actions">
                <button type="button" className="back-button" onClick={() => setStep(1)}>
                  Atrás
                </button>
                <button 
                  type="button" 
                  className="next-button"
                  onClick={() => setStep(3)}
                >
                  Siguiente
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3: DATE AND HOUR CALENDAR */}
      {step === 3 && (
        <div>
          <h2 className="step-title">Fecha y hora</h2>
          <p className="step-subtitle">Selecciona el día y la hora de tu reserva.</p>

          <div className="calendar-wrapper">
            <div className="calendar-header">
              <button 
                type="button" 
                className="calendar-nav-btn" 
                onClick={prevMonth}
                disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
              >
                &larr;
              </button>
              <div className="calendar-title">
                {monthNames[currentMonth]} {currentYear}
              </div>
              <button 
                type="button" 
                className="calendar-nav-btn" 
                onClick={nextMonth}
              >
                &rarr;
              </button>
            </div>

            <div className="calendar-grid">
              {weekdays.map(w => (
                <div key={w} className="calendar-day-label">{w}</div>
              ))}
              {calendarCells}
            </div>
          </div>

          {/* Time Slots area */}
          {loadingSlots ? (
            <div className="slots-container">
              <div className="skeleton-block" style={{ height: "20px", width: "40%", marginBottom: "12px", borderRadius: "6px" }} />
              <div className="slots-grid">
                <div className="skeleton-block" style={{ height: "42px", borderRadius: "12px" }} />
                <div className="skeleton-block" style={{ height: "42px", borderRadius: "12px" }} />
                <div className="skeleton-block" style={{ height: "42px", borderRadius: "12px" }} />
                <div className="skeleton-block" style={{ height: "42px", borderRadius: "12px" }} />
              </div>
            </div>
          ) : selectedDateStr ? (
            slots.length === 0 ? (
              <div className="slots-container" style={{ textAlign: "center", padding: "20px 0", color: "#ef4444", fontWeight: "600" }}>
                ⚠️ No hay horarios disponibles para el {formatSelectedDateHeader(selectedDateStr)}.
              </div>
            ) : (
              <div className="slots-container">
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a", marginBottom: "12px" }}>
                  Horarios disponibles para el {formatSelectedDateHeader(selectedDateStr)}:
                </div>
                <div className="slots-grid">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-btn ${selectedSlot === slot ? "selected" : ""}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot} hs
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: "14px" }}>
              Selecciona un día disponible en el calendario.
            </div>
          )}

          <div className="footer-actions">
            <button type="button" className="back-button" onClick={() => setStep(2)}>
              Atrás
            </button>
            <button 
              type="button" 
              className="next-button"
              disabled={!selectedDateStr || !selectedSlot}
              onClick={() => setStep(4)}
            >
              Siguiente
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CLIENT DATA AND CONFIRM */}
      {step === 4 && (
        <form onSubmit={handleConfirmBooking}>
          <h2 className="step-title">Tus Datos</h2>
          <p className="step-subtitle">Completa tus datos personales para finalizar la reserva.</p>

          <div className="summary-card">
            <h3 className="summary-title">Resumen del Turno</h3>
            <div className="summary-item">
              <span>Servicios:</span>
              <strong>{selectedServices.map(s => s.name).join(", ")}</strong>
            </div>
            <div className="summary-item">
              <span>Duración:</span>
              <strong>⏱ {totalDuration} min</strong>
            </div>
            <div className="summary-item">
              <span>Fecha y hora:</span>
              <strong style={{ textTransform: "capitalize" }}>
                {selectedDateStr && formatSelectedDateHeader(selectedDateStr)} a las {selectedSlot} hs
              </strong>
            </div>
            <div className="summary-item">
              <span>Profesional:</span>
              <strong>
                {selectedWorkerId === "any" 
                  ? "Cualquiera (Sin preferencia)" 
                  : professionals.find(p => p.id === selectedWorkerId)?.name}
              </strong>
            </div>
            <div className="summary-item" style={{ borderTop: "1.5px dashed #cbd5e1", paddingTop: "8px", marginTop: "8px", fontSize: "15px" }}>
              <span>Total a pagar:</span>
              <strong style={{ color: "var(--brand-color)" }}>
                ${new Intl.NumberFormat("es-AR").format(totalPrice)}
              </strong>
            </div>
          </div>

          {bookingError && (
            <div className="error-banner">
              <span>⚠️</span> {bookingError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Tu nombre"
              value={form.firstName}
              required
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Apellido *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Tu apellido"
              value={form.lastName}
              required
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono móvil *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Ej: 1123456789 (mínimo 8 dígitos)"
              value={form.phone}
              required
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="validation-warning">
              {!form.phone ? "Requerido para recordatorios por WhatsApp" : 
                isPhoneValid ? "✓ Teléfono válido" : "⚠️ Debe contener solo números y al menos 8 dígitos"}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email (Opcional)</label>
            <input
              type="email"
              className="form-input"
              placeholder="Ej: tuemail@correo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div className="validation-warning" style={{ color: "#64748b" }}>
              Para recibir la confirmación por correo electrónico
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Aclaración o Notas (Opcional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Algún detalle adicional..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="footer-actions">
            <button type="button" className="back-button" onClick={() => setStep(3)} disabled={submitting}>
              Atrás
            </button>
            <button 
              type="submit" 
              className="next-button"
              disabled={!isFormValid || submitting}
            >
              {submitting ? "Procesando..." : "Confirmar Reserva"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 5: SUCCESS CONFIRMATION VIEW */}
      {step === 5 && createdBookings && (
        <div className="success-card">
          <div className="success-icon-container">
            <svg className="success-checkmark" viewBox="0 0 52 52">
              <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <h2 className="step-title" style={{ color: "#10b981" }}>¡Reserva Confirmada!</h2>
          <p style={{ color: "#475569", fontSize: "14.5px", lineHeight: "1.5", margin: "8px 0 24px" }}>
            {business.bookingConfirmationMessage || "¡Tu reserva ha sido confirmada con éxito!"}
          </p>

          <div className="details-box">
            <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "8px", fontSize: "14px", textTransform: "uppercase" }}>Detalles:</div>
            <div><strong>Servicios:</strong> {selectedServices.map(s => s.name).join(", ")}</div>
            <div><strong>Profesional:</strong> {
              createdBookings[0]?.worker 
                ? `${createdBookings[0].worker.firstName} ${createdBookings[0].worker.lastName}`
                : "Sin preferencia"
            }</div>
            <div style={{ textTransform: "capitalize" }}><strong>Fecha:</strong> {selectedDateStr && formatSelectedDateHeader(selectedDateStr)}</div>
            <div><strong>Hora:</strong> {selectedSlot} hs</div>
            <div><strong>Total:</strong> ${new Intl.NumberFormat("es-AR").format(totalPrice)}</div>
          </div>

          <a 
            href={getGCalLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="gcal-btn"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7v-5z"/>
            </svg>
            Agregar a Google Calendar
          </a>

          <button 
            type="button" 
            className="another-booking-btn"
            onClick={handleReset}
          >
            Hacer otra reserva
          </button>
        </div>
      )}
    </div>
  );
}
