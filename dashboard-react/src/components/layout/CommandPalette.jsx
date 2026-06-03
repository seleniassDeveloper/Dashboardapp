import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Star, Sparkles, Clock, CornerDownLeft, ArrowUpDown } from "lucide-react";
import { useBrand } from "../../header/name/BrandProvider";
import api from "../../lib/api.js";
import "./CommandPalette.css";

const ALL_MODULES = [
  { id: "dashboard", nameEs: "Dashboard / Panel principal", nameEn: "Dashboard / Home", icon: "📊", path: "/app" },
  { id: "appointments", nameEs: "Agenda / Calendario de Citas", nameEn: "Agenda / Appointments", icon: "📅", path: "/app/calendar" },
  { id: "clients", nameEs: "Clientes / Pacientes", nameEn: "Clients / Directory", icon: "👥", path: "/app/clients" },
  { id: "services", nameEs: "Servicios comerciales / Lista", nameEn: "Services / Catalog", icon: "✂️", path: "/app/services" },
  { id: "team", nameEs: "Equipo / Profesionales colaboradores", nameEn: "Team / Staff", icon: "👤", path: "/app/team" },
  
  // Finanzas & Submodules
  { id: "finances", nameEs: "Finanzas / Gastos e Ingresos", nameEn: "Finances & Cashflow", icon: "💰", path: "/app/finances" },
  { id: "finance_resumen", parentId: "finances", nameEs: "Resumen Financiero / Flujo de Caja", nameEn: "Financial Overview / Cashflow", icon: "📊", path: "/app/finances?tab=resumen", keywords: ["caja general", "flujo de caja", "ingresos y egresos", "metricas financieras", "finanzas resumen"] },
  { id: "finance_gastos_operativos", parentId: "finances", nameEs: "Gastos Operativos / Egresos del Negocio", nameEn: "Operational Expenses / Business Outflow", icon: "💸", path: "/app/finances?tab=gastos_operativos", keywords: ["gastos operativos", "egresos", "pagos luz", "alquileres", "facturas", "nuevo gasto", "crear gasto"] },
  { id: "finance_cierre_caja", parentId: "finances", nameEs: "Cierre de Caja Diario / Control de Caja", nameEn: "Daily Cash Closing & Control", icon: "🔑", path: "/app/finances?tab=gastos", keywords: ["cierre de caja", "caja diaria", "arqueo de caja", "caja chica", "control diario"] },
  { id: "finance_sueldos", parentId: "finances", nameEs: "Liquidación de Sueldos y Comisiones de Colaboradores", nameEn: "Salary Management & Commissions", icon: "🏆", path: "/app/finances?tab=sueldos", keywords: ["sueldos", "comisiones", "liquidar sueldos", "pagos personal", "nomina"] },
  { id: "finance_conciliacion", parentId: "finances", nameEs: "Conciliación Bancaria / Cuentas y Tarjetas", nameEn: "Bank Reconciliation & Accounts", icon: "🏦", path: "/app/finances?tab=conciliacion", keywords: ["conciliacion bancaria", "bancos", "tarjetas", "cuentas bancarias", "extractos"] },
  { id: "finance_servicios_rentabilidad", parentId: "finances", nameEs: "Rentabilidad por Servicio / Margen de Ganancia", nameEn: "Service Profitability Analysis", icon: "✂️", path: "/app/finances?tab=servicios", keywords: ["rentabilidad servicios", "margen de ganancia", "servicios mas rentables", "precios contra costos"] },
  { id: "finance_profesionales_rentabilidad", parentId: "finances", nameEs: "Rentabilidad por Profesional / Desempeño", nameEn: "Stylist & Staff Profitability", icon: "👤", path: "/app/finances?tab=profesionales", keywords: ["rentabilidad profesional", "desempeño personal", "quien vende mas", "ventas profesional"] },
  { id: "finance_simulador", parentId: "finances", nameEs: "Simulador de Escenarios Financieros (Proyecciones)", nameEn: "Financial Scenario Simulator", icon: "✨", path: "/app/finances?tab=simulador", keywords: ["simulador financiero", "proyecciones", "que pasa si", "predicciones financieras"] },
  { id: "finance_reportes", parentId: "finances", nameEs: "Centro de Reportes Financieros y Descargas", nameEn: "Financial Reports & Downloads", icon: "📄", path: "/app/finances?tab=reportes", keywords: ["descargar reportes", "informes financieros", "pdf excel finanzas", "reportes de ventas"] },
  { id: "finance_auditoria", parentId: "finances", nameEs: "Auditoría Financiera / Historial de Movimientos", nameEn: "Financial Audit & Transaction Logs", icon: "⏱️", path: "/app/finances?tab=auditoria", keywords: ["auditoria financiera", "logs de transacciones", "quien borro", "historial de caja", "trazabilidad"] },

  // Inventario & Submodules
  { id: "inventory", nameEs: "Inventario / Control de Stock", nameEn: "Inventory / Stock", icon: "📦", path: "/app/inventory" },
  { id: "inventory_resumen", parentId: "inventory", nameEs: "Resumen de Inventario (ERP)", nameEn: "Inventory Overview (ERP)", icon: "📈", path: "/app/inventory?tab=resumen", keywords: ["resumen general", "métricas de stock", "dashboard inventario"] },
  { id: "inventory_productos", parentId: "inventory", nameEs: "Catálogo de Stock / Insumos", nameEn: "Stock Catalog / Supplies", icon: "🏷️", path: "/app/inventory?tab=productos", keywords: ["insumos", "catalogo", "productos", "inventario", "crear insumo", "editar stock"] },
  { id: "inventory_lotes", parentId: "inventory", nameEs: "Control de Lotes / Lotes FIFO / Vencimientos", nameEn: "Batch Control & Expiration (FIFO)", icon: "🥞", path: "/app/inventory?tab=lotes", keywords: ["lotes", "control de lotes", "lotes fifo", "vencimientos", "partidas", "vender lotes", "lotes para vender", "lotes poder vender", "lotes pode vender"] },
  { id: "inventory_pedidos", parentId: "inventory", nameEs: "Pedidos de Reposición / Compras ERP", nameEn: "Purchase & Replenishment Orders", icon: "🛒", path: "/app/inventory?tab=reposicion&sub=pedidos", keywords: ["compras", "pedidos", "reposicion", "ordenes de compra", "stock minimo", "faltantes"] },
  { id: "inventory_proveedores", parentId: "inventory", nameEs: "Directorio de Proveedores", nameEn: "Suppliers Directory", icon: "🏢", path: "/app/inventory?tab=reposicion&sub=proveedores", keywords: ["proveedores", "distribuidores", "abastecedores", "directorio proveedores", "supplier"] },
  { id: "inventory_sucursales", parentId: "inventory", nameEs: "Existencias por Sucursal (Multi-sede)", nameEn: "Branch Stock / Multi-site Inventory", icon: "🏢", path: "/app/inventory?tab=sucursales", keywords: ["sucursales", "stock sucursal", "existencias", "sedes", "transferencia stock"] },
  { id: "inventory_reglas", parentId: "inventory", nameEs: "Reglas de Consumo de Insumos", nameEn: "Service Supply Consumption Rules", icon: "🎛️", path: "/app/inventory?tab=reglas", keywords: ["reglas de consumo", "descuento automatico", "consumo servicios", "insumo por servicio"] },
  { id: "inventory_rentabilidad", parentId: "inventory", nameEs: "Rentabilidad de Insumos y Productos", nameEn: "Supply & Product Profitability", icon: "💲", path: "/app/inventory?tab=rentabilidad", keywords: ["rentabilidad", "costo producto", "ganancia", "margen de insumos", "profitability"] },
  { id: "inventory_ia", parentId: "inventory", nameEs: "Copilot Aura IA - Análisis de Stock", nameEn: "Aura AI Copilot - Stock Analytics", icon: "🤖", path: "/app/inventory?tab=ia", keywords: ["copilot", "aura ia", "predicciones", "inteligencia artificial", "alertas ia"] },

  { id: "sheets_sync", nameEs: "Google Sheets / Sincronización", nameEn: "Google Sheets Sync", icon: "📊", path: "/app/sheets-sync" },
  { id: "workflows", nameEs: "Flujos de automatización (Workflows)", nameEn: "Workflows & Automations", icon: "🔌", path: "/app/workflows" },
  { id: "automations", nameEs: "Integraciones / Conexiones externas", nameEn: "Integrations & Bots", icon: "🔌", path: "/app/automations" },
  
  // Configuración & Submodules
  { id: "settings", nameEs: "Configuración / Ajustes del Sistema", nameEn: "Settings / System Rules", icon: "⚙️", path: "/app/settings" },
  { id: "settings_registry", parentId: "settings", nameEs: "Registro de Campos Personalizados / Fichas Clínicas", nameEn: "Custom Field Registry / Clinic Intake Forms", icon: "⚙️", path: "/app/settings?tab=registry", keywords: ["registro de campos", "campos personalizados", "fichas clinicas", "intake forms", "settings fields"] },
  { id: "settings_assign", parentId: "settings", nameEs: "Asignación de Campos / Pantallas", nameEn: "Field Component Assignment", icon: "⚙️", path: "/app/settings?tab=assign", keywords: ["asignacion de campos", "pantallas", "configurar campos", "vincular campos"] },
  { id: "settings_modules", parentId: "settings", nameEs: "Módulos Activos / Activar Integraciones ERP", nameEn: "Active Modules Editor / System Features", icon: "⚙️", path: "/app/settings?tab=modules", keywords: ["modulos activos", "activar modulos", "desactivar modulos", "modulos erp"] },
  { id: "settings_booking", parentId: "settings", nameEs: "Configuración de Agenda Online / Reservas", nameEn: "Online Booking Settings", icon: "⚙️", path: "/app/settings?tab=booking", keywords: ["agenda online", "reservas online", "link de reserva", "politicas de cancelacion"] },
  { id: "settings_sucursales", parentId: "settings", nameEs: "Configuración de Sucursales / Direcciones y Datos", nameEn: "Branches Configuration / Business Info", icon: "⚙️", path: "/app/settings?tab=sucursales", keywords: ["sucursales", "datos sucursal", "direcciones", "nueva sede", "establecimiento"] },
  { id: "settings_users", parentId: "settings", nameEs: "Roles y Permisos de Usuarios / Seguridad", nameEn: "Users Roles & Permissions Settings", icon: "⚙️", path: "/app/settings?tab=users", keywords: ["roles y permisos", "usuarios", "seguridad", "cambiar rol", "nuevo usuario", "acceso"] },
];

