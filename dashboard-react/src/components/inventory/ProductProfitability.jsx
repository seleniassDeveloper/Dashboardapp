import React, { useMemo } from "react";
import { Card, Table, Row, Col, Badge, ProgressBar } from "react-bootstrap";
import { TrendingUp, DollarSign, Award, ShieldAlert, Sparkles, Activity } from "lucide-react";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ProductProfitability({ products = [], rules = [], movements = [] }) {
  const profitabilityList = useMemo(() => {
    // Group mermas / losses by product
    const lossMap = movements.reduce((acc, m) => {
      if (m.type === "loss") {
        acc[m.productId] = (acc[m.productId] || 0) + Math.abs(m.diff);
      }
      return acc;
    }, {});

    return products.map(p => {
      // Find rules where this product is consumed
      const associatedRules = rules.filter(r => r.productId === p.id);
      
      // Calculate how many times it was consumed automatically
      const automaticMovements = movements.filter(m => m.productId === p.id && m.type === "automatic");
      const consumptionCount = automaticMovements.length;

      // Product cost per usage
      // Tinta is used by rule.quantity (tubos or ml).
      // Let's estimate cost per single service use
      const usageRules = associatedRules.map(r => {
        return {
          serviceName: r.service.name,
          servicePrice: r.service.price,
          qtyConsumed: r.quantity,
          costOfUse: Math.round(p.costPrice * (p.unit === "litro" ? r.quantity / 1000 : r.quantity))
        };
      });

      const avgCostOfUse = usageRules.length > 0 
        ? Math.round(usageRules.reduce((sum, u) => sum + u.costOfUse, 0) / usageRules.length)
        : p.costPrice;

      const totalServiceRevenues = usageRules.reduce((sum, u) => sum + (u.servicePrice * consumptionCount), 0);
      const estimatedProfit = Math.max(0, totalServiceRevenues - (avgCostOfUse * consumptionCount));

      const lossQty = lossMap[p.id] || 0;
      const wastageValue = lossQty * p.costPrice;

      return {
        id: p.id,
        name: p.name,
        costPrice: p.costPrice,
        salePrice: p.salePrice || p.costPrice * 2,
        stock: p.stock,
        unit: p.unit,
        servicesCount: associatedRules.length,
        consumptionCount,
        avgCostOfUse,
        totalServiceRevenues,
        estimatedProfit,
        wastageValue,
        lossQty
      };
    }).sort((a, b) => b.estimatedProfit - a.estimatedProfit);
  }, [products, rules, movements]);

  // Top profitable and top wastage
  const topProfitable = [...profitabilityList].slice(0, 3);
  const topExpensive = [...profitabilityList].sort((a, b) => b.costPrice - a.costPrice).slice(0, 3);
  const totalWastage = profitabilityList.reduce((sum, p) => sum + p.wastageValue, 0);

  return (
    <div className="animate-fade-in">
      {/* WASTAGE AND TOP PROFIT KPI */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl d-flex align-items-center justify-content-center">
                <ShieldAlert size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Pérdida por Desperdicio/Roturas</span>
                <h4 className="fw-black text-red-600 mb-0">{currency(totalWastage)}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl d-flex align-items-center justify-content-center">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Producto Estrella Operativo</span>
                <h4 className="fw-black text-gray-900 mb-0 small-title-override" style={{ fontSize: "16px", marginTop: "2px" }}>
                  {topProfitable[0] ? `${topProfitable[0].name}` : "Ninguno"}
                </h4>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-premium border-0 shadow-sm bg-white p-3.5 rounded-2xl h-100">
            <Card.Body className="p-0 d-flex align-items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl d-flex align-items-center justify-content-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="smaller text-muted d-block fw-bold mb-0.5">Margen de Reventa Comercial</span>
                <h4 className="fw-black text-emerald-600 mb-0">~ 55.4% de Retorno</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* DETAILED RANKING TABLES */}
      <Row className="g-4 mb-4">
        {/* Most profitable insumos */}
        <Col lg={6}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
                <Award className="text-purple-600" size={18} />
                <span>Ranking de Insumos por Retorno de Inversión</span>
              </h3>
              
              <div className="table-responsive">
                <Table hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="table-header-small" style={{ fontSize: "11px" }}>
                      <th className="ps-3">Nombre</th>
                      <th>Costo Uso</th>
                      <th className="text-center">Veces Usado</th>
                      <th className="pe-3 text-end">Ingresos Estimados</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13px" }}>
                    {topProfitable.map(p => (
                      <tr key={p.id}>
                        <td className="ps-3 fw-bold text-gray-900 py-3">{p.name}</td>
                        <td className="text-gray-700 py-3">{currency(p.avgCostOfUse)}</td>
                        <td className="text-center py-3">{p.consumptionCount} servicios</td>
                        <td className="pe-3 text-end text-success fw-bold py-3">
                          {currency(p.totalServiceRevenues)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Most expensive products to buy */}
        <Col lg={6}>
          <Card className="card-premium border-0 shadow-sm bg-white h-100">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-4 d-flex align-items-center gap-2">
                <Activity className="text-purple-600" size={18} />
                <span>Productos de Mayor Inversión de Compra</span>
              </h3>
              
              <div className="table-responsive">
                <Table hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr className="table-header-small" style={{ fontSize: "11px" }}>
                      <th className="ps-3">Nombre Insumo</th>
                      <th>Costo Adquisición</th>
                      <th>Unidad</th>
                      <th className="pe-3 text-end">Capital Inmovilizado</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13px" }}>
                    {topExpensive.map(p => (
                      <tr key={p.id}>
                        <td className="ps-3 fw-bold text-gray-900 py-3">{p.name}</td>
                        <td className="text-danger fw-bold py-3">{currency(p.costPrice)}</td>
                        <td className="text-secondary py-3">{p.unit}</td>
                        <td className="pe-3 text-end fw-black text-purple-700 py-3">
                          {currency(p.costPrice * p.stock)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MATRIX TABLE OF ALL PRODUCTS PROFITABILITY */}
      <Card className="card-premium border-0 shadow-sm bg-white p-4 rounded-2xl">
        <Card.Body className="p-0">
          <h3 className="h6 fw-black text-gray-900 mb-3.5 d-flex align-items-center gap-2">
            <DollarSign className="text-purple-600" size={18} />
            <span>Matriz Contable de Rentabilidad de Insumos</span>
          </h3>

          <div className="table-responsive">
            <Table hover responsive className="mb-0 align-middle">
              <thead>
                <tr className="table-header-small" style={{ fontSize: "11px", borderBottom: "2px solid #f3f4f6" }}>
                  <th className="ps-3 py-3">Insumo</th>
                  <th className="py-3">Costo Compra</th>
                  <th className="py-3">Costo de Uso Promedio</th>
                  <th className="py-3 text-center">Frecuencia Uso</th>
                  <th className="py-3 text-end">Facturación Vinculada</th>
                  <th className="py-3 text-end text-danger">Pérdida Mermas</th>
                  <th className="pe-3 py-3 text-end text-success">Retorno Neto (ROI)</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {profitabilityList.map(p => (
                  <tr key={p.id} className="transition-all hover-row-focus">
                    <td className="ps-3 fw-bold text-gray-900 py-3">{p.name}</td>
                    <td className="py-3">{currency(p.costPrice)}</td>
                    <td className="py-3 text-secondary">{currency(p.avgCostOfUse)}</td>
                    <td className="py-3 text-center">{p.consumptionCount} veces</td>
                    <td className="py-3 text-end fw-semibold text-gray-800">{currency(p.totalServiceRevenues)}</td>
                    <td className="py-3 text-end text-red-600">
                      {p.lossQty > 0 ? `-${currency(p.wastageValue)}` : "$ 0"}
                    </td>
                    <td className="pe-3 py-3 text-end text-success fw-black">
                      {currency(p.estimatedProfit - p.wastageValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
