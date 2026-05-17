import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3001/api";

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
        res = await axios.get(`${API}/form-schemas/resolve/${schemaKey}`);
        setSchema({
          key: schemaKey,
          label: res.data?.schema?.label || schemaKey,
          fields: res.data?.fields || [],
          fieldRefs: res.data?.schema?.fieldRefs,
        });
      } else {
        res = await axios.get(`${API}/form-schemas/${schemaKey}`);
        setSchema(res.data);
      }
    } catch (e) {
      setError(e?.response?.data?.error || "No se pudo cargar el formulario.");
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
      const res = await axios.get(`${API}/form-schemas`);
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