const ALL_ACTIONS = [
  { 
    id: "action_create_client", 
    type: "action", 
    nameEs: "Crear Cliente", 
    nameEn: "Create Client", 
    icon: "➕", 
    actionType: "create_client",
    keywords: ["nuevo cliente", "crear cliente", "agregar cliente", "new client", "create client", "alta cliente"]
  },
  { 
    id: "action_create_appointment", 
    type: "action", 
    nameEs: "Crear Cita / Turno", 
    nameEn: "Create Appointment", 
    icon: "📅", 
    actionType: "create_appointment",
    keywords: ["nueva cita", "crear cita", "nuevo turno", "crear turno", "new appointment", "create appointment", "reservar", "reserva"]
  },
  { 
    id: "action_create_service", 
    type: "action", 
    nameEs: "Crear Servicio", 
    nameEn: "Create Service", 
    icon: "✂️", 
    actionType: "create_service",
    keywords: ["nuevo servicio", "crear servicio", "new service", "create service", "alta servicio"]
  },
  { 
    id: "action_create_worker", 
    type: "action", 
    nameEs: "Agregar Profesional / Colaborador", 
    nameEn: "Add Professional", 
    icon: "👤", 
    actionType: "create_worker",
    keywords: ["nuevo profesional", "agregar profesional", "nuevo colaborador", "crear trabajador", "add worker", "new worker", "new staff"]
  },
];

