import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Row, Col, Card, Badge, Table, Button, Form, Alert, ProgressBar, Spinner } from "react-bootstrap";
import { 
  Calendar, CreditCard, Clock, MessageCircle, Cake, Sparkles, 
  AlertTriangle, ArrowRight, BookOpen, Activity, Award, User, 
  Heart, ShoppingBag, ShieldCheck, Save, FileText, CheckCircle,
  Plus, Printer, Camera, Upload, X, RotateCw, Image as ImageIcon
} from "lucide-react";
import { API_BASE_URL } from "../../lib/api.js";
import api from "../../lib/api.js";
import { usePermissions } from "../../auth/PermissionProvider.jsx";
import { useBusiness } from "../../auth/BusinessContext.jsx";
import { useTranslation } from "react-i18next";

function currency(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const host = API_BASE_URL.replace(/\/api$/, "");
  return `${host}${url}`;
};

export default function ClientDetailModal({ show, onHide, client, appointments = [], onPhotoUpdated }) {
  const { t } = useTranslation("views");
  const { hasPermission } = usePermissions();
  const { business } = useBusiness();
  const navigate = useNavigate();
  
  const canViewNotes = hasPermission("clients.privateNotes.view");
  const canEditNotes = hasPermission("clients.privateNotes.edit");
  const canViewFinance = hasPermission("clients.financialHistory.view");

  // Permisos de Historial Clínico
  const canViewClinical = hasPermission("clients.clinical.view");
  const canCreateClinical = hasPermission("clients.clinical.create");
  const canEditClinical = hasPermission("clients.clinical.edit");
  const canDeleteClinical = hasPermission("clients.clinical.delete");

  const [crmData, setCrmData] = useState(null);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [errorCrm, setErrorCrm] = useState("");
  const [activeTab, setActiveTab] = useState("resumen");
  const [lightboxImage, setLightboxImage] = useState(null);

  // Estados y efectos para foto de perfil / cámara
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState("");
  const [avatarHover, setAvatarHover] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null); // base64
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (client) {
      setCurrentPhotoUrl(client.photoUrl || "");
    }
  }, [client]);

  useEffect(() => {
    if (crmData?.client) {
      setCurrentPhotoUrl(crmData.client.photoUrl || "");
    }
  }, [crmData]);

  const startCamera = async () => {
    try {
      setUploadError("");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      setVideoStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setUploadError("No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios.");
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const size = Math.min(video.videoWidth, video.videoHeight) || 480;
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext("2d");
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedImage(base64);
      stopCamera();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!capturedImage) return;
    try {
      setUploading(true);
      setUploadError("");
      const res = await api.put(`/clients/${client.id}/photo`, { photo: capturedImage });
      
      const newPhotoUrl = res.data.photoUrl;
      setCurrentPhotoUrl(newPhotoUrl);
      
      if (crmData?.client) {
        setCrmData(prev => ({
          ...prev,
          client: {
            ...prev.client,
            photoUrl: newPhotoUrl
          }
        }));
      }

      if (onPhotoUpdated) {
        onPhotoUpdated(client.id, newPhotoUrl);
      }

      setShowPhotoModal(false);
      setCapturedImage(null);
    } catch (err) {
      console.error("Error uploading photo:", err);
      setUploadError(err?.response?.data?.error || "Error al subir la foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  const closePhotoModal = () => {
    stopCamera();
    setCapturedImage(null);
    setUploadError("");
    setShowPhotoModal(false);
  };

  const handleCloseDetailModal = () => {
    stopCamera();
    onHide();
  };
  // Edición de Notas Generales / Fórmulas
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedStatus, setNotesSavedStatus] = useState(""); // "success" | "error" | ""

  // Campos estructurados de preferencias para estética
  const [preferences, setPreferences] = useState("");
  const [allergiesText, setAllergiesText] = useState("");
  const [favoriteProducts, setFavoriteProducts] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Lógica Adaptativa por Rubro (isMedicalBusiness)
  const isMedical = useMemo(() => {
    const medicalModels = [
      "dentistry",
      "medical_clinic",
      "dermatology",
      "aesthetic_clinic",
      "medical_spa",
      "physiotherapy",
      "nutrition",
      "psychology"
    ];

    const model = String(business?.model || "").toLowerCase().trim();
    if (model && medicalModels.includes(model)) return true;

    const industry = String(business?.industry || "").toLowerCase().trim();
    if (!industry) return false;

    // Check aesthetic keywords for exclusions
    const aestheticKeywords = [
      "salon", "estetica", "estética", "barberia", "barbería", "spa", "nails", "uñas", "beauty", "peluqueria", "peluquería"
    ];
    if (aestheticKeywords.some(kw => industry.includes(kw))) {
      return false;
    }

    const clinicalKeywords = [
      "dentistry", "medical_clinic", "dermatology", "aesthetic_clinic", "medical_spa",
      "physiotherapy", "nutrition", "psychology",
      "odontologia", "odontología", "clínica", "clinica", "medicina", "veterinaria", "fisioterapia", "nutricion", "nutrición", "psicologia", "psicología"
    ];
    return clinicalKeywords.some(kw => industry.includes(kw));
  }, [business]);

  const requiresClinicalHistory = isMedical;

  // Consentimientos (Digital Consent) states
  const [consentsList, setConsentsList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [loadingConsents, setLoadingConsents] = useState(false);
  const [consentTemplates, setConsentTemplates] = useState([]);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [requestChannel, setRequestChannel] = useState("link");
  const [generatedRequest, setGeneratedRequest] = useState(null);

  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
  const [activeRecordDetails, setActiveRecordDetails] = useState(null);
  const [loadingRecordDetail, setLoadingRecordDetail] = useState(false);

  // Historial Clínico CRUD states
  const [clinicalEntries, setClinicalEntries] = useState([]);
  const [loadingClinical, setLoadingClinical] = useState(false);
  const [errorClinical, setErrorClinical] = useState("");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Campos de formulario clínico
  const [entryType, setEntryType] = useState("clinical");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  
  // formulaData (hair)
  const [colorFormula, setColorFormula] = useState("");
  const [oxidant, setOxidant] = useState("");
  const [exposureTime, setExposureTime] = useState("");
  const [brandUsed, setBrandUsed] = useState("");
  const [techniqueApplied, setTechniqueApplied] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [postServiceObs, setPostServiceObs] = useState("");

  // dentistry
  const [toothPiece, setToothPiece] = useState("");
  const [dentistryDiagnosis, setDentistryDiagnosis] = useState("");
  const [procedureApplied, setProcedureApplied] = useState("");
  const [materialUsed, setMaterialUsed] = useState("");
  const [evolutionStatus, setEvolutionStatus] = useState("");
  const [nextAppointmentDate, setNextAppointmentDate] = useState("");

  // aesthetic
  const [treatmentType, setTreatmentType] = useState("");
  const [productUsed, setProductUsed] = useState("");
  const [treatedZone, setTreatedZone] = useState("");
  const [intensityFrequency, setIntensityFrequency] = useState("");
  const [clientReaction, setClientReaction] = useState("");
  const [aestheticRecommendations, setAestheticRecommendations] = useState("");

  // clinicalData (clinical)
  const [antecedents, setAntecedents] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicationActual, setMedicationActual] = useState("");
  const [contraindications, setContraindications] = useState("");
  const [clinicalObs, setClinicalObs] = useState("");
  const [diagnosticMotive, setDiagnosticMotive] = useState("");
  const [treatmentsDone, setTreatmentsDone] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  const fetchClinicalHistory = useCallback(async () => {
    if (!client?.id || !canViewClinical) return;
    try {
      setLoadingClinical(true);
      setErrorClinical("");
      const res = await api.get(`/clients/${client.id}/clinical-history`);
      setClinicalEntries(res.data || []);
    } catch (err) {
      console.error("Error al cargar historial clínico:", err);
      setErrorClinical("No se pudo cargar el historial clínico y fórmulas del cliente.");
    } finally {
      setLoadingClinical(false);
    }
  }, [client?.id, canViewClinical]);

  useEffect(() => {
    if (show && client?.id && requiresClinicalHistory && canViewClinical) {
      fetchClinicalHistory();
    }
  }, [show, client?.id, requiresClinicalHistory, canViewClinical, fetchClinicalHistory]);

  const fetchConsentData = useCallback(async () => {
    if (!client?.id) return;
    try {
      setLoadingConsents(true);
      const [recordsRes, requestsRes, templatesRes] = await Promise.all([
        api.get(`/consents/records?clientId=${client.id}`),
        api.get(`/consents/requests?clientId=${client.id}`),
        api.get("/consents/templates")
      ]);
      setConsentsList(recordsRes.data || []);
      setRequestsList(requestsRes.data || []);
      setConsentTemplates(templatesRes.data || []);
    } catch (err) {
      console.error("Error al cargar consentimientos:", err);
    } finally {
      setLoadingConsents(false);
    }
  }, [client?.id]);

  useEffect(() => {
    if (show && client?.id && activeTab === "consentimientos") {
      fetchConsentData();
    }
  }, [show, client?.id, activeTab, fetchConsentData]);

  const handleOpenNewEntry = () => {
    setEditingEntry(null);
    setEntryNotes("");
    setAppointmentId("");
    
    const model = String(business?.model || business?.industry || "").toLowerCase();
    if (model.includes("dent") || model.includes("odont")) {
      setEntryType("dentistry");
      setEntryTitle("Consulta Odontológica");
    } else if (model.includes("hair") || model.includes("pelu") || model.includes("beauty") || model.includes("salon")) {
      setEntryType("hair_formula");
      setEntryTitle("Fórmula de Color");
    } else if (model.includes("estet") || model.includes("aesthetic") || model.includes("spa") || model.includes("dermat")) {
      setEntryType("aesthetic");
      setEntryTitle("Tratamiento de Estética");
    } else {
      setEntryType("clinical");
      setEntryTitle("Evolución Clínica General");
    }

    setColorFormula(""); setOxidant(""); setExposureTime(""); setBrandUsed(""); setTechniqueApplied(""); setExpectedResult(""); setPostServiceObs("");
    setToothPiece(""); setDentistryDiagnosis(""); setProcedureApplied(""); setMaterialUsed(""); setEvolutionStatus(""); setNextAppointmentDate("");
    setTreatmentType(""); setProductUsed(""); setTreatedZone(""); setIntensityFrequency(""); setClientReaction(""); setAestheticRecommendations("");
    setAntecedents(""); setAllergies(""); setMedicationActual(""); setContraindications(""); setClinicalObs(""); setDiagnosticMotive(""); setTreatmentsDone(""); setNextFollowUp("");

    setShowEntryModal(true);
  };

  const handleOpenEditEntry = (entry) => {
    setEditingEntry(entry);
    setEntryType(entry.type);
    setEntryTitle(entry.title || "");
    setEntryNotes(entry.notes || "");
    setAppointmentId(entry.appointmentId || "");

    const fd = entry.formulaData || {};
    const cd = entry.clinicalData || {};

    // hair
    setColorFormula(fd.colorFormula || "");
    setOxidant(fd.oxidant || "");
    setExposureTime(fd.exposureTime || "");
    setBrandUsed(fd.brandUsed || "");
    setTechniqueApplied(fd.techniqueApplied || "");
    setExpectedResult(fd.expectedResult || "");
    setPostServiceObs(fd.postServiceObs || "");

    // dentistry
    setToothPiece(fd.toothPiece || "");
    setDentistryDiagnosis(fd.dentistryDiagnosis || "");
    setProcedureApplied(fd.procedureApplied || "");
    setMaterialUsed(fd.materialUsed || "");
    setEvolutionStatus(fd.evolutionStatus || "");
    setNextAppointmentDate(fd.nextAppointmentDate || "");

    // aesthetic
    setTreatmentType(fd.treatmentType || "");
    setProductUsed(fd.productUsed || "");
    setTreatedZone(fd.treatedZone || "");
    setIntensityFrequency(fd.intensityFrequency || "");
    setClientReaction(fd.clientReaction || "");
    setAestheticRecommendations(fd.aestheticRecommendations || "");

    // clinical
    setAntecedents(cd.antecedents || "");
    setAllergies(cd.allergies || "");
    setMedicationActual(cd.medicationActual || "");
    setContraindications(cd.contraindications || "");
    setClinicalObs(cd.clinicalObs || "");
    setDiagnosticMotive(cd.diagnosticMotive || "");
    setTreatmentsDone(cd.treatmentsDone || "");
    setNextFollowUp(cd.nextFollowUp || "");

    setShowEntryModal(true);
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    if (!entryTitle || !entryType) return;

    const formulaData = {};
    const clinicalData = {};

    if (entryType === "hair_formula") {
      formulaData.colorFormula = colorFormula;
      formulaData.oxidant = oxidant;
      formulaData.exposureTime = exposureTime;
      formulaData.brandUsed = brandUsed;
      formulaData.techniqueApplied = techniqueApplied;
      formulaData.expectedResult = expectedResult;
      formulaData.postServiceObs = postServiceObs;
    } else if (entryType === "dentistry") {
      formulaData.toothPiece = toothPiece;
      formulaData.dentistryDiagnosis = dentistryDiagnosis;
      formulaData.procedureApplied = procedureApplied;
      formulaData.materialUsed = materialUsed;
      formulaData.evolutionStatus = evolutionStatus;
      formulaData.nextAppointmentDate = nextAppointmentDate;
    } else if (entryType === "aesthetic") {
      formulaData.treatmentType = treatmentType;
      formulaData.productUsed = productUsed;
      formulaData.treatedZone = treatedZone;
      formulaData.intensityFrequency = intensityFrequency;
      formulaData.clientReaction = clientReaction;
      formulaData.aestheticRecommendations = aestheticRecommendations;
    }

    if (entryType === "clinical" || entryType === "dentistry" || entryType === "aesthetic") {
      clinicalData.antecedents = antecedents;
      clinicalData.allergies = allergies;
      clinicalData.medicationActual = medicationActual;
      clinicalData.contraindications = contraindications;
      clinicalData.clinicalObs = clinicalObs;
      clinicalData.diagnosticMotive = diagnosticMotive;
      clinicalData.treatmentsDone = treatmentsDone;
      clinicalData.nextFollowUp = nextFollowUp;
    }

    try {
      setSavingNotes(true);
      const payload = {
        appointmentId: appointmentId || null,
        type: entryType,
        title: entryTitle,
        notes: entryNotes,
        formulaData: Object.keys(formulaData).length > 0 ? formulaData : null,
        clinicalData: Object.keys(clinicalData).length > 0 ? clinicalData : null
      };

      if (editingEntry) {
        const res = await api.put(`/clients/${client.id}/clinical-history/${editingEntry.id}`, payload);
        setClinicalEntries(prev => prev.map(item => item.id === editingEntry.id ? res.data : item));
      } else {
        const res = await api.post(`/clients/${client.id}/clinical-history`, payload);
        setClinicalEntries(prev => [res.data, ...prev]);
      }
      setShowEntryModal(false);
    } catch (err) {
      console.error("Error saving clinical entry:", err);
      alert("Error al guardar la entrada en el historial clínico.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta entrada del historial clínico? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/clients/${client.id}/clinical-history/${entryId}`);
      setClinicalEntries(prev => prev.filter(item => item.id !== entryId));
    } catch (err) {
      console.error("Error deleting clinical entry:", err);
      alert("Error al eliminar la entrada.");
    }
  };

  const riskAlerts = useMemo(() => {
    const alerts = [];
    clinicalEntries.forEach(entry => {
      const cd = entry.clinicalData || {};
      if (cd.allergies?.trim()) {
        alerts.push({ type: "danger", title: "Alergia", text: cd.allergies, date: entry.createdAt });
      }
      if (cd.contraindications?.trim()) {
        alerts.push({ type: "warning", title: "Contraindicación", text: cd.contraindications, date: entry.createdAt });
      }
      if (cd.nextFollowUp?.trim()) {
        alerts.push({ type: "info", title: "Seguimiento", text: cd.nextFollowUp, date: entry.createdAt });
      }
    });
    return alerts;
  }, [clinicalEntries]);

  // Redirigir a resumen si no tiene permiso para notas clínicas y está en ella
  useEffect(() => {
    if (!canViewNotes && (activeTab === "clinico" || activeTab === "preferencias_formulas")) {
      setActiveTab("resumen");
    }
  }, [canViewNotes, activeTab]);

  // Evitar desajustes de pestañas según tipo de negocio
  useEffect(() => {
    if (activeTab === "clinico" && !isMedical) {
      setActiveTab("preferencias_formulas");
    } else if (activeTab === "preferencias_formulas" && isMedical) {
      setActiveTab("clinico");
    }
  }, [isMedical, activeTab]);

  // Parsear notas estructuradas en carga para estética
  useEffect(() => {
    if (notesText && typeof notesText === "string") {
      const prefMatch = notesText.match(/\[Preferencias\]:\s*(.*?)(?=\n\[|$)/s);
      const algMatch = notesText.match(/\[Alergias\]:\s*(.*?)(?=\n\[|$)/s);
      const prodMatch = notesText.match(/\[Productos\]:\s*(.*?)(?=\n\[|$)/s);
      const noteMatch = notesText.match(/\[Notas\]:\s*(.*?)(?=\n\[|$)/s);

      setPreferences(prefMatch ? prefMatch[1].trim() : "");
      setAllergiesText(algMatch ? algMatch[1].trim() : "");
      setFavoriteProducts(prodMatch ? prodMatch[1].trim() : "");
      
      if (prefMatch || algMatch || prodMatch || noteMatch) {
        setInternalNotes(noteMatch ? noteMatch[1].trim() : "");
      } else {
        setInternalNotes(notesText);
      }
    } else {
      setPreferences("");
      setAllergiesText("");
      setFavoriteProducts("");
      setInternalNotes("");
    }
  }, [notesText]);

  useEffect(() => {
    if (show && client?.id) {
      setLoadingCrm(true);
      setErrorCrm("");
      api.get(`/crm/${client.id}`)
        .then(res => {
          setCrmData(res.data);
          setNotesText(res.data?.client?.notes || "");
        })
        .catch(err => {
          console.error("Error al cargar CRM del cliente:", err);
          setErrorCrm("No se pudieron cargar los detalles CRM avanzados del cliente.");
        })
        .finally(() => {
          setLoadingCrm(false);
        });
    }
  }, [show, client?.id]);

  // Filtrar citas del cliente locales (como fallback)
  const clientAppts = useMemo(() => {
    if (!client) return [];
    return appointments
      .filter((a) => a.clientId === client.id)
      .sort((a, b) => {
        const da = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const db = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return db - da;
      });
  }, [appointments, client?.id]);

  // Agrupar fotos del cliente por cita para la galería
  const groupedGallery = useMemo(() => {
    if (!crmData?.gallery || crmData.gallery.length === 0) return [];

    const groups = {};
    crmData.gallery.forEach(p => {
      const apptId = p.appointmentId;
      if (!groups[apptId]) {
        const appt = p.appointment || appointments.find(a => a.id === apptId);
        groups[apptId] = {
          appointmentId: apptId,
          date: appt ? appt.startsAt : p.createdAt,
          serviceName: appt?.service?.name || "Servicio General",
          workerName: appt?.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : "Profesional",
          before: null,
          after: null,
        };
      }
      if (p.type === "before") {
        groups[apptId].before = p.imageUrl;
      } else if (p.type === "after") {
        groups[apptId].after = p.imageUrl;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [crmData?.gallery, appointments]);

  if (!client) return null;

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setNotesSavedStatus("");
      await api.put(`/clients/${client.id}`, {
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        email: client.email,
        notes: notesText
      });
      setNotesSavedStatus("success");
      setTimeout(() => setNotesSavedStatus(""), 4000);
    } catch (e) {
      console.error("Error guardando notas generales:", e);
      setNotesSavedStatus("error");
      setTimeout(() => setNotesSavedStatus(""), 4000);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveAestheticPreferences = async () => {
    try {
      setSavingNotes(true);
      setNotesSavedStatus("");
      const serializedNotes = `[Preferencias]: ${preferences}\n[Alergias]: ${allergiesText}\n[Productos]: ${favoriteProducts}\n[Notas]: ${internalNotes}`;
      await api.put(`/clients/${client.id}`, {
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        email: client.email,
        notes: serializedNotes
      });
      setNotesText(serializedNotes);
      setNotesSavedStatus("success");
      setTimeout(() => setNotesSavedStatus(""), 4000);
    } catch (e) {
      console.error("Error guardando preferencias estéticas:", e);
      setNotesSavedStatus("error");
      setTimeout(() => setNotesSavedStatus(""), 4000);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleUpdatePhotoFlag = async (photoId, flag, value) => {
    try {
      await api.put(`/appointments/photos/${photoId}`, { [flag]: value });
      if (crmData?.gallery) {
        setCrmData(prev => ({
          ...prev,
          gallery: prev.gallery.map(p => p.id === photoId ? { ...p, [flag]: value } : p)
        }));
      }
    } catch (err) {
      console.error("Error updating photo flag:", err);
    }
  };

  const handleInstagramCreate = () => {
    const selectedPhotoIds = (crmData?.gallery || [])
      .filter(p => p.useForInstagram)
      .map(p => p.id);
      
    if (selectedPhotoIds.length === 0) {
      alert("Por favor selecciona al menos una fotografía marcando 'Usar para Instagram' en la galería.");
      return;
    }
    
    onHide();
    navigate(`/marketing?clientId=${client.id}&photoIds=${selectedPhotoIds.join(",")}`);
  };

  const handleSendWhatsApp = () => {
    const metrics = crmData?.metrics;
    const days = metrics?.daysSinceLastVisit || 45;
    const serviceName = metrics?.favoriteService && metrics.favoriteService !== "Ninguno" ? metrics.favoriteService : "tratamiento favorito";
    const text = `¡Hola ${client.firstName || ""}! Te escribimos de Aura Studio. 🌸 Notamos que pasaron unos ${days} días desde tu último servicio de ${serviceName}. Queremos ofrecerte un 15% de descuento en tu próximo turno para consentirte de nuevo. ¿Te reservamos un lugar para este fin de semana?`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${client.phone ? client.phone.replace(/\D/g, "") : ""}?text=${encoded}`, "_blank");
  };

  const initialFirst = (client.firstName && typeof client.firstName === "string" && client.firstName.length > 0) ? client.firstName.charAt(0).toUpperCase() : "";
  const initialLast = (client.lastName && typeof client.lastName === "string" && client.lastName.length > 0) ? client.lastName.charAt(0).toUpperCase() : "";

  // Render Loyalty Badge based on status
  const renderLoyaltyBadge = (status) => {
    switch (status) {
      case "VIP":
        return (
          <Badge bg="warning" className="text-dark rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm border border-warning" style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", color: "#fff" }}>
            <Award size={14} className="animate-bounce" />
            <span>Cliente VIP</span>
          </Badge>
        );
      case "ACTIVO":
        return (
          <Badge bg="success" className="text-white rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #34d399 0%, #059669 100%)" }}>
            <ShieldCheck size={14} />
            <span>Activo</span>
          </Badge>
        );
      case "INACTIVO":
        return (
          <Badge bg="danger" className="text-white rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)" }}>
            <AlertTriangle size={14} />
            <span>Inactivo</span>
          </Badge>
        );
      case "NUEVO":
      default:
        return (
          <Badge bg="info" className="text-white rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)" }}>
            <User size={14} />
            <span>Nuevo</span>
          </Badge>
        );
    }
  };

  return (
    <Modal show={show} onHide={handleCloseDetailModal} size="xl" centered className="hegemonic-modal border-0">
      <Modal.Header closeButton className="border-0 pb-0 bg-light py-3 px-4">
        <Modal.Title className="fw-black text-dark d-flex align-items-center gap-2">
          <Sparkles className="text-purple-600" size={24} />
          <span>{requiresClinicalHistory ? "Ficha Avanzada CRM & Historial Clínico" : "Ficha Avanzada CRM & Ficha Técnica"}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4 bg-white rounded-bottom">
        {/* SECCIÓN 1: Perfil Básicos */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="position-relative overflow-hidden rounded-circle bg-purple-100 text-purple-700 d-flex align-items-center justify-content-center fw-bold shadow-sm" 
              style={{ width: 64, height: 64, fontSize: 22, border: "2px solid #e9d5ff", cursor: "pointer" }}
              onClick={() => setShowPhotoModal(true)}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              {currentPhotoUrl ? (
                <img 
                  src={getImageUrl(currentPhotoUrl)} 
                  alt="Avatar" 
                  className="w-100 h-100 object-fit-cover position-absolute"
                />
              ) : (
                <span>{initialFirst}{initialLast || "C"}</span>
              )}
              <div 
                className="position-absolute w-100 h-100 top-0 start-0 d-flex align-items-center justify-content-center bg-black bg-opacity-50 text-white transition-all"
                style={{ 
                  opacity: avatarHover ? 1 : 0, 
                  transition: "opacity 0.2s ease-in-out",
                  pointerEvents: "none"
                }}
              >
                <Camera size={20} />
              </div>
            </div>
            <div>
              <h2 className="h4 fw-bold text-gray-900 m-0">{client.firstName || ""} {client.lastName || ""}</h2>
              <p className="text-muted mb-0 d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: "14px" }}>
                <span>📞 {client.phone || "Sin teléfono"}</span>
                <span>•</span>
                <span>📧 {client.email || "Sin correo"}</span>
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="light" className="text-dark border rounded-pill px-3 py-2 small d-flex align-items-center gap-1.5 shadow-sm">
              <Cake size={13} className="text-pink-500" />
              <span>{business?.industry || "Socio"}</span>
            </Badge>
            {crmData && renderLoyaltyBadge(crmData.metrics?.loyaltyStatus)}
          </div>
        </div>

        {/* Campaña de Marketing de Reactivación */}
        {crmData?.metrics?.loyaltyStatus === "INACTIVO" && (
          <Alert variant="danger" className="rounded-2xl mb-4 border-0 d-flex align-items-center justify-content-between flex-wrap gap-3 shadow-sm bg-red-50 text-red-800 p-3">
            <div className="d-flex align-items-center gap-2.5">
              <AlertTriangle size={22} className="text-red-500 animate-bounce" />
              <div>
                <strong className="block text-gray-900">Oportunidad de Reactivación CRM:</strong> 
                <span>El cliente no registra visitas hace <strong>{crmData.metrics.daysSinceLastVisit || 60} días</strong>. Sugerimos enviarle un mensaje personalizado.</span>
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={handleSendWhatsApp} className="rounded-xl d-flex align-items-center gap-1.5 px-4 py-2 fw-bold border-0 bg-red-600 text-white shadow-sm hover-bg-red-700 transition-all">
              <MessageCircle size={16} />
              <span>Enviar Oferta por WhatsApp</span>
            </Button>
          </Alert>
        )}

        {/* Banner de Alergias Declaradas */}
        {(client?.allergies || crmData?.client?.allergies) && (
          <Alert variant="danger" className="rounded-2xl mb-4 border-0 d-flex align-items-center gap-2.5 shadow-sm bg-red-50 text-red-950 p-3 border-start border-danger" style={{ borderLeft: "5px solid #dc2626 !important" }}>
            <AlertTriangle size={22} className="text-danger animate-pulse flex-shrink-0" />
            <div>
              <strong className="d-block text-danger" style={{ fontSize: "14px" }}>⚠️ ALERGIAS DECLARADAS (Alerta de Seguridad):</strong> 
              <span className="fw-bold text-dark" style={{ fontSize: "13.5px" }}>{client?.allergies || crmData?.client?.allergies}</span>
            </div>
          </Alert>
        )}

        {/* MENÚ DE PESTAÑAS ESTILO CRM PREMIUM */}
        <div className="d-flex border-bottom mb-4 gap-2 overflow-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "resumen"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <Activity size={16} />
            <span>Métricas CRM</span>
          </button>
          
          {isMedical ? (
            <button
              onClick={() => setActiveTab("clinico")}
              className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
                activeTab === "clinico"
                  ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                  : "bg-light text-muted hover-bg-gray-100"
              }`}
            >
              <BookOpen size={16} />
              <span>Historia Clínica</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("preferencias_formulas")}
              className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
                activeTab === "preferencias_formulas"
                  ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                  : "bg-light text-muted hover-bg-gray-100"
              }`}
            >
              <Sparkles size={16} className="text-pink-500 animate-pulse" />
              <span>Preferencias y Fórmulas</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("timeline")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "timeline"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <Clock size={16} />
            <span>{isMedical ? "Evolución Clínica" : "Evolución y Estilo"}</span>
          </button>

          <button
            onClick={() => setActiveTab("turnos")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "turnos"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <Calendar size={16} />
            <span>Historial de Citas</span>
          </button>

          <button
            onClick={() => setActiveTab("consentimientos")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "consentimientos"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <FileText size={16} />
            <span>Consentimientos</span>
          </button>

          <button
            onClick={() => setActiveTab("historial_visual")}
            className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
              activeTab === "historial_visual"
                ? "bg-purple-600 text-white shadow-sm hover-bg-purple-700"
                : "bg-light text-muted hover-bg-gray-100"
            }`}
          >
            <ImageIcon size={16} />
            <span>Historial Visual</span>
          </button>
        </div>

        {loadingCrm ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="purple" className="text-purple-600" />
            <p className="text-muted mt-2 fw-semibold">Procesando y analizando historial de lealtad del cliente...</p>
          </div>
        ) : errorCrm ? (
          <div className="alert alert-warning border-0 rounded-2xl p-4">
            {errorCrm}
          </div>
        ) : (
          <div>
            {/* PESTAÑA 1: RESUMEN Y MÉTRICAS */}
            {activeTab === "resumen" && crmData && (
              <div>
                <Row className="g-4 mb-4">
                  {/* Cards KPIs Inteligentes */}
                  <Col md={9}>
                    <Row className="g-3">
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Facturación Total</div>
                          {canViewFinance ? (
                            <div className="h3 fw-black text-purple-700 mb-0">{currency(crmData.metrics.totalSpent)}</div>
                          ) : (
                            <div className="h4 fw-bold text-muted mb-0">🔒 Restringido</div>
                          )}
                          <small className="text-muted mt-1">Servicios finalizados</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Visitas Completadas</div>
                          <div className="h3 fw-black text-gray-800 mb-0">{crmData.metrics.totalVisits} visitas</div>
                          <small className="text-muted mt-1">Tratamientos realizados</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Ticket Promedio</div>
                          {canViewFinance ? (
                            <div className="h3 fw-black text-emerald-600 mb-0">{currency(crmData.metrics.avgTicket)}</div>
                          ) : (
                            <div className="h4 fw-bold text-muted mb-0">🔒 Restringido</div>
                          )}
                          <small className="text-muted mt-1">Gasto medio por turno</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Frecuencia de Retorno</div>
                          <div className="h3 fw-black text-gray-800 mb-0">
                            {crmData.metrics.visitFrequencyDays > 0 
                              ? `Cada ${crmData.metrics.visitFrequencyDays} días` 
                              : "Visita única"}
                          </div>
                          <small className="text-muted mt-1">Frecuencia promedio de visitas</small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Última Visita</div>
                          <div className="h4 fw-bold text-gray-800 mb-0 py-1">
                            {crmData.metrics.daysSinceLastVisit !== null 
                              ? `Hace ${crmData.metrics.daysSinceLastVisit} días` 
                              : "Sin registros"}
                          </div>
                          <small className="text-muted mt-1">
                            {crmData.clinicalHistory?.[0]?.appointment?.startsAt
                              ? new Date(crmData.clinicalHistory[0].appointment.startsAt).toLocaleDateString("es-AR")
                              : ""}
                          </small>
                        </Card>
                      </Col>
                      <Col xs={6} md={4}>
                        <Card className="border-0 bg-light p-3 rounded-2xl shadow-sm-hover transition-all text-center h-100 d-flex flex-column justify-content-center">
                          <div className="text-muted smaller fw-bold mb-1 uppercase tracking-wider">Próximos Turnos</div>
                          <div className="h3 fw-black text-indigo-600 mb-0">{crmData.metrics.upcomingVisitsCount} agendados</div>
                          <small className="text-muted mt-1">Reservas futuras activas</small>
                        </Card>
                      </Col>
                    </Row>
                  </Col>

                  {/* FIDELIDAD Y PREFERENCIAS */}
                  <Col md={3}>
                    <Card className="border-0 bg-purple-50 p-4 rounded-2xl h-100 d-flex flex-column justify-content-between shadow-sm">
                      <div>
                        <h4 className="h6 fw-bold text-purple-800 mb-2 uppercase tracking-wide d-flex align-items-center gap-1.5">
                          <Heart size={15} />
                          <span>Índice de Retención</span>
                        </h4>
                        <div className="d-flex align-items-baseline gap-2 mb-2">
                          <span className="h2 fw-black text-purple-900 mb-0">{crmData.metrics.retentionIndex}%</span>
                          <small className="text-purple-700 fw-bold">Fidelizado</small>
                        </div>
                        <ProgressBar 
                          now={crmData.metrics.retentionIndex} 
                          variant="purple" 
                          className="rounded-pill shadow-inner" 
                          style={{ height: "8px", backgroundColor: "#f3e8ff" }}
                        />
                      </div>
                      
                      <div className="mt-4 pt-3 border-top border-purple-100">
                        <div className="mb-3">
                          <small className="text-muted block smaller fw-bold uppercase">Servicio Favorito</small>
                          <div className="fw-bold text-gray-800 d-flex align-items-center gap-1.5 mt-0.5">
                            <ShoppingBag size={14} className="text-purple-500" />
                            <span>{crmData.metrics.favoriteService}</span>
                          </div>
                        </div>
                        <div>
                          <small className="text-muted block smaller fw-bold uppercase">Estilista Preferido</small>
                          <div className="fw-bold text-gray-800 d-flex align-items-center gap-1.5 mt-0.5">
                            <User size={14} className="text-purple-500" />
                            <span>{crmData.metrics.favoriteProfessional}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Resumen Histórico y Diagnóstico Rápido */}
                {canViewNotes && (
                  <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                    <h3 className="h6 fw-bold text-gray-900 mb-3 d-flex align-items-center gap-2">
                      <FileText size={18} className="text-purple-500" />
                      <span>{requiresClinicalHistory ? "Último Diagnóstico Clínico Registrado" : "Última Ficha de Servicio Registrada"}</span>
                    </h3>
                    
                    {crmData.clinicalHistory?.length > 0 ? (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                          <span className="badge bg-purple-100 text-purple-700 fw-bold px-3 py-1.5 rounded-lg">
                            {crmData.clinicalHistory[0].appointment?.service?.name || "Tratamiento"}
                          </span>
                          <small className="text-muted fw-semibold">
                            Por: {crmData.clinicalHistory[0].worker ? `${crmData.clinicalHistory[0].worker.firstName} ${crmData.clinicalHistory[0].worker.lastName}` : "Profesional"} • {new Date(crmData.clinicalHistory[0].createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                          </small>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 mb-3" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                          {crmData.clinicalHistory[0].note}
                        </div>
                        {crmData.clinicalHistory[0].recommendations && (
                          <div className="d-flex align-items-start gap-2 text-emerald-800 bg-emerald-50 bg-opacity-60 p-2.5 rounded-xl border border-emerald-100" style={{ fontSize: "13px" }}>
                            <span className="fw-bold">💡 Recomendación de Cuidado:</span>
                            <span>{crmData.clinicalHistory[0].recommendations}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-xl text-muted small">
                        {requiresClinicalHistory 
                          ? "Todavía no se han registrado fichas de evolución clínica para este cliente."
                          : "Todavía no se han registrado fichas de evolución o notas técnicas para este cliente."}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}

            {/* PESTAÑA 2: HISTORIAL CLÍNICO Y FÓRMULAS (REQUIRES CLINICAL HISTORY) */}
            {activeTab === "clinico" && requiresClinicalHistory && (
              <div>
                {!canViewClinical ? (
                  <Card className="border-0 bg-light p-5 rounded-2xl text-center shadow-sm">
                    <ShieldCheck size={48} className="text-red-500 mb-3 mx-auto animate-pulse" />
                    <h4 className="fw-bold text-red-800">Información clínica restringida</h4>
                    <p className="text-muted mb-0">No posees los permisos necesarios (`clients.clinical.view`) para visualizar el historial médico o fichas técnicas de este cliente.</p>
                  </Card>
                ) : (
                  <Row className="g-4">
                    {/* Banner superior de alertas de riesgo en tiempo real */}
                    {riskAlerts.length > 0 && (
                      <Col md={12}>
                        <Card className="border-0 border bg-red-50 bg-opacity-40 p-3 rounded-2xl shadow-sm">
                          <h4 className="h6 fw-bold text-red-800 d-flex align-items-center gap-2 mb-2.5">
                            <AlertTriangle size={16} className="text-red-500 animate-bounce" />
                            <span>Alertas de Riesgo y Seguimiento</span>
                          </h4>
                          <div className="d-flex flex-wrap gap-2">
                            {riskAlerts.map((alert, idx) => (
                              <Badge 
                                key={idx} 
                                bg={alert.type === "danger" ? "danger" : alert.type === "warning" ? "warning" : "info"}
                                className={`rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1 shadow-sm border ${
                                  alert.type === "danger" ? "border-danger text-white" : alert.type === "warning" ? "border-warning text-dark" : "border-info text-white"
                                }`}
                                style={{
                                  backgroundColor: alert.type === "danger" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : "#3b82f6"
                                }}
                              >
                                <strong>{alert.title}:</strong> {alert.text}
                              </Badge>
                            ))}
                          </div>
                        </Card>
                      </Col>
                    )}

                    {/* Fichas Técnicas / Fórmulas Sesión por Sesión */}
                    <Col md={12}>
                      <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-2">
                          <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2 text-gray-900">
                            <BookOpen size={18} className="text-purple-500" />
                            <span>Historial Clínico & Fórmulas Sesión por Sesión</span>
                          </h3>
                          {canCreateClinical && (
                            <Button 
                              variant="purple" 
                              className="rounded-xl px-4 py-2 text-white bg-purple-600 border-0 hover-bg-purple-700 fw-bold shadow-sm d-flex align-items-center gap-1.5"
                              onClick={handleOpenNewEntry}
                            >
                              <Sparkles size={14} />
                              <span>Nueva Entrada Clínica/Técnica</span>
                            </Button>
                          )}
                        </div>

                        {loadingClinical ? (
                          <div className="text-center py-5">
                            <Spinner animation="border" variant="purple" className="text-purple-600" />
                            <p className="text-muted mt-2 fw-semibold">Cargando historial clínico y fichas técnicas del cliente...</p>
                          </div>
                        ) : errorClinical ? (
                          <Alert variant="danger" className="rounded-xl">{errorClinical}</Alert>
                        ) : clinicalEntries.length === 0 ? (
                          <div className="text-center py-5 text-muted small bg-light rounded-2xl border">
                            Aún no hay fichas clínicas o técnicas registradas para este cliente. ¡Hacé clic en "Nueva Entrada" para empezar!
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-4">
                            {clinicalEntries.map((entry) => {
                              const fd = entry.formulaData || {};
                              const cd = entry.clinicalData || {};
                              return (
                                <div key={entry.id} className="p-3 border rounded-2xl bg-light shadow-sm-hover transition-all">
                                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom pb-2 mb-2">
                                    <div className="d-flex align-items-center gap-2 flex-wrap">
                                      <Badge 
                                        className="rounded-pill px-2.5 py-1.5 fw-bold text-white"
                                        style={{
                                          backgroundColor: 
                                            entry.type === "hair_formula" ? "#ec4899" :
                                            entry.type === "dentistry" ? "#06b6d4" :
                                            entry.type === "aesthetic" ? "#10b981" :
                                            entry.type === "clinical" ? "#ef4444" : "#6b7280"
                                        }}
                                      >
                                        {
                                          entry.type === "hair_formula" ? "Fórmula Capilar" :
                                          entry.type === "dentistry" ? "Odontología" :
                                          entry.type === "aesthetic" ? "Tratamiento Estético" :
                                          entry.type === "clinical" ? "Historia Clínica" : "Consulta General"
                                        }
                                      </Badge>
                                      <span className="fw-bold text-gray-900">{entry.title}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="text-muted small fw-semibold bg-white rounded-pill px-3 py-1 shadow-sm border">
                                        👤 {entry.createdBy} • 📅 {new Date(entry.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                                      </span>
                                      {canEditClinical && (
                                        <Button size="sm" variant="outline-purple" className="py-1 px-2.5 rounded-xl text-xs fw-bold" onClick={() => handleOpenEditEntry(entry)}>
                                          Editar
                                        </Button>
                                      )}
                                      {canDeleteClinical && (
                                        <Button size="sm" variant="outline-danger" className="py-1 px-2.5 rounded-xl text-xs fw-bold" onClick={() => handleDeleteEntry(entry.id)}>
                                          Eliminar
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {entry.notes && (
                                    <div className="text-gray-700 p-2.5 rounded-xl bg-white border-start border-purple-500 mb-3" style={{ fontSize: "14px", borderLeft: "4px solid #9333ea" }}>
                                      <div className="fw-semibold text-xs text-muted mb-1 text-uppercase tracking-wider">Notas y Observaciones Generales</div>
                                      {entry.notes}
                                    </div>
                                  )}

                                  {/* Renderizado dinámico de campos según tipo de negocio */}
                                  {entry.type === "hair_formula" && (
                                    <Row className="g-2 text-xs text-gray-700 bg-pink-50 bg-opacity-40 p-3 rounded-xl border border-pink-100 mb-2">
                                      {fd.colorFormula && <Col xs={6} md={4}><strong>Fórmula:</strong> {fd.colorFormula}</Col>}
                                      {fd.oxidant && <Col xs={6} md={4}><strong>Oxidante:</strong> {fd.oxidant}</Col>}
                                      {fd.exposureTime && <Col xs={6} md={4}><strong>Tiempo Exp:</strong> {fd.exposureTime}</Col>}
                                      {fd.brandUsed && <Col xs={6} md={4}><strong>Marca:</strong> {fd.brandUsed}</Col>}
                                      {fd.techniqueApplied && <Col xs={6} md={4}><strong>Técnica:</strong> {fd.techniqueApplied}</Col>}
                                      {fd.expectedResult && <Col xs={6} md={4}><strong>Resultado esperado:</strong> {fd.expectedResult}</Col>}
                                      {fd.postServiceObs && <Col xs={12} className="mt-2 pt-2 border-top border-pink-100"><strong>Observaciones post-servicio:</strong> {fd.postServiceObs}</Col>}
                                    </Row>
                                  )}

                                  {entry.type === "dentistry" && (
                                    <Row className="g-2 text-xs text-gray-700 bg-cyan-50 bg-opacity-40 p-3 rounded-xl border border-cyan-100 mb-2">
                                      {fd.toothPiece && <Col xs={6} md={4}><strong>Pieza dental:</strong> {fd.toothPiece}</Col>}
                                      {fd.dentistryDiagnosis && <Col xs={6} md={4}><strong>Diagnóstico:</strong> {fd.dentistryDiagnosis}</Col>}
                                      {fd.procedureApplied && <Col xs={6} md={4}><strong>Procedimiento:</strong> {fd.procedureApplied}</Col>}
                                      {fd.materialUsed && <Col xs={6} md={4}><strong>Material:</strong> {fd.materialUsed}</Col>}
                                      {fd.evolutionStatus && <Col xs={6} md={4}><strong>Evolución:</strong> {fd.evolutionStatus}</Col>}
                                      {fd.nextAppointmentDate && <Col xs={6} md={4}><strong>Próxima consulta:</strong> {fd.nextAppointmentDate}</Col>}
                                    </Row>
                                  )}

                                  {entry.type === "aesthetic" && (
                                    <Row className="g-2 text-xs text-gray-700 bg-emerald-50 bg-opacity-40 p-3 rounded-xl border border-emerald-100 mb-2">
                                      {fd.treatmentType && <Col xs={6} md={4}><strong>Tratamiento:</strong> {fd.treatmentType}</Col>}
                                      {fd.productUsed && <Col xs={6} md={4}><strong>Producto:</strong> {fd.productUsed}</Col>}
                                      {fd.treatedZone && <Col xs={6} md={4}><strong>Zona tratada:</strong> {fd.treatedZone}</Col>}
                                      {fd.intensityFrequency && <Col xs={6} md={4}><strong>Intensidad:</strong> {fd.intensityFrequency}</Col>}
                                      {fd.clientReaction && <Col xs={6} md={4}><strong>Reacción:</strong> {fd.clientReaction}</Col>}
                                      {fd.aestheticRecommendations && <Col xs={12} className="mt-2 pt-2 border-top border-emerald-100"><strong>Recomendaciones:</strong> {fd.aestheticRecommendations}</Col>}
                                    </Row>
                                  )}

                                  {(entry.type === "clinical" || entry.type === "dentistry" || entry.type === "aesthetic") && (
                                    <Row className="g-2 text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 mb-2 shadow-inner">
                                      {cd.antecedents && <Col xs={12}><strong>Antecedentes médicos:</strong> {cd.antecedents}</Col>}
                                      {cd.allergies && <Col xs={6} md={4} className="text-danger"><strong>⚠️ Alergias:</strong> {cd.allergies}</Col>}
                                      {cd.medicationActual && <Col xs={6} md={4}><strong>Medicación actual:</strong> {cd.medicationActual}</Col>}
                                      {cd.contraindications && <Col xs={6} md={4} className="text-warning"><strong>🚫 Contraindicaciones:</strong> {cd.contraindications}</Col>}
                                      {cd.diagnosticMotive && <Col xs={6} md={4}><strong>Motivo de consulta:</strong> {cd.diagnosticMotive}</Col>}
                                      {cd.treatmentsDone && <Col xs={6} md={4}><strong>Tratamientos realizados:</strong> {cd.treatmentsDone}</Col>}
                                      {cd.nextFollowUp && <Col xs={6} md={4} className="text-primary"><strong>🗓️ Seguimiento:</strong> {cd.nextFollowUp}</Col>}
                                      {cd.clinicalObs && <Col xs={12} className="mt-2 pt-2 border-top border-gray-100"><strong>Observaciones clínicas:</strong> {cd.clinicalObs}</Col>}
                                    </Row>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                )}
              </div>
            )}

            {/* Modal para agregar/editar entrada clínica/técnica */}
                <Modal show={showEntryModal} onHide={() => setShowEntryModal(false)} size="lg" centered className="hegemonic-modal">
                  <Modal.Header closeButton className="border-0 pb-0 bg-light py-3 px-4">
                    <Modal.Title className="fw-bold text-dark">
                      {editingEntry ? "Editar Ficha Técnica / Clínica" : "Nueva Ficha Técnica / Clínica"}
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="p-4">
                    <Form onSubmit={handleSubmitEntry}>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Título de la entrada</Form.Label>
                            <Form.Control
                              type="text"
                              required
                              value={entryTitle}
                              onChange={(e) => setEntryTitle(e.target.value)}
                              placeholder="Ej: Ficha de sesión color / Limpieza dental"
                              className="rounded-xl border-gray-200 focus-ring-purple"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Tipo de Ficha</Form.Label>
                            <Form.Select
                              value={entryType}
                              onChange={(e) => setEntryType(e.target.value)}
                              className="rounded-xl border-gray-200 focus-ring-purple"
                            >
                              {isMedical ? (
                                <>
                                  <option value="clinical">Clínica Médica / Evolución</option>
                                  <option value="dentistry">Odontología</option>
                                  <option value="general">Consulta General / Notas</option>
                                </>
                              ) : (
                                <>
                                  <option value="hair_formula">Peluquería / Colorimetría</option>
                                  <option value="aesthetic">Estética / Spa / Manicuría</option>
                                  <option value="general">Consulta / Nota Técnica</option>
                                </>
                              )}
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Cita Asociada (Opcional)</Form.Label>
                            <Form.Select
                              value={appointmentId}
                              onChange={(e) => setAppointmentId(e.target.value)}
                              className="rounded-xl border-gray-200 focus-ring-purple"
                            >
                              <option value="">Ninguna cita en particular</option>
                              {clientAppts.map(appt => (
                                <option key={appt.id} value={appt.id}>
                                  {new Date(appt.startsAt).toLocaleDateString("es-AR")} - {appt.service?.name} ({appt.worker ? `${appt.worker.firstName} ${appt.worker.lastName}` : "General"})
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        {/* Campos dinámicos según el tipo de entrada */}
                        {entryType === "hair_formula" && (
                          <>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Fórmula de color</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={colorFormula}
                                  onChange={(e) => setColorFormula(e.target.value)}
                                  placeholder="Ej: 7.1 + 8.3 + 20vol"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Oxidante utilizado</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={oxidant}
                                  onChange={(e) => setOxidant(e.target.value)}
                                  placeholder="Ej: 20 volúmenes (6%)"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Tiempo de exposición</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={exposureTime}
                                  onChange={(e) => setExposureTime(e.target.value)}
                                  placeholder="Ej: 35 minutos"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Marca utilizada</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={brandUsed}
                                  onChange={(e) => setBrandUsed(e.target.value)}
                                  placeholder="Ej: L'Oréal Professionnel / Wella"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Técnica aplicada</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={techniqueApplied}
                                  onChange={(e) => setTechniqueApplied(e.target.value)}
                                  placeholder="Ej: Balayage a mano alzada / Babylights"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Resultado esperado</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={expectedResult}
                                  onChange={(e) => setExpectedResult(e.target.value)}
                                  placeholder="Ej: Rubio ceniza altura 9 sin visos cálidos"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Observaciones post-servicio</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={postServiceObs}
                                  onChange={(e) => setPostServiceObs(e.target.value)}
                                  placeholder="Recomendaciones post-cuidado capilar o comportamiento del cabello..."
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                          </>
                        )}

                        {entryType === "dentistry" && (
                          <>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Pieza dental</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={toothPiece}
                                  onChange={(e) => setToothPiece(e.target.value)}
                                  placeholder="Ej: Pieza 46 / Primer molar inferior derecho"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Diagnóstico Odontológico</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={dentistryDiagnosis}
                                  onChange={(e) => setDentistryDiagnosis(e.target.value)}
                                  placeholder="Ej: Caries oclusal profunda"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Procedimiento realizado</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={procedureApplied}
                                  onChange={(e) => setProcedureApplied(e.target.value)}
                                  placeholder="Ej: Restauración con resina compuesta"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Material utilizado</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={materialUsed}
                                  onChange={(e) => setMaterialUsed(e.target.value)}
                                  placeholder="Ej: Composite Z350 3M / Adhesivo Single Bond"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Estado de Evolución</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={evolutionStatus}
                                  onChange={(e) => setEvolutionStatus(e.target.value)}
                                  placeholder="Ej: Favorable, sin sensibilidad"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Próxima Consulta Odontológica</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={nextAppointmentDate}
                                  onChange={(e) => setNextAppointmentDate(e.target.value)}
                                  placeholder="Ej: Control en 6 meses / Endodoncia el 15/06"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                          </>
                        )}

                        {entryType === "aesthetic" && (
                          <>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Tipo de tratamiento</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={treatmentType}
                                  onChange={(e) => setTreatmentType(e.target.value)}
                                  placeholder="Ej: Peeling Químico / Lipoláser"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Producto utilizado</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={productUsed}
                                  onChange={(e) => setProductUsed(e.target.value)}
                                  placeholder="Ej: Ácido glicólico al 30% / Hialurónico"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Zona tratada</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={treatedZone}
                                  onChange={(e) => setTreatedZone(e.target.value)}
                                  placeholder="Ej: Rostro completo / Abdomen"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Intensidad / Frecuencia</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={intensityFrequency}
                                  onChange={(e) => setIntensityFrequency(e.target.value)}
                                  placeholder="Ej: Nivel medio (4J/cm2) / 3ra sesión"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Reacción del cliente</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={clientReaction}
                                  onChange={(e) => setClientReaction(e.target.value)}
                                  placeholder="Ej: Eritema leve, remite a los 20 min"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Recomendaciones estéticas</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={aestheticRecommendations}
                                  onChange={(e) => setAestheticRecommendations(e.target.value)}
                                  placeholder="Ej: Pantalla solar cada 3h / Crema regeneradora"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                          </>
                        )}

                        {/* Campos clínicos generales */}
                        {(entryType === "clinical" || entryType === "dentistry" || entryType === "aesthetic") && (
                          <>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Antecedentes médicos relevantes</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={antecedents}
                                  onChange={(e) => setAntecedents(e.target.value)}
                                  placeholder="Ej: Hipertensión controlada / Diabetes Tipo II"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold text-danger">⚠️ Alergias conocidas</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={allergies}
                                  onChange={(e) => setAllergies(e.target.value)}
                                  placeholder="Ej: Penicilina / Látex / Ácido salicílico"
                                  className="rounded-xl border-gray-200 border-danger bg-red-50 text-red-900"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Medicación actual</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={medicationActual}
                                  onChange={(e) => setMedicationActual(e.target.value)}
                                  placeholder="Ej: Enalapril 10mg / Aspirina"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold text-warning">🚫 Contraindicaciones</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={contraindications}
                                  onChange={(e) => setContraindications(e.target.value)}
                                  placeholder="Ej: Marcapasos / Embarazo / Tratamiento anticoagulante"
                                  className="rounded-xl border-gray-200 border-warning bg-amber-50"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Diagnóstico / Motivo de consulta</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={diagnosticMotive}
                                  onChange={(e) => setDiagnosticMotive(e.target.value)}
                                  placeholder="Ej: Dolor persistente / Evaluación de manchas faciales"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Tratamientos realizados en sesión</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={treatmentsDone}
                                  onChange={(e) => setTreatmentsDone(e.target.value)}
                                  placeholder="Ej: Curetaje de cuadrante superior / Microdermoabrasión"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold text-primary">🗓️ Próximo seguimiento</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={nextFollowUp}
                                  onChange={(e) => setNextFollowUp(e.target.value)}
                                  placeholder="Ej: Control telefónico en 48hs / Sesión 2 en 15 días"
                                  className="rounded-xl border-gray-200 border-primary bg-blue-50"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Observaciones Clínicas / Profesionales</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={clinicalObs}
                                  onChange={(e) => setClinicalObs(e.target.value)}
                                  placeholder="Ej: Paciente responde bien al tratamiento, sin efectos adversos"
                                  className="rounded-xl border-gray-200"
                                />
                              </Form.Group>
                            </Col>
                          </>
                        )}

                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Notas Generales / Evolución</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={entryNotes}
                              onChange={(e) => setEntryNotes(e.target.value)}
                              placeholder="Escribe comentarios, observaciones generales o recomendaciones de autocuidado..."
                              className="rounded-xl border-gray-200 focus-ring-purple"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="light" className="rounded-xl px-4 py-2" onClick={() => setShowEntryModal(false)}>
                          Cancelar
                        </Button>
                        <Button
                          variant="purple"
                          type="submit"
                          disabled={savingNotes}
                          className="rounded-xl px-4 py-2 text-white bg-purple-600 border-0 hover-bg-purple-700 shadow"
                        >
                          {savingNotes ? "Guardando..." : "Guardar Entrada"}
                        </Button>
                      </div>
                    </Form>
                  </Modal.Body>
                </Modal>
            {/* PESTAÑA 2: PREFERENCIAS Y FÓRMULAS (NEGOCIOS ESTÉTICOS) */}
            {activeTab === "preferencias_formulas" && !isMedical && (
              <div>
                <Row className="g-4">
                  {/* Tarjeta de Ficha de Estilo y Preferencias del Cliente */}
                  {canViewNotes && (
                    <Col md={12}>
                      <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 pb-2 border-bottom">
                          <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2 text-gray-900">
                            <Sparkles size={18} className="text-pink-500 animate-pulse" />
                            <span>Ficha de Estilo & Preferencias del Cliente</span>
                          </h3>
                          {notesSavedStatus === "success" && (
                            <span className="text-emerald-600 fw-bold small animate-pulse">✓ ¡Ficha guardada con éxito!</span>
                          )}
                          {notesSavedStatus === "error" && (
                            <span className="text-red-600 fw-bold small">⚠️ Error al guardar preferencias.</span>
                          )}
                        </div>

                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">Alergias o Sensibilidades Técnicas</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={allergiesText}
                                readOnly={!canEditNotes}
                                onChange={(e) => setAllergiesText(e.target.value)}
                                placeholder="Ej: Sensibilidad a colorantes comunes. Usar tinturas sin amoníaco o tratamientos hipoalergénicos."
                                className="border-gray-200 rounded-xl p-2.5 focus-ring-purple bg-red-50 bg-opacity-40 border-danger border-opacity-30 text-red-900"
                                style={{ fontSize: "13.5px" }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">Productos y Marcas Favoritas</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={favoriteProducts}
                                readOnly={!canEditNotes}
                                onChange={(e) => setFavoriteProducts(e.target.value)}
                                placeholder="Ej: Prefiere L'Oréal Professionnel, Kérastase, o esmaltes semipermanentes OPI."
                                className="border-gray-200 rounded-xl p-2.5 focus-ring-purple bg-pink-50 bg-opacity-30 text-gray-800"
                                style={{ fontSize: "13.5px" }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">Preferencias de Servicio y Estilo</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={preferences}
                                readOnly={!canEditNotes}
                                onChange={(e) => setPreferences(e.target.value)}
                                placeholder="Ej: Toma café cortado tibio con endulzante. Prefiere tonos ceniza y balayage natural. Cabello abundante y grueso."
                                className="border-gray-200 rounded-xl p-2.5 focus-ring-purple text-gray-800"
                                style={{ fontSize: "13.5px" }}
                              />
                            </Form.Group>
                          </Col>

                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="fw-semibold text-xs text-muted text-uppercase tracking-wider">Notas Internas / Observaciones Profesionales</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={internalNotes}
                                readOnly={!canEditNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="Observaciones adicionales, gustos de conversación, o notas comerciales..."
                                className="border-gray-200 rounded-xl p-2.5 focus-ring-purple text-gray-800"
                                style={{ fontSize: "13.5px" }}
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        {canEditNotes && (
                          <div className="d-flex justify-content-end mt-3 border-top pt-3">
                            <Button
                              variant="purple"
                              disabled={savingNotes}
                              onClick={handleSaveAestheticPreferences}
                              className="rounded-xl px-4 py-2 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center gap-1.5 shadow"
                            >
                              {savingNotes ? (
                                <>
                                  <Spinner size="sm" animation="border" />
                                  <span>Guardando...</span>
                                </>
                              ) : (
                                <>
                                  <Save size={16} />
                                  <span>Guardar Ficha de Preferencias</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </Card>
                    </Col>
                  )}

                  {/* Fichas Técnicas / Fórmulas Sesión por Sesión */}
                  <Col md={12}>
                    <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-2">
                        <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2 text-gray-900">
                          <BookOpen size={18} className="text-pink-500" />
                          <span>Fórmulas & Sesiones Técnicas (Historial)</span>
                        </h3>
                        {canCreateClinical && (
                          <Button 
                            variant="pink" 
                            className="rounded-xl px-4 py-2 text-white bg-pink-600 border-0 hover-bg-pink-700 fw-bold shadow-sm d-flex align-items-center gap-1.5"
                            onClick={handleOpenNewEntry}
                            style={{ backgroundColor: "#db2777" }}
                          >
                            <Sparkles size={14} />
                            <span>Nueva Fórmula capilar/estética</span>
                          </Button>
                        )}
                      </div>

                      {!canViewClinical ? (
                        <div className="text-center py-4 bg-light rounded-xl text-muted small">
                          🔒 No posees permisos para ver el historial de fórmulas técnicas de sesiones de este cliente.
                        </div>
                      ) : loadingClinical ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="purple" className="text-purple-600" />
                          <p className="text-muted mt-2 fw-semibold">Cargando fórmulas y fichas técnicas...</p>
                        </div>
                      ) : errorClinical ? (
                        <Alert variant="danger" className="rounded-xl">{errorClinical}</Alert>
                      ) : clinicalEntries.length === 0 ? (
                        <div className="text-center py-5 text-muted small bg-light rounded-2xl border">
                          Aún no hay fichas de sesión o fórmulas de coloración registradas para este cliente. ¡Hacé clic en "Nueva Fórmula" para empezar!
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-4">
                          {clinicalEntries.map((entry) => {
                            const fd = entry.formulaData || {};
                            return (
                              <div key={entry.id} className="p-3 border rounded-2xl bg-light shadow-sm-hover transition-all">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom pb-2 mb-2">
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <Badge 
                                      className="rounded-pill px-2.5 py-1.5 fw-bold text-white"
                                      style={{
                                        backgroundColor: 
                                          entry.type === "hair_formula" ? "#ec4899" :
                                          entry.type === "aesthetic" ? "#10b981" : "#6b7280"
                                      }}
                                    >
                                      {
                                        entry.type === "hair_formula" ? "Fórmula Capilar" :
                                        entry.type === "aesthetic" ? "Tratamiento de Estética" : "Ficha General"
                                      }
                                    </Badge>
                                    <span className="fw-bold text-gray-900">{entry.title}</span>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted small fw-semibold bg-white rounded-pill px-3 py-1 shadow-sm border">
                                      👤 {entry.createdBy} • 📅 {new Date(entry.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                    {canEditClinical && (
                                      <Button size="sm" variant="outline-purple" className="py-1 px-2.5 rounded-xl text-xs fw-bold" onClick={() => handleOpenEditEntry(entry)}>
                                        Editar
                                      </Button>
                                    )}
                                    {canDeleteClinical && (
                                      <Button size="sm" variant="outline-danger" className="py-1 px-2.5 rounded-xl text-xs fw-bold" onClick={() => handleDeleteEntry(entry.id)}>
                                        Eliminar
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {entry.notes && (
                                  <div className="text-gray-700 p-2.5 rounded-xl bg-white border-start border-purple-500 mb-3" style={{ fontSize: "14px", borderLeft: "4px solid #9333ea" }}>
                                    <div className="fw-semibold text-xs text-muted mb-1 text-uppercase tracking-wider">Notas de Sesión</div>
                                    {entry.notes}
                                  </div>
                                )}

                                {entry.type === "hair_formula" && (
                                  <Row className="g-2 text-xs text-gray-700 bg-pink-50 bg-opacity-40 p-3 rounded-xl border border-pink-100 mb-2">
                                    {fd.colorFormula && <Col xs={6} md={4}><strong>Fórmula:</strong> {fd.colorFormula}</Col>}
                                    {fd.oxidant && <Col xs={6} md={4}><strong>Oxidante:</strong> {fd.oxidant}</Col>}
                                    {fd.exposureTime && <Col xs={6} md={4}><strong>Tiempo Exp:</strong> {fd.exposureTime}</Col>}
                                    {fd.brandUsed && <Col xs={6} md={4}><strong>Marca:</strong> {fd.brandUsed}</Col>}
                                    {fd.techniqueApplied && <Col xs={6} md={4}><strong>Técnica:</strong> {fd.techniqueApplied}</Col>}
                                    {fd.expectedResult && <Col xs={6} md={4}><strong>Resultado esperado:</strong> {fd.expectedResult}</Col>}
                                    {fd.postServiceObs && <Col xs={12} className="mt-2 pt-2 border-top border-pink-100"><strong>Observaciones post-servicio:</strong> {fd.postServiceObs}</Col>}
                                  </Row>
                                )}

                                {entry.type === "aesthetic" && (
                                  <Row className="g-2 text-xs text-gray-700 bg-emerald-50 bg-opacity-40 p-3 rounded-xl border border-emerald-100 mb-2">
                                    {fd.treatmentType && <Col xs={6} md={4}><strong>Tratamiento:</strong> {fd.treatmentType}</Col>}
                                    {fd.productUsed && <Col xs={6} md={4}><strong>Producto:</strong> {fd.productUsed}</Col>}
                                    {fd.treatedZone && <Col xs={6} md={4}><strong>Zona tratada:</strong> {fd.treatedZone}</Col>}
                                    {fd.intensityFrequency && <Col xs={6} md={4}><strong>Intensidad:</strong> {fd.intensityFrequency}</Col>}
                                    {fd.clientReaction && <Col xs={6} md={4}><strong>Reacción:</strong> {fd.clientReaction}</Col>}
                                    {fd.aestheticRecommendations && <Col xs={12} className="mt-2 pt-2 border-top border-emerald-100"><strong>Recomendaciones:</strong> {fd.aestheticRecommendations}</Col>}
                                  </Row>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* PESTAÑA 3: LÍNEA DE TIEMPO CRM */}
            {activeTab === "timeline" && crmData && (
              <div>
                <Row className="g-4">
                  {/* Columna Izquierda: Galería de Evolución */}
                  <Col lg={5} className="mb-4 mb-lg-0">
                    <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm h-100">
                      <h3 className="h6 fw-bold mb-4 d-flex align-items-center gap-2 text-gray-900 border-bottom pb-3">
                        <Camera size={18} className="text-purple-500" />
                        <span>Galería de Evolución Visual</span>
                      </h3>

                      {groupedGallery.length === 0 ? (
                        <div className="text-center py-5 text-muted my-auto">
                          <div className="p-3 bg-light rounded-circle d-inline-flex mb-3 text-purple-300">
                            <Camera size={32} />
                          </div>
                          <div className="fw-bold text-dark mb-1">Sin fotos de evolución</div>
                          <p className="small text-muted px-3">
                            Las fotos tomadas por el profesional al finalizar las citas aparecerán aquí.
                          </p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-3.5 overflow-auto" style={{ maxHeight: "650px", paddingRight: "4px" }}>
                          {groupedGallery.map((group) => {
                            const dateLabel = new Date(group.date).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            });
                            return (
                              <div key={group.appointmentId} className="p-3 border rounded-2xl bg-light bg-opacity-50">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <div className="fw-bold text-gray-900 small">{group.serviceName}</div>
                                    <div className="text-muted smaller">Por: {group.workerName}</div>
                                  </div>
                                  <Badge bg="purple" className="bg-purple-100 text-purple-700 fw-bold rounded-pill px-2.5 py-1" style={{ fontSize: "10.5px" }}>
                                    {dateLabel}
                                  </Badge>
                                </div>

                                <Row className="g-2 mt-1">
                                  {/* Antes */}
                                  <Col xs={6}>
                                    <div className="position-relative border rounded-xl overflow-hidden bg-gray-100 aspect-square d-flex align-items-center justify-content-center" style={{ height: "130px" }}>
                                      {group.before ? (
                                        <>
                                          <img
                                            src={getImageUrl(group.before)}
                                            alt="Antes"
                                            className="w-100 h-100 object-fit-cover transition-all hover-scale"
                                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                          />
                                          <span className="position-absolute bottom-2 left-2 badge bg-amber-500 text-white rounded px-2 py-1 fw-bold" style={{ fontSize: "9px", left: "6px", bottom: "6px" }}>
                                            Antes
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-muted smaller">Sin foto antes</span>
                                      )}
                                    </div>
                                  </Col>

                                  {/* Después */}
                                  <Col xs={6}>
                                    <div className="position-relative border rounded-xl overflow-hidden bg-gray-100 aspect-square d-flex align-items-center justify-content-center" style={{ height: "130px" }}>
                                      {group.after ? (
                                        <>
                                          <img
                                            src={getImageUrl(group.after)}
                                            alt="Después"
                                            className="w-100 h-100 object-fit-cover transition-all hover-scale"
                                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                          />
                                          <span className="position-absolute bottom-2 left-2 badge bg-emerald-500 text-white rounded px-2 py-1 fw-bold" style={{ fontSize: "9px", left: "6px", bottom: "6px" }}>
                                            Después
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-muted smaller">Sin foto después</span>
                                      )}
                                    </div>
                                  </Col>
                                </Row>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </Col>

                  {/* Columna Derecha: Línea de Tiempo */}
                  <Col lg={7}>
                    <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm h-100">
                      <h3 className="h6 fw-bold mb-4 d-flex align-items-center gap-2 text-gray-900 border-bottom pb-3">
                        <Clock size={18} className="text-purple-500" />
                        <span>{isMedical ? "Línea de Tiempo de Evolución Clínica" : "Línea de Tiempo de Evolución y Estilo"}</span>
                      </h3>

                      {(() => {
                        const filteredTimeline = (crmData.timeline || []).filter(event => {
                          if (event.type === "clinical_note" && !canViewNotes) return false;
                          return true;
                        });

                        if (filteredTimeline.length === 0) {
                          return (
                            <div className="text-center py-5 text-muted small">
                              Sin eventos registrados en la línea de tiempo.
                            </div>
                          );
                        }

                        return (
                          <div className="position-relative ps-4 ms-2" style={{ borderLeft: "2px solid #e9d5ff" }}>
                            {filteredTimeline.map((event, index) => {
                              return (
                                <div key={event.id} className="position-relative mb-5 animate-fade-in">
                                  {/* Dot indicator */}
                                  <div 
                                    className="position-absolute rounded-circle d-flex align-items-center justify-content-center shadow"
                                    style={{ 
                                      left: "-32px", 
                                      top: "0px", 
                                      width: "24px", 
                                      height: "24px",
                                      backgroundColor: event.type === "creation" ? "#3b82f6" : event.type === "appointment" ? (event.status === "DONE" ? "#10b981" : "#f59e0b") : event.type === "clinical_note" ? "#8b5cf6" : "#ec4899",
                                      color: "#fff",
                                      fontSize: "10px"
                                    }}
                                  >
                                    {event.type === "creation" ? "✓" : event.type === "appointment" ? "📅" : event.type === "clinical_note" ? "📝" : "🖼️"}
                                  </div>

                                  {/* Event Header */}
                                  <div className="d-flex justify-content-between align-items-baseline mb-2 flex-wrap gap-2">
                                    <h5 className="h6 fw-bold text-gray-900 m-0">{event.title}</h5>
                                    <small className="text-purple-600 fw-bold bg-purple-50 rounded-pill px-2.5 py-0.5" style={{ fontSize: "12px" }}>
                                      {new Date(event.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} hs
                                    </small>
                                  </div>

                                  {/* Event Body */}
                                  <div className="p-3 rounded-xl bg-light border shadow-inner text-gray-700" style={{ fontSize: "13.5px" }}>
                                    <p className="mb-0">{event.description}</p>
                                    
                                    {/* Specialized payload elements based on event type */}
                                    {event.type === "appointment" && (
                                      <div className="mt-2 pt-2 border-top border-gray-200 d-flex flex-wrap gap-3 align-items-center">
                                        <span className={`badge ${
                                          event.status === "DONE" ? "bg-secondary" : event.status === "CONFIRMED" ? "bg-success" : event.status === "CANCELLED" ? "bg-danger" : "bg-warning"
                                        }`}>
                                          {event.status === "DONE" ? "Realizada" : event.status === "CONFIRMED" ? "Confirmada" : event.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                                        </span>
                                        {canViewFinance && (
                                          <span className="fw-bold text-dark">{currency(event.metadata.price)}</span>
                                        )}
                                        {event.metadata.notes && (
                                          <span className="text-muted smaller italic">"{event.metadata.notes}"</span>
                                        )}
                                      </div>
                                    )}

                                    {event.type === "clinical_note" && (
                                      <div className="mt-2 pt-2 border-top border-gray-200">
                                        <div className="text-muted smaller fw-bold uppercase">{isMedical ? "Recomendaciones Clínicas:" : "Recomendaciones de Estilo/Autocuidado:"}</div>
                                        <div className="text-emerald-800 bg-emerald-50 rounded p-2 mt-1">
                                          {event.metadata.recommendations || "Sin especificaciones especiales."}
                                        </div>
                                      </div>
                                    )}

                                    {event.type === "photos_session" && (
                                      <div className="mt-3">
                                        <Row className="g-2">
                                          {event.metadata.photos?.map((photo) => (
                                            <Col xs={6} md={3} key={photo.id}>
                                              <div className="position-relative border rounded-lg overflow-hidden" style={{ height: "90px" }}>
                                                <img
                                                  src={getImageUrl(photo.imageUrl)}
                                                  alt={photo.type}
                                                  className="w-100 h-100 object-fit-cover"
                                                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                                                />
                                                <span 
                                                  className={`position-absolute bottom-1 left-1 badge rounded px-1.5 py-0.5 text-white fw-bold ${
                                                    photo.type === "before" ? "bg-amber-500" : "bg-emerald-500"
                                                  }`}
                                                  style={{ fontSize: "8px", left: "4px", bottom: "4px" }}
                                                >
                                                  {photo.type === "before" ? "Antes" : "Después"}
                                                </span>
                                              </div>
                                            </Col>
                                          ))}
                                        </Row>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* PESTAÑA 4: HISTORIAL COMPLETO DE CITAS */}
            {activeTab === "turnos" && (
              <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-gray-900 border-bottom pb-3">
                  <Calendar size={18} className="text-purple-500" />
                  <span>Historial de Citas del Cliente</span>
                </h3>
                
                {clientAppts.length === 0 ? (
                  <div className="text-muted py-4 text-center">No hay citas registradas para este cliente.</div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0 align-middle">
                      <thead>
                        <tr className="table-header-small" style={{ fontSize: "11px", backgroundColor: "#f9fafb" }}>
                          <th className="py-2.5">Fecha y Hora</th>
                          <th className="py-2.5">Servicio</th>
                          <th className="py-2.5">Profesional</th>
                          {canViewFinance && <th className="py-2.5">Precio</th>}
                          <th className="py-2.5">Estado</th>
                          <th className="py-2.5">Notas / Comentarios</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: "13px" }}>
                        {clientAppts.map((a) => (
                          <tr key={a.id} className="transition-all hover-bg-light">
                            <td className="text-secondary fw-semibold">
                              {(() => {
                                if (!a.startsAt) return "—";
                                const d = new Date(a.startsAt);
                                if (isNaN(d.getTime())) return "—";
                                return d.toLocaleString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " hs";
                              })()}
                            </td>
                            <td className="fw-bold text-gray-900">{a.service?.name}</td>
                            <td className="text-gray-700">{a.worker ? `${a.worker.firstName} ${a.worker.lastName}` : "General"}</td>
                            {canViewFinance && <td className="fw-black text-purple-700">{currency(a.service?.price)}</td>}
                            <td>
                              <Badge 
                                bg={a.status === "DONE" ? "secondary" : a.status === "CONFIRMED" ? "success" : a.status === "CANCELLED" ? "danger" : "warning"} 
                                className="rounded-pill px-2.5 py-1.5 fw-bold"
                              >
                                {a.status === "DONE" ? "Finalizada" : a.status === "CONFIRMED" ? "Confirmada" : a.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                              </Badge>
                            </td>
                            <td className="text-muted smaller italic">{a.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card>
            )}

            {/* PESTAÑA 5: HISTORIAL DE CONSENTIMIENTOS */}
            {activeTab === "consentimientos" && (
              <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3 flex-wrap gap-2">
                  <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2 text-gray-900">
                    <FileText size={18} className="text-purple-500" />
                    <span>Consentimientos Informados Digitales</span>
                  </h3>
                  <Button 
                    variant="purple" 
                    className="rounded-xl px-4 py-2 text-white bg-purple-600 border-0 hover-bg-purple-700 fw-bold shadow-sm d-flex align-items-center gap-1.5"
                    onClick={() => {
                      setGeneratedRequest(null);
                      setSelectedTemplateId("");
                      setShowRequestModal(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Solicitar Firma</span>
                  </Button>
                </div>

                {loadingConsents ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="purple" className="text-purple-600" />
                    <p className="text-muted mt-2 small">Cargando registros...</p>
                  </div>
                ) : (
                  <Row className="g-4">
                    {/* Lista de Firmados */}
                    <Col md={12}>
                      <h4 className="smaller text-muted fw-bold uppercase mb-3">Documentos Firmados ({consentsList.length})</h4>
                      {consentsList.length === 0 ? (
                        <div className="text-center py-4 bg-light rounded-xl text-muted small border mb-4">
                          No hay consentimientos firmados para este cliente.
                        </div>
                      ) : (
                        <div className="table-responsive border rounded-xl bg-light mb-4">
                          <Table hover className="mb-0 align-middle">
                            <thead>
                              <tr className="table-header-small" style={{ fontSize: "11px" }}>
                                <th className="py-2.5">Procedimiento</th>
                                <th>Versión</th>
                                <th>Firmado por</th>
                                <th>Fecha de Aceptación</th>
                                <th className="text-end pe-3">Acciones</th>
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: "13px" }}>
                              {consentsList.map(r => (
                                <tr key={r.id}>
                                  <td className="fw-bold text-purple-950 py-2.5">{r.template?.name || "Consentimiento"}</td>
                                  <td><span className="badge bg-light text-dark border">v{r.templateVersion}</span></td>
                                  <td className="fw-semibold">{r.fullNameTyped}</td>
                                  <td>{new Date(r.acceptedAt).toLocaleString("es-AR")} hs</td>
                                  <td className="text-end pe-3">
                                    <Button
                                      size="sm"
                                      variant="outline-purple"
                                      className="rounded-xl px-3 py-1 text-xs fw-bold"
                                      onClick={async () => {
                                        try {
                                          setLoadingRecordDetail(true);
                                          setShowRecordDetailModal(true);
                                          const detailsRes = await api.get(`/consents/records/${r.id}`);
                                          setActiveRecordDetails(detailsRes.data);
                                          setLoadingRecordDetail(false);
                                        } catch (detailErr) {
                                          console.error(detailErr);
                                          alert("Error cargando detalles del registro.");
                                          setShowRecordDetailModal(false);
                                          setLoadingRecordDetail(false);
                                        }
                                      }}
                                    >
                                      Ver Documento
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Col>

                    {/* Lista de Pendientes / Enviados */}
                    <Col md={12}>
                      <h4 className="smaller text-muted fw-bold uppercase mb-3">Solicitudes Pendientes / Enviadas ({requestsList.filter(req => req.status === "PENDING").length})</h4>
                      {requestsList.filter(req => req.status === "PENDING").length === 0 ? (
                        <div className="text-center py-4 bg-light rounded-xl text-muted small border">
                          No hay solicitudes pendientes de firma.
                        </div>
                      ) : (
                        <div className="table-responsive border rounded-xl bg-light">
                          <Table hover className="mb-0 align-middle">
                            <thead>
                              <tr className="table-header-small" style={{ fontSize: "11px" }}>
                                <th className="py-2.5">Procedimiento</th>
                                <th>Canal</th>
                                <th>Creado el</th>
                                <th>Expira el</th>
                                <th>Estado</th>
                                <th className="text-end pe-3">Acciones</th>
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: "13px" }}>
                              {requestsList.filter(req => req.status === "PENDING").map(req => {
                                const link = `${window.location.origin}/consent/${req.token}`;
                                return (
                                  <tr key={req.id}>
                                    <td className="fw-bold text-gray-900 py-2.5">{req.template?.name}</td>
                                    <td>
                                      <span className="badge bg-purple-50 text-purple-700 border border-purple-100">
                                        {req.channel === "qr" ? "QR en Recepción" : "WhatsApp/Link"}
                                      </span>
                                    </td>
                                    <td>{new Date(req.createdAt).toLocaleDateString("es-AR")}</td>
                                    <td>{new Date(req.expiresAt).toLocaleDateString("es-AR")}</td>
                                    <td>
                                      <span className="badge bg-warning text-dark animate-pulse">Pendiente</span>
                                    </td>
                                    <td className="text-end pe-3">
                                      <div className="d-flex justify-content-end gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="light"
                                          className="rounded-xl px-2 py-1 text-xs border"
                                          onClick={() => {
                                            navigator.clipboard.writeText(link);
                                            alert("Enlace copiado al portapapeles.");
                                          }}
                                        >
                                          Copiar Link
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="success"
                                          className="rounded-xl px-2 py-1 text-xs border-0"
                                          onClick={() => {
                                            const message = `Hola ${client.firstName}. Por favor lee y firma el consentimiento digital para tu procedimiento aquí: ${link}`;
                                            window.open(`https://wa.me/${client.phone ? client.phone.replace(/\D/g, "") : ""}?text=${encodeURIComponent(message)}`, "_blank");
                                          }}
                                        >
                                          WhatsApp
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Col>
                  </Row>
                )}
              </Card>
            )}

            {/* PESTAÑA 6: HISTORIAL VISUAL */}
            {activeTab === "historial_visual" && (() => {
              const marketingConsent = crmData?.client?.marketingConsent === true || client?.marketingConsent === true;
              return (
                <Card className="border-0 border bg-white p-4 rounded-2xl shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3 flex-wrap gap-2">
                    <h3 className="h6 fw-bold m-0 d-flex align-items-center gap-2 text-gray-900">
                      <Camera size={18} className="text-purple-500" />
                      <span>{t("clients.visualHistory.title")}</span>
                    </h3>
                    {marketingConsent && crmData?.gallery?.length > 0 && (
                      <Button 
                        variant="purple" 
                        className="rounded-xl px-4 py-2 text-white bg-purple-600 border-0 hover-bg-purple-700 fw-bold shadow-sm d-flex align-items-center gap-1.5"
                        onClick={handleInstagramCreate}
                        style={{ fontSize: "13px" }}
                      >
                        <Sparkles size={14} />
                        <span>{t("clients.visualHistory.createInstagram")}</span>
                      </Button>
                    )}
                  </div>

                  {!marketingConsent && (
                    <Alert variant="warning" className="rounded-2xl mb-4 border-0 shadow-sm bg-warning bg-opacity-10 text-warning-800">
                      {t("clients.visualHistory.consentWarning")}
                    </Alert>
                  )}

                  {!crmData?.gallery || crmData.gallery.length === 0 ? (
                    <div className="text-center py-5 bg-light rounded-xl text-muted small border">
                      {t("clients.visualHistory.noPhotos")}
                    </div>
                ) : (
                  <div className="client-visual-gallery animate-fade-in">
                    {(() => {
                      const groups = {};
                      crmData.gallery.forEach(photo => {
                        const dateObj = new Date(photo.createdAt);
                        const dateStr = dateObj.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        });
                        const serviceName = photo.service?.name || "Servicio General";
                        const key = `${dateStr}__${serviceName}`;
                        if (!groups[key]) {
                          groups[key] = {
                            date: dateStr,
                            serviceName,
                            photos: []
                          };
                        }
                        groups[key].photos.push(photo);
                      });

                      const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
                        return new Date(groups[b].photos[0].createdAt) - new Date(groups[a].photos[0].createdAt);
                      });

                      return sortedGroupKeys.map(key => {
                        const group = groups[key];
                        return (
                          <div key={key} className="mb-4 border pb-3.5 px-3.5 pt-3 rounded-2xl bg-light">
                            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                              <span className="fw-black text-dark" style={{ fontSize: "14px" }}>{group.date}</span>
                              <Badge bg="purple" className="px-2.5 py-1.5 text-xs bg-purple-100 text-purple-700 border border-purple-200">{group.serviceName}</Badge>
                            </div>

                            <Row className="g-3">
                              {group.photos.map(p => {
                                const photoUrl = p.imageUrl.startsWith("/uploads/") ? `${api.defaults.baseURL?.replace(/\/api\/?$/, "")}${p.imageUrl}` : p.imageUrl;
                                const uploaderName = p.worker ? `${p.worker.firstName} ${p.worker.lastName}` : "Profesional";
                                const uploaderInitials = p.worker ? `${p.worker.firstName.charAt(0)}${p.worker.lastName.charAt(0)}`.toUpperCase() : "PR";
                                const photoTime = new Date(p.createdAt).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' }) + " hs";

                                return (
                                  <Col xs={12} sm={6} md={4} key={p.id}>
                                    <Card className="h-100 border rounded-xl overflow-hidden shadow-sm bg-white">
                                      <div className="position-relative" style={{ paddingTop: "75%", backgroundColor: "#f8f9fa" }}>
                                        <img 
                                          src={photoUrl} 
                                          alt={p.photoType || p.type}
                                          className="w-100 h-100 position-absolute start-0 top-0"
                                          style={{ objectFit: "cover", cursor: "pointer" }}
                                          onClick={() => {
                                            setLightboxImage(photoUrl);
                                          }}
                                        />
                                        <Badge 
                                          bg="dark" 
                                          className="position-absolute top-2.5 start-2.5 px-2 py-1 text-uppercase"
                                          style={{ fontSize: "9px", background: "rgba(17, 24, 39, 0.75)", letterSpacing: "0.5px" }}
                                        >
                                          {p.photoType === "before" ? t("clients.visualHistory.photoTypeBefore") :
                                           p.photoType === "during" ? t("clients.visualHistory.photoTypeDuring") :
                                           p.photoType === "after" ? t("clients.visualHistory.photoTypeAfter") :
                                           p.photoType === "final" ? t("clients.visualHistory.photoTypeFinal") : t("clients.visualHistory.photoTypeOther")}
                                        </Badge>
                                      </div>
                                      <Card.Body className="p-3 d-flex flex-column gap-2 text-start small">
                                        {p.note && (
                                          <div className="p-2 rounded bg-light border border-purple-opacity text-secondary mb-1">
                                            <strong>{t("clients.visualHistory.note")}</strong> {p.note}
                                          </div>
                                        )}

                                        <div className="mt-2 pt-2 border-top">
                                          <div className="d-flex flex-column gap-1.5">
                                            <Form.Check
                                              type="checkbox"
                                              id={`use-insta-${p.id}`}
                                              label={`✓ ${t("clients.visualHistory.useForInstagram")}`}
                                              checked={p.useForInstagram || false}
                                              disabled={!marketingConsent}
                                              onChange={(e) => handleUpdatePhotoFlag(p.id, "useForInstagram", e.target.checked)}
                                              className="smaller text-secondary font-bold"
                                            />
                                            <Form.Check
                                              type="checkbox"
                                              id={`show-portfolio-${p.id}`}
                                              label={`✓ ${t("clients.visualHistory.showInPortfolio")}`}
                                              checked={p.showInPortfolio || false}
                                              onChange={(e) => handleUpdatePhotoFlag(p.id, "showInPortfolio", e.target.checked)}
                                              className="smaller text-secondary"
                                            />
                                            <Form.Check
                                              type="checkbox"
                                              id={`highlight-result-${p.id}`}
                                              label={`✓ ${t("clients.visualHistory.highlightResult")}`}
                                              checked={p.highlightResult || false}
                                              onChange={(e) => handleUpdatePhotoFlag(p.id, "highlightResult", e.target.checked)}
                                              className="smaller text-secondary"
                                            />
                                          </div>
                                        </div>
                                        
                                        <div className="d-flex align-items-center gap-2 mt-auto border-top pt-2">
                                          <div 
                                            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                                            style={{
                                              width: "24px",
                                              height: "24px",
                                              background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                                              fontSize: "8.5px"
                                            }}
                                            title={`Cargado por ${uploaderName}`}
                                          >
                                            {uploaderInitials}
                                          </div>
                                          <div>
                                            <span className="text-dark d-block" style={{ fontSize: "10.5px", fontWeight: 600 }}>{uploaderName}</span>
                                            <span className="text-muted d-block" style={{ fontSize: "9.5px" }}>{photoTime}</span>
                                          </div>
                                        </div>
                                      </Card.Body>
                                      <Card.Footer className="bg-light border-0 py-2 px-3 d-flex justify-content-between gap-2">
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          className="rounded-pill px-3 flex-grow-1 font-bold text-xs"
                                          onClick={() => window.open(photoUrl, "_blank")}
                                        >
                                          Descargar
                                        </Button>
                                        
                                        {hasPermission("clients.edit") && (
                                          <Button
                                            variant="danger"
                                            size="sm"
                                            className="rounded-pill px-2.5 text-xs bg-red-600 hover-bg-red-700 border-0"
                                            onClick={async () => {
                                              if (!window.confirm("¿Estás seguro de que deseas eliminar esta fotografía del historial visual del cliente?")) return;
                                              try {
                                                await api.delete(`/appointments/photos/${p.id}`);
                                                const res = await api.get(`/crm/${client.id}`);
                                                if (res.data) {
                                                  setCrmData(res.data);
                                                }
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            }}
                                          >
                                            Eliminar
                                          </Button>
                                        )}
                                      </Card.Footer>
                                    </Card>
                                  </Col>
                                );
                              })}
                            </Row>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </Card>
            )})}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 bg-light rounded-bottom px-4 py-3">
        <Button variant="secondary" onClick={onHide} className="rounded-xl px-4 py-2 fw-semibold">
          Cerrar
        </Button>
      </Modal.Footer>

      {/* MODAL GENERAR SOLICITUD / MOSTRAR QR */}
      <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered className="hegemonic-modal">
        <Modal.Header closeButton className="border-0 pb-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark">Solicitar Firma de Consentimiento</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {!generatedRequest ? (
            <Form onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedTemplateId) return;
              try {
                setSavingNotes(true);
                const res = await api.post("/consents/requests", {
                  templateId: selectedTemplateId,
                  clientId: client.id,
                  channel: requestChannel
                });
                setGeneratedRequest(res.data);
                fetchConsentData();
              } catch (err) {
                console.error(err);
                alert("Error generando la solicitud.");
              } finally {
                setSavingNotes(false);
              }
            }}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">1. Selecciona el procedimiento/plantilla</Form.Label>
                <Form.Select
                  required
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="rounded-xl border-gray-200"
                >
                  <option value="">-- Seleccionar Plantilla --</option>
                  {consentTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">2. Canal de Firma</Form.Label>
                <Form.Select
                  value={requestChannel}
                  onChange={(e) => setRequestChannel(e.target.value)}
                  className="rounded-xl border-gray-200"
                >
                  <option value="link">Enviar Link por WhatsApp / Email</option>
                  <option value="qr">Mostrar código QR en pantalla (Tablet/Recepción)</option>
                </Form.Select>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="light" className="rounded-xl px-4 py-2" onClick={() => setShowRequestModal(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="purple"
                  type="submit"
                  disabled={!selectedTemplateId || savingNotes}
                  className="rounded-xl px-4 py-2 text-white bg-purple-600 border-0 hover-bg-purple-700 shadow"
                >
                  {savingNotes ? "Generando..." : "Generar Solicitud"}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="text-center py-3">
              {requestChannel === "qr" ? (
                <div>
                  <h5 className="fw-bold text-purple-950 mb-3">Haga escanear este código QR al cliente</h5>
                  <div className="d-inline-flex p-3 bg-white border rounded-3 shadow-sm mb-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/consent/${generatedRequest.token}`)}`} 
                      alt="Código QR"
                      style={{ width: 200, height: 200 }} 
                    />
                  </div>
                  <p className="text-muted small px-3">
                    El cliente puede apuntar la cámara de su teléfono para abrir el consentimiento legal, declarar sus alergias y firmar.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle d-inline-flex mb-3">
                    <CheckCircle size={32} />
                  </div>
                  <h5 className="fw-bold text-purple-950 mb-3">¡Solicitud Generada Exitosamente!</h5>
                  <p className="text-muted small mb-4">El enlace está listo para ser compartido con el cliente.</p>

                  <div className="d-grid gap-2 col-10 mx-auto">
                    <Button 
                      variant="purple"
                      className="rounded-xl py-2 fw-bold text-white bg-purple-600 border-0 shadow-sm"
                      onClick={() => {
                        const link = `${window.location.origin}/consent/${generatedRequest.token}`;
                        navigator.clipboard.writeText(link);
                        alert("Enlace copiado al portapapeles.");
                      }}
                    >
                      Copiar Enlace de Firma
                    </Button>
                    <Button 
                      variant="success"
                      className="rounded-xl py-2 fw-bold border-0 shadow-sm"
                      onClick={() => {
                        const link = `${window.location.origin}/consent/${generatedRequest.token}`;
                        const message = `Hola ${client.firstName}. Por favor lee y firma el consentimiento digital para tu procedimiento aquí: ${link}`;
                        window.open(`https://wa.me/${client.phone ? client.phone.replace(/\D/g, "") : ""}?text=${encodeURIComponent(message)}`, "_blank");
                      }}
                    >
                      Enviar por WhatsApp
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-top mt-4 pt-3 text-center">
                <Button variant="secondary" className="rounded-xl px-4 py-2" onClick={() => setShowRequestModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* MODAL DETALLES DE REGISTRO FIRMADO */}
      <Modal show={showRecordDetailModal} onHide={() => setShowRecordDetailModal(false)} size="lg" centered className="hegemonic-modal">
        <Modal.Header closeButton className="border-0 pb-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark">Consentimiento Firmado Inmutable</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 bg-white">
          {loadingRecordDetail ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="purple" className="text-purple-600" />
              <p className="text-muted mt-2 fw-semibold">Cargando detalles del consentimiento...</p>
            </div>
          ) : activeRecordDetails ? (
            <div>
              <div id="printable-consent-document" className="p-3 border rounded-3 bg-white text-dark mb-4">
                <div style={{ borderBottom: "2px solid #7c3aed", paddingBottom: "15px", marginBottom: "20px" }}>
                  <h4 className="fw-black m-0" style={{ color: "#1a103c" }}>{activeRecordDetails.template?.name}</h4>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}><strong>Establecimiento:</strong> {business?.name || "Aura Studio"}</p>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}><strong>Cliente:</strong> {activeRecordDetails.client?.firstName} {activeRecordDetails.client?.lastName}</p>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}><strong>Fecha de firma:</strong> {new Date(activeRecordDetails.acceptedAt).toLocaleString("es-AR")} hs</p>
                </div>

                <div className="mb-4">
                  <h5 className="h6 fw-bold text-purple-900 border-bottom pb-1 mb-2">Términos y Declaraciones Aceptadas</h5>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "12.5px", lineHeight: "1.6", maxHeight: "200px", overflowY: "auto", padding: "10px", background: "#f9f9f9", borderRadius: "5px", border: "1px solid #eee" }}>
                    {activeRecordDetails.termsSnapshot}
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="h6 fw-bold text-purple-900 border-bottom pb-1 mb-2">Declaración de Salud del Cliente</h5>
                  <Row className="g-2 small">
                    <Col xs={6}><strong>Alergias / Sensibilidades:</strong></Col>
                    <Col xs={6} className={activeRecordDetails.allergies ? "text-danger fw-bold" : "text-muted"}>
                      {activeRecordDetails.allergies || "Ninguna declarada"}
                    </Col>
                    <Col xs={6}><strong>Medicación actual:</strong></Col>
                    <Col xs={6} className={activeRecordDetails.medicalDeclarations?.medication ? "fw-bold" : "text-muted"}>
                      {activeRecordDetails.medicalDeclarations?.medication || "Ninguna"}
                    </Col>
                    <Col xs={6}><strong>¿Embarazo / Lactancia?:</strong></Col>
                    <Col xs={6} className="fw-semibold">
                      {activeRecordDetails.medicalDeclarations?.pregnant ? "Sí" : "No"}
                    </Col>
                    <Col xs={6}><strong>Observaciones médicas:</strong></Col>
                    <Col xs={6} className="text-muted">
                      {activeRecordDetails.medicalDeclarations?.conditions || "Ninguna"}
                    </Col>
                  </Row>
                </div>

                <div className="mb-4">
                  <h5 className="h6 fw-bold text-purple-900 border-bottom pb-1 mb-2">Registro de Auditoría Electrónica (Evidencia Digital)</h5>
                  <Row className="g-1 text-xxs text-muted">
                    <Col xs={4}><strong>Token único de firma:</strong></Col>
                    <Col xs={8} className="font-mono">{activeRecordDetails.request?.token || "—"}</Col>
                    <Col xs={4}><strong>Dirección IP:</strong></Col>
                    <Col xs={8} className="font-mono">{activeRecordDetails.ipAddress || "—"}</Col>
                    <Col xs={4}><strong>User-Agent:</strong></Col>
                    <Col xs={8} className="text-truncate">{activeRecordDetails.userAgent || "—"}</Col>
                  </Row>
                </div>

                <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <p style={{ margin: "5px 0", fontSize: "13px" }}><strong>Nombre Tipeado:</strong> {activeRecordDetails.fullNameTyped}</p>
                    <p style={{ margin: "5px 0", fontSize: "11px", color: "#666" }}>Aceptado electrónicamente en conformidad legal.</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: "0 0 5px 0", fontSize: "12px", fontWeight: "bold" }}>Firma del Cliente:</p>
                    <img 
                      src={activeRecordDetails.signatureImage} 
                      alt="Firma del cliente" 
                      style={{ maxWidth: "220px", maxHeight: "80px", borderBottom: "1px solid #444", paddingBottom: "5px" }} 
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between mt-4">
                <Button 
                  variant="outline-purple"
                  className="rounded-xl px-4 py-2 fw-bold"
                  onClick={() => {
                    const printContents = document.getElementById("printable-consent-document").innerHTML;
                    
                    // Create simple print preview window
                    const printWindow = window.open("", "_blank");
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Imprimir Consentimiento</title>
                          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
                          <style>
                            body { font-family: sans-serif; padding: 40px; }
                            @media print {
                              body { padding: 0; }
                              .no-print { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          ${printContents}
                          <script>
                            window.onload = function() {
                              window.print();
                              window.close();
                            }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  <Printer size={16} className="me-1.5" />
                  <span>Imprimir Documento</span>
                </Button>
                
                <Button variant="secondary" className="rounded-xl px-4 py-2" onClick={() => setShowRecordDetailModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">No se pudieron cargar los detalles del registro.</div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal para Tomar/Cargar Foto */}
      <Modal show={showPhotoModal} onHide={closePhotoModal} centered size="md" className="hegemonic-modal">
        <Modal.Header closeButton className="border-0 pb-0 bg-light py-3 px-4">
          <Modal.Title className="fw-bold text-dark d-flex align-items-center gap-2">
            <Camera className="text-purple-600" size={20} />
            <span>Actualizar Foto de Perfil</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center">
          {uploadError && (
            <Alert variant="danger" className="rounded-xl border-0 mb-3 small">
              {uploadError}
            </Alert>
          )}

          {/* Área de Visualización principal */}
          <div className="d-flex flex-column align-items-center justify-content-center mb-4">
            {capturedImage ? (
              // Vista previa de foto capturada o cargada
              <div className="position-relative" style={{ width: "240px", height: "240px" }}>
                <img 
                  src={capturedImage} 
                  alt="Vista previa" 
                  className="rounded-3 shadow-md border object-fit-cover w-100 h-100"
                  style={{ border: "4px solid #fff", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                />
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="position-absolute top-0 end-0 m-2 rounded-circle p-1 d-flex align-items-center justify-content-center border-0 shadow"
                  onClick={() => setCapturedImage(null)}
                  style={{ width: "30px", height: "30px" }}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : cameraActive ? (
              // Previsualización de cámara en vivo
              <div className="position-relative" style={{ width: "280px", height: "280px" }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="rounded-3 shadow-md border w-100 h-100 object-fit-cover"
                  style={{ transform: "scaleX(-1)", border: "4px solid #fff", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
                />
                <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
                  <Button 
                    variant="purple" 
                    className="rounded-pill px-4 py-2 shadow fw-bold d-flex align-items-center gap-2 text-white border-0"
                    onClick={capturePhoto}
                    style={{ background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)" }}
                  >
                    <Camera size={16} />
                    <span>Tomar Foto</span>
                  </Button>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="position-absolute top-0 end-0 m-2 rounded-circle p-1 d-flex align-items-center justify-content-center border-0 shadow"
                  onClick={stopCamera}
                  style={{ width: "30px", height: "30px", backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <X size={16} className="text-white" />
                </Button>
              </div>
            ) : (
              // Opciones para empezar (Cámara o Archivo)
              <div 
                className="border-dashed rounded-3 p-5 d-flex flex-column align-items-center justify-content-center cursor-pointer hover-bg-gray-50 transition-all w-100"
                style={{ 
                  border: "2px dashed #d8b4fe", 
                  backgroundColor: "#faf5ff", 
                  minHeight: "240px",
                  borderRadius: "16px"
                }}
              >
                <Upload className="text-purple-400 mb-3" size={48} />
                <p className="fw-semibold text-gray-700 mb-2">Selecciona una opción para tu avatar</p>
                <p className="text-muted small mb-4">Usa la cámara en vivo o sube una imagen de tu dispositivo</p>
                
                <div className="d-flex gap-2.5 flex-wrap justify-content-center">
                  <Button 
                    variant="purple" 
                    className="rounded-xl px-4 py-2.5 fw-bold text-white border-0 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)" }}
                    onClick={startCamera}
                  >
                    <Camera size={16} className="me-2" />
                    Usar Cámara
                  </Button>
                  <label 
                    className="btn btn-outline-secondary rounded-xl px-4 py-2.5 fw-bold d-flex align-items-center justify-content-center m-0 cursor-pointer shadow-sm bg-white"
                  >
                    <Upload size={16} className="me-2" />
                    Subir Archivo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="d-none" 
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 bg-light p-3 rounded-bottom d-flex justify-content-end gap-2">
          <Button 
            variant="light" 
            className="rounded-xl px-4 py-2 fw-semibold border"
            onClick={closePhotoModal}
            disabled={uploading}
          >
            Cancelar
          </Button>
          {capturedImage && (
            <Button 
              variant="purple" 
              className="rounded-xl px-4 py-2 fw-bold text-white border-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)" }}
              onClick={handleUploadPhoto}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Guardando...
                </>
              ) : (
                "Guardar Foto"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Lightbox Modal para Vista Ampliada */}
      <Modal show={!!lightboxImage} onHide={() => setLightboxImage(null)} centered size="lg" className="hegemonic-modal">
        <Modal.Header closeButton className="border-0 pb-0 bg-transparent position-absolute end-0 top-0" style={{ zIndex: 1060 }}></Modal.Header>
        <Modal.Body className="p-0 bg-dark rounded-3 overflow-hidden text-center d-flex align-items-center justify-content-center" style={{ minHeight: "300px" }}>
          <img src={lightboxImage} alt="Expanded Preview" className="img-fluid" style={{ maxHeight: "85vh", objectFit: "contain" }} />
        </Modal.Body>
      </Modal>
    </Modal>
  );
}
