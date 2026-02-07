import React, { useState } from "react";
import { useBrand } from "./useBrand";

export default function BrandSettings() {
  const { brand, setBrand } = useBrand();
  const [preview, setPreview] = useState(brand.coverImage || "");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result; // <-- base64 (data:image/...;base64,...)
      setPreview(dataUrl);

      // Guardar en el brand global
      setBrand((prev) => ({
        ...prev,
        coverImage: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="mt-6 space-y-3">
      <label className="block text-sm">Imagen del header</label>
      <input type="file" accept="image/*" onChange={handleImageChange} />

      {preview ? (
        <img
          src={preview}
          alt="preview"
          style={{ width: 240, height: 120, objectFit: "cover", borderRadius: 8 }}
        />
      ) : null}
    </section>
  );
}