/** Combina catálogo + asignación en el cliente si hace falta */
export function resolveFieldsFromRegistry(registryFields, fieldRefs) {
  const registry = Array.isArray(registryFields) ? registryFields : [];
  const refs = Array.isArray(fieldRefs) ? fieldRefs : [];
  return refs
    .filter((r) => r.enabled !== false)
    .map((ref) => {
      const base = registry.find((f) => f.id === ref.id);
      if (!base) {
        return {
          id: ref.id,
          type: "text",
          label: ref.label || ref.id,
          required: !!ref.required,
          enabled: true,
          ...ref,
        };
      }
      return {
        ...base,
        ...ref,
        label: ref.label || base.label,
        required: ref.required ?? base.required ?? false,
        enabled: ref.enabled !== false,
      };
    });
}
