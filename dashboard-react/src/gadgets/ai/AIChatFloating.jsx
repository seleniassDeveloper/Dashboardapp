import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import AIChat from "./AIChat";
import { useAiAssistantTheme } from "./useAiAssistantTheme";
import { useTranslation } from "react-i18next";

export default function AIChatFloating({ onAddWidget }) {
  const [open, setOpen] = useState(false);
  const t = useAiAssistantTheme();
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  // Cerrar al presionar Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop / Oscurecimiento de fondo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "#000",
                zIndex: 9998,
                backdropFilter: "blur(2px)",
              }}
            />

            {/* Panel Deslizante Lateral */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              style={{
                position: "fixed",
                right: 0,
                top: 0,
                bottom: 0,
                width: "430px",
                maxWidth: "100vw",
                height: "100vh",
                zIndex: 9999,
                background: "#fff",
                boxShadow: "-5px 0 25px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid #e5e7eb",
              }}
            >
              {/* Cabecera del Panel */}
              <div
                className="px-4 py-3 d-flex align-items-center justify-content-between border-bottom"
                style={{ background: "#f9fafb" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg text-white d-flex align-items-center justify-content-center"
                    style={{ background: t.primaryBg }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h5 className="fw-bold m-0 text-dark" style={{ fontSize: "15px" }}>
                      {isEs ? "Asistente IA Copilot" : "AI Copilot Assistant"}
                    </h5>
                    <span className="text-muted" style={{ fontSize: "11px" }}>
                      {isEs ? "Analíticas y Configuración del Negocio" : "Analytics & Business Configuration"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="link"
                  onClick={() => setOpen(false)}
                  className="p-1 text-muted hover-scale"
                  style={{ textDecoration: "none" }}
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Cuerpo del Chat */}
              <div className="flex-grow-1 overflow-hidden">
                <AIChat onAddWidget={(widget) => {
                  onAddWidget?.(widget);
                  setOpen(false); // Cerrar panel tras agregar
                }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Botón Flotante (FAB) */}
      <Button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 999,
          zIndex: 9997,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          background: t.primaryBg,
          color: t.primaryFg,
          border: `1px solid ${t.accentBorder}`,
          cursor: "pointer",
        }}
        className="hover-scale btn-premium"
        aria-label={isEs ? "Abrir Asistente Copilot" : "Open Copilot Assistant"}
        title={isEs ? "Copilot IA" : "AI Copilot"}
      >
        <Sparkles size={22} className="animate-pulse" />
      </Button>
    </>
  );
}
