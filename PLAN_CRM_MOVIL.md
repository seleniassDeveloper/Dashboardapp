# Plan de implementación — CRM / Clientes en móvil (AuraDash)

Objetivo: que la vista de Clientes en teléfono deje de ser una tabla con scroll horizontal y pase a ser una **lista de tarjetas** cómoda, con acciones de un toque (llamar, WhatsApp, ver ficha) y un botón flotante para crear cliente. Todo reutilizando el hook `useIsMobile` que ya existe.

Principio rector: **una sola lógica de datos, dos presentaciones.** No duplicamos la carga de clientes ni los handlers; solo cambia lo que se dibuja.

---

## 1. Arquitectura elegida

Hoy `ClientsView.jsx` mezcla tres cosas: (a) estado y llamadas al API, (b) el cálculo del estado del cliente (VIP/Activo/Inactivo/Nuevo) incrustado en el JSX de la tabla, y (c) el render de escritorio.

Vamos a separarlas así:

```
src/views/ClientsView.jsx        → orquestador: decide móvil vs escritorio
src/hooks/useClients.js          → TODA la lógica (fetch, búsqueda, borrar, paginar)
src/lib/clientStatus.js          → cálculo de estado del cliente (extraído del JSX)
src/components/clients/ClientsDesktop.jsx   → la tabla actual (lo que ya tienes)
src/components/clients/ClientsMobile.jsx    → nueva lista de tarjetas
src/components/clients/ClientCard.jsx       → tarjeta individual
src/components/clients/ClientsMobile.css    → estilos de la lista móvil
```

Ventaja: si mañana cambias la regla de "quién es VIP", la tocas en un solo archivo y aplica a móvil y escritorio.

---

## 2. Paso 1 — Extraer el cálculo de estado (`src/lib/clientStatus.js`)

Hoy esta lógica vive dentro de un IIFE en la celda de la tabla (líneas 237–292 de `ClientsView.jsx`). La sacamos tal cual:

```js
// src/lib/clientStatus.js
export function getClientStatus(client, appointments) {
  const clientAppts = appointments.filter((a) => a.clientId === client.id);
  const doneAppts = clientAppts.filter(
    (a) => a.status === "DONE" || a.status === "CONFIRMED"
  );
  const upcomingAppts = clientAppts.filter(
    (a) => new Date(a.startsAt) > new Date() &&
      (a.status === "PENDING" || a.status === "CONFIRMED")
  );
  const totalSpent = doneAppts.reduce(
    (sum, a) => sum + Number(a.service?.price || 0), 0
  );

  let status = "NUEVO";
  let days = null;

  if (doneAppts.length > 0) {
    const latest = doneAppts.reduce((acc, a) => {
      const date = new Date(a.startsAt);
      return date > acc ? date : acc;
    }, new Date(0));
    days = Math.floor(Math.abs(new Date() - latest) / (1000 * 60 * 60 * 24));

    if (doneAppts.length >= 5 && totalSpent >= 50000) status = "VIP";
    else if (days <= 30 || upcomingAppts.length > 0) status = "ACTIVO";
    else if (days > 60) status = "INACTIVO";
    else status = "ACTIVO";
  }

  return { status, days, visits: doneAppts.length, totalSpent };
}
```

Luego, en la tabla de escritorio, reemplazas el bloque inline por una llamada a `getClientStatus(c, appointments)` y solo decides el color del badge. Esto simplifica también el desktop.

---

## 3. Paso 2 — Extraer la lógica a un hook (`src/hooks/useClients.js`)

Mueves todo lo que hoy es estado y funciones (líneas 30–151 de `ClientsView.jsx`) a un hook. El componente ya no tendrá lógica, solo consumirá el hook.

