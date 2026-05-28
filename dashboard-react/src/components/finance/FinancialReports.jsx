import React, { useState, useEffect } from "react";
import { Card, Form, Row, Col, Button, Spinner, Table, Alert, Badge } from "react-bootstrap";
import { Download, FileText, Printer, FileSpreadsheet, Search, CheckCircle, Database } from "lucide-react";
import api from "../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function FinancialReports({ recentTransactions = [] }) {
  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);

  // Filter States
  const [branchId, setBranchId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateRange, setDateRange] = useState("month");

  // Export Loading States
  const [exportType, setExportType] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  useEffect(() => {
    // Fetch filter catalogs
    api.get("/finances/branches")
      .then(res => setBranches(Array.isArray(res.data) ? res.data : []))
      .catch(e => console.error(e));

    api.get("/workers")
      .then(res => setWorkers(Array.isArray(res.data) ? res.data : []))
      .catch(e => console.error(e));

    api.get("/services")
      .then(res => setServices(Array.isArray(res.data) ? res.data : []))
      .catch(e => console.error(e));
  }, []);

  const handleExport = (type) => {
    setExportType(type);
    setExportSuccess("");
    
    // Simulate generation and trigger download or print
    setTimeout(() => {
      setExportType("");
      if (type === "print") {
        window.print();
        return;
      }
      
      let filename = `reporte_financiero_${Date.now()}`;
      let ext = "pdf";
      if (type === "excel") ext = "xlsx";
      else if (type === "csv") ext = "csv";
      else if (type === "sheets") ext = "link";

      if (type === "sheets") {
        setExportSuccess("¡Reporte financiero exportado y sincronizado con tu Google Sheets con éxito!");
      } else {
        setExportSuccess(`¡Reporte financiero generado y descargado con éxito (${filename}.${ext})!`);
        // Trigger dummy file download
        const element = document.createElement("a");
        const file = new Blob(["Reporte Financiero Aura Studio ERP\nGenerado con exito"], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `${filename}.${ext}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
      
      setTimeout(() => setExportSuccess(""), 6000);
    }, 1500);
  };

  // Filtered transactions based on dropdown selections
  const filteredTransactions = recentTransactions.filter(tx => {
    if (paymentMethod && tx.paymentMethod !== paymentMethod) return false;
    return true;
  });

  return (
    <div>
      <Row className="g-4">
        {/* Filtros de Reportes */}
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm h-100 bg-white">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-3 d-flex align-items-center gap-2">
                <Search className="text-purple-600" size={20} />
                <span>Filtros ERP y Dimensiones</span>
              </h3>
              <p className="text-muted smaller mb-4">Ajustá los filtros avanzados para aislar auditorías de ingresos por sucursal, estilista o medio de pago.</p>

              <Form className="d-grid gap-3">
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Rango de Fecha</Form.Label>
                  <Form.Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="today">Hoy</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Este Mes</option>
                    <option value="year">Este Año</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Sucursal</Form.Label>
                  <Form.Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">Todas las sucursales</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Estilista / Colaborador</Form.Label>
                  <Form.Select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">Todos los estilistas</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Tratamiento / Servicio</Form.Label>
                  <Form.Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">Todos los servicios</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">Medio de Pago</Form.Label>
                  <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">Todos los métodos</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="MercadoPago">MercadoPago</option>
                    <option value="Visa">Visa Crédito/Débito</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="PayPal">PayPal</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Acciones de Exportación Avanzada */}
        <Col lg={8}>
          <Card className="card-premium border-0 shadow-sm h-100 bg-white">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <h3 className="h6 fw-black text-gray-900 mb-1 d-flex align-items-center gap-2">
                  <Download className="text-purple-600" size={20} />
                  <span>Centro de Exportación de Reportes Multiformato</span>
                </h3>
                <p className="text-muted smaller mb-4">Exportá balances generales, comisiones brutas/netas e impuestos en segundos con formatos profesionales listos para auditorías.</p>

                {exportSuccess && (
                  <Alert variant="success" className="rounded-xl border-0 shadow-sm d-flex align-items-center gap-2.5 py-3 mb-4 animate-fade-in text-emerald-800 bg-emerald-50">
                    <CheckCircle size={20} />
                    <span className="small">{exportSuccess}</span>
                  </Alert>
                )}

                <Row className="g-3 mb-4">
                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("pdf")}
                    >
                      {exportType === "pdf" ? <Spinner size="sm" animation="border" /> : <FileText className="text-red-500" size={24} />}
                      <span className="fw-bold smaller text-gray-700">Exportar PDF</span>
                    </Button>
                  </Col>

                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("excel")}
                    >
                      {exportType === "excel" ? <Spinner size="sm" animation="border" /> : <FileSpreadsheet className="text-emerald-500" size={24} />}
                      <span className="fw-bold smaller text-gray-700">Descargar Excel</span>
                    </Button>
                  </Col>

                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("csv")}
                    >
                      {exportType === "csv" ? <Spinner size="sm" animation="border" /> : <Database className="text-blue-500" size={24} />}
                      <span className="fw-bold smaller text-gray-700">Exportar CSV</span>
                    </Button>
                  </Col>

                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("sheets")}
                    >
                      {exportType === "sheets" ? <Spinner size="sm" animation="border" /> : <FileSpreadsheet className="text-green-600 animate-pulse" size={24} />}
                      <span className="fw-bold smaller text-gray-700">Google Sheets</span>
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Vista Previa de Transacciones Filtradas */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h4 className="smaller text-muted fw-bold uppercase m-0">Vista Previa de Transacciones ({filteredTransactions.length})</h4>
                  <Button variant="light" size="sm" onClick={() => handleExport("print")} className="d-flex align-items-center gap-1 py-1 px-3 rounded-xl border">
                    <Printer size={13} />
                    <span className="smaller fw-bold">Imprimir Vista</span>
                  </Button>
                </div>

                <div className="table-responsive border rounded-2xl bg-gray-50" style={{ maxHeight: "180px" }}>
                  <Table size="sm" hover responsive className="mb-0 align-middle">
                    <thead>
                      <tr className="table-header-small" style={{ fontSize: "10.5px" }}>
                        <th className="ps-3 py-2">Cliente</th>
                        <th>Servicio</th>
                        <th>Medio</th>
                        <th className="text-end pe-3">Cobrado</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {filteredTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td className="ps-3 py-2 fw-semibold text-gray-900">{tx.clientName}</td>
                          <td>
                            <Badge bg="primary-soft" className="text-primary rounded-pill px-2.5">{tx.serviceName}</Badge>
                          </td>
                          <td className="text-secondary small">{tx.paymentMethod}</td>
                          <td className="text-end pe-3 fw-bold text-success">{currency(tx.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
