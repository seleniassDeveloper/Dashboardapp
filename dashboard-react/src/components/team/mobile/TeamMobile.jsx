import React, { useState, useMemo } from "react";
import { 
  UserPlus, Mail, Phone, Calendar, Pencil, Trash2, 
  Search, SlidersHorizontal, Award, TrendingUp, DollarSign, Activity, Percent, Briefcase 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import "./TeamMobile.css";

const COLORS = ["#7c5cfc", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"];

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// Sparklines dummy history datasets
const billingHistory = [
  { day: "Lun", val: 80000 },
  { day: "Mar", val: 120000 },
  { day: "Mie", val: 110000 },
  { day: "Jue", val: 140000 },
  { day: "Vie", val: 175000 }
];

const commissionHistory = [
  { day: "Lun", val: 32000 },
  { day: "Mar", val: 48000 },
  { day: "Mie", val: 44000 },
  { day: "Jue", val: 56000 },
  { day: "Vie", val: 70000 }
];

const occupancyHistory = [
  { day: "Lun", val: 65 },
  { day: "Mar", val: 72 },
  { day: "Mie", val: 68 },
  { day: "Jue", val: 80 },
  { day: "Vie", val: 78 }
];

const ticketHistory = [
  { day: "Lun", val: 2800 },
  { day: "Mar", val: 3200 },
  { day: "Mie", val: 2900 },
  { day: "Jue", val: 3400 },
  { day: "Vie", val: 3200 }
];

export default function TeamMobile({ sync }) {
  const {
    workers,
    openCreate,
    openEdit,
    handleDelete,
    staffStats,
    dashboardMetrics,
    getStatusColor,
    getRoleName
  } = sync;

  const [activeTab, setActiveTab] = useState("members"); // members | productivity
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS"); // TODOS | ACTIVO | VACACIONES | LICENCIA | SUSPENDIDO
  const [period, setPeriod] = useState("month");

  // Filtering for staff profiles
  const filteredStaff = useMemo(() => {
    return staffStats.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.cargo || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "TODOS" || 
        member.status.toLowerCase() === statusFilter.toLowerCase();
        
      return matchesSearch && matchesStatus;
    });
  }, [staffStats, searchQuery, statusFilter]);

  // Data for the contribution pie chart
  const contributionPieData = useMemo(() => {
    return staffStats.slice(0, 5).map((s, idx) => ({
      name: s.firstName,
      value: s.billing || 1,
      color: COLORS[idx % COLORS.length]
    }));
  }, [staffStats]);

  const totalBillingVal = contributionPieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="team-mobile">
      {/* Intro Header */}
      <div>
        <h1 className="tm-title">Equipo</h1>
        <p className="tm-subtitle">Gestiona perfiles, comisiones y agendas de tu personal.</p>
      </div>

      {/* Button Add Collaborator */}
      <button className="tm-add-btn" onClick={openCreate}>
        <UserPlus size={18} />
        <span>Añadir Colaborador</span>
      </button>

      {/* Segmented control tabs */}
      <div className="tm-tabs">
        <button 
          className={`tm-tab ${activeTab === "members" ? "tm-tab--active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Perfil de Colaboradores
        </button>
        <button 
          className={`tm-tab ${activeTab === "productivity" ? "tm-tab--active" : ""}`}
          onClick={() => setActiveTab("productivity")}
        >
          Rendimiento & Comisiones
        </button>
      </div>

      {/* Tab 1: Perfil de Colaboradores */}
      {activeTab === "members" && (
        <div>
          {/* Search + filter bar */}
          <div className="tm-search-row">
            <div className="tm-search">
              <Search size={16} className="text-muted" />
              <input 
                type="text" 
                placeholder="Buscar estilista o cargo..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "120px",
                borderRadius: "12px",
                border: "1px solid var(--t-border)",
                padding: "0 10px",
                fontSize: "12px",
                fontWeight: "700",
                backgroundColor: "#fff",
                outline: "none"
              }}
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="VACACIONES">Vacaciones</option>
              <option value="LICENCIA">Licencia</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>

          {/* Cards List */}
          {filteredStaff.length === 0 ? (
            <div className="text-center py-5 text-muted small">No se encontraron colaboradores.</div>
          ) : (
            filteredStaff.map((member) => {
              const serviceCount = member.services?.length || 0;
              const hasSpecialties = member.specialties && member.specialties.length > 0;
              const initials = `${member.firstName?.charAt(0) || ""}${member.lastName?.charAt(0) || ""}`.toUpperCase() || "ST";

              return (
                <div className="tm-card" key={member.id}>
                  {/* Card top */}
                  <div className="tm-card__header">
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div className="tm-avatar-wrapper">
                        {member.photo && member.photo.startsWith("http") ? (
                          <div className="tm-avatar">
                            <img src={member.photo} alt={member.name} />
                          </div>
                        ) : (
                          <div className="tm-avatar">
                            {initials}
                          </div>
                        )}
                        <span 
                          className="tm-avatar-status"
                          style={{ backgroundColor: getStatusColor(member.status) }}
                        />
                      </div>
                      
                      <div>
                        <h3 className="tm-card__name">
                          <span>{member.name}</span>
                          <span className="tm-card__role">
                            {getRoleName(member.rol)}
                          </span>
                        </h3>
                        <div className="tm-card__cargo">{member.cargo || "Estilista"}</div>
                      </div>
                    </div>

                    <div className="tm-card__actions">
                      <button 
                        className="tm-card__action"
                        onClick={() => openEdit(member)}
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="tm-card__action tm-card__action--delete"
                        onClick={() => handleDelete(member.id, member.name)}
                        aria-label="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="tm-specialties">
                    {hasSpecialties ? (
                      member.specialties.map((spec, i) => (
                        <span className="tm-specialty" key={i}>{spec}</span>
                      ))
                    ) : (
                      <span className="text-muted italic" style={{ fontSize: "10px" }}>Sin especialidades</span>
                    )}
                  </div>

                  {/* Shift info */}
                  <div className="tm-shift">
                    <Calendar size={13} />
                    <span>Próximo turno: <b>{member.nextTurn || "No programado"}</b></span>
                  </div>

                  {/* Performance pills */}
                  <div className="tm-pills">
                    <div className="tm-pill tm-pill--billing">
                      <span className="tm-pill__label">Facturado</span>
                      <span className="tm-pill__value">{currency(member.billing)}</span>
                    </div>
                    
                    <div className="tm-pill tm-pill--commission">
                      <span className="tm-pill__label">Comisión</span>
                      <span className="tm-pill__value">{currency(member.estimatedCommission)}</span>
                    </div>

                    <div className="tm-pill tm-pill--occupancy">
                      <span className="tm-pill__label">Ocupación</span>
                      <span className="tm-pill__value">{member.occupancy}%</span>
                    </div>
                  </div>

                  {/* Occupancy progress bar */}
                  <div className="tm-progress-wrapper">
                    <div className="tm-progress-info">
                      <span>Ocupación de Agenda</span>
                      <span>{member.occupancy}%</span>
                    </div>
                    <div className="tm-progress-bar-bg">
                      <div 
                        className="tm-progress-bar-fg" 
                        style={{ 
                          width: `${member.occupancy}%`,
                          backgroundColor: member.occupancy > 80 ? "#ef4444" : member.occupancy > 50 ? "#7c5cfc" : "#10b981"
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Rendimiento & Comisiones */}
      {activeTab === "productivity" && (
        <div>
          {/* Period selector */}
          <div className="tm-period-block">
            <span className="tm-period-label">Período de análisis</span>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="tm-period-select"
            >
              <option value="month">Este mes</option>
              <option value="prev">Mes anterior</option>
              <option value="quarter">Último trimestre</option>
            </select>
          </div>

          {/* 2x2 Grid of KPIs with Sparklines */}
          <div className="tm-kpis">
            <div className="tm-kpi">
              <div>
                <span className="tm-kpi__title">Facturación Total</span>
                <div className="tm-kpi__value text-purple">{currency(dashboardMetrics.totalBilling)}</div>
              </div>
              <div className="tm-kpi__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={billingHistory}>
                    <defs>
                      <linearGradient id="billingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#7c5cfc" strokeWidth={1.5} fillOpacity={1} fill="url(#billingGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="tm-kpi">
              <div>
                <span className="tm-kpi__title">Comisiones</span>
                <div className="tm-kpi__value text-success">{currency(dashboardMetrics.totalCommissions)}</div>
              </div>
              <div className="tm-kpi__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={commissionHistory}>
                    <defs>
                      <linearGradient id="commissionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#commissionGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="tm-kpi">
              <div>
                <span className="tm-kpi__title">Ocupación Promedio</span>
                <div className="tm-kpi__value text-pink">{dashboardMetrics.avgOccupancy}%</div>
              </div>
              <div className="tm-kpi__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occupancyHistory}>
                    <defs>
                      <linearGradient id="occupGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#ec4899" strokeWidth={1.5} fillOpacity={1} fill="url(#occupGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="tm-kpi">
              <div>
                <span className="tm-kpi__title">Ticket Promedio</span>
                <div className="tm-kpi__value">{currency(dashboardMetrics.avgTicket)}</div>
              </div>
              <div className="tm-kpi__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketHistory}>
                    <defs>
                      <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#ticketGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Podium Top 3 */}
          <div className="tm-podium-card">
            <h3 className="tm-podium-title">
              <Award size={18} className="text-pink animate-bounce" />
              <span>Podio de Estilistas</span>
            </h3>
            
            {staffStats.length > 0 ? (
              <div className="tm-podium-container">
                {/* 2nd Place */}
                {staffStats[1] && (
                  <div className="tm-podium-column">
                    <span style={{ fontSize: "16px" }}>🥈</span>
                    <span className="tm-podium-name">{staffStats[1].firstName}</span>
                    <span className="tm-podium-value">{currency(staffStats[1].billing)}</span>
                    <div className="tm-podium-bar tm-podium-bar--2">2</div>
                  </div>
                )}

                {/* 1st Place */}
                {staffStats[0] && (
                  <div className="tm-podium-column">
                    <span style={{ fontSize: "22px", marginBottom: "-4px" }} className="animate-bounce">👑</span>
                    <span className="tm-podium-name" style={{ fontWeight: 800 }}>{staffStats[0].firstName}</span>
                    <span className="tm-podium-value" style={{ color: "var(--t-purple)" }}>{currency(staffStats[0].billing)}</span>
                    <div className="tm-podium-bar tm-podium-bar--1">1</div>
                  </div>
                )}

                {/* 3rd Place */}
                {staffStats[2] && (
                  <div className="tm-podium-column">
                    <span style={{ fontSize: "16px" }}>🥉</span>
                    <span className="tm-podium-name">{staffStats[2].firstName}</span>
                    <span className="tm-podium-value">{currency(staffStats[2].billing)}</span>
                    <div className="tm-podium-bar tm-podium-bar--3">3</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted small">Datos insuficientes para el podio.</div>
            )}
          </div>

          {/* Liquidacion cards (no horizontal scroll) */}
          <h3 className="tm-payroll-title">Liquidación de comisiones</h3>
          {staffStats.length === 0 ? (
            <div className="text-center py-4 text-muted small">Sin datos de comisiones.</div>
          ) : (
            staffStats.map((s) => (
              <div className="tm-payroll-card" key={s.id}>
                <div className="tm-payroll-row">
                  <span className="tm-payroll-value tm-payroll-value--name">{s.name}</span>
                  <span className="tm-payroll-value">{s.cargo}</span>
                </div>
                
                <div className="tm-payroll-row" style={{ marginTop: "8px", borderTop: "1px solid #f8f7fc", paddingTop: "8px" }}>
                  <span className="tm-payroll-label">Facturado</span>
                  <span className="tm-payroll-value">{currency(s.billing)}</span>
                </div>

                <div className="tm-payroll-row">
                  <span className="tm-payroll-label">Ocupación / Retención</span>
                  <span className="tm-payroll-value">{s.occupancy}% / {s.retentionRate}%</span>
                </div>

                <div className="tm-payroll-row">
                  <span className="tm-payroll-label">Comisión Estimada</span>
                  <span className="tm-payroll-value tm-payroll-value--commission">{currency(s.estimatedCommission)}</span>
                </div>
              </div>
            ))
          )}

          {/* Contribution Donut Chart */}
          <div className="tm-donut-card">
            <h3 className="tm-donut-title">Aporte Relativo a Facturación</h3>
            
            {staffStats.length > 0 ? (
              <div style={{ display: "flex", justifyContent: "center", position: "relative", height: "150px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contributionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {contributionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center"
                }}>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--t-muted)", textTransform: "uppercase" }}>Total</span>
                  <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--t-text)" }}>{currency(totalBillingVal)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted small">Sin aportes registrados.</div>
            )}

            {/* Donut Legend */}
            <div className="tm-donut-legend">
              {contributionPieData.map((data, index) => {
                const percentage = totalBillingVal > 0 ? Math.round((data.value / totalBillingVal) * 100) : 0;
                return (
                  <div className="tm-legend-item" key={index}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span className="tm-legend-indicator" style={{ backgroundColor: data.color }} />
                      <span style={{ fontWeight: "700", color: "var(--t-text)" }}>{data.name}</span>
                    </div>
                    <span style={{ fontWeight: "800", color: "var(--t-muted)" }}>{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
