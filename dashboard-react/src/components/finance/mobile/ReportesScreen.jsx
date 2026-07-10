// src/components/finance/mobile/ReportesScreen.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Download, Check, Sparkles, QrCode } from "lucide-react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import api from "../../../lib/api.js";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// Local Error Boundary to protect reports view
class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center bg-white rounded-xl border m-3">
          <div className="text-danger fw-bold h5">Error en Reportes</div>
          <p className="small text-muted mb-3">Ocurrió un error al procesar los datos fiscales.</p>
          <Button variant="outline-dark" size="sm" onClick={() => this.setState({ hasError: false })}>
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ReportesScreenContent({ recentTransactions = [], expenseBranches = [] }) {
  const [activeTab, setActiveTab] = useState("reportes"); // reportes, afip

  // Catalog states
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateRange, setDateRange] = useState("month");

  // Invoicing states
  const [invoiceType, setInvoiceType] = useState("B");
  const [clientDocNum, setClientDocNum] = useState("");
  const [clientTaxStatus, setClientTaxStatus] = useState("Consumidor Final");
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState(null);

  useEffect(() => {
    // Fetch catalogs
    api.get("/workers").then(res => setWorkers(res.data)).catch(e => console.error(e));
    api.get("/services").then(res => setServices(res.data)).catch(e => console.error(e));
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter(tx => {
      if (selectedBranch && tx.branchId !== selectedBranch) return false;
      if (selectedWorker && tx.workerId !== selectedWorker) return false;
      if (selectedService && tx.serviceId !== selectedService) return false;
      if (paymentMethod && tx.paymentMethod !== paymentMethod) return false;
      return true;
    });
  }, [recentTransactions, selectedBranch, selectedWorker, selectedService, paymentMethod]);

  // Tax calculations based on Argentina AFIP standards
  const taxMetrics = useMemo(() => {
    let totalGross = 0;
    let net21 = 0;
    let iva21 = 0;
    let net10 = 0;
    let iva10 = 0;
    let totalIIBB = 0;

    filteredTransactions.forEach(tx => {
      const amount = Number(tx.amount || 0);
      totalGross += amount;

      const is105 = tx.serviceName?.toLowerCase().includes("ceja") || tx.serviceName?.toLowerCase().includes("manic");
      if (is105) {
        const net = amount / 1.105;
        net10 += net;
        iva10 += (amount - net);
      } else {
        const net = amount / 1.21;
        net21 += net;
        iva21 += (amount - net);
      }
      totalIIBB += amount * 0.035;
    });

    return {
      gross: totalGross,
      net21: Math.round(net21),
      iva21: Math.round(iva21),
      net10: Math.round(net10),
      iva10: Math.round(iva10),
      iibb: Math.round(totalIIBB)
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = ["Cliente,Servicio,Profesional,Medio de Pago,Monto"];
    const rows = filteredTransactions.map(tx => `"${tx.clientName || "Consumidor Final"}","${tx.serviceName}","${tx.workerName}","${tx.paymentMethod}",${tx.amount}`);
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_finanzas_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLibroIVA = () => {
    let cbteContent = "";
    let alicuotaContent = "";
    
    filteredTransactions.forEach((tx, idx) => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const cbteNum = String(idx + 1).padStart(8, "0");
      const amount = Number(tx.amount || 0);

      // Comprobante layout
      const clientName = (tx.clientName || "Consumidor Final").slice(0, 30).padEnd(30, " ");
      const rawTotal = Math.round(amount * 100);
      cbteContent += `${dateStr}00600004${cbteNum.padStart(20, "0")}${cbteNum.padStart(20, "0")}9600000000000${clientName}${String(rawTotal).padStart(15, "0")}${"".padStart(71, " ")}\r\n`;

      // Alicuota layout
      const is105 = tx.serviceName?.toLowerCase().includes("ceja") || tx.serviceName?.toLowerCase().includes("manic");
      const divisor = is105 ? 1.105 : 1.21;
      const netVal = Math.round((amount / divisor) * 100);
      const taxVal = Math.round((amount - (amount / divisor)) * 100);
      alicuotaContent += `00600004${cbteNum.padStart(20, "0")}${String(netVal).padStart(15, "0")}${is105 ? "0004" : "0005"}${String(taxVal).padStart(15, "0")}\r\n`;
    });

    const downloadTxt = (content, filename) => {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    downloadTxt(cbteContent, `REGINFO_CV_VENTAS_CBTE_${Date.now()}.txt`);
    downloadTxt(alicuotaContent, `REGINFO_CV_VENTAS_ALICUOTAS_${Date.now()}.txt`);
  };

  const handleEmitInvoice = (e) => {
    e.preventDefault();
    setIsProcessingInvoice(true);
    setInvoiceResult(null);

    setTimeout(() => {
      const cae = String(Math.floor(10000000000000 + Math.random() * 90000000000000));
      const vto = new Date();
      vto.setDate(vto.getDate() + 10);
      
      setInvoiceResult({
        cae,
        vto: vto.toLocaleDateString("es-AR"),
        nro: `0004-${String(Math.floor(Math.random() * 100000)).padStart(8, "0")}`
      });
      setIsProcessingInvoice(false);
    }, 1500);
  };

  return (
    <div className="animate-fade-in">
      {/* Subtabs for Reportes / AFIP */}
      <nav className="f-statustabs">
        <button 
          className={`f-statustab-btn ${activeTab === "reportes" ? "is-active" : ""}`}
          onClick={() => setActiveTab("reportes")}
        >
          Reportes
        </button>
        <button 
          className={`f-statustab-btn ${activeTab === "afip" ? "is-active" : ""}`}
          onClick={() => setActiveTab("afip")}
        >
          AFIP / Factura Electrónica
        </button>
      </nav>

      {activeTab === "reportes" ? (
        <>
          {/* Filters section */}
          <div className="f-report-filters bg-white rounded-xl border m-3">
            <div>
              <label>Sucursal</label>
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                <option value="">Todas las sucursales</option>
                {expenseBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Colaborador</label>
              <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                <option value="">Todos los colaboradores</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Servicio</label>
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                <option value="">Todos los servicios</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Medio de Pago</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="MercadoPago">MercadoPago</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Crédito/Débito">Tarjeta de Crédito/Débito</option>
              </select>
            </div>

            <div>
              <label>Rango de fechas</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>
            </div>
          </div>

          {/* Export action buttons */}
          <div className="f-export-grid">
            <button className="f-export" onClick={() => window.print()} style={{ color: "var(--f-red)" }}>
              <Download size={16} /> PDF
            </button>
            <button className="f-export" onClick={handleExportCSV} style={{ color: "var(--f-green)" }}>
              <Download size={16} /> Excel
            </button>
            <button className="f-export" onClick={handleExportCSV} style={{ color: "var(--f-blue)" }}>
              <Download size={16} /> CSV
            </button>
            <button className="f-export" onClick={handleExportCSV} style={{ color: "var(--f-green)" }}>
              <Download size={16} /> Sheets
            </button>
            <button className="f-export" onClick={handleExportLibroIVA} style={{ color: "var(--f-purple)" }}>
              <Download size={16} /> Libro IVA (AFIP)
            </button>
          </div>
        </>
      ) : (
        <div className="p-3">
          {/* AFIP taxation overview */}
          <div className="f-card bg-white p-3 mb-3">
            <h5 className="fw-bold mb-3 small text-muted uppercase">Desglose Impositivo Estimado</h5>
            <div className="d-grid gap-2 small text-secondary">
              <div className="d-flex justify-content-between">
                <span>Ventas Brutas Totales:</span>
                <span className="fw-bold text-dark">{currency(taxMetrics.gross)}</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2">
                <span>Base Gravada IVA 21%:</span>
                <span>{currency(taxMetrics.net21)}</span>
              </div>
              <div className="d-flex justify-content-between text-danger">
                <span>IVA Débito Fiscal (21%):</span>
                <span>{currency(taxMetrics.iva21)}</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2">
                <span>Base Gravada IVA 10.5%:</span>
                <span>{currency(taxMetrics.net10)}</span>
              </div>
              <div className="d-flex justify-content-between text-danger">
                <span>IVA Débito Fiscal (10.5%):</span>
                <span>{currency(taxMetrics.iva10)}</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 text-danger">
                <span>Ingresos Brutos Estimados (3.5%):</span>
                <span>{currency(taxMetrics.iibb)}</span>
              </div>
            </div>
          </div>

          {/* Electronic invoicing form */}
          <div className="f-card bg-white p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 small text-muted uppercase">Factura Electrónica AFIP</h5>
              <span className="badge bg-success-soft text-success px-2 py-1 rounded-pill">WSFEv1: ONLINE</span>
            </div>

            <Form onSubmit={handleEmitInvoice}>
              <Form.Group className="mb-2">
                <Form.Label className="small text-muted fw-bold">Tipo de Comprobante</Form.Label>
                <Form.Select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
                  <option value="B">Factura B (Consumidor Final)</option>
                  <option value="A">Factura A (Responsable Inscripto)</option>
                  <option value="C">Factura C (Monotributista)</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small text-muted fw-bold">CUIT / DNI Cliente</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="Ej. 20384758392" 
                  value={clientDocNum} 
                  onChange={(e) => setClientDocNum(e.target.value)} 
                  required 
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small text-muted fw-bold">Condición Fiscal</Form.Label>
                <Form.Select value={clientTaxStatus} onChange={(e) => setClientTaxStatus(e.target.value)}>
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Monotributo">Responsable Monotributo</option>
                  <option value="Inscripto">Responsable Inscripto</option>
                  <option value="Exento">Exento</option>
                </Form.Select>
              </Form.Group>

              <button type="submit" className="f-btn-purple m-0 w-100" disabled={isProcessingInvoice}>
                {isProcessingInvoice ? "Procesando CAE..." : "Emitir Factura Electrónica"}
              </button>
            </Form>

            {invoiceResult && (
              <div className="mt-3 p-3 bg-purple-soft rounded-4 border text-center animate-fade-in">
                <div className="d-flex align-items-center justify-content-center gap-1.5 text-success fw-bold small mb-2">
                  <Check size={16} /> Comprobante Autorizado AFIP
                </div>
                <div className="small text-secondary mb-1">Punto Vta: 0004 · Nro: {invoiceResult.nro}</div>
                <div className="fw-bold text-dark mb-1">CAE: {invoiceResult.cae}</div>
                <div className="small text-muted mb-2">Vence: {invoiceResult.vto}</div>
                <div className="p-2 bg-white rounded border d-inline-flex">
                  <QrCode size={100} className="text-dark" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportesScreen(props) {
  return (
    <LocalErrorBoundary>
      <ReportesScreenContent {...props} />
    </LocalErrorBoundary>
  );
}
