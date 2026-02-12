import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { WORKERS } from "../../../data/workers";
import { useBrand } from "../../../header/name/BrandProvider";

const API = "http://localhost:3001/api";

function safeArray(v) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function Rentabilidad({
  range,
  status,
  dayDate,
  weekFrom,
  weekTo,
  monthAnchor,
}) {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#ffffff";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 GET citas
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/appointments`);
        if (!alive) return;
        setAppointments(safeArray(res.data));
      } catch (e) {
        if (!alive) return;
        setError("No se pudieron traer las citas.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 🔹 aplicar filtros (igual lógica que AppointmentsList)
  const filtered = useMemo(() => {
    let list = safeArray(appointments);

    if (status !== "ALL") {
      list = list.filter((a) => a.status === status);
    }

    return list;
  }, [appointments, status]);

  // 🔹 métricas
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    const byService = {};
    const byWorker = {};

    for (const a of filtered) {
      const price = Number(a?.service?.price || 0);
      totalRevenue += price;

      const serviceName = a?.service?.name || "Sin servicio";
      if (!byService[serviceName]) byService[serviceName] = 0;
      byService[serviceName] += price;

      // trabajador desde WORKERS
      const worker = WORKERS.find((w) =>
        w.services?.some((s) => s.name === serviceName)
      );

      const workerName = worker?.name || "Sin trabajador";
      if (!byWorker[workerName]) byWorker[workerName] = 0;
      byWorker[workerName] += price;
    }

    const avgTicket =
      filtered.length > 0 ? totalRevenue / filtered.length : 0;

    return {
      totalRevenue,
      byService,
      byWorker,
      avgTicket,
    };
  }, [filtered]);

  if (loading) {
    return (
      <Card className="mt-3 brand-card">
        <Card.Body>
          <Spinner size="sm" /> Calculando rentabilidad...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-3 brand-card">
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-3 brand-card">
      <Card.Body>
        <Card.Title className="brand-title">
          Métricas de Rentabilidad
        </Card.Title>

        <Row className="g-3 mt-2">
          <Col md={4}>
            <div
              className="p-3 brand-card"
              style={{ borderLeft: `4px solid ${accent}` }}
            >
              <div className="text-muted">Ingreso Total</div>
              <h4 className="brand-title">
                {currency(metrics.totalRevenue)}
              </h4>
            </div>
          </Col>

          <Col md={4}>
            <div
              className="p-3 brand-card"
              style={{ borderLeft: `4px solid ${accent}` }}
            >
              <div className="text-muted">Ticket Promedio</div>
              <h4 className="brand-title">
                {currency(metrics.avgTicket)}
              </h4>
            </div>
          </Col>

          <Col md={4}>
            <div
              className="p-3 brand-card"
              style={{ borderLeft: `4px solid ${accent}` }}
            >
              <div className="text-muted">Cantidad de Citas</div>
              <h4 className="brand-title">{filtered.length}</h4>
            </div>
          </Col>
        </Row>

        {/* Ingreso por servicio */}
        <Row className="mt-4">
          <Col md={6}>
            <h6 className="brand-title">Ingreso por Servicio</h6>
            {Object.entries(metrics.byService).map(([name, value]) => (
              <div
                key={name}
                className="d-flex justify-content-between border-bottom py-2"
              >
                <span>{name}</span>
                <b>{currency(value)}</b>
              </div>
            ))}
          </Col>

          {/* Ingreso por trabajador */}
          <Col md={6}>
            <h6 className="brand-title">Ingreso por Trabajador</h6>
            {Object.entries(metrics.byWorker).map(([name, value]) => (
              <div
                key={name}
                className="d-flex justify-content-between border-bottom py-2"
              >
                <span>{name}</span>
                <b>{currency(value)}</b>
              </div>
            ))}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}