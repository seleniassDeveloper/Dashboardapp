import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Nav, Button, Form, Spinner, Alert, Badge, Table, ButtonGroup } from "react-bootstrap";
import { 
  Sparkles, Camera, Image as ImageIcon, Layout, Download, Share2, 
  Trash2, Plus, ArrowLeft, ArrowRight, Check, RefreshCw, Move, RotateCw, 
  Type, Smile, Heart, CheckCircle2, Calendar, FileText, Send, HelpCircle,
  Scissors, Briefcase
} from "lucide-react";
import api, { API_BASE_URL } from "../lib/api.js";
import { useTranslation } from "react-i18next";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const host = API_BASE_URL.replace(/\/api$/, "");
  return `${host}${url}`;
};

export default function MarketingView() {
  const { t, i18n } = useTranslation("views");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab State
  const activeTab = searchParams.get("tab") || "resumen";
  const clientIdParam = searchParams.get("clientId");
  const photoIdsParam = searchParams.get("photoIds");

  // CRM Data & Library
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [posts, setPosts] = useState([]);
  const [authorizedPhotos, setAuthorizedPhotos] = useState([]);
  
  // Creation Wizard states
  const [isCreating, setIsCreating] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPhotos, setSelectedPhotos] = useState([]); // List of photo objects
  const [imageLayoutMode, setImageLayoutMode] = useState("single"); // "single" | "before_after" | "multi" | "carousel"
  
  // Format Step
  const [selectedFormat, setSelectedFormat] = useState("POST_1X1"); // POST_1X1, STORY_9X16, REEL_COVER, etc.

  // Customization Step
  const [addLogo, setAddLogo] = useState(true);
  const [businessNameStr, setBusinessNameStr] = useState("");
  const [addBusinessName, setAddBusinessName] = useState(true);
  const [watermarkText, setWatermarkText] = useState("Aura Dash Studio");
  const [addWatermark, setAddWatermark] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [textPosition, setTextPosition] = useState("bottom"); // top, middle, bottom
  const [textStyle, setTextStyle] = useState("modern"); // classic, modern, script
  const [rotationAngles, setRotationAngles] = useState({}); // { photoId: angle }
  
  // IA Step
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [selectedRubro, setSelectedRubro] = useState("Estética");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedCta, setSelectedCta] = useState("Agenda tu turno");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  
  // Post Save details
  const [postStatus, setPostStatus] = useState("DRAFT"); // DRAFT, READY, SCHEDULED
  const [scheduledDate, setScheduledDate] = useState("");
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Load Business Name and Library posts
  useEffect(() => {
    fetchPosts();
    fetchAuthorizedPhotos();
    // Fetch active business to prefill info
    api.get("/appointments/business")
      .then(res => {
        if (res.data?.name) {
          setBusinessNameStr(res.data.name);
          setWatermarkText(res.data.name);
        }
      })
      .catch(e => console.error("Error loading business config:", e));
  }, []);

  // Handle URL Pre-population
  useEffect(() => {
    if (clientIdParam && photoIdsParam && authorizedPhotos.length > 0) {
      const ids = photoIdsParam.split(",");
      const matched = authorizedPhotos.filter(p => ids.includes(p.id));
      if (matched.length > 0) {
        setSelectedPhotos(matched);
        setIsCreating(true);
        setWizardStep(1);
        if (matched.length === 2) {
          setImageLayoutMode("before_after");
        } else if (matched.length > 2) {
          setImageLayoutMode("carousel");
        }
        // Prefill service name from first photo if available
        if (matched[0]?.service?.name) {
          setSelectedServiceName(matched[0].service.name);
        }
      }
    }
  }, [clientIdParam, photoIdsParam, authorizedPhotos]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/marketing/posts");
      setPosts(res.data || []);
    } catch (err) {
      console.error(err);
      setError(t("marketing.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorizedPhotos = async () => {
    try {
      // Fetch all appointment photos and check client marketing consent
      const res = await api.get("/clients");
      const clients = res.data || [];
      const authorizedClients = clients.filter(c => c.marketingConsent === true);
      const authClientIds = authorizedClients.map(c => c.id);

      // Get all photos
      const appointmentsRes = await api.get("/appointments");
      const appts = appointmentsRes.data || [];
      
      // Collect all photos from appointments that belong to authorized clients
      const allPhotos = [];
      appts.forEach(appt => {
        if (authClientIds.includes(appt.clientId) && appt.photos) {
          appt.photos.forEach(photo => {
            allPhotos.push({
              ...photo,
              client: appt.client,
              worker: appt.worker,
              service: appt.service,
              appointment: appt
            });
          });
        }
      });
      setAuthorizedPhotos(allPhotos);
    } catch (err) {
      console.error("Error loading authorized photos:", err);
      setError(t("marketing.loadPhotosError"));
    }
  };

  const handleUpdatePhotoFlag = async (photoId, flag, value) => {
    try {
      await api.put(`/appointments/photos/${photoId}`, { [flag]: value });
      setAuthorizedPhotos(prev => prev.map(p => p.id === photoId ? { ...p, [flag]: value } : p));
      if (selectedPhotos.some(p => p.id === photoId)) {
        setSelectedPhotos(prev => prev.map(p => p.id === photoId ? { ...p, [flag]: value } : p));
      }
    } catch (err) {
      console.error("Error updating photo metadata:", err);
    }
  };

  const handleGenerateCaption = async () => {
    try {
      setIsGeneratingCaption(true);
      setError("");
      const res = await api.post("/marketing/generate-caption", {
        serviceName: selectedServiceName,
        rubro: selectedRubro,
        format: selectedFormat,
        cta: selectedCta,
        tone: selectedTone,
        lang: i18n.language?.substring(0, 2) || "es"
      });
      if (res.data) {
        setCaption(res.data.caption || "");
        setHashtags(res.data.hashtags || "");
      }
    } catch (err) {
      console.error(err);
      setError(t("marketing.apiError"));
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleSavePost = async () => {
    try {
      setIsSavingPost(true);
      setError("");
      setSuccessMsg("");
      const payload = {
        clientId: selectedPhotos[0]?.clientId || null,
        caption,
        hashtags,
        cta: selectedCta,
        format: selectedFormat,
        status: postStatus,
        imageUrls: selectedPhotos.map(p => p.imageUrl),
        scheduledAt: postStatus === "SCHEDULED" && scheduledDate ? new Date(scheduledDate).toISOString() : null
      };

      await api.post("/marketing/posts", payload);
      setSuccessMsg(t("marketing.saveSuccess"));
      fetchPosts();
      setIsCreating(false);
      resetWizard();
    } catch (err) {
      console.error(err);
      setError(t("marketing.saveError"));
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm(t("marketing.deleteConfirm"))) return;
    try {
      await api.delete(`/marketing/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      setSuccessMsg(t("marketing.deleteSuccess"));
    } catch (err) {
      console.error(err);
      setError("Error");
    }
  };

  const resetWizard = () => {
    setSelectedPhotos([]);
    setImageLayoutMode("single");
    setSelectedFormat("POST_1X1");
    setAddLogo(true);
    setAddBusinessName(true);
    setAddWatermark(false);
    setOverlayText("");
    setTextPosition("bottom");
    setTextStyle("modern");
    setCaption("");
    setHashtags("");
    setScheduledDate("");
    setPostStatus("DRAFT");
    setWizardStep(1);
    setRotationAngles({});
    setSearchParams({}); // Clear query params
  };

  // Helper rotate photo visual
  const handleRotate = (photoId) => {
    setRotationAngles(prev => {
      const curr = prev[photoId] || 0;
      return { ...prev, [photoId]: (curr + 90) % 360 };
    });
  };

  // Drag and drop sorting carousel mock
  const movePhoto = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= selectedPhotos.length) return;
    const list = [...selectedPhotos];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setSelectedPhotos(list);
  };

  // Dynamic ZIP exporter using dynamic script load CDN JSZip
  const handleDownloadZip = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (!window.JSZip) {
        // Load JSZip dynamically
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const zip = new window.JSZip();
      const folder = zip.folder("carrusel_instagram");

      // Fetch and append each image
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const url = getImageUrl(photo.imageUrl);
        const response = await fetch(url);
        const blob = await response.blob();
        const extension = photo.imageUrl.split(".").pop().split("?")[0] || "jpg";
        folder.file(`imagen_${i + 1}.${extension}`, blob);
      }

      // Add a text file with caption and hashtags
      folder.file("publicacion_instagram.txt", `CAPTION:\n${caption}\n\nHASHTAGS:\n${hashtags}\n\nCTA:\n${selectedCta}`);

      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `aura_instagram_post_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg(t("marketing.copySuccess", { type: "ZIP" }));
    } catch (err) {
      console.error(err);
      setError(t("marketing.zipError"));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg(t("marketing.copySuccess", { type }));
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const getFilteredLibrary = () => {
    if (activeTab === "programados") {
      return posts.filter(p => p.status === "SCHEDULED");
    } else if (activeTab === "publicados") {
      return posts.filter(p => p.status === "PUBLISHED");
    } else if (activeTab === "borradores") {
      return posts.filter(p => p.status === "DRAFT");
    }
    return posts;
  };

  return (
    <Container fluid className="px-4 pb-4 animate-fade-in">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-black h3 m-0 d-flex align-items-center gap-2">
            <Sparkles className="text-purple-600 animate-pulse" size={26} />
            <span>{t("marketing.title")}</span>
          </h1>
          <p className="text-muted mb-0 small">
            {t("marketing.subtitle")}
          </p>
        </div>
        {!isCreating && (
          <Button 
            variant="purple" 
            onClick={() => setIsCreating(true)}
            className="rounded-xl px-4 py-2.5 text-white bg-purple-600 border-0 hover-bg-purple-700 fw-bold shadow-sm d-flex align-items-center gap-1.5"
          >
            <Plus size={18} />
            <span>{t("marketing.createBtn")}</span>
          </Button>
        )}
      </header>

      {error && <Alert variant="danger" className="rounded-2xl border-0 shadow-sm mb-4">{error}</Alert>}
      {successMsg && <Alert variant="success" className="rounded-2xl border-0 shadow-sm mb-4">{successMsg}</Alert>}

      {isCreating ? (
        // --- ASISTENTE DE CREACIÓN DE 4 PASOS (WIZARD) ---
        <Card className="card-premium border bg-white p-4 rounded-2xl shadow-sm mb-4">
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
            <div className="d-flex align-items-center gap-3">
              <span className="badge rounded-pill px-3 py-2 fw-bold" style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
                {t("marketing.wizard.stepCount", { step: wizardStep })}
              </span>
              <h2 className="fw-black text-dark tracking-tight mb-0 h5">
                {wizardStep === 1 && t("marketing.wizard.step1Title")}
                {wizardStep === 2 && t("marketing.wizard.step2Title")}
                {wizardStep === 3 && t("marketing.wizard.step3Title")}
                {wizardStep === 4 && t("marketing.wizard.step4Title")}
              </h2>
            </div>
            <Button variant="light" className="rounded-xl px-3" onClick={resetWizard}>
              {t("marketing.cancel")}
            </Button>
          </div>

          {/* PASO 1: SELECCIONAR IMÁGENES */}
          {wizardStep === 1 && (
            <div className="animate-fade-in">
              <h3 className="h6 fw-bold text-secondary mb-3">
                {t("marketing.step1.header")}
              </h3>
              
              <div className="mb-4">
                <Form.Label className="smaller text-muted fw-bold">{t("marketing.step1.layoutMode")}</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    id="layout-single"
                    name="layoutMode"
                    label={t("marketing.step1.layoutSingle")}
                    checked={imageLayoutMode === "single"}
                    onChange={() => setImageLayoutMode("single")}
                  />
                  <Form.Check
                    type="radio"
                    id="layout-before-after"
                    name="layoutMode"
                    label={t("marketing.step1.layoutBeforeAfter")}
                    checked={imageLayoutMode === "before_after"}
                    onChange={() => setImageLayoutMode("before_after")}
                  />
                  <Form.Check
                    type="radio"
                    id="layout-carousel"
                    name="layoutMode"
                    label={t("marketing.step1.layoutCarousel")}
                    checked={imageLayoutMode === "carousel"}
                    onChange={() => setImageLayoutMode("carousel")}
                  />
                </div>
              </div>

              <Row className="g-3 max-h-400 overflow-auto border rounded-2xl p-3 bg-light bg-opacity-35 mb-4">
                {authorizedPhotos.length === 0 ? (
                  <Col xs={12} className="text-center py-5 text-muted small">
                    <ImageIcon size={32} className="mb-2" />
                    <p className="mb-0">{t("marketing.step1.noPhotos")}</p>
                  </Col>
                ) : (
                  authorizedPhotos.map(photo => {
                    const isChecked = selectedPhotos.some(p => p.id === photo.id);
                    const photoUrl = getImageUrl(photo.imageUrl);
                    return (
                      <Col xs={6} sm={4} md={3} key={photo.id}>
                        <Card 
                          className={`h-100 border rounded-xl overflow-hidden shadow-sm transition-all cursor-pointer ${isChecked ? 'border-purple-600 bg-purple-50 bg-opacity-30' : ''}`}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedPhotos(prev => prev.filter(p => p.id !== photo.id));
                            } else {
                              if (imageLayoutMode === "single") {
                                setSelectedPhotos([photo]);
                              } else if (imageLayoutMode === "before_after" && selectedPhotos.length >= 2) {
                                setSelectedPhotos([selectedPhotos[1], photo]);
                              } else {
                                setSelectedPhotos(prev => [...prev, photo]);
                              }
                            }
                          }}
                        >
                          <div className="position-relative" style={{ paddingTop: "75%" }}>
                            <img 
                              src={photoUrl} 
                              alt="cliente"
                              className="w-100 h-100 position-absolute start-0 top-0 object-fit-cover"
                            />
                            {isChecked && (
                              <div className="position-absolute top-2.5 end-2.5 bg-purple-600 text-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 22, height: 22 }}>
                                <Check size={14} />
                              </div>
                            )}
                          </div>
                          <Card.Body className="p-2.5 small">
                            <strong className="text-gray-900 block truncate">{photo.client?.firstName} {photo.client?.lastName}</strong>
                            <span className="smaller text-muted block">{photo.service?.name || "Servicio"}</span>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })
                )}
              </Row>

              <div className="d-flex justify-content-between">
                <div className="text-muted small align-self-center">
                  <span dangerouslySetInnerHTML={{ __html: t("marketing.step1.selectedCount", { count: selectedPhotos.length }) }} />
                </div>
                <Button 
                  variant="dark" 
                  disabled={selectedPhotos.length === 0}
                  className="rounded-xl px-4 py-2 fw-bold"
                  onClick={() => setWizardStep(2)}
                >
                  {t("marketing.nextStep")}
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: ELEGIR FORMATO */}
          {wizardStep === 2 && (
            <div className="animate-fade-in">
              <h3 className="h6 fw-bold text-secondary mb-4">
                {t("marketing.formats.header")}
              </h3>
              
              <Row className="g-3 mb-4">
                {[
                  { id: "POST_1X1", label: t("marketing.formats.post1x1"), desc: t("marketing.formats.post1x1Desc") },
                  { id: "STORY_9X16", label: t("marketing.formats.story9x16"), desc: t("marketing.formats.story9x16Desc") },
                  { id: "REEL_COVER", label: t("marketing.formats.reelCover"), desc: t("marketing.formats.reelCoverDesc") },
                  { id: "CAROUSEL_BEFORE_AFTER", label: t("marketing.formats.carouselBeforeAfter"), desc: t("marketing.formats.carouselBeforeAfterDesc") },
                  { id: "CAROUSEL_MULTI", label: t("marketing.formats.carouselMulti"), desc: t("marketing.formats.carouselMultiDesc") },
                  { id: "SERVICE_PROMO", label: t("marketing.formats.servicePromo"), desc: t("marketing.formats.servicePromoDesc") },
                  { id: "TESTIMONIAL", label: t("marketing.formats.testimonial"), desc: t("marketing.formats.testimonialDesc") },
                ].map(format => {
                  const isActive = selectedFormat === format.id;
                  return (
                    <Col md={6} key={format.id}>
                      <Card 
                        className={`p-3 border rounded-2xl cursor-pointer transition-all ${isActive ? 'border-purple-600 bg-purple-50 bg-opacity-20' : 'bg-light bg-opacity-30'}`}
                        onClick={() => setSelectedFormat(format.id)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${isActive ? 'bg-purple-600 text-white' : 'bg-white text-muted border'}`}>
                            <Layout size={20} />
                          </div>
                          <div>
                            <strong className="text-gray-900 d-block small">{format.label}</strong>
                            <span className="smaller text-muted d-block">{format.desc}</span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" className="rounded-xl px-4 py-2" onClick={() => setWizardStep(1)}>
                  {t("marketing.back")}
                </Button>
                <Button variant="dark" className="rounded-xl px-4 py-2 fw-bold" onClick={() => setWizardStep(3)}>
                  {t("marketing.nextStep")}
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3: PERSONALIZACIÓN & EDITOR VISUAL */}
          {wizardStep === 3 && (
            <div className="animate-fade-in">
              <Row className="g-4">
                {/* Panel lateral de controles del editor */}
                <Col lg={4}>
                  <Card className="border p-3 rounded-2xl bg-light bg-opacity-40">
                    <h3 className="h6 fw-bold mb-3 border-bottom pb-2 text-dark">{t("marketing.step3.designLayers")}</h3>
                    
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="switch"
                        id="add-logo-switch"
                        label={t("marketing.step3.showLogo")}
                        checked={addLogo}
                        onChange={(e) => setAddLogo(e.target.checked)}
                        className="small fw-semibold"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="switch"
                        id="add-name-switch"
                        label={t("marketing.step3.showBusinessName")}
                        checked={addBusinessName}
                        onChange={(e) => setAddBusinessName(e.target.checked)}
                        className="small fw-semibold"
                      />
                      {addBusinessName && (
                        <Form.Control
                          type="text"
                          value={businessNameStr}
                          onChange={(e) => { setBusinessNameStr(e.target.value); setWatermarkText(e.target.value); }}
                          placeholder={t("marketing.step3.businessNamePlaceholder")}
                          className="mt-1.5 rounded-xl size-sm text-xs"
                        />
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="switch"
                        id="add-watermark-switch"
                        label={t("marketing.step3.addWatermark")}
                        checked={addWatermark}
                        onChange={(e) => setAddWatermark(e.target.checked)}
                        className="small fw-semibold"
                      />
                      {addWatermark && (
                        <Form.Control
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder={t("marketing.step3.watermarkPlaceholder")}
                          className="mt-1.5 rounded-xl size-sm text-xs"
                        />
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="smaller text-muted fw-bold">{t("marketing.step3.overlayText")}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={overlayText}
                        onChange={(e) => setOverlayText(e.target.value)}
                        placeholder={t("marketing.step3.overlayTextPlaceholder")}
                        className="rounded-xl text-xs"
                      />
                    </Form.Group>

                    {overlayText && (
                      <Row className="g-2 mb-3">
                        <Col xs={6}>
                          <Form.Label className="smaller text-muted fw-bold">{t("marketing.step3.textPosition")}</Form.Label>
                          <Form.Select 
                            value={textPosition} 
                            onChange={(e) => setTextPosition(e.target.value)}
                            className="rounded-xl text-xs"
                          >
                            <option value="top">{t("marketing.step3.positionTop")}</option>
                            <option value="middle">{t("marketing.step3.positionMiddle")}</option>
                            <option value="bottom">{t("marketing.step3.positionBottom")}</option>
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Label className="smaller text-muted fw-bold">{t("marketing.step3.textStyle")}</Form.Label>
                          <Form.Select 
                            value={textStyle} 
                            onChange={(e) => setTextStyle(e.target.value)}
                            className="rounded-xl text-xs"
                          >
                            <option value="modern">{t("marketing.step3.styleModern")}</option>
                            <option value="classic">{t("marketing.step3.styleClassic")}</option>
                            <option value="script">{t("marketing.step3.styleScript")}</option>
                          </Form.Select>
                        </Col>
                      </Row>
                    )}

                    {selectedPhotos.length > 1 && (
                      <div className="border-top pt-3">
                        <small className="text-muted fw-bold block mb-2 uppercase">{t("marketing.step3.sortPhotos")}</small>
                        <div className="d-flex flex-column gap-2">
                          {selectedPhotos.map((p, idx) => {
                            const pUrl = getImageUrl(p.imageUrl);
                            return (
                              <div key={p.id} className="d-flex align-items-center justify-content-between p-2 border rounded-xl bg-white">
                                <div className="d-flex align-items-center gap-2">
                                  <img src={pUrl} alt="miniatura" className="rounded object-fit-cover" style={{ width: 32, height: 32 }} />
                                  <span className="smaller text-dark fw-bold">#{idx + 1} {p.photoType === "before" ? "(Antes)" : p.photoType === "after" ? "(Después)" : ""}</span>
                                </div>
                                <div className="d-flex gap-1">
                                  <Button size="xs" variant="light" onClick={() => movePhoto(idx, idx - 1)} disabled={idx === 0}>▲</Button>
                                  <Button size="xs" variant="light" onClick={() => movePhoto(idx, idx + 1)} disabled={idx === selectedPhotos.length - 1}>▼</Button>
                                  <Button size="xs" variant="light" onClick={() => handleRotate(p.id)} className="text-purple-600"><RotateCw size={11} /></Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>

                {/* Panel de Vista Previa en Tiempo Real estilo Mock Instagram */}
                <Col lg={8}>
                  <div className="text-center bg-gray-900 bg-opacity-5 rounded-3xl p-4 border d-flex align-items-center justify-content-center" style={{ minHeight: "450px" }}>
                    <div 
                      className="instagram-mock-post bg-white shadow-lg border rounded-3 overflow-hidden text-start"
                      style={{ 
                        width: selectedFormat === "STORY_9X16" ? "260px" : "360px",
                        aspectRatio: selectedFormat === "STORY_9X16" ? "9/16" : "1/1",
                        fontSize: "13px"
                      }}
                    >
                      {/* Top Header Mock Post */}
                      {selectedFormat !== "STORY_9X16" && (
                        <div className="p-2.5 d-flex align-items-center justify-content-between border-bottom">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-purple-600 text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 28, height: 28, fontSize: "9px" }}>
                              {businessNameStr ? businessNameStr.substring(0, 2).toUpperCase() : "AD"}
                            </div>
                            <div>
                              <strong className="text-gray-900 d-block" style={{ fontSize: "11.5px" }}>{businessNameStr || "Aura Dash"}</strong>
                              <span className="smaller text-muted d-block" style={{ fontSize: "9.5px" }}>{t("marketing.step3.mockLocation")}</span>
                            </div>
                          </div>
                          <span className="text-muted fw-bold">•••</span>
                        </div>
                      )}

                      {/* Image Frame with Overlay elements */}
                      <div className="position-relative w-100 flex-grow-1 bg-light" style={{ height: selectedFormat === "STORY_9X16" ? "calc(100% - 50px)" : "360px" }}>
                        {selectedPhotos.length > 0 && (() => {
                          const activePhoto = selectedPhotos[0];
                          const activeUrl = getImageUrl(activePhoto.imageUrl);
                          const rotAngle = rotationAngles[activePhoto.id] || 0;
                          
                          return (
                            <img 
                              src={activeUrl} 
                              alt="preview"
                              className="w-100 h-100 object-fit-cover transition-all"
                              style={{ transform: `rotate(${rotAngle}deg)` }}
                            />
                          );
                        })()}

                        {/* Top overlays: Brand logo placeholder */}
                        {addLogo && (
                          <div className="position-absolute top-3 start-3 bg-white bg-opacity-75 rounded-pill px-2.5 py-1.5 border border-purple-opacity d-flex align-items-center gap-1.5 shadow-sm">
                            <div className="rounded-circle bg-purple-600 text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 18, height: 18, fontSize: "7px" }}>👑</div>
                            <span className="smaller text-purple-900 fw-bold" style={{ fontSize: "9px" }}>{businessNameStr || "Aura Studio"}</span>
                          </div>
                        )}

                        {/* Text Overlay position */}
                        {overlayText && (
                          <div 
                            className={`position-absolute w-100 px-3 text-center ${
                              textPosition === "top" ? "top-3" : textPosition === "middle" ? "top-50 translate-middle-y" : "bottom-3"
                            }`}
                          >
                            <div 
                              className="d-inline-block px-3 py-2 text-white shadow-md rounded-xl"
                              style={{ 
                                background: "rgba(17, 24, 39, 0.82)",
                                fontFamily: textStyle === "classic" ? "Georgia, serif" : textStyle === "script" ? "cursive" : "inherit",
                                fontWeight: textStyle === "modern" ? 900 : "normal",
                                fontSize: "14px"
                              }}
                            >
                              {overlayText}
                            </div>
                          </div>
                        )}

                        {/* Watermark diagonal style */}
                        {addWatermark && (
                          <div 
                            className="position-absolute start-50 top-50 translate-middle text-uppercase fw-bold text-muted pointer-events-none select-none"
                            style={{ 
                              opacity: 0.22, 
                              transform: "translate(-50%, -50%) rotate(-30deg)", 
                              fontSize: "19px", 
                              letterSpacing: "3px",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {watermarkText || "AURA DASH"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" className="rounded-xl px-4 py-2" onClick={() => setWizardStep(2)}>
                  {t("marketing.back")}
                </Button>
                <Button variant="dark" className="rounded-xl px-4 py-2 fw-bold" onClick={() => { handleGenerateCaption(); setWizardStep(4); }}>
                  {t("marketing.nextStep")}
                </Button>
              </div>
            </div>
          )}

          {/* PASO 4: IA GENERACIÓN & PROGRAMACIÓN */}
          {wizardStep === 4 && (
            <div className="animate-fade-in">
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border p-4 rounded-2xl bg-light bg-opacity-25 text-start">
                    <h3 className="h6 fw-bold mb-3 text-purple-700 d-flex align-items-center gap-1.5">
                      <Sparkles size={16} />
                      <span>{t("marketing.step4.captionTitle")}</span>
                    </h3>

                    <Form.Group className="mb-3">
                      <Form.Label className="smaller text-muted fw-bold">{t("marketing.step4.serviceName")}</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedServiceName}
                        onChange={(e) => setSelectedServiceName(e.target.value)}
                        placeholder={t("marketing.step4.serviceNamePlaceholder")}
                        className="rounded-xl size-sm"
                      />
                    </Form.Group>

                    <Row className="g-2 mb-3">
                      <Col xs={6}>
                        <Form.Label className="smaller text-muted fw-bold">{t("marketing.step4.messageTone")}</Form.Label>
                        <Form.Select 
                          value={selectedTone} 
                          onChange={(e) => setSelectedTone(e.target.value)}
                          className="rounded-xl text-xs"
                        >
                          <option value="professional">{t("marketing.step4.toneProfessional")}</option>
                          <option value="casual">{t("marketing.step4.toneCasual")}</option>
                          <option value="enthusiastic">{t("marketing.step4.toneEnthusiastic")}</option>
                          <option value="minimal">{t("marketing.step4.toneMinimal")}</option>
                        </Form.Select>
                      </Col>
                      <Col xs={6}>
                        <Form.Label className="smaller text-muted fw-bold">{t("marketing.step4.ctaLabel")}</Form.Label>
                        <Form.Select 
                          value={selectedCta} 
                          onChange={(e) => setSelectedCta(e.target.value)}
                          className="rounded-xl text-xs"
                        >
                          <option value="Agenda tu turno">{t("marketing.step4.ctaBook")}</option>
                          <option value="WhatsApp">{t("marketing.step4.ctaWhatsapp")}</option>
                          <option value="Comenta abajo">{t("marketing.step4.ctaComment")}</option>
                          <option value="Solicita información">{t("marketing.step4.ctaInfo")}</option>
                        </Form.Select>
                      </Col>
                    </Row>

                    <div className="d-grid mb-4">
                      <Button 
                        variant="purple" 
                        disabled={isGeneratingCaption}
                        onClick={handleGenerateCaption}
                        className="rounded-xl fw-bold text-white bg-purple-600 border-0"
                      >
                        {isGeneratingCaption ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            {t("marketing.step4.generateBtn")}
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} className="me-1.5" />
                            {t("marketing.step4.regenerateBtn")}
                          </>
                        )}
                      </Button>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label className="smaller text-muted fw-bold">{t("marketing.step4.captionLabel")}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={7}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="rounded-2xl text-xs"
                        style={{ fontSize: "12px", lineHeight: "1.6" }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="smaller text-muted fw-bold">{t("marketing.step4.suggestedHashtags")}</Form.Label>
                      <Form.Control
                        type="text"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        className="rounded-xl text-xs"
                      />
                    </Form.Group>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="border p-4 rounded-2xl bg-light bg-opacity-25 text-start h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h3 className="h6 fw-bold mb-4 text-dark uppercase tracking-wider">{t("marketing.step4.exportTitle")}</h3>
                      
                      <div className="d-flex flex-column gap-3 mb-4">
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => copyToClipboard(`${caption}\n\n${hashtags}`, "Caption completo")}
                          className="rounded-xl text-start px-3 py-2.5 d-flex align-items-center justify-content-between"
                        >
                          <span className="small font-medium text-dark">{t("marketing.step4.copyCaptionBtn")}</span>
                          <span className="smaller text-muted">{t("marketing.step4.copyReady")}</span>
                        </Button>

                        {selectedPhotos.length > 1 ? (
                          <Button 
                            variant="outline-secondary" 
                            onClick={handleDownloadZip}
                            disabled={loading}
                            className="rounded-xl text-start px-3 py-2.5 d-flex align-items-center justify-content-between"
                          >
                            <span className="small font-medium text-dark">{t("marketing.step4.downloadZipBtn")}</span>
                            <span className="smaller text-muted">{t("marketing.step4.downloadZipLabel")}</span>
                          </Button>
                        ) : (
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => {
                              if (selectedPhotos[0]) {
                                window.open(getImageUrl(selectedPhotos[0].imageUrl), "_blank");
                              }
                            }}
                            className="rounded-xl text-start px-3 py-2.5 d-flex align-items-center justify-content-between"
                          >
                            <span className="small font-medium text-dark">{t("marketing.step4.downloadSingleBtn")}</span>
                            <span className="smaller text-muted">{t("marketing.step4.downloadSingleLabel")}</span>
                          </Button>
                        )}
                      </div>

                      <div className="border-top pt-4">
                        <Form.Group className="mb-3">
                          <Form.Label className="smaller text-muted fw-bold">{t("marketing.step4.postStatusLabel")}</Form.Label>
                          <Form.Select 
                            value={postStatus} 
                            onChange={(e) => setPostStatus(e.target.value)}
                            className="rounded-xl"
                          >
                            <option value="DRAFT">{t("marketing.step4.statusDraft")}</option>
                            <option value="READY">{t("marketing.step4.statusReady")}</option>
                            <option value="SCHEDULED">{t("marketing.step4.statusScheduled")}</option>
                            <option value="PUBLISHED">{t("marketing.step4.statusPublished")}</option>
                          </Form.Select>
                        </Form.Group>

                        {postStatus === "SCHEDULED" && (
                          <Form.Group className="mb-3">
                            <Form.Label className="smaller text-muted fw-bold">{t("marketing.step4.scheduleDateTimeLabel")}</Form.Label>
                            <Form.Control
                              type="datetime-local"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="rounded-xl"
                            />
                          </Form.Group>
                        )}
                      </div>
                    </div>

                    <div className="d-grid gap-2 mt-4">
                      <Button 
                        variant="dark" 
                        disabled={isSavingPost}
                        onClick={handleSavePost}
                        className="rounded-xl py-3 fw-bold"
                      >
                        {isSavingPost ? <Spinner size="sm" /> : t("marketing.step4.savePostBtn")}
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>

              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" className="rounded-xl px-4 py-2" onClick={() => setWizardStep(3)}>
                  {t("marketing.back")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        // --- BIBLIOTECA DE CONTENIDOS Y DASHBOARD DE MARKETING ---
        <>
          <Nav variant="tabs" activeKey={activeTab} className="mb-4 gap-1 border-bottom border-light">
            <Nav.Item>
              <Nav.Link 
                onClick={() => setActiveTab("resumen")}
                eventKey="resumen"
                className={`px-4 py-2.5 fw-bold border-0 text-muted ${activeTab === "resumen" ? "border-bottom border-purple-600 text-purple-600 bg-white" : ""}`}
              >
                {t("marketing.tabs.generated")}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={() => setActiveTab("programados")}
                eventKey="programados"
                className={`px-4 py-2.5 fw-bold border-0 text-muted ${activeTab === "programados" ? "border-bottom border-purple-600 text-purple-600 bg-white" : ""}`}
              >
                {t("marketing.tabs.scheduled")}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={() => setActiveTab("borradores")}
                eventKey="borradores"
                className={`px-4 py-2.5 fw-bold border-0 text-muted ${activeTab === "borradores" ? "border-bottom border-purple-600 text-purple-600 bg-white" : ""}`}
              >
                {t("marketing.tabs.drafts")}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={() => setActiveTab("publicados")}
                eventKey="publicados"
                className={`px-4 py-2.5 fw-bold border-0 text-muted ${activeTab === "publicados" ? "border-bottom border-purple-600 text-purple-600 bg-white" : ""}`}
              >
                {t("marketing.tabs.published")}
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {loading && posts.length === 0 ? (
            <div className="text-center py-5 text-muted" style={{ minHeight: "30vh" }}>
              <Spinner animation="border" variant="purple" className="mb-2" />
              <p className="fw-semibold">{t("marketing.tabs.loading")}</p>
            </div>
          ) : getFilteredLibrary().length === 0 ? (
            <div className="text-center py-5 text-muted bg-white rounded-3xl border border-light shadow-sm" style={{ minHeight: "35vh" }}>
              <Layout size={40} className="text-purple-600 mb-3 opacity-75" />
              <h3 className="h6 fw-bold text-gray-900">{t("marketing.emptyLibrary")}</h3>
              <p className="small text-secondary max-w-400 mx-auto mb-4">
                {t("marketing.emptyLibraryDesc")}
              </p>
              <Button 
                variant="purple" 
                onClick={() => setIsCreating(true)}
                className="rounded-xl px-4 text-white bg-purple-600 border-0 hover-bg-purple-700 fw-bold"
              >
                {t("marketing.designBtn")}
              </Button>
            </div>
          ) : (
            <Row className="g-4">
              {getFilteredLibrary().map(post => {
                const isCarousel = post.imageUrls?.length > 1;
                const coverUrl = post.imageUrls?.[0] ? getImageUrl(post.imageUrls[0]) : "";
                
                return (
                  <Col md={6} lg={4} key={post.id}>
                    <Card className="h-100 border rounded-3xl overflow-hidden shadow-sm bg-white text-start">
                      <div className="position-relative" style={{ paddingTop: "60%", backgroundColor: "#f3f4f6" }}>
                        {coverUrl && (
                          <img 
                            src={coverUrl} 
                            alt="portada post"
                            className="w-100 h-100 position-absolute start-0 top-0 object-fit-cover"
                          />
                        )}
                        <Badge 
                          bg="dark"
                          className="position-absolute top-3 start-3 px-2 py-1 text-xs"
                          style={{ background: "rgba(17, 24, 39, 0.75)", fontWeight: 700 }}
                        >
                          {post.format}
                        </Badge>
                        {isCarousel && (
                          <Badge 
                            bg="purple"
                            className="position-absolute top-3 end-3 px-2.5 py-1 text-xs"
                            style={{ fontWeight: 700 }}
                          >
                            Carrusel ({post.imageUrls.length} fotos)
                          </Badge>
                        )}
                      </div>

                      <Card.Body className="p-3.5 d-flex flex-column justify-content-between gap-3">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="smaller text-muted fw-bold">{t("marketing.createdOn")} {new Date(post.createdAt).toLocaleDateString("es-AR")}</span>
                            <Badge 
                              bg={post.status === "SCHEDULED" ? "warning-soft" : post.status === "PUBLISHED" ? "success-soft" : "secondary-soft"}
                              className={post.status === "SCHEDULED" ? "text-warning px-2.5 py-1" : post.status === "PUBLISHED" ? "text-success px-2.5 py-1" : "text-muted px-2.5 py-1"}
                              style={{ borderRadius: "6px" }}
                            >
                              {post.status === "SCHEDULED" ? t("marketing.scheduledStatus") : post.status === "PUBLISHED" ? t("marketing.publishedStatus") : t("marketing.draftStatus")}
                            </Badge>
                          </div>
                          
                          <p className="text-secondary small mb-2 text-line-clamp-4" style={{ fontSize: "12.5px", lineHeight: "1.6" }}>
                            {post.caption}
                          </p>

                          {post.hashtags && (
                            <span className="text-primary smaller font-monospace d-block text-truncate">
                              {post.hashtags}
                            </span>
                          )}

                          {post.status === "SCHEDULED" && post.scheduledAt && (
                            <div className="mt-3 p-2 rounded-xl bg-amber-50 text-warning-800 smaller d-flex align-items-center gap-1.5 fw-semibold border border-warning border-opacity-10">
                              <Calendar size={13} />
                              <span>Publicará el: {new Date(post.scheduledAt).toLocaleString("es-AR")}</span>
                            </div>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-2 border-top pt-3">
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            className="rounded-pill px-3 flex-grow-1 font-bold text-xs"
                            onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags}`, "Post completo")}
                          >
                            {t("marketing.copyBtn")}
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="rounded-pill p-2 border-0"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}

      <style>{`
        .bg-purple-50 {
          background-color: rgba(124, 58, 237, 0.05) !important;
        }
        .text-emerald-600 {
          color: #059669 !important;
        }
        .text-indigo-600 {
          color: #4f46e5 !important;
        }
        .text-line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .instagram-mock-post {
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        }
      `}</style>
    </Container>
  );
}