const SYNONYMS = {
  agenda: "appointments",
  citas: "appointments",
  turnos: "appointments",
  reservas: "appointments",
  calendario: "appointments",
  
  clientes: "clients",
  pacientes: "clients",
  directorio: "clients",
  
  servicios: "services",
  tratamientos: "services",
  catalogo: "services",
  precios: "services",
  
  inventario: "inventory",
  stock: "inventory",
  productos: "inventory",
  insumos: "inventory",
  articulos: "inventory",
  
  finanzas: "finances",
  dinero: "finances",
  pagos: "finances",
  comisiones: "finances",
  ingresos: "finances",
  gastos: "finances",
  ventas: "finances",
  sueldos: "finances",
  caja: "finances",
  flujo: "finances",
  
  equipo: "team",
  empleados: "team",
  trabajadores: "team",
  personal: "team",
  colaboradores: "team",
  profesionales: "team",
  estilistas: "team",
  
  configuracion: "settings",
  configuración: "settings",
  ajustes: "settings",
  usuarios: "settings",
  roles: "settings",
  permisos: "settings",
  perfil: "settings",
  sucursal: "settings",
  datos: "settings",
  
  whatsapp: "automations",
  bot: "automations",
  google: "automations",
  calendar: "automations",
  "google calendar": "automations",
  sheets: "sheets_sync",
  sync: "sheets_sync",
  sheets_sync: "sheets_sync",
  integraciones: "automations",
  automatizaciones: "automations",
  workflows: "workflows",
  flujos: "workflows",
};