```js
// src/hooks/useClients.js
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";
import { useTranslation } from "react-i18next";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export function useClients() {
  const { t } = useTranslation("views");
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    api.get("/appointments")
      .then((res) => setAppointments(safeArray(res.data)))
      .catch((e) => console.error("Error cargando citas:", e));
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setError(""); setOkMsg(""); setLoading(true);
      const res = await api.get(`/clients`, {
        params: q.trim() ? { search: q.trim() } : {},
      });
      setClients(safeArray(res.data));
    } catch (e) {
      setError(e?.response?.data?.error || t("clients.errors.load"));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(), 250);
    return () => clearTimeout(timer);
  }, [q, fetchClients]);

  const sorted = useMemo(() => {
    return [...clients].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );
  }, [clients]);

  const handleSaved = useCallback((saved) => {
    setClients((prev) => {
      const id = saved?.id;
      if (!id) return prev;
      return prev.some((c) => c.id === id)
        ? prev.map((c) => (c.id === id ? saved : c))
        : [saved, ...prev];
    });
  }, []);

  const handleDelete = useCallback(async (client) => {
    if (!client?.id) return;
    try {
      setBusyId(client.id);
      await api.delete(`/clients/${client.id}`);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      setOkMsg(t("clients.success.deleted"));
    } catch (e) {
      setError(e?.response?.data?.error || t("clients.errors.delete"));
    } finally {
      setBusyId("");
    }
  }, []);

  return {
    clients: sorted, appointments, q, setQ, loading, busyId,
    error, okMsg, fetchClients, handleSaved, handleDelete,
    setClients, setError, setOkMsg,
  };
}
```

---

## 4. Paso 3 — La tarjeta de cliente (`ClientCard.jsx`)

El corazón del móvil. Muestra foto, nombre, estado, y **tres botones grandes de acción directa**: llamar, WhatsApp y ver ficha. Aquí está el valor real: un dueño de salón en el celular quiere tocar y llamar, no arrastrar una tabla.

```jsx
// src/components/clients/ClientCard.jsx
import React from "react";
import { Phone, MessageCircle, ChevronRight } from "lucide-react";
import { getClientStatus } from "../../lib/clientStatus";

const STATUS_STYLES = {
  VIP:      { label: "👑 VIP",      bg: "#fef3c7", color: "#d97706" },
  ACTIVO:   { label: "🟢 Activo",   bg: "#d1fae5", color: "#065f46" },
  INACTIVO: { label: "🔴 Inactivo", bg: "#fee2e2", color: "#991b1b" },
  NUEVO:    { label: "🔵 Nuevo",    bg: "#e0f2fe", color: "#075985" },
};

const cleanPhone = (p) => (p || "").replace(/[^\d+]/g, "");

export default function ClientCard({ client, appointments, getImageUrl, onOpen }) {
  const name = client.fullName || `${client.firstName || ""} ${client.lastName || ""}`.trim() || "—";
  const { status } = getClientStatus(client, appointments);
  const st = STATUS_STYLES[status];
  const phone = cleanPhone(client.phone);

  return (
    <div className="client-card">
      <button className="client-card__main" onClick={() => onOpen(client)}>
        <div className="client-card__avatar">
          {client.photoUrl
            ? <img src={getImageUrl(client.photoUrl)} alt={name} />
            : name.charAt(0).toUpperCase()}
        </div>
        <div className="client-card__info">
          <span className="client-card__name">{name}</span>
          <span className="client-card__badge" style={{ background: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>
        <ChevronRight size={18} className="client-card__chevron" />
      </button>

      <div className="client-card__actions">
        {phone && (
          <a className="client-card__action" href={`tel:${phone}`} aria-label="Llamar">
            <Phone size={18} /> Llamar
          </a>
        )}
        {phone && (
          <a
            className="client-card__action client-card__action--wa"
            href={`https://wa.me/${phone.replace("+", "")}`}
            target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
```

Nota clave: `href="tel:..."` y `https://wa.me/...` son nativos del teléfono — abren la app de llamadas y WhatsApp directamente. Cero librerías. Asegúrate de que el teléfono guardado incluya código de país para WhatsApp (o normalízalo al guardarlo).

---

## 5. Paso 4 — La lista móvil (`ClientsMobile.jsx`)

