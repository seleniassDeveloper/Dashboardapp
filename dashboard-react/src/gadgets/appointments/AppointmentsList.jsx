// src/gadgets/appointments/AppointmentsList.jsx
import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  Card,
  Button,
  ListGroup,
  Spinner,
  Alert,
  Stack,
  Form,
  Row,
  Col,
  Pagination,
} from "react-bootstrap";
import axios from "axios";

import AppointmentItem from "./AppointmentItem";
import AppointmentModal from "./AppointmentModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

import { useAppointmentsStore } from "./AppointmentsProvider.jsx";

import "../../styles/appointments-list.css";

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
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
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

// ✅ helper: garantiza ids aunque vengan dentro de client/service
function normalizeAppt(appt) {
  if (!appt) return appt;
  const workerNameFromRelation = appt?.worker
    ? `${appt.worker.firstName || ""} ${appt.worker.lastName || ""}`.trim()
    : "";

  return {
    ...appt,
    clientId: appt.clientId || appt.client?.id || "",
    workerId: appt.workerId || appt.worker?.id || "",
    workerName: appt.workerName || workerNameFromRelation || "",
    serviceId: appt.serviceId || appt.service?.id || "",
  };
}

export default function AppointmentsList() {
  const {
    appointments,
    loading,
    error,
    setError,
    fetchAppointments,
    upsertAppointment,
    removeAppointment,
  } = useAppointmentsStore();

  // modal create/edit
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  // delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deletingAppt, setDeletingAppt] = useState(null);

  // filtros
  const [range, setRange] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [dayDate, setDayDate] = useState(() => formatYMD(new Date()));
  const [weekFrom, setWeekFrom] = useState("");
  const [weekTo, setWeekTo] = useState("");
  const [monthAnchor, setMonthAnchor] = useState(() => formatYMD(new Date()));

  // ✅ paginado
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  // precargar semana actual si eliges WEEK
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
    if (value !== "WEEK") {
      setWeekFrom("");
      setWeekTo("");
    }
    setPage(1);
  };

  // ✅ si cambian filtros, reset página
  useEffect(() => {
    setPage(1);
  }, [status, range, dayDate, weekFrom, weekTo, monthAnchor]);

  // ✅ normalizamos antes de filtrar/render
  const normalizedAppointments = useMemo(() => {
    return (appointments || []).map(normalizeAppt);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    let list = normalizedAppointments;

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
  }, [
    normalizedAppointments,
    status,
    range,
    dayDate,
    weekFrom,
    weekTo,
    monthAnchor,
  ]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  }, [filteredAppointments.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAppointments.slice(start, start + PAGE_SIZE);
  }, [filteredAppointments, page]);

  // modales
  const handleOpenCreate = () => {
    setEditingAppt(null);
    setShowForm(true);
  };

  const handleOpenEdit = (appt) => {
    // ✅ aseguramos initialData consistente para el modal
    setEditingAppt(normalizeAppt(appt));
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAppt(null);
  };

  const handleSaved = useCallback(
    ({ appointment }) => {
      // ✅ guardamos lo que venga y luego refrescamos
      upsertAppointment(appointment);
      fetchAppointments();
      setPage(1);
    },
    [upsertAppointment, fetchAppointments],
  );

  // delete modal
  const handleOpenDelete = (appt) => {
    setDeletingAppt(appt);
    setShowDelete(true);
  };

  const handleCloseDelete = () => {
    setShowDelete(false);
    setDeletingAppt(null);
  };

  const handleDeleted = useCallback(
    (deletedId) => {
      removeAppointment(deletedId);
      fetchAppointments();
      handleCloseDelete();
      setPage(1);
    },
    [removeAppointment, fetchAppointments],
  );

  const handleStatusChange = useCallback(
    async (appt, nextStatus) => {
      try {
        setError("");

        const clientId = appt.clientId || appt.client?.id;
        const serviceId = appt.serviceId || appt.service?.id;

        const workerId = appt.workerId || appt.worker?.id;

        if (!clientId || !serviceId || !workerId) {
          return setError(
            "Faltan IDs de cliente/servicio/trabajador en la cita. Revisa el GET /appointments con include.",
          );
        }

        const payload = {
          clientId,
          workerId,
          workerName: appt.workerName || null,
          serviceId,
          startsAt: appt.startsAt,
          notes: appt.notes ?? null,
          status: nextStatus,
        };

        const res = await axios.put(`${API}/appointments/${appt.id}`, payload);
        console.log("PUT /appointments response", res.data);
        upsertAppointment(res.data);
        fetchAppointments();
      } catch (e) {
        console.error(e);
        setError(
          e?.response?.data?.error || "No se pudo actualizar el estado.",
        );
      }
    },
    [setError, upsertAppointment, fetchAppointments],
  );

  const PaginationBar = () => {
    if (filteredAppointments.length <= PAGE_SIZE) return null;

    const items = [];
    const go = (p) => setPage(p);

    const addPage = (p) => {
      items.push(
        <Pagination.Item key={p} active={p === page} onClick={() => go(p)}>
          {p}
        </Pagination.Item>,
      );
    };

    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    items.push(
      <Pagination.Prev
        key="prev"
        disabled={page === 1}
        onClick={() => go(page - 1)}
      />,
    );

    if (start > 1) {
      addPage(1);
      if (start > 2) items.push(<Pagination.Ellipsis key="el1" disabled />);
    }

    for (let p = start; p <= end; p++) addPage(p);

    if (end < totalPages) {
      if (end < totalPages - 1)
        items.push(<Pagination.Ellipsis key="el2" disabled />);
      addPage(totalPages);
    }

    items.push(
      <Pagination.Next
        key="next"
        disabled={page === totalPages}
        onClick={() => go(page + 1)}
      />,
    );

    return (
      <div className="d-flex align-items-center justify-content-between mt-3">
        <div className="text-muted" style={{ fontSize: 12 }}>
          Mostrando{" "}
          <strong>
            {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, filteredAppointments.length)}
          </strong>{" "}
          de <strong>{filteredAppointments.length}</strong>
        </div>

        <Pagination className="mb-0">{items}</Pagination>
      </div>
    );
  };

  return (
    <>
      <Card className="shadow-sm appt-card">
        <Card.Body>
          <Stack
            direction="horizontal"
            className="justify-content-between align-items-start gap-3"
          >
            <Stack
              direction="horizontal"
              gap={2}
              className="appt-header-actions"
            >
              <Button
                variant="outline-secondary"
                onClick={fetchAppointments}
                className="appt-btn"
              >
                Actualizar
              </Button>

              <Button
                variant="dark"
                onClick={handleOpenCreate}
                className="appt-btn"
              >
                <i className="fa-regular fa-calendar me-2" />
                Nueva
              </Button>
            </Stack>
          </Stack>

          {/* filtros */}
          <div className="appt-filters py-2">
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Rango</Form.Label>
                <Form.Select
                  value={range}
                  onChange={(e) => handleRangeChange(e.target.value)}
                >
                  {RANGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {range === "DAY" && (
                <Col md={4}>
                  <Form.Label>Día</Form.Label>
                  <Form.Control
                    type="date"
                    value={dayDate}
                    onChange={(e) => setDayDate(e.target.value)}
                  />
                </Col>
              )}

              {range === "WEEK" && (
                <>
                  <Col md={4}>
                    <Form.Label>Desde</Form.Label>
                    <Form.Control
                      type="date"
                      value={weekFrom}
                      onChange={(e) => setWeekFrom(e.target.value)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label>Hasta</Form.Label>
                    <Form.Control
                      type="date"
                      value={weekTo}
                      onChange={(e) => setWeekTo(e.target.value)}
                      min={weekFrom || undefined}
                    />
                  </Col>
                </>
              )}

              {range === "MONTH" && (
                <Col md={4}>
                  <Form.Label>Mes (fecha base)</Form.Label>
                  <Form.Control
                    type="date"
                    value={monthAnchor}
                    onChange={(e) => setMonthAnchor(e.target.value)}
                  />
                </Col>
              )}

              <Col md={4}>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </div>

          {error ? (
            <Alert variant="danger" className="mt-3 mb-0">
              {error}
            </Alert>
          ) : null}

          <div className="appt-list-wrap">
            {loading ? (
              <div className="appt-loading">
                <Spinner size="sm" /> Cargando...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="appt-empty">No hay citas con esos filtros.</div>
            ) : (
              <>
                <ListGroup className="appt-list">
                  {paginatedAppointments.map((appt) => (
                    <AppointmentItem
                      key={appt.id}
                      appt={appt}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                      onChangeStatus={handleStatusChange}
                    />
                  ))}
                </ListGroup>

                <PaginationBar />
              </>
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
