import React from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Formato de moneda ARS
function currency(n, isEs) {
  return new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
    style: "currency",
    currency: isEs ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// Opacidad de color HEX
function withAlpha(hex, alpha = 1) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function RevenueWidget({
  title = "Facturación",
  chartType = "bar", // "bar" | "line" | "area" | "pie"
  metric = "revenue", // "revenue" | "appointments" | ...
  chartData = [],
  color = "#10b981",
}) {
  const { i18n } = useTranslation("dashboard");
  const isEs = i18n.language === "es";

  if (!chartData || chartData.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted small p-4" style={{ minHeight: "180px" }}>
        <AlertCircle size={24} className="mb-2 text-muted" />
        <span>{isEs ? "Sin datos para graficar en el rango seleccionado" : "No data to display in the selected range"}</span>
      </div>
    );
  }

  const fill = withAlpha(color, 0.12);
  const stroke = color;

  return (
    <div className="h-100 w-100 d-flex flex-column" style={{ minHeight: "200px" }}>
      <div className="flex-grow-1 w-100">
        <ResponsiveContainer width="100%" height="90%">
          {chartType === "bar" ? (
            <BarChart data={chartData} margin={{ left: -10, right: 10, bottom: 0, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                formatter={(value) => [metric === "revenue" ? currency(value, isEs) : value, isEs ? "Total" : "Total"]}
              />
              <Bar dataKey="value" fill={stroke} radius={[4, 4, 0, 0]} maxBarSize={45} />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData} margin={{ left: -10, right: 10, bottom: 0, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                formatter={(value) => [metric === "revenue" ? currency(value, isEs) : value, isEs ? "Total" : "Total"]}
              />
              <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: stroke, strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={chartData} margin={{ left: -10, right: 10, bottom: 0, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                formatter={(value) => [metric === "revenue" ? currency(value, isEs) : value, isEs ? "Total" : "Total"]}
              />
              <Area type="monotone" dataKey="value" stroke={stroke} fill={fill} strokeWidth={2.5} />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={55}
                label={({ name, percent }) => `${name.slice(0, 10)} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                style={{ fontSize: "9px", fontWeight: "600" }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={withAlpha(stroke, 0.3 + (index % 4) * 0.22)} stroke={stroke} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                formatter={(value) => [metric === "revenue" ? currency(value, isEs) : value, isEs ? "Total" : "Total"]}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
