import React, { useEffect, useMemo, useState } from "react";
import { Form, Row, Col, Spinner } from "react-bootstrap";
import "../../header/workers/worker-modal.css";
import api from "../../lib/api.js";

const safeArray = (x) => (Array.isArray(x) ? x : []);

const DAYS = [
  { key: 1, label: "Lunes" },
  { key: 2, label: "Martes" },
  { key: 3, label: "Miércoles" },
  { key: 4, label: "Jueves" },
  { key: 5, label: "Viernes" },
  { key: 6, label: "Sábado" },
  { key: 7, label: "Domingo" },
];

const ROOT_VALUE_FIELDS = new Set(["firstName", "lastName", "email", "phone", "roleTitle"]);

const emptySchedule = DAYS.map((d) => ({
  dayOfWeek: d.key,
  active: d.key <= 5,
  startTime: "09:00",
  endTime: "18:00",
}));

export function buildEmptyWorkerValues() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleTitle: "",
    serviceIds: [],
    servicePricing: {},
    schedule: emptySchedule.map((d) => ({ ...d })),
    customFields: {},
  };
}

export function workerToFormValues(worker) {
  if (!worker) return buildEmptyWorkerValues();

  const base = DAYS.map((d) => ({
    dayOfWeek: d.key,
    active: false,
    startTime: "09:00",
    endTime: "18:00",
  }));

  for (const sc of safeArray(worker.schedules)) {
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

  return {
    firstName: worker.firstName || "",
    lastName: worker.lastName || "",
    email: worker.email || "",
    phone: worker.phone || "",
    roleTitle: worker.roleTitle || "",
    serviceIds: safeArray(worker.serviceIds).map(String),
    servicePricing: worker.servicePricing || {},
    schedule: base,
    customFields: worker.customFields || {},
  };
}

export function validateDynamicForm(enabledFields, values) {
  const errors = {};

  for (const field of enabledFields) {
    const id = field.id;
    const required = field.required === true;

    if (field.type === "services") {
      if (required && !values.serviceIds?.length) errors[id] = "Seleccioná al menos un servicio.";
      continue;
    }
    if (field.type === "schedule") {
      if (required && !values.schedule?.some((d) => d.active)) {
        errors[id] = "Activá al menos un día de trabajo.";
      }
      continue;
    }
    if (field.type === "servicePricing") continue;

    if (field.system && (id === "firstName" || id === "lastName")) {
      if (required && !String(values[id] || "").trim()) errors[id] = "Campo obligatorio.";
      continue;
    }

    const v = ROOT_VALUE_FIELDS.has(id) ? values[id] : values.customFields?.[id];
    if (required && (v === undefined || v === null || String(v).trim() === "")) {
      errors[id] = "Campo obligatorio.";
    }
  }

  return errors;
}

export function formValuesToWorkerPayload(values, enabledFields) {
  const customFields = {};
  for (const f of enabledFields) {
    if (!f.system && f.type !== "services" && f.type !== "schedule" && f.type !== "servicePricing") {
      const v = values.customFields?.[f.id];
      if (v !== undefined && v !== "") customFields[f.id] = v;
    }
  }

  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    roleTitle: values.roleTitle?.trim() || null,
    customFields,
    serviceIds: values.serviceIds,
    servicePricing: values.servicePricing,
    schedules: values.schedule
      .filter((d) => d.active)
      .map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
  };
}

