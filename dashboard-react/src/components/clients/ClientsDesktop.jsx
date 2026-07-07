import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Button, Table, Spinner, Alert, Form, Stack, Pagination, Badge } from "react-bootstrap";
import { Search, UserPlus, RefreshCw, Edit2, Trash2, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import ClientModal from "../../header/clients/ClientModal.jsx";
import ClientDetailModal from "./ClientDetailModal.jsx";
import api, { API_BASE_URL } from "../../lib/api.js";
import { usePermissions } from "../../auth/PermissionProvider.jsx";
import { getClientStatus } from "../../lib/clientStatus.js";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const host = API_BASE_URL.replace(/\/api$/, "");
  return `${host}${url}`;
};

const safeArray = (x) => (Array.isArray(x) ? x : []);

function displayName(c) {
  const full = (c?.fullName || "").trim();
  if (full) return full;
  const fn = (c?.firstName || "").trim();
  const ln = (c?.lastName || "").trim();
  const combo = `${fn} ${ln}`.trim();
  return combo || "—";
}

export default function ClientsDesktop({ sync }) {
  const {
    clients, appointments, q, setQ, loading, busyId,
    error, setError, okMsg, setOkMsg, handleDelete, handleSaved, setClients, fetchClients
  } = sync;

  const { t } = useTranslation("views");
  const { hasPermission } = usePermissions();

  // Ficha detallada
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailClient, setSelectedDetailClient] = useState(null);

  // modal create/edit
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientMode, setClientMode] = useState("create"); // create | edit
  const [editingClient, setEditingClient] = useState(null);

  // paginado
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);

  const sorted = clients;
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

  const handleSavedLocal = (saved) => {
    handleSaved(saved);
    setOkMsg(clientMode === "edit" ? t("clients.success.updated") : t("clients.success.created"));
  };

  const handleDeleteLocal = async (client) => {
    if (!client?.id) return;
    const ok = window.confirm(t("clients.confirmDelete", { name: displayName(client) }));
    if (!ok) return;
    await handleDelete(client);
  };

  return (
    <div className="clients-view">
      <header className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h1 className="section-title">{t("clients.title")}</h1>
          <p className="section-subtitle mb-0">{t("clients.subtitle")}</p>
        </div>
        <Button
          variant="dark"
          className="btn-premium d-flex align-items-center gap-2 px-4 py-3"
          onClick={openCreate}
        >
          <UserPlus size={18} />
          {t("clients.newClient")}
        </Button>
      </header>

      <div className="card-premium mb-4">
        <div className="p-2">
          <div className="d-flex gap-3 align-items-center">
            <div className="position-relative flex-grow-1" style={{ maxWidth: 500 }}>
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
              <Form.Control
                placeholder={t("clients.search")}
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
            <p>{t("clients.loading")}</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-5 text-center text-muted">
            <p>{t("clients.empty")}</p>
          </div>
        ) : (
          <>
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th className="ps-4">{t("clients.table.fullName")}</th>
                  <th>{t("clients.table.phone")}</th>
                  <th>{t("clients.table.email")}</th>
                  <th>{t("clients.table.status")}</th>
                  <th className="text-end pe-4">{t("clients.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((c) => (
                  <tr key={c.id}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-primary-soft text-primary d-flex align-items-center justify-content-center fw-bold overflow-hidden position-relative" style={{ width: 36, height: 36, fontSize: 13 }}>
                          {c.photoUrl ? (
                            <img 
                              src={getImageUrl(c.photoUrl)} 
                              alt={displayName(c)} 
                              className="w-100 h-100 object-fit-cover position-absolute"
                            />
                          ) : (
                            displayName(c).charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="fw-semibold">{displayName(c)}</span>
                      </div>
                    </td>
                    <td className="text-secondary">{c.phone || "—"}</td>
                    <td className="text-secondary">{c.email || "—"}</td>
                    <td className="align-middle">
                      {(() => {
                        const { status, days, visits } = getClientStatus(c, appointments);

                        if (status === "VIP") {
                          return (
                            <Badge bg="warning-soft" className="rounded-pill px-2.5 py-1.5 small fw-bold border border-warning border-opacity-10" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
                              👑 {t("clients.statuses.vip")} ({visits} {t("clients.statuses.visitsShort")})
                            </Badge>
                          );
                        } else if (status === "ACTIVO") {
                          return (
                            <Badge bg="success-soft" className="rounded-pill px-2.5 py-1.5 small fw-bold border border-success border-opacity-10" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
                              🟢 {t("clients.statuses.active")}
                            </Badge>
                          );
                        } else if (status === "INACTIVO") {
                          return (
                            <Badge bg="danger-soft" className="rounded-pill px-2.5 py-1.5 small fw-bold border border-danger border-opacity-10" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                              🔴 {t("clients.statuses.inactive")} ({days} {t("clients.statuses.daysShort")})
                            </Badge>
                          );
                        } else if (status === "FRECUENTE") {
                          return (
                            <Badge bg="primary-soft" className="rounded-pill px-2.5 py-1.5 small fw-bold border border-primary border-opacity-10" style={{ backgroundColor: "#ede9fe", color: "#6d4ae8" }}>
                              🟣 {t("clients.statuses.frequent", { defaultValue: "Frecuente" })} ({visits} {t("clients.statuses.visitsShort")})
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge bg="info-soft" className="rounded-pill px-2.5 py-1.5 small fw-bold border border-info border-opacity-10" style={{ backgroundColor: "#e0f2fe", color: "#075985" }}>
                              🔵 {t("clients.statuses.new")}
                            </Badge>
                          );
                        }
                      })()}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="rounded-lg p-2" 
                          onClick={() => { setSelectedDetailClient(c); setShowDetailModal(true); }}
                          disabled={busyId === c.id}
                          title={t("clients.actions.view")}
                        >
                          <BookOpen size={16} className="text-primary" />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          className="rounded-lg p-2"
                          onClick={() => openEdit(c)}
                          disabled={busyId === c.id}
                          title={t("clients.actions.edit")}
                        >
                          <Edit2 size={16} className="text-muted" />
                        </Button>
                        {hasPermission("clients.delete") && (
                          <Button
                            variant="light"
                            size="sm"
                            className="rounded-lg p-2 hover-danger"
                            onClick={() => handleDeleteLocal(c)}
                            disabled={busyId === c.id}
                            title={t("clients.actions.delete")}
                          >
                            <Trash2 size={16} className="text-danger" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="p-4 border-top d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                {t("clients.pagination", {
                  from: ((page - 1) * PAGE_SIZE) + 1,
                  to: Math.min(page * PAGE_SIZE, sorted.length),
                  total: sorted.length,
                })}
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
        onSaved={handleSavedLocal}
      />

      <ClientDetailModal
        show={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedDetailClient(null); }}
        client={selectedDetailClient}
        appointments={appointments}
        onPhotoUpdated={(clientId, photoUrl) => {
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, photoUrl } : c));
        }}
      />
    </div>
  );
}
