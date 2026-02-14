import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import "./worker-modal.css"; // ✅ crea este CSS (abajo)

const API = "http://localhost:3001/api";

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

const emptySchedule = DAYS.map((d) => ({
  dayOfWeek: d.key,
  active: d.key <= 5,
  startTime: "09:00",
  endTime: "18:00",
}));

export default function WorkerModal({
  show,
  onHide,
  mode = "create",
  initialData = null,
  onSaved,
  servicesFromParent = null,
}) {
  const isEdit = mode === "edit" && Boolean(initialData?.id);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [serviceIds, setServiceIds] = useState([]);
  const [schedule, setSchedule] = useState(emptySchedule);

  const [services, setServices] = useState([]);

  // cargar servicios
  useEffect(() => {
    if (!show) return;

    (async () => {
      try {
        setError("");
        if (servicesFromParent?.length) {
          setServices(servicesFromParent);
          return;
        }
        const res = await axios.get(`${API}/services`);
        setServices(safeArray(res.data));
      } catch (e) {
        setServices([]);
      }
    })();
  }, [show, servicesFromParent]);

  // hydrate al abrir
  useEffect(() => {
    if (!show) return;

    setError("");
    setSaving(false);

    if (isEdit) {
      setFirstName(initialData?.firstName || "");
      setLastName(initialData?.lastName || "");
      setServiceIds(safeArray(initialData?.serviceIds));

      const base = DAYS.map((d) => ({
        dayOfWeek: d.key,
        active: false,
        startTime: "09:00",
        endTime: "18:00",
      }));

      for (const sc of safeArray(initialData?.schedules)) {
        const idx = base.findIndex((x) => x.dayOfWeek === sc.dayOfWeek);
        if (idx !== -1) {
          base[idx] = {
            dayOfWeek: sc.dayOfWeek,
            active: true,
            startTime: sc.startTime || "09:00",
            endTime: sc.endTime || "18:00",
          };
        }
      }
      setSchedule(base);
    } else {
      setFirstName("");
      setLastName("");
      setServiceIds([]);
      setSchedule(emptySchedule);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isEdit, initialData?.id]);

  const selectedCount = serviceIds.length;

  const valid = useMemo(() => {
    const hasName = firstName.trim() && lastName.trim();
    const hasServices = selectedCount > 0;
    const hasDay = schedule.some((d) => d.active);
    return Boolean(hasName && hasServices && hasDay);
  }, [firstName, lastName, selectedCount, schedule]);

  const toggleService = (id) => {
    const sid = String(id);
    setServiceIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));
  };

  const setDayActive = (dayOfWeek, active) => {
    setSchedule((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, active } : d)));
  };

  const setDayTime = (dayOfWeek, key, value) => {
    setSchedule((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [key]: value } : d)));
  };

  const handleSave = async () => {
    try {
      setError("");
      if (!valid) return setError("Completa Nombre, Apellido, Servicios y al menos un día activo.");

      setSaving(true);

      const schedulesPayload = schedule
        .filter((d) => d.active)
        .map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }));

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        serviceIds,
        schedules: schedulesPayload,
      };

      const url = isEdit ? `${API}/workers/${initialData.id}` : `${API}/workers`;
      const res = isEdit ? await axios.put(url, payload) : await axios.post(url, payload);

      onSaved?.(res.data);
      onHide?.();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || (isEdit ? "Error actualizando trabajador." : "Error creando trabajador."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={!saving}
      dialogClassName="workerModalDialog" // ✅ para controlar ancho en CSS
    >
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{isEdit ? "Editar trabajador" : "Agregar trabajador"}</Modal.Title>
      </Modal.Header>

      <Modal.Body className="workerModalBody">
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Row className="g-3">
          <Col md={6}>
            <Form.Label>Nombre *</Form.Label>
            <Form.Control value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Col>

          <Col md={6}>
            <Form.Label>Apellido *</Form.Label>
            <Form.Control value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Col>

          <Col md={6}>
            <Form.Label>Servicios *</Form.Label>
            <div className="workerServicesBox">
              {safeArray(services)
                .filter((s) => s?.isActive !== false)
                .map((s) => (
                  <Form.Check
                    key={s.id}
                    type="checkbox"
                    id={`svc-${s.id}`}
                    checked={serviceIds.includes(String(s.id))}
                    onChange={() => toggleService(s.id)}
                    label={
                      <span className="workerServiceLabel">
                        <span className="fw-semibold">{s.name}</span>
                        <span className="text-muted"> · ${s.price} · {s.duration}m</span>
                      </span>
                    }
                    className="mb-2"
                  />
                ))}
            </div>

            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              Seleccionados: <b>{selectedCount}</b>
            </div>
          </Col>

          <Col md={6}>
            <Form.Label>Horario *</Form.Label>

            {/* ✅ GRID que NO se rompe */}
            <div className="workerScheduleGrid">
              {schedule.map((d) => (
                <div key={d.dayOfWeek} className={`workerScheduleRow ${d.active ? "" : "isOff"}`}>
                  <div className="workerScheduleLeft">
                    <Form.Check
                      type="switch"
                      id={`day-${d.dayOfWeek}`}
                      checked={!!d.active}
                      onChange={(e) => setDayActive(d.dayOfWeek, e.target.checked)}
                    />
                    <div className="fw-semibold">{DAYS.find((x) => x.key === d.dayOfWeek)?.label}</div>
                  </div>

                  <div className="workerScheduleRight">
                    <Form.Control
                      type="time"
                      value={d.startTime}
                      disabled={!d.active}
                      onChange={(e) => setDayTime(d.dayOfWeek, "startTime", e.target.value)}
                    />
                    <span className="text-muted">—</span>
                    <Form.Control
                      type="time"
                      value={d.endTime}
                      disabled={!d.active}
                      onChange={(e) => setDayTime(d.dayOfWeek, "endTime", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-muted mt-1" style={{ fontSize: 12 }}>
              Debe quedar al menos un día activo.
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleSave} disabled={!valid || saving}>
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Guardando…
            </>
          ) : isEdit ? (
            "Guardar cambios"
          ) : (
            "Guardar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}