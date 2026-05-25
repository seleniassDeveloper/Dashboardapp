import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Table, Spinner, Alert, Form, Stack, Pagination } from "react-bootstrap";
import { Search, UserPlus, RefreshCw, Edit2, Trash2, BookOpen } from "lucide-react";
import ClientModal from "../header/clients/ClientModal.jsx";
import ClientDetailModal from "../components/clients/ClientDetailModal.jsx";
import api from "../lib/api.js";

const safeArray = (x) => (Array.isArray(x) ? x : []);

function displayName(c) {
  const full = (c?.fullName || "").trim();
  if (full) return full;
  const fn = (c?.firstName || "").trim();
  const ln = (c?.lastName || "").trim();
  const combo = `${fn} ${ln}`.trim();
  return combo || "—";
}

export default function ClientsView() {
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [q, setQ] = useState("");

  // Ficha detallada
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailClient, setSelectedDetailClient] = useState(null);

  // modal create/edit
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientMode, setClientMode] = useState("create"); // create | edit
  const [editingClient, setEditingClient] = useState(null);

  // Cargar citas para la ficha técnica
  useEffect(() => {
    api.get("/appointments")
      .then(res => setAppointments(safeArray(res.data)))
      .catch(e => console.error("Error cargando citas para fichas:", e));
  }, []);

  // paginado
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);

  const fetchClients = useCallback(async () => {
    try {
      setError("");
      setOkMsg("");
      setLoading(true);

      const res = await api.get(`/clients`, {
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
    fetchClients();
  }, [fetchClients]);

  // debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => fetchClients(), 250);
    return () => clearTimeout(t);
  }, [q, fetchClients]);

  const sorted = useMemo(() => {
    const list = [...clients];
    list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    return list;
  }, [clients]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

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
      await api.delete(`/clients/${client.id}`);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      setOkMsg("Cliente eliminado.");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "No se pudo eliminar.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="clients-view">
      <header className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h1 className="section-title">Gestión de Clientes</h1>
          <p className="section-subtitle mb-0">Base de datos centralizada de tus clientes y pacientes.</p>
        </div>
        <Button 
          variant="dark" 
          className="btn-premium d-flex align-items-center gap-2 px-4 py-3"
          onClick={openCreate}
        >
          <UserPlus size={18} />
          Nuevo Cliente
        </Button>
      </header>

      <div className="card-premium mb-4">
        <div className="p-2">
          <div className="d-flex gap-3 align-items-center">
            <div className="position-relative flex-grow-1" style={{ maxWidth: 500 }}>
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
              <Form.Control
                placeholder="Buscar por nombre, email o teléfono…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="ps-5 py-2 border-0 bg-light"
                style={{ borderRadius: 12 }}
              />
            </div>
            <Button variant="light" className="rounded-circle p-2" onClick={fetchClients} disabled={loading}>
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger" className="rounded-xl">{error}</Alert>}
      {okMsg && <Alert variant="success" className="rounded-xl">{okMsg}</Alert>}

      <div className="card-premium overflow-hidden">
        {loading && clients.length === 0 ? (
          <div className="py-5 text-center text-muted">
            <Spinner animation="border" variant="primary" className="mb-2" />
            <p>Cargando base de datos…</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-5 text-center text-muted">
            <p>No se encontraron clientes.</p>
          </div>
        ) : (
          <>
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Nombre Completo</th>
                  <th>Teléfono</th>
                  <th>Correo Electrónico</th>
                  <th className="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((c) => (
                  <tr key={c.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-primary-soft text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36, fontSize: 13 }}>
                          {displayName(c).charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-semibold">{displayName(c)}</span>
                      </div>
                    </td>
                    <td className="text-secondary">{c.phone || "—"}</td>
                    <td className="text-secondary">{c.email || "—"}</td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="rounded-lg p-2" 
                          onClick={() => { setSelectedDetailClient(c); setShowDetailModal(true); }}
                          disabled={busyId === c.id}
                          title="Ficha Técnica"
                        >
                          <BookOpen size={16} className="text-primary" />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="rounded-lg p-2" 
                          onClick={() => openEdit(c)}
                          disabled={busyId === c.id}
                          title="Editar"
                        >
                          <Edit2 size={16} className="text-muted" />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="rounded-lg p-2 hover-danger" 
                          onClick={() => handleDelete(c)}
                          disabled={busyId === c.id}
                          title="Eliminar"
                        >
                          <Trash2 size={16} className="text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="p-4 border-top d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Mostrando {((page - 1) * PAGE_SIZE) + 1} a {Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length} clientes
              </span>
              <Pagination className="mb-0 gap-1">
                <Pagination.Prev 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg"
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item 
                    key={i + 1} 
                    active={page === i + 1}
                    onClick={() => setPage(i + 1)}
                    className="rounded-lg"
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg"
                />
              </Pagination>
            </div>
          </>
        )}
      </div>

      <ClientModal
        show={showClientModal}
        onHide={() => setShowClientModal(false)}
        mode={clientMode}
        initialData={editingClient}
        onSaved={handleSaved}
      />

      <ClientDetailModal
        show={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedDetailClient(null); }}
        client={selectedDetailClient}
        appointments={appointments}
      />
    </div>
  );
}
