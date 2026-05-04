import React, { useEffect, useMemo, useState } from "react";
import { useAiAssistantTheme } from "./useAiAssistantTheme";
import {
  CALCULATION_OPERATION_OPTIONS,
  CALCULATION_REASON_PRESETS,
  CALCULATION_TOGGLE_OPTIONS,
  GADGET_CONTENT_FOCUS_OPTIONS,
  GADGET_PRESENTATION_OPTIONS,
  GADGET_PURPOSE_OPTIONS,
  buildGadgetIntentPayload,
  normalizeViewPreferences,
  validateGadgetCalculationForAiMessage,
  viewsFromPresentationPreset,
} from "./gadgetViewPreferences";
import { postGadgetAiReport } from "./gadgetReportApi";

const STEP_COUNT = 5;

export default function GadgetConfigWizard({ onReportAdded, onBack }) {
  const t = useAiAssistantTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [gadgetPurpose, setGadgetPurpose] = useState("explore");
  const [contentFocus, setContentFocus] = useState("auto");
  const [presentationPreset, setPresentationPreset] = useState("full");
  const [gadgetViews, setGadgetViews] = useState(() =>
    viewsFromPresentationPreset("full")
  );
  const [calculationToggle, setCalculationToggle] = useState("no");
  const [calculationOperation, setCalculationOperation] = useState("none");
  const [calculationReasonPreset, setCalculationReasonPreset] = useState(
    "explain_in_message"
  );
  const [finalPrompt, setFinalPrompt] = useState("");

  const calculationEnabled = calculationToggle === "yes";

  useEffect(() => {
    setGadgetViews(viewsFromPresentationPreset(presentationPreset));
  }, [presentationPreset]);

  useEffect(() => {
    if (calculationToggle === "no") {
      setCalculationOperation("none");
      setCalculationReasonPreset("explain_in_message");
    }
  }, [calculationToggle]);

  const purposeLabel = useMemo(() => {
    const o = GADGET_PURPOSE_OPTIONS.find((x) => x.value === gadgetPurpose);
    return o?.label || gadgetPurpose;
  }, [gadgetPurpose]);

  const gadgetIntent = useMemo(
    () =>
      buildGadgetIntentPayload({
        purpose: gadgetPurpose,
        contentFocus,
        presentationPreset,
        calculationEnabled,
        calculationOperation,
        calculationReasonPreset,
      }),
    [
      gadgetPurpose,
      contentFocus,
      presentationPreset,
      calculationEnabled,
      calculationOperation,
      calculationReasonPreset,
    ]
  );

  const viewPreferences = useMemo(
    () => normalizeViewPreferences(gadgetViews),
    [gadgetViews]
  );

  const buildQuestion = () => {
    const user = finalPrompt.trim();
    if (user.length < 8) return "";
    return `${user}\n\n(Preferencias ya elegidas en el asistente; propósito: «${purposeLabel}». Respetá gadgetIntent.)`;
  };

  const handleGenerate = async () => {
    setError("");
    const msgErr = validateGadgetCalculationForAiMessage({
      calculationEnabled,
      calculationOperation,
      calculationReasonPreset,
      aiMessageText: finalPrompt,
    });
    if (msgErr) {
      setError(msgErr);
      return;
    }
    const q = buildQuestion();
    if (!q) {
      setError(
        "Escribí un mensaje para la IA (paso 5): qué debe hacer o destacar, como en un chat."
      );
      return;
    }

    try {
      setLoading(true);
      const payload = await postGadgetAiReport({
        question: q,
        viewPreferences,
        gadgetIntent,
      });
      onReportAdded?.({
        question: q,
        report: payload,
        viewPreferences,
        gadgetIntent,
      });
      onBack?.();
    } catch (e) {
      console.error(e?.response?.data || e);
      setError(e?.response?.data?.error || "No se pudo generar el gadget.");
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    setError("");
    setStep((s) => Math.min(s + 1, STEP_COUNT));
  };

  const goPrev = () => {
    setError("");
    if (step <= 1) {
      onBack?.();
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  const btnSecondary = {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${t.chipOutline}`,
    background: t.inputBg,
    color: t.panelFg,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: t.fontFamily,
  };

  const btnPrimary = {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${t.accentBorder}`,
    background: t.primaryBg,
    color: t.primaryFg,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: t.fontFamily,
  };

  const sel = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${t.inputBorder}`,
    fontSize: 13,
    background: t.inputBg,
    color: t.panelFg,
    marginBottom: 4,
    boxSizing: "border-box",
    fontFamily: t.fontFamily,
  };

  const ta = {
    ...sel,
    resize: "vertical",
    minHeight: 120,
  };

  const hint = { fontSize: 12, color: t.muted, marginBottom: 12 };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 12,
        minHeight: 0,
        color: t.panelFg,
        fontFamily: t.fontFamily,
      }}
    >
      <div style={{ flex: "0 0 auto", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 6 }}>
          Paso {step} de {STEP_COUNT}
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 99,
            background: t.progressTrack,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(step / STEP_COUNT) * 100}%`,
              background: t.progressFill,
              transition: "width 0.2s ease",
            }}
          />
        </div>
      </div>

      <div style={{ flex: "1 1 auto", overflowY: "auto", paddingRight: 4 }}>
        {error ? (
          <div style={{ color: "#f87171", marginBottom: 10, fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <>
            <h4 style={{ margin: "0 0 8px", fontSize: 15, color: t.panelFg }}>
              1 · ¿Para qué querés este gadget?
            </h4>
            <p style={hint}>
              Elegí una opción; solo vas a escribir en el último paso, como si le hablaras
              a la IA.
            </p>
            <select
              value={gadgetPurpose}
              onChange={(e) => setGadgetPurpose(e.target.value)}
              style={sel}
            >
              {GADGET_PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h4 style={{ margin: "0 0 8px", fontSize: 15, color: t.panelFg }}>
              2 · ¿Qué datos debe priorizar la IA?
            </h4>
            <p style={hint}>
              No hace falta escribir: la IA usará esta prioridad junto al contexto del
              dashboard.
            </p>
            <select
              value={contentFocus}
              onChange={(e) => setContentFocus(e.target.value)}
              style={sel}
            >
              {GADGET_CONTENT_FOCUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h4 style={{ margin: "0 0 8px", fontSize: 15, color: t.panelFg }}>
              3 · ¿Cómo querés verlo en pantalla?
            </h4>
            <p style={hint}>
              Un solo formato predefinido; la IA arma el contenido para encajar en eso.
            </p>
            <select
              value={presentationPreset}
              onChange={(e) => setPresentationPreset(e.target.value)}
              style={sel}
            >
              {GADGET_PRESENTATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h4 style={{ margin: "0 0 8px", fontSize: 15, color: t.panelFg }}>
              4 · ¿Incluye un cálculo con números?
            </h4>
            <p style={hint}>
              Todo por listas desplegables. Si necesitás sumar / multiplicar / dividir y el
              motivo no está en la lista, elegí «Lo detallo en mi mensaje…» y explicalo en
              el paso 5.
            </p>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
                color: t.panelFg,
              }}
            >
              ¿Aplicar operación sobre valores?
            </label>
            <select
              value={calculationToggle}
              onChange={(e) => setCalculationToggle(e.target.value)}
              style={sel}
            >
              {CALCULATION_TOGGLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {calculationEnabled ? (
              <>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginTop: 12,
                    marginBottom: 6,
                    color: t.panelFg,
                  }}
                >
                  Operación
                </label>
                <select
                  value={calculationOperation}
                  onChange={(e) => setCalculationOperation(e.target.value)}
                  style={sel}
                >
                  {CALCULATION_OPERATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    display: "block",
                    marginTop: 12,
                    marginBottom: 6,
                    color: t.panelFg,
                  }}
                >
                  Para qué es ese cálculo
                </label>
                <select
                  value={calculationReasonPreset}
                  onChange={(e) => setCalculationReasonPreset(e.target.value)}
                  style={sel}
                >
                  {CALCULATION_REASON_PRESETS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </>
        ) : null}

        {step === 5 ? (
          <>
            <h4 style={{ margin: "0 0 8px", fontSize: 15, color: t.panelFg }}>
              5 · Tu mensaje para la IA
            </h4>
            <p style={hint}>
              Acá sí escribís en libre: decile qué querés que haga, qué tone use o qué
              detalle no puede faltar.
            </p>
            <textarea
              value={finalPrompt}
              onChange={(e) => setFinalPrompt(e.target.value)}
              placeholder='Ej.: "Resumime en dos frases lo más urgente y decime si conviene mover turnos del lunes."'
              style={ta}
            />
          </>
        ) : null}
      </div>

      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${t.borderSubtle}`,
        }}
      >
        <button type="button" style={btnSecondary} onClick={goPrev} disabled={loading}>
          {step === 1 ? "← Chat libre" : "← Anterior"}
        </button>
        {step < STEP_COUNT ? (
          <button type="button" style={btnPrimary} onClick={goNext} disabled={loading}>
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            style={btnPrimary}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generando…" : "Generar gadget"}
          </button>
        )}
      </div>
    </div>
  );
}
