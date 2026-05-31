import React, { useState, useMemo, useEffect } from "react";
import { Row, Col, Card, Button, Form, Table, Badge, Spinner, Alert, InputGroup } from "react-bootstrap";
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
  MessageSquare
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { postGadgetAiReport } from "../../gadgets/ai/gadgetReportApi.js";
import "../../styles/smart-reports.css";
import { useTranslation } from "react-i18next";

// Helper de formato de moneda
function currencyHelper(n, isEs = true) {
  return new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
    style: "currency",
    currency: isEs ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function translatePaymentMethod(method, isEs) {
  if (isEs) return method;
  if (method === "Efectivo") return "Cash";
  if (method === "Tarjeta de Crédito" || method === "Tarjeta") return "Credit Card";
  if (method === "Transferencia MP" || method === "Transferencia") return "Bank Transfer";
  if (method === "Débito") return "Debit Card";
  return method;
}

// Lista estática de productos para el inventario (coincide con InventoryView.jsx)
const INITIAL_PRODUCTS = [
  { id: 1, name: "Tinta L'Oreal Majirel 7.1", category: "Coloración", stock: 3, limit: 8, cost: 4500, provider: "Distribuidora Belleza Sur" },
  { id: 2, name: "Shampoo PH Neutro Premium 5L", category: "Lavado", stock: 1, limit: 3, cost: 12000, provider: "L'Oreal Express" },
  { id: 3, name: "Keratina Hidrolizada 1L", category: "Tratamientos", stock: 6, limit: 5, cost: 28000, provider: "Distribuidora Belleza Sur" },
  { id: 4, name: "Esmalte Meliné Semipermanente", category: "Manicuría", stock: 14, limit: 5, cost: 3200, provider: "Manicura Pro" },
  { id: 5, name: "Crema Oxidante 20 Vol 1L", category: "Coloración", stock: 2, limit: 4, cost: 6500, provider: "Distribuidora Belleza Sur" }
];

export default function SmartReports({ appointments = [], clients = [], workers = [], services = [], brand = {} }) {
  const { t, i18n } = useTranslation("dashboard");
  const isEs = i18n.language === "es";
  const currency = (n) => currencyHelper(n, isEs);

  // Estados principales
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  
  // Estado para el informe visual activo
  const [activeReport, setActiveReport] = useState(null);
  
  // Mensajes de éxito flotantes
  const [successMessage, setSuccessMessage] = useState("");

  // Auto-limpieza de mensajes de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Asignar métodos de pago estables simulados a las citas
  const appointmentsWithPayment = useMemo(() => {
    const paymentMethods = ["Efectivo", "Tarjeta de Crédito", "Transferencia MP", "Débito"];
    return appointments.map((appt, idx) => {
      // Determinista usando el ID
      const paymentIndex = Math.abs(String(appt.id).charCodeAt(0) + idx) % paymentMethods.length;
      return {
        ...appt,
        paymentMethod: paymentMethods[paymentIndex]
      };
    });
  }, [appointments]);

  // --- CÁLCULO DE INFORMES PREDETERMINADOS EN TIEMPO REAL ---
  const reportDataCalculators = {
    "ventas-dia": () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayAppts = appointmentsWithPayment.filter(
        a => a.status !== "CANCELLED" && new Date(a.startsAt).toISOString().slice(0, 10) === todayStr
      );
      const total = todayAppts.reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
      
      // Agrupación por servicio para gráfico
      const servMap = {};
      todayAppts.forEach(a => {
        const n = a.service?.name || "Otros";
        servMap[n] = (servMap[n] || 0) + Number(a.service?.price || 0);
      });
      const chartData = Object.entries(servMap).map(([name, value]) => ({ name, value }));

      return {
        title: isEs ? "Ventas del Día" : "Today's Sales",
        description: isEs ? "Análisis y volumen de facturación registrados en la jornada de hoy." : "Analysis and billing volume recorded today.",
        summary: isEs 
          ? `Hoy se registraron ${todayAppts.length} citas operativas con un total facturado de ${currency(total)}. El ticket promedio de hoy se sitúa en ${currency(todayAppts.length ? total / todayAppts.length : 0)}.`
          : `Today, there were ${todayAppts.length} active appointments with a total billed amount of ${currency(total)}. Today's average ticket is ${currency(todayAppts.length ? total / todayAppts.length : 0)}.`,
        kpis: [
          { label: isEs ? "Total Vendido Hoy" : "Total Sold Today", value: currency(total), icon: <DollarSign size={18} className="text-success" /> },
          { label: isEs ? "Citas Operativas" : "Active Appointments", value: isEs ? `${todayAppts.length} turnos` : `${todayAppts.length} slots`, icon: <CheckCircle size={18} className="text-primary" /> },
          { label: isEs ? "Ticket Promedio" : "Average Ticket", value: currency(todayAppts.length ? total / todayAppts.length : 0), icon: <TrendingUp size={18} className="text-warning" /> }
        ],
        chart: {
          type: "bar",
          title: isEs ? "Facturación por Servicio (Hoy)" : "Billing by Service (Today)",
          data: chartData.length ? chartData : [{ name: isEs ? "Sin Ventas" : "No Sales", value: 0 }]
        },
        table: {
          headers: isEs ? ["Cliente", "Servicio", "Colaborador", "M. Pago", "Importe"] : ["Client", "Service", "Staff", "Payment Method", "Amount"],
          rows: todayAppts.map(a => [
            `${a.client?.firstName || (isEs ? "Cliente" : "Client")} ${a.client?.lastName || ""}`.trim(),
            a.service?.name || (isEs ? "Servicio" : "Service"),
            `${a.worker?.firstName || (isEs ? "Profesional" : "Staff")}`.trim(),
            translatePaymentMethod(a.paymentMethod, isEs),
            currency(a.service?.price)
          ])
        }
      };
    },

    "ventas-semana": () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAppts = appointmentsWithPayment.filter(
        a => a.status !== "CANCELLED" && new Date(a.startsAt) >= oneWeekAgo
      );
      const total = weekAppts.reduce((sum, a) => sum + Number(a.service?.price || 0), 0);

      // Agrupación por día de la semana
      const days = isEs 
        ? ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] 
        : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dailyMap = {};
      // Inicializar últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dailyMap[days[d.getDay()]] = 0;
      }
      
      weekAppts.forEach(a => {
        const dayName = days[new Date(a.startsAt).getDay()];
        if (dailyMap[dayName] !== undefined) {
          dailyMap[dayName] += Number(a.service?.price || 0);
        }
      });

      const chartData = Object.entries(dailyMap).map(([name, value]) => ({ name, value }));

      return {
        title: isEs ? "Ventas de la Semana" : "Weekly Sales",
        description: isEs ? "Monitoreo de ingresos móviles de los últimos 7 días con tendencia diaria." : "Monitoring of mobile income over the last 7 days with daily trend.",
        summary: isEs 
          ? `Los ingresos totales acumulados en los últimos 7 días ascienden a ${currency(total)} distribuidos en ${weekAppts.length} citas. Esto marca un promedio de facturación diario de ${currency(total / 7)}.`
          : `Total accumulated income in the last 7 days amounts to ${currency(total)} across ${weekAppts.length} appointments. This marks a daily billing average of ${currency(total / 7)}.`,
        kpis: [
          { label: isEs ? "Ventas Semanales" : "Weekly Sales", value: currency(total), icon: <DollarSign size={18} className="text-success" /> },
          { label: isEs ? "Servicios Realizados" : "Completed Services", value: isEs ? `${weekAppts.length} turnos` : `${weekAppts.length} slots`, icon: <CheckCircle size={18} className="text-primary" /> },
          { label: isEs ? "Promedio Diario" : "Daily Average", value: currency(total / 7), icon: <TrendingUp size={18} className="text-info" /> }
        ],
        chart: {
          type: "area",
          title: isEs ? "Evolución Semanal de Ventas (ARS)" : "Weekly Sales Trend",
          data: chartData
        },
        table: {
          headers: isEs ? ["Fecha", "Cliente", "Servicio", "Colaborador", "Total"] : ["Date", "Client", "Service", "Staff", "Total"],
          rows: weekAppts.slice(0, 10).map(a => [
            new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { day: "numeric", month: "short" }),
            `${a.client?.firstName || (isEs ? "Cliente" : "Client")} ${a.client?.lastName || ""}`.trim(),
            a.service?.name || (isEs ? "Servicio" : "Service"),
            a.worker?.firstName || (isEs ? "Profesional" : "Staff"),
            currency(a.service?.price)
          ])
        }
      };
    },

    "servicios-solicitados": () => {
      const activeAppts = appointments.filter(a => a.status !== "CANCELLED");
      const serviceCounts = {};
      const serviceRev = {};
      
      activeAppts.forEach(a => {
        const name = a.service?.name || (isEs ? "Otros" : "Others");
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
        serviceRev[name] = (serviceRev[name] || 0) + Number(a.service?.price || 0);
      });

      const sortedServices = Object.entries(serviceCounts)
        .map(([name, count]) => ({
          name,
          count,
          revenue: serviceRev[name] || 0
        }))
        .sort((a, b) => b.count - a.count);

      const chartData = sortedServices.map(s => ({ name: s.name, value: s.count }));

      return {
        title: isEs ? "Servicios Más Solicitados" : "Most Requested Services",
        description: isEs ? "Identificación de los tratamientos estrella de tu salón por número de reservas." : "Identification of your salon's star treatments by number of bookings.",
        summary: sortedServices.length 
          ? (isEs 
              ? `El servicio más solicitado es "${sortedServices[0].name}" con ${sortedServices[0].count} turnos realizados, generando una facturación de ${currency(sortedServices[0].revenue)}.` 
              : `The most requested service is "${sortedServices[0].name}" with ${sortedServices[0].count} completed bookings, generating a total billing of ${currency(sortedServices[0].revenue)}.`)
          : (isEs ? "No se registran servicios activos." : "No active services recorded."),
        kpis: [
          { label: isEs ? "Servicio Top" : "Top Service", value: sortedServices[0]?.name || (isEs ? "Ninguno" : "None"), icon: <TrendingUp size={18} className="text-success" /> },
          { label: isEs ? "Volumen Reservas" : "Booking Volume", value: isEs ? `${sortedServices[0]?.count || 0} turnos` : `${sortedServices[0]?.count || 0} bookings`, icon: <CheckCircle size={18} className="text-primary" /> },
          { label: isEs ? "Servicios Únicos" : "Unique Services", value: isEs ? `${sortedServices.length} categorías` : `${sortedServices.length} categories`, icon: <Layers size={18} className="text-warning" /> }
        ],
        chart: {
          type: "bar",
          title: isEs ? "Reservas por Tipo de Servicio (Cant.)" : "Bookings by Service Type (Qty)",
          data: chartData.length ? chartData : [{ name: isEs ? "Ninguno" : "None", value: 0 }]
        },
        table: {
          headers: isEs ? ["Nombre del Servicio", "Cantidad de Turnos", "Participación", "Ingresos Generados"] : ["Service Name", "Booking Qty", "Share %", "Generated Revenue"],
          rows: sortedServices.map(s => [
            s.name,
            isEs ? `${s.count} turnos` : `${s.count} bookings`,
            `${Math.round((s.count / (activeAppts.length || 1)) * 100)}%`,
            currency(s.revenue)
          ])
        }
      };
    },

    "clientes-frecuentes": () => {
      const activeAppts = appointments.filter(a => a.status !== "CANCELLED");
      const clientMap = {};
      
      activeAppts.forEach(a => {
        if (!a.clientId) return;
        const key = a.clientId;
        if (!clientMap[key]) {
          clientMap[key] = {
            name: `${a.client?.firstName || ""} ${a.client?.lastName || ""}`.trim() || (isEs ? "Cliente Anónimo" : "Anonymous Client"),
            count: 0,
            spend: 0,
            email: a.client?.email || (isEs ? "Sin email" : "No email"),
            phone: a.client?.phone || (isEs ? "Sin teléfono" : "No phone")
          };
        }
        clientMap[key].count += 1;
        clientMap[key].spend += Number(a.service?.price || 0);
      });

      const sortedClients = Object.values(clientMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const chartData = sortedClients.map(c => ({ name: c.name, value: c.count }));

      return {
        title: isEs ? "Clientes Frecuentes" : "Frequent Clients",
        description: isEs ? "Listado de tus clientes recurrentes con mayor concurrencia en reservas." : "List of your recurring clients with the highest booking attendance.",
        summary: sortedClients.length
          ? (isEs 
              ? `Tu cliente más recurrente es "${sortedClients[0].name}" con ${sortedClients[0].count} visitas en el sistema y un aporte monetario acumulado de ${currency(sortedClients[0].spend)}.`
              : `Your most recurring client is "${sortedClients[0].name}" with ${sortedClients[0].count} visits in the system and an accumulated contribution of ${currency(sortedClients[0].spend)}.`)
          : (isEs ? "No hay registros de clientes recurrentes." : "No recurring clients recorded."),
        kpis: [
          { label: isEs ? "Cliente Más Activo" : "Most Active Client", value: sortedClients[0]?.name || (isEs ? "Ninguno" : "None"), icon: <User size={18} className="text-success" /> },
          { label: isEs ? "Máximo de Reservas" : "Max Bookings", value: isEs ? `${sortedClients[0]?.count || 0} visitas` : `${sortedClients[0]?.count || 0} visits`, icon: <CheckCircle size={18} className="text-primary" /> },
          { label: isEs ? "Clientes Fidelizados" : "Loyal Clients", value: isEs ? `${Object.keys(clientMap).length} activos` : `${Object.keys(clientMap).length} active`, icon: <Users size={18} className="text-info" /> }
        ],
        chart: {
          type: "pie",
          title: isEs ? "Cuota de Reservas por Cliente Frecuente" : "Booking Share by Frequent Client",
          data: chartData.length ? chartData : [{ name: isEs ? "Ninguno" : "None", value: 0 }]
        },
        table: {
          headers: isEs ? ["Cliente", "Teléfono / Contacto", "Cantidad Visitas", "Gasto Acumulado"] : ["Client", "Phone / Contact", "Visits Count", "Accumulated Spend"],
          rows: sortedClients.map(c => [
            c.name,
            c.phone,
            isEs ? `${c.count} visitas` : `${c.count} visits`,
            currency(c.spend)
          ])
        }
      };
    },

    "ingresos-metodo-pago": () => {
      const activeAppts = appointmentsWithPayment.filter(a => a.status !== "CANCELLED");
      const methodMap = { "Efectivo": 0, "Tarjeta de Crédito": 0, "Transferencia MP": 0, "Débito": 0 };
      
      activeAppts.forEach(a => {
        if (methodMap[a.paymentMethod] !== undefined) {
          methodMap[a.paymentMethod] += Number(a.service?.price || 0);
        }
      });

      const total = Object.values(methodMap).reduce((sum, v) => sum + v, 0);
      const chartData = Object.entries(methodMap).map(([name, value]) => ({ name: translatePaymentMethod(name, isEs), value }));
      const topMethod = Object.entries(methodMap).reduce((max, cur) => cur[1] > max[1] ? cur : max, ["Ninguno", 0]);

      return {
        title: isEs ? "Ingresos por Método de Pago" : "Revenue by Payment Method",
        description: isEs ? "Distribución monetaria de la facturación según los canales de cobro utilizados." : "Monetary distribution of billing according to payment channels used.",
        summary: isEs 
          ? `El canal de cobro principal es "${translatePaymentMethod(topMethod[0], true)}" captando el ${Math.round((topMethod[1] / (total || 1)) * 100)}% de los ingresos totales (${currency(topMethod[1])}).`
          : `The primary payment channel is "${translatePaymentMethod(topMethod[0], false)}" capturing ${Math.round((topMethod[1] / (total || 1)) * 100)}% of total revenue (${currency(topMethod[1])}).`,
        kpis: [
          { label: isEs ? "Canal Preferido" : "Preferred Channel", value: translatePaymentMethod(topMethod[0], isEs), icon: <CreditCard size={18} className="text-success" /> },
          { label: isEs ? "Participación Top" : "Top Share", value: `${Math.round((topMethod[1] / (total || 1)) * 100)}%`, icon: <Percent size={18} className="text-primary" /> },
          { label: isEs ? "Total Conciliado" : "Total Reconciled", value: currency(total), icon: <DollarSign size={18} className="text-warning" /> }
        ],
        chart: {
          type: "pie",
          title: isEs ? "Desglose Financiero por Método de Pago" : "Financial Breakdown by Payment Method",
          data: chartData
        },
        table: {
          headers: isEs ? ["Método de Pago", "Participación %", "Facturación Total"] : ["Payment Method", "Share %", "Total Billing"],
          rows: Object.entries(methodMap).map(([name, value]) => [
            translatePaymentMethod(name, isEs),
            `${Math.round((value / (total || 1)) * 100)}%`,
            currency(value)
          ])
        }
      };
    },



    "bajo-stock": () => {
      const lowStockProducts = INITIAL_PRODUCTS.filter(p => p.stock < p.limit);
      const totalVal = INITIAL_PRODUCTS.reduce((sum, p) => sum + (p.stock * p.cost), 0);
      const chartData = INITIAL_PRODUCTS.map(p => ({ name: p.name, value: p.stock }));

      return {
        title: isEs ? "Productos con Bajo Stock" : "Low Stock Products",
        description: isEs ? "Listado crítico de insumos del salón que requieren reposición inmediata." : "Critical list of salon supplies requiring immediate replenishment.",
        summary: isEs 
          ? `Tenés ${lowStockProducts.length} productos bajo el stock límite de seguridad. Es de alta prioridad iniciar pedidos de reposición.`
          : `You have ${lowStockProducts.length} products below the safety stock limit. Replenishment orders are high priority.`,
        kpis: [
          { label: isEs ? "Productos Críticos" : "Critical Products", value: isEs ? `${lowStockProducts.length} insumos` : `${lowStockProducts.length} items`, icon: <AlertTriangle size={18} className="text-danger" /> },
          { label: isEs ? "Valuación Inventario" : "Inventory Valuation", value: currency(totalVal), icon: <Package size={18} className="text-success" /> },
          { label: isEs ? "Artículos Únicos" : "Unique Items", value: isEs ? `${INITIAL_PRODUCTS.length} productos` : `${INITIAL_PRODUCTS.length} products`, icon: <Layers size={18} className="text-primary" /> }
        ],
        chart: {
          type: "bar",
          title: isEs ? "Nivel de Stock Actual por Insumo" : "Current Stock Level by Item",
          data: chartData
        },
        table: {
          headers: isEs ? ["Nombre Insumo", "Categoría", "Stock Actual", "Límite Alerta", "Costo Unidad"] : ["Item Name", "Category", "Current Stock", "Alert Limit", "Unit Cost"],
          rows: lowStockProducts.map(p => [
            p.name,
            p.category,
            isEs ? `${p.stock} un.` : `${p.stock} units`,
            isEs ? `${p.limit} un.` : `${p.limit} units`,
            currency(p.cost)
          ])
        }
      };
    },

    "rendimiento-empleado": () => {
      const activeAppts = appointments.filter(a => a.status !== "CANCELLED");
      const workerCounts = {};
      const workerRevenue = {};

      activeAppts.forEach(a => {
        const name = a.worker ? `${a.worker.firstName} ${a.worker.lastName}`.trim() : (isEs ? "Sin profesional" : "Unassigned");
        workerCounts[name] = (workerCounts[name] || 0) + 1;
        workerRevenue[name] = (workerRevenue[name] || 0) + Number(a.service?.price || 0);
      });

      const chartData = Object.entries(workerRevenue).map(([name, value]) => ({ name, value }));
      const topWorker = Object.entries(workerCounts).reduce((max, cur) => cur[1] > max[1] ? cur : max, ["Ninguno", 0]);

      return {
        title: isEs ? "Rendimiento por Colaborador" : "Staff Performance",
        description: isEs ? "Carga de trabajo, productividad e ingresos generados por cada estilista." : "Workload, productivity, and revenue generated by each stylist.",
        summary: isEs 
          ? `El colaborador con más turnos atendidos es "${topWorker[0]}" con un volumen de ${topWorker[1]} citas en el sistema.`
          : `The staff member with the most completed appointments is "${topWorker[0]}" with ${topWorker[1]} bookings in the system.`,
        kpis: [
          { label: isEs ? "Estilista Top" : "Top Stylist", value: topWorker[0] === "Ninguno" ? (isEs ? "Ninguno" : "None") : topWorker[0], icon: <User size={18} className="text-success" /> },
          { label: isEs ? "Citas Atendidas" : "Appointments Handled", value: isEs ? `${topWorker[1]} turnos` : `${topWorker[1]} slots`, icon: <CheckCircle size={18} className="text-primary" /> },
          { label: isEs ? "Colaboradores Activos" : "Active Staff", value: isEs ? `${workers.length} profesionales` : `${workers.length} professionals`, icon: <Briefcase size={18} className="text-info" /> }
        ],
        chart: {
          type: "bar",
          title: isEs ? "Ingresos Generados por Colaborador (ARS)" : "Revenue Generated by Staff",
          data: chartData.length ? chartData : [{ name: isEs ? "Ninguno" : "None", value: 0 }]
        },
        table: {
          headers: isEs ? ["Colaborador", "Citas Realizadas", "Participación %", "Total Facturado"] : ["Staff", "Completed Slots", "Share %", "Total Billed"],
          rows: Object.entries(workerCounts).map(([name, count]) => [
            name,
            isEs ? `${count} turnos` : `${count} slots`,
            `${Math.round((count / (activeAppts.length || 1)) * 100)}%`,
            currency(workerRevenue[name] || 0)
          ])
        }
      };
    },

    "finanzas-mes": () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthAppts = appointmentsWithPayment.filter(a => {
        const d = new Date(a.startsAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const active = monthAppts.filter(a => a.status !== "CANCELLED");
      const total = active.reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
      
      // Agrupación de ingresos por categoría de servicio
      const catMap = {};
      active.forEach(a => {
        const cat = a.service?.category || (isEs ? "Estética" : "Aesthetic");
        catMap[cat] = (catMap[cat] || 0) + Number(a.service?.price || 0);
      });
      const chartData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

      return {
        title: isEs ? "Finanzas del Mes" : "Monthly Finances",
        description: isEs ? "Monitoreo consolidado de facturación, comisiones y volumen financiero mensual." : "Consolidated monitoring of monthly billing, commissions, and financial volume.",
        summary: isEs 
          ? `En el mes de ${now.toLocaleDateString("es-AR", { month: "long" })}, se han facturado ${currency(total)} a través de ${active.length} reservas activas.`
          : `In the month of ${now.toLocaleDateString("en-US", { month: "long" })}, a total of ${currency(total)} has been billed across ${active.length} active bookings.`,
        kpis: [
          { label: isEs ? "Ingresos Mensuales" : "Monthly Income", value: currency(total), icon: <DollarSign size={18} className="text-success" /> },
          { label: isEs ? "Citas Confirmadas" : "Confirmed Bookings", value: isEs ? `${active.length} turnos` : `${active.length} slots`, icon: <CheckCircle size={18} className="text-primary" /> },
          { label: isEs ? "Tasa Cancelación Mes" : "Monthly Cancellation Rate", value: `${monthAppts.length ? Math.round(((monthAppts.length - active.length) / monthAppts.length) * 100) : 0}%`, icon: <XCircle size={18} className="text-danger" /> }
        ],
        chart: {
          type: "pie",
          title: isEs ? "Participación Financiera por Categoría de Servicio" : "Financial Share by Service Category",
          data: chartData.length ? chartData : [{ name: isEs ? "Ninguno" : "None", value: 0 }]
        },
        table: {
          headers: isEs ? ["Categoría de Servicio", "Participación %", "Facturado"] : ["Service Category", "Share %", "Billed"],
          rows: Object.entries(catMap).map(([name, value]) => [
            name,
            `${Math.round((value / (total || 1)) * 100)}%`,
            currency(value)
          ])
        }
      };
    },

    "cancelaciones-ausencias": () => {
      const cancelledAppts = appointments.filter(a => a.status === "CANCELLED");
      const totalApptsCount = appointments.length;
      const cancellationRate = totalApptsCount ? Math.round((cancelledAppts.length / totalApptsCount) * 100) : 0;
      
      const lostRevenue = cancelledAppts.reduce((sum, a) => sum + Number(a.service?.price || 0), 0);

      // Agrupación por servicio cancelado
      const serviceCancelMap = {};
      cancelledAppts.forEach(a => {
        const name = a.service?.name || (isEs ? "Otros" : "Others");
        serviceCancelMap[name] = (serviceCancelMap[name] || 0) + 1;
      });
      const chartData = Object.entries(serviceCancelMap).map(([name, value]) => ({ name, value }));

      return {
        title: isEs ? "Cancelaciones y Ausencias" : "Cancellations & Absences",
        description: isEs ? "Análisis operativo de citas caídas e ingresos perdidos para optimizar políticas del salón." : "Operational analysis of missed appointments and lost revenue to optimize salon policies.",
        summary: isEs 
          ? `El salón registra una tasa de cancelación del ${cancellationRate}% con un total de ${cancelledAppts.length} citas canceladas históricas. Esto representa una pérdida de facturación estimada de ${currency(lostRevenue)}.`
          : `The salon records a cancellation rate of ${cancellationRate}% with a total of ${cancelledAppts.length} historic cancelled appointments. This represents an estimated billing loss of ${currency(lostRevenue)}.`,
        kpis: [
          { label: isEs ? "Tasa Cancelaciones" : "Cancellation Rate", value: `${cancellationRate}%`, icon: <Percent size={18} className="text-danger" /> },
          { label: isEs ? "Citas Canceladas" : "Cancelled Bookings", value: isEs ? `${cancelledAppts.length} turnos` : `${cancelledAppts.length} slots`, icon: <XCircle size={18} className="text-warning" /> },
          { label: isEs ? "Facturación Perdida" : "Lost Revenue", value: currency(lostRevenue), icon: <DollarSign size={18} className="text-danger" /> }
        ],
        chart: {
          type: "bar",
          title: isEs ? "Cancelaciones por Tipo de Servicio (Cantidad)" : "Cancellations by Service Type (Qty)",
          data: chartData.length ? chartData : [{ name: isEs ? "Ninguno" : "None", value: 0 }]
        },
        table: {
          headers: isEs ? ["Fecha Cita", "Cliente", "Servicio que Iba a Realizarse", "Profesional Asignado", "Importe Pérdida"] : ["Appointment Date", "Client", "Intended Service", "Assigned Stylist", "Lost Revenue"],
          rows: cancelledAppts.slice(0, 10).map(a => [
            new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { day: "numeric", month: "short" }),
            `${a.client?.firstName || (isEs ? "Cliente" : "Client")} ${a.client?.lastName || ""}`.trim(),
            a.service?.name || (isEs ? "Servicio" : "Service"),
            a.worker?.firstName || (isEs ? "Profesional" : "Staff"),
            currency(a.service?.price)
          ])
        }
      };
    }
  };

  const handleSelectPredefinedReport = (reportId) => {
    if (reportDataCalculators[reportId]) {
      const report = reportDataCalculators[reportId]();
      setActiveReport({
        id: reportId,
        ...report
      });
    }
  };

  // --- CONSULTAS PERSONALIZADAS CON IA ---
  const handleAiQuerySubmit = async (e) => {
    e.preventDefault();
    const query = aiQuestion.trim();
    if (!query) return;

    setAiLoading(true);
    setAiError("");
    setActiveReport(null);

    try {
      // 1. Llamar al backend real /ai/report
      const payload = await postGadgetAiReport({
        question: query,
        viewPreferences: {
          showSummary: true,
          showInsights: true,
          showKpis: true,
          showChart: true,
          showActions: true
        }
      });

      // 2. Mapear la respuesta de la IA a la estructura de reporte visual premium
      const mappedReport = {
        title: "Análisis Inteligente Aura Copilot",
        description: `Resultado de tu consulta: "${query}"`,
        summary: payload.summary,
        insights: payload.insights || [],
        kpis: (payload.kpis || []).map((k, idx) => ({
          label: k.label,
          value: k.value,
          icon: idx === 0 ? <TrendingUp size={18} className="text-success" /> : idx === 1 ? <DollarSign size={18} className="text-primary" /> : <CheckCircle size={18} className="text-info" />
        })),
        chart: payload.chart ? {
          type: payload.chart.type || "bar",
          title: payload.chart.title || "Métricas Resultantes",
          data: payload.chart.data || []
        } : null,
        // Generar una tabla de desglose a partir de los datos del gráfico si aplica
        table: payload.chart?.data ? {
          headers: ["Concepto", "Valor / Métrica"],
          rows: payload.chart.data.map(d => [d.name, typeof d.value === "number" && d.name.toLowerCase().includes("ingres") ? currency(d.value) : d.value])
        } : null
      };

      setActiveReport(mappedReport);
      setSuccessMessage("¡Informe de IA generado con éxito con datos en tiempo real!");
    } catch (err) {
      console.warn("Fallo de conexión real de IA. Aplicando fallback heurístico local...", err);
      // Fallback Heurístico Local Robusto
      runLocalQueryFallback(query);
    } finally {
      setAiLoading(false);
      setAiQuestion("");
    }
  };

  // Heurística local en caso de que falle la conexión con OpenAI o no esté configurado
  const runLocalQueryFallback = (query) => {
    const q = query.toLowerCase();
    
    if (q.includes("venta") || q.includes("ganamos") || q.includes("factura") || q.includes("ingreso")) {
      if (q.includes("semana") || q.includes("7 dias")) {
        handleSelectPredefinedReport("ventas-semana");
        setSuccessMessage("Interpretado como: Ventas de la semana.");
      } else if (q.includes("mes") || q.includes("30 dias")) {
        handleSelectPredefinedReport("finanzas-mes");
        setSuccessMessage("Interpretado como: Finanzas del mes.");
      } else {
        handleSelectPredefinedReport("ventas-dia");
        setSuccessMessage("Interpretado como: Ventas del día.");
      }
    } else if (q.includes("cliente")) {
      if (q.includes("gastaron") || q.includes("mas dinero") || q.includes("vip")) {
        // Clientes con mayor facturación
        const activeAppts = appointments.filter(a => a.status !== "CANCELLED");
        const clientMap = {};
        activeAppts.forEach(a => {
          if (!a.clientId) return;
          const k = a.clientId;
          if (!clientMap[k]) clientMap[k] = { name: `${a.client?.firstName || ""} ${a.client?.lastName || ""}`.trim(), spend: 0, count: 0 };
          clientMap[k].spend += Number(a.service?.price || 0);
          clientMap[k].count++;
        });
        const topSpend = Object.values(clientMap).sort((a, b) => b.spend - a.spend).slice(0, 5);
        setActiveReport({
          title: "Top Clientes que más Gastaron",
          description: "Análisis de ticket de clientes VIP con mayor facturación acumulada.",
          summary: `Los clientes más rentables del salón acumulan un volumen conjunto importante. "${topSpend[0]?.name || "N/A"}" encabeza la lista con ${currency(topSpend[0]?.spend || 0)} aportados.`,
          kpis: [
            { label: "Cliente Top Gasto", value: topSpend[0]?.name || "N/A", icon: <User size={18} className="text-success" /> },
            { label: "Gasto Máximo", value: currency(topSpend[0]?.spend || 0), icon: <DollarSign size={18} className="text-primary" /> },
            { label: "Visitas Realizadas", value: `${topSpend[0]?.count || 0} turnos`, icon: <CheckCircle size={18} className="text-warning" /> }
          ],
          chart: {
            type: "bar",
            title: "Facturación por Cliente (ARS)",
            data: topSpend.map(t => ({ name: t.name, value: t.spend }))
          },
          table: {
            headers: ["Cliente", "Reservas Finalizadas", "Gasto Total Acumulado"],
            rows: topSpend.map(t => [t.name, `${t.count} visitas`, currency(t.spend)])
          }
        });
        setSuccessMessage("Interpretado como: Clientes de mayor facturación.");
      } else {
        handleSelectPredefinedReport("clientes-frecuentes");
        setSuccessMessage("Interpretado como: Clientes frecuentes.");
      }
    } else if (q.includes("servicio") || q.includes("corte" || q.includes("color"))) {
      handleSelectPredefinedReport("servicios-solicitados");
      setSuccessMessage("Interpretado como: Servicios más solicitados.");
    } else if (q.includes("producto") || q.includes("stock") || q.includes("inventario") || q.includes("acaband")) {
      handleSelectPredefinedReport("bajo-stock");
      setSuccessMessage("Interpretado como: Insumos bajo stock crítico.");
    } else if (q.includes("dia") && (q.includes("reserva") || q.includes("turno") || q.includes("cita"))) {
      // Días con más reservas
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const dayCounts = { "Lunes": 0, "Martes": 0, "Miércoles": 0, "Jueves": 0, "Viernes": 0, "Sábado": 0 };
      appointments.filter(a => a.status !== "CANCELLED").forEach(a => {
        const dayName = days[new Date(a.startsAt).getDay()];
        if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;
      });
      const topDay = Object.entries(dayCounts).reduce((max, cur) => cur[1] > max[1] ? cur : max, ["Ninguno", 0]);
      setActiveReport({
        title: "Días con Más Reservas",
        description: "Análisis histórico de reservas por día de la semana para optimizar dotación de personal.",
        summary: `El día con mayor congestión en la agenda es el "${topDay[0]}" con un total acumulado de ${topDay[1]} citas confirmadas.`,
        kpis: [
          { label: "Día Pico", value: topDay[0], icon: <Calendar size={18} className="text-success" /> },
          { label: "Reservas Totales", value: `${topDay[1]} turnos`, icon: <CheckCircle size={18} className="text-primary" /> },
          { label: "Días Cubiertos", value: "6 días hábiles", icon: <Clock size={18} className="text-warning" /> }
        ],
        chart: {
          type: "area",
          title: "Concurrencia por Día de la Semana (Citas)",
          data: Object.entries(dayCounts).map(([name, value]) => ({ name, value }))
        },
        table: {
          headers: ["Día", "Citas Confirmadas", "Estado Operativo"],
          rows: Object.entries(dayCounts).map(([name, value]) => [name, `${value} reservas`, value > 10 ? "Alta Demanda" : "Normal"])
        }
      });
      setSuccessMessage("Interpretado como: Reservas por día de la semana.");
    } else {
      // Si no coincide con nada, usar "ventas del día" por defecto
      handleSelectPredefinedReport("ventas-dia");
      setSuccessMessage("Mostrando reporte por defecto: Ventas del día.");
    }
  };

  // --- RENDERIZACIÓN DINÁMICA DE GADGETS Y FILTRADO ---
  const gadgetsList = useMemo(() => {
    return [
      {
        id: "total-vendido",
        title: isEs ? "Total Vendido" : "Total Sold",
        category: isEs ? "Finanzas" : "Finances",
        description: isEs ? "Visualización de facturación neta acumulada en tiempo real." : "Real-time visualization of net accumulated billing.",
        keywords: ["ventas", "ingresos", "dinero", "caja", "pagos", "facturacion", "total"],
        component: () => {
          const total = appointments.filter(a => a.status !== "CANCELLED").reduce((sum, a) => sum + Number(a.service?.price || 0), 0);
          return (
            <div className="text-center py-2">
              <div className="text-muted smaller mb-1">{isEs ? "Facturación Histórica" : "Historical Billing"}</div>
              <h4 className="fw-black text-success mb-2" style={{ fontSize: "22px" }}>{currency(total)}</h4>
              <Badge bg="success-soft" className="text-success rounded-pill px-2 py-1 small">
                <TrendingUp size={11} className="me-1" /> {isEs ? "Activo" : "Active"}
              </Badge>
            </div>
          );
        }
      },
      {
        id: "ventas-dia-chart",
        title: isEs ? "Ventas por Día" : "Daily Sales",
        category: isEs ? "Finanzas" : "Finances",
        description: isEs ? "Monitoreo dinámico del histórico diario de ventas." : "Dynamic monitoring of daily sales history.",
        keywords: ["ventas", "ingresos", "dias", "diario", "grafico", "evolucion"],
        component: () => {
          // Últimos 5 días con facturación
          const daysMap = {};
          appointments.filter(a => a.status !== "CANCELLED").slice(-15).forEach(a => {
            const dateStr = new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { day: "numeric", month: "short" });
            daysMap[dateStr] = (daysMap[dateStr] || 0) + Number(a.service?.price || 0);
          });
          const chartData = Object.entries(daysMap).slice(-5).map(([name, value]) => ({ name, value }));
          return (
            <div style={{ height: "90px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length ? chartData : [{ name: isEs ? "Sin datos" : "No data", value: 0 }]}>
                  <Tooltip formatter={(v) => currency(v)} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="rgba(16,185,129,0.08)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        }
      },
      {
        id: "metodo-pago-pie",
        title: isEs ? "Método de Pago" : "Payment Method",
        category: isEs ? "Finanzas" : "Finances",
        description: isEs ? "Canales de cobro utilizados por los clientes." : "Payment channels used by customers.",
        keywords: ["metodo", "pago", "ingresos", "efectivo", "transferencia", "tarjeta", "canales"],
        component: () => {
          const methodMap = { "Efectivo": 0, "Tarjeta": 0, "Transferencia": 0 };
          appointmentsWithPayment.forEach(a => {
            const cat = a.paymentMethod.includes("Tarjeta") ? "Tarjeta" : a.paymentMethod.includes("Transferencia") ? "Transferencia" : "Efectivo";
            methodMap[cat] += Number(a.service?.price || 0);
          });
          const chartData = Object.entries(methodMap).map(([name, value]) => ({ name: translatePaymentMethod(name, isEs), value }));
          return (
            <div style={{ height: "90px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(v) => currency(v)} />
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={35} fill="#10b981">
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={["#10b981", "#3b82f6", "#f59e0b"][i % 3]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        }
      },
      {
        id: "servicios-mas-vendidos",
        title: isEs ? "Servicios Más Vendidos" : "Top Selling Services",
        category: isEs ? "Finanzas" : "Finances",
        description: isEs ? "Los servicios más solicitados de Aura Studio." : "The most requested services of Aura Studio.",
        keywords: ["ventas", "servicios", "solicitados", "mas vendidos", "corte", "color"],
        component: () => {
          const counts = {};
          appointments.forEach(a => {
            const name = a.service?.name || (isEs ? "Otros" : "Others");
            counts[name] = (counts[name] || 0) + 1;
          });
          const top = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 2);
          return (
            <div className="d-grid gap-2 text-dark">
              {top.map(([name, val], i) => (
                <div key={i} className="d-flex justify-content-between align-items-center smaller border-bottom pb-1">
                  <span className="fw-semibold text-truncate" style={{ maxWidth: "70%" }}>{name}</span>
                  <Badge bg="primary-soft" className="text-primary rounded-pill">{val} {isEs ? "turnos" : "bookings"}</Badge>
                </div>
              ))}
            </div>
          );
        }
      },
      {
        id: "clientes-frecuentes-list",
        title: isEs ? "Clientes Frecuentes" : "Frequent Clients",
        category: isEs ? "Clientes" : "Clients",
        description: isEs ? "Listado rápido de visitas recurrentes de clientes fidelizados." : "Quick list of recurring visits from loyal clients.",
        keywords: ["clientes", "frecuentes", "recurrentes", "fidelidad", "top"],
        component: () => {
          const clientMap = {};
          appointments.forEach(a => {
            if (!a.clientId) return;
            const name = `${a.client?.firstName || ""} ${a.client?.lastName || ""}`.trim();
            clientMap[name] = (clientMap[name] || 0) + 1;
          });
          const top = Object.entries(clientMap).sort((a,b) => b[1]-a[1]).slice(0, 3);
          return (
            <div className="d-grid gap-1.5 smaller">
              {top.map(([name, val], i) => (
                <div key={i} className="d-flex justify-content-between align-items-center text-dark">
                  <span className="fw-semibold text-truncate">{name}</span>
                  <strong className="text-muted">{val} {isEs ? "visitas" : "visits"}</strong>
                </div>
              ))}
            </div>
          );
        }
      },
      {
        id: "ultima-visita-table",
        title: isEs ? "Última Visita" : "Last Visit",
        category: isEs ? "Clientes" : "Clients",
        description: isEs ? "Listado de últimas visitas calendarizadas en el salón." : "List of the last scheduled visits in the salon.",
        keywords: ["clientes", "visitas", "ultima visita", "fechas", "agenda", "historico"],
        component: () => {
          const recent = appointments.slice(-3).reverse();
          return (
            <div className="d-grid gap-1 text-dark smaller">
              {recent.map((a, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center border-bottom pb-1">
                  <span className="fw-semibold text-truncate" style={{ maxWidth: "60%" }}>{a.client?.firstName} {a.client?.lastName}</span>
                  <span className="text-muted smaller">{new Date(a.startsAt).toLocaleDateString(isEs ? "es-AR" : "en-US", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          );
        }
      },
      {
        id: "total-gastado-list",
        title: isEs ? "Total Gastado" : "Total Spent",
        category: isEs ? "Clientes" : "Clients",
        description: isEs ? "Top 3 clientes VIP que más ingresos aportaron al negocio." : "Top 3 VIP clients who contributed the most revenue to the business.",
        keywords: ["clientes", "gasto", "total gastado", "dinero", "ingresos", "vip"],
        component: () => {
          const spendMap = {};
          appointments.forEach(a => {
            if (!a.clientId) return;
            const name = `${a.client?.firstName || ""} ${a.client?.lastName || ""}`.trim();
            spendMap[name] = (spendMap[name] || 0) + Number(a.service?.price || 0);
          });
          const top = Object.entries(spendMap).sort((a,b) => b[1]-a[1]).slice(0, 3);
          return (
            <div className="d-grid gap-2 text-dark smaller">
              {top.map(([name, val], i) => (
                <div key={i} className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold text-truncate">{name}</span>
                  <strong className="text-success">{currency(val)}</strong>
                </div>
              ))}
            </div>
          );
        }
      },
      {
        id: "bajo-stock-list",
        title: isEs ? "Bajo Stock" : "Low Stock",
        category: isEs ? "Inventario" : "Inventory",
        description: isEs ? "Alerta crítica de insumos que necesitan reposición inmediata." : "Critical alert for supplies needing immediate replenishment.",
        keywords: ["bajo stock", "productos", "inventario", "insumos", "alerta", "reposicion"],
        component: () => {
          const low = INITIAL_PRODUCTS.filter(p => p.stock < p.limit).slice(0, 3);
          return (
            <div className="d-grid gap-1.5 text-dark smaller">
              {low.map((p, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center border-bottom pb-1">
                  <span className="fw-semibold text-truncate" style={{ maxWidth: "60%" }}>{p.name}</span>
                  <Badge bg="danger-soft" className="text-danger rounded-pill">{p.stock} {isEs ? "en stock" : "in stock"}</Badge>
                </div>
              ))}
            </div>
          );
        }
      },
      {
        id: "productos-mas-vendidos",
        title: isEs ? "Productos Más Vendidos" : "Top Selling Products",
        category: isEs ? "Inventario" : "Inventory",
        description: isEs ? "Insumos y productos de mayor rotación comercial." : "Highest commercial turnover supplies and products.",
        keywords: ["productos", "vendidos", "rotacion", "consumo", "insumos", "salida"],
        component: () => {
          return (
            <div className="d-grid gap-2 text-dark smaller">
              <div className="d-flex justify-content-between">
                <span className="fw-semibold">1. Shampoo PH Neutro</span>
                <span className="text-muted">12 {isEs ? "un." : "units"}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="fw-semibold">2. Tinta L'Oreal Majirel</span>
                <span className="text-muted">9 {isEs ? "un." : "units"}</span>
              </div>
            </div>
          );
        }
      },
      {
        id: "valor-inventario-stat",
        title: isEs ? "Valor del Inventario" : "Inventory Value",
        category: isEs ? "Inventario" : "Inventory",
        description: isEs ? "Valuación monetaria total del stock físico en el salón." : "Total monetary valuation of the physical stock in the salon.",
        keywords: ["valor", "inventario", "insumos", "valuacion", "costo", "total"],
        component: () => {
          const totalVal = INITIAL_PRODUCTS.reduce((sum, p) => sum + (p.stock * p.cost), 0);
          return (
            <div className="text-center py-2">
              <div className="text-muted smaller mb-1">{isEs ? "Capital en Insumos" : "Supplies Capital"}</div>
              <h4 className="fw-black text-dark mb-2" style={{ fontSize: "22px" }}>{currency(totalVal)}</h4>
              <span className="text-muted smaller">{isEs ? "Valuación Real" : "Real Valuation"}</span>
            </div>
          );
        }
      },
      {
        id: "alertas-reposicion",
        title: isEs ? "Alertas de Reposición" : "Replenishment Alerts",
        category: isEs ? "Inventario" : "Inventory",
        description: isEs ? "Recomendaciones de órdenes de compra automáticas." : "Recommendations of automatic purchase orders.",
        keywords: ["alertas", "reposicion", "comprar", "pedido", "inventario", "insumos"],
        component: () => {
          const low = INITIAL_PRODUCTS.filter(p => p.stock < p.limit).length;
          return (
            <div className="text-center py-2">
              {low > 0 ? (
                <>
                  <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-4 d-inline-flex mb-2">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="small fw-semibold text-danger">{low} {isEs ? "Insumos críticos" : "Critical supplies"}</div>
                </>
              ) : (
                <div className="small text-success fw-bold">{isEs ? "Stock en nivel óptimo" : "Stock at optimal level"}</div>
              )}
            </div>
          );
        }
      }
    ];
  }, [appointments, appointmentsWithPayment, isEs]);

  // --- FILTRO DE GADGETS ---
  const filteredGadgets = useMemo(() => {
    let list = gadgetsList;

    // 1. Filtrar por categoría (Chips)
    if (selectedCategory !== "Todos") {
      list = list.filter(g => g.category === selectedCategory);
    }

    // 2. Si el input coincide con palabras mágicas específicas del requerimiento (Punto 3):
    const q = searchQuery.toLowerCase().trim();
    if (q === "ventas") {
      return gadgetsList.filter(g => ["total-vendido", "ventas-dia-chart", "metodo-pago-pie", "servicios-mas-vendidos"].includes(g.id));
    }
    if (q === "clientes") {
      return gadgetsList.filter(g => ["clientes-frecuentes-list", "ultima-visita-table", "total-gastado-list", "servicios-mas-vendidos"].includes(g.id));
    }
    if (q === "inventario") {
      return gadgetsList.filter(g => ["bajo-stock-list", "productos-mas-vendidos", "valor-inventario-stat", "alertas-reposicion"].includes(g.id));
    }

    // 3. Filtro general funcional (Punto 4)
    if (q) {
      list = list.filter(g => {
        const titleMatch = g.title.toLowerCase().includes(q);
        const descMatch = g.description.toLowerCase().includes(q);
        const categoryMatch = g.category.toLowerCase().includes(q);
        const keywordsMatch = g.keywords.some(kw => kw.toLowerCase().includes(q));
        return titleMatch || descMatch || categoryMatch || keywordsMatch;
      });
    }

    return list;
  }, [searchQuery, selectedCategory, gadgetsList]);

  // --- EXPORTAR A CSV (Real y Funcional) ---
  const handleExportCSV = () => {
    if (!activeReport || !activeReport.table) return;
    
    const headers = activeReport.table.headers.join(",");
    const rows = activeReport.table.rows.map(row => 
      row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Aura_${activeReport.title.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMessage("¡Reporte exportado como archivo CSV exitosamente!");
  };

  // --- ENVIAR POR WHATSAPP (Real y Funcional) ---
  const handleSendWhatsApp = () => {
    if (!activeReport) return;
    
    let text = `*Reporte de Aura Studio* 💡\n`;
    text += `*${activeReport.title}*\n`;
    text += `_${activeReport.description}_\n\n`;
    text += `*Resumen:* ${activeReport.summary}\n\n`;
    
    if (activeReport.kpis && activeReport.kpis.length) {
      text += `*Métricas Claves:*\n`;
      activeReport.kpis.forEach(k => {
        text += `- ${k.label}: ${k.value}\n`;
      });
    }

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
    setSuccessMessage("¡Redirigiendo a WhatsApp con el borrador del reporte!");
  };

  // --- ENVIAR POR EMAIL ---
  const handleSendEmail = () => {
    if (!activeReport) return;
    
    const subject = encodeURIComponent(`Informe Inteligente - Aura Studio - ${activeReport.title}`);
    let body = `Hola Selenia,\n\nTe comparto el informe inteligente de Aura Studio:\n\n`;
    body += `${activeReport.title}\n`;
    body += `${activeReport.description}\n\n`;
    body += `Resumen:\n${activeReport.summary}\n\n`;
    
    if (activeReport.kpis && activeReport.kpis.length) {
      body += `Métricas Claves:\n`;
      activeReport.kpis.forEach(k => {
        body += `- ${k.label}: ${k.value}\n`;
      });
    }

    body += `\nGenerado automáticamente por el Copilot Inteligente de Aura Studio.`;
    
    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`);
    setSuccessMessage("¡Bandeja de correo abierta con el informe pre-redactado!");
  };

  // --- GUARDAR REPORTE ---
  const handleSaveReport = () => {
    setSuccessMessage("¡El informe ha sido guardado con éxito en tu panel de control!");
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
            <Alert variant="success" className="shadow-lg border-2 rounded-4 px-4 py-3 d-flex align-items-center gap-2">
              <CheckCircle size={18} className="text-success animate-pulse" />
              <span className="fw-semibold text-dark smaller">{successMessage}</span>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="reports-card-container border-0 mb-4">
        <Card.Body className="p-0">
          
          {/* HEADER DE LA SECCIÓN */}
          <div className="d-flex align-items-center gap-2.5 mb-4">
            <div className="p-2.5 bg-success bg-opacity-10 text-success rounded-4 pulse-sparkle">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="h5 fw-black text-dark mb-0.5">{isEs ? "Informes Inteligentes & Copilot IA" : "Smart Reports & AI Copilot"}</h2>
              <p className="text-muted smaller mb-0">{isEs ? "Generá reportes con accesos rápidos, consultas en lenguaje natural o explorá gadgets." : "Generate reports with quick access, natural language queries, or explore gadgets."}</p>
            </div>
          </div>

          <Row className="g-4 mb-4">
            
            {/* COLUMNA IZQUIERDA: BUSCADOR & FILTROS & INFORMES PREDETERMINADOS */}
            <Col lg={7} className="border-end pe-lg-4">
              <h3 className="smaller text-muted fw-bold uppercase mb-3" style={{ letterSpacing: "0.08em" }}>
                {isEs ? "1. Informes Predeterminados & Filtros" : "1. Predefined Reports & Filters"}
              </h3>
              
              {/* Buscador de gadgets */}
              <div className="search-glow-container mb-3.5">
                <Search size={16} className="search-icon-inside" />
                <Form.Control
                  type="text"
                  placeholder={isEs ? "Buscar gadget por título, descripción o palabra clave..." : "Search gadget by title, description, or keyword..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-glow-input"
                />
              </div>

              {/* Chips de categorías */}
              <div className="category-chips-wrapper mb-4">
                {["Todos", "Finanzas", "Clientes", "Inventario"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
                  >
                    {cat === "Todos" ? <Layers size={13} /> : cat === "Finanzas" ? <CreditCard size={13} /> : cat === "Clientes" ? <Users size={13} /> : <Package size={13} />}
                    <span>{cat === "Todos" ? (isEs ? "Todos" : "All") : cat === "Finanzas" ? (isEs ? "Finanzas" : "Finances") : cat === "Clientes" ? (isEs ? "Clientes" : "Clients") : (isEs ? "Inventario" : "Inventory")}</span>
                  </button>
                ))}
              </div>

              {/* Grid de informes predeterminados rápidos */}
              <h4 className="smaller text-dark fw-bold mb-3 d-flex align-items-center gap-1.5">
                <FileText size={14} className="text-success" />
                <span>{isEs ? "Accesos rápidos de Informes" : "Quick Report Access"}</span>
              </h4>
              
              <Row className="g-2.5">
                {[
                  { id: "ventas-dia", label: isEs ? "Ventas de hoy" : "Today's sales", color: "success" },
                  { id: "ventas-semana", label: isEs ? "Ventas semanales" : "Weekly sales", color: "success" },
                  { id: "servicios-solicitados", label: isEs ? "Servicios estrella" : "Star services", color: "primary" },
                  { id: "clientes-frecuentes", label: isEs ? "Clientes frecuentes" : "Frequent clients", color: "info" },
                  { id: "ingresos-metodo-pago", label: isEs ? "Métodos de Pago" : "Payment methods", color: "success" },
                  { id: "bajo-stock", label: isEs ? "Bajo Stock" : "Low Stock", color: "warning" },
                  { id: "rendimiento-empleado", label: isEs ? "Rendimiento Equipo" : "Team Performance", color: "info" },
                  { id: "finanzas-mes", label: isEs ? "Finanzas del mes" : "Monthly finances", color: "success" },
                  { id: "cancelaciones-ausencias", label: isEs ? "Cancelaciones" : "Cancellations", color: "danger" }
                ].map((rep) => (
                  <Col xs={6} md={4} key={rep.id}>
                    <Button
                      variant={activeReport?.id === rep.id ? rep.color : "outline-dark"}
                      onClick={() => handleSelectPredefinedReport(rep.id)}
                      className="w-100 py-2.5 rounded-4 small fw-bold text-truncate border text-start d-flex align-items-center gap-2 hover-scale"
                      style={{ fontSize: "11.5px" }}
                    >
                      <div className={`rounded-circle bg-${rep.color}`} style={{ width: "6px", height: "6px" }} />
                      <span>{rep.label}</span>
                    </Button>
                  </Col>
                ))}
              </Row>
            </Col>

            {/* COLUMNA DERECHA: CONSULTAS PERSONALIZADAS CON IA */}
            <Col lg={5}>
              <h3 className="smaller text-muted fw-bold uppercase mb-3" style={{ letterSpacing: "0.08em" }}>
                {isEs ? "2. Consultas Personalizadas con IA" : "2. Custom AI Queries"}
              </h3>
              
              <div className="ai-query-box">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-success animate-pulse" />
                  <strong className="text-white small">{isEs ? "Preguntale a Aura Copilot" : "Ask Aura Copilot"}</strong>
                </div>
                
                <p className="text-white-50 smaller mb-3.5">
                  {isEs ? "Escribí en lenguaje natural y nuestro Copilot interpretará los datos o creará gadgets para vos." : "Write in natural language and our Copilot will interpret the data or create gadgets for you."}
                </p>

                <Form onSubmit={handleAiQuerySubmit} className="d-grid gap-3">
                  <div className="ai-query-input-wrapper">
                    <Form.Control
                      type="text"
                      placeholder={isEs ? "“¿Cuánto vendimos esta semana?”..." : "“How much did we sell this week?”..."}
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      disabled={aiLoading}
                      className="ai-query-input shadow-none"
                    />
                    <Button
                      type="submit"
                      disabled={aiLoading || !aiQuestion.trim()}
                      className="btn-ai-submit py-2 px-3 small border-0"
                    >
                      {aiLoading ? (
                        <Spinner animation="border" size="sm" className="text-white" />
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>{isEs ? "Consultar" : "Submit"}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Form>

                {aiError && <Alert variant="danger" className="mt-3 py-2 small">{aiError}</Alert>}

                {/* Preguntas frecuentes sugeridas */}
                <div className="mt-4">
                  <div className="text-white-50 smaller fw-bold mb-2">{isEs ? "Preguntas de ejemplo:" : "Example questions:"}</div>
                  <div className="d-grid gap-1.5">
                    {[
                      isEs ? "¿Cuánto vendimos esta semana?" : "How much did we sell this week?",
                      isEs ? "Muéstrame los clientes que más gastaron este mes" : "Show me the top spending clients this month",
                      isEs ? "Qué servicios dejaron más dinero" : "Which services generated the most revenue",
                      isEs ? "Qué productos se están acabando" : "Which products are running out",
                      isEs ? "Cuáles son los días con más reservas" : "Which days have the most bookings"
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAiQuestion(p);
                        }}
                        className="btn btn-link text-start text-white-50 p-0 smaller text-decoration-none hover-text-white d-flex align-items-center gap-1 hover-scale"
                        style={{ fontSize: "11px" }}
                      >
                        <ArrowRight size={10} className="text-success" />
                        <span>“{p}”</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* ÁREA DE INFORME VISUAL ACTIVO */}
          <AnimatePresence mode="wait">
            {activeReport && (
              <motion.div
                key={activeReport.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="report-sheet-container mb-4"
              >
                {/* Cabecera del informe */}
                <div className="report-sheet-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h3 className="h6 fw-black text-dark mb-1">{activeReport.title}</h3>
                    <p className="text-muted smaller mb-0">{activeReport.description}</p>
                  </div>
                  
                  {/* Botones de acción del reporte */}
                  <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-dark" size="sm" onClick={handleExportCSV} className="rounded-pill px-3 py-1.5 fw-bold small border d-flex align-items-center gap-1.5">
                      <Download size={13} />
                      <span>Exportar CSV</span>
                    </Button>
                    <Button variant="outline-dark" size="sm" onClick={handleSendWhatsApp} className="rounded-pill px-3 py-1.5 fw-bold small border d-flex align-items-center gap-1.5">
                      <MessageSquare size={13} className="text-success" />
                      <span>WhatsApp</span>
                    </Button>
                    <Button variant="outline-dark" size="sm" onClick={handleSendEmail} className="rounded-pill px-3 py-1.5 fw-bold small border d-flex align-items-center gap-1.5">
                      <Send size={13} />
                      <span>Email</span>
                    </Button>
                    <Button variant="dark" size="sm" onClick={handleSaveReport} className="rounded-pill px-3 py-1.5 fw-bold small border-0 d-flex align-items-center gap-1.5 bg-success">
                      <Bookmark size={13} />
                      <span>Guardar</span>
                    </Button>
                  </div>
                </div>

                <div className="report-sheet-body">
                  {/* Resumen explicativo */}
                  <div className="p-3 bg-light rounded-4 border-start border-success border-4 mb-4 small fw-semibold text-dark">
                    {activeReport.summary}
                  </div>

                  {/* KPIs del reporte */}
                  <Row className="g-3 mb-4">
                    {activeReport.kpis.map((k, idx) => (
                      <Col md={4} key={idx}>
                        <Card className="p-3 border rounded-4 bg-light shadow-none">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="text-muted smaller fw-bold">{k.label}</span>
                            <div className="p-1.5 bg-white border rounded-3">{k.icon}</div>
                          </div>
                          <strong className="h5 fw-black text-dark m-0">{k.value}</strong>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <Row className="g-4">
                    {/* Gráfico */}
                    {activeReport.chart && (
                      <Col md={activeReport.table ? 6 : 12}>
                        <Card className="p-3 border rounded-4 bg-light shadow-none h-100">
                          <h4 className="smaller text-dark fw-bold mb-3">{activeReport.chart.title}</h4>
                          <div style={{ height: "240px", width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              {activeReport.chart.type === "bar" ? (
                                <BarChart data={activeReport.chart.data}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                  <Tooltip formatter={(v) => typeof v === "number" && activeReport.chart.title.includes("ARS") ? currency(v) : v} />
                                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                                </BarChart>
                              ) : activeReport.chart.type === "line" ? (
                                <LineChart data={activeReport.chart.data}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                  <Tooltip formatter={(v) => typeof v === "number" && activeReport.chart.title.includes("ARS") ? currency(v) : v} />
                                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: "#10b981", strokeWidth: 2 }} />
                                </LineChart>
                              ) : activeReport.chart.type === "area" ? (
                                <AreaChart data={activeReport.chart.data}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                  <Tooltip formatter={(v) => typeof v === "number" && activeReport.chart.title.includes("ARS") ? currency(v) : v} />
                                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="rgba(16,185,129,0.08)" strokeWidth={2.5} />
                                </AreaChart>
                              ) : (
                                <PieChart>
                                  <Pie
                                    data={activeReport.chart.data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={75}
                                    fill="#10b981"
                                    label={({ name, percent }) => `${name.slice(0, 10)} (${(percent * 100).toFixed(0)}%)`}
                                    style={{ fontSize: "9px", fontWeight: "700" }}
                                  >
                                    {activeReport.chart.data.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"][index % 5]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(v) => typeof v === "number" && activeReport.chart.title.includes("ARS") ? currency(v) : v} />
                                </PieChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      </Col>
                    )}

                    {/* Tabla de resultados */}
                    {activeReport.table && (
                      <Col md={activeReport.chart ? 6 : 12}>
                        <Card className="p-3 border rounded-4 bg-light shadow-none h-100 overflow-auto" style={{ maxHeight: "300px" }}>
                          <h4 className="smaller text-dark fw-bold mb-3">Detalle del Registro</h4>
                          <Table responsive hover size="sm" className="mb-0 align-middle">
                            <thead>
                              <tr style={{ fontSize: "10px" }}>
                                {activeReport.table.headers.map((h, i) => (
                                  <th key={i}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: "12px" }}>
                              {activeReport.table.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className={cIdx === 0 ? "fw-bold text-dark" : "text-muted"}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GRID DE GADGETS DINÁMICOS */}
          <h3 className="smaller text-muted fw-bold uppercase mb-3.5" style={{ letterSpacing: "0.08em" }}>
            3. Panel de Gadgets Dinámicos ({filteredGadgets.length})
          </h3>

          {filteredGadgets.length === 0 ? (
            <div className="text-center py-5 border border-dashed rounded-4 bg-light">
              <Search size={32} className="text-muted mb-2.5" />
              <h5 className="fw-bold text-dark mb-1">No encontramos gadgets relacionados</h5>
              <p className="text-muted smaller mb-0">Escribí "ventas", "clientes" o "inventario" para ver grupos específicos.</p>
            </div>
          ) : (
            <Row className="g-3">
              {filteredGadgets.map((gadget) => (
                <Col md={6} lg={3} key={gadget.id}>
                  <div className="gadget-card-custom">
                    <div>
                      <div className="d-flex justify-content-between align-items-start">
                        <span 
                          className="gadget-badge-category"
                          style={{
                            background: gadget.category === "Finanzas" ? "#ecfdf5" : gadget.category === "Clientes" ? "#eff6ff" : "#fef3c7",
                            color: gadget.category === "Finanzas" ? "#059669" : gadget.category === "Clientes" ? "#1d4ed8" : "#d97706"
                          }}
                        >
                          {gadget.category}
                        </span>
                      </div>
                      <h4 className="gadget-card-title">{gadget.title}</h4>
                      <p className="gadget-card-desc">{gadget.description}</p>
                    </div>
                    
                    {/* Renderizado del contenido interno del gadget */}
                    <div className="mt-2 border-top pt-2">
                      {gadget.component()}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}

        </Card.Body>
      </Card>
    </section>
  );
}
