// src/header/clients/ClientsABMModal.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, Button, Table, Spinner, Alert, Form, Stack, Pagination } from "react-bootstrap";
import ClientModal from "./ClientModal.jsx";

const API = "http://localhost:3001/api";
const safeArray = (x) => (Array.isArray(x) ? x : []);

function displayName(c) {
  const full = (c?.fullName || "").trim();
  if (full) return full;
  const fn = (c?.firstName || "").trim();
  const ln = (c?.lastName || "").trim();
  const combo = `${fn} ${ln}`.trim();
  return combo || "—";
}

export default function ClientsABMModal({ show, onHide }) {
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [clients, setClients] = useState([]);
  const [q, setQ] = useState("");

  // modal create/edit
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientMode, setClientMode] = useState("create"); // create | edit
  const [editingClient, setEditingClient] = useState(null);

  // paginado
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const fetchClients = useCallback(async () => {
    try {
      setError("");
      setOkMsg("");
      setLoading(true);

      const res = await axios.get(`${API}/clients`, {
        params: q.trim() ? { search: q.trim() } : {},
      });

      setClients(safeArray(res.data));
      setPage(1);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "No se pudieron cargar los clientes.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    if (!show) return;
    fetchClients();
  }, [show, fetchClients]);

  // debounce búsqueda
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => fetchClients(), 250);
    return () => clearTimeout(t);
  }, [q, show, fetchClients]);

  const sorted = useMemo(() => {
    const list = [...clients];
    // si tu backend trae createdAt:
    list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    return list;
  }, [clients]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openCreate = () => {
    setError("");
    setOkMsg("");
    setClientMode("create");
    setEditingClient(null);
    setShowClientModal(true);
  };

  const openEdit = (client) => {
    setError("");
    setOkMsg("");
    setClientMode("edit");
    setEditingClient(client);
    setShowClientModal(true);
  };

  const handleSaved = (saved) => {
    // upsert local
    setClients((prev) => {
      const id = saved?.id;
      if (!id) return prev;
      const exists = prev.some((c) => c.id === id);
      if (exists) return prev.map((c) => (c.id === id ? saved : c));
      return [saved, ...prev];
    });
    setOkMsg(clientMode === "edit" ? "Cliente actualizado." : "Cliente creado.");
  };

  const handleDelete = async (client) => {
    if (!client?.id) return;

    const ok = window.confirm(`¿Eliminar a ${displayName(client)}?`);
    if (!ok) return;

    try {
      setError("");
      setOkMsg("");
      setBusyId(client.id);

      await axios.delete(`${API}/clients/${client.id}`);

      setClients((prev) => prev.filter((c) => c.id !== client.id));
      setOkMsg("Cliente eliminado.");
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.error ||
          "No se pudo eliminar. Si el cliente tiene citas, primero elimina o reasigna esas citas (o habilita cascade en backend)."
      );
    } finally {
      setBusyId("");
    }
  };

  const pager = (
    <Pagination className="mb-0">
      <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
      <Pagination.Prev onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
      <Pagination.Item active>{page}</Pagination.Item>
      <Pagination.Next onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
      <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
    </Pagination>
  );

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Clientes</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error ? <Alert variant="danger">{error}</Alert> : null}
          {okMsg ? <Alert variant="success">{okMsg}</Alert> : null}

          <div className="d-flex gap-2 align-items-center justify-content-between mb-3">
            <Form.Control
              placeholder="Buscar cliente…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ maxWidth: 420 }}
            />

            <Stack direction="horizontal" gap={2}>
              <Button variant="outline-secondary" onClick={fetchClients} disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Actualizar"}
              </Button>

              <Button variant="dark" onClick={openCreate}>
                + Nuevo
              </Button>
            </Stack>
          </div>

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted" style={{ minHeight: 160 }}>
              <Spinner size="sm" /> Cargando…
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-muted">No hay clientes para mostrar.</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <Table hover responsive className="align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th style={{ width: 170 }} className="text-end">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageRows.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-semibold">{displayName(c)}</td>
                        <td>{c.phone || "—"}</td>
                        <td>{c.email || "—"}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              style={{ borderRadius: 10 }}
                              onClick={() => openEdit(c)}
                              disabled={busyId === c.id}
                            >
                              {busyId === c.id ? <Spinner size="sm" /> : "Editar"}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline-danger"
                              style={{ borderRadius: 10 }}
                              onClick={() => handleDelete(c)}
                              disabled={busyId === c.id}
                            >
                              {busyId === c.id ? <Spinner size="sm" /> : "Eliminar"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length}
                </div>
                {pager}
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

      <ClientModal
        show={showClientModal}
        onHide={() => setShowClientModal(false)}
        mode={clientMode}
        initialData={editingClient}
        onSaved={handleSaved}
      />
    </>
  );
}