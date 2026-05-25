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

/** Estilos del asistente IA (tema claro, alineado con la marca). */
export function useAiAssistantTheme() {
  const { brand } = useBrand();

  return useMemo(() => {
    const accentRaw = brand.accentColor || brand.textColor || "#111827";
    const accent = hexToRgb(accentRaw) ? accentRaw : "#111827";

    const panelBg = "#ffffff";
    const panelFg = "#111827";
    const muted = "#64748b";
    const borderSubtle = "rgba(0,0,0,0.1)";

    const accentLum = luminance(accent);
    const accentVeryLight = accentLum > 0.88;
    const primaryBg = accentVeryLight ? "#111827" : accent;
    const primaryFg = luminance(primaryBg) > 0.55 ? "#111827" : "#ffffff";
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
      accentSoft: withAlphaHex(accent, 0.14),
      accentSoftStrong: withAlphaHex(accent, 0.2),
      accentBorder: withAlphaHex(accent, 0.4),
      tabActiveBg: withAlphaHex(accent, 0.14),
      progressTrack: "#e5e7eb",
      inputBg: "#ffffff",
      inputBorder: borderSubtle,
      cardMutedBg: "#f8fafc",
      chipOutline: borderSubtle,
      panelShadow: "0 22px 70px rgba(0,0,0,0.12)",
      fabShadow: "0 18px 55px rgba(0,0,0,0.15)",
    };
  }, [brand.accentColor, brand.textColor, brand.fontFamily]);
}
