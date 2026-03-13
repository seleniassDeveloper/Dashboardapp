import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import AIChat from "./AIChat";

export default function AIChatFloating() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {open ? (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 86,
            width: 390,
            maxWidth: "92vw",
            height: 560,
            maxHeight: "75vh",
            zIndex: 9999,
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 22px 70px rgba(0,0,0,0.20)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              background: "#fff",
              flex: "0 0 auto",
            }}
          >
            <div style={{ fontWeight: 700 }}>Chat IA</div>

            <button
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
              }}
              aria-label="Cerrar"
              title="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Contenido: el chat ocupa TODO */}
          <div style={{ flex: "1 1 auto", minHeight: 0 }}>
            <AIChat embedded />
          </div>
        </div>
      ) : null}

      {/* Botón flotante */}
      <Button
        variant="dark"
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
          boxShadow: "0 18px 55px rgba(0,0,0,0.22)",
        }}
        aria-label="Abrir chat IA"
        title="Chat IA"
      >
        AI
      </Button>
    </>
  );
}