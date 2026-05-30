import React, { useMemo, useState } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import { Sparkles, MessageSquare, Plus, HelpCircle, ChevronRight } from "lucide-react";
import { postGadgetAiReport } from "./gadgetReportApi";
import { useAiAssistantTheme } from "./useAiAssistantTheme";
import { useTranslation } from "react-i18next";

const PRESET_PROMPTS_ES = [
  "Analiza mis ingresos de este mes",
  "¿Cuáles son mis profesionales con más citas?",
  "Agrega un gráfico de torta con citas por servicio",
  "Genera un KPI con la tasa de cancelaciones",
];

const PRESET_PROMPTS_EN = [
  "Analyze my income for this month",
  "Who are my professionals with the most appointments?",
  "Add a pie chart with appointments by service",
  "Generate a KPI with the cancellation rate",
];

export default function AIChat({ onAddWidget }) {
  const t = useAiAssistantTheme();
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";
  const presetPrompts = isEs ? PRESET_PROMPTS_ES : PRESET_PROMPTS_EN;

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [suggestedWidget, setSuggestedWidget] = useState(null);
  const [error, setError] = useState("");

  const handleSend = async (queryText) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setError("");
    setLoading(true);
    setSuggestedWidget(null);

    // Agregar mensaje del usuario al historial
    const userMsg = { role: "user", content: q };
    setChatHistory((prev) => [...prev, userMsg]);

    try {
      const payload = await postGadgetAiReport({
        question: q,
        viewPreferences: {
          showSummary: true,
          showInsights: true,
          showKpis: true,
          showChart: true,
          showActions: true,
        },
      });

      // Agregar respuesta de la IA al historial
      const aiMsg = {
        role: "assistant",
        content: payload.summary,
        insights: payload.insights || [],
        kpis: payload.kpis || [],
        chart: payload.chart || null,
        actions: payload.actions || [],
      };

      setChatHistory((prev) => [...prev, aiMsg]);

      // Si la IA sugiere crear un widget, guardarlo en el estado sugerido
      if (payload.widgetToCreate) {
        setSuggestedWidget(payload.widgetToCreate);
      }
    } catch (e) {
      console.error("Error en chat IA:", e);
      setError(e?.response?.data?.error || (isEs ? "No se pudo conectar con el agente IA." : "Could not connect to the AI agent."));
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  const cardStyle = useMemo(
    () => ({
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      background: t.cardMutedBg,
      color: t.panelFg,
    }),
    [t]
  );

  return (
    <div className="d-flex flex-column h-100" style={{ fontFamily: t.fontFamily, color: t.panelFg }}>
      {/* Historial de Chat */}
      <div className="flex-grow-1 overflow-auto px-3 py-2" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {chatHistory.length === 0 ? (
          <div className="text-muted text-center py-5">
            <Sparkles size={36} className="text-primary mb-3" />
            <h5 className="fw-bold text-dark mb-2">{isEs ? "Asistente Inteligente" : "Intelligent Assistant"}</h5>
            <p className="small mb-4" style={{ padding: "0 20px" }}>
              {isEs 
                ? "Preguntame sobre ingresos, ocupación de agendas o pedime que configure widgets en tu pantalla."
                : "Ask me about revenue, calendar occupancy, or ask me to configure widgets on your screen."}
            </p>
            <div className="d-grid gap-2 px-3">
              {presetPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  className="btn btn-outline-secondary btn-sm text-start d-flex align-items-center justify-content-between rounded-pill py-2 px-3 hover-scale"
                  style={{ fontSize: "12px" }}
                >
                  <span>{p}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-3">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`d-flex flex-column ${
                  msg.role === "user" ? "align-items-end" : "align-items-start"
                }`}
              >
                <div
                  className={`p-3 rounded-4 shadow-sm ${
                    msg.role === "user"
                      ? "bg-dark text-white rounded-br-none"
                      : "bg-light text-dark rounded-bl-none border"
                  }`}
                  style={{ maxWidth: "85%", fontSize: "13px" }}
                >
                  <div className="fw-semibold small mb-1 opacity-75">
                    {msg.role === "user" ? (isEs ? "Tú" : "You") : "Aura Copilot"}
                  </div>
                  <div>{msg.content}</div>

                  {/* Renderizado de KPIs sugeridos por la IA */}
                  {msg.role === "assistant" && msg.kpis.length > 0 && (
                    <div className="row g-2 mt-2">
                      {msg.kpis.map((kpi, kIdx) => (
                        <div className="col-6" key={kIdx}>
                          <div className="p-2 border rounded bg-white text-dark">
                            <span className="text-muted d-block" style={{ fontSize: "9px" }}>
                              {kpi.label}
                            </span>
                            <strong style={{ fontSize: "13px" }}>{kpi.value}</strong>
                            {kpi.delta && <span className="text-success ms-1" style={{ fontSize: "9px" }}>{kpi.delta}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Insights */}
                  {msg.role === "assistant" && msg.insights.length > 0 && (
                    <div className="mt-3 border-top pt-2" style={{ fontSize: "11px" }}>
                      <div className="fw-bold mb-1">{isEs ? "Análisis clave:" : "Key analysis:"}</div>
                      <ul className="ps-3 mb-0">
                        {msg.insights.map((ins, iIdx) => (
                          <li key={iIdx} className="mb-1">{ins}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Acciones */}
                  {msg.role === "assistant" && msg.actions.length > 0 && (
                    <div className="mt-2 border-top pt-2" style={{ fontSize: "11px" }}>
                      <div className="fw-bold text-success mb-1">{isEs ? "Acciones sugeridas:" : "Suggested actions:"}</div>
                      <ul className="ps-3 mb-0">
                        {msg.actions.map((act, aIdx) => (
                          <li key={aIdx} className="mb-1">{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="d-flex align-items-center gap-2 text-muted px-3 small py-2">
            <Spinner animation="border" size="sm" />
            <span>{isEs ? "Aura está analizando los datos..." : "Aura is analyzing the data..."}</span>
          </div>
        )}

        {error && <Alert variant="danger" className="mx-3 mt-2 py-2 small">{error}</Alert>}

        {/* Sugerencia de Widget */}
        {suggestedWidget && (
          <div className="mx-3 p-3 border rounded-3 bg-light shadow-sm" style={{ borderLeft: `4px solid ${t.accentBorder || "#10b981"}` }}>
            <div className="fw-bold small text-success d-flex align-items-center gap-1 mb-1">
              <Sparkles size={14} /> {isEs ? "¿Añadir Widget al Dashboard?" : "Add Widget to Dashboard?"}
            </div>
            <div className="small text-muted mb-3">
              {isEs 
                ? `La IA configuró un widget de tipo ${suggestedWidget.type === "chart" ? `Gráfico (${suggestedWidget.config?.chartType})` : suggestedWidget.type} llamado "${suggestedWidget.title}" para monitorear esta métrica.`
                : `The AI configured a ${suggestedWidget.type === "chart" ? `Chart (${suggestedWidget.config?.chartType})` : suggestedWidget.type} widget named "${suggestedWidget.title}" to monitor this metric.`}
            </div>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="dark"
                className="btn-premium rounded-pill px-3"
                onClick={() => {
                  onAddWidget?.(suggestedWidget);
                  setSuggestedWidget(null);
                }}
              >
                {isEs ? "Aceptar y Agregar" : "Accept and Add"}
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                className="rounded-pill px-3"
                onClick={() => setSuggestedWidget(null)}
              >
                {isEs ? "Descartar" : "Discard"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input de Chat */}
      <div className="p-3 border-top bg-white">
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="d-flex gap-2"
        >
          <Form.Control
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={isEs ? "Preguntame algo o pedime agregar un widget..." : "Ask me something or request to add a widget..."}
            disabled={loading}
            className="rounded-pill"
            style={{ fontSize: "13px" }}
          />
          <Button
            type="submit"
            disabled={loading || !question.trim()}
            variant="dark"
            className="btn-premium rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: "36px", height: "36px" }}
          >
            <MessageSquare size={16} />
          </Button>
        </Form>
      </div>
    </div>
  );
}
