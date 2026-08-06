import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Dropdown } from "react-bootstrap";
import { GripVertical, Trash2, Settings, Plus, LayoutGrid, Search, ArrowLeft, ArrowRight } from "lucide-react";
import WidgetRenderer from "./WidgetRenderer";
import { useTranslation } from "react-i18next";

export default function DashboardGrid({
  widgets = [],
  appointments = [],
  clients = [],
  workers = [],
  services = [],
  expenses = [],
  products = [],
  searchQuery = "",
  onClearSearch,
  onUpdateLayouts,
  onEditWidget,
  onDeleteWidget,
  onOpenAddModal,
  onUpdateAppointmentStatus,
  onConfirmAppointment,
  onFinalizeAppointment,
  onViewCalendar,
  onEditWorker,
}) {
  const { i18n } = useTranslation();
  const isEs = i18n ? i18n.language === "es" : true;
  const [draggedIdx, setDraggedIdx] = useState(null);

  // --- Manejo del Drag & Drop nativo ---
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDraggedIdx(null);
    onUpdateLayouts(widgets, true);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const reordered = [...widgets];
    const [draggedItem] = reordered.splice(draggedIdx, 1);
    reordered.splice(index, 0, draggedItem);

    onUpdateLayouts(reordered, false);
    setDraggedIdx(index);
  };

  // --- Mover de lugar un widget ---
  const handleMoveWidget = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= widgets.length) return;

    const reordered = [...widgets];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, movedItem);

    onUpdateLayouts(reordered, true);
  };

  // --- Cambiar tamaño de un widget directamente ---
  const handleResize = (widget, deltaW, deltaH) => {
    const wOptions = [3, 4, 6, 8, 12];
    const currentWIdx = wOptions.indexOf(widget.layout?.w || 4);
    let newW = widget.layout?.w || 4;

    if (deltaW > 0 && currentWIdx < wOptions.length - 1) {
      newW = wOptions[currentWIdx + 1];
    } else if (deltaW < 0 && currentWIdx > 0) {
      newW = wOptions[currentWIdx - 1];
    }

    let newH = (widget.layout?.h || 4) + deltaH;
    if (newH < 2) newH = 2;
    if (newH > 8) newH = 8;

    const updatedWidget = {
      ...widget,
      layout: {
        ...widget.layout,
        w: newW,
        h: newH,
      },
    };

    onEditWidget(updatedWidget);
  };

  if (widgets.length === 0) {
    if (searchQuery.trim()) {
      return (
        <div
          className="d-flex flex-column align-items-center justify-content-center text-center p-5 border border-dashed rounded-4 bg-light"
          style={{ minHeight: "350px", borderColor: "#c0c0c0" }}
        >
          <Search size={48} className="text-muted mb-3" />
          <h3 className="fw-bold mb-2">{isEs ? "Sin resultados" : "No results found"}</h3>
          <p className="text-muted small mb-4" style={{ maxWidth: "420px" }}>
            {isEs
              ? `No encontramos ningún gadget que coincida con "${searchQuery}". Probá buscando con otro término.`
              : `We couldn't find any gadgets matching "${searchQuery}". Try searching for another term.`}
          </p>
          <div className="d-flex gap-3">
            <Button variant="dark" onClick={onClearSearch} className="btn-premium rounded-pill px-4">
              {isEs ? "Limpiar búsqueda" : "Clear Search"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center text-center p-5 border border-dashed rounded-4 bg-light"
        style={{ minHeight: "350px", borderColor: "#c0c0c0" }}
      >
        <LayoutGrid size={48} className="text-muted mb-3" />
        <h3 className="fw-bold mb-2">{isEs ? "Tu Dashboard está vacío" : "Your Dashboard is empty"}</h3>
        <p className="text-muted small mb-4" style={{ maxWidth: "420px" }}>
          {isEs
            ? "Construí un dashboard inteligente a tu medida. Podés agregar widgets manualmente o escribirle a la IA para que los genere por vos."
            : "Build a smart dashboard tailored to your needs. You can add widgets manually or write to the AI so it generates them for you."}
        </p>
        <div className="d-flex gap-3">
          <Button variant="dark" onClick={onOpenAddModal} className="btn-premium rounded-pill px-4">
            <Plus size={16} className="me-2" /> {isEs ? "Agregar Widget" : "Add Widget"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widgets-grid">
      <style>{`
        .dashboard-widgets-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: 110px;
          gap: 20px;
          grid-auto-flow: row dense;
          padding-bottom: 40px;
          width: 100%;
        }
        @media (max-width: 992px) {
          .dashboard-widgets-grid {
            grid-template-columns: repeat(6, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .dashboard-widgets-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-widgets-grid > div {
            grid-column: span 1 !important;
            grid-row: span 4 !important;
          }
        }
      `}</style>

      {widgets.map((w, idx) => {
        const colSpan = Math.min(12, Math.max(3, w.layout?.w || 4));
        const rowSpan = Math.min(8, Math.max(2, w.layout?.h || 4));

        return (
          <motion.div
            key={w.id}
            layoutId={w.id}
            layout
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{
              gridColumn: `span ${colSpan}`,
              gridRow: `span ${rowSpan}`,
            }}
            onDragOver={(e) => handleDragOver(e, idx)}
            className="position-relative"
          >
            <Card
              className="card-premium h-100 border-0 shadow-premium overflow-hidden hover-shadow bg-white d-flex flex-column"
            >
              {/* Cabecera / Drag Handle */}
              <div
                className={`px-3.5 py-2.5 bg-light d-flex align-items-center justify-content-between border-bottom ${
                  searchQuery ? "" : "cursor-grab"
                }`}
                draggable={!searchQuery}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnd={handleDragEnd}
                style={{ userSelect: "none", cursor: searchQuery ? "default" : "grab" }}
              >
                <div className="d-flex align-items-center gap-2">
                  {!searchQuery && (
                    <GripVertical size={13} className="text-muted opacity-65 cursor-grab" />
                  )}
                  <span className="small text-dark fw-bold" style={{ fontSize: "12.5px" }}>
                    {w.title}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-1">
                  {/* Controles de movimiento e indicación */}
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="p-0 text-muted no-caret">
                      <Settings size={14} />
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="dropdown-premium">
                      <Dropdown.Item onClick={() => onEditWidget(w)} className="small">
                        {isEs ? "Configurar widget" : "Configure widget"}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => handleResize(w, 1, 0)} className="small">
                        {isEs ? "Aumentar Ancho (+ Ancho)" : "Increase Width"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleResize(w, -1, 0)} className="small">
                        {isEs ? "Reducir Ancho (- Ancho)" : "Reduce Width"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleResize(w, 0, 1)} className="small">
                        {isEs ? "Aumentar Alto (+ Alto)" : "Increase Height"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleResize(w, 0, -1)} className="small">
                        {isEs ? "Reducir Alto (- Alto)" : "Reduce Height"}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      {idx > 0 && (
                        <Dropdown.Item onClick={() => handleMoveWidget(idx, -1)} className="small d-flex align-items-center gap-1.5">
                          <ArrowLeft size={13} /> {isEs ? "Mover antes" : "Move before"}
                        </Dropdown.Item>
                      )}
                      {idx < widgets.length - 1 && (
                        <Dropdown.Item onClick={() => handleMoveWidget(idx, 1)} className="small d-flex align-items-center gap-1.5">
                          <ArrowRight size={13} /> {isEs ? "Mover después" : "Move after"}
                        </Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>

                  <Button
                    variant="link"
                    onClick={() => onDeleteWidget(w.id)}
                    className="p-0 text-danger ms-1"
                    title={isEs ? "Eliminar widget" : "Delete widget"}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Contenido del Widget */}
              <Card.Body className="p-3 flex-grow-1 overflow-auto">
                <WidgetRenderer
                  widget={w}
                  appointments={w.appointmentsData || appointments}
                  clients={w.clientsData || clients}
                  workers={workers}
                  services={services}
                  expenses={expenses}
                  products={products}
                  onUpdateAppointmentStatus={onUpdateAppointmentStatus}
                  onConfirmAppointment={onConfirmAppointment}
                  onFinalizeAppointment={onFinalizeAppointment}
                  onViewCalendar={onViewCalendar}
                  onEditWorker={onEditWorker}
                />
              </Card.Body>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}


