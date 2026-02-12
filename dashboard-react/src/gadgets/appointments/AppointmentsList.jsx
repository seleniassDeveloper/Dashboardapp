import React, { useEffect, useCallback, useMemo, useState } from "react";
import { Card, Button, ListGroup, Spinner, Alert, Stack, Form, Row, Col } from "react-bootstrap";
import axios from "axios";

import AppointmentItem from "./AppointmentItem";
import AppointmentModal from "./AppointmentModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

const API = "http://localhost:3001/api";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "CANCELLED", label: "Canceladas" },
  { value: "DONE", label: "Finalizadas" },
];

const RANGE_OPTIONS = [
  { value: "ALL", label: "Todo" },
  { value: "DAY", label: "Día" },
  { value: "WEEK", label: "Semana" },
  { value: "MONTH", label: "Mes" },
];

// ------- helpers fecha -------
function formatYMD(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeekMonday(d) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 dom..6 sáb
  const diff = day === 0 ? -6 : 1 - day; // lunes inicio
  x.setDate(x.getDate() + diff);
  return x;
}
function endOfWeekMonday(d) {
  const s = startOfWeekMonday(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return endOfDay(e);
}
function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function endOfMonth(d) {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  return endOfDay(x);
}

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modal create/edit
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  // delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deletingAppt, setDeletingAppt] = useState(null);

  // ✅ filtros
  const [range, setRange] = useState("ALL");     // ALL | DAY | WEEK | MONTH
  const [status, setStatus] = useState("ALL");   // ALL | PENDING | CONFIRMED | CANCELLED | DONE

  // DAY
  const [dayDate, setDayDate] = useState(() => formatYMD(new Date()));

  // WEEK (rango)
  const [weekFrom, setWeekFrom] = useState("");
  const [weekTo, setWeekTo] = useState("");

  // MONTH (fecha ancla, usamos 1 date)
  const [monthAnchor, setMonthAnchor] = useState(() => formatYMD(new Date()));

  const fetchAppointments = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(`${API}/appointments`);
      const list = (res.data || []).slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      setAppointments(list);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ✅ Cuando elijo WEEK, precargar semana actual (lunes-domingo)
  useEffect(() => {
    if (range !== "WEEK") return;
    if (weekFrom && weekTo) return;

    const now = new Date();
    setWeekFrom(formatYMD(startOfWeekMonday(now)));
    setWeekTo(formatYMD(endOfWeekMonday(now)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const handleRangeChange = (value) => {
    setRange(value);

    // limpiar inputs si no se usan
    if (value !== "WEEK") {
      setWeekFrom("");
      setWeekTo("");
    }
  };

  // ✅ lista filtrada
  const filteredAppointments = useMemo(() => {
    let list = appointments;

    if (status !== "ALL") list = list.filter((a) => a.status === status);

    if (range === "DAY") {
      if (!dayDate) return list;
      const base = new Date(`${dayDate}T12:00:00`);
      const from = startOfDay(base);
      const to = endOfDay(base);
      list = list.filter((a) => {
        const d = new Date(a.startsAt);
        return d >= from && d <= to;
      });
    }

    if (range === "WEEK") {
      if (!weekFrom || !weekTo) return list;
      const from = startOfDay(new Date(`${weekFrom}T12:00:00`));
      const to = endOfDay(new Date(`${weekTo}T12:00:00`));
      list = list.filter((a) => {
        const d = new Date(a.startsAt);
        return d >= from && d <= to;
      });
    }

    if (range === "MONTH") {
      if (!monthAnchor) return list;
      const base = new Date(`${monthAnchor}T12:00:00`);
      const from = startOfMonth(base);
      const to = endOfMonth(base);
      list = list.filter((a) => {
        const d = new Date(a.startsAt);
        return d >= from && d <= to;
      });
    }

    return list;
  }, [appointments, status, range, dayDate, weekFrom, weekTo, monthAnchor]);

  // ---- modal handlers ----
  const handleOpenCreate = () => {
    setEditingAppt(null);
    setShowForm(true);
  };
  const handleOpenEdit = (appt) => {
    setEditingAppt(appt);
    setShowForm(true);
  };
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAppt(null);
  };

  const handleSaved = useCallback(({ mode, appointment }) => {
    setAppointments((prev) => {
      if (mode === "create") return [...prev, appointment].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      return prev.map((x) => (x.id === appointment.id ? appointment : x));
    });
  }, []);

  // ---- delete handlers ----
  const handleOpenDelete = (appt) => {
    setDeletingAppt(appt);
    setShowDelete(true);
  };
  const handleCloseDelete = () => {
    setShowDelete(false);
    setDeletingAppt(null);
  };
  const handleDeleted = (deletedId) => {
    setAppointments((prev) => prev.filter((a) => a.id !== deletedId));
    handleCloseDelete();
  };

  // ✅ PUT: cambiar status (backend requiere clientId/serviceId/startsAt)
  const handleStatusChange = useCallback(async (appt, nextStatus) => {
    try {
      setError("");

      const payload = {
        clientId: appt.clientId,
        serviceId: appt.serviceId,
        startsAt: appt.startsAt,
        notes: appt.notes ?? null,
        status: nextStatus,
      };

      const res = await axios.put(`${API}/appointments/${appt.id}`, payload);

      setAppointments((prev) =>
        prev.map((x) => (x.id === appt.id ? res.data : x))
      );
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "No se pudo actualizar el estado.");
    }
  }, []);

  return (
    <>
      <Card className="shadow-sm">
        <Card.Body>
          <Stack direction="horizontal" className="justify-content-between">
            <div>
              <Card.Title className="mb-1">Próximas citas</Card.Title>
              <Card.Text className="text-muted mb-0" style={{ fontSize: 13 }}>
                Filtra por día/semana/mes y cambia el estado desde la lista.
              </Card.Text>
            </div>

            <Stack direction="horizontal" gap={2}>
              {/* <Button variant="outline-secondary" onClick={fetchAppointments}>
                Refrescar
              </Button> */}
              <Button variant="dark" onClick={handleOpenCreate}>
                + <i className="fa-regular fa-calendar"></i>
              </Button>
            </Stack>
          </Stack>

          {/* ✅ Filtros */}
          <Row className="g-2 mt-3">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Rango</Form.Label>
              <Form.Select value={range} onChange={(e) => handleRangeChange(e.target.value)}>
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Form.Select>
            </Col>

            {/* ✅ Día: 1 fecha */}
            {range === "DAY" && (
              <Col md={3}>
                <Form.Label className="small text-muted mb-1">Día</Form.Label>
                <Form.Control type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)} />
              </Col>
            )}

            {/* ✅ Semana: rango */}
            {range === "WEEK" && (
              <>
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">Desde</Form.Label>
                  <Form.Control type="date" value={weekFrom} onChange={(e) => setWeekFrom(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">Hasta</Form.Label>
                  <Form.Control type="date" value={weekTo} onChange={(e) => setWeekTo(e.target.value)} min={weekFrom || undefined} />
                </Col>
              </>
            )}

            {/* ✅ Mes: 1 fecha ancla */}
            {range === "MONTH" && (
              <Col md={3}>
                <Form.Label className="small text-muted mb-1">Mes (fecha base)</Form.Label>
                <Form.Control type="date" value={monthAnchor} onChange={(e) => setMonthAnchor(e.target.value)} />
              </Col>
            )}

            <Col md={range === "WEEK" ? 3 : 3}>
              <Form.Label className="small text-muted mb-1">Estado</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <div className="mt-3">
            {error ? <Alert variant="danger">{error}</Alert> : null}

            {loading ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <Spinner size="sm" />
                Cargando...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-muted">No hay citas con esos filtros.</div>
            ) : (
              <ListGroup>
                {filteredAppointments.map((appt) => (
                  <AppointmentItem
                    key={appt.id}
                    appt={appt}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onChangeStatus={handleStatusChange} // ✅ nuevo
                  />
                ))}
              </ListGroup>
            )}
          </div>
        </Card.Body>
      </Card>

      <AppointmentModal
        show={showForm}
        onHide={handleCloseForm}
        onSaved={handleSaved}
        initialData={editingAppt}
      />

      <ConfirmDeleteModal
        show={showDelete}
        onHide={handleCloseDelete}
        appt={deletingAppt}
        onDeleted={handleDeleted}
        onError={(msg) => setError(msg)}
      />
    </>
  );
}