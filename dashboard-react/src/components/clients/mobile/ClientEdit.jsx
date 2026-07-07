import React, { useState, useEffect } from "react";
import { ChevronLeft, Camera, X } from "lucide-react";
import api from "../../../lib/api.js";

// Helper to parse virtual fields stored in client notes
const parseNotesField = (notesStr) => {
  let city = "";
  let birthdate = "";
  let statusVal = "";
  let cleanNotes = notesStr || "";

  const cityMatch = cleanNotes.match(/\[Ciudad:\s*([^\]]*)\]/);
  if (cityMatch) {
    city = cityMatch[1].trim();
    cleanNotes = cleanNotes.replace(/\[Ciudad:\s*([^\]]*)\]\n?/, "");
  }

  const birthdateMatch = cleanNotes.match(/\[Nacimiento:\s*([^\]]*)\]/);
  if (birthdateMatch) {
    birthdate = birthdateMatch[1].trim();
    cleanNotes = cleanNotes.replace(/\[Nacimiento:\s*([^\]]*)\]\n?/, "");
  }

  const statusMatch = cleanNotes.match(/\[Estado:\s*([^\]]*)\]/);
  if (statusMatch) {
    statusVal = statusMatch[1].trim();
    cleanNotes = cleanNotes.replace(/\[Estado:\s*([^\]]*)\]\n?/, "");
  }

  return { city, birthdate, statusVal, notes: cleanNotes.trim() };
};

const buildNotesField = (cleanNotes, city, birthdate, statusVal) => {
  let parts = [];
  if (city && city.trim()) parts.push(`[Ciudad: ${city.trim()}]`);
  if (birthdate && birthdate.trim()) parts.push(`[Nacimiento: ${birthdate.trim()}]`);
  if (statusVal && statusVal.trim() && statusVal !== "AUTO") parts.push(`[Estado: ${statusVal.trim()}]`);
  return [...parts, cleanNotes.trim()].join("\n");
};

export default function ClientEdit({ client, onNavigate, onBack, handleSaved }) {
  const isEdit = Boolean(client && client.id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [statusVal, setStatusVal] = useState("AUTO"); // AUTO | NUEVO | FRECUENTE | ACTIVO | INACTIVO | VIP
  const [notes, setNotes] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      const display = client.fullName || `${client.firstName || ""} ${client.lastName || ""}`.trim();
      setFullName(display);
      setEmail(client.email || "");
      setPhone(client.phone || "");
      
      const parsed = parseNotesField(client.notes);
      setCity(parsed.city);
      setBirthdate(parsed.birthdate);
      setStatusVal(parsed.statusVal || "AUTO");
      setNotes(parsed.notes);
    } else {
      setFullName("");
      setEmail("");
      setPhone("");
      setCity("");
      setBirthdate("");
      setStatusVal("AUTO");
      setNotes("");
    }
  }, [client, isEdit]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      return setError("El nombre completo es obligatorio.");
    }

    try {
      setError("");
      setSaving(true);

      // Split full name into first and last name
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || " ";

      // Build serialized notes containing virtual fields
      const serializedNotes = buildNotesField(notes, city, birthdate, statusVal);

      const payload = {
        firstName,
        lastName,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: serializedNotes || null,
        marketingConsent: client?.marketingConsent || false
      };

      const url = isEdit ? `/clients/${client.id}` : `/clients`;
      const res = isEdit ? await api.put(url, payload) : await api.post(url, payload);

      handleSaved(res.data);
      
      // If edit mode, return to details view, otherwise list view
      if (isEdit) {
        onNavigate("detail", res.data);
      } else {
        onNavigate("list");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Error al guardar el cliente. Verifique los campos.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!fullName) return "MA";
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", paddingBottom: "32px" }}>
      {/* Header */}
      <header className="c-header">
        <button className="c-back" onClick={onBack} aria-label="Volver" disabled={saving}>
          <ChevronLeft size={24} />
        </button>
        <span className="c-header__title">
          {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
        </span>
        <button 
          className="c-save" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? "..." : "Guardar"}
        </button>
      </header>

      {error && (
        <div style={{
          margin: "12px 16px",
          padding: "12px",
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "600"
        }}>
          {error}
        </div>
      )}

      <div className="c-edit">
        {/* Avatar centered */}
        <div className="c-edit__avatar-wrap">
          <div className="c-edit__avatar">
            {getInitials()}
            <div className="c-edit__cam">
              <Camera size={16} />
            </div>
          </div>
          <span className="c-edit__changephoto">Cambiar foto</span>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSave}>
          <div className="c-field">
            <label>Nombre completo *</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: María López" 
              required
            />
          </div>

          <div className="c-field">
            <label>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: maria@correo.com" 
            />
          </div>

          <div className="c-field">
            <label>Teléfono</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +59899123456" 
            />
          </div>

          <div className="c-field c-field--date">
            <label>Fecha de nacimiento</label>
            <input 
              type="date" 
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
            {birthdate && (
              <button 
                type="button" 
                className="c-clear" 
                onClick={() => setBirthdate("")}
                aria-label="Limpiar fecha"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="c-field">
            <label>Ciudad</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Montevideo" 
            />
          </div>

          <div className="c-field">
            <label>Estado del cliente</label>
            <select 
              value={statusVal} 
              onChange={(e) => setStatusVal(e.target.value)}
              style={{
                background: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236c757d%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E') no-repeat right 12px center/10px auto",
                appearance: "none"
              }}
            >
              <option value="AUTO">Automático (por historial)</option>
              <option value="NUEVO">Nuevo</option>
              <option value="FRECUENTE">Frecuente</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div className="c-field">
            <label>Notas</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas generales, preferencias, observaciones..."
            />
          </div>
        </form>
      </div>
    </div>
  );
}
