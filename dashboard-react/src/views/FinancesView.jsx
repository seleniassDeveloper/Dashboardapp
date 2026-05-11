import { Container, Row, Col, Card, ProgressBar, Table, Badge } from "react-bootstrap";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Banknote, Download } from "lucide-react";

const TRANSACTIONS = [
  { id: 1, customer: "Victor Xu", amount: 45.00, method: "Visa •••• 4242", status: "success", date: "Hoy, 14:20" },
  { id: 2, customer: "Jhonna Sauce", amount: 20.00, method: "Efectivo", status: "success", date: "Hoy, 12:15" },
  { id: 3, customer: "Andrea Paez", amount: 15.00, method: "Mastercard •••• 8812", status: "pending", date: "Ayer, 18:30" },
];

export default function FinancesView() {
  return (
    <Container fluid className="p-0">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="fw-bold h3">Finanzas</h1>
          <p className="text-muted">Controla tus ingresos, pagos y facturación en un solo lugar.</p>
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2 px-4 py-2" style={{ borderRadius: '10px' }}>
          <Download size={18} />
          Exportar Reporte
        </button>
      </header>

      <Row className="g-4">
        {/* Métricas Stripe-style */}
        <Col md={4}>
          <div className="card-premium p-4 h-100">
            <div className="d-flex justify-content-between mb-3">
              <div className="p-2 rounded bg-light text-primary"><TrendingUp size={20} /></div>
              <Badge bg="success" className="d-flex align-items-center gap-1">+12.5% <ArrowUpRight size={12} /></Badge>
            </div>
            <div className="text-muted small">Ingresos Totales (Mes)</div>
            <div className="h2 fw-bold m-0">$4,285.00</div>
          </div>
        </Col>

        <Col md={4}>
          <div className="card-premium p-4 h-100">
            <div className="d-flex justify-content-between mb-3">
              <div className="p-2 rounded bg-light text-success"><CreditCard size={20} /></div>
              <span className="text-muted small">Últimos 7 días</span>
            </div>
            <div className="text-muted small">Pagos Online</div>
            <div className="h2 fw-bold m-0">$1,920.50</div>
          </div>
        </Col>

        <Col md={4}>
          <div className="card-premium p-4 h-100">
            <div className="d-flex justify-content-between mb-3">
              <div className="p-2 rounded bg-light text-warning"><Banknote size={20} /></div>
              <span className="text-muted small">Pendiente de cobro</span>
            </div>
            <div className="text-muted small">Balance en Efectivo</div>
            <div className="h2 fw-bold m-0">$2,364.50</div>
          </div>
        </Col>

        {/* Tabla de Transacciones */}
        <Col md={8}>
          <div className="card-premium p-0 overflow-hidden">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h3 className="h6 fw-bold m-0">Transacciones Recientes</h3>
              <button className="btn btn-link btn-sm text-decoration-none">Ver todas</button>
            </div>
            <Table hover responsive className="mb-0 align-middle">
              <tbody>
                {TRANSACTIONS.map(t => (
                  <tr key={t.id}>
                    <td className="ps-4">
                      <div className="fw-semibold">{t.customer}</div>
                      <div className="text-muted small">{t.date}</div>
                    </td>
                    <td><div className="text-muted small">{t.method}</div></td>
                    <td>
                      <Badge bg={t.status === 'success' ? 'success' : 'warning'} className="opacity-75">
                        {t.status === 'success' ? 'Completado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="pe-4 text-end fw-bold">${t.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>

        {/* Distribución de Gastos */}
        <Col md={4}>
          <div className="card-premium p-4 h-100">
            <h3 className="h6 fw-bold mb-4">Meta Mensual</h3>
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Progreso: 85%</span>
                <span className="small fw-bold">$4,285 / $5,000</span>
              </div>
              <ProgressBar now={85} style={{ height: '8px' }} />
            </div>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                <span className="small">Servicios</span>
                <span className="fw-bold">$3,100</span>
              </div>
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                <span className="small">Venta Productos</span>
                <span className="fw-bold">$1,185</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
