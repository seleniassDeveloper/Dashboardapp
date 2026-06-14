import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Button, Table, Badge, Alert, Modal, Spinner } from "react-bootstrap";
import { CreditCard, ShieldCheck, AlertTriangle, Calendar, Info, RefreshCw, CheckCircle } from "lucide-react";
import api from "../../lib/api.js";

export default function SubscriptionSettingsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState(null);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");

  // Sandbox simulation states
  const [showSimModal, setShowSimModal] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);

  const mockCheckout = searchParams.get("mock_checkout") === "true";
  const providerSubId = searchParams.get("providerSubId") || "";
  const planCode = searchParams.get("planCode") || "";
  const interval = searchParams.get("interval") || "";
  const price = searchParams.get("price") || "";

  const fetchSubscriptionDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/billing/subscription");
      if (res.data?.success) {
        setSubData(res.data);
      }
    } catch (err) {
      console.error("Error fetching subscription status:", err);
      setError("No se pudieron cargar los datos de facturación de tu negocio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionDetails();

    if (mockCheckout && providerSubId) {
      setShowSimModal(true);
    }
  }, [searchParams]);

  const handleCancelSub = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar la renovación automática de tu suscripción? Conservarás el acceso hasta finalizar el período pago.")) {
      return;
    }
    setCancelLoading(true);
    setError("");
    try {
      const res = await api.post("/billing/cancel");
      if (res.data?.success) {
        setCancelMessage(res.data.message);
        await fetchSubscriptionDetails();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error al cancelar la renovación automática.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    setSimLoading(true);
    try {
      // 1. Trigger subscription authorized webhook event
      await api.post("/billing/webhook", {
        id: `sim_evt_${Math.random().toString(36).substr(2, 9)}`,
        type: "subscription_preapproval",
        action: "created",
        data: { id: providerSubId },
        mock_status: "authorized",
        mock_amount: Number(price)
      });

      // 2. Trigger payment approved webhook event
      await api.post("/billing/webhook", {
        id: `sim_evt_pay_${Math.random().toString(36).substr(2, 9)}`,
        type: "payment",
        action: "payment.created",
        data: { id: `pay_${Math.random().toString(36).substr(2, 9)}` },
        mock_status: "approved",
        mock_subscription_id: providerSubId,
        mock_amount: Number(price)
      });

      setSimSuccess(true);
      setTimeout(() => {
        setShowSimModal(false);
        // Clear query parameters
        searchParams.delete("mock_checkout");
        searchParams.delete("providerSubId");
        searchParams.delete("planCode");
        searchParams.delete("interval");
        searchParams.delete("price");
        setSearchParams(searchParams);
        // Reload page to sync state
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Mock simulation webhook error:", err);
      alert("La simulación de pago falló. Revisa la consola.");
    } finally {
      setSimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" style={{ color: "#7c3aed" }} />
        <p className="text-muted mt-2 small">Cargando detalles de facturación...</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const map = {
      trialing: { label: "Período de Prueba", variant: "info" },
      active: { label: "Suscripción Activa", variant: "success" },
      past_due: { label: "Pago Demorado", variant: "warning" },
      canceled: { label: "Cancelada", variant: "secondary" },
      suspended: { label: "Suspendida", variant: "danger" }
    };
    const match = map[status] || { label: status, variant: "light" };
    return <Badge bg={match.variant} className="px-3 py-1.5 rounded-pill text-uppercase">{match.label}</Badge>;
  };

  const planNames = {
    starter: "Plan Starter",
    pro: "Plan Pro",
    business: "Plan Business"
  };

  return (
    <div>
      {error && <Alert variant="danger" className="border-0 shadow-sm mb-4 small">{error}</Alert>}
      {cancelMessage && <Alert variant="success" className="border-0 shadow-sm mb-4 small">{cancelMessage}</Alert>}

      {/* Dunning warning banner */}
      {subData?.subscriptionStatus === "past_due" && (
        <Alert variant="warning" className="border-0 shadow-sm mb-4 rounded-3 d-flex align-items-start gap-2.5">
          <AlertTriangle size={20} className="text-warning mt-0.5" />
          <div>
            <strong className="d-block mb-1">Requiere Regularización de Pago</strong>
            <span className="small text-secondary">
              Tu último cobro recurrente ha fallado. Tu cuenta se encuentra en período de gracia. 
              Por favor regulariza tu pago antes del <strong>{new Date(subData.gracePeriodEndsAt).toLocaleDateString()}</strong> para evitar la suspensión del servicio.
            </span>
          </div>
        </Alert>
      )}

      {/* Main card */}
      <Card className="border-0 shadow-sm rounded-4 mb-4" style={{ background: "#fff" }}>
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 border-bottom pb-4 mb-4">
            <div>
              <h3 className="fw-bold h5 mb-1 text-dark">Plan Actual</h3>
              <p className="text-muted smaller mb-0">Controla el estado y renovación de tu suscripción de AuraDash / DashboardOS.</p>
            </div>
            <div>
              {getStatusBadge(subData?.subscriptionStatus)}
            </div>
          </div>

          <Table borderless responsive className="mb-0">
            <tbody>
              <tr>
                <td className="text-muted small py-2" style={{ width: "200px" }}>Plan Contratado:</td>
                <td className="fw-bold text-dark py-2">{planNames[subData?.plan] || subData?.plan || "Ninguno"}</td>
              </tr>
              {subData?.subscriptionStatus === "trialing" && (
                <tr>
                  <td className="text-muted small py-2">Fin de Prueba Gratis:</td>
                  <td className="text-dark py-2 font-medium">
                    <Calendar size={14} className="text-secondary me-1.5" />
                    {subData.trialEndsAt ? new Date(subData.trialEndsAt).toLocaleDateString() : "Sin fecha"}
                  </td>
                </tr>
              )}
              {subData?.subscriptionStatus === "active" && subData?.currentPeriodEnd && (
                <tr>
                  <td className="text-muted small py-2">Próxima Renovación:</td>
                  <td className="text-dark py-2 font-medium">
                    <Calendar size={14} className="text-secondary me-1.5" />
                    {new Date(subData.currentPeriodEnd).toLocaleDateString()}
                  </td>
                </tr>
              )}
              {subData?.subscription?.cancelAtPeriodEnd && (
                <tr>
                  <td className="text-muted small py-2">Renovación Automática:</td>
                  <td className="text-danger py-2 font-bold">Desactivada (Expira el {subData.currentPeriodEnd ? new Date(subData.currentPeriodEnd).toLocaleDateString() : ""})</td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Action buttons */}
          <div className="d-flex flex-wrap gap-2.5 mt-4 pt-4 border-top">
            <Button 
              variant="purple" 
              href="/app/pricing"
              className="rounded-pill px-4.5 py-2 small fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0"
              style={{ fontSize: "12.5px" }}
            >
              Cambiar de Plan
            </Button>
            {subData?.subscriptionStatus === "active" && !subData?.subscription?.cancelAtPeriodEnd && (
              <Button 
                variant="outline-danger" 
                disabled={cancelLoading}
                onClick={handleCancelSub}
                className="rounded-pill px-4.5 py-2 small fw-bold"
                style={{ fontSize: "12.5px" }}
              >
                {cancelLoading ? "Cancelando..." : "Cancelar Renovación Automática"}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Invoices list card */}
      <Card className="border-0 shadow-sm rounded-4" style={{ background: "#fff" }}>
        <Card.Body className="p-4">
          <h4 className="fw-bold h6 mb-3 text-dark">Historial de Transacciones</h4>
          <p className="text-muted smaller mb-3.5">Listado de los últimos pagos procesados por la suscripción mensual/anual.</p>
          
          {(!subData?.subscription?.payments || subData.subscription.payments.length === 0) ? (
            <div className="text-center py-4 bg-light rounded-3">
              <Info size={20} className="text-muted mb-1.5" />
              <p className="text-muted mb-0 small">No se registran transacciones pasadas.</p>
            </div>
          ) : (
            <Table responsive className="mb-0">
              <thead>
                <tr className="border-bottom text-muted smaller uppercase">
                  <th className="py-2.5">ID Pago</th>
                  <th className="py-2.5">Fecha</th>
                  <th className="py-2.5">Detalle</th>
                  <th className="py-2.5">Monto</th>
                  <th className="py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {subData.subscription.payments.map((pay) => (
                  <tr key={pay.id} className="border-bottom small align-middle">
                    <td className="py-2.5 font-monospace text-muted smaller">{pay.providerPayId || pay.id}</td>
                    <td className="py-2.5">{new Date(pay.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5">Renovación Suscripción SaaS</td>
                    <td className="py-2.5 fw-bold text-dark">${(pay.amount / 100).toFixed(2)}</td>
                    <td className="py-2.5">
                      <Badge bg={pay.status === "approved" ? "success" : "danger"} className="rounded-pill py-1 px-2.5">
                        {pay.status === "approved" ? "Aprobado" : pay.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Sandbox Simulator Modal */}
      <Modal show={showSimModal} onHide={() => setShowSimModal(false)} centered backdrop="static" className="sandbox-modal">
        <Modal.Header className="border-0 pb-0 justify-content-center">
          <Modal.Title className="fw-black h4 text-purple-600 text-center">
            MercadoPago Sandbox Simulator
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          {simSuccess ? (
            <div className="py-3">
              <CheckCircle size={56} className="text-success mb-3 animate-bounce" />
              <h4 className="fw-bold h5 mb-2 text-dark">¡Pago Simulado Exitosamente!</h4>
              <p className="text-secondary small mb-0">Reactivando tu panel y actualizando permisos...</p>
            </div>
          ) : (
            <div>
              <div className="d-inline-flex p-3 bg-purple-50 text-purple-600 rounded-circle mb-3">
                <CreditCard size={32} />
              </div>
              <p className="text-secondary small mb-4">
                Estás en el simulador local de pagos. Al hacer clic en el botón de abajo, se enviará una notificación webhook simulada al backend 
                para activar el plan <strong>{planCode?.toUpperCase()}</strong> ({interval === "month" ? "Mensual" : "Anual"}) por un valor de <strong>${(price / 100).toFixed(2)} USD</strong>.
              </p>

              <div className="alert bg-light border-0 p-3 rounded-3 mb-4 text-start font-monospace smaller" style={{ fontSize: "11.5px" }}>
                <div><strong>Subscription ID:</strong> {providerSubId}</div>
                <div><strong>Plan Code:</strong> {planCode}</div>
                <div><strong>Interval:</strong> {interval}</div>
                <div><strong>Amount:</strong> ${(price / 100).toFixed(2)}</div>
              </div>

              <div className="d-flex flex-column gap-2">
                <Button 
                  variant="purple" 
                  disabled={simLoading}
                  onClick={handleSimulatePayment}
                  className="rounded-pill py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 border-0 d-flex align-items-center justify-content-center gap-2"
                >
                  {simLoading ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      Procesando pago...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Simular Pago Exitoso
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  disabled={simLoading}
                  onClick={() => setShowSimModal(false)}
                  className="rounded-pill py-2 border-0"
                >
                  Cancelar Simulación
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
