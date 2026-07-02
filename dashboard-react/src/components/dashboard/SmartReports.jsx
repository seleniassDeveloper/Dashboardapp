import React, { useState, useMemo, useEffect } from "react";
import { Row, Col, Card, Button, Form, Table, Badge, Spinner, Alert, Modal, Dropdown } from "react-bootstrap";
import {
  Sparkles,
  Search,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Calendar,
  AlertTriangle,
  User,
  Percent,
  Download,
  Send,
  Bookmark,
  Package,
  CreditCard,
  XCircle,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  MessageSquare,
  MoreVertical,
  Edit2,
  Copy,
  RefreshCw,
  Trash2,
  BarChart2,
  Plus
} from "lucide-react";
import { HelpCircle, ChevronRight, Settings } from "lucide-react";
import { useBusinessModel } from "../../hooks/useBusinessModel.js";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import "../../styles/smart-reports.css";

// Helper de formato de moneda
function currencyHelper(n, isEs = true) {
  return new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
    style: "currency",
    currency: isEs ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// ---------------------------------------------------------
// DATA INICIAL PRE-ESTABLECIDA DE GADGETS
// ---------------------------------------------------------
// ---------------------------------------------------------
// DATA INICIAL PRE-ESTABLECIDA DE GADGETS (Valores iniciales limpios)
// ---------------------------------------------------------
const INITIAL_GADGETS_DATA = [
  {
    id: "gadget-kpi-1",
    title: "Facturación Mensual",
    type: "kpi",
    dataSource: "Ventas",
    period: "Este mes",
    groupBy: "Total",
    filter: "Ninguno",
    color: "#10b981",
    kpiValue: 0,
    kpiChange: "0%",
    kpiPositive: true,
    category: "Finanzas"
  },
  {
    id: "gadget-line-2",
    title: "Facturación últimos 12 meses",
    type: "line",
    dataSource: "Ventas",
    period: "Último año",
    groupBy: "Mes",
    filter: "Ninguno",
    color: "#8b5cf6",
    chartData: [],
    category: "Finanzas"
  },
  {
    id: "gadget-bar-3",
    title: "Servicios más vendidos",
    type: "bar",
    dataSource: "Servicios",
    period: "Este mes",
    groupBy: "Categoría",
    filter: "Solo finalizados",
    color: "#6d28d9",
    chartData: [],
    category: "Servicios"
  },
  {
    id: "gadget-dona-4",
    title: "Métodos de Pago",
    type: "dona",
    dataSource: "Ventas",
    period: "Este mes",
    groupBy: "Método",
    filter: "Ninguno",
    color: "#3b82f6",
    chartData: [],
    category: "Finanzas"
  },
  {
    id: "gadget-table-5",
    title: "Top Clientes",
    type: "table",
    dataSource: "Clientes",
    period: "Últimos 6 meses",
    groupBy: "Visitas",
    filter: "VIP",
    color: "#f59e0b",
    tableHeaders: ["Cliente", "Visitas", "Gasto Total"],
    tableRows: [],
    category: "Clientes"
  },
  {
    id: "gadget-heatmap-6",
    title: "Ocupación Semanal",
    type: "heatmap",
    dataSource: "Citas",
    period: "Esta semana",
    groupBy: "Día/Hora",
    filter: "Ninguno",
    color: "#8b5cf6",
    heatmapOccupancy: {},
    maxCellCount: 0,
    category: "Servicios"
  },
  {
    id: "gadget-ranking-7",
    title: "Profesionales más rentables",
    type: "ranking",
    dataSource: "Equipo",
    period: "Este mes",
    groupBy: "Facturación",
    filter: "Ninguno",
    color: "#8b5cf6",
    rankingData: [],
    category: "Equipo"
  }
];

export default function SmartReports({ appointments = [], clients = [], workers = [], services = [] }) {
  const { terms } = useBusinessModel();
  const { i18n } = useTranslation("dashboard");
  const isEs = i18n.language === "es";
  const currency = (n) => currencyHelper(n, isEs);

  // Estados
  const [gadgets, setGadgets] = useState(INITIAL_GADGETS_DATA);
  const [aiInput, setAiInput] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado del modal constructor
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGadget, setSelectedGadget] = useState(null);
  
  // Variables del formulario del modal (edit / custom preview)
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("kpi");
  const [formDataSource, setFormDataSource] = useState("Ventas");
  const [formPeriod, setFormPeriod] = useState("Este mes");
  const [formGroupBy, setFormGroupBy] = useState("Total");
  const [formFilter, setFormFilter] = useState("Ninguno");
  const [formColor, setFormColor] = useState("#8b5cf6");

  // Recalcular métricas en base a props reales de la base de datos
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const getMonthlyRevenue = (monthOffset) => {
      const targetMonth = new Date();
      targetMonth.setMonth(targetMonth.getMonth() - monthOffset);
      const m = targetMonth.getMonth();
      const y = targetMonth.getFullYear();
      return appointments
        .filter(a => {
          if (!a.startsAt || a.status === 'CANCELLED') return false;
          const d = new Date(a.startsAt);
          return d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
    };

    const currentMonthRevenue = getMonthlyRevenue(0);
    const lastMonthRevenue = getMonthlyRevenue(1);
    let changePct = 0;
    let positive = true;
    if (lastMonthRevenue > 0) {
      changePct = Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
      positive = changePct >= 0;
    } else if (currentMonthRevenue > 0) {
      changePct = 100;
      positive = true;
    }
    const kpiChange = changePct !== 0 ? `${positive ? '+' : ''}${changePct}%` : '0%';

    const monthNames = isEs 
      ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lineChartData = [];
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const m = targetDate.getMonth();
      const y = targetDate.getFullYear();
      const label = monthNames[m];
      const value = appointments
        .filter(a => {
          if (!a.startsAt || a.status === 'CANCELLED') return false;
          const d = new Date(a.startsAt);
          return d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
      lineChartData.push({ name: label, value });
    }

    const serviceMap = {};
    appointments.filter(a => a.status !== 'CANCELLED').forEach(a => {
      const key = a.service?.category || a.service?.name || (isEs ? 'Otros' : 'Others');
      serviceMap[key] = (serviceMap[key] || 0) + 1;
    });
    const barChartData = Object.entries(serviceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const paymentMap = {
      [isEs ? "Mercado Pago" : "Mercado Pago"]: 0,
      [isEs ? "Efectivo" : "Cash"]: 0
    };
    appointments.filter(a => a.status !== 'CANCELLED').forEach(a => {
      if (a.downpaymentStatus === 'PAID') {
        paymentMap[isEs ? "Mercado Pago" : "Mercado Pago"] += 1;
      } else {
        paymentMap[isEs ? "Efectivo" : "Cash"] += 1;
      }
    });
    const totalPayments = Object.values(paymentMap).reduce((sum, v) => sum + v, 0);
    const pieChartData = totalPayments > 0
      ? Object.entries(paymentMap)
          .map(([name, value]) => ({
            name,
            value: Math.round((value / totalPayments) * 100)
          }))
          .filter(d => d.value > 0)
      : [];

    const clientStats = {};
    appointments.filter(a => a.status !== 'CANCELLED').forEach(a => {
      const clientId = a.clientId;
      const name = a.client ? `${a.client.firstName} ${a.client.lastName}`.trim() : null;
      if (clientId && name) {
        if (!clientStats[clientId]) {
          clientStats[clientId] = { name, visits: 0, spent: 0 };
        }
        clientStats[clientId].visits += 1;
        clientStats[clientId].spent += Number(a.service?.price || 0);
      }
    });
    const tableRows = Object.values(clientStats)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map(c => [
        c.name, 
        `${c.visits} ${c.visits === 1 ? (isEs ? 'visita' : 'visit') : (isEs ? 'visitas' : 'visits')}`, 
        c.spent
      ]);

    // Ocupación Semanal (Heatmap)
    const heatmapOccupancy = {};
    const slots = [
      { start: 9, end: 11 },
      { start: 12, end: 14 },
      { start: 15, end: 17 },
      { start: 18, end: 20 },
      { start: 21, end: 23 }
    ];
    let maxCellCount = 0;
    appointments.filter(a => a.status !== 'CANCELLED').forEach(a => {
      if (!a.startsAt) return;
      const date = new Date(a.startsAt);
      const day = date.getDay(); // 0-6 (Sun-Sat)
      const hour = date.getHours();
      const dayIdx = [1, 2, 3, 4, 5, 6, 0].indexOf(day); // index in Mon-Sun
      if (dayIdx === -1) return;
      const slotIdx = slots.findIndex(s => hour >= s.start && hour <= s.end);
      if (slotIdx === -1) return;
      const cellKey = `${dayIdx}-${slotIdx}`;
      heatmapOccupancy[cellKey] = (heatmapOccupancy[cellKey] || 0) + 1;
      if (heatmapOccupancy[cellKey] > maxCellCount) {
        maxCellCount = heatmapOccupancy[cellKey];
      }
    });

    const workerStats = {};
    appointments.filter(a => a.status !== 'CANCELLED').forEach(a => {
      const workerId = a.workerId;
      const name = a.worker ? `${a.worker.firstName} ${a.worker.lastName}`.trim() : null;
      if (workerId && name) {
        workerStats[workerId] = (workerStats[workerId] || 0) + Number(a.service?.price || 0);
      }
    });
    const sortedWorkers = Object.entries(workerStats)
      .map(([id, value]) => {
        const w = workers.find(work => work.id === id);
        const name = w ? `${w.firstName} ${w.lastName}`.trim() : 'Profesional';
        return { name, value };
      })
      .sort((a, b) => b.value - a.value);
    const maxVal = sortedWorkers.length > 0 ? sortedWorkers[0].value : 1;
    const rankingData = sortedWorkers.map((w, index) => ({
      rank: index + 1,
      name: w.name,
      value: w.value,
      pct: maxVal > 0 ? Math.round((w.value / maxVal) * 100) : 0
    })).slice(0, 5);

    setGadgets(prev => {
      return prev.map(g => {
        if (g.id === "gadget-kpi-1") {
          return { ...g, kpiValue: currentMonthRevenue, kpiChange, kpiPositive: positive };
        }
        if (g.id === "gadget-line-2") {
          return { ...g, chartData: lineChartData };
        }
        if (g.id === "gadget-bar-3") {
          return { ...g, chartData: barChartData };
        }
        if (g.id === "gadget-dona-4") {
          return { ...g, chartData: pieChartData };
        }
        if (g.id === "gadget-table-5") {
          return { ...g, tableRows };
        }
        if (g.id === "gadget-heatmap-6") {
          return { ...g, heatmapOccupancy, maxCellCount };
        }
        if (g.id === "gadget-ranking-7") {
          return { ...g, rankingData };
        }
        return g;
      });
    });
  }, [appointments, clients, workers, services, isEs]);

  // Alerta de éxito flotante temporizador
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(""), 3500);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  // Filtrado de Gadgets por búsqueda
  const filteredGadgets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return gadgets;
    return gadgets.filter(g => 
      g.title.toLowerCase().includes(q) || 
      g.type.toLowerCase().includes(q) || 
      g.dataSource.toLowerCase().includes(q) || 
      g.category?.toLowerCase().includes(q)
    );
  }, [searchQuery, gadgets]);

  // Acciones de Gadgets
  const handleRefresh = (id) => {
    setSuccessMessage(isEs ? "¡Datos actualizados con éxito!" : "Data refreshed successfully!");
  };

  const handleDuplicate = (gadget) => {
    const duplicated = {
      ...gadget,
      id: `gadget-dup-${Date.now()}`,
      title: `${gadget.title} (Copia)`
    };
    setGadgets(prev => [duplicated, ...prev]);
    setSuccessMessage(isEs ? "¡Gadget duplicado con éxito!" : "Gadget duplicated successfully!");
  };

  const handleDelete = (id) => {
    setGadgets(prev => prev.filter(g => g.id !== id));
    setSuccessMessage(isEs ? "¡Gadget eliminado con éxito!" : "Gadget deleted successfully!");
  };

  const handleExportCSV = (gadget) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    
    if (gadget.type === "kpi") {
      csvContent += "Métrica,Valor,Periodo,Cambio\n";
      csvContent += `"${gadget.title}","${gadget.kpiValue}","${gadget.period}","${gadget.kpiChange}"\n`;
    } else if (gadget.chartData) {
      csvContent += "Concepto,Valor\n";
      gadget.chartData.forEach(row => {
        csvContent += `"${row.name}","${row.value}"\n`;
      });
    } else if (gadget.tableRows) {
      csvContent += `${gadget.tableHeaders.join(",")}\n`;
      gadget.tableRows.forEach(row => {
        csvContent += row.map(v => `"${v}"`).join(",") + "\n";
      });
    } else if (gadget.rankingData) {
      csvContent += "Puesto,Nombre,Facturado,Porcentaje\n";
      gadget.rankingData.forEach(row => {
        csvContent += `"${row.rank}","${row.name}","${row.value}","${row.pct}%"\n`;
      });
    } else {
      csvContent += "Dia,09h,11h,13h,15h,17h,19h\n";
      csvContent += "Lunes,45%,60%,85%,70%,90%,40%\n";
      csvContent += "Martes,30%,55%,75%,80%,85%,60%\n";
      csvContent += "Miercoles,50%,65%,80%,75%,95%,50%\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${gadget.title.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMessage(isEs ? "¡Archivo CSV descargado!" : "CSV file downloaded successfully!");
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (gadget) => {
    setSelectedGadget(gadget);
    setFormTitle(gadget.title);
    setFormType(gadget.type);
    setFormDataSource(gadget.dataSource);
    setFormPeriod(gadget.period);
    setFormGroupBy(gadget.groupBy);
    setFormFilter(gadget.filter);
    setFormColor(gadget.color || "#8b5cf6");
    setShowEditModal(true);
  };

  // Guardar Cambios del Constructor Visual
  const handleSaveBuilder = () => {
    if (!selectedGadget) return;

    // Verificar si es un gadget nuevo (no existe en el estado)
    const isNew = !gadgets.some(g => g.id === selectedGadget.id);

    // Generar datos ficticios coherentes si cambia el tipo de gráfico o si es un gadget nuevo
    let updatedChartData = selectedGadget.chartData;
    let updatedTableRows = selectedGadget.tableRows;
    let updatedTableHeaders = selectedGadget.tableHeaders;
    let updatedRankingData = selectedGadget.rankingData;
    let updatedKpiValue = selectedGadget.kpiValue;
    let updatedKpiChange = selectedGadget.kpiChange;

    if (isNew || formType !== selectedGadget.type) {
      // Si es nuevo o cambia el tipo, le inyectamos datos coherentes acordes al nuevo tipo
      if (formType === "kpi") {
        updatedKpiValue = formDataSource === "Ventas" ? 4850000 : 280;
        updatedKpiChange = "+15%";
      } else if (formType === "line" || formType === "bar") {
        updatedChartData = [
          { name: "Opción A", value: 120 },
          { name: "Opción B", value: 185 },
          { name: "Opción C", value: 240 },
          { name: "Opción D", value: 95 }
        ];
      } else if (formType === "dona") {
        updatedChartData = [
          { name: "A", value: 45 },
          { name: "B", value: 30 },
          { name: "C", value: 25 }
        ];
      } else if (formType === "table") {
        updatedTableHeaders = ["Concepto", "Categoría", "Total"];
        updatedTableRows = [
          ["Item 1", "Tipo X", "150"],
          ["Item 2", "Tipo Y", "95"],
          ["Item 3", "Tipo Z", "60"]
        ];
      } else if (formType === "ranking") {
        updatedRankingData = [
          { rank: 1, name: "Valeria Gómez", value: 500000, pct: 100 },
          { rank: 2, name: "Sofía Martínez", value: 400000, pct: 80 },
          { rank: 3, name: "Lucas Silva", value: 300000, pct: 60 }
        ];
      }
    }

    // Determinar categoría basada en el origen de datos
    let category = "General";
    if (formDataSource === "Ventas") category = "Finanzas";
    else if (formDataSource === "Clientes") category = "Clientes";
    else if (formDataSource === "Servicios") category = "Servicios";
    else if (formDataSource === "Equipo") category = "Equipo";

    const savedGadget = {
      ...selectedGadget,
      title: formTitle,
      type: formType,
      dataSource: formDataSource,
      period: formPeriod,
      groupBy: formGroupBy,
      filter: formFilter,
      color: formColor,
      category,
      kpiValue: updatedKpiValue,
      kpiChange: updatedKpiChange,
      chartData: updatedChartData,
      tableHeaders: updatedTableHeaders,
      tableRows: updatedTableRows,
      rankingData: updatedRankingData
    };

    if (isNew) {
      const exists = gadgets.some(g => g.title.toLowerCase().trim() === formTitle.toLowerCase().trim());
      if (exists) {
        alert(isEs 
          ? "Ya existe un gadget con ese título en el panel. Por favor elige otro." 
          : "A gadget with that title already exists in the panel. Please choose another one."
        );
        return;
      }
      setGadgets(prev => [savedGadget, ...prev]);
    } else {
      const hasTitleCollision = gadgets.some(g => g.id !== selectedGadget.id && g.title.toLowerCase().trim() === formTitle.toLowerCase().trim());
      if (hasTitleCollision) {
        alert(isEs 
          ? "Ya existe otro gadget con ese título en el panel. Por favor elige otro." 
          : "Another gadget with that title already exists in the panel. Please choose another one."
        );
        return;
      }
      setGadgets(prev => prev.map(g => g.id === selectedGadget.id ? savedGadget : g));
    }

    setShowEditModal(false);
    setSuccessMessage(isEs ? "¡Gadget guardado con éxito!" : "Gadget saved successfully!");
  };

  // Motor de Interpretación Conversacional Aura IA
  const handleAiInterpret = (text) => {
    if (!text.trim()) return;

    setIsAiGenerating(true);
    
    // Simular el proceso de IA de Aura de 1.5 segundos
    setTimeout(() => {
      const q = text.toLowerCase();
      let type = "bar";
      let title = "Análisis IA";
      let dataSource = "Ventas";
      let groupBy = "Categoría";
      let period = "Este mes";
      let color = "#8b5cf6";
      let category = "Finanzas";

      // Lógicas Heurísticas de interpretación de Aura AI
      if (q.includes("mes") || q.includes("mensual") || q.includes("12 meses")) {
        type = "line";
        title = "Ventas Mensuales (Aura IA)";
        period = "Último año";
        groupBy = "Mes";
      } else if (q.includes("profesional") || q.includes("estilistas") || q.includes("rentables")) {
        type = "ranking";
        title = "Productividad Profesional (Aura IA)";
        dataSource = "Equipo";
        groupBy = "Facturación";
        category = "Equipo";
      } else if (q.includes("clientes nuevos") || q.includes("recurrentes") || q.includes("frecuentes")) {
        type = "line";
        title = "Clientes Nuevos vs Recurrentes (Aura IA)";
        dataSource = "Clientes";
        groupBy = "Fidelidad";
        category = "Clientes";
      } else if (q.includes("servicios") || q.includes("rentables")) {
        type = "bar";
        title = "Servicios más Rentables (Aura IA)";
        dataSource = "Servicios";
        groupBy = "Categoría";
        category = "Servicios";
      } else if (q.includes("ocupacion") || q.includes("semanal")) {
        type = "heatmap";
        title = "Ocupación Semanal (Aura IA)";
        dataSource = "Citas";
        groupBy = "Día/Hora";
        category = "Servicios";
      } else if (q.includes("productos") || q.includes("inventario") || q.includes("agotar")) {
        type = "table";
        title = "Productos Próximos a Agotarse (Aura IA)";
        dataSource = "Inventario";
        groupBy = "Stock";
        category = "Inventario";
      } else if (q.includes("ticket") || q.includes("promedio") || q.includes("sucursal")) {
        type = "kpi";
        title = "Ticket Promedio (Aura IA)";
        groupBy = "Promedio";
      } else {
        // Fallback genérico
        type = "bar";
        title = `Análisis de ${text}`;
      }

      // Evitar duplicados por título en la generación por IA
      const exists = gadgets.some(g => g.title.toLowerCase().trim() === title.toLowerCase().trim());
      if (exists) {
        setSuccessMessage(isEs 
          ? `El gadget "${title}" ya está en tu panel.` 
          : `The gadget "${title}" is already on your panel.`
        );
        setIsAiGenerating(false);
        setAiInput("");
        return;
      }

      // Crear nuevo gadget adaptado
      const newGadget = {
        id: `gadget-ai-${Date.now()}`,
        title,
        type,
        dataSource,
        period,
        groupBy,
        filter: "Filtrado por IA",
        color,
        category,
        kpiValue: 18500,
        kpiChange: "+8%",
        kpiPositive: true,
        chartData: [
          { name: isEs ? "Ene" : "Jan", value: 1200000 },
          { name: isEs ? "Feb" : "Feb", value: 1800000 },
          { name: isEs ? "Mar" : "Mar", value: 2900000 },
          { name: isEs ? "Abr" : "Apr", value: 4850000 }
        ],
        tableHeaders: ["Insumo", "Stock", "Alerta"],
        tableRows: [
          ["Shampoo PH Neutro", "1 un.", "Crítico 🚨"],
          ["Tinta L'Oreal Majirel", "3 un.", "Bajo"],
          ["Crema Oxidante 20 Vol", "2 un.", "Crítico 🚨"]
        ],
        rankingData: [
          { rank: 1, name: "Valeria Gómez", value: 1250000, pct: 100 },
          { rank: 2, name: "Sofía Martínez", value: 980000, pct: 78 },
          { rank: 3, name: "Lucas Silva", value: 820000, pct: 65 }
        ]
      };

      setGadgets(prev => [newGadget, ...prev]);
      setIsAiGenerating(false);
      setAiInput("");
      setSuccessMessage(isEs ? "¡Aura ha generado el gadget con éxito en tu panel!" : "Aura generated the gadget successfully!");
    }, 1500);
  };

  // Render del contenido del Gadget según su Tipo
  const renderGadgetBody = (g) => {
    switch (g.type) {
      case "kpi":
        return (
          <div className="kpi-widget-container">
            <div className="kpi-widget-value">{currency(g.kpiValue)}</div>
            <div className="kpi-widget-footer">
              <span className={`kpi-trend-badge ${g.kpiPositive ? "positive" : "negative"}`}>
                {g.kpiChange}
              </span>
              <span className="kpi-widget-footer-text">{g.period}</span>
            </div>
          </div>
        );

      case "line":
        const defaultLineData = g.chartData || [
          { name: "A", value: 10 },
          { name: "B", value: 25 },
          { name: "C", value: 15 },
          { name: "D", value: 40 }
        ];
        return (
          <div style={{ height: "130px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={defaultLineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip formatter={(v) => typeof v === "number" && v > 1000 ? currency(v) : v} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={g.color || "#8b5cf6"}
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#ffffff", stroke: g.color || "#8b5cf6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "bar":
        const defaultBarData = g.chartData || [];
        if (defaultBarData.length === 0) {
          return (
            <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: "130px", fontSize: "12px" }}>
              {isEs ? "Sin datos de servicios" : "No service data"}
            </div>
          );
        }
        return (
          <div style={{ height: "130px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaultBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip formatter={(v) => typeof v === "number" && v > 1000 ? currency(v) : v} />
                <Bar dataKey="value" fill={g.color || "#8b5cf6"} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case "dona":
        const defaultPieData = g.chartData || [];
        if (defaultPieData.length === 0) {
          return (
            <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: "130px", fontSize: "12px" }}>
              {isEs ? "Sin datos de pago" : "No payment data"}
            </div>
          );
        }
        const colors = [g.color || "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];
        return (
          <div className="d-flex align-items-center" style={{ height: "130px" }}>
            <div style={{ height: "100%", width: "55%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={defaultPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={24} outerRadius={42} fill="#8b5cf6">
                    {defaultPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="d-grid gap-1.5" style={{ width: "45%", paddingLeft: "8px" }}>
              {defaultPieData.map((d, i) => (
                <div key={i} className="d-flex align-items-center gap-1.5" style={{ fontSize: "10px", fontWeight: "700" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[i % colors.length] }} />
                  <span className="text-truncate text-dark" style={{ maxWidth: "60px" }}>{d.name}</span>
                  <span className="text-muted ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "table":
        const rawHeaders = g.tableHeaders || ["Col 1", "Col 2"];
        const headers = rawHeaders.map(h => {
          if (h === "Cliente") return terms.client.s;
          if (h === "Clientes") return terms.client.p;
          if (h === "Profesional") return terms.professional.s;
          if (h === "Profesionales") return terms.professional.p;
          if (h === "Servicio") return terms.service.s;
          if (h === "Servicios") return terms.service.p;
          return h;
        });
        const rows = g.tableRows || [];
        if (rows.length === 0) {
          return (
            <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: "130px", fontSize: "12px" }}>
              {isEs ? "Sin clientes registrados" : "No clients registered"}
            </div>
          );
        }
        return (
          <div className="overflow-auto" style={{ maxHeight: "140px" }}>
            <div className="table-widget-header">
              {headers.map((h, idx) => (
                <div key={idx} style={{ width: idx === 0 ? "50%" : "25%", textAlign: idx > 0 ? "right" : "left" }}>
                  {h}
                </div>
              ))}
            </div>
            {rows.map((row, rIdx) => (
              <div className="table-widget-row" key={rIdx}>
                {row.map((cell, cIdx) => (
                  <div
                    key={cIdx}
                    className={cIdx === 0 ? "table-cell-bold text-truncate" : "table-cell-muted"}
                    style={{
                      width: cIdx === 0 ? "50%" : "25%",
                      textAlign: cIdx > 0 ? "right" : "left"
                    }}
                  >
                    {typeof cell === "number" ? currency(cell) : cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case "heatmap":
        const days = isEs 
          ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return (
          <div className="heatmap-grid-container py-2">
            <div className="heatmap-hours-header">
              <span className="heatmap-hour-label">09h</span>
              <span className="heatmap-hour-label">12h</span>
              <span className="heatmap-hour-label">15h</span>
              <span className="heatmap-hour-label">18h</span>
              <span className="heatmap-hour-label">21h</span>
            </div>
            <div className="heatmap-grid">
              {days.map((day, idx) => (
                <div className="heatmap-row" key={idx}>
                  <span className="heatmap-label">{day}</span>
                  <div className="heatmap-cells-container">
                    {[0, 1, 2, 3, 4, 5, 6].map((cellIdx) => {
                      let occupancyPercent = 0;
                      let cellOpacity = 0.05;
                      const cellKey = `${idx}-${cellIdx}`;
                      if (g.heatmapOccupancy && g.heatmapOccupancy[cellKey]) {
                        const count = g.heatmapOccupancy[cellKey];
                        const max = g.maxCellCount || 1;
                        cellOpacity = 0.1 + (count / max) * 0.9;
                        occupancyPercent = Math.round((count / max) * 100);
                      }
                      return (
                        <div
                          className="heatmap-cell"
                          key={cellIdx}
                          style={{
                            background: g.color || "#8b5cf6",
                            opacity: cellOpacity
                          }}
                          title={`Ocupación: ${occupancyPercent}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "ranking":
        const rankList = g.rankingData || [];
        if (rankList.length === 0) {
          return (
            <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: "130px", fontSize: "12px" }}>
              {isEs ? "Sin profesionales registrados" : "No workers registered"}
            </div>
          );
        }
        return (
          <div className="ranking-list py-1">
            {rankList.map((item, idx) => (
              <div className="ranking-item" key={idx}>
                <span className="ranking-medal">
                  {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : ""}
                  {item.rank > 3 && <div className="ranking-badge-num">{item.rank}</div>}
                </span>
                <span className="ranking-name text-truncate">{item.name}</span>
                <div className="ranking-bar-wrapper">
                  <div className="ranking-bar-container">
                    <div
                      className="ranking-bar"
                      style={{
                        width: `${item.pct}%`,
                        background: `linear-gradient(90deg, ${g.color || "#8b5cf6"}cc 0%, ${g.color || "#8b5cf6"} 100%)`
                      }}
                    />
                  </div>
                </div>
                <span className="ranking-val">{currency(item.value)}</span>
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-muted smaller">Visualización no soportada</div>;
    }
  };

  return (
    <section className="my-4 animate-fade-in">
      {/* Alerta de éxito flotante */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="position-fixed top-0 start-50 translate-middle-x z-3 mt-4"
            style={{ zIndex: 9999 }}
          >
            <Alert variant="dark" className="floating-success-alert px-4 py-2.5 d-flex align-items-center gap-2">
              <CheckCircle size={16} className="text-success animate-pulse" />
              <span className="fw-bold text-white small" style={{ fontSize: "12.5px" }}>{successMessage}</span>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER PRINCIPAL */}
      <div className="d-flex align-items-center gap-2.5 mb-4">
        <div className="p-2.5 bg-primary bg-opacity-10 text-primary rounded-4 pulse-sparkle" style={{ color: "#8b5cf6" }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="h4 fw-black text-dark mb-0.5">{isEs ? "Informes Inteligentes & Copilot IA" : "Smart Reports & AI Copilot"}</h2>
          <p className="text-muted smaller mb-0">{isEs ? "Generá reportes dinámicos conversacionales, visualizá gadgets y automatizá análisis con Aura Copilot." : "Generate dynamic conversational reports, view gadgets, and automate analysis with Aura Copilot."}</p>
        </div>
      </div>

      {/* SECCIÓN 1: AURA ANALYTICS BUILDER */}
      <Card className="aura-builder-card border-0 mb-4 p-4 shadow-sm" style={{ borderRadius: "20px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}>
          <h3 className="builder-title mb-1 text-center" style={{ fontSize: "22px" }}>Aura Analytics Builder</h3>
          <p className="builder-subtitle text-center text-muted mb-4 small" style={{ fontSize: "13px" }}>
            {isEs 
              ? "Preguntá en lenguaje natural y generá gráficos o reportes dinámicos en segundos." 
              : "Ask in natural language and generate charts or dynamic reports in seconds."}
          </p>
          
          {/* IA input console */}
          <div className="ai-input-glow-wrapper mb-3" style={{ background: "#ffffff" }}>
            <Sparkles size={18} className="ai-input-icon animate-pulse" />
            <Form.Control
              type="text"
              placeholder={isEs ? "Ej: Mostrar ventas por categoría últimos 6 meses..." : "Ex: Show sales by category for the last 6 months..."}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={isAiGenerating}
              className="ai-textarea shadow-none border-0"
              style={{ fontSize: "13.5px", height: "36px", padding: "6px 8px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAiInterpret(aiInput);
                }
              }}
            />
            <Button
              onClick={() => handleAiInterpret(aiInput)}
              disabled={isAiGenerating || !aiInput.trim()}
              className="btn-ai-generate"
              style={{ padding: "6px 16px", borderRadius: "10px", fontSize: "12px" }}
            >
              {isAiGenerating ? (
                <>
                  <Spinner animation="border" size="sm" className="text-white me-1" />
                  <span>{isEs ? "Generando..." : "Generating..."}</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="me-1" />
                  <span>{isEs ? "Generar" : "Generate"}</span>
                </>
              )}
            </Button>
          </div>

          {/* Chips sugerencias simplificados */}
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
            {[
              { label: isEs ? "Ventas de hoy" : "Today's sales", prompt: "Ventas de hoy" },
              { label: isEs ? "Ventas mensuales" : "Monthly sales", prompt: "Ventas por mes" },
              { label: isEs ? "Clientes frecuentes" : "Frequent clients", prompt: "Clientes más frecuentes" },
              { label: isEs ? "Servicios rentables" : "Profitable services", prompt: "Servicios más rentables" },
              { label: isEs ? "Ocupación semanal" : "Weekly occupancy", prompt: "Ocupación semanal" },
              { label: isEs ? "Bajo stock" : "Low stock", prompt: "Productos próximos a agotarse" },
              { label: isEs ? "Métodos de pago" : "Payment methods", prompt: "Métodos de pago este mes" },
            ].map((chip, idx) => (
              <button
                key={idx}
                disabled={isAiGenerating}
                onClick={() => {
                  setAiInput(chip.prompt);
                  handleAiInterpret(chip.prompt);
                }}
                className="suggestion-chip"
                style={{ fontSize: "11.5px", padding: "5px 12px", border: "1px solid #e2e8f0", borderRadius: "50px", cursor: "pointer", background: "#ffffff" }}
              >
                <Plus size={10} className="text-muted me-1" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* SECCIÓN 3: MIS GADGETS IA */}
      <div className="gadgets-header-container">
        <div>
          <h3 className="h5 fw-black text-dark mb-0.5">{isEs ? "Mis Gadgets" : "My Gadgets"}</h3>
          <p className="text-muted smaller mb-0">{isEs ? "Visualizaciones creadas automáticamente por Aura." : "Visualizations automatically generated by Aura."}</p>
        </div>

        {/* Buscador de widgets */}
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative" style={{ width: "240px" }}>
            <Search size={14} className="position-absolute text-muted" style={{ left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <Form.Control
              type="text"
              placeholder={isEs ? "Buscar gadgets..." : "Search gadgets..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-pill pl-4 small py-1.5 border"
              style={{ paddingLeft: "32px", fontSize: "12.5px" }}
            />
          </div>

          <Button
            variant="dark"
            onClick={() => {
              const newCustom = {
                id: `gadget-custom-${Date.now()}`,
                title: isEs ? "Nuevo Gadget Custom" : "New Custom Gadget",
                type: "kpi",
                dataSource: "Ventas",
                period: "Este mes",
                groupBy: "Total",
                filter: "Ninguno",
                color: "#8b5cf6",
                kpiValue: 150000,
                kpiChange: "+5%",
                kpiPositive: true,
                category: "Finanzas"
              };
              handleOpenEdit(newCustom);
            }}
            className="rounded-pill px-3 py-1.5 fw-bold small border-0 bg-success d-flex align-items-center gap-1"
            style={{ fontSize: "12.5px" }}
          >
            <Plus size={14} />
            <span>{isEs ? "Crear Gadget" : "Create Gadget"}</span>
          </Button>
        </div>
      </div>

      {/* Grilla adaptativa de Gadgets */}
      {filteredGadgets.length === 0 ? (
        <div className="text-center py-5 border border-dashed rounded-4 bg-light">
          <Search size={28} className="text-muted mb-2" />
          <h5 className="fw-bold text-dark mb-1">{isEs ? "No encontramos gadgets" : "No gadgets found"}</h5>
          <p className="text-muted smaller mb-0">{isEs ? "Probá buscando otra palabra o generá un gadget arriba." : "Try searching another keyword or generate a gadget above."}</p>
        </div>
      ) : (
        <Row className="g-3">
          <AnimatePresence>
            {filteredGadgets.map((g) => (
              <Col xs={12} md={6} lg={4} key={g.id} className="animate-fade-in">
                <div className="premium-gadget-card">
                  <div>
                    {/* Header */}
                    <div className="gadget-top-header">
                      <span
                        className="gadget-badge"
                        style={{
                          background: g.category === "Finanzas" ? "#ecfdf5" : g.category === "Clientes" ? "#eff6ff" : g.category === "Servicios" ? "#fdf4ff" : "#fffbeb",
                          color: g.category === "Finanzas" ? "#059669" : g.category === "Clientes" ? "#1d4ed8" : g.category === "Servicios" ? "#d946ef" : "#d97706"
                        }}
                      >
                        {g.category || "General"}
                      </span>

                      {/* Menú de acciones del gadget */}
                      <Dropdown align="end">
                        <Dropdown.Toggle as="button" className="btn-three-dots">
                          <MoreVertical size={16} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-lg border rounded-4 py-1.5 small" style={{ minWidth: "140px" }}>
                          <Dropdown.Item onClick={() => handleOpenEdit(g)} className="d-flex align-items-center gap-2 py-1.5">
                            <Edit2 size={13} className="text-primary" />
                            <span>{isEs ? "Editar" : "Edit"}</span>
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDuplicate(g)} className="d-flex align-items-center gap-2 py-1.5">
                            <Copy size={13} className="text-success" />
                            <span>{isEs ? "Duplicar" : "Duplicate"}</span>
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleRefresh(g.id)} className="d-flex align-items-center gap-2 py-1.5">
                            <RefreshCw size={13} className="text-info" />
                            <span>{isEs ? "Actualizar" : "Refresh"}</span>
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleExportCSV(g)} className="d-flex align-items-center gap-2 py-1.5">
                            <Download size={13} className="text-warning" />
                            <span>{isEs ? "Exportar" : "Export"}</span>
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={() => handleDelete(g.id)} className="d-flex align-items-center gap-2 py-1.5 text-danger">
                            <Trash2 size={13} />
                            <span>{isEs ? "Eliminar" : "Delete"}</span>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    <h4 className="gadget-content-title">{g.title}</h4>
                    <p className="gadget-content-sub">{g.period} • {isEs ? "Agrupado por" : "Grouped by"} {g.groupBy}</p>
                  </div>

                  {/* Body interactivo del widget */}
                  <div className="gadget-inner-body">
                    {renderGadgetBody(g)}
                  </div>
                </div>
              </Col>
            ))}
          </AnimatePresence>
        </Row>
      )}

      {/* ---------------------------------------------------------
          CONSTRUCTOR VISUAL: MODAL INTERACTIVO DE EDICIÓN & PREVIEW
          --------------------------------------------------------- */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
        dialogClassName="modal-visual-builder-dialog"
        contentClassName="modal-visual-builder"
      >
        <Modal.Header closeButton closeVariant="white" className="modal-builder-header">
          <Modal.Title className="modal-builder-title d-flex align-items-center gap-2">
            <BarChart2 size={18} className="text-success" />
            <span>{isEs ? "Aura Visual Gadget Builder" : "Aura Visual Gadget Builder"}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-builder-body">
          <Row className="g-4">
            
            {/* Formulario de configuración (Izquierda) */}
            <Col md={6} className="d-grid gap-3.5">
              <div>
                <label className="builder-label">{isEs ? "Título del Gadget" : "Gadget Title"}</label>
                <Form.Control
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="builder-input"
                />
              </div>

              <Row className="g-2">
                <Col xs={6}>
                  <label className="builder-label">{isEs ? "Tipo de gráfico" : "Chart Type"}</label>
                  <Form.Select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="builder-select"
                  >
                    <option value="kpi">KPI</option>
                    <option value="line">Líneas</option>
                    <option value="bar">Barras</option>
                    <option value="dona">Dona</option>
                    <option value="table">Tabla</option>
                    <option value="heatmap">Heatmap</option>
                    <option value="ranking">Ranking</option>
                  </Form.Select>
                </Col>
                <Col xs={6}>
                  <label className="builder-label">{isEs ? "Fuente de datos" : "Data Source"}</label>
                  <Form.Select
                    value={formDataSource}
                    onChange={(e) => setFormDataSource(e.target.value)}
                    className="builder-select"
                  >
                    <option value="Ventas">Ventas</option>
                    <option value="Clientes">Clientes</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Equipo">Equipo</option>
                    <option value="Citas">Citas</option>
                    <option value="Inventario">Inventario</option>
                  </Form.Select>
                </Col>
              </Row>

              <Row className="g-2">
                <Col xs={6}>
                  <label className="builder-label">{isEs ? "Período" : "Period"}</label>
                  <Form.Select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    className="builder-select"
                  >
                    <option value="Hoy">Hoy</option>
                    <option value="Esta semana">Esta semana</option>
                    <option value="Este mes">Este mes</option>
                    <option value="Últimos 6 meses">Últimos 6 meses</option>
                    <option value="Último año">Último año</option>
                  </Form.Select>
                </Col>
                <Col xs={6}>
                  <label className="builder-label">{isEs ? "Agrupar por" : "Group by"}</label>
                  <Form.Select
                    value={formGroupBy}
                    onChange={(e) => setFormGroupBy(e.target.value)}
                    className="builder-select"
                  >
                    <option value="Total">Total</option>
                    <option value="Categoría">Categoría</option>
                    <option value="Día">Día</option>
                    <option value="Mes">Mes</option>
                    <option value="Método">Método</option>
                    <option value="Profesional">Profesional</option>
                  </Form.Select>
                </Col>
              </Row>

              <div>
                <label className="builder-label">{isEs ? "Filtros aplicados" : "Applied Filters"}</label>
                <Form.Select
                  value={formFilter}
                  onChange={(e) => setFormFilter(e.target.value)}
                  className="builder-select"
                >
                  <option value="Ninguno">Ninguno</option>
                  <option value="Solo finalizados">Solo finalizados</option>
                  <option value="VIP">Clientes VIP</option>
                  <option value="Bajo stock">Bajo stock crítico</option>
                </Form.Select>
              </div>

              <div>
                <label className="builder-label">{isEs ? "Color principal de visualización" : "Main visual color"}</label>
                <div className="color-picker-group">
                  {["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#ef4444"].map((c) => (
                    <div
                      key={c}
                      className={`color-picker-circle ${formColor === c ? "active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>
            </Col>

            {/* Vista Previa interactiva en Tiempo Real (Derecha) */}
            <Col md={6}>
              <div className="live-preview-pane">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="preview-badge-status">{isEs ? "Vista Previa en Vivo" : "Live Preview"}</span>
                  <div className="text-muted smaller fw-bold">{formPeriod}</div>
                </div>

                <div className="mb-3">
                  <h4 className="gadget-content-title text-dark">{formTitle || (isEs ? "Título temporal" : "Temporary title")}</h4>
                  <p className="gadget-content-sub m-0">{isEs ? "Agrupado por" : "Grouped by"} {formGroupBy} • {isEs ? "Filtro:" : "Filter:"} {formFilter}</p>
                </div>

                {/* Render dinámico del preview */}
                <div className="preview-rendered-area border rounded-4 p-3 bg-light d-flex flex-column justify-content-center" style={{ minHeight: "160px" }}>
                  {renderGadgetBody({
                    type: formType,
                    color: formColor,
                    kpiValue: formDataSource === "Ventas" ? 4850000 : 280,
                    kpiChange: "+15%",
                    kpiPositive: true,
                    period: formPeriod,
                    groupBy: formGroupBy,
                    chartData: [
                      { name: "Opción A", value: 120 },
                      { name: "Opción B", value: 185 },
                      { name: "Opción C", value: 240 },
                      { name: "Opción D", value: 95 }
                    ],
                    tableHeaders: ["Concepto", "Categoría", "Total"],
                    tableRows: [
                      ["Item A", "Servicio", "$120.000"],
                      ["Item B", "Venta", "$85.000"],
                      ["Item C", "Servicio", "$40.000"]
                    ],
                    rankingData: [
                      { rank: 1, name: "Valeria Gómez", value: 1250000, pct: 100 },
                      { rank: 2, name: "Sofía Martínez", value: 980000, pct: 78 },
                      { rank: 3, name: "Lucas Silva", value: 820000, pct: 65 }
                    ]
                  })}
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light p-3">
          <Button variant="outline-dark" onClick={() => setShowEditModal(false)} className="rounded-pill px-4 small fw-bold">
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button variant="dark" onClick={handleSaveBuilder} className="rounded-pill px-4 small fw-bold border-0 bg-success">
            {isEs ? "Guardar Gadget" : "Save Gadget"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
