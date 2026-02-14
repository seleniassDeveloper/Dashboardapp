import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Table,
  Spinner,
  Alert,
  Form,
  Badge,
  Pagination,
} from "react-bootstrap";

import WorkerModal from "./WorkerModal"; // ✅ AJUSTA si tu ruta es distinta

const API = "http://localhost:3001/api";
const PAGE_SIZE = 10;

const DAYS = [
  { key: 1, label: "Lunes" },
  { key: 2, label: "Martes" },
  { key: 3, label: "Miércoles" },
  { key: 4, label: "Jueves" },
  { key: 5, label: "Viernes" },
  { key: 6, label: "Sábado" },
  { key: 7, label: "Domingo" },
];

const safeArray = (x) => (Array.isArray(x) ? x : []);

function dayLabel(dayOfWeek) {
  return DAYS.find((d) => d.key === dayOfWeek)?.label || `Día ${dayOfWeek}`;
}

function prettyMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toLocaleString("es-ES")}`;
}

function compactSchedule(schedules) {
  const list = safeArray(schedules)
    .filter((x) => x?.dayOfWeek >= 1 && x?.dayOfWeek <= 7)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  if (list.length === 0) return "—";
  return list
    .map((sc) => `${dayLabel(sc.dayOfWeek).slice(0, 3)} ${sc.startTime}-${sc.endTime}`)
    .join(" · ");
}

/**
 * Normaliza un worker del backend a un shape usable por el front.
 * - services puede venir como join: [{ service: {...} }] o directo: [{...}]
 */
function normalizeWorker(raw) {
  const w = raw || {};
  return {
    id: String(w.id || ""),
    firstName: w.firstName || "",
    lastName: w.lastName || "",
    services: safeArray(w.services).map((s) => {
      const svc = s?.service || s;
      return {
        id: String(svc?.id || ""),
        name: svc?.name || "Servicio",
        price: svc?.price ?? null,
        duration: svc?.duration ?? null,
      };
    }),
    schedules: safeArray(w.schedules).map((sc) => ({
      id: sc?.id ? String(sc.id) : undefined,
      dayOfWeek: Number(sc?.dayOfWeek) || 0,
      startTime: sc?.startTime || "09:00",
      endTime: sc?.endTime || "18:00",
    })),
  };
}

export default function WorkersListModal({ show, onHide }) {
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // ✅ editar usando WorkerModal
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setError("");
      setOkMsg("");
      setLoading(true);

      const [wRes, sRes] = await Promise.all([
        axios.get(`${API}/workers`),
        axios.get(`${API}/services`),
      ]);

      setWorkers(safeArray(wRes.data).map(normalizeWorker));
      setServices(
        safeArray(sRes.data).map((s) => ({
          id: String(s?.id || ""),
          name: s?.name || "Servicio",
          price: s?.price ?? null,
          duration: s?.duration ?? null,
          isActive: Boolean(s?.isActive ?? true),
        }))
      );
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "No se pudieron cargar trabajadores/servicios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    setPage(1);
    fetchAll();
  }, [show, fetchAll]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return workers;

    return workers.filter((w) => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase();
      const svcs = safeArray(w.services).map((s) => s.name.toLowerCase()).join(" ");
      return name.includes(term) || svcs.includes(term);
    });
  }, [workers, q]);

  // ✅ reset página si el filtro deja la página inválida
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // ----- delete -----
  const handleDelete = useCallback(async (worker) => {
    if (!worker?.id) return;

    const ok = window.confirm(`¿Eliminar a ${worker.firstName} ${worker.lastName}?`);
    if (!ok) return;

    try {
      setError("");
      setOkMsg("");
      setBusyId(worker.id);

      await axios.delete(`${API}/workers/${worker.id}`);

      setWorkers((prev) => prev.filter((x) => x.id !== worker.id));
      setOkMsg("Trabajador eliminado.");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "No se pudo eliminar el trabajador.");
    } finally {
      setBusyId("");
    }
  }, []);

  // ----- edit (abre WorkerModal) -----
  const openEdit = useCallback(
    (worker) => {
      // le pasamos el worker normalizado y además los serviceIds para que el modal lo hidrate fácil
      const w = normalizeWorker(worker);
      const initialData = {
        ...w,
        serviceIds: safeArray(w.services).map((s) => s.id).filter(Boolean),
      };

      setEditingWorker(initialData);
      setShowWorkerModal(true);
    },
    []
  );

  const closeWorkerModal = () => {
    setShowWorkerModal(false);
    setEditingWorker(null);
  };

  const handleWorkerSaved = () => {
    // refresca lista al guardar (edit o create)
    fetchAll();
    closeWorkerModal();
  };

  // ----- pagination UI -----
  const pagination = useMemo(() => {
    if (totalPages <= 1) return null;

    const items = [];

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      />
    );

    // Ventana de páginas (max 5 botones)
    const windowSize = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    if (start > 1) {
      items.push(<Pagination.Item key={1} active={page === 1} onClick={() => setPage(1)}>{1}</Pagination.Item>);
      if (start > 2) items.push(<Pagination.Ellipsis key="e1" disabled />);
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <Pagination.Item key={i} active={page === i} onClick={() => setPage(i)}>
          {i}
        </Pagination.Item>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) items.push(<Pagination.Ellipsis key="e2" disabled />);
      items.push(
        <Pagination.Item
          key={totalPages}
          active={page === totalPages}
          onClick={() => setPage(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
      />
    );

    return <Pagination className="mb-0">{items}</Pagination>;
  }, [page, totalPages]);

  return (
    <>
      {/* LISTA */}
      <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Trabajadores</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          {okMsg ? <Alert variant="success">{okMsg}</Alert> : null}

          <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
            <Form.Control
              placeholder="Buscar por nombre o servicio…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              style={{ maxWidth: 420 }}
            />

            <Button variant="outline-secondary" onClick={fetchAll} disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" /> Actualizando…
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted" style={{ height: 220 }}>
              <Spinner size="sm" /> Cargando trabajadores…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted">No hay trabajadores para mostrar.</div>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Mostrando{" "}
                  <b>
                    {(page - 1) * PAGE_SIZE + 1}-
                    {Math.min(page * PAGE_SIZE, filtered.length)}
                  </b>{" "}
                  de <b>{filtered.length}</b>
                </div>
                {pagination}
              </div>

              <div style={{ overflowX: "auto" }}>
                <Table hover responsive className="align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 240 }}>Nombre</th>
                      <th>Servicios</th>
                      <th style={{ width: 270 }}>Horario</th>
                      <th style={{ width: 170 }} className="text-end">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <div className="fw-semibold">
                            {w.firstName} {w.lastName}
                          </div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            ID: {w.id.slice(0, 8)}…
                          </div>
                        </td>

                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            {safeArray(w.services).length === 0 ? (
                              <span className="text-muted">—</span>
                            ) : (
                              safeArray(w.services).slice(0, 6).map((s) => (
                                <Badge
                                  key={s.id || `${w.id}-${s.name}`}
                                  bg="light"
                                  text="dark"
                                  style={{ border: "1px solid #e5e7eb" }}
                                >
                                  {s.name}
                                  {s.price != null ? ` · ${prettyMoney(s.price)}` : ""}
                                  {s.duration != null ? ` · ${s.duration}m` : ""}
                                </Badge>
                              ))
                            )}
                            {safeArray(w.services).length > 6 ? (
                              <Badge bg="secondary">+{safeArray(w.services).length - 6}</Badge>
                            ) : null}
                          </div>
                        </td>

                        <td>
                          <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.3 }}>
                            {compactSchedule(w.schedules)}
                          </div>
                        </td>

                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              style={{ borderRadius: 10 }}
                              onClick={() => openEdit(w)}
                              disabled={busyId === w.id}
                            >
                              {busyId === w.id ? <Spinner size="sm" /> : "Editar"}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline-danger"
                              style={{ borderRadius: 10 }}
                              onClick={() => handleDelete(w)}
                              disabled={busyId === w.id}
                            >
                              {busyId === w.id ? <Spinner size="sm" /> : "Eliminar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-end mt-2">
                {pagination}
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="dark" onClick={onHide}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ EDITAR usando el MISMO WorkerModal (crear) */}
      <WorkerModal
        show={showWorkerModal}
        onHide={closeWorkerModal}
        mode="edit"
        initialData={editingWorker}
        servicesFromParent={services} // opcional: si quieres evitar otro GET /services
        onSaved={handleWorkerSaved}
      />
    </>
  );
}