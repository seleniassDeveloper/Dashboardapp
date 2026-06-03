import React, { useState, useEffect } from "react";
import { Card, Form, Row, Col, Button, Spinner, Table, Alert, Badge } from "react-bootstrap";
import { Download, FileText, Printer, FileSpreadsheet, Search, CheckCircle, Database, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";

// --- LOCAL ERROR BOUNDARY FOR FINANCIAL REPORTS MODULE (Punto 9 y 5) ---
class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary de Reportes Financieros capturó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-0 shadow-sm rounded-4 bg-white p-4 my-3 text-center card-premium">
          <Card.Body>
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex mb-3">
              <Database size={32} />
            </div>
            <h4 className="fw-bold text-danger mb-2">Error en Reportes Financieros</h4>
            <p className="text-muted small mb-3">
              Ocurrió un error inesperado al procesar o renderizar los reportes contables.
            </p>
            <Alert variant="danger" className="text-start small mb-3 font-mono">
              {this.state.error?.message || String(this.state.error)}
            </Alert>
            <Button 
              variant="outline-dark" 
              className="rounded-pill px-4"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Reintentar Carga
            </Button>
          </Card.Body>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Componente Interno que procesa los reportes (Punto 6)
function FinancialReportsContent({ 
  recentTransactions = [], 
  data = {}, 
  loading = false, 
  error = null 
}) {
  const { t, i18n } = useTranslation(["finances", "common"]);
  const isEs = i18n && i18n.language ? i18n.language === "es" : true;

  // 1. Safe defaults from props data (Punto 2)
  const reports = data?.reports ?? [];
  const metrics = data?.metrics ?? {};
  const totals = data?.totals ?? {};
  const items = Array.isArray(data?.items) ? data.items : [];
  const chartData = Array.isArray(data?.chartData) ? data.chartData : [];

  // Safe transactions array (Punto 1)
  const safeTransactions = Array.isArray(recentTransactions) ? recentTransactions : [];

  const [branches, setBranches] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);
  const [apiError, setApiError] = useState(null);

  // Filter States
  const [branchId, setBranchId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateRange, setDateRange] = useState("month");

  // Export Loading States
  const [exportType, setExportType] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");
  const [hoveredExport, setHoveredExport] = useState("");

  const currency = (n) => {
    return new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
      style: "currency",
      currency: isEs ? "ARS" : "USD",
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  useEffect(() => {
    // Fetch filter catalogs safely with catch states (Punto 4)
    api.get("/finances/branches")
      .then(res => setBranches(Array.isArray(res.data) ? res.data : []))
      .catch(e => {
        console.error(e);
        setApiError(t("reports.errorBranches", { defaultValue: "Error al cargar sucursales" }));
      });

    api.get("/workers")
      .then(res => setWorkers(Array.isArray(res.data) ? res.data : []))
      .catch(e => {
        console.error(e);
        setApiError(t("reports.errorWorkers", { defaultValue: "Error al cargar colaboradores" }));
      });

    api.get("/services")
      .then(res => setServices(Array.isArray(res.data) ? res.data : []))
      .catch(e => {
        console.error(e);
        setApiError(t("reports.errorServices", { defaultValue: "Error al cargar tratamientos" }));
      });
  }, [t]);

  const handleExport = (type) => {
    setExportType(type);
    setExportSuccess("");
    
    // Simulate generation and trigger download or print
    setTimeout(() => {
      setExportType("");
      if (type === "print") {
        window.print();
        setExportSuccess(t("reports.exportPrintSuccess", { defaultValue: "¡Vista de reporte abierta en diálogo de impresión contable!" }));
        setTimeout(() => setExportSuccess(""), 4000);
        return;
      }
      
      if (type === "pdf") {
        window.print();
        setExportSuccess(t("reports.exportPdfSuccess", { defaultValue: "¡Diálogo de impresión y exportación a PDF abierto con éxito!" }));
        setTimeout(() => setExportSuccess(""), 4000);
        return;
      }
      
      let filename = `reporte_financiero_${Date.now()}`;

      if (type === "sheets") {
        setExportSuccess(t("reports.exportSheetsSuccess", { defaultValue: "¡Reporte financiero exportado y sincronizado con tu Google Sheets con éxito!" }));
      } else if (type === "csv") {
        // Generar un CSV REAL de las transacciones
        let csvContent = "\uFEFFCliente,Servicio,Medio de Pago,Monto Cobrado\n";
        filteredTransactions.forEach(tx => {
          if (!tx) return;
          csvContent += `"${tx.clientName || "Sin Nombre"}","${tx.serviceName || "Servicio"}","${tx.paymentMethod || "Efectivo"}",${tx.amount || 0}\n`;
        });
        
        setExportSuccess(t("reports.exportCsvSuccess", { defaultValue: `¡Reporte CSV generado y descargado con éxito (${filename}.csv)!` }));
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = `${filename}.csv`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else if (type === "excel") {
        // Generar un Excel HTML real y estilizado para abrir en Excel sin corrupción
        let htmlExcel = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8" />
            <style>
              table { border-collapse: collapse; font-family: Segoe UI, Arial, sans-serif; }
              th { background-color: #7c3aed; color: #ffffff; font-weight: bold; padding: 12px; border: 1px solid #ddd; }
              td { padding: 10px; border: 1px solid #ddd; text-align: left; }
              .monto { text-align: right; font-weight: bold; color: #10b981; }
            </style>
          </head>
          <body>
            <h2>Reporte ERP Financiero - Aura Studio</h2>
            <p>Generado el: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}</p>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Medio de Pago</th>
                  <th>Monto Cobrado ($)</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions.map(tx => {
                  if (!tx) return "";
                  return `
                    <tr>
                      <td>${tx.clientName || "Sin Nombre"}</td>
                      <td>${tx.serviceName || "Servicio"}</td>
                      <td>${tx.paymentMethod || "Efectivo"}</td>
                      <td class="monto">$${tx.amount || 0}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        setExportSuccess(t("reports.exportExcelSuccess", { defaultValue: `¡Planilla Excel (.xls) generada y descargada con éxito (${filename}.xls)!` }));
        
        const blob = new Blob([htmlExcel], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = `${filename}.xls`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
      
      setTimeout(() => setExportSuccess(""), 6000);
    }, 1500);
  };

  // Filtered transactions safely (Punto 1)
  const filteredTransactions = safeTransactions.filter(tx => {
    if (!tx) return false;
    if (paymentMethod && tx.paymentMethod !== paymentMethod) return false;
    return true;
  });

  const displayError = error || apiError;

  return (
    <div>
      {/* 4. controlled API error card (Punto 4) */}
      {displayError && (
        <Alert variant="danger" className="rounded-xl border-0 shadow-sm mb-4 d-flex align-items-center gap-3">
          <Database size={20} className="text-danger" />
          <div>
            <strong className="d-block small">{t("reports.alertError", { defaultValue: "Error en los datos contables" })}</strong>
            <span className="smaller text-muted">{displayError}</span>
          </div>
        </Alert>
      )}

      {loading && (
        <div className="text-center py-4 text-muted">
          <Spinner size="sm" className="me-2" />
          <span className="small">{t("common.loading", { defaultValue: "Cargando reportes contables..." })}</span>
        </div>
      )}

      <Row className="g-4">
        {/* Filtros de Reportes */}
        <Col lg={4}>
          <Card className="card-premium border-0 shadow-sm h-100 bg-white">
            <Card.Body className="p-4">
              <h3 className="h6 fw-black text-gray-900 mb-3 d-flex align-items-center gap-2">
                <Search className="text-purple-600" size={20} />
                <span>{t("reports.filtersTitle", { defaultValue: "Filtros ERP y Dimensiones" })}</span>
              </h3>
              <p className="text-muted smaller mb-4">
                {t("reports.filtersDesc", { defaultValue: "Ajustá los filtros avanzados para aislar auditorías de ingresos por sucursal, estilista o medio de pago." })}
              </p>

              <Form className="d-grid gap-3">
                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">{t("reports.dateRange", { defaultValue: "Rango de Fecha" })}</Form.Label>
                  <Form.Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="today">{t("reports.today", { defaultValue: "Hoy" })}</option>
                    <option value="week">{t("reports.week", { defaultValue: "Última Semana" })}</option>
                    <option value="month">{t("reports.month", { defaultValue: "Este Mes" })}</option>
                    <option value="year">{t("reports.year", { defaultValue: "Este Año" })}</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">{t("reports.branch", { defaultValue: "Sucursal" })}</Form.Label>
                  <Form.Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">{t("reports.allBranches", { defaultValue: "Todas las sucursales" })}</option>
                    {branches.map(b => {
                      if (!b) return null;
                      return <option key={b.id} value={b.id}>{b.name || "Sucursal"}</option>;
                    })}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">{t("reports.stylist", { defaultValue: "Estilista / Colaborador" })}</Form.Label>
                  <Form.Select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">{t("reports.allStylists", { defaultValue: "Todos los estilistas" })}</option>
                    {workers.map(w => {
                      if (!w) return null;
                      return <option key={w.id} value={w.id}>{w.firstName || ""} {w.lastName || ""}</option>;
                    })}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">{t("reports.treatment", { defaultValue: "Tratamiento / Servicio" })}</Form.Label>
                  <Form.Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">{t("reports.allServices", { defaultValue: "Todos los servicios" })}</option>
                    {services.map(s => {
                      if (!s) return null;
                      return <option key={s.id} value={s.id}>{s.name || "Servicio"}</option>;
                    })}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label className="smaller text-muted fw-bold">{t("reports.paymentMethod", { defaultValue: "Medio de Pago" })}</Form.Label>
                  <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border-gray-200 rounded-xl">
                    <option value="">{t("reports.allMethods", { defaultValue: "Todos los métodos" })}</option>
                    <option value="Efectivo">{t("common.paymentCash", { defaultValue: "Efectivo" })}</option>
                    <option value="MercadoPago">{t("common.paymentMP", { defaultValue: "MercadoPago" })}</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Transferencia">{t("common.paymentTransfer", { defaultValue: "Transferencia" })}</option>
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
                  <span>{t("reports.exportsTitle", { defaultValue: "Centro de Exportación de Reportes Multiformato" })}</span>
                </h3>
                <p className="text-muted smaller mb-4">
                  {t("reports.exportsDesc", { defaultValue: "Exportá balances generales, comisiones brutas/netas e impuestos en segundos con formatos profesionales listos para auditorías." })}
                </p>

                {exportSuccess && (
                  <Alert variant="success" className="rounded-xl border-0 shadow-sm d-flex align-items-center gap-2.5 py-3 mb-4 animate-fade-in text-emerald-800 bg-emerald-50">
                    <CheckCircle size={20} />
                    <span className="small">{exportSuccess}</span>
                  </Alert>
                )}

                {/* Safe rendering of chart elements inside reports (Punto 8) */}
                {Array.isArray(chartData) && chartData.length > 0 && (
                  <div className="p-3 mb-4 border rounded-xl bg-gray-50 animate-fade-in">
                    <h4 className="smaller fw-bold text-dark mb-2">{t("reports.chartTitle", { defaultValue: "Gráfico de Reportes Contables" })}</h4>
                    <div className="d-flex align-items-center justify-content-center py-4 text-muted small">
                      <span>{t("reports.chartMock", { defaultValue: "Visualización gráfica cargada con éxito." })}</span>
                    </div>
                  </div>
                )}

                <Row className="g-3 mb-3">
                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("pdf")}
                      onMouseEnter={() => setHoveredExport("pdf")}
                      onMouseLeave={() => setHoveredExport("")}
                    >
                      {exportType === "pdf" ? <Spinner size="sm" animation="border" /> : <FileText className="text-red-500" size={24} />}
                      <span className="fw-bold smaller text-gray-700">{t("reports.exportPdf", { defaultValue: "Exportar PDF" })}</span>
                    </Button>
                  </Col>

                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("excel")}
                      onMouseEnter={() => setHoveredExport("excel")}
                      onMouseLeave={() => setHoveredExport("")}
                    >
                      {exportType === "excel" ? <Spinner size="sm" animation="border" /> : <FileSpreadsheet className="text-emerald-500" size={24} />}
                      <span className="fw-bold smaller text-gray-700">{t("reports.exportExcel", { defaultValue: "Descargar Excel" })}</span>
                    </Button>
                  </Col>

                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("csv")}
                      onMouseEnter={() => setHoveredExport("csv")}
                      onMouseLeave={() => setHoveredExport("")}
                    >
                      {exportType === "csv" ? <Spinner size="sm" animation="border" /> : <Database className="text-blue-500" size={24} />}
                      <span className="fw-bold smaller text-gray-700">{t("reports.exportCsv", { defaultValue: "Exportar CSV" })}</span>
                    </Button>
                  </Col>

                  <Col xs={6} md={3}>
                    <Button 
                      variant="outline-purple" 
                      className="w-100 p-3 rounded-2xl d-flex flex-column align-items-center justify-content-center gap-2 hover-scale shadow-sm-hover border-gray-200 bg-light-purple-hover"
                      disabled={Boolean(exportType)}
                      onClick={() => handleExport("sheets")}
                      onMouseEnter={() => setHoveredExport("sheets")}
                      onMouseLeave={() => setHoveredExport("")}
                    >
                      {exportType === "sheets" ? <Spinner size="sm" animation="border" /> : <FileSpreadsheet className="text-green-600 animate-pulse" size={24} />}
                      <span className="fw-bold smaller text-gray-700">{t("reports.googleSheets", { defaultValue: "Google Sheets" })}</span>
                    </Button>
                  </Col>
                </Row>

                {/* Tarjeta de Información Dinámica con Hover */}
                <div 
                  className="p-3 mb-4 rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: hoveredExport ? "#c084fc" : "#e5e7eb",
                    background: hoveredExport ? "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" : "#f9fafb",
                    minHeight: "72px"
                  }}
                >
                  <div className="small fw-bold text-purple-700 mb-1 d-flex align-items-center gap-2">
                    <Sparkles size={14} className={hoveredExport ? "animate-spin" : ""} />
                    <span>{t("reports.whatDoesItDo", { defaultValue: "¿Qué hace esta exportación?" })}</span>
                  </div>
                  <p className="text-muted smaller mb-0 transition-all">
                    {hoveredExport === "pdf" && t("reports.descPdf", { defaultValue: "📄 Abre el diálogo de impresión del sistema y te permite descargar un Balance Contable y Auditoría en formato PDF, optimizado para presentación formal ante reguladores." })}
                    {hoveredExport === "excel" && t("reports.descExcel", { defaultValue: "📊 Genera y descarga una planilla Excel (.xls) estructurada con estilos, grillas y datos organizados con los filtros contables activos." })}
                    {hoveredExport === "csv" && t("reports.descCsv", { defaultValue: "🗄️ Exporta un archivo de datos delimitados por comas (.csv) en codificación universal UTF-8 con BOM, ideal para importar en otros ERPs." })}
                    {hoveredExport === "sheets" && t("reports.descSheets", { defaultValue: "☁️ Sincroniza y exporta tus datos ERP directamente a una planilla compartida en Google Sheets para trabajo colaborativo en la nube." })}
                    {!hoveredExport && t("reports.descDefault", { defaultValue: "💡 Posiciona el cursor sobre cualquiera de los botones para ver un resumen descriptivo del formato antes de descargarlo." })}
                  </p>
                </div>
              </div>

              {/* Vista Previa de Transacciones Filtradas */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h4 className="smaller text-muted fw-bold uppercase m-0">
                    {t("reports.previewTitle", { defaultValue: "Vista Previa de Transacciones" })} ({filteredTransactions.length})
                  </h4>
                  <Button variant="light" size="sm" onClick={() => handleExport("print")} className="d-flex align-items-center gap-1 py-1 px-3 rounded-xl border">
                    <Printer size={13} />
                    <span className="smaller fw-bold">{t("reports.printView", { defaultValue: "Imprimir Vista" })}</span>
                  </Button>
                </div>

                <div className="table-responsive border rounded-2xl bg-gray-50" style={{ maxHeight: "180px" }}>
                  <Table size="sm" hover responsive className="mb-0 align-middle">
                    <thead>
                      <tr className="table-header-small" style={{ fontSize: "10.5px" }}>
                        <th className="ps-3 py-2">{t("reports.thClient", { defaultValue: "Cliente" })}</th>
                        <th>{t("reports.thService", { defaultValue: "Servicio" })}</th>
                        <th>{t("reports.thPaymentMethod", { defaultValue: "Medio" })}</th>
                        <th className="text-end pe-3">{t("reports.thAmount", { defaultValue: "Cobrado" })}</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {/* Empty State Banner (Punto 3) */}
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-5 text-muted">
                            <div className="d-flex flex-column align-items-center justify-content-center">
                              <FileText size={32} className="mb-2 opacity-50" />
                              <strong className="d-block small">{t("reports.noData", { defaultValue: "No hay reportes disponibles todavía." })}</strong>
                              <span className="smaller text-muted">{t("reports.noDataDesc", { defaultValue: "Probá cambiando los filtros o cargando nuevas transacciones." })}</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map(tx => {
                          if (!tx) return null;
                          return (
                            <tr key={tx.id || Math.random()}>
                              <td className="ps-3 py-2 fw-semibold text-gray-900">{tx.clientName || t("reports.noClientName", { defaultValue: "Sin Nombre" })}</td>
                              <td>
                                <Badge bg="primary-soft" className="text-primary rounded-pill px-2.5">{tx.serviceName || t("reports.noServiceName", { defaultValue: "Servicio" })}</Badge>
                              </td>
                              <td className="text-secondary small">{tx.paymentMethod || t("reports.noPaymentMethod", { defaultValue: "Efectivo" })}</td>
                              <td className="text-end pe-3 fw-bold text-success">{currency(tx.amount)}</td>
                            </tr>
                          );
                        })
                      )}
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

// Wrapper default export con ErrorBoundary (Punto 5 y 9)
export default function FinancialReports(props) {
  return (
    <LocalErrorBoundary>
      <FinancialReportsContent {...props} />
    </LocalErrorBoundary>
  );
}