Sustituye tabla + paginación por: buscador fijo arriba (sticky), lista de tarjetas con scroll natural, botón "cargar más" (mejor que paginación numérica en el pulgar) y un **FAB** (botón flotante circular) para crear cliente.

```jsx
// src/components/clients/ClientsMobile.jsx
import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import ClientCard from "./ClientCard";
import "./ClientsMobile.css";

const PAGE = 15;

export default function ClientsMobile({
  clients, appointments, q, setQ, loading,
  getImageUrl, onOpenDetail, onCreate,
}) {
  const [visible, setVisible] = useState(PAGE);
  const shown = clients.slice(0, visible);

  return (
    <div className="clients-mobile">
      <div className="clients-mobile__search">
        <Search size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente..."
          inputMode="search"
        />
      </div>

      {loading && clients.length === 0 ? (
        <p className="clients-mobile__empty">Cargando...</p>
      ) : clients.length === 0 ? (
        <p className="clients-mobile__empty">Sin clientes todavía.</p>
      ) : (
        <>
          <div className="clients-mobile__list">
            {shown.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                appointments={appointments}
                getImageUrl={getImageUrl}
                onOpen={onOpenDetail}
              />
            ))}
          </div>
          {visible < clients.length && (
            <button className="clients-mobile__more" onClick={() => setVisible((v) => v + PAGE)}>
              Cargar más ({clients.length - visible})
            </button>
          )}
        </>
      )}

      <button className="clients-mobile__fab" onClick={onCreate} aria-label="Nuevo cliente">
        <Plus size={26} />
      </button>
    </div>
  );
}
```

---

## 6. Paso 5 — Estilos móvil (`ClientsMobile.css`)

Puntos críticos: botones de mínimo 44px, buscador pegajoso, y el FAB respetando el notch/barra del iPhone con `safe-area-inset` (ya tienes `viewport-fit=cover` en el `index.html`, que es el requisito previo). El FAB va por encima del `MobileTabBar` que ya existe.

```css
.clients-mobile { padding: 12px 12px 96px; }

.clients-mobile__search {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #eee; border-radius: 14px;
  padding: 10px 14px; margin-bottom: 12px;
}
.clients-mobile__search input { border: 0; outline: 0; flex: 1; font-size: 16px; }
/* 16px evita el zoom automático de iOS al enfocar el input */

.clients-mobile__list { display: flex; flex-direction: column; gap: 10px; }

.client-card {
  background: #fff; border: 1px solid #f0f0f0;
  border-radius: 16px; overflow: hidden;
}
.client-card__main {
  width: 100%; display: flex; align-items: center; gap: 12px;
  padding: 14px; background: none; border: 0; text-align: left;
}
.client-card__avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: #fce7f3; color: #db2777; font-weight: 700;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.client-card__avatar img { width: 100%; height: 100%; object-fit: cover; }
.client-card__info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.client-card__name { font-weight: 600; font-size: 15px; }
.client-card__badge {
  align-self: flex-start; font-size: 12px; font-weight: 700;
  padding: 2px 8px; border-radius: 999px;
}
.client-card__chevron { color: #cbd5e1; flex-shrink: 0; }

.client-card__actions { display: flex; border-top: 1px solid #f5f5f5; }
.client-card__action {
  flex: 1; min-height: 44px; display: flex; align-items: center;
  justify-content: center; gap: 6px; font-size: 14px; font-weight: 600;
  color: #334155; text-decoration: none;
}
.client-card__action:active { background: #f8fafc; }
.client-card__action--wa { color: #16a34a; border-left: 1px solid #f5f5f5; }

.clients-mobile__more {
  width: 100%; margin-top: 14px; padding: 12px; border: 0;
  border-radius: 12px; background: #f1f5f9; font-weight: 600;
}

.clients-mobile__fab {
  position: fixed; right: 18px;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px)); /* sobre el MobileTabBar */
  width: 56px; height: 56px; border-radius: 50%; border: 0;
  background: var(--color-pink-active, #ec4899); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(236,72,153,.4); z-index: 40;
}
.clients-mobile__empty { text-align: center; color: #94a3b8; padding: 40px 0; }
```

