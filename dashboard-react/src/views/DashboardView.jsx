import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button, Container, Row, Col, Spinner, Alert, Form, InputGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  CreditCard,
  Users,
  XCircle,
  Percent,
  Award,
  Search,
  Plus,
  LayoutGrid,
  Sparkles,
  Bell,
} from "lucide-react";
import api from "../lib/api.js";
import { useBrand } from "../header/name/BrandProvider";

// Componentes
import DashboardGrid from "../components/dashboard/DashboardGrid";
import WidgetSettingsModal from "../components/dashboard/WidgetSettingsModal";
import AIChatFloating from "../gadgets/ai/AIChatFloating";
import KPIWidget from "../components/dashboard/KPIWidget";
import SaaSMetricsGrid from "../components/dashboard/SaaSMetricsGrid";
import AppointmentModal from "../gadgets/appointments/AppointmentModal";
import ClientModal from "../header/clients/ClientModal";
import SmartReports from "../components/dashboard/SmartReports";
import { getWidgetTypes, getMetricOptions } from "../components/dashboard/WidgetRegistry";

// Formato de moneda ARS
function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function DashboardView() {
  const { brand } = useBrand();
  const { t, i18n } = useTranslation(["dashboard", "common"]);
  const isEs = i18n && i18n.language ? i18n.language === "es" : true;

  const currency = (n) => new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
    style: "currency",
    currency: isEs ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

  const [widgets, setWidgets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);

  // Estados de carga y modal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);

  // Búsqueda global
  const [searchQuery, setSearchQuery] = useState("");

  // Modales de creación
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // --- Carga unificada de datos del negocio y widgets ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [wRes, apptRes, clientRes, workerRes, serviceRes] = await Promise.all([
        api.get("/dashboard/widgets"),
        api.get("/appointments"),
        api.get("/clients"),
        api.get("/workers"),
        api.get("/services"),
      ]);

      setWidgets(Array.isArray(wRes.data) ? wRes.data : []);
      setAppointments(Array.isArray(apptRes.data) ? apptRes.data : []);
      setClients(Array.isArray(clientRes.data) ? clientRes.data : []);
      setWorkers(Array.isArray(workerRes.data) ? workerRes.data : []);
      setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);
    } catch (e) {
      console.error("Error cargando datos del dashboard:", e);
      setError(t("errors.loadData"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Saludo Dinámico y Fecha ---
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return t("header.greetingMorning");
    if (hrs < 19) return t("header.greetingAfternoon");
    return t("header.greetingEvening");
  };

  const getFormattedDate = () => {
    const locale = isEs ? "es-AR" : "en-US";
    return new Date().toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // --- Cálculos de KPIs Superiores ---
  const stats = useMemo(() => {
    // Helper para obtener string YYYY-MM-DD en hora local
    const getLocalDateStr = (d) => {
      const dateObj = new Date(d);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateStr(new Date());

    // Citas de hoy
    const todayAppts = appointments.filter((a) => {
      const date = getLocalDateStr(a.startsAt);
      return date === todayStr;
    });

    // Citas ayer (para comparación de tendencia)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);
    const yesterdayAppts = appointments.filter((a) => {
      const date = getLocalDateStr(a.startsAt);
      return date === yesterdayStr;
    });

    // 1. Citas Hoy
    const apptsTodayCount = todayAppts.filter((a) => a.status !== "CANCELLED").length;
    const apptsYesterdayCount = yesterdayAppts.filter((a) => a.status !== "CANCELLED").length;
    let apptsTrend = "neutral";
    let apptsDiffPercent = 0;
    if (apptsYesterdayCount > 0) {
      apptsDiffPercent = Math.round(((apptsTodayCount - apptsYesterdayCount) / apptsYesterdayCount) * 100);
      apptsTrend = apptsDiffPercent > 0 ? "up" : apptsDiffPercent < 0 ? "down" : "neutral";
    } else if (apptsTodayCount > 0) {
      apptsDiffPercent = 100;
      apptsTrend = "up";
    }

    // 2. Ingresos Hoy
    const revenueToday = todayAppts.filter((a) => a.status !== "CANCELLED").reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
    const revenueYesterday = yesterdayAppts.filter((a) => a.status !== "CANCELLED").reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
    let revTrend = "neutral";
    let revDiffPercent = 0;
    if (revenueYesterday > 0) {
      revDiffPercent = Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100);
      revTrend = revDiffPercent > 0 ? "up" : revDiffPercent < 0 ? "down" : "neutral";
    } else if (revenueToday > 0) {
      revDiffPercent = 100;
      revTrend = "up";
    }

    // 3. Clientes Activos
    const uniqueClientsCount = clients.length;

    // 4. Cancelaciones Hoy
    const cancellationsToday = todayAppts.filter((a) => a.status === "CANCELLED").length;

    // 5. Ocupación Estimada Hoy
    const totalToday = todayAppts.length;
    const activeToday = todayAppts.filter((a) => ["CONFIRMED", "DONE", "IN_PROCESS"].includes(a.status)).length;
    const occupancyRate = totalToday > 0 ? Math.round((activeToday / totalToday) * 100) : 0;

    // 6. Profesional top
    const workerApptCounts = {};
    appointments.filter((a) => a.status !== "CANCELLED").forEach((a) => {
      const name = a.worker ? `${a.worker.firstName} ${a.worker.lastName}`.trim() : null;
      if (name) {
        workerApptCounts[name] = (workerApptCounts[name] || 0) + 1;
      }
    });
    let topWorkerName = t("kpis.none");
    let topWorkerCount = 0;
    Object.entries(workerApptCounts).forEach(([name, count]) => {
      if (count > topWorkerCount) {
        topWorkerCount = count;
        topWorkerName = name;
      }
    });

    return {
      apptsTodayCount,
      apptsDiffPercent: Math.abs(apptsDiffPercent),
      apptsTrend,
      revenueToday,
      revDiffPercent: Math.abs(revDiffPercent),
      revTrend,
      uniqueClientsCount,
      cancellationsToday,
      occupancyRate,
      topWorkerName,
      topWorkerCount,
    };
  }, [appointments, clients, t]);

  // --- Filtrado Reactivo de Citas y Clientes por Búsqueda ---
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter((a) => {
      const clientName = `${a.client?.firstName || ""} ${a.client?.lastName || ""}`.toLowerCase();
      const serviceName = (a.service?.name || "").toLowerCase();
      const workerName = `${a.worker?.firstName || ""} ${a.worker?.lastName || ""}`.toLowerCase();
      return clientName.includes(q) || serviceName.includes(q) || workerName.includes(q);
    });
  }, [appointments, searchQuery]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((c) => {
      const clientName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return clientName.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [clients, searchQuery]);

  // --- Filtrado Reactivo de Widgets por Búsqueda ---
  const filteredWidgets = useMemo(() => {
    if (!searchQuery.trim()) return widgets;
    const q = searchQuery.toLowerCase();
    const widgetTypes = getWidgetTypes ? getWidgetTypes(isEs) : {};
    const metricOptions = getMetricOptions ? getMetricOptions(isEs) : [];

    const result = [];

    for (const w of widgets) {
      if (!w) continue;

      let metadataMatch = false;

      // 1. Coincidencia por título del widget
      if (w.title && w.title.toLowerCase().includes(q)) {
        metadataMatch = true;
      }

      // 2. Coincidencia por tipo de widget (su etiqueta o descripción traducida)
      if (!metadataMatch) {
        const typeInfo = widgetTypes[w.type];
        if (typeInfo) {
          if (typeInfo.label && typeInfo.label.toLowerCase().includes(q)) metadataMatch = true;
          if (typeInfo.description && typeInfo.description.toLowerCase().includes(q)) metadataMatch = true;
        }
      }

      // 3. Coincidencia por métrica configurada (ej. "Ingresos", "Ocupación")
      if (!metadataMatch && w.config?.metric) {
        const opt = metricOptions.find((o) => o.value === w.config.metric);
        if (opt && opt.label && opt.label.toLowerCase().includes(q)) metadataMatch = true;
      }

      if (metadataMatch) {
        // Si coincide por metadatos, mostramos el widget con todos sus datos originales
        result.push({
          ...w,
          appointmentsData: appointments,
          clientsData: clients,
        });
        continue;
      }

      // 4. Coincidencia por datos internos del widget
      let dataMatch = false;
      let matchedAppts = [];
      let matchedClients = [];

      if (w.type === "calendar" || w.type === "table" || w.type === "attention" || w.type === "activity") {
        // Obtenemos las citas filtradas por el rango temporal del propio widget
        const range = w.config?.range || "ALL";
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const widgetAppointments = appointments.filter((a) => {
          if (!a || !a.startsAt) return false;
          const date = new Date(a.startsAt);
          if (range === "TODAY") return date >= startOfToday;
          if (range === "THIS_WEEK") {
            const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 24 * 60 * 60 * 1000);
            return date >= startOfWeek;
          }
          if (range === "THIS_MONTH") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return date >= startOfMonth;
          }
          if (range === "LAST_30_DAYS") {
            const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
            return date >= thirtyDaysAgo;
          }
          if (range === "THIS_YEAR") {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            return date >= startOfYear;
          }
          return true;
        });

        matchedAppts = widgetAppointments.filter((a) => {
          if (!a) return false;
          const clientName = `${a.client?.firstName || ""} ${a.client?.lastName || ""}`.toLowerCase();
          const serviceName = String(a.service?.name || "").toLowerCase();
          const workerName = `${a.worker?.firstName || ""} ${a.worker?.lastName || ""}`.toLowerCase();
          const notes = String(a.notes || "").toLowerCase();
          return (
            clientName.includes(q) ||
            serviceName.includes(q) ||
            workerName.includes(q) ||
            notes.includes(q)
          );
        });

        if (matchedAppts.length > 0) {
          dataMatch = true;
        }

        if (w.type === "activity") {
          matchedClients = clients.filter((c) => {
            if (!c) return false;
            const clientName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
            const email = String(c.email || "").toLowerCase();
            const phone = String(c.phone || "").toLowerCase();
            return clientName.includes(q) || email.includes(q) || phone.includes(q);
          });
          if (matchedClients.length > 0) {
            dataMatch = true;
          }
        }
      }

      if (w.type === "chart") {
        if (w.config?.metric === "services_sales") {
          const hasMatchingService = services.some((s) => s && String(s.name || "").toLowerCase().includes(q));
          if (hasMatchingService) dataMatch = true;
        }
        if (w.config?.metric === "workers_load") {
          const hasMatchingWorker = workers.some((wk) =>
            wk && `${wk.firstName || ""} ${wk.lastName || ""}`.toLowerCase().includes(q)
          );
          if (hasMatchingWorker) dataMatch = true;
        }
        // Para gráficos, pasamos las citas filtradas si coincide
        if (dataMatch) {
          matchedAppts = filteredAppointments;
        }
      }

      if (w.type === "ai_insight") {
        const insightsList = [
          "ingresos bajaron 18%", "promoción", "Laura Pérez", "Balayage", "uñas",
          "Andrea", "retención de clientes", "sábados", "ocupación", "Jueves", "2x1", "descuento",
          "nutrición gratis", "estilista"
        ];
        if (insightsList.some((text) => text.toLowerCase().includes(q))) {
          dataMatch = true;
          matchedAppts = filteredAppointments;
        }
      }

      if (dataMatch) {
        result.push({
          ...w,
          appointmentsData: matchedAppts,
          clientsData: matchedClients.length > 0 ? matchedClients : clients,
        });
      }
    }

    return result;
  }, [widgets, searchQuery, appointments, clients, workers, services, filteredAppointments, isEs]);

  // --- Operaciones de Widgets ---
  const handleSaveWidget = async (widgetData) => {
    try {
      if (widgetData.id) {
        const res = await api.put(`/dashboard/widgets/${widgetData.id}`, widgetData);
        setWidgets((prev) => prev.map((w) => (w.id === widgetData.id ? res.data : w)));
      } else {
        const res = await api.post("/dashboard/widgets", widgetData);
        setWidgets((prev) => [...prev, res.data]);
      }
    } catch (e) {
      console.error("Error guardando widget:", e);
      alert(t("errors.saveWidget"));
    }
  };

  const handleAddAiSuggestedWidget = async (aiWidget) => {
    try {
      const res = await api.post("/dashboard/widgets", {
        title: aiWidget.title,
        type: aiWidget.type,
        config: aiWidget.config,
        layout: aiWidget.layout || { w: 6, h: 4 },
      });
      setWidgets((prev) => [...prev, res.data]);
    } catch (e) {
      console.error("Error al agregar widget de IA:", e);
      alert(t("errors.aiWidget"));
    }
  };

  const handleUpdateLayouts = async (reorderedWidgets, saveToBackend = true) => {
    setWidgets(reorderedWidgets);
    if (!saveToBackend) return;
    try {
      const layoutsPayload = reorderedWidgets.map((w) => ({
        id: w.id,
        layout: w.layout,
      }));
      await api.put("/dashboard/widgets/layout", { layouts: layoutsPayload });
    } catch (e) {
      console.error("Error guardando layouts:", e);
    }
  };

  const handleDeleteWidget = async (id) => {
    if (!window.confirm(t("confirm.deleteWidget"))) return;
    try {
      await api.delete(`/dashboard/widgets/${id}`);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      console.error("Error eliminando widget:", e);
      alert(t("errors.deleteWidget"));
    }
  };

  // --- Lógica del Estado de Citas ---
  const handleUpdateAppointmentStatus = async (apptId, newStatus) => {
    try {
      const appt = appointments.find((a) => a.id === apptId);
      if (!appt) return;

      await api.put(`/appointments/${apptId}`, {
        clientId: appt.clientId,
        serviceId: appt.serviceId,
        workerId: appt.workerId,
        startsAt: appt.startsAt,
        notes: appt.notes,
        status: newStatus,
      });

      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a))
      );
    } catch (e) {
      console.error("Error actualizando estado de la cita:", e);
      alert(t("errors.updateStatus"));
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: "80vh" }}>
        <Spinner animation="border" className="text-primary mb-3" />
        <p className="text-muted small">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-view pb-5">
      {/* 1. HEADER PRINCIPAL */}
      <header
        className="mb-4 bg-white rounded-4 p-4 border shadow-sm d-flex flex-column gap-3"
        style={{ borderLeft: `4px solid ${brand.accentColor || "#10b981"}` }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1.5">
            <span className="fw-black text-muted uppercase smaller" style={{ tracking: "0.1em" }}>
              {brand.companyName || "Aura Studio"}
            </span>
            <div className="rounded-circle bg-success" style={{ width: "6px", height: "6px" }} />
            <span className="text-success small" style={{ fontSize: "11px", fontWeight: "600" }}>{t("header.operational")}</span>
          </div>
          <h1 className="fw-black text-dark h3 mb-1" style={{ letterSpacing: "-0.03em" }}>
            {getGreeting()}, {brand.userName || t("header.defaultUserName")}
          </h1>
          <p className="text-muted small mb-0 text-capitalize">
            {getFormattedDate()}
          </p>
        </div>

        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap border-top pt-3 w-100 mt-1">
          {/* Búsqueda Global */}
          <InputGroup style={{ maxWidth: "240px" }} className="modern-input-group shadow-sm">
            <InputGroup.Text className="bg-transparent border-0 pe-0 text-muted">
              <Search size={15} />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder={t("header.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 py-1.5 shadow-none small"
              style={{ fontSize: "12.5px" }}
            />
          </InputGroup>

          {/* Acciones Rápidas */}
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-dark"
              onClick={() => setShowClientModal(true)}
              className="rounded-pill px-3 py-2 small fw-bold d-flex align-items-center gap-1.5 hover-scale border"
              style={{ fontSize: "12px" }}
            >
              <Plus size={14} />
              <span>{t("header.quickActions.client")}</span>
            </Button>

            <Button
              variant="outline-dark"
              onClick={() => {
                setSelectedWidget(null);
                setShowConfigModal(true);
              }}
              className="rounded-pill px-3 py-2 small fw-bold d-flex align-items-center gap-1.5 hover-scale border"
              style={{ fontSize: "12px" }}
            >
              <Plus size={14} />
              <span>{t("header.quickActions.widget")}</span>
            </Button>

            <Button
              variant="dark"
              onClick={() => setShowAppointmentModal(true)}
              className="rounded-pill px-3 py-2 small fw-bold d-flex align-items-center gap-1.5 hover-scale btn-premium"
              style={{ fontSize: "12px", background: brand.accentColor || "#10b981", borderColor: brand.accentColor || "#10b981" }}
            >
              <Plus size={14} />
              <span>{t("header.quickActions.appointment")}</span>
            </Button>
          </div>
        </div>
      </header>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* 2. KPIs SUPERIORES (SaaSMetricsGrid con diseño oscuro premium) */}
      <SaaSMetricsGrid
        stats={stats}
        brand={brand}
        appointments={appointments}
        clients={clients}
        workers={workers}
      />

      {/* 3-7. GRID DE WIDGETS CONFIGURABLES (MÉTRICAS Y GADGETS ARRIBA) */}
      <Container fluid className="px-0">
        <DashboardGrid
          widgets={filteredWidgets}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
          appointments={filteredAppointments}
          clients={filteredClients}
          workers={workers}
          services={services}
          onUpdateLayouts={handleUpdateLayouts}
          onEditWidget={(w) => {
            setSelectedWidget(w);
            setShowConfigModal(true);
          }}
          onDeleteWidget={handleDeleteWidget}
          onOpenAddModal={() => {
            setSelectedWidget(null);
            setShowConfigModal(true);
          }}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onConfirmAppointment={(id) => handleUpdateAppointmentStatus(id, "CONFIRMED")}
          onViewCalendar={() => {
            // Desplazar a la agenda o similar
            const calendarWidgetEl = document.querySelector(".custom-table");
            if (calendarWidgetEl) {
              calendarWidgetEl.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onEditWorker={(id) => {
            alert(t("errors.configureScheduleHint"));
          }}
        />
      </Container>

      {/* SECCIÓN DE INFORMES INTELIGENTES Y COPILOT IA AL FINAL */}
      <Container fluid className="px-0">
        <SmartReports
          appointments={appointments}
          clients={clients}
          workers={workers}
          services={services}
          brand={brand}
        />
      </Container>

      {/* MODAL DE AJUSTES DE WIDGET */}
      <WidgetSettingsModal
        show={showConfigModal}
        onHide={() => setShowConfigModal(false)}
        onSave={handleSaveWidget}
        widget={selectedWidget}
      />

      {/* MODALES DE ACCIÓN RÁPIDA (CREACIÓN) */}
      <AppointmentModal
        show={showAppointmentModal}
        onHide={() => setShowAppointmentModal(false)}
        onSaved={fetchData}
      />

      <ClientModal
        show={showClientModal}
        onHide={() => setShowClientModal(false)}
        onSaved={fetchData}
      />

      {/* PANEL IA COPILOT FLOTANTE */}
      <AIChatFloating onAddWidget={handleAddAiSuggestedWidget} />
    </div>
  );
}
