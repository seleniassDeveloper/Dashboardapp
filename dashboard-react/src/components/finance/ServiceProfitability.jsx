import React from "react";
import { Card, Table, Badge, ProgressBar } from "react-bootstrap";
import { Scissors } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ServiceProfitability({ serviceStats = [] }) {
  return (
    <Card className="card-premium border-0 shadow-sm bg-white">
      <Card.Body className="p-4">
        <h3 className="h6 fw-black text-gray-900 mb-1 d-flex align-items-center gap-2">
          <Scissors className="text-purple-600" size={20} />
          <span>Matriz de Rentabilidad de Servicios y Tratamientos</span>
        </h3>
        <p className="text-muted smaller mb-4">Analizá el margen neto porcentual real de cada tratamiento deduciendo comisiones de estilistas (40%) e insumos utilizados (22% estimado).</p>

        {serviceStats.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
            No hay citas realizadas hoy para estimar rentabilidades de servicios.
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px" }}>
                  <th className="ps-3">Tratamiento</th>
                  <th>Precio de Lista</th>
                  <th>Costo Insumos (22%)</th>
                  <th>Comisión (40%)</th>
                  <th>Ocupación Citas</th>
                  <th>Margen Neto %</th>
                  <th>Facturado Acumulado</th>
                  <th className="pe-3 text-end">Ganancia Neta Total</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {serviceStats.map((s) => (
                  <tr key={s.id}>
                    <td className="ps-3 fw-bold text-gray-900">{s.name}</td>
                    <td className="text-gray-800">{currency(s.price)}</td>
                    <td className="text-red-500">{currency(s.productCost)}</td>
                    <td className="text-gray-600">{currency(s.commission)}</td>
                    <td className="fw-semibold text-gray-700 text-center">{s.count} turnos</td>
                    <td>
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: "100px" }}>
                        <span className="fw-bold text-purple-700" style={{ fontSize: "12px" }}>{s.marginPercent}%</span>
                        <ProgressBar 
                          now={s.marginPercent} 
                          variant="purple" 
                          className="flex-grow-1 rounded-pill" 
                          style={{ height: "6px" }} 
                        />
                      </div>
                    </td>
                    <td className="fw-semibold text-gray-800">{currency(s.totalRevenue)}</td>
                    <td className="pe-3 text-end fw-black text-emerald-600" style={{ fontSize: "14px" }}>
                      {currency(s.totalNetProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