const getFrequentItems = (isEs) => [
  { id: "appointments", type: "module", nameEs: "Agenda", nameEn: "Agenda", icon: "📅", path: "/app/calendar" },
  { id: "clients", type: "module", nameEs: "Clientes", nameEn: "Clients", icon: "👤", path: "/app/clients" },
  { id: "create_appointment", type: "action", nameEs: "Nueva cita", nameEn: "New appointment", icon: "➕", actionType: "create_appointment" },
  { id: "finances", type: "module", nameEs: "Finanzas", nameEn: "Finances", icon: "💰", path: "/app/finances" },
  { id: "inventory", type: "module", nameEs: "Inventario", nameEn: "Inventory", icon: "📦", path: "/app/inventory" },
  { id: "settings", type: "module", nameEs: "Configuración", nameEn: "Settings", icon: "⚙️", path: "/app/settings" },
];

export default function CommandPalette({ show, onClose, onAction }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { brand } = useBrand();
  
  const isEs = i18n.language?.startsWith("es") ?? true;
  
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  const [recents, setRecents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const isModuleActive = useCallback((moduleId) => {
    return brand.activeModules?.[moduleId] ?? true;
  }, [brand.activeModules]);

  const getMatchScore = useCallback((item, queryStr) => {
    const q = queryStr.trim().toLowerCase();
    if (!q) return 0;

    const queryWords = q.split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length === 0) return 0;

    const fieldsToMatch = [];
    if (item.nameEs) fieldsToMatch.push(item.nameEs.toLowerCase());
    if (item.nameEn) fieldsToMatch.push(item.nameEn.toLowerCase());
    if (item.subtitle) fieldsToMatch.push(item.subtitle.toLowerCase());
    if (item.path) fieldsToMatch.push(item.path.toLowerCase());
    if (item.keywords && Array.isArray(item.keywords)) {
      item.keywords.forEach(kw => fieldsToMatch.push(kw.toLowerCase()));
    }

    // Synonyms match checking
    Object.keys(SYNONYMS).forEach(synKey => {
      const synVal = SYNONYMS[synKey];
      if (item.id === synVal || item.parentId === synVal) {
        fieldsToMatch.push(synKey.toLowerCase());
      }
    });

    let matchedCount = 0;
    queryWords.forEach(word => {
      const wordMatched = fieldsToMatch.some(field => field.includes(word));
      if (wordMatched) {
        matchedCount++;
      }
    });

    if (matchedCount === 0) return 0;

    const fullFieldsText = fieldsToMatch.join(" ");
    let extraScore = 0;
    if (fullFieldsText.includes(q)) {
      extraScore = 1.5;
    }

    return (matchedCount / queryWords.length) + extraScore;
  }, []);

  // Hydrate recents and favorites
  useEffect(() => {
    if (show) {
      setQuery("");
      setSelectedIndex(0);
      
      const storedRecents = localStorage.getItem("auradash_cmd_recents");
      if (storedRecents) {
        try {
          setRecents(JSON.parse(storedRecents));
        } catch {
          setRecents([]);
        }
      }
      
      const storedFavorites = localStorage.getItem("auradash_cmd_favorites");
      if (storedFavorites) {
        try {
          setFavorites(JSON.parse(storedFavorites));
        } catch {
          setFavorites([]);
        }
      }
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [show]);

  // Load catalog items, appointments, products, and workflows once on open
  useEffect(() => {
    if (!show) return;
    
    api.get("/workers")
      .then(res => setWorkers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading workers in CommandPalette:", err));
      
    api.get("/services")
      .then(res => setServices(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading services in CommandPalette:", err));

    api.get("/appointments")
      .then(res => setAppointments(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading appointments in CommandPalette:", err));

    api.get("/inventory/products")
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading products in CommandPalette:", err));

    api.get("/inventory/suppliers")
      .then(res => setSuppliers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading suppliers in CommandPalette:", err));

    api.get("/workflows")
      .then(res => setWorkflows(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error loading workflows in CommandPalette:", err));
  }, [show]);

  // Real-time clients search (debounced)
  useEffect(() => {
    if (!show) return;
    const q = query.trim();
    if (q.length < 2) {
      setClients([]);
      return;
    }
    
    setLoadingClients(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/clients", { params: { search: q } });
        setClients(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error searching clients:", err);
      } finally {
        setLoadingClients(false);
      }
    }, 200);
    
    return () => clearTimeout(t);
  }, [query, show]);

  // Client-side filtering and matching
  const matchedModules = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    
    return ALL_MODULES
      .filter(item => {
        const activeId = item.parentId || item.id;
        if (!isModuleActive(activeId)) return false;
        return getMatchScore(item, q) > 0;
      })
      .map(m => ({
        ...m,
        type: "module",
        score: getMatchScore(m, q)
      }))
      .sort((a, b) => b.score - a.score);
  }, [query, isModuleActive, getMatchScore]);

  const matchedActions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return ALL_ACTIONS
      .filter(item => getMatchScore(item, q) > 0)
      .map(a => ({
        ...a,
        type: "action",
        score: getMatchScore(a, q)
      }))
      .sort((a, b) => b.score - a.score);
  }, [query, getMatchScore]);

  const matchedClients = useMemo(() => {
    return clients.map(c => ({
      id: `client_${c.id}`,
      type: "client",
      nameEs: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
      nameEn: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
      icon: "👤",
      subtitle: `${c.phone || "—"} · ${c.email || "—"}`,
      data: c,
      actionType: "view_client",
      score: 1.0
    }));
  }, [clients]);

  const matchedAppointments = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return appointments
      .map(appt => {
        const cName = `${appt.client?.firstName || ""} ${appt.client?.lastName || ""}`.trim() || (isEs ? "Cliente" : "Client");
        const wName = `${appt.worker?.firstName || ""} ${appt.worker?.lastName || ""}`.trim() || (isEs ? "Profesional" : "Staff");
        const sName = appt.service?.name || (isEs ? "Servicio" : "Service");
        const notes = appt.notes || "";
        const dateStr = appt.startsAt 
          ? new Date(appt.startsAt).toLocaleString(isEs ? "es-AR" : "en-US", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "";
        
        const nameEs = `Cita: ${cName} (${appt.service?.name || (isEs ? "Servicio" : "Service")})`;
        const nameEn = `Appt: ${cName} (${appt.service?.name || (isEs ? "Servicio" : "Service")})`;
        const subtitle = `${isEs ? "Atiende" : "Staff"}: ${wName} · ${dateStr} hs · ${appt.status || "CONFIRMED"}`;
        
        const tempItem = {
          id: `appt_${appt.id}`,
          type: "appointment",
          nameEs,
          nameEn,
          subtitle,
          keywords: [cName, wName, appt.service?.name || "", notes]
        };
        
        const score = getMatchScore(tempItem, q);
        return {
          ...tempItem,
          icon: "📅",
          data: appt,
          actionType: "view_appointment",
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [appointments, query, isEs, getMatchScore]);

  const matchedServices = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return services
      .map(s => {
        const tempItem = {
          id: `service_${s.id}`,
          type: "service",
          nameEs: s.name,
          nameEn: s.name,
          subtitle: `${s.category || ""} · $${s.price || 0}`,
          keywords: [s.category || ""]
        };
        const score = getMatchScore(tempItem, q);
        return {
          ...tempItem,
          icon: "✂️",
          data: s,
          actionType: "view_service",
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [services, query, getMatchScore]);

  const matchedWorkers = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return workers
      .map(w => {
        const name = `${w.firstName || ""} ${w.lastName || ""}`.trim();
        const role = w.roleTitle || "";
        const tempItem = {
          id: `worker_${w.id}`,
          type: "worker",
          nameEs: name,
          nameEn: name,
          subtitle: role || (isEs ? "Profesional" : "Staff"),
          keywords: [role]
        };
        const score = getMatchScore(tempItem, q);
        return {
          ...tempItem,
          icon: "👩",
          data: w,
          actionType: "view_worker",
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [workers, query, isEs, getMatchScore]);

  const matchedProducts = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return products
      .map(p => {
        const tempItem = {
          id: `product_${p.id}`,
          type: "product",
          nameEs: `Insumo: ${p.name}`,
          nameEn: `Product: ${p.name}`,
          subtitle: `${isEs ? "Stock" : "Stock"}: ${p.stock || 0} ${p.unit || "uds"} · SKU: ${p.sku || "—"} · Cat: ${p.category || "—"}`,
          keywords: [p.sku || "", p.category || "", p.name || ""]
        };
        const score = getMatchScore(tempItem, q);
        return {
          ...tempItem,
          icon: "📦",
          path: "/app/inventory?tab=productos",
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [products, query, isEs, getMatchScore]);

  const matchedSuppliers = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return suppliers
      .map(s => {
        const tempItem = {
          id: `supplier_${s.id}`,
          type: "supplier",
          nameEs: `Proveedor: ${s.name}`,
          nameEn: `Supplier: ${s.name}`,
          subtitle: `${isEs ? "Contacto" : "Contact"}: ${s.contactName || "—"} · ${s.email || "Sin email"}`,
          keywords: [s.contactName || "", s.email || "", s.name || ""]
        };
        const score = getMatchScore(tempItem, q);
        return {
          ...tempItem,
          icon: "🏢",
          path: "/app/inventory?tab=reposicion&sub=proveedores",
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [suppliers, query, isEs, getMatchScore]);

  const matchedWorkflows = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return workflows
      .map(w => {
        const tempItem = {
          id: `workflow_${w.id}`,
          type: "workflow",
          nameEs: `Flujo: ${w.name}`,
          nameEn: `Workflow: ${w.name}`,
          subtitle: `${isEs ? "Disparador" : "Trigger"}: ${w.triggerType} · ${w.isActive ? (isEs ? "Activo" : "Active") : (isEs ? "Inactivo" : "Inactive")}`,
          keywords: [w.triggerType || "", w.name || ""]
        };
        const score = getMatchScore(tempItem, q);
        return {
          ...tempItem,
          icon: "🔌",
          path: "/app/workflows",
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [workflows, query, isEs, getMatchScore]);

  // Combined searchable flatResults list
  const flatResults = useMemo(() => {
    const q = query.trim();
    if (q === "") {
      const results = [];
      if (recents.length > 0) {
        results.push(...recents.map(item => ({ ...item, categoryGroup: "recent" })));
      }
      if (favorites.length > 0) {
        results.push(...favorites.map(item => ({ ...item, categoryGroup: "favorite" })));
      }
      results.push(...getFrequentItems(isEs).filter(item => {
        if (item.type === "module") return isModuleActive(item.id);
        return true;
      }).map(item => ({ ...item, categoryGroup: "frequent" })));
      return results;
    } else {
      const results = [];
      if (matchedModules.length > 0) {
        results.push(...matchedModules.map(item => ({ ...item, categoryGroup: "modules" })));
      }
      if (matchedActions.length > 0) {
        results.push(...matchedActions.map(item => ({ ...item, categoryGroup: "actions" })));
      }
      if (matchedClients.length > 0) {
        results.push(...matchedClients.map(item => ({ ...item, categoryGroup: "clients" })));
      }
      if (matchedAppointments.length > 0) {
        results.push(...matchedAppointments.map(item => ({ ...item, categoryGroup: "appointments" })));
      }
      if (matchedServices.length > 0) {
        results.push(...matchedServices.map(item => ({ ...item, categoryGroup: "services" })));
      }
      if (matchedWorkers.length > 0) {
        results.push(...matchedWorkers.map(item => ({ ...item, categoryGroup: "workers" })));
      }
      if (matchedProducts.length > 0) {
        results.push(...matchedProducts.map(item => ({ ...item, categoryGroup: "products" })));
      }
      if (matchedSuppliers.length > 0) {
        results.push(...matchedSuppliers.map(item => ({ ...item, categoryGroup: "suppliers" })));
      }
      if (matchedWorkflows.length > 0) {
        results.push(...matchedWorkflows.map(item => ({ ...item, categoryGroup: "workflows" })));
      }
      return results;
    }
  }, [query, recents, favorites, matchedModules, matchedActions, matchedClients, matchedAppointments, matchedServices, matchedWorkers, matchedProducts, matchedSuppliers, matchedWorkflows, isEs, isModuleActive]);

  // Reset focus index when results list updates
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults]);

  // Smooth scroll selected item into view inside body container
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation listeners
  useEffect(() => {
    if (!show) return;
    
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (flatResults.length > 0 ? (prev + 1) % flatResults.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (flatResults.length > 0 ? (prev - 1 + flatResults.length) % flatResults.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelectItem(flatResults[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, flatResults, selectedIndex, onClose]);

  // Handle starring/unstarring items
  const handleToggleFavorite = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    
    const isFav = favorites.some(f => f.id === item.id);
    let newFavs;
    if (isFav) {
      newFavs = favorites.filter(f => f.id !== item.id);
    } else {
      const cleanItem = { ...item };
      delete cleanItem.categoryGroup;
      delete cleanItem.globalIndex;
      newFavs = [...favorites, cleanItem];
    }
    
    setFavorites(newFavs);
    localStorage.setItem("auradash_cmd_favorites", JSON.stringify(newFavs));
  };

  // Log to recents history and route
  const handleSelectItem = (item) => {
    const cleanItem = { ...item };
    delete cleanItem.categoryGroup;
    delete cleanItem.globalIndex;
    
    const filteredRecents = recents.filter(r => r.id !== cleanItem.id);
    const newRecents = [cleanItem, ...filteredRecents].slice(0, 10);
    setRecents(newRecents);
    localStorage.setItem("auradash_cmd_recents", JSON.stringify(newRecents));
    
    if (item.path) {
      navigate(item.path);
    } else {
      onAction(item);
    }
    
    onClose();
  };

  if (!show) return null;

  // Group flatResults into sections for rendering, each maintaining its flattened index
  let indexCounter = 0;
  const sections = {};
  flatResults.forEach(item => {
    const grp = item.categoryGroup;
    if (!sections[grp]) sections[grp] = [];
    sections[grp].push({ ...item, globalIndex: indexCounter++ });
  });

  const getGroupTitle = (grp) => {
    switch (grp) {
      case "recent": return isEs ? "🕒 Recientes" : "🕒 Recent";
      case "favorite": return isEs ? "⭐ Favoritos" : "⭐ Favorites";
      case "frequent": return isEs ? "⭐ Accesos frecuentes" : "⭐ Suggestions";
      case "modules": return isEs ? "Módulos" : "Modules";
      case "actions": return isEs ? "Acciones" : "Actions";
      case "clients": return isEs ? "Clientes" : "Clients";
      case "appointments": return isEs ? "Citas / Turnos" : "Appointments";
      case "services": return isEs ? "Servicios" : "Services";
      case "workers": return isEs ? "Profesionales" : "Staff";
      case "products": return isEs ? "Productos / Insumos" : "Products / Stock";
      case "suppliers": return isEs ? "Proveedores" : "Suppliers";
      case "workflows": return isEs ? "Flujos de Trabajo" : "Workflows";
      default: return "";
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette-panel" onClick={(e) => e.stopPropagation()}>
        {/* Search header */}
        <div className="command-palette-header">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isEs ? "Escribe un comando, cliente, servicio, profesional..." : "Search action, client, service, professional..."}
          />
          <button className="command-palette-esc-hint" onClick={onClose}>
            Esc
          </button>
        </div>

        {/* Results body */}
        <div className="command-palette-body">
          {loadingClients && clients.length === 0 && (
            <div className="command-palette-empty">
              <span className="spinner-border spinner-border-sm text-purple-600 mb-2" role="status" />
              <span>{isEs ? "Buscando en la base de datos..." : "Searching database..."}</span>
            </div>
          )}

          {flatResults.length === 0 && !loadingClients && (
            <div className="command-palette-empty">
              <span className="command-palette-empty-icon">🔍</span>
              <strong>{isEs ? "Sin resultados" : "No results found"}</strong>
              <span style={{ fontSize: "12px", opacity: 0.8 }}>
                {isEs ? "No encontramos módulos o datos relacionados." : "We couldn't find matches for your search."}
              </span>
            </div>
          )}

          {Object.keys(sections).map(grp => (
            <div key={grp} className="command-palette-group">
              <div className="command-palette-group-title">{getGroupTitle(grp)}</div>
              {sections[grp].map(item => {
                const isSelected = item.globalIndex === selectedIndex;
                const isFav = favorites.some(f => f.id === item.id);
                const showStar = item.type === "module" || item.type === "action";
                
                return (
                  <button
                    key={`${grp}_${item.id}`}
                    ref={el => itemRefs.current[item.globalIndex] = el}
                    className={`command-palette-item ${isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="command-palette-item-left">
                      <span className="command-palette-item-icon">{item.icon}</span>
                      <div className="command-palette-item-info">
                        <div className="command-palette-item-title-row">
                          <span className="command-palette-item-title">
                            {isEs ? item.nameEs : item.nameEn}
                          </span>
                          {item.type === "action" && (
                            <span className="command-palette-item-tag">Acción</span>
                          )}
                        </div>
                        {item.subtitle && (
                          <span className="command-palette-item-subtitle">{item.subtitle}</span>
                        )}
                      </div>
                    </div>

                    <div className="command-palette-item-right">
                      {item.path && (
                        <span className="command-palette-item-path">{item.path}</span>
                      )}
                      {showStar && (
                        <button
                          className={`command-palette-favorite-btn ${isFav ? "is-favorite" : ""}`}
                          onClick={(e) => handleToggleFavorite(e, item)}
                          title={isEs ? "Favorito" : "Favorite"}
                        >
                          <Star size={14} fill={isFav ? "#eab308" : "none"} />
                        </button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer shortcuts helper */}
        <div className="command-palette-footer">
          <span>AuraDash Intelligent Command palette</span>
          <div className="command-palette-shortcuts">
            <div className="command-palette-shortcut-item">
              <span className="command-palette-shortcut-key">↑↓</span>
              <span>{isEs ? "Navegar" : "Navigate"}</span>
            </div>
            <div className="command-palette-shortcut-item">
              <span className="command-palette-shortcut-key">Enter</span>
              <span>{isEs ? "Seleccionar" : "Select"}</span>
            </div>
            <div className="command-palette-shortcut-item">
              <span className="command-palette-shortcut-key">Esc</span>
              <span>{isEs ? "Cerrar" : "Close"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
