import React from "react";
import { Button, Card, Table } from "react-bootstrap";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  CALCULATION_OPERATION_LABELS,
  PURPOSE_LABELS,
  normalizeViewPreferences,
} from "./gadgetViewPreferences";

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

function ChartBlock({ chart, forcedType }) {
  const title = chart?.title || "Gráfico";
  const data = safeArray(chart?.data);
  const kind = (
    forcedType ||
    String(chart?.type || "pie").toLowerCase()
  ).toLowerCase();

  if (data.length === 0) {
    return (
      <div className="text-muted small mb-0">
        Sin puntos para graficar (solo texto / KPIs).
      </div>
    );
  }

  const palette = ["#111827", "#4b5563", "#9ca3af", "#d1d5db", "#e5e7eb"];

  if (kind === "bar") {
    return (
      <div style={{ height: 260 }}>
        <div className="fw-semibold small mb-2">{title}</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={70}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Valor" fill="#111827" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ height: 260 }}>
      <div className="fw-semibold small mb-2">{title}</div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={palette[i % palette.length]}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartDataTable({ chart }) {
  const title = chart?.title || "Datos";
  const rows = safeArray(chart?.data);

  if (rows.length === 0) {
    return (
      <div className="text-muted small mb-0">
        Sin filas para la tabla de métricas.
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <div className="fw-semibold small mb-2">{title}</div>
      <Table size="sm" bordered hover className="mb-0 small">
        <thead className="table-light">
          <tr>
            <th>Concepto</th>
            <th className="text-end">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{String(row.name ?? "")}</td>
              <td className="text-end">{Number(row.value ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default function DynamicAIGadget({
  question,
  report,
  mirrorSlots,
  viewPreferences,
  gadgetIntent,
  onRemove,
}) {
  const views = normalizeViewPreferences(viewPreferences);
  const intent = gadgetIntent && typeof gadgetIntent === "object" ? gadgetIntent : null;

  const cf = intent?.contentFocus ?? "auto";
  const pp = intent?.presentationPreset ?? "full";
  const showIntentConfig =
    intent &&
    (intent.calculation ||
      (intent.purpose && intent.purpose !== "explore") ||
      cf !== "auto" ||
      pp !== "full");

  const mirrorKey =
    report?.mirrorGadget && report.mirrorGadget !== "none"
      ? report.mirrorGadget
      : null;
  const mirrored =
    views.mirrorEmbedded && mirrorKey && mirrorSlots?.[mirrorKey];

  const chartData = safeArray(report?.chart?.data);
  const showAnyChart =
    chartData.length > 0 &&
    (views.chartPie || views.chartBar || views.chartTable);

  return (
    <Card className="shadow-sm brand-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <div style={{ minWidth: 0 }}>
            <div className="text-muted small mb-1">Gadget desde IA</div>
            <div className="fw-semibold" style={{ fontSize: 15 }}>
              {question || report?.summary?.slice(0, 120) || "Gadget IA"}
            </div>
          </div>
          <Button variant="outline-secondary" size="sm" onClick={onRemove}>
            Quitar
          </Button>
        </div>

        {showIntentConfig ? (
          <div
            className="small text-muted mb-3 p-2 rounded-2 border"
            style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
          >
            <div className="fw-semibold text-secondary mb-1">
              Configuración del gadget
            </div>
            <div>
              <span className="text-muted">Tipo: </span>
              {PURPOSE_LABELS[intent.purpose] || intent.purpose || "—"}
            </div>
            {intent.whatShouldShow ? (
              <div className="mt-1">
                <span className="text-muted">Qué mostrar: </span>
                {intent.whatShouldShow}
              </div>
            ) : null}
            {intent.howToVisualize ? (
              <div className="mt-1">
                <span className="text-muted">Cómo verlo: </span>
                {intent.howToVisualize}
              </div>
            ) : null}
            {intent.calculation ? (
              <div className="mt-2 pt-2 border-top border-light-subtle">
                <span className="text-muted">Cálculo pedido: </span>
                {CALCULATION_OPERATION_LABELS[intent.calculation.operation] ||
                  intent.calculation.operation}
                {intent.calculation.reasonPreset === "explain_in_message" ? (
                  <span> — motivo detallado en tu mensaje a la IA</span>
                ) : intent.calculation.whyThisOperation ? (
                  <>
                    {" "}
                    — <em>{intent.calculation.whyThisOperation}</em>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {mirrored ? (
          <div className="mb-4 pb-4 border-bottom">
            <div className="fw-semibold small mb-2 text-muted">
              Vista del dashboard que pediste
            </div>
            {mirrored}
          </div>
        ) : null}

        {views.summary && report?.summary ? (
          <>
            <div className="fw-semibold mb-2">Análisis y consejos</div>
            <p className="text-muted small mb-3 mb-md-4">{report.summary}</p>
          </>
        ) : null}

        {(views.insights || views.actions) && (
          <div className="row g-3 mb-3 mb-md-4">
            {views.insights ? (
              <div className={views.actions ? "col-md-6" : "col-12"}>
                <div className="fw-semibold small mb-2">Insights</div>
                <ul className="small mb-0">
                  {safeArray(report?.insights).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {views.actions ? (
              <div className={views.insights ? "col-md-6" : "col-12"}>
                <div className="fw-semibold small mb-2">Acciones recomendadas</div>
                <ul className="small mb-0">
                  {safeArray(report?.actions).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {views.kpis ? (
          <div className="mt-2">
            <div className="fw-semibold small mb-2">KPIs</div>
            <div className="row g-2">
              {safeArray(report?.kpis).map((kpi, i) => (
                <div className="col-6 col-lg-4" key={i}>
                  <div
                    className="p-2 rounded-3 border bg-white"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {kpi.label}
                    </div>
                    <div className="fw-bold">{kpi.value}</div>
                    <div className="text-muted small">{kpi.delta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {report?.chart && showAnyChart ? (
          <div className="mt-4 pt-3 border-top">
            <div className="fw-semibold small mb-3 text-muted">
              Métricas visualizadas
            </div>
            <div className="d-grid gap-4">
              {views.chartPie ? (
                <ChartBlock chart={report.chart} forcedType="pie" />
              ) : null}
              {views.chartBar ? (
                <ChartBlock chart={report.chart} forcedType="bar" />
              ) : null}
              {views.chartTable ? (
                <ChartDataTable chart={report.chart} />
              ) : null}
            </div>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
