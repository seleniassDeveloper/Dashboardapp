import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Alert, Spinner } from "react-bootstrap";
import { useFormSchema } from "../../hooks/useFormSchema.js";
import DynamicForm, {
  buildEmptyWorkerValues,
  workerToFormValues,
  validateDynamicForm,
  formValuesToWorkerPayload,
} from "../../components/configurable-fields/DynamicForm.jsx";
import "./worker-modal.css";
import api from "../../lib/api.js";

export default function WorkerFormModal({
  show,
  onHide,
  mode = "create",
  initialData = null,
  onSaved,
}) {
  const isEdit = mode === "edit" && Boolean(initialData?.id);
  const schemaKey = isEdit ? "assign.worker.form.edit" : "assign.worker.form.create";

  const { enabledFields, loading: schemaLoading, error: schemaError } = useFormSchema(schemaKey, {
    enabled: show,
  });

  const [values, setValues] = useState(buildEmptyWorkerValues);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setError("");
    setErrors({});
    setSaving(false);
    setValues(isEdit ? workerToFormValues(initialData) : buildEmptyWorkerValues());
  }, [show, isEdit, initialData?.id]);

  const valid = useMemo(() => {
    const e = validateDynamicForm(enabledFields, values);
    return Object.keys(e).length === 0;
  }, [enabledFields, values]);

  const handleSave = async () => {
    const fieldErrors = validateDynamicForm(enabledFields, values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) {
      setError("Revisá los campos marcados.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = formValuesToWorkerPayload(values, enabledFields);
      const url = isEdit ? `/workers/${initialData.id}` : `/workers`;
      const res = isEdit ? await api.put(url, payload) : await api.post(url, payload);
      onSaved?.(res.data);
      onHide?.();
    } catch (e) {
      setError(e?.response?.data?.error || "Error guardando empleado.");
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
      dialogClassName="workerModalDialog"
    >
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{isEdit ? "Editar miembro del equipo" : "Añadir miembro"}</Modal.Title>
      </Modal.Header>

      <Modal.Body className="workerModalBody">
        {schemaError && <Alert variant="warning">{schemaError}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {schemaLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="text-muted mt-2 small">Cargando formulario…</p>
          </div>
        ) : (
          <DynamicForm
            enabledFields={enabledFields}
            values={values}
            onChange={setValues}
            errors={errors}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="dark" onClick={handleSave} disabled={!valid || saving || schemaLoading}>
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Guardando…
            </>
          ) : isEdit ? (
            "Guardar cambios"
          ) : (
            "Agregar al equipo"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
