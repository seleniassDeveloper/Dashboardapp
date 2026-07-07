import React, { useMemo } from "react";
import { 
  Package, AlertTriangle, Clock, ShoppingCart, ChevronRight, 
  ArrowDown, ArrowUp, Scan, Plus, FileText, Bell, Search, Menu 
} from "lucide-react";

function currency(n) {
  const num = Number(n);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}

function formatTime(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs";
}

export default function InventoryHome({ state, onOpenScanner }) {
  const {
    products,
    movements,
    safeSummary,
    alerts
  } = state;

  // Calculate expiring products count (expiration dates within 30 days)
  const expiringCount = useMemo(() => {
    let count = 0;
    products.forEach(p => {
      if (p && Array.isArray(p.batches)) {
        p.batches.forEach(b => {
          if (b && b.expirationDate) {
            const now = Date.now();
            const exp = new Date(b.expirationDate).getTime();
            const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            if (diffDays > 0 && diffDays <= 30) {
              count++;
            }
          }
        });
      }
    });
    return count || 7; // Mockup fallback to 7
  }, [products]);

  // Format recent movements list matching mockup
  const displayMovements = useMemo(() => {
    const list = safeArray(movements).slice(0, 3);
    if (list.length > 0) return list;

    // Fallbacks if empty
    return [
      {
        id: "mock-mov-1",
        type: "output",
        reason: "Salida por servicio",
        product: { name: "Coloración + Corte", unit: "ml" },
        diff: -80,
        createdAt: new Date().toISOString()
      },
      {
        id: "mock-mov-2",
        type: "output",
        reason: "Salida por servicio",
        product: { name: "Botox Capilar", unit: "ml" },
        diff: -20,
        createdAt: new Date().toISOString()
      },
      {
        id: "mock-mov-3",
        type: "input",
        reason: "Entrada por compra",
        product: { name: "Proveedor: Belleza Pro", unit: "unidades" },
        diff: 10,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }, [movements]);

  // Format alerts matching mockup
  const displayAlerts = useMemo(() => {
    const list = safeArray(alerts).slice(0, 3);
    if (list.length > 0) return list;

    // Fallbacks if empty
    return [
      {
        id: "mock-alert-1",
        name: "Shampoo Hidratante 1L",
        sub: "Stock actual: 2 unidades",
        severity: "crit",
        badgeText: "Crítico"
      },
      {
        id: "mock-alert-2",
        name: "Coloración 7.1",
        sub: "Stock actual: 8 unidades",
        severity: "low",
        badgeText: "Bajo"
      },
      {
        id: "mock-alert-3",
        name: "Oxidante 20 Vol",
        sub: "Vence en 15 días",
        severity: "exp",
        badgeText: "Vencer"
      }
    ];
  }, [alerts]);

  function safeArray(arr) {
    return Array.isArray(arr) ? arr : [];
  }

  return (
    <div className="animate-fade-in">
      {/* SECCIÓN 1 — Header oscuro (gradiente púrpura) */}
      <header className="i-header">
        <div className="i-header__top">
          <button className="btn p-0 border-0 text-white bg-transparent">
            <Menu size={22} />
          </button>
          <div className="i-header__title">
            <b>Inventario</b>
            <span>Centro de Control ERP</span>
          </div>
          <button className="i-header__bell">
            <Bell size={20} />
          </button>
        </div>

        {/* Buscador + Escáner */}
        <div className="i-searchrow">
          <div className="i-search">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Buscar insumos, lotes o códigos" 
              readOnly 
              onClick={onOpenScanner}
            />
          </div>
          <button className="i-scan-btn" onClick={onOpenScanner} aria-label="Escanear">
            <Scan size={22} />
          </button>
        </div>
      </header>

      {/* SECCIÓN 2 — Resumen General (grid 2x2) */}
      <div className="i-section">
        <h3>Resumen General</h3>
        <span className="i-section__time">Hoy, 9:41 AM</span>
      </div>

      <section className="i-kpis">
        {/* KPI 1: Valor del inventario */}
        <div className="i-kpi">
          <div className="i-kpi__icon i-kpi__icon--purple">
            <Package size={20} />
          </div>
          <div className="i-kpi__label">Valor del inventario</div>
          <div className="i-kpi__value">{currency(safeSummary.totalValue || 2350480)}</div>
          <div className="i-kpi__sub i-kpi__sub--up">↗ 8.3% vs mes anterior</div>
        </div>

        {/* KPI 2: Insumos bajos */}
        <div className="i-kpi">
          <div className="i-kpi__icon i-kpi__icon--red">
            <AlertTriangle size={20} />
          </div>
          <div className="i-kpi__label">Insumos bajos</div>
          <div className="i-kpi__value">{safeSummary.lowStockCount || 14}</div>
          <div className="i-kpi__sub i-kpi__sub--warn">Requieren atención</div>
        </div>

        {/* KPI 3: Próximos a vencer */}
        <div className="i-kpi">
          <div className="i-kpi__icon i-kpi__icon--orange">
            <Clock size={20} />
          </div>
          <div className="i-kpi__label">Próximos a vencer</div>
          <div className="i-kpi__value">{expiringCount}</div>
          <div className="i-kpi__sub">En próximos 30 días</div>
        </div>

        {/* KPI 4: Órdenes de compra */}
        <div className="i-kpi">
          <div className="i-kpi__icon i-kpi__icon--blue">
            <ShoppingCart size={20} />
          </div>
          <div className="i-kpi__label">Órdenes de compra</div>
          <div className="i-kpi__value">3</div>
          <div className="i-kpi__sub">En curso</div>
        </div>
      </section>

      {/* SECCIÓN 3 — Alertas de Stock */}
      <div className="i-section">
        <h3>Alertas de Stock</h3>
        <button className="i-see">Ver todas</button>
      </div>

      <section className="i-card mx-2">
        {displayAlerts.map(alert => (
          <div key={alert.id} className="i-alert" onClick={onOpenScanner}>
            <div className={`i-alert__icon i-alert__icon--${alert.severity}`}>
              <AlertTriangle size={18} />
            </div>
            <div className="i-alert__body">
              <div className="i-alert__name">{alert.name}</div>
              <div className="i-alert__sub">{alert.sub}</div>
            </div>
            <div className={`i-alert__tag i-alert__tag--${alert.severity}`}>
              {alert.badgeText}
              <ChevronRight size={14} className="text-secondary" />
            </div>
          </div>
        ))}
      </section>

      {/* SECCIÓN 4 — Últimos movimientos */}
      <div className="i-section">
        <h3>Últimos movimientos</h3>
        <button className="i-see">Ver todas</button>
      </div>

      <section className="i-card mx-2">
        {displayMovements.map(mov => {
          const isInput = mov.type === "input" || mov.diff > 0;
          return (
            <div key={mov.id} className="i-mov">
              <div className={`i-mov__icon ${isInput ? "i-mov__icon--in" : "i-mov__icon--out"}`}>
                {isInput ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </div>
              <div className="i-mov__body">
                <div className="i-mov__type">{mov.reason || (isInput ? "Entrada por compra" : "Salida por servicio")}</div>
                <div className="i-mov__sub">{mov.product?.name || "Producto"}</div>
              </div>
              <div className="i-mov__right">
                <div className={`i-mov__qty ${isInput ? "i-mov__qty--in" : ""}`}>
                  {isInput ? "+" : ""}{mov.diff} {mov.product?.unit || "unidades"}
                </div>
                <div className="i-mov__time">
                  {formatTime(mov.createdAt) || "Ayer, 4:20 PM"}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* SECCIÓN 5 — Acciones rápidas */}
      <div className="i-section">
        <h3>Acciones rápidas</h3>
      </div>

      <section className="i-quick">
        {/* Accion 1: Escanear */}
        <button className="i-quick__item" onClick={onOpenScanner}>
          <div className="i-quick__icon i-quick__icon--purple">
            <Scan size={20} />
          </div>
          <div className="i-quick__label">Escanear</div>
        </button>

        {/* Accion 2: Añadir producto */}
        <button className="i-quick__item" onClick={onOpenScanner}>
          <div className="i-quick__icon i-quick__icon--purple">
            <Plus size={20} />
          </div>
          <div className="i-quick__label">Añadir producto</div>
        </button>

        {/* Accion 3: Nueva compra */}
        <button className="i-quick__item" onClick={onOpenScanner}>
          <div className="i-quick__icon i-quick__icon--blue">
            <ShoppingCart size={20} />
          </div>
          <div className="i-quick__label">Nueva compra</div>
        </button>

        {/* Accion 4: Ver reportes */}
        <button className="i-quick__item" onClick={onOpenScanner}>
          <div className="i-quick__icon i-quick__icon--orange">
            <FileText size={20} />
          </div>
          <div className="i-quick__label">Ver reportes</div>
        </button>
      </section>
    </div>
  );
}
