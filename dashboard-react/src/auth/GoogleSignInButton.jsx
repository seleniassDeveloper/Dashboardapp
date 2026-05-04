import React, { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let gsiLoadPromise = null;

function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;
  gsiLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(s);
  });
  return gsiLoadPromise;
}

/**
 * Botón oficial de Google Identity Services.
 * Configurá VITE_GOOGLE_CLIENT_ID (mismo ID que GOOGLE_CLIENT_ID en el backend).
 */
export default function GoogleSignInButton({ onCredential, disabled }) {
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !containerRef.current) return;
        const el = containerRef.current;
        el.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) onCredentialRef.current(response.credential);
          },
        });
        window.google.accounts.id.renderButton(el, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(Math.max(el.offsetWidth || 360, 280), 400),
          locale: "es",
        });
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.textContent = "No se pudo cargar el botón de Google.";
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-muted small mb-0 text-center">
        Para usar Google, agregá <code className="small">VITE_GOOGLE_CLIENT_ID</code> en{" "}
        <code className="small">dashboard-react/.env</code> (mismo Client ID que en el backend).
      </p>
    );
  }

  return (
    <div className="w-100">
      <div
        ref={containerRef}
        className="d-flex justify-content-center w-100"
        style={{ minHeight: 44, opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? "none" : "auto" }}
      />
    </div>
  );
}
