import React, { useState, useMemo } from "react";
import { Row, Col, Card, Form, Table, Badge, Button } from "react-bootstrap";
import { Search, Filter, Calendar as CalendarIcon, Clock, DollarSign, User, Briefcase, Download } from "lucide-react";
import { useAppointmentsStore } from "../../gadgets/appointments/AppointmentsProvider.jsx";
import { useTranslation } from "react-i18next";

export default function CalendarHistoryView() {
  const { appointments, services, business } = useAppointmentsStore();
  const [workers, setWorkers] = useState([]); // This could be fetched or passed if needed, but we have appointments.workerName
  const { t } = useTranslation();

  // Extract unique workers from appointments for the filter
  const uniqueWorkers = useMemo(() => {
    const wMap = new Map();
    appointments.forEach(a => {
      if (a.workerId && a.workerName) wMap.set(a.workerId, a.workerName);
    });
    return Array.from(wMap.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWorker, setFilterWorker] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const historyList = useMemo(() => {
    let filtered = appointments.filter(a => {
      // Filter by Status
      if (filterStatus !== "ALL") {
        if (filterStatus === "PAST") {
          return new Date(a.startsAt) < new Date() && a.status !== "CANCELLED";
        }
        return a.status === filterStatus;
      }
      return true; // ALL
    });
      
    // Text search
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        (a.clientName && a.clientName.toLowerCase().includes(term)) ||
        (a.serviceName && a.serviceName.toLowerCase().includes(term)) ||
        (a.workerName && a.workerName.toLowerCase().includes(term))
      );
    }
    
    // Worker filter
    if (filterWorker) {
      filtered = filtered.filter(a => String(a.workerId) === String(filterWorker));
    }
    
    // Service filter
    if (filterService) {
      filtered = filtered.filter(a => String(a.service?.id || a.serviceId) === String(filterService));
    }

    // Date Range
    if (dateFrom) {
      filtered = filtered.filter(a => new Date(a.startsAt) >= new Date(dateFrom + "T00:00:00"));
    }
    if (dateTo) {
      filtered = filtered.filter(a => new Date(a.startsAt) <= new Date(dateTo + "T23:59:59"));
    }

    return filtered.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  }, [appointments, searchTerm, filterWorker, filterService, filterStatus, dateFrom, dateTo]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "DONE": return <Badge bg="success" className="px-2 py-1">Finalizada</Badge>;
      case "CANCELLED": return <Badge bg="danger" className="px-2 py-1">Cancelada</Badge>;
      case "CONFIRMED": return <Badge bg="primary" className="px-2 py-1">Confirmada</Badge>;
      case "PENDING": return <Badge bg="warning" text="dark" className="px-2 py-1">Pendiente</Badge>;
      default: return <Badge bg="secondary" className="px-2 py-1">{status}</Badge>;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ADVANCED FILTERS */}
      <Card className="card-premium border-0 shadow-sm rounded-4 mb-4 bg-white">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label className="smaller text-muted fw-bold mb-1"><Search size={12}/> Buscar</Form.Label>
              <Form.Control
                type="text"
                placeholder="Cliente, profesional, servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="modern-input"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="smaller text-muted fw-bold mb-1"><CalendarIcon size={12}/> Desde</Form.Label>
              <Form.Control
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="modern-input"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="smaller text-muted fw-bold mb-1"><CalendarIcon size={12}/> Hasta</Form.Label>
              <Form.Control
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="modern-input"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="smaller text-muted fw-bold mb-1"><User size={12}/> Profesional</Form.Label>
              <Form.Select
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
                className="modern-input"
              >
                <option value="">Todos</option>
                {uniqueWorkers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="smaller text-muted fw-bold mb-1"><Briefcase size={12}/> Servicio</Form.Label>
              <Form.Select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="modern-input"
              >
                <option value="">Todos</option>
                {(() => {
                  const groups = {};
                  services.forEach(s => {
                    const cat = s.category || "General";
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(s);
                  });
                  return Object.entries(groups).map(([category, list]) => (
                    <optgroup key={category} label={category}>
                      {list.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </Form.Select>
            </Col>
            <Col md={1}>
              <Form.Label className="smaller text-muted fw-bold mb-1">Estado</Form.Label>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="modern-input"
              >
                <option value="ALL">Todos</option>
                <option value="DONE">Finalizadas</option>
                <option value="PAST">Pasadas</option>
                <option value="PENDING">Pendientes</option>
                <option value="CONFIRMED">Confirmadas</option>
                <option value="CANCELLED">Canceladas</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* DATA TABLE */}
      <Card className="card-premium border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="table-responsive">
          <Table hover className="align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="text-muted small fw-bold py-3 px-4">Fecha y Hora</th>
                <th className="text-muted small fw-bold py-3">Cliente</th>
                <th className="text-muted small fw-bold py-3">Servicio</th>
                <th className="text-muted small fw-bold py-3">Profesional</th>
                <th className="text-muted small fw-bold py-3">Total</th>
                <th className="text-muted small fw-bold py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <Filter size={32} className="opacity-50 mb-2" />
                    <div>No se encontraron citas con los filtros actuales.</div>
                  </td>
                </tr>
              ) : (
                historyList.map(appt => (
                  <tr key={appt.id}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-light rounded p-2 text-primary">
                          <CalendarIcon size={16} />
                        </div>
                        <div>
                          <strong className="d-block text-dark" style={{fontSize:"13px"}}>{new Date(appt.startsAt).toLocaleDateString("es-AR")}</strong>
                          <span className="text-muted smaller"><Clock size={10} className="d-inline mb-0.5"/> {appt.startTime} - {appt.endTime}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="text-dark d-block" style={{fontSize:"13px"}}>{appt.clientName}</strong>
                      {appt.client?.phone && <span className="text-muted smaller">{appt.client.phone}</span>}
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border fw-normal">{appt.serviceName}</Badge>
                    </td>
                    <td>
                      <span className="text-dark small d-flex align-items-center gap-1">
                        <User size={12} className="text-muted"/> {appt.workerName}
                      </span>
                    </td>
                    <td>
                      <strong className="text-success small d-flex align-items-center gap-1">
                        <DollarSign size={12}/> {appt.totalPrice}
                      </strong>
                    </td>
                    <td>
                      {getStatusBadge(appt.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
