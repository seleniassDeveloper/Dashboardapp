// src/header/workers/WorkersABMModal.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, Button, Table, Spinner, Alert, Form, Badge, Stack } from "react-bootstrap";
import { useBrand } from "../name/BrandProvider";
import WorkerModal from "./WorkerModal";
import ServiceModal from "../services/ServiceModal";

const API = "http://localhost:3001/api";
const PAGE_SIZE = 10;

const safeArray = (x) => (Array.isArray(x) ? x : []);

function withAlpha(hex, alpha = 1) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return `rgba(60,60,60,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeWorker(raw) {
  const w = raw || {};
  const services = safeArray(w.services).map((s) => s?.service || s).filter(Boolean);

  return {
    id: String(w.id || ""),
    firstName: w.firstName || "",
    lastName: w.lastName || "",
    schedules: safeArray(w.schedules).map((sc) => ({
      dayOfWeek: Number(sc?.dayOfWeek) || 0,
      startTime: sc?.startTime || "09:00",
      endTime: sc?.endTime || "18:00",
    })),
    services: services.map((svc) => ({
      id: String(svc?.id || ""),
      name: svc?.name || "Servicio",
      price: svc?.price ?? null,
      duration: svc?.duration ?? null,
    })),
  };
}

function prettyMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toLocaleString("es-ES")}`;
}

const DAY_LABEL = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
};

function compactSchedule(schedules) {
  const list = safeArray(schedules)
    .filter((x) => x?.dayOfWeek >= 1 && x?.dayOfWeek <= 7)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  if (list.length === 0) return "—";
  return list.map((sc) => `${DAY_LABEL[sc.dayOfWeek]} ${sc.startTime}-${sc.endTime}`).join(" · ");
}

export default function WorkersABMModal({ show, onHide }) {
  const { brand } = useBrand();
  const accent = brand?.accentColor || brand?.textColor || "#111827";

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [workers, setWorkers] = useState([]);
  const [q, setQ] = useState("");

  // paginado
  const [page, setPage] = useState(1);

  // modales secundarios
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerMode, setWorkerMode] = useState("create"); // create | edit
  const [workerInitial, setWorkerInitial] = useState(null);

  const [showServiceModal, setShowServiceModal] = useState(false);

  const fetchWorkers = useCallback(async () => {
    try {
      setError("");
      setOkMsg("");
      setLoading(true);

      const res = await axios.get(`${API}/workers`);
      setWorkers(safeArray(res.data).map(normalizeWorker));
    } catch (e) {
      console.error(e);
      setWorkers([]);
      setError(e?.response?.data?.error || "No se pudieron cargar los trabajadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    setPage(1);
    fetchWorkers();
  }, [show, fetchWorkers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return workers;

    return workers.filter((w) => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase();
      const svcs = safeArray(w.services).map((s) => s.name.toLowerCase()).join(" ");
      return name.includes(term) || svcs.includes(term);
    });
  }, [workers, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  useEffect(() => {
    // si filtras y te quedas en una page que ya no existe
    if (page > totalPages) setPage(1);
  }, [totalPages]); // eslint-disable-line

  const openCreateWorker = () => {
    setWorkerMode("create");
    setWorkerInitial(null);
    setShowWorkerModal(true);
  };

  const openEditWorker = (w) => {
    setWorkerMode("edit");
    setWorkerInitial({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      serviceIds: safeArray(w.services).map((s) => s.id).filter(Boolean),
      schedules: safeArray(w.schedules),
    });
    setShowWorkerModal(true);
  };

  const handleWorkerSaved = () => {
    // refresca lista
    fetchWorkers();
    setOkMsg(workerMode === "edit" ? "Trabajador actualizado." : "Trabajador creado.");
  };

  const handleDelete = useCallback(
    async (w) => {
      if (!w?.id) return;
      const ok = window.confirm(`¿Eliminar a ${w.firstName} ${w.lastName}?`);
      if (!ok) return;

      try {
        setError("");
        setOkMsg("");
        setBusyId(w.id);

        await axios.delete(`${API}/workers/${w.id}`);
        setWorkers((prev) => prev.filter((x) => x.id !== w.id));
        setOkMsg("Trabajador eliminado.");
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.error || "No se pudo eliminar el trabajador.");
      } finally {
        setBusyId("");
      }
    },
    []
  );

  const headerStyle = {
    borderBottom: `1px solid ${withAlpha(accent, 0.18)}`,
  };

  const pillStyle = {
    background: withAlpha(accent, 0.10),
    border: `1px solid ${withAlpha(accent, 0.22)}`,
    color: brand?.darkMode ? "#fff" : "#111827",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
  };

  console.log(pageItems, "pageItems")

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="xl" backdrop="static">
        <Modal.Header closeButton style={headerStyle}>
          <div className="w-100 d-flex align-items-center justify-content-between gap-3">
            <div>
              <Modal.Title style={{ marginBottom: 2 }}>Trabajadores</Modal.Title>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Administra trabajadores, servicios y horarios.
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span style={pillStyle}>{filtered.length} total</span>

              <Button variant="outline-secondary" onClick={fetchWorkers} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Actualizando…
                  </>
                ) : (
                  "Actualizar"
                )}
              </Button>

              <Button variant="dark" onClick={openCreateWorker}>
                + Nuevo trabajador
              </Button>

              <Button variant="outline-dark" onClick={() => setShowServiceModal(true)}>
                + Nuevo servicio
              </Button>
            </div>
          </div>
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
              style={{ maxWidth: 460 }}
            />

            <div className="text-muted" style={{ fontSize: 12 }}>
              Página <b>{pageSafe}</b> de <b>{totalPages}</b>
            </div>
          </div>

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted" style={{ height: 220 }}>
              <Spinner size="sm" /> Cargando trabajadores…
            </div>
          ) : pageItems.length === 0 ? (
            <div className="text-muted">No hay trabajadores para mostrar.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table hover responsive className="align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 260 }}>Nombre</th>
                    <th>Servicios</th>
                    <th style={{ width: 280 }}>Horario</th>
                    <th style={{ width: 190 }} className="text-end">
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
                                style={{ border: `1px solid ${withAlpha(accent, 0.18)}` }}
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
                            onClick={() => openEditWorker(w)}
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
          )}

          {/* ✅ Paginado */}
          {totalPages > 1 ? (
            <Stack direction="horizontal" className="justify-content-between align-items-center mt-3">
              <div className="text-muted" style={{ fontSize: 12 }}>
                Mostrando {pageItems.length} de {filtered.length}
              </div>

              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setPage(1)}
                  disabled={pageSafe === 1}
                >
                  «
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                >
                  Anterior
                </Button>

                <span style={{ alignSelf: "center", fontSize: 13 }}>
                  {pageSafe}/{totalPages}
                </span>

                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                >
                  Siguiente
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setPage(totalPages)}
                  disabled={pageSafe === totalPages}
                >
                  »
                </Button>
              </div>
            </Stack>
          ) : null}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="dark" onClick={onHide}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ Reutilizamos tu WorkerModal (create/edit) */}
      <WorkerModal
        show={showWorkerModal}
        onHide={() => setShowWorkerModal(false)}
        mode={workerMode}
        initialData={workerInitial}
        onSaved={handleWorkerSaved}
      />

      {/* ✅ Crear servicio rápido */}
      <ServiceModal show={showServiceModal} onHide={() => setShowServiceModal(false)} />
    </>
  );
}