import { useCallback, useEffect, useState } from "react";
import api from "../lib/api.js";
export function useFormSchema(schemaKey, { enabled = true } = {}) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!schemaKey) return;
    try {
      setLoading(true);
      setError("");
      let res;
      if (schemaKey.startsWith("assign.")) {
        res = await api.get(`/form-schemas/resolve/${schemaKey}`);
        setSchema({
          key: schemaKey,
          label: res.data?.schema?.label || schemaKey,
          fields: res.data?.fields || [],
          fieldRefs: res.data?.schema?.fieldRefs,
        });
      } else {
        res = await api.get(`/form-schemas/${schemaKey}`);
        setSchema(res.data);
      }
    } catch (e) {
      console.error("useFormSchema load error:", e);
      const detail = e?.response?.data?.error || e?.message || "";
      setError(detail ? `No se pudo cargar el formulario: ${detail}` : "No se pudo cargar el formulario.");
      setSchema(null);
    } finally {
      setLoading(false);
    }
  }, [schemaKey]);

  useEffect(() => {
    if (enabled && schemaKey) load();
  }, [enabled, schemaKey, load]);

  const enabledFields = (schema?.fields || []).filter((f) => f.enabled !== false);

  return { schema, enabledFields, loading, error, reload: load };
}

export function useFormSchemasList({ enabled = true } = {}) {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/form-schemas`);
      setSchemas(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSchemas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { schemas, loading, reload: load };
}
