import React, { useMemo, useState } from "react";
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
import { useAiAssistantTheme } from "./useAiAssistantTheme";

export default function AIChat({ embedded = false, onReportAdded }) {
  void embedded;
  const t = useAiAssistantTheme();

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [gadgetViewsPanelOpen, setGadgetViewsPanelOpen] = useState(false);

  const [gadgetPurpose, setGadgetPurpose] = useState("explore");
  const [contentFocus, setContentFocus] = useState("auto");
  const [presentationPreset, setPresentationPreset] = useState("full");
  const [calculationToggle, setCalculationToggle] = useState("no");
  const [calculationOperation, setCalculationOperation] = useState("none");
  const [calculationReasonPreset, setCalculationReasonPreset] = useState(
    "explain_in_message"
  );

  const calculationEnabled = calculationToggle === "yes";

  const selectGadgetStyle = useMemo(
    () => ({
      width: "100%",
      padding: "8px 10px",
      borderRadius: 10,
      border: `1px solid ${t.inputBorder}`,
      marginBottom: 10,
      fontSize: 13,
      background: t.inputBg,
      color: t.panelFg,
      boxSizing: "border-box",
    }),
    [t]
  );

  const chipBtn = (active) => ({
    border: `1px solid ${active ? t.accentBorder : t.chipOutline}`,
    background: active ? t.tabActiveBg : t.inputBg,
    color: t.panelFg,
    borderRadius: 999,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: active ? 700 : 400,
    fontSize: 13,
    fontFamily: t.fontFamily,
  });

  const cardDyn = useMemo(
    () => ({
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      background: t.cardMutedBg,
      color: t.panelFg,
    }),
    [t]
  );

  const kpiCardDyn = useMemo(
    () => ({
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 10,
      padding: 10,
      background: t.inputBg,
      color: t.panelFg,
    }),
    [t]
  );

  const viewPreferences = useMemo(
    () =>
      normalizeViewPreferences(viewsFromPresentationPreset(presentationPreset)),
    [presentationPreset]
  );

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

  const sendPreset = async (preset) => {
    setQuestion(preset);
    await handleSend(preset);
  };

  const handleSend = async (customQuestion) => {
    const q = (customQuestion ?? question).trim();
    if (!q) return;

    const calcErr = validateGadgetCalculationForAiMessage({
      calculationEnabled,
      calculationOperation,
      calculationReasonPreset,
      aiMessageText: q,
    });
    if (calcErr) {
      setError(calcErr);
      return;
    }

    try {
      setLoading(true);
      setError("");

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
      setReport(payload);
    } catch (e) {
      console.error("AI chat error:", e?.response?.data || e);
      setError(e?.response?.data?.error || "No se pudo generar el reporte.");
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 12,
        color: t.panelFg,
        fontFamily: t.fontFamily,
      }}
    >
      <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() => setGadgetViewsPanelOpen((v) => !v)}
          style={chipBtn(gadgetViewsPanelOpen)}
        >
          Opciones del gadget (listas)
        </button>
        <button type="button" onClick={() => sendPreset("Analiza mis ingresos")} style={chipBtn(false)}>
          Analiza mis ingresos
        </button>
        <button type="button" onClick={() => sendPreset("Detecta problemas operativos")} style={chipBtn(false)}>
          Detecta problemas operativos
        </button>
        <button type="button" onClick={() => sendPreset("Dame decisiones para esta semana")} style={chipBtn(false)}>
          Decisiones semanales
        </button>
        <button
          type="button"
          onClick={() =>
            sendPreset(
              "Quiero ver la lista de citas como en mi dashboard y consejos sobre cancelaciones."
            )
          }
          style={chipBtn(false)}
        >
          Lista + consejos
        </button>
      </div>

      {gadgetViewsPanelOpen ? (
        <div
          style={{
            border: `1px solid ${t.accentBorder}`,
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            background: t.cardMutedBg,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
            Configuración rápida (solo listas)
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>
            Elegí todo con menús desplegables. Abajo escribís solo lo que querés que haga la
            IA. ¿Más guiado? Usá{" "}
            <strong style={{ color: t.panelFg }}>Configurar gadget · paso a paso</strong>{" "}
            arriba.
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Para qué es el gadget
          </label>
          <select
            value={gadgetPurpose}
            onChange={(e) => setGadgetPurpose(e.target.value)}
            style={selectGadgetStyle}
          >
            {GADGET_PURPOSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Qué datos priorizar
          </label>
          <select
            value={contentFocus}
            onChange={(e) => setContentFocus(e.target.value)}
            style={selectGadgetStyle}
          >
            {GADGET_CONTENT_FOCUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Cómo presentarlo
          </label>
          <select
            value={presentationPreset}
            onChange={(e) => setPresentationPreset(e.target.value)}
            style={selectGadgetStyle}
          >
            {GADGET_PRESENTATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${t.borderSubtle}`,
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
              Cálculo con números
            </label>
            <select
              value={calculationToggle}
              onChange={(e) => {
                const v = e.target.value;
                setCalculationToggle(v);
                if (v === "no") {
                  setCalculationOperation("none");
                  setCalculationReasonPreset("explain_in_message");
                }
              }}
              style={selectGadgetStyle}
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
                  style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}
                >
                  Operación
                </label>
                <select
                  value={calculationOperation}
                  onChange={(e) => setCalculationOperation(e.target.value)}
                  style={selectGadgetStyle}
                >
                  {CALCULATION_OPERATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <label
                  style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}
                >
                  Para qué es el cálculo
                </label>
                <select
                  value={calculationReasonPreset}
                  onChange={(e) => setCalculationReasonPreset(e.target.value)}
                  style={{ ...selectGadgetStyle, marginBottom: 0 }}
                >
                  {CALCULATION_REASON_PRESETS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {calculationOperation !== "none" &&
                calculationReasonPreset === "explain_in_message" ? (
                  <div style={{ fontSize: 11, color: t.muted, marginTop: 8 }}>
                    Contá el motivo del cálculo en tu mensaje para la IA (abajo).
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <div style={{ flex: 1, overflow: "auto", paddingRight: 4 }}>
        {error ? (
          <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>
        ) : null}

        {!report && !loading ? (
          <div style={{ color: t.muted, fontSize: 13 }}>
            <div style={{ marginBottom: 8 }}>Habiale a la IA en el campo de abajo.</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>¿Qué servicio genera más ingresos?</li>
              <li>¿Qué trabajador está más cargado?</li>
              <li>¿Qué decisiones debería tomar esta semana?</li>
            </ul>
          </div>
        ) : null}

        {loading ? <div style={{ color: t.muted }}>Generando reporte...</div> : null}

        {report ? (
          onReportAdded ? (
            <div style={cardDyn}>
              <h4 style={{ marginTop: 0 }}>Listo</h4>
              <p style={{ marginBottom: 8 }}>{report.summary}</p>
              <div style={{ fontSize: 13, color: t.muted }}>
                Se agregó un bloque nuevo debajo del dashboard con el detalle completo,
                gráfico y acciones.
              </div>
            </div>
          ) : (
            <div>
              <section style={cardDyn}>
                <h4 style={{ marginTop: 0 }}>Resumen</h4>
                <p style={{ marginBottom: 0 }}>{report.summary}</p>
              </section>

              <section style={cardDyn}>
                <h4 style={{ marginTop: 0 }}>Insights</h4>
                <ul>
                  {(report.insights || []).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </section>

              <section style={cardDyn}>
                <h4 style={{ marginTop: 0 }}>KPIs</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  {(report.kpis || []).map((kpi, i) => (
                    <div key={i} style={kpiCardDyn}>
                      <strong>{kpi.label}</strong>
                      <div>{kpi.value}</div>
                      <small style={{ color: t.muted }}>{kpi.delta}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section style={cardDyn}>
                <h4 style={{ marginTop: 0 }}>{report.chart?.title || "Gráfico"}</h4>
                {(report.chart?.data || []).length === 0 ? (
                  <div style={{ color: t.muted }}>Sin datos para graficar.</div>
                ) : (
                  <ul>
                    {report.chart.data.map((item, i) => (
                      <li key={i}>
                        {item.name}: {item.value}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section style={cardDyn}>
                <h4 style={{ marginTop: 0 }}>Acciones recomendadas</h4>
                <ul>
                  {(report.actions || []).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </section>
            </div>
          )
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Escribí lo que querés que haga la IA (tono, foco, preguntas)…"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: `1px solid ${t.inputBorder}`,
            fontSize: 14,
            background: t.inputBg,
            color: t.panelFg,
            fontFamily: t.fontFamily,
          }}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!question.trim() || loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${t.accentBorder}`,
            background: t.primaryBg,
            color: t.primaryFg,
            cursor: question.trim() && !loading ? "pointer" : "not-allowed",
            opacity: !question.trim() || loading ? 0.55 : 1,
            fontFamily: t.fontFamily,
            fontWeight: 600,
          }}
        >
          {loading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
