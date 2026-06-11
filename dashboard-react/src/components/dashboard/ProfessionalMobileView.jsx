import React, { useState, useEffect } from "react";
import { 
  Camera, 
  CheckCircle2, 
  Clock, 
  User, 
  Scissors, 
  ChevronLeft, 
  MessageSquare, 
  Image as ImageIcon, 
  UploadCloud, 
  AlertCircle,
  LogOut,
  Sparkles
} from "lucide-react";
import api from "../../lib/api.js";
import { useAuth } from "../../auth/AuthProvider.jsx";
import { useBrand } from "../../header/name/BrandProvider.jsx";

export default function ProfessionalMobileView() {
  const { logout, user } = useAuth();
  const { brand } = useBrand();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Selected appointment detail view state
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Upload/Camera state
  const [photoType, setPhotoType] = useState("after"); // default to "after"
  const [photoPreview, setPhotoPreview] = useState(null);
  const [note, setNote] = useState("");
  const [uploadQueue, setUploadQueue] = useState([]); // Array of { id, filename, progress, status, error }

  // Fetch professional appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/appointments");
      if (Array.isArray(res.data)) {
        // Filter for today's appointments (local client timezone matching startsAt)
        const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
        const filtered = res.data.filter(a => {
          if (!a.startsAt) return false;
          const apptDateStr = new Date(a.startsAt).toLocaleDateString("en-CA");
          return apptDateStr === todayStr && a.status !== "CANCELLED";
        });
        setAppointments(filtered);
      }
    } catch (err) {
      console.error("Error fetching professional appointments:", err);
      setError("No se pudieron cargar tus citas de hoy.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch client details & previous photos when selecting an appointment
  const handleSelectAppointment = async (appt) => {
    setSelectedAppt(appt);
    setPhotoPreview(null);
    setNote("");
    setClientProfile(null);
    
    try {
      setLoadingProfile(true);
      const res = await api.get(`/crm/${appt.clientId}`);
      if (res.data) {
        setClientProfile(res.data);
      }
    } catch (err) {
      console.error("Error fetching client profile details:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Convert File object to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle camera / file capture
  const handleCapturePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setPhotoPreview(base64);
    } catch (err) {
      console.error("Error reading captured image:", err);
      alert("Error al leer la imagen de la cámara.");
    }
  };

  // Upload photo in background
  const handleUpload = async () => {
    if (!photoPreview || !selectedAppt) return;

    const newUploadId = Date.now();
    const newUpload = {
      id: newUploadId,
      appointmentId: selectedAppt.id,
      clientName: `${selectedAppt.client?.firstName} ${selectedAppt.client?.lastName}`,
      photoType,
      progress: 10,
      status: "uploading",
      error: ""
    };

    // Add to background upload queue
    setUploadQueue(prev => [newUpload, ...prev]);
    
    // Clear current form so user can take another photo or go back
    const currentPhoto = photoPreview;
    const currentNote = note;
    const currentType = photoType;
    
    setPhotoPreview(null);
    setNote("");

    // Simulate/Perform upload asynchronously
    try {
      // Progress tick 1
      updateQueueProgress(newUploadId, 30);
      
      const payload = {
        photo: currentPhoto,
        photoType: currentType,
        note: currentNote
      };

      updateQueueProgress(newUploadId, 60);

      const res = await api.post(`/appointments/${selectedAppt.id}/photos`, payload);

      updateQueueProgress(newUploadId, 100, "success");

      // Reload client profile to display the new image in history
      if (clientProfile && clientProfile.client?.id === selectedAppt.clientId) {
        const updatedProfileRes = await api.get(`/crm/${selectedAppt.clientId}`);
        if (updatedProfileRes.data) {
          setClientProfile(updatedProfileRes.data);
        }
      }
    } catch (err) {
      console.error("Background upload failed:", err);
      const errMsg = err.response?.data?.error || "Error al subir la imagen.";
      updateQueueProgress(newUploadId, 100, "error", errMsg);
    }
  };

  const updateQueueProgress = (id, progress, status = "uploading", error = "") => {
    setUploadQueue(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, progress, status, error } 
          : item
      )
    );
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " hs";
  };

  const getPhotoTypeLabel = (type) => {
    const map = {
      before: "Antes",
      during: "Durante",
      after: "Después",
      final: "Resultado Final",
      other: "Otro"
    };
    return map[type] || "Otro";
  };

  const getPhotoTypeBadgeClass = (type) => {
    const map = {
      before: "bg-warning text-dark",
      during: "bg-info text-white",
      after: "bg-success text-white",
      final: "bg-purple text-white",
      other: "bg-secondary text-white"
    };
    return map[type] || "bg-secondary text-white";
  };

  return (
    <div 
      className="professional-mobile-container min-vh-100 d-flex flex-column text-dark"
      style={{
        background: "radial-gradient(circle at 50% 50%, #fbf9ff 0%, #f5efff 100%)",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* HEADER MÓVIL */}
      <header 
        className="px-3 py-3 border-bottom d-flex align-items-center justify-content-between shadow-sm sticky-top"
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(15px)",
          borderBottomColor: "rgba(124, 58, 237, 0.08)"
        }}
      >
        <div className="d-flex align-items-center gap-2.5">
          <div 
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
            style={{
              width: "36px",
              height: "36px",
              background: `linear-gradient(135deg, ${brand.accentColor || "#7c3aed"} 0%, #a78bfa 100%)`,
              fontSize: "13px"
            }}
          >
            {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : "PR"}
          </div>
          <div>
            <span className="text-muted d-block" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Profesional Activo
            </span>
            <strong className="text-dark small d-block" style={{ fontSize: "12.5px" }}>
              {user?.displayName || "Colaborador"}
            </strong>
          </div>
        </div>

        <button 
          onClick={logout}
          className="btn btn-link p-2 text-danger rounded-circle border-0 hover-scale bg-light"
          style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow-1 p-3 pb-5">
        
        {/* VISTA DETALLE DE CITA */}
        {selectedAppt ? (
          <div className="appt-detail-view animate-fade-in">
            {/* Botón Volver */}
            <button 
              onClick={() => setSelectedAppt(null)}
              className="btn btn-light rounded-pill px-3 py-2 mb-3.5 shadow-sm d-flex align-items-center gap-2 border border-purple-opacity text-secondary"
              style={{ fontSize: "12px", transition: "all 0.2s" }}
            >
              <ChevronLeft size={16} />
              <span>Volver a Mis Citas</span>
            </button>

            {/* Ficha de Cita Activa */}
            <div 
              className="card border-0 rounded-4 shadow-sm p-3.5 mb-4"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(124, 58, 237, 0.06)"
              }}
            >
              <h2 className="h5 fw-black text-dark mb-3 d-flex align-items-center gap-2">
                <Sparkles size={18} className="text-purple-600" style={{ color: brand.accentColor || "#7c3aed" }} />
                <span>Cita en Curso</span>
              </h2>

              <div className="d-flex align-items-start gap-3 border-bottom pb-3 mb-3">
                <div 
                  className="rounded-circle bg-light d-flex align-items-center justify-content-center text-purple" 
                  style={{ width: "40px", height: "40px", backgroundColor: "rgba(124, 58, 237, 0.06)", color: brand.accentColor || "#7c3aed" }}
                >
                  <User size={20} />
                </div>
                <div>
                  <span className="text-muted d-block small">Cliente</span>
                  <strong className="text-dark d-block h6 mb-0">
                    {selectedAppt.client?.firstName} {selectedAppt.client?.lastName}
                  </strong>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <span className="text-muted d-block small">Servicio Contratado</span>
                  <div className="d-flex align-items-center gap-1.5 mt-0.5 text-dark">
                    <Scissors size={14} className="text-muted" />
                    <span className="fw-semibold text-truncate small">{selectedAppt.service?.name}</span>
                  </div>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small">Horario</span>
                  <div className="d-flex align-items-center gap-1.5 mt-0.5 text-dark">
                    <Clock size={14} className="text-muted" />
                    <span className="fw-semibold small">{formatTime(selectedAppt.startsAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN CAPTURA DE FOTO */}
            <div 
              className="card border-0 rounded-4 shadow-sm p-3.5 mb-4"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)"
              }}
            >
              <h3 className="h6 fw-bold text-dark mb-3">Subir Registro Visual</h3>
              
              {/* SELECTOR DE TIPO */}
              <span className="text-muted d-block small mb-2">Fase del Servicio</span>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {["before", "during", "after", "final", "other"].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPhotoType(type)}
                    className={`btn rounded-pill px-3 py-1.5 small font-bold transition-all border-0 ${
                      photoType === type 
                        ? "bg-purple-600 text-white shadow-sm" 
                        : "bg-light text-secondary"
                    }`}
                    style={{ 
                      fontSize: "11px",
                      backgroundColor: photoType === type ? (brand.accentColor || "#7c3aed") : "rgba(240, 240, 240, 0.8)",
                      fontWeight: 600
                    }}
                  >
                    {getPhotoTypeLabel(type)}
                  </button>
                ))}
              </div>

              {/* DISPARADOR DE CÁMARA */}
              {!photoPreview ? (
                <div className="text-center py-4 rounded-4 border-2 border-dashed bg-light border-purple-opacity">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapturePhoto}
                    id="mobile-camera-capture"
                    className="d-none"
                  />
                  <label 
                    htmlFor="mobile-camera-capture"
                    className="btn btn-purple rounded-pill px-4.5 py-3 fw-bold d-inline-flex align-items-center gap-2 hover-scale text-white shadow border-0"
                    style={{
                      background: `linear-gradient(135deg, ${brand.accentColor || "#7c3aed"} 0%, #a78bfa 100%)`,
                      cursor: "pointer"
                    }}
                  >
                    <Camera size={20} />
                    <span>[Tomar Foto]</span>
                  </label>
                  <p className="text-muted small mt-2 mb-0" style={{ fontSize: "11px" }}>
                    Abre la cámara nativa del celular
                  </p>
                </div>
              ) : (
                <div className="photo-preview-container animate-fade-in">
                  <div className="position-relative rounded-4 overflow-hidden mb-3.5 bg-dark" style={{ maxHeight: "300px" }}>
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-100 d-block" 
                      style={{ objectFit: "contain", maxHeight: "300px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="btn btn-sm btn-dark rounded-circle position-absolute top-3 end-3 opacity-90 shadow"
                      style={{ width: "30px", height: "30px", padding: 0 }}
                    >
                      &times;
                    </button>
                  </div>

                  {/* NOTA OPCIONAL */}
                  <div className="form-group mb-3">
                    <label htmlFor="photo-note" className="text-muted small mb-1.5 d-flex align-items-center gap-1.5">
                      <MessageSquare size={13} />
                      <span>Nota opcional</span>
                    </label>
                    <textarea
                      id="photo-note"
                      rows={2}
                      className="form-control rounded-3 border-purple-opacity bg-white text-dark small"
                      placeholder="Escribe detalles del tratamiento o fórmula utilizada..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      style={{ fontSize: "12.5px" }}
                    />
                  </div>

                  {/* BOTÓN SUBIR */}
                  <button
                    type="button"
                    onClick={handleUpload}
                    className="btn btn-success w-100 rounded-pill py-2.5 fw-bold hover-scale shadow border-0"
                    style={{ fontSize: "13px" }}
                  >
                    Subir y Asociar Automáticamente
                  </button>
                </div>
              )}
            </div>

            {/* HISTORIAL VISUAL DE ESTE CLIENTE (Anterior y actual) */}
            <div 
              className="card border-0 rounded-4 shadow-sm p-3.5"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)"
              }}
            >
              <h3 className="h6 fw-bold text-dark mb-3">Historial Visual del Cliente</h3>

              {loadingProfile ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-purple" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : clientProfile && clientProfile.gallery && clientProfile.gallery.length > 0 ? (
                <div className="row g-2.5">
                  {clientProfile.gallery.map(p => (
                    <div className="col-4" key={p.id}>
                      <div className="position-relative rounded-3 overflow-hidden bg-light" style={{ paddingBottom: "100%" }}>
                        <img 
                          src={p.imageUrl.startsWith("/uploads/") ? `${api.defaults.baseURL?.replace(/\/api\/?$/, "")}${p.imageUrl}` : p.imageUrl} 
                          alt="Historial"
                          className="w-100 h-100 position-absolute start-0 top-0"
                          style={{ objectFit: "cover" }}
                        />
                        <span 
                          className="position-absolute bottom-1 start-1 px-1.5 py-0.5 rounded text-white"
                          style={{ 
                            fontSize: "7.5px", 
                            background: "rgba(0,0,0,0.6)",
                            fontWeight: 700
                          }}
                        >
                          {getPhotoTypeLabel(p.photoType || p.type)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted small">
                  Este cliente no registra fotos previas.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LISTADO DE CITAS DE HOY */
          <div className="appointments-list-view">
            <div className="mb-4">
              <span className="text-muted d-block small">Agenda del Día</span>
              <h2 className="fw-black text-dark h3" style={{ letterSpacing: "-0.03em" }}>
                Mis Citas del Día
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-purple" role="status" style={{ color: brand.accentColor || "#7c3aed" }}>
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger rounded-4 py-3 text-center small">
                {error}
              </div>
            ) : appointments.length === 0 ? (
              <div 
                className="text-center py-5 px-3 rounded-4"
                style={{
                  background: "rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(10px)",
                  border: "1.5px dashed rgba(124, 58, 237, 0.15)"
                }}
              >
                <div className="text-purple mb-2" style={{ color: brand.accentColor || "#7c3aed" }}>
                  <Clock size={32} className="opacity-50" />
                </div>
                <h3 className="h6 fw-bold text-dark">No tienes citas hoy</h3>
                <p className="text-secondary small mb-0">
                  Las citas agendadas y asignadas a tu perfil aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {appointments.map(appt => (
                  <div 
                    key={appt.id}
                    onClick={() => handleSelectAppointment(appt)}
                    className="card border-0 rounded-4 shadow-sm p-3 hover-scale text-start transition-all"
                    style={{
                      background: "rgba(255, 255, 255, 0.65)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(124, 58, 237, 0.05)",
                      cursor: "pointer"
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-light">
                      <div className="d-flex align-items-center gap-1.5 text-purple fw-bold" style={{ color: brand.accentColor || "#7c3aed", fontSize: "12.5px" }}>
                        <Clock size={14} />
                        <span>{formatTime(appt.startsAt)}</span>
                      </div>
                      <span className="badge rounded-pill bg-light text-secondary border px-2 py-1" style={{ fontSize: "9px" }}>
                        {appt.status}
                      </span>
                    </div>

                    <h3 className="h6 fw-black text-dark mb-1">
                      {appt.client?.firstName} {appt.client?.lastName}
                    </h3>
                    
                    <div className="d-flex align-items-center gap-1.5 text-muted small mt-1">
                      <Scissors size={12} />
                      <span style={{ fontSize: "11.5px" }}>{appt.service?.name}</span>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                      <button 
                        type="button" 
                        className="btn btn-purple rounded-pill px-3 py-1.5 small font-bold border-0 text-white"
                        style={{ 
                          fontSize: "11px",
                          background: `linear-gradient(135deg, ${brand.accentColor || "#7c3aed"} 0%, #a78bfa 100%)`
                        }}
                      >
                        Ver Cita
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COLA DE SUBIDAS EN SEGUNDO PLANO */}
        {uploadQueue.length > 0 && (
          <div 
            className="background-uploads-queue position-fixed bottom-0 start-0 w-100 p-3"
            style={{
              zIndex: 1050,
              background: "linear-gradient(to top, rgba(245, 239, 255, 0.95) 80%, rgba(245, 239, 255, 0) 100%)"
            }}
          >
            <div 
              className="card border-0 rounded-4 shadow-lg p-3 bg-white border-purple-opacity"
              style={{
                boxShadow: "0 -10px 30px rgba(124, 58, 237, 0.08)"
              }}
            >
              <h4 className="small font-bold text-dark mb-2.5 d-flex align-items-center gap-2">
                <UploadCloud size={16} className="text-purple-600 animate-pulse" style={{ color: brand.accentColor || "#7c3aed" }} />
                <span>Cargas en Segundo Plano ({uploadQueue.filter(q => q.status === "uploading").length})</span>
              </h4>
              
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
                {uploadQueue.map(item => (
                  <div key={item.id} className="small">
                    <div className="d-flex align-items-center justify-content-between text-secondary mb-1">
                      <span className="text-truncate" style={{ maxWidth: "150px" }}>
                        {item.clientName} ({getPhotoTypeLabel(item.photoType)})
                      </span>
                      {item.status === "success" && (
                        <span className="text-success d-flex align-items-center gap-1">
                          <CheckCircle2 size={12} /> Listo
                        </span>
                      )}
                      {item.status === "error" && (
                        <span className="text-danger d-flex align-items-center gap-1" title={item.error}>
                          <AlertCircle size={12} /> Falló
                        </span>
                      )}
                      {item.status === "uploading" && (
                        <span className="text-purple fw-semibold">{item.progress}%</span>
                      )}
                    </div>

                    <div className="progress rounded-pill" style={{ height: "4px" }}>
                      <div 
                        className={`progress-bar rounded-pill ${
                          item.status === "success" 
                            ? "bg-success" 
                            : item.status === "error" 
                              ? "bg-danger" 
                              : "bg-purple-600"
                        }`}
                        role="progressbar" 
                        style={{ 
                          width: `${item.progress}%`,
                          backgroundColor: item.status === "uploading" ? (brand.accentColor || "#7c3aed") : undefined
                        }}
                        aria-valuenow={item.progress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