---

## 7. Paso 6 — Conectar todo en `ClientsView.jsx`

El componente queda mínimo: consume el hook, decide presentación y monta los modales (que se reutilizan tal cual, tanto en móvil como escritorio — `ClientModal` y `ClientDetailModal` de react-bootstrap ya funcionan a pantalla completa en móvil).

```jsx
// src/views/ClientsView.jsx (esqueleto final)
import React, { useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useClients } from "../hooks/useClients";
import ClientsDesktop from "../components/clients/ClientsDesktop";
import ClientsMobile from "../components/clients/ClientsMobile";
import ClientModal from "../header/clients/ClientModal.jsx";
import ClientDetailModal from "../components/clients/ClientDetailModal.jsx";
import { API_BASE_URL } from "../lib/api.js";

const getImageUrl = (url) => {
  if (!url) return "";
  if (/^(https?:|data:)/.test(url)) return url;
  return `${API_BASE_URL.replace(/\/api$/, "")}${url}`;
};

export default function ClientsView() {
  const isMobile = useIsMobile();
  const cx = useClients();

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailClient, setDetailClient] = useState(null);

  const openCreate = () => { setMode("create"); setEditing(null); setShowForm(true); };
  const openDetail = (c) => { setDetailClient(c); setShowDetail(true); };

  const shared = { ...cx, getImageUrl, onOpenDetail: openDetail, onCreate: openCreate };

  return (
    <>
      {isMobile ? <ClientsMobile {...shared} /> : <ClientsDesktop {...shared} onEdit={(c) => { setMode("edit"); setEditing(c); setShowForm(true); }} />}

      <ClientModal
        show={showForm} onHide={() => setShowForm(false)}
        mode={mode} initialData={editing} onSaved={cx.handleSaved}
      />
      <ClientDetailModal
        show={showDetail} onHide={() => setShowDetail(false)}
        client={detailClient} appointments={cx.appointments}
        onPhotoUpdated={(id, photoUrl) =>
          cx.setClients((prev) => prev.map((c) => (c.id === id ? { ...c, photoUrl } : c)))}
      />
    </>
  );
}
```

`ClientsDesktop.jsx` = copiar el JSX actual de la tabla (líneas 153–368) y recibir todo por props en vez de estado local.

---

## 8. Orden de ejecución sugerido

1. Crear `clientStatus.js` y refactorizar la tabla actual para usarlo → verificar que escritorio sigue igual.
2. Crear `useClients.js` y mover la lógica → verificar escritorio otra vez (sin cambios visuales).
3. Renombrar el render actual a `ClientsDesktop.jsx`.
4. Crear `ClientCard.jsx` + `ClientsMobile.jsx` + CSS.
5. Cablear el branch `isMobile` en `ClientsView.jsx`.
6. Probar en el navegador con DevTools en modo móvil (≤767px) y en un teléfono real vía la IP local (`vite` ya corre con `--host`).

## 9. Cómo verificar

- DevTools → modo dispositivo (iPhone SE / 375px): la tabla ya no aparece, sí las tarjetas.
- Tocar "Llamar" abre el marcador; "WhatsApp" abre el chat (probar en teléfono real, no en desktop).
- El FAB no queda tapado por la barra inferior ni por el notch.
- Escritorio (≥768px) intacto: misma tabla de siempre.
- Los inputs no provocan zoom al enfocar (font-size 16px).

## 10. Notas y supuestos

- Asumo que el teléfono se guarda con código de país; si no, conviene normalizarlo en `ClientModal` al guardar, para que WhatsApp funcione.
- La misma receta (hook + Card + Mobile + branch por `isMobile`) se replica luego en Agenda, Dashboard y Automatizaciones. Este es el patrón base de todo el móvil.
- No se toca el backend. Todo es capa de presentación.
