import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, Bell, Search, Plus, Users, XCircle, Percent, Award, 
  Calendar, ChevronRight, Sparkles, Scissors, Briefcase, 
  Package, FileSpreadsheet, GitBranch, Zap, CreditCard, 
  BarChart3, Clock, AlertTriangle
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useTranslation } from "react-i18next";
import api from "../../lib/api";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell 
} from "recharts";
import "./InicioMobile.css";

export default function InicioMobile() {
  const { user } = useAuth();
  const { t } = useTranslation(["dashboard", "common"]);
  const navigate = useNavigate();

  // Loading & data states
  const [loading, setLoading] = useState(true);
  const [clientsCount, setClientsCount] = useState(12);
  const [appointments, setAppointments] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Load backend data if available, fallback to high-fidelity mocks
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clientsRes, apptsRes, workersRes] = await Promise.all([
          api.get("/clients").catch(() => ({ data: [] })),
          api.get("/appointments").catch(() => ({ data: [] })),
          api.get("/workers").catch(() => ({ data: [] }))
        ]);

        if (clientsRes.data && Array.isArray(clientsRes.data)) {
          setClientsCount(clientsRes.data.length || 12);
        }
        
        if (apptsRes.data && Array.isArray(apptsRes.data)) {
          setAppointments(apptsRes.data);
        }

        if (workersRes.data && Array.isArray(workersRes.data)) {
          setWorkers(workersRes.data);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter today's appointments for timeline
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments
    .filter(appt => appt.startsAt && appt.startsAt.startsWith(todayStr))
    .slice(0, 3);

  // Fallback demo appointments if none scheduled for today
  const demoAppointments = [
    {
      id: "demo-1",
      startsAt: `${todayStr}T10:00:00`,
      client: { firstName: "Camila", lastName: "Rodríguez" },
      service: { name: "Coloración + Corte" },
      status: "CONFIRMED"
    },
    {
      id: "demo-2",
      startsAt: `${todayStr}T12:30:00`,
      client: { firstName: "Valentina", lastName: "Pérez" },
      service: { name: "Manicure Semipermanente" },
      status: "CONFIRMED"
    },
    {
      id: "demo-3",
      startsAt: `${todayStr}T15:00:00`,
      client: { firstName: "Sofía", lastName: "Gómez" },
      service: { name: "Brushing" },
      status: "PENDING"
    }
  ];

  const displayAppointments = todayAppointments.length > 0 ? todayAppointments : demoAppointments;

  // Mini-stats for agenda footer
  const statsCitasHoy = appointments.filter(appt => appt.startsAt && appt.startsAt.startsWith(todayStr)).length || 8;
  const statsConfirmadas = appointments.filter(appt => appt.startsAt && appt.startsAt.startsWith(todayStr) && appt.status === "CONFIRMED").length || 6;
  const statsPendientes = appointments.filter(appt => appt.startsAt && appt.startsAt.startsWith(todayStr) && appt.status === "PENDING").length || 1;
  const statsSinSena = 1; // TODO: conectar dato real

  // KPI Data structure
  const kpis = [
    { 
      key: "activos", 
      label: "Clientes Activos", 
      value: clientsCount.toString(), 
      sub: "Hoy (↑2)", 
      trend: "+5.2%", 
      up: true, 
      icon: "purple" 
    },
    { 
      key: "cancel", 
      label: "Cancelaciones Hoy", 
      value: "1", 
      sub: "Lun → Hoy 1", 
      trend: "100%", 
      up: false, 
      icon: "red" 
    },
    { 
      key: "ocup", 
      label: "Ocupación", 
      value: "78%", 
      sub: "Hoy", 
      trend: "+8.1%", 
      up: true, 
      icon: "orange", 
      ring: 78 
    },
    { 
      key: "top", 
      label: "Profesional Top", 
      value: workers[0] ? workers[0].firstName : "María", 
      sub: "65% de citas", 
      trend: "+12%", 
      up: true, 
      icon: "pink" 
    }
  ];

  // Recharts Horas Pico data
  const horasData = [
    { hora: "8", valor: 20 },
    { hora: "10", valor: 55 },
    { hora: "12", valor: 78 },
    { hora: "14", valor: 95 },
    { hora: "16", valor: 70 },
    { hora: "18", valor: 45 },
    { hora: "20", valor: 25 }
  ];

  // Recharts Ventas donut data
  const ventasData = [
    { name: "Coloración", value: 40, color: "#7c5cfc" },
    { name: "Corte", value: 25, color: "#a78bfa" },
    { name: "Manicuría", value: 20, color: "#ec4899" },
    { name: "Peinado", value: 15, color: "#f59e0b" }
  ];

  // AI Sparkline spark data
  const aiSparkData = [
    { name: "Lun", valor: 100 },
    { name: "Mar", valor: 85 },
    { name: "Mie", valor: 80 },
    { name: "Jue", valor: 92 },
    { name: "Vie", valor: 81 },
    { name: "Sab", valor: 82 }
  ];

  // Stylists work load fallback list
  const displayWorkers = workers.length > 0 ? workers.slice(0, 4) : [
    { id: "w-1", firstName: "María", lastName: "López", load: 85 },
    { id: "w-2", firstName: "Juan", lastName: "Pérez", load: 60 },
    { id: "w-3", firstName: "Lucía", lastName: "Torres", load: 40 },
    { id: "w-4", firstName: "Ana", lastName: "Gómez", load: 25 }
  ];

  // Date formatted in Spanish
  const dateFormatted = new Date().toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return (
    <div className="inicio-mobile">
      {/* 1. Header (saludo) */}
      <header className="im-header" style={{ padding: "10px 0 16px" }}>
        <div className="im-header__greet">
          <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}>Hola, {user?.displayName || "Xu"} 👋</h1>
          <p style={{ margin: "4px 0 0", color: "var(--w-muted, #8b8a99)", fontSize: "13px" }}>{dateFormatted}</p>
        </div>
      </header>

      {/* 2. Barra de búsqueda + botón "+" */}
      <section className="im-searchrow">
        <div 
          className="im-search" 
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        >
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Buscar cita, cliente o servicio..." 
            readOnly 
          />
        </div>
        <button 
          className="im-add-btn" 
          onClick={() => window.dispatchEvent(new CustomEvent("open-appointment-modal"))}
        >
          <Plus size={24} />
        </button>
      </section>

      {/* 3. KPIs (carrusel horizontal) */}
      <section className="im-kpis">
        {kpis.map((kpi) => (
          <div className="im-kpi" key={kpi.key}>
            <div className={`im-kpi__icon im-kpi__icon--${kpi.icon}`}>
              {kpi.key === "activos" && <Users size={20} />}
              {kpi.key === "cancel" && <XCircle size={20} />}
              {kpi.key === "ocup" && <Percent size={20} />}
              {kpi.key === "top" && <Award size={20} />}
            </div>
            <span className="im-kpi__label">{kpi.label}</span>
            <span className="im-kpi__value">{kpi.value}</span>
            <span className="im-kpi__sub">{kpi.sub}</span>
            <div className={`im-kpi__trend ${kpi.up ? "im-kpi__trend--up" : "im-kpi__trend--down"}`}>
              <span>{kpi.up ? "↗" : "↘"}</span>
              <span>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 4. Tarjeta "Agenda de Hoy" */}
      <section className="im-agenda">
        <div className="im-agenda__head">
          <h3>
            <Calendar size={18} />
            <span>Agenda de Hoy</span>
          </h3>
          <button 
            className="im-agenda__seeall"
            onClick={() => navigate("/app/calendar")}
          >
            Ver agenda
          </button>
        </div>
        
        <div className="im-agenda__body">
          <div className="im-agenda__date">
            <div className="d-wd">LUN</div>
            <div className="d-day">{new Date().getDate()}</div>
            <div className="d-mo">{new Date().toLocaleString("es", { month: "short" }).toUpperCase()}</div>
          </div>
          
          <div className="im-agenda__list">
            <h4>Próximas citas</h4>
            {displayAppointments.map((appt) => {
              const startsAtDate = new Date(appt.startsAt);
              const apptTime = startsAtDate.toLocaleTimeString("es-AR", { 
                hour: "2-digit", 
                minute: "2-digit" 
              }) + " hs";
              
              const isPending = appt.status === "PENDING";
              const labelState = isPending ? "Pendiente" : "Confirmada";

              return (
                <div className="im-appt" key={appt.id}>
                  <div className="im-appt__time">{apptTime.replace(" hs", "")}</div>
                  <div className="im-avatar im-appt__avatar">
                    {appt.client?.firstName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="im-appt__info">
                    <div className="im-appt__name">
                      {appt.client?.firstName} {appt.client?.lastName}
                    </div>
                    <div className="im-appt__svc">{appt.service?.name}</div>
                  </div>
                  <span className={`im-appt__badge ${isPending ? "im-appt__badge--pending" : ""}`}>
                    {labelState}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="im-agenda__stats">
          <div className="im-agenda__stat">
            <Calendar size={14} />
            <span><b>{statsCitasHoy}</b> Citas</span>
          </div>
          <div className="im-agenda__stat">
            <Award size={14} />
            <span><b>{statsConfirmadas}</b> Conf.</span>
          </div>
          <div className="im-agenda__stat">
            <Clock size={14} />
            <span><b>{statsPendientes}</b> Pend.</span>
          </div>
          <div className="im-agenda__stat">
            <AlertTriangle size={14} />
            <span><b>{statsSinSena}</b> Sin seña</span>
          </div>
        </div>
      </section>

      {/* 5. Accesos Rápidos */}
      <h3 className="im-section-title">Accesos Rápidos</h3>
      <section className="im-quick">
        <button 
          className="im-quick__item" 
          onClick={() => window.dispatchEvent(new CustomEvent("open-appointment-modal"))}
        >
          <div className="im-quick__icon"><Plus size={22} /></div>
          <span className="im-quick__label">Nueva Cita</span>
        </button>
        <button className="im-quick__item" onClick={() => navigate("/app/clients")}>
          <div className="im-quick__icon"><Users size={22} /></div>
          <span className="im-quick__label">Clientes</span>
        </button>
        <button className="im-quick__item" onClick={() => navigate("/app/services")}>
          <div className="im-quick__icon"><Scissors size={22} /></div>
          <span className="im-quick__label">Servicios</span>
        </button>
        <button className="im-quick__item" onClick={() => navigate("/app/team")}>
          <div className="im-quick__icon"><Briefcase size={22} /></div>
          <span className="im-quick__label">Equipo</span>
        </button>
        <button className="im-quick__item" onClick={() => navigate("/app/finances")}>
          <div className="im-quick__icon"><CreditCard size={22} /></div>
          <span className="im-quick__label">Caja</span>
        </button>
        <button className="im-quick__item" onClick={() => navigate("/app/sheets-sync")}>
          <div className="im-quick__icon"><FileSpreadsheet size={22} /></div>
          <span className="im-quick__label">Sheets</span>
        </button>
        <button className="im-quick__item" onClick={() => navigate("/app/inventory")}>
          <div className="im-quick__icon"><Package size={22} /></div>
          <span className="im-quick__label">Inventario</span>
        </button>
      </section>

      {/* 6. AI Copilot Insights */}
      <section className="im-card im-ai">
        <div className="im-ai__head">
          <h3>
            <Sparkles className="ai-spark" size={16} />
            <span>AI Copilot Insights</span>
          </h3>
          <button className="im-pill-btn">Ver todas</button>
        </div>
        <div className="im-ai__box">
          <div className="im-ai__text">
            <b>Tus ingresos bajaron 18% esta semana</b>
            <p>en comparación con la anterior (debido al feriado de lunes).</p>
          </div>
          <div className="im-ai__spark">
            <ResponsiveContainer width="100%" height={48}>
              <AreaChart data={aiSparkData}>
                <Area type="monotone" dataKey="valor" stroke="#7c5cfc" strokeWidth={1.5} fill="rgba(124,92,252,0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <a href="#insights" className="im-ai__more" onClick={(e) => { e.preventDefault(); navigate("/app/settings"); }}>
          Ver más insights →
        </a>
      </section>

      {/* 7. Requiere Atención (carrusel) */}
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h3 className="im-section-title">Requiere Atención</h3>
        <button 
          className="btn p-0 text-purple-600 fw-bold small" 
          style={{ fontSize: "12px", border: 0 }}
          onClick={() => navigate("/app/settings")}
        >
          Ver todo
        </button>
      </div>
      <section className="im-attn">
        <div className="im-attn__card">
          <div className="im-attn__icon" style={{ background: "var(--im-amber-soft)", color: "var(--im-amber)" }}>
            <Clock size={20} />
          </div>
          <div className="im-attn__body">
            <span className="im-attn__title">3 citas sin seña</span>
            <span className="im-attn__sub d-block">Hoy • Total: $45.000</span>
          </div>
          <ChevronRight size={18} className="im-attn__chevron" />
        </div>
        
        <div className="im-attn__card">
          <div className="im-attn__icon" style={{ background: "var(--im-red-soft)", color: "var(--im-red)" }}>
            <XCircle size={20} />
          </div>
          <div className="im-attn__body">
            <span className="im-attn__title">1 cancelación reciente</span>
            <span className="im-attn__sub d-block">Hace 2h • Camila Rodríguez</span>
          </div>
          <ChevronRight size={18} className="im-attn__chevron" />
        </div>

        <div className="im-attn__card">
          <div className="im-attn__icon" style={{ background: "var(--im-purple-soft)", color: "var(--im-purple)" }}>
            <Bell size={20} />
          </div>
          <div className="im-attn__body">
            <span className="im-attn__title">2 recordatorios</span>
            <span className="im-attn__sub d-block">Pendientes • Para hoy</span>
          </div>
          <ChevronRight size={18} className="im-attn__chevron" />
        </div>
      </section>

      {/* 8. Dos gráficos (recharts) */}
      <h3 className="im-section-title">Gráficos de Rendimiento</h3>
      
      <div className="im-card im-chart">
        <h3>Horas Pico de Reserva</h3>
        <div className="im-chart__wrap">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={horasData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="imArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hora" tickLine={false} axisLine={false} fontSize={11} stroke="#a5a4b3" />
              <YAxis tickFormatter={(v)=>`${v}%`} tickLine={false} axisLine={false} fontSize={11} stroke="#a5a4b3" />
              <Tooltip />
              <Area type="monotone" dataKey="valor" stroke="#7c5cfc" strokeWidth={2} fill="url(#imArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="im-card im-chart">
        <h3>Ventas por Servicio (Mix de Salón)</h3>
        <div className="im-donut-container">
          <div style={{ width: "140px", height: "140px" }}>
            <PieChart width={140} height={140}>
              <Pie 
                data={ventasData} 
                dataKey="value" 
                innerRadius={45} 
                outerRadius={62} 
                paddingAngle={2} 
                stroke="none"
              >
                {ventasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="im-donut-legend flex-grow-1">
            {ventasData.map((item, idx) => (
              <div className="im-donut-legend__row" key={idx}>
                <div className="d-flex align-items-center">
                  <span className="im-donut-legend__dot" style={{ background: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="fw-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9. Carga de Trabajo (Citas por Estilista) */}
      <div className="im-card im-load">
        <h3>Carga de Trabajo</h3>
        {displayWorkers.map((w, idx) => {
          const loadPct = w.load ?? 40;
          return (
            <div className="im-load__row" key={w.id || idx}>
              <div className="im-avatar im-load__avatar">
                {w.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="im-load__info">
                <div className="im-load__name">{w.firstName} {w.lastName || ""}</div>
                <div className="im-load__bar">
                  <div className="im-load__fill" style={{ width: `${loadPct}%` }} />
                </div>
              </div>
              <div className="im-load__pct">{loadPct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
