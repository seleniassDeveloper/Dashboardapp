import { useState, useEffect } from "react";
import { API_BASE_URL } from "../lib/api.js";

// Helper to convert hex to rgb string for CSS custom properties
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "107, 78, 255"; // default brand color purple #6B4EFF
}

export default function BookingForm({ business, slug }) {
  const brandColor = business?.bookingPrimaryColor || "#6B4EFF";
  const brandColorRgb = hexToRgb(brandColor);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState("forward");

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Services selection
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  // Step 2: Professional selection
  const [selectedWorkerId, setSelectedWorkerId] = useState("any");

  // Step 3: Date & Hour Strip
  const today = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [selectedDateStr, setSelectedDateStr] = useState(""); // "YYYY-MM-DD"
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // "HH:MM"

  // Step 4: Client information
  const [form, setForm] = useState({
    clientName: "",
    firstName: "",
    lastName: "",
    phone: "",
    clientPhone: "",
    email: "",
    clientEmail: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Step 5: Success screen
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

  // Helper step transitions
  const changeStep = (nextStep) => {
    setDirection(nextStep > step ? "forward" : "backward");
    setStep(nextStep);
  };

  // Helper calculations for summary
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Filter professionals that can perform all selected services
  const eligibleWorkers = professionals.filter(w => {
    const serviceIds = selectedServices.map(s => s.id);
    return serviceIds.every(id => w.serviceIds.includes(id));
  });

  // Extract categories for tabs in step 1
  const categories = ["Todos", ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))];

  // Rotate pastel background colors
  const getPastelBg = (index) => {
    const colors = ["#FDECD8", "#DDE8FF", "#DDF4EA", "#EDE8FF"];
    return colors[index % colors.length];
  };

  // Toggle selected service
  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      let updated;
      if (exists) {
        updated = prev.filter(s => s.id !== service.id);
      } else {
        updated = [...prev, service];
      }
      // Reset worker and date selection to avoid inconsistencies
      setSelectedWorkerId("any");
      setSelectedDate(null);
      setSelectedDateStr("");
      setSelectedSlot(null);
      setSlots([]);
      return updated;
    });
  };

  // Select professional
  const handleWorkerChange = (workerId) => {
    setSelectedWorkerId(workerId);
    setSelectedDate(null);
    setSelectedDateStr("");
    setSelectedSlot(null);
    setSlots([]);
  };

  // Month navigation (for header)
  const handleMonthChange = (direction) => {
    setStartDate(prev => {
      let year = prev.getFullYear();
      let month = prev.getMonth() + direction;
      if (month < 0) {
        month = 11;
        year -= 1;
      } else if (month > 11) {
        month = 0;
        year += 1;
      }
      
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      
      let targetDate = new Date(year, month, 1);
      if (targetDate.getFullYear() === todayDate.getFullYear() && targetDate.getMonth() === todayDate.getMonth()) {
        return todayDate;
      }
      if (targetDate < todayDate) {
        return todayDate;
      }
      return targetDate;
    });
  };

  // Days strip navigation (shifting by 5 days)
  const handleStripShift = (direction) => {
    setStartDate(prev => {
      const nextDate = new Date(prev);
      nextDate.setDate(nextDate.getDate() + direction * 5);
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      if (nextDate < todayDate) {
        return todayDate;
      }
      return nextDate;
    });
  };

  // Formatting month label
  const formatMonthLabel = (date) => {
    const monthsShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthName = monthsShort[date.getMonth()];
    const year = date.getFullYear();
    return `${monthName}, ${year}`;
  };

  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const isStripLeftDisabled = startDateOnly <= todayDateOnly;
  const isMonthLeftDisabled = startDate.getFullYear() === today.getFullYear() && startDate.getMonth() === today.getMonth();

  // Day names for strip
  const dayNamesShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Generate 5 days cells for horizontal datepicker strip
  const dayStripCells = [];
  const tempDate = new Date(startDate);
  for (let i = 0; i < 5; i++) {
    const cellDate = new Date(tempDate);
    const cellDateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;
    
    const isSelected = selectedDateStr === cellDateStr;
    const isToday = cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
    const dayName = dayNamesShort[cellDate.getDay()];
    const dayNum = String(cellDate.getDate()).padStart(2, "0");
    
    dayStripCells.push(
      <div
        key={cellDateStr}
        className={`day-strip-item ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
        onClick={() => {
          setSelectedDateStr(cellDateStr);
          setSelectedDate(cellDate);
          fetchSlotsForDate(cellDateStr, selectedWorkerId);
        }}
      >
        <span className="day-strip-name">{dayName}</span>
        <span className="day-strip-num">{dayNum}</span>
      </div>
    );
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Time Slots logic: Available, Selected, Occupied
  const standardHours = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00"
  ];
  // Merge API slots with standard hours to build a comprehensive list of statuses
  const allSlots = Array.from(new Set([...standardHours, ...slots])).sort();

  // Formatting date header for slots
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

  // Form phone and name validation
  const inputPhone = form.phone || form.clientPhone || "";
  const cleanedPhone = inputPhone.replace(/[\s\-+()]/g, '');
  const isPhoneValid = /^\d+$/.test(cleanedPhone) && cleanedPhone.length >= 8;
  
  const finalClientName = form.clientName || `${form.firstName || ""} ${form.lastName || ""}`.trim();
  const isFormValid = finalClientName.trim() !== "" && isPhoneValid;

  // Confirm booking POST execution (dual-payload)
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setSubmitting(true);
      setBookingError("");

      const splitName = finalClientName.trim().split(" ");
      const firstNameVal = form.firstName || splitName[0] || "Cliente";
      const lastNameVal = form.lastName || splitName.slice(1).join(" ") || "SaaS";

      // Build payload matching both schemas
      const payload = {
        // Express backend properties
        firstName: firstNameVal,
        lastName: lastNameVal,
        phone: inputPhone.trim(),
        email: (form.email || form.clientEmail || "").trim() || null,
        notes: form.notes.trim() || null,
        serviceId: selectedServices.map(s => s.id).join(","),
        professionalId: selectedWorkerId,
        date: selectedDateStr,
        time: selectedSlot,

        // Alternative schema requested
        clientName: finalClientName.trim(),
        clientPhone: inputPhone.trim(),
        clientEmail: (form.email || form.clientEmail || "").trim() || "",
        serviceIds: selectedServices.map(s => s.id),
        workerId: selectedWorkerId,
        startsAt: selectedDateStr && selectedSlot ? new Date(`${selectedDateStr}T${selectedSlot}:00`).toISOString() : ""
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
      changeStep(5); // Transition to success step
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
    
    const sorted = [...createdBookings].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    const firstAppt = sorted[0];
    const lastAppt = sorted[sorted.length - 1];
    
    const start = new Date(firstAppt.startsAt);
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

  const handleReset = () => {
    setStep(1);
    setSelectedServices([]);
    setSelectedWorkerId("any");
    setSelectedDate(null);
    setSelectedDateStr("");
    setSlots([]);
    setSelectedSlot(null);
    setForm({
      clientName: "",
      firstName: "",
      lastName: "",
      phone: "",
      clientPhone: "",
      email: "",
      clientEmail: "",
      notes: ""
    });
    setCreatedBookings(null);
    setBookingError("");
  };

  // Step header details matching modern calendar icon + title layout
  const getStepHeader = () => {
    switch(step) {
      case 1:
        return {
          title: "Elegí tu servicio",
          subtitle: "Selecciona uno o más servicios que deseas reservar.",
          icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          )
        };
      case 2:
        return {
          title: "Elegí el profesional",
          subtitle: "Selecciona quién realizará tu atención.",
          icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )
        };
      case 3:
        return {
          title: "Fecha y hora",
          subtitle: "Selecciona el día y horario de tu reserva.",
          icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )
        };
      case 4:
        return {
          title: "Tus Datos",
          subtitle: "Completa tus datos personales para finalizar.",
          icon: (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          )
        };
      default:
        return { title: "", subtitle: "", icon: null };
    }
  };

  // Loading skeleton state
  if (loadingData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="skeleton-block" style={{ height: "4px", width: "100%", borderRadius: "10px" }} />
        <div className="skeleton-block" style={{ height: "40px", width: "75%", borderRadius: "8px" }} />
        <div className="skeleton-block" style={{ height: "80px", width: "100%", borderRadius: "16px" }} />
        <div className="skeleton-block" style={{ height: "80px", width: "100%", borderRadius: "16px" }} />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
        <p style={{ color: "#ef4444", fontWeight: "700" }}>{errorMsg}</p>
        <button className="back-button" onClick={handleReset} style={{ marginTop: "16px", width: "100%" }}>
          Reintentar
        </button>
      </div>
    );
  }

  // Filter services by search term and tab category
  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === "Todos" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const headerDetails = getStepHeader();

  // Stack of workers overlapping avatars (Step 2)
  const workerAvatars = eligibleWorkers.slice(0, 3);
  const workerRemaining = eligibleWorkers.length - 3;

  return (
    <div className="booking-form-wrapper" style={{ "--brand-color": brandColor, "--brand-color-rgb": brandColorRgb }}>
      <style>{`
        .booking-form-wrapper {
          position: relative;
          color: #1e293b;
        }

        /* Segmented Progress Bar */
        .progress-bar-container {
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
          padding: 0 4px;
        }
        .progress-segment {
          flex-grow: 1;
          height: 5px;
          border-radius: 99px;
          background: #e2e8f0;
          transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .progress-segment.active {
          background: var(--brand-color);
        }

        /* Step Header */
        .step-header-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 20px;
          padding: 0 4px;
        }
        .step-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
        }
        .step-title-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-color);
        }
        .step-title-text {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .step-subtitle-text {
          font-size: 13px;
          color: #8e8e93;
          margin: 0;
          font-weight: 500;
        }

        /* Category tabs horizontal scrolling */
        .category-tabs-container {
          display: flex;
          overflow-x: auto;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1.5px solid #e2e8f0;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
        }
        .category-tabs-container::-webkit-scrollbar {
          display: none;
        }
        .category-tab {
          background: transparent;
          border: none;
          padding: 6px 2px;
          font-size: 13.5px;
          font-weight: 700;
          color: #8e8e93;
          cursor: pointer;
          white-space: nowrap;
          position: relative;
          transition: color 0.2s ease;
          outline: none;
        }
        .category-tab.active {
          color: #0f172a;
        }
        .category-tab.active::after {
          content: '';
          position: absolute;
          bottom: -9.5px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--brand-color);
          border-radius: 2px 2px 0 0;
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
          color: #8e8e93;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 14px;
          border: 2px solid #e5e5ea;
          font-size: 14px;
          transition: all 0.2s ease;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          background: #ffffff;
        }
        .search-input:focus {
          border-color: var(--brand-color);
        }

        /* Service Cards - soft pastel color rotation */
        .services-list-container {
          padding-bottom: 110px; /* Spacer for bottom bar */
        }
        .service-card {
          padding: 18px;
          border-radius: 16px;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 12px;
          position: relative;
        }
        .service-card:hover {
          transform: translateY(-2px);
        }
        .service-card.selected {
          border-color: var(--brand-color);
          box-shadow: 0 6px 20px rgba(var(--brand-color-rgb), 0.08);
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
          font-weight: 800;
          font-size: 15px;
          color: #0f172a;
          line-height: 1.35;
          margin: 0;
        }
        .service-price {
          font-weight: 800;
          font-size: 15.5px;
          color: #0f172a;
          white-space: nowrap;
        }
        .service-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.45;
          margin: 0 0 10px 0;
        }
        .service-badge-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .service-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.6);
          color: #475569;
        }
        .service-card.selected .service-badge {
          background: #ffffff;
          color: var(--brand-color);
        }
        
        /* Select indicator at the right of cards */
        .select-check-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .service-card.selected .select-check-circle,
        .worker-card.selected-expanded .select-check-circle {
          border-color: var(--brand-color);
          background: var(--brand-color);
        }
        .select-check-circle svg {
          fill: none;
          stroke: #ffffff;
          stroke-width: 3.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          width: 10px;
          height: 10px;
          display: none;
        }
        .service-card.selected .select-check-circle svg,
        .worker-card.selected-expanded .select-check-circle svg {
          display: block;
        }

        /* Dynamic overlap avatars (Paso 2) */
        .overlap-avatars-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
        }
        .overlap-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid #ffffff;
          margin-left: -9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          color: #0f172a;
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        }
        .overlap-avatar:first-child {
          margin-left: 0;
        }
        .overlap-avatar.badge-avatar {
          background: #475569;
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
        }

        /* Professional Selector list */
        .professional-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .worker-card {
          padding: 16px 20px;
          border-radius: 16px;
          background: #ffffff;
          border: 2px solid #e5e5ea;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .worker-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          border-color: #cbd5e1;
        }
        .worker-card.selected-expanded {
          border-color: var(--brand-color);
          box-shadow: 0 6px 20px rgba(var(--brand-color-rgb), 0.08);
          align-items: flex-start;
          flex-direction: column;
        }
        .worker-main-row {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
        }
        .worker-avatar-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          border: 2px solid transparent;
        }
        .worker-card.selected-expanded .worker-avatar-circle {
          background: #ffffff;
          color: var(--brand-color);
          border-color: var(--brand-color);
        }
        .worker-identity {
          flex-grow: 1;
        }
        .worker-name-title {
          font-weight: 800;
          font-size: 15px;
          color: #0f172a;
          margin: 0;
        }
        .worker-role-title {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 600;
          margin: 0;
        }
        .worker-details-area {
          width: 100%;
          padding-top: 12px;
          border-top: 1.5px dashed rgba(255, 255, 255, 0.4);
          font-size: 12.5px;
          color: #475569;
          line-height: 1.45;
          margin-top: 8px;
        }

        /* Schedule/Calendar Strip Styling */
        .calendar-wrapper {
          border: 2px solid #f1f5f9;
          border-radius: 24px;
          padding: 20px;
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.01);
        }
        .month-selector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f2f2f7;
          border-radius: 14px;
          padding: 8px 12px;
          margin-bottom: 20px;
        }
        .month-nav-btn {
          background: #ffffff;
          border: 1px solid #e5e5ea;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #475569;
          font-weight: 800;
          font-size: 14px;
          outline: none;
        }
        .month-nav-btn:hover:not(:disabled) {
          background: #f2f2f7;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .month-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .month-label {
          font-weight: 800;
          font-size: 14.5px;
          color: #1c1c1e;
        }

        .days-strip-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .strip-nav-btn {
          background: #ffffff;
          border: 1px solid #e5e5ea;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #475569;
          font-weight: 800;
          font-size: 13px;
          outline: none;
        }
        .strip-nav-btn:hover:not(:disabled) {
          background: #f2f2f7;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .strip-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        
        .days-strip-list {
          display: flex;
          justify-content: space-between;
          flex-grow: 1;
          gap: 6px;
        }
        .day-strip-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 78px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          border: 1.5px solid #e5e5ea;
        }
        .day-strip-item:hover:not(.selected) {
          background: #f2f2f7;
        }
        .day-strip-item.selected {
          background: var(--brand-color);
          color: #ffffff;
          border-color: var(--brand-color);
          box-shadow: 0 6px 16px rgba(var(--brand-color-rgb), 0.3);
        }
        .day-strip-item.today:not(.selected) {
          border: 2px solid var(--brand-color);
        }
        .day-strip-name {
          font-size: 10.5px;
          font-weight: 700;
          color: #8e8e93;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .day-strip-item.selected .day-strip-name {
          color: rgba(255, 255, 255, 0.85);
        }
        .day-strip-num {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
        }
        .day-strip-item.selected .day-strip-num {
          color: #ffffff;
        }

        /* Pill rounded Time slots */
        .slots-container {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px dashed #f1f5f9;
        }
        .slots-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .slot-pill {
          padding: 10px 4px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          outline: none;
        }
        .slot-pill.available {
          background: #ffffff;
          color: #334155;
          border: 1.5px solid #cbd5e1;
        }
        .slot-pill.available:hover {
          border-color: #94a3b8;
          background: #f8fafc;
        }
        .slot-pill.selected {
          background: var(--brand-color);
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(var(--brand-color-rgb), 0.2);
        }
        .slot-pill.occupied {
          background: #f1f5f9;
          color: #cbd5e1;
          text-decoration: line-through;
          cursor: not-allowed;
        }

        /* Outlined tags matching MARKETING layout */
        .outlined-badge {
          border: 1px solid var(--brand-color);
          color: var(--brand-color);
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          display: inline-block;
          letter-spacing: 0.5px;
        }

        /* Review summary card */
        .summary-card {
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .summary-title {
          font-weight: 800;
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
          font-size: 12.5px;
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
          border: 2px solid #e5e5ea;
          background: #ffffff;
          font-size: 14.5px;
          transition: all 0.2s ease;
          color: #0f172a;
          box-sizing: border-box;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--brand-color);
        }
        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        .validation-warning {
          font-size: 11.5px;
          color: #8e8e93;
          margin-top: 4px;
        }

        /* Action footers */
        .footer-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          gap: 12px;
        }
        .back-button {
          background: #ffffff;
          color: #475569;
          border: 2px solid #e5e5ea;
          padding: 14px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }
        .back-button:hover {
          background: #f2f2f7;
          border-color: #cbd5e1;
        }

        .error-banner {
          background: #fef2f2;
          border: 2px solid #fecaca;
          color: #991b1b;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13.5px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Mobile bottom fixed summary panel */
        .sticky-summary {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          border-radius: 24px 24px 0 0;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          box-shadow: 0 -8px 25px rgba(0, 0, 0, 0.06);
          box-sizing: border-box;
        }
        .summary-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .summary-text {
          font-size: 12px;
          font-weight: 700;
          color: #8e8e93;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-total {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
        }
        .next-button {
          background: var(--brand-color);
          color: #ffffff;
          border: none;
          padding: 14px 26px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 14.5px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(var(--brand-color-rgb), 0.2);
          outline: none;
        }
        .next-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(var(--brand-color-rgb), 0.3);
        }
        .next-button:disabled {
          background: #e5e5ea;
          color: #8e8e93;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Success screen checkmark animations */
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
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          margin-top: 24px;
          box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
          outline: none;
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
          border: 2px solid #e5e5ea;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          outline: none;
        }
        .another-booking-btn:hover {
          background: #f2f2f7;
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

        /* Slide Transition Animations */
        .slide-container {
          animation-duration: 0.35s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-fill-mode: forwards;
        }
        .slide-forward {
          animation-name: slideForward;
        }
        .slide-backward {
          animation-name: slideBackward;
        }
        @keyframes slideForward {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideBackward {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Segmented Progress Bar */}
      {step <= 4 && (
        <div className="progress-bar-container">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className={`progress-segment ${step >= idx ? "active" : ""}`} />
          ))}
        </div>
      )}

      {/* Dynamic Header */}
      {step <= 4 && headerDetails.title && (
        <div className="step-header-container">
          <div className="step-title-row">
            <span className="step-title-icon">{headerDetails.icon}</span>
            <h2 className="step-title-text">{headerDetails.title}</h2>
          </div>
          <p className="step-subtitle-text">{headerDetails.subtitle}</p>
        </div>
      )}

      {/* STEP 1: SELECT SERVICES */}
      {step === 1 && (
        <div className={`slide-container slide-${direction}`} key="step1">
          {/* Categories Tab selector */}
          <div className="category-tabs-container">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`category-tab ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

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

          <div className="services-list-container">
            {filteredServices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "#8e8e93", fontSize: "14px" }}>
                Ningún servicio coincide con tu selección.
              </div>
            ) : (
              filteredServices.map((service, index) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <div
                    key={service.id}
                    className={`service-card ${isSelected ? "selected" : ""}`}
                    style={{ backgroundColor: getPastelBg(index) }}
                    onClick={() => toggleService(service)}
                  >
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
                      <div className="service-badge-container">
                        <span className="service-badge">
                          ⏱ {service.duration || 30} min
                        </span>
                        {service.category && (
                          <span className="outlined-badge">
                            {service.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="select-check-circle" style={{ marginLeft: "10px", marginTop: "2px" }}>
                      <svg viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Fixed bottom panel */}
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
              onClick={() => changeStep(2)}
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
        <div className={`slide-container slide-${direction}`} key="step2">
          {/* Superposed avatars */}
          {eligibleWorkers.length > 0 && (
            <div className="overlap-avatars-container">
              {workerAvatars.map((worker, index) => {
                const initials = `${worker.firstName?.charAt(0) || ""}${worker.lastName?.charAt(0) || ""}`.toUpperCase();
                return (
                  <div 
                    key={worker.id} 
                    className="overlap-avatar"
                    style={{ zIndex: 5 - index, backgroundColor: getPastelBg(index) }}
                  >
                    {initials}
                  </div>
                );
              })}
              {workerRemaining > 0 && (
                <div className="overlap-avatar badge-avatar" style={{ zIndex: 0 }}>
                  +{workerRemaining}
                </div>
              )}
            </div>
          )}

          {eligibleWorkers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div className="error-banner">
                ⚠️ Ninguno de nuestros profesionales realiza todos los servicios seleccionados al mismo tiempo.
              </div>
              <button type="button" className="back-button" onClick={() => changeStep(1)} style={{ width: "100%" }}>
                Volver a Servicios
              </button>
            </div>
          ) : (
            <>
              <div className="professional-list">
                {/* Any/No Preference Worker Card */}
                <div 
                  className={`worker-card ${selectedWorkerId === "any" ? "selected-expanded" : ""}`}
                  style={{ backgroundColor: selectedWorkerId === "any" ? getPastelBg(3) : "#ffffff" }}
                  onClick={() => handleWorkerChange("any")}
                >
                  <div className="worker-main-row">
                    <div className="worker-avatar-circle">✨</div>
                    <div className="worker-identity">
                      <h4 className="worker-name-title">Sin preferencia</h4>
                      <p className="worker-role-title">Asignar al profesional libre más rápido</p>
                    </div>
                    <div className="select-check-circle">
                      <svg viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  {selectedWorkerId === "any" && (
                    <div className="worker-details-area">
                      Buscaremos al profesional de nuestro equipo que tenga disponibilidad para la combinación de todos tus servicios en el horario que elijas.
                    </div>
                  )}
                </div>

                {/* Normal Professional Cards */}
                {eligibleWorkers.map((worker, index) => {
                  const initials = `${worker.firstName?.charAt(0) || ""}${worker.lastName?.charAt(0) || ""}`.toUpperCase();
                  const isSelected = selectedWorkerId === worker.id;
                  
                  // Get names of services this worker can perform
                  const workerServicesList = services
                    .filter(s => worker.serviceIds.includes(s.id))
                    .map(s => s.name)
                    .slice(0, 3)
                    .join(", ");

                  return (
                    <div 
                      key={worker.id}
                      className={`worker-card ${isSelected ? "selected-expanded" : ""}`}
                      style={{ backgroundColor: isSelected ? getPastelBg(index) : "#ffffff" }}
                      onClick={() => handleWorkerChange(worker.id)}
                    >
                      <div className="worker-main-row">
                        <div className="worker-avatar-circle">{initials}</div>
                        <div className="worker-identity">
                          <h4 className="worker-name-title">{worker.name}</h4>
                          <p className="worker-role-title">{worker.roleTitle || "Profesional"}</p>
                        </div>
                        <div className="select-check-circle">
                          <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="worker-details-area">
                          <strong>Especialista en:</strong> {workerServicesList} {worker.serviceIds.length > 3 ? "y más." : "."}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="footer-actions">
                <button type="button" className="back-button" onClick={() => changeStep(1)}>
                  Atrás
                </button>
                <button 
                  type="button" 
                  className="next-button"
                  onClick={() => changeStep(3)}
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

      {/* STEP 3: DATE AND SLOTS */}
      {step === 3 && (
        <div className={`slide-container slide-${direction}`} key="step3">
          <div className="calendar-wrapper">
            {/* Month selector centrado styled Aug, 2023 style */}
            <div className="month-selector">
              <button 
                type="button" 
                className="month-nav-btn" 
                onClick={() => handleMonthChange(-1)}
                disabled={isMonthLeftDisabled}
              >
                &lt;
              </button>
              <div className="month-label">
                {formatMonthLabel(startDate)}
              </div>
              <button 
                type="button" 
                className="month-nav-btn" 
                onClick={() => handleMonthChange(1)}
              >
                &gt;
              </button>
            </div>

            {/* Days strip view with navigation */}
            <div className="days-strip-container">
              <button
                type="button"
                className="strip-nav-btn"
                onClick={() => handleStripShift(-1)}
                disabled={isStripLeftDisabled}
              >
                &lt;
              </button>
              <div className="days-strip-list">
                {dayStripCells}
              </div>
              <button
                type="button"
                className="strip-nav-btn"
                onClick={() => handleStripShift(1)}
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Time Slots area */}
          {loadingSlots ? (
            <div className="slots-container">
              <div className="skeleton-block" style={{ height: "20px", width: "40%", marginBottom: "12px", borderRadius: "6px" }} />
              <div className="slots-grid">
                <div className="skeleton-block" style={{ height: "38px", borderRadius: "999px" }} />
                <div className="skeleton-block" style={{ height: "38px", borderRadius: "999px" }} />
                <div className="skeleton-block" style={{ height: "38px", borderRadius: "999px" }} />
                <div className="skeleton-block" style={{ height: "38px", borderRadius: "999px" }} />
              </div>
            </div>
          ) : selectedDateStr ? (
            slots.length === 0 ? (
              <div className="slots-container" style={{ textAlign: "center", padding: "20px 0", color: "#ef4444", fontWeight: "700" }}>
                ⚠️ No hay horarios disponibles para el {formatSelectedDateHeader(selectedDateStr)}.
              </div>
            ) : (
              <div className="slots-container">
                <div style={{ fontWeight: "800", fontSize: "14px", color: "#0f172a", marginBottom: "12px" }}>
                  Horarios para el {formatSelectedDateHeader(selectedDateStr)}:
                </div>
                <div className="slots-grid">
                  {allSlots.map(slot => {
                    const isAvailable = slots.includes(slot);
                    const isSelected = selectedSlot === slot;
                    
                    let slotClass = "slot-pill ";
                    if (isSelected) slotClass += "selected";
                    else if (isAvailable) slotClass += "available";
                    else slotClass += "occupied";

                    return (
                      <button
                        key={slot}
                        type="button"
                        className={slotClass}
                        disabled={!isAvailable}
                        onClick={() => isAvailable && setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "#8e8e93", fontSize: "14px" }}>
              Selecciona un día disponible en la cinta de fechas.
            </div>
          )}

          <div className="footer-actions">
            <button type="button" className="back-button" onClick={() => changeStep(2)}>
              Atrás
            </button>
            <button 
              type="button" 
              className="next-button"
              disabled={!selectedDateStr || !selectedSlot}
              onClick={() => changeStep(4)}
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
        <form onSubmit={handleConfirmBooking} className={`slide-container slide-${direction}`} key="step4">
          <div className="summary-card">
            <h3 className="summary-title">Resumen del Turno</h3>
            <div className="summary-item" style={{ alignItems: "center" }}>
              <span>Servicios:</span>
              <div style={{ textAlign: "right" }}>
                <strong style={{ display: "block" }}>{selectedServices.map(s => s.name).join(", ")}</strong>
                <button
                  type="button"
                  onClick={() => changeStep(1)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--brand-color)",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    padding: "2px 0 0 0",
                    textDecoration: "underline",
                    outline: "none"
                  }}
                >
                  + Agregar/Cambiar servicios
                </button>
              </div>
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
            <label className="form-label">Nombre y Apellido *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Tu nombre completo"
              value={form.clientName}
              required
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono móvil *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Ej: 1123456789"
              value={form.phone || form.clientPhone}
              required
              onChange={(e) => setForm({ ...form, phone: e.target.value, clientPhone: e.target.value })}
            />
            <div className="validation-warning">
              {!inputPhone ? "Requerido para recordatorios por WhatsApp" : 
                isPhoneValid ? "✓ Teléfono válido" : "⚠️ Debe contener solo números y al menos 8 dígitos"}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email (Opcional)</label>
            <input
              type="email"
              className="form-input"
              placeholder="tuemail@correo.com"
              value={form.email || form.clientEmail}
              onChange={(e) => setForm({ ...form, email: e.target.value, clientEmail: e.target.value })}
            />
            <div className="validation-warning" style={{ color: "#8e8e93" }}>
              Para recibir la confirmación por correo electrónico
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas o Aclaraciones (Opcional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Escribe alguna aclaración si la necesitas..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="footer-actions">
            <button type="button" className="back-button" onClick={() => changeStep(3)} disabled={submitting}>
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
          <h2 className="step-title" style={{ color: "#10b981", fontWeight: "900" }}>¡Reserva Confirmada!</h2>
          <p style={{ color: "#8e8e93", fontSize: "14.5px", lineHeight: "1.5", margin: "8px 0 24px", fontWeight: "500" }}>
            {business.bookingConfirmationMessage || "¡Tu reserva ha sido confirmada con éxito!"}
          </p>

          <div className="details-box">
            <div style={{ fontWeight: "800", color: "#0f172a", marginBottom: "8px", fontSize: "13.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Detalles:</div>
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
