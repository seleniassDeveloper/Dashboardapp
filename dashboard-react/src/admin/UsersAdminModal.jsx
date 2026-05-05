import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { useAuth } from "../auth/AuthProvider.jsx";

const API = "http://localhost:3001/api";

function fmt(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

export default function UsersAdminModal({ show, onHide }) {
  const { user, firebaseErrorMessage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");

  const [editUid, setEditUid] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editDisabled, setEditDisabled] = useState(false);
  const [editPassword, setEditPassword] = useState("");

  const selected = useMemo(() => users.find((u) => u.uid === editUid) || null, [users, editUid]);

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users`);
      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (e) {
      setError(e.response?.data?.error || "No se pudieron cargar usuarios. ¿Sos admin?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (show) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    if (!selected) return;
    setEditEmail(selected.email || "");
    setEditName(selected.displayName || "");
    setEditDisabled(Boolean(selected.disabled));
    setEditPassword("");
  }, [selected]);

  async function onCreate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/admin/users`, {
        email: createEmail,
        password: createPassword,
        displayName: createName || undefined,
      });
      setCreateEmail("");
      setCreatePassword("");
      setCreateName("");
      await refresh();
    } catch (e2) {
      setError(e2.response?.data?.error || "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  }

  async function onSave(e) {
    e.preventDefault();
    if (!editUid) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        email: editEmail || undefined,
        displayName: editName ?? undefined,
        disabled: Boolean(editDisabled),
        password: editPassword ? editPassword : undefined,
      };
      await axios.patch(`${API}/admin/users/${editUid}`, payload);
      await refresh();
    } catch (e2) {
      setError(e2.response?.data?.error || "No se pudo actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(uid) {
    if (!uid) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm("¿Eliminar usuario definitivamente?")) return;
    setError("");
    setLoading(true);
    try {
      await axios.delete(`${API}/admin/users/${uid}`);
      if (uid === editUid) setEditUid("");
      await refresh();
    } catch (e2) {
      setError(e2.response?.data?.error || "No se pudo eliminar el usuario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Usuarios (Firebase Auth)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-muted small mb-3">
          Sesión actual: <strong>{user?.email || firebaseErrorMessage({ message: "sin email" })}</strong>
        </div>

        {error ? <div className="alert alert-danger py-2 small">{error}</div> : null}

        <div className="row g-3">
          <div className="col-lg-7">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="fw-semibold">Lista</div>
              <Button size="sm" variant="outline-primary" onClick={refresh} disabled={loading}>
                {loading ? "Cargando…" : "Actualizar"}
              </Button>
            </div>
            <Table striped hover responsive size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Providers</th>
                  <th>Creado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.uid}
                    style={{ cursor: "pointer", opacity: u.disabled ? 0.6 : 1 }}
                    onClick={() => setEditUid(u.uid)}
                  >
                    <td>{u.email || <span className="text-muted">sin email</span>}</td>
                    <td>{u.displayName || <span className="text-muted">—</span>}</td>
                    <td className="text-muted">{(u.providerIds || []).join(", ")}</td>
                    <td className="text-muted">{fmt(u.creationTime)}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onDelete(u.uid);
                        }}
                        disabled={loading}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted">
                      Sin usuarios (o no tenés permisos).
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </div>

          <div className="col-lg-5">
            <div className="fw-semibold mb-2">Crear usuario</div>
            <Form onSubmit={onCreate} className="mb-4">
              <Form.Group className="mb-2">
                <Form.Label className="small">Email</Form.Label>
                <Form.Control value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small">Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  minLength={6}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">Mínimo 6 caracteres (Firebase).</Form.Text>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small">Nombre (opcional)</Form.Label>
                <Form.Control value={createName} onChange={(e) => setCreateName(e.target.value)} />
              </Form.Group>
              <Button type="submit" variant="success" className="w-100" disabled={loading}>
                Crear
              </Button>
            </Form>

            <div className="fw-semibold mb-2">Editar usuario</div>
            {!editUid ? (
              <div className="text-muted small">Seleccioná un usuario de la tabla.</div>
            ) : (
              <Form onSubmit={onSave}>
                <div className="text-muted small mb-2">
                  UID: <code>{editUid}</code>
                </div>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Email</Form.Label>
                  <Form.Control value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small">Nombre</Form.Label>
                  <Form.Control value={editName} onChange={(e) => setEditName(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Check
                    type="switch"
                    id="user-disabled"
                    label="Usuario deshabilitado"
                    checked={editDisabled}
                    onChange={(e) => setEditDisabled(e.target.checked)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Nueva contraseña (opcional)</Form.Label>
                  <Form.Control
                    type="password"
                    minLength={6}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Dejar vacío para no cambiar"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  Guardar cambios
                </Button>
              </Form>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}

