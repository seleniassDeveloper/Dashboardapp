import React, { useState, useEffect, useRef, useCallback } from "react";
import RGL from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Card, Button, Dropdown } from "react-bootstrap";
import { GripVertical, Trash2, Settings, Plus, LayoutGrid, Search } from "lucide-react";
import WidgetRenderer from "./WidgetRenderer";
import { useTranslation } from "react-i18next";

const WidthProvider = RGL.WidthProvider || RGL.default?.WidthProvider;
const ReactGridLayout = WidthProvider ? WidthProvider(RGL.default || RGL) : (RGL.default || RGL);

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
  const isEs = i18n.language === "es";

  const debounceTimerRef = useRef(null);

  // Mapear widgets a ítems de react-grid-layout
  const layoutItems = widgets.map((w, idx) => ({
    i: String(w.id),
    x: typeof w.layout?.x === "number" ? w.layout.x : (idx % 3) * 4,
    y: typeof w.layout?.y === "number" ? w.layout.y : Math.floor(idx / 3) * 3,
    w: w.layout?.w || 4,
    h: w.layout?.h || 2,
    minW: 2,
    maxW: 12,
    minH: 1,
    maxH: 12,
  }));

  const handleLayoutChange = useCallback(
    (newLayout) => {
      if (searchQuery) return; // No persistir si hay búsqueda activa

      const updatedWidgets = widgets.map((w, index) => {
        const item = newLayout.find((l) => l.i === String(w.id));
        if (!item) return w;

        return {
          ...w,
          layout: {
            ...w.layout,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          },
          position: index,
        };
      });

      // Debounce de ~500ms para guardar cambios en backend sin spamear
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onUpdateLayouts(updatedWidgets, true);
      }, 500);
    },
    [widgets, searchQuery, onUpdateLayouts]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // --- Cambiar tamaño de un widget desde el menú de opciones ---
  const handleResizeDropdown = (widget, deltaW, deltaH) => {
    const wOptions = [3, 4, 6, 8, 12];
    const currentWIdx = wOptions.indexOf(widget.layout?.w || 4);
    let newW = widget.layout?.w || 4;

    if (deltaW > 0 && currentWIdx < wOptions.length - 1) {
      newW = wOptions[currentWIdx + 1];
    } else if (deltaW < 0 && currentWIdx > 0) {
      newW = wOptions[currentWIdx - 1];
    }

    let newH = (widget.layout?.h || 2) + deltaH;
    if (newH < 1) newH = 1;
    if (newH > 12) newH = 12;

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
    <div className="dashboard-grid-container pb-5">
      <style>{`
        .react-grid-item.react-grid-placeholder {
          background: rgba(124, 58, 237, 0.15) !important;
          border: 2px dashed #7c3aed !important;
          border-radius: 16px !important;
          opacity: 0.8 !important;
        }
        .react-resizable-handle {
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .react-resizable-handle:hover {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .react-grid-layout {
            height: auto !important;
          }
          .react-grid-item {
            position: relative !important;
            transform: none !important;
            width: 100% !important;
            margin-bottom: 16px !important;
            top: auto !important;
            left: auto !important;
          }
        }
      `}</style>

      <ReactGridLayout
        className="layout"
        layout={layoutItems}
        cols={12}
        rowHeight={110}
        margin={[20, 20]}
        containerPadding={[0, 0]}
        isDraggable={!searchQuery}
        isResizable={!searchQuery}
        compactType={null}
        preventCollision={true}
        draggableHandle=".cursor-grab"
        onLayoutChange={handleLayoutChange}
      >
        {widgets.map((w) => (
          <div key={String(w.id)} className="h-100">
            <Card className="card-premium h-100 border-0 shadow-premium overflow-hidden hover-shadow bg-white d-flex flex-column">
              {/* Header / Drag Handle */}
              <div
                className={`px-3.5 py-2.5 bg-light d-flex align-items-center justify-content-between border-bottom ${
                  searchQuery ? "" : "cursor-grab"
                }`}
                style={{ userSelect: "none" }}
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
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="p-0 text-muted no-caret">
                      <Settings size={14} />
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="dropdown-premium">
                      <Dropdown.Item onClick={() => onEditWidget(w)} className="small">
                        {isEs ? "Configurar widget" : "Configure widget"}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => handleResizeDropdown(w, 1, 0)} className="small">
                        {isEs ? "Aumentar Ancho" : "Increase Width"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleResizeDropdown(w, -1, 0)} className="small">
                        {isEs ? "Reducir Ancho" : "Reduce Width"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleResizeDropdown(w, 0, 1)} className="small">
                        {isEs ? "Aumentar Alto" : "Increase Height"}
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleResizeDropdown(w, 0, -1)} className="small">
                        {isEs ? "Reducir Alto" : "Reduce Height"}
                      </Dropdown.Item>
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
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}

