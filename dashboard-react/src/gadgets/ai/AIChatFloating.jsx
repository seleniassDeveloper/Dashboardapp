import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import AIChat from "./AIChat";
import GadgetConfigWizard from "./GadgetConfigWizard";
import { useAiAssistantTheme } from "./useAiAssistantTheme";

export default function AIChatFloating({ onReportAdded }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("chat");
  const t = useAiAssistantTheme();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setMode("chat");
  }, [open]);

  const headerTitle =
    mode === "wizard" ? "Asistente de gadgets" : "Chat IA";

  const tabBtn = (active) => ({
    flex: 1,
    padding: "8px 6px",
    border: "none",
    borderRadius: 8,
    background: active ? t.tabActiveBg : "transparent",
    fontWeight: active ? 700 : 500,
    fontSize: 12,
    cursor: "pointer",
    color: t.panelFg,
  });

  return (
    <>
      {open ? (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 86,
            width: 400,
            maxWidth: "94vw",
            height: 620,
            maxHeight: "88vh",
            zIndex: 9999,
            borderRadius: 16,
            overflow: "hidden",
            background: t.panelBg,
            border: `1px solid ${t.borderSubtle}`,
            boxShadow: t.panelShadow,
            display: "flex",
            flexDirection: "column",
            color: t.panelFg,
            fontFamily: t.fontFamily,
          }}
        >
          <div
            style={{
              flex: "0 0 auto",
              borderBottom: `1px solid ${t.borderSubtle}`,
              background: t.panelBg,
            }}
          >
            <div
              style={{
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 10px",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15 }}>{headerTitle}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: t.panelFg,
                }}
                aria-label="Cerrar"
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "0 10px 10px",
              }}
            >
              <button
                type="button"
                style={tabBtn(mode === "chat")}
                onClick={() => setMode("chat")}
              >
                Chat libre
              </button>
              <button
                type="button"
                style={tabBtn(mode === "wizard")}
                onClick={() => setMode("wizard")}
              >
                Configurar gadget · paso a paso
              </button>
            </div>
          </div>

          <div style={{ flex: "1 1 auto", minHeight: 0, background: t.panelBg }}>
            {mode === "chat" ? (
              <AIChat embedded onReportAdded={onReportAdded} />
            ) : (
              <GadgetConfigWizard
                onReportAdded={onReportAdded}
                onBack={() => setMode("chat")}
              />
            )}
          </div>
        </div>
      ) : null}

      <Button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          width: 56,
          height: 56,
          borderRadius: 999,
          zIndex: 9999,
          display: "grid",
          placeItems: "center",
          boxShadow: t.fabShadow,
          background: t.primaryBg,
          color: t.primaryFg,
          border: `1px solid ${t.accentBorder}`,
          fontFamily: t.fontFamily,
          fontWeight: 700,
        }}
        aria-label="Abrir chat IA"
        title="Chat IA"
      >
        AI
      </Button>
    </>
  );
}