export default function DynamicForm({ enabledFields, values, onChange, errors = {} }) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const needsServices = enabledFields.some((f) => f.type === "services" || f.type === "servicePricing");

  useEffect(() => {
    if (!needsServices) return;
    (async () => {
      try {
        setLoadingServices(true);
        const res = await api.get(`/services`);
        setServices(safeArray(res.data).filter((s) => s?.isActive !== false));
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    })();
  }, [needsServices]);

  const setValue = (key, val) => onChange({ ...values, [key]: val });
  const setCustom = (id, val) =>
    onChange({ ...values, customFields: { ...values.customFields, [id]: val } });

  const selectedServices = useMemo(
    () => services.filter((s) => values.serviceIds.includes(String(s.id))),
    [services, values.serviceIds]
  );

  const toggleService = (id) => {
    const sid = String(id);
    const next = values.serviceIds.includes(sid)
      ? values.serviceIds.filter((x) => x !== sid)
      : [...values.serviceIds, sid];
    const pricing = { ...values.servicePricing };
    if (!next.includes(sid)) delete pricing[sid];
    onChange({ ...values, serviceIds: next, servicePricing: pricing });
  };

  const setDayActive = (dayOfWeek, active) => {
    onChange({
      ...values,
      schedule: values.schedule.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, active } : d)),
    });
  };

  const setDayTime = (dayOfWeek, key, val) => {
    onChange({
      ...values,
      schedule: values.schedule.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [key]: val } : d)),
    });
  };

  const bySection = useMemo(() => {
    const map = {};
    for (const f of enabledFields) {
      const sec = f.section || "otro";
      if (!map[sec]) map[sec] = [];
      map[sec].push(f);
    }
    return map;
  }, [enabledFields]);

  const sectionOrder = ["datos", "contacto", "trabajo", "otro"];
  const sectionTitles = {
    datos: "Datos personales",
    contacto: "Contacto",
    trabajo: "Trabajo y horarios",
    otro: "Información adicional",
  };

  function renderField(field, index) {
    const err = errors[field.id];
    const label = (
      <>
        {field.label}
        {field.required ? " *" : ""}
      </>
    );

    const groupKey = `${field.entity || "worker"}-${field.name || field.id}-${field.id || index}`;

    if (field.type === "services") {
      return (
        <Form.Group key={groupKey} className="mb-3">
          <Form.Label>{label}</Form.Label>
          {loadingServices ? (
            <Spinner size="sm" />
          ) : (
            <div className="workerServicesBox">
              {services.map((s) => (
                <Form.Check
                  key={s.id}
                  type="checkbox"
                  id={`dyn-svc-${s.id}`}
                  checked={values.serviceIds.includes(String(s.id))}
                  onChange={() => toggleService(s.id)}
                  label={
                    <span>
                      <span className="fw-semibold">{s.name}</span>
                      <span className="text-muted"> · ${s.price} · {s.duration}m</span>
                    </span>
                  }
                  className="mb-2"
                />
              ))}
            </div>
          )}
          {err && <div className="text-danger small">{err}</div>}
        </Form.Group>
      );
    }

    if (field.type === "servicePricing") {
      if (!values.serviceIds.length) return null;
      return (
        <Form.Group key={`${field.entity || "worker"}-${field.name || field.id}-${field.id || index}`} className="mb-3">
          <Form.Label>{label}</Form.Label>
          {field.help && <div className="text-muted small mb-2">{field.help}</div>}
          <div className="d-flex flex-column gap-2">
            {selectedServices.map((s) => (
              <div key={s.id} className="d-flex align-items-center gap-2">
                <span className="small flex-grow-1">{s.name}</span>
                <span className="text-muted small">Base ${s.price}</span>
                <Form.Control
                  type="number"
                  size="sm"
                  style={{ width: 120 }}
                  placeholder="Personalizado"
                  value={values.servicePricing[String(s.id)] ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...values,
                      servicePricing: {
                        ...values.servicePricing,
                        [String(s.id)]: e.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </Form.Group>
      );
    }

    if (field.type === "schedule") {
      return (
        <Form.Group key={`${field.entity || "worker"}-${field.name || field.id}-${field.id || index}`} className="mb-3">
          <Form.Label>{label}</Form.Label>
          <div className="workerScheduleGrid">
            {values.schedule.map((d) => (
              <div key={d.dayOfWeek} className={`workerScheduleRow ${d.active ? "" : "isOff"}`}>
                <div className="workerScheduleLeft">
                  <Form.Check
                    type="switch"
                    checked={!!d.active}
                    onChange={(e) => setDayActive(d.dayOfWeek, e.target.checked)}
                  />
                  <div className="fw-semibold">{DAYS.find((x) => x.key === d.dayOfWeek)?.label}</div>
                </div>
                <div className="workerScheduleRight">
                  <div className="workerScheduleTimeField">
                    <span className="workerScheduleTimeLabel">Desde</span>
                    <Form.Control
                      type="time"
                      aria-label={`${DAYS.find((x) => x.key === d.dayOfWeek)?.label} — hora de inicio`}
                      value={d.startTime}
                      disabled={!d.active}
                      onChange={(e) => setDayTime(d.dayOfWeek, "startTime", e.target.value)}
                    />
                  </div>
                  <span className="text-muted">—</span>
                  <div className="workerScheduleTimeField">
                    <span className="workerScheduleTimeLabel">Hasta</span>
                    <Form.Control
                      type="time"
                      aria-label={`${DAYS.find((x) => x.key === d.dayOfWeek)?.label} — hora de fin`}
                      value={d.endTime}
                      disabled={!d.active}
                      onChange={(e) => setDayTime(d.dayOfWeek, "endTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {err && <div className="text-danger small mt-1">{err}</div>}
        </Form.Group>
      );
    }

    const useRoot = ROOT_VALUE_FIELDS.has(field.id) || field.system;
    const commonProps = {
      value: useRoot ? values[field.id] ?? "" : values.customFields?.[field.id] ?? "",
      onChange: (e) =>
        useRoot ? setValue(field.id, e.target.value) : setCustom(field.id, e.target.value),
      placeholder: field.placeholder || "",
      isInvalid: Boolean(err),
    };

    let control;
    switch (field.type) {
      case "textarea":
        control = <Form.Control as="textarea" rows={2} {...commonProps} />;
        break;
      case "number":
      case "currency":
        control = <Form.Control type="number" {...commonProps} />;
        break;
      case "select":
        control = (
          <Form.Select {...commonProps}>
            <option value="">Seleccionar…</option>
            {safeArray(field.options).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        );
        break;
      case "email":
        control = <Form.Control type="email" {...commonProps} />;
        break;
      case "phone":
        control = <Form.Control type="tel" {...commonProps} />;
        break;
      default:
        control = <Form.Control {...commonProps} />;
    }

    return (
      <Form.Group key={`${field.entity || "worker"}-${field.name || field.id}-${field.id || index}`} className="mb-3">
        <Form.Label>{label}</Form.Label>
        {control}
        {field.help && <Form.Text muted>{field.help}</Form.Text>}
        {err && <div className="text-danger small">{err}</div>}
      </Form.Group>
    );
  }

  return (
    <div className="dynamic-form custom-form">
      {sectionOrder.map((sec) => {
        const fields = bySection[sec];
        if (!fields?.length) return null;
        return (
          <div key={sec} className="mb-4">
            <h6 className="text-uppercase text-muted small fw-bold mb-3">{sectionTitles[sec] || sec}</h6>
            <Row className="g-2">
              {fields.map((field, index) => {
                const wide = field.type === "services" || field.type === "schedule" || field.type === "servicePricing";
                const compositeKey = `${field.entity || "worker"}-${field.name || field.id}-${field.id || index}`;
                return (
                  <Col key={compositeKey} md={wide ? 12 : 6}>
                    {renderField(field, index)}
                  </Col>
                );
              })}
            </Row>
          </div>
        );
      })}
    </div>
  );
}
