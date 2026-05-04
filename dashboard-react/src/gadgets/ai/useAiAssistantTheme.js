import { useMemo } from "react";
import { useBrand } from "../../header/name/BrandProvider.jsx";

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const lin = [rgb.r, rgb.g, rgb.b].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function withAlphaHex(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(17,24,39,${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

/**
 * Estilos del asistente IA alineados con la marca del header (accent, modo oscuro, fuente).
 */
export function useAiAssistantTheme() {
  const { brand } = useBrand();

  return useMemo(() => {
    const accentRaw = brand.accentColor || brand.textColor || "#111827";
    const accent = hexToRgb(accentRaw) ? accentRaw : "#111827";
    const darkPanel = Boolean(brand.darkMode);

    const panelBg = darkPanel ? "#0f172a" : "#ffffff";
    const panelFg = darkPanel ? "#f1f5f9" : "#111827";
    const muted = darkPanel ? "#94a3b8" : "#64748b";
    const borderSubtle = darkPanel ? "rgba(148,163,184,0.25)" : "rgba(0,0,0,0.1)";

    const accentLum = luminance(accent);
    const accentVeryLight = accentLum > 0.88;
    /** Botón principal: si el acento es casi blanco sobre panel claro, usar relleno oscuro con borde acento */
    const primaryBg =
      accentVeryLight && !darkPanel ? "#111827"
      : accentVeryLight && darkPanel ? "#e2e8f0"
      : accent;
    const primaryFg =
      luminance(primaryBg) > 0.55 ? "#111827" : "#ffffff";

    const progressFill = accentVeryLight ? primaryBg : accent;

    return {
      fontFamily: brand.fontFamily || undefined,
      accent,
      panelBg,
      panelFg,
      muted,
      borderSubtle,
      primaryBg,
      primaryFg,
      progressFill,
      accentSoft: withAlphaHex(accent, darkPanel ? 0.2 : 0.14),
      accentSoftStrong: withAlphaHex(accent, darkPanel ? 0.28 : 0.2),
      accentBorder: withAlphaHex(accent, darkPanel ? 0.5 : 0.4),
      tabActiveBg: withAlphaHex(accent, darkPanel ? 0.22 : 0.14),
      progressTrack: darkPanel ? "rgba(148,163,184,0.22)" : "#e5e7eb",
      inputBg: darkPanel ? "rgba(15,23,42,0.65)" : "#ffffff",
      inputBorder: darkPanel ? "rgba(148,163,184,0.35)" : borderSubtle,
      cardMutedBg: darkPanel ? "rgba(30,41,59,0.55)" : "#f8fafc",
      chipOutline: darkPanel ? "rgba(148,163,184,0.4)" : borderSubtle,
      panelShadow: darkPanel ?
          "0 22px 55px rgba(0,0,0,0.55)"
        : "0 22px 70px rgba(0,0,0,0.20)",
      fabShadow: darkPanel ?
          "0 18px 45px rgba(0,0,0,0.45)"
        : "0 18px 55px rgba(0,0,0,0.22)",
    };
  }, [
    brand.accentColor,
    brand.textColor,
    brand.darkMode,
    brand.fontFamily,
  ]);
}
