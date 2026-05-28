import React from "react";
import { Card, Row, Col, Table, Badge, ProgressBar } from "react-bootstrap";
import { Award, Heart, Percent, TrendingUp } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ProfessionalProfitability({ professionalStats = [] }) {
  return (
    <Card className="card-premium border-0 shadow-sm bg-white">
      <Card.Body className="p-4">
        <h3 className="h6 fw-black text-gray-900 mb-1 d-flex align-items-center gap-2">
          <Award className="text-purple-600 animate-pulse" size={20} />
          <span>Ranking de Productividad & Retención de Estilistas</span>
        </h3>
        <p className="text-muted smaller mb-4">Medición de la tasa de ocupación activa, ticket de reventa promedio e índice de retención de clientes reales de cada colaborador.</p>

        {professionalStats.length === 0 ? (
          <div className="text-center py-5 text-muted small bg-gray-50 rounded-xl border">
            No hay liquidaciones o turnos activos para estimar productividad.
          </div>
        ) : (
          <Row className="g-4">
            {/* Tabla General de Productividad */}
            <Col lg={8}>
              <div className="table-responsive">
                <Table hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="table-header-small" style={{ fontSize: "11px" }}>
                      <th className="ps-3">Estilista</th>
                      <th>Rol</th>
                      <th className="text-center">Turnos DONE</th>
                      <th>Ocupación %</th>
                      <th>Retención</th>
                      <th>Ticket Promedio</th>
                      <th className="pe-3 text-end">Ganancia Generada</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13px" }}>
                    {professionalStats.map((p) => (
                      <tr key={p.id}>
                        <td className="ps-3 fw-bold text-gray-900">{p.name}</td>
                        <td>
                          <Badge bg="light" className="text-secondary border rounded-pill px-2.5 py-1">{p.role}</Badge>
                        </td>
                        <td className="fw-semibold text-gray-800 text-center">{p.count} citas</td>
                        <td>
                          <div className="d-flex align-items-center gap-2" style={{ minWidth: "90px" }}>
                            <span className="fw-bold text-purple-700" style={{ fontSize: "12px" }}>{p.occupancy}%</span>
                            <ProgressBar 
                              now={p.occupancy} 
                              variant="purple" 
                              className="flex-grow-1 rounded-pill" 
                              style={{ height: "6px" }} 
                            />
                          </div>
                        </td>
                        <td>
                          <Badge bg="success-soft" className="text-success rounded-pill px-2.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1">
                            <Heart size={11} className="text-pink-500" />
                            <span>{p.retentionRate}% retención</span>
                          </Badge>
                        </td>
                        <td className="fw-bold text-gray-800">{currency(p.avgTicket)}</td>
                        <td className="pe-3 text-end fw-black text-emerald-600" style={{ fontSize: "14px" }}>
                          {currency(p.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>

            {/* Panel de Rankings Operativos */}
            <Col lg={4}>
              <div className="p-4 bg-light rounded-2xl border h-100 d-flex flex-column justify-content-between">
                <div>
                  <h4 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
                    <TrendingUp size={18} className="text-purple-600" />
                    <span>Líder Operativo de Facturación</span>
                  </h4>
                  
                  <div className="text-center py-4 bg-white rounded-2xl shadow-sm border mb-4">
                    <div className="rounded-circle bg-purple-100 text-purple-700 d-flex align-items-center justify-content-center fw-bold mx-auto mb-2.5 shadow-sm" style={{ width: 64, height: 64, fontSize: 24 }}>
                      🏆
                    </div>
                    <h5 className="fw-bold text-gray-900 m-0">{professionalStats[0]?.name || "Estilista"}</h5>
                    <small className="text-muted block">{professionalStats[0]?.role || "Especialista"}</small>
                    <div className="h4 fw-black text-purple-700 mt-2">{currency(professionalStats[0]?.totalRevenue || 0)}</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 small text-purple-950 leading-relaxed">
                  📢 <strong>Recomendación Estratégica:</strong> El profesional líder este mes es <strong>{professionalStats[0]?.name}</strong>. Mantiene un índice de retención de clientes del <strong>{professionalStats[0]?.retentionRate}%</strong>. Sugerimos considerarlo para capacitaciones internas sobre fidelización al resto del equipo.
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}
