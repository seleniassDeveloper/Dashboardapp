import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Form, Button, Table, ProgressBar, Alert, Badge, Modal } from "react-bootstrap";
import {
  FileSpreadsheet, Link2, Settings, ArrowRight, RefreshCw,
  CheckCircle2, AlertTriangle, Sparkles, HelpCircle, Download,
  Database, Check, FileText, FileJson, History, AlertCircle
} from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import api from "../../lib/api.js";
import * as XLSX from "xlsx";

import { INITIAL_ENTITY_FIELDS, SAMPLE_SALON_DATA } from "../../hooks/useSheetsSync";

export default function SheetsSyncDesktop({ sync }) {
  const {
    t, i18n, currency,
    activeDirection, setActiveDirection,
    sheetUrl, setSheetUrl,
    step, setStep,
    loading, setLoading,
    progress, setProgress,
    statusText, setStatusText,
    error, setError,
    summary, setSummary,
    importMethod, setImportMethod,
    sheetsData, setSheetsData,
    activeSheetId, setActiveSheetId,
    newFieldName, setNewFieldName,
    importHistory, setImportHistory,
    selectedHistory, setSelectedHistory,
    importName, setImportName,
    showConfirmModal, setShowConfirmModal,
    showNewFieldForm, setShowNewFieldForm,
    deactivateModalData, setDeactivateModalData,
    isDeactivating, setIsDeactivating,
    exportType, setExportType,
    selectedColumns, setSelectedColumns,
    exportFormat, setExportFormat,
    livePreview, setLivePreview,
    fullData, setFullData,
    previewLoading, setPreviewLoading,
    isSyncingOut, setIsSyncingOut,
    syncProgressOut, setSyncProgressOut,
    syncSuccessOut, setSyncSuccessOut,
    syncOutUrl, setSyncOutUrl,
    fetchHistory,
    autoDetectMappingsLocal,
    updateSheetState,
    handleAssignSheetType,
    handleMapChange,
    handleToggleField,
    handleAddCustomField,
    fetchLivePreview,
    handleColumnToggle,
    triggerDownload,
    downloadTemplate,
    triggerGoogleSheetsPushSync,
    parseCSV,
    handleFileUpload,
    handleAnalyze,
    executeRealSync
  } = sync;
  return (
    <Container fluid className="py-4">
      <header className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 bg-success bg-opacity-10 text-success rounded-4">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h1 className="section-title">{t("sheetsSync.title")}</h1>
            <p className="section-subtitle mb-0">{t("sheetsSync.subtitle")}</p>
          </div>
        </div>
      </header>

      {error && <Alert variant="danger" className="rounded-4 shadow-sm">{error}</Alert>}

      {/* SYNC DIRECTION TAB SWITCH */}
      <div className="d-flex mb-4 gap-2 border-bottom pb-2">
        <button
          onClick={() => { setActiveDirection("import"); setError(""); }}
          className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
            activeDirection === "import" ? "bg-purple-600 text-white shadow-sm btn-purple" : "bg-light text-muted hover-bg-gray-100"
          }`}
          style={{ fontSize: "13px" }}
        >
          <Database size={15} />
          <span>{t("sheetsSync.importTab")}</span>
        </button>

        <button
          onClick={() => { setActiveDirection("export"); setError(""); }}
          className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
            activeDirection === "export" ? "bg-purple-600 text-white shadow-sm btn-purple" : "bg-light text-muted hover-bg-gray-100"
          }`}
          style={{ fontSize: "13px" }}
        >
          <Download size={15} />
          <span>{t("sheetsSync.exportTab")}</span>
        </button>
      </div>

      <Row className="g-4">
        {/* ==================== TAB 1: IMPORTAR DATOS (ENTRADA) ==================== */}
        {activeDirection === "import" && (
          <>
            {step === 1 && (
              <>
                <Col lg={7}>
                  <Card className="card-premium border-0 shadow-sm mb-4">
                     <Card.Body className="p-4">
                      {/* Selection of Import Method */}
                      <div className="d-flex mb-4 gap-2 border-bottom pb-2">
                        <button
                          type="button"
                          onClick={() => { setImportMethod("google"); setError(""); }}
                          className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
                            importMethod === "google" ? "bg-purple-600 text-white shadow btn-purple" : "bg-light text-muted hover-bg-gray-100"
                          }`}
                          style={{ fontSize: "12.5px" }}
                        >
                          <Link2 size={15} />
                          <span>{t("sheetsSync.googleTab", { defaultValue: "Google Sheets Link" })}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImportMethod("file"); setError(""); }}
                          className={`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all ${
                            importMethod === "file" ? "bg-purple-600 text-white shadow btn-purple" : "bg-light text-muted hover-bg-gray-100"
                          }`}
                          style={{ fontSize: "12.5px" }}
                        >
                          <FileSpreadsheet size={15} />
                          <span>{t("sheetsSync.fileTab", { defaultValue: "Subir Archivo Local" })}</span>
                        </button>
                      </div>

                      <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                        {importMethod === "google" ? (
                          <>
                            <Link2 size={18} className="text-primary" />
                            <span>{t("sheetsSync.connectDriveTitle")}</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet size={18} className="text-primary" />
                            <span>{t("sheetsSync.connectLocalTitle")}</span>
                          </>
                        )}
                      </h3>
                      
                      <div className="d-grid gap-3">
                        <div className="p-3 bg-light rounded-4 border mb-3">
                          <label className="fw-bold small text-gray-700 mb-1 d-block">
                            Descargar Plantillas Oficiales
                          </label>
                          <p className="text-muted smaller mb-3" style={{ lineHeight: "1.4" }}>
                            Puedes usar estas plantillas .xlsx para rellenar tus datos y luego subirlas al sistema. El sistema leerá todas las pestañas automáticamente.
                          </p>
                          <div className="d-flex flex-wrap gap-2">
                            <Button variant="outline-primary" size="sm" className="rounded-pill d-flex align-items-center gap-1" onClick={() => downloadTemplate("clients")}><Download size={12}/> Clientes</Button>
                            <Button variant="outline-primary" size="sm" className="rounded-pill d-flex align-items-center gap-1" onClick={() => downloadTemplate("services")}><Download size={12}/> Servicios</Button>
                            <Button variant="outline-primary" size="sm" className="rounded-pill d-flex align-items-center gap-1" onClick={() => downloadTemplate("workers")}><Download size={12}/> Profesionales</Button>
                            <Button variant="outline-primary" size="sm" className="rounded-pill d-flex align-items-center gap-1" onClick={() => downloadTemplate("appointments")}><Download size={12}/> Citas</Button>
                          </div>
                        </div>

                        {importMethod === "google" ? (
                          <Form onSubmit={handleAnalyze} className="d-grid gap-3 p-0 m-0">
                            <Form.Group>
                              <Form.Label className="fw-semibold small">{t("sheetsSync.googleUrlLabel")}</Form.Label>
                              <Form.Control
                                type="url"
                                placeholder={t("sheetsSync.googleUrlPlaceholder")}
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                                className="modern-input"
                                required
                              />
                              <Form.Text className="text-muted smaller">
                                {t("sheetsSync.googleUrlHint")}
                              </Form.Text>
                            </Form.Group>

                            <Button type="submit" variant="dark" disabled={loading} className="btn-premium py-2.5 mt-4 justify-content-center">
                              {loading ? (
                                <>
                                  <RefreshCw size={16} className="spin me-2" />
                                  <span>{t("sheetsSync.analyzeLoading")}</span>
                                </>
                              ) : (
                                <>
                                  <span>{t("sheetsSync.analyzeBtn")}</span>
                                  <ArrowRight size={16} className="ms-2" />
                                </>
                              )}
                            </Button>
                          </Form>
                        ) : (
                          <div className="d-grid gap-3">
                            <Form.Group>
                              <Form.Label className="fw-semibold small">{t("sheetsSync.uploadFileLabel")}</Form.Label>
                              <div 
                                className="p-5 text-center border border-dashed border-2 rounded-4 hover-shadow transition-all bg-light bg-opacity-25"
                                style={{ 
                                  borderStyle: "dashed", 
                                  borderWidth: "2px", 
                                  borderColor: "rgba(139, 92, 246, 0.3)", 
                                  cursor: "pointer" 
                                }}
                              >
                                <input
                                  type="file"
                                  accept=".csv, .xlsx, .xls, .json"
                                  onChange={(e) => handleFileUpload(e.target.files[0])}
                                  className="d-none"
                                  id="local-file-upload"
                                  disabled={loading}
                                />
                                <label htmlFor="local-file-upload" className="w-100 h-100 cursor-pointer d-grid gap-2 mb-0">
                                  <div className="p-3 bg-purple-500 bg-opacity-10 text-purple-600 rounded-circle justify-self-center">
                                    <FileSpreadsheet size={28} />
                                  </div>
                                  <div>
                                    <span className="fw-bold text-dark d-block">{t("sheetsSync.uploadFileDrag")}</span>
                                    <span className="text-muted small">{t("sheetsSync.uploadFileFormats")}</span>
                                  </div>
                                  {loading ? (
                                    <Button as="span" variant="outline-primary" disabled className="rounded-pill px-4 btn-sm justify-self-center mt-2">
                                      <RefreshCw size={12} className="spin me-1" /> {t("sheetsSync.uploadFileLoading")}
                                    </Button>
                                  ) : (
                                    <Button as="span" variant="outline-primary" className="rounded-pill px-4 btn-sm justify-self-center mt-2">
                                      {t("sheetsSync.uploadFileBtn")}
                                    </Button>
                                  )}
                                </label>
                              </div>
                            </Form.Group>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={5}>
                  <Card className="card-premium border-0 bg-light-soft h-100 p-3">
                    <Card.Body className="d-grid gap-4">
                      <div>
                        <h4 className="fw-black h6 mb-2 text-dark">{t("sheetsSync.howItWorksTitle")}</h4>
                        <p className="text-muted small">
                          {t("sheetsSync.howItWorksDesc")}
                        </p>
                      </div>

                      <div className="d-flex gap-3">
                        <div className="p-2 rounded-circle bg-white shadow-sm align-self-start text-success">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <h5 className="fw-semibold small text-dark mb-1">{t("sheetsSync.noHistoryLossTitle")}</h5>
                          <p className="text-muted smaller mb-0">{t("sheetsSync.noHistoryLossDesc")}</p>
                        </div>
                      </div>

                      <div className="d-flex gap-3">
                        <div className="p-2 rounded-circle bg-white shadow-sm align-self-start text-primary">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h5 className="fw-semibold small text-dark mb-1">{t("sheetsSync.instantMetricsTitle")}</h5>
                          <p className="text-muted smaller mb-0">{t("sheetsSync.instantMetricsDesc")}</p>
                        </div>
                      </div>

                      <div className="d-flex gap-3">
                        <div className="p-2 rounded-circle bg-white shadow-sm align-self-start text-amber">
                          <HelpCircle size={20} />
                        </div>
                        <div>
                          <h5 className="fw-semibold small text-dark mb-1">Mapeo Multi-Hoja Automático</h5>
                          <p className="text-muted smaller mb-0">Podés subir un Excel con múltiples pestañas y asignar cada pestaña a una sección distinta de la base de datos.</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={12} className="mt-4">
                  <Card className="card-premium border-0 shadow-sm">
                    <Card.Body className="p-4">
                      <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                        <History size={18} className="text-primary" />
                        <span>Historial de Importaciones</span>
                      </h3>
                      {importHistory.length === 0 ? (
                        <div className="text-center py-4 text-muted small bg-light rounded-3 border">
                          No hay importaciones registradas todavía.
                        </div>
                      ) : (
                        <div className="table-responsive rounded-3 border">
                          <Table hover striped size="sm" className="mb-0 align-middle bg-white">
                            <thead className="bg-light table-header-small">
                              <tr>
                                <th className="ps-3">Nombre del Registro</th>
                                <th>Fecha y Hora</th>
                                <th>Resultados</th>
                                <th className="text-end pe-3">Acciones</th>
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: "13px" }}>
                              {(importHistory || []).map(hist => (
                                <tr key={hist.id} className="hover-bg-gray-50 transition-all">
                                  <td className="ps-3 fw-bold text-dark cursor-pointer" onClick={() => setSelectedHistory(hist)} title="Ver detalles de la importación">{hist.name}</td>
                                  <td className="text-muted cursor-pointer" onClick={() => setSelectedHistory(hist)}>{new Date(hist.createdAt).toLocaleString()}</td>
                                  <td className="cursor-pointer" onClick={() => setSelectedHistory(hist)}>
                                    {hist.status === "REVERTED" ? (
                                      <Badge bg="secondary">Desactivado</Badge>
                                    ) : (
                                      <>
                                        <Badge bg="success" className="me-1">{(hist.details?.summary?.created || hist.details?.created) || 0} Creados</Badge>
                                        <Badge bg="primary" className="me-1">{(hist.details?.summary?.reused || hist.details?.reused) || 0} Actualizados</Badge>
                                        <Badge bg="danger">{(hist.details?.summary?.failed || hist.details?.failed) || 0} Fallidos</Badge>
                                      </>
                                    )}
                                  </td>
                                  <td className="text-end pe-3">
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm" 
                                      className="rounded-pill px-3 py-1"
                                      disabled={hist.status === "REVERTED"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeactivateModalData(hist);
                                      }}
                                    >
                                      Desactivar
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}

            {step === 2 && (
              <Col xs={12}>
                <Card className="card-premium border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="h5 fw-black text-dark mb-1 d-flex align-items-center gap-2">
                          <CheckCircle2 className="text-success" size={22} />
                          <span>Configurar Importación Multi-Hoja</span>
                        </h3>
                        <p className="text-muted small mb-0">Asigna las hojas de tu archivo a las tablas del sistema.</p>
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="outline-dark" onClick={() => setStep(1)} className="rounded-pill px-4 btn-sm">
                          {t("sheetsSync.backBtn")}
                        </Button>
                        <Button variant="success" onClick={() => setShowConfirmModal(true)} disabled={sheetsData.filter(s => s.entityType && s.entityType !== "ignore").length === 0} className="rounded-pill px-4 btn-sm btn-premium bg-success border-success text-white fw-bold shadow">
                          {t("sheetsSync.syncImportBtn")}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-light p-3 rounded-3 mb-4 border">
                      <h4 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-purple-700">
                        <FileText size={18} />
                        <span>Hojas Detectadas ({sheetsData.length})</span>
                      </h4>
                      <Table size="sm" className="mb-0 align-middle">
                        <thead>
                          <tr>
                            <th className="text-muted smaller">Nombre de la Hoja</th>
                            <th className="text-muted smaller">Filas detectadas</th>
                            <th className="text-muted smaller">Importar como...</th>
                            <th className="text-muted smaller text-end">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sheetsData.map(sheet => (
                            <tr key={sheet.id}>
                              <td className="fw-bold">{sheet.name}</td>
                              <td className="text-muted">{sheet.totalRows} filas</td>
                              <td>
                                <Form.Select
                                  size="sm"
                                  value={sheet.entityType}
                                  onChange={(e) => handleAssignSheetType(sheet.id, e.target.value)}
                                  style={{ maxWidth: "200px" }}
                                >
                                  <option value="">-- Seleccionar --</option>
                                  <option value="ignore">Ignorar hoja</option>
                                  <option value="appointments">{t("sheetsSync.dataTypeAppointments")}</option>
                                  <option value="clients">{t("sheetsSync.dataTypeClients")}</option>
                                  <option value="services">{t("sheetsSync.dataTypeServices")}</option>
                                  <option value="workers">{t("sheetsSync.dataTypeWorkers")}</option>
                                  <option value="expenses">💸 Pagos y Egresos (Finanzas)</option>
                                </Form.Select>
                              </td>
                              <td className="text-end">
                                {sheet.entityType && sheet.entityType !== "ignore" && (
                                  <Button 
                                    variant={activeSheetId === sheet.id ? "purple" : "outline-purple"} 
                                    size="sm" 
                                    className="rounded-pill"
                                    onClick={() => setActiveSheetId(sheet.id)}
                                  >
                                    Mapear Columnas
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {activeSheetId && (
                      <div className="mt-4 border-top pt-4">
                        {(() => {
                          const sheet = sheetsData.find(s => s.id === activeSheetId);
                          if (!sheet || sheet.entityType === "ignore") return null;
                          return (
                            <>
                              <h4 className="h6 fw-bold mb-3 d-flex align-items-center gap-2 text-purple-700">
                                <Settings size={18} />
                                <span>Configuración para: {sheet.name}</span>
                              </h4>
                              
                              <div className="mb-4">
                                <label className="fw-bold small text-gray-700 mb-1 d-block">
                                  {t("sheetsSync.fieldsToImportLabel", { defaultValue: "Campos a Importar (Configurables)" })}
                                </label>
                                <div className="d-flex flex-wrap gap-2">
                                  {sheet.entityFields.map(f => {
                                    const isRequired = f.required;
                                    const isChecked = sheet.enabledFields[f.key];
                                    return (
                                      <div 
                                        key={f.key} 
                                        className={`d-flex align-items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                                          isChecked 
                                            ? "bg-purple-500 bg-opacity-10 border-purple-300 text-purple-900" 
                                            : "bg-white border-gray-200 text-muted"
                                        }`}
                                        style={{ cursor: isRequired ? "not-allowed" : "pointer" }}
                                        onClick={() => !isRequired && handleToggleField(sheet.id, f.key)}
                                      >
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          disabled={isRequired}
                                          readOnly
                                          className="cursor-pointer form-check-input m-0"
                                        />
                                        <span className="small fw-semibold">
                                          {t("sheetsSync.columns." + f.key, { defaultValue: f.label })}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-2">
                                  {!showNewFieldForm ? (
                                    <Button variant="link" size="sm" className="p-0 text-decoration-none small" onClick={() => setShowNewFieldForm(true)}>+ Agregar campo personalizado</Button>
                                  ) : (
                                    <div className="d-flex gap-2 align-items-center mt-2" style={{ maxWidth: "300px" }}>
                                      <Form.Control type="text" size="sm" placeholder="Nombre del campo" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} />
                                      <Button variant="primary" size="sm" onClick={() => handleAddCustomField(sheet.id)}>Agregar</Button>
                                      <Button variant="light" size="sm" onClick={() => setShowNewFieldForm(false)}>✖</Button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Row className="g-3 mb-4">
                                {sheet.entityFields.filter(f => sheet.enabledFields[f.key]).map(f => (
                                  <Col md={4} key={f.key}>
                                    <Form.Group>
                                      <Form.Label className="smaller text-gray-700 fw-bold">
                                        {t("sheetsSync.columns." + f.key, { defaultValue: f.label })} {f.required && <span className="text-danger">*</span>}
                                      </Form.Label>
                                      <Form.Select
                                        value={sheet.mapping[f.key] || ""}
                                        onChange={(e) => handleMapChange(sheet.id, f.key, e.target.value)}
                                        className="modern-input"
                                      >
                                        <option value="">{t("sheetsSync.unassignedOption")}</option>
                                        {sheet.headers.map(h => (
                                          <option key={h} value={h}>{h}</option>
                                        ))}
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                ))}
                              </Row>
          
                              <h4 className="h6 fw-bold mb-3 text-secondary">{t("sheetsSync.mappedPreviewTitle")}</h4>
                              <div className="table-responsive rounded-3 border">
                                <Table hover striped className="mb-0 align-middle">
                                  <thead>
                                    <tr className="bg-light table-header-small" style={{ fontSize: "11px" }}>
                                      <th className="ps-3">{t("sheetsSync.excelRowHeader")}</th>
                                      {sheet.entityFields.filter(f => sheet.enabledFields[f.key]).map(f => (
                                        <th key={f.key}>
                                          {t("sheetsSync.columns." + f.key, { defaultValue: f.label })}
                                          <div className="text-muted smaller fw-normal">
                                            {sheet.mapping[f.key] ? `Col: ${sheet.mapping[f.key]}` : "(Sin mapear)"}
                                          </div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody style={{ fontSize: "13px" }}>
                                    {sheet.previewRows.map((r, idx) => (
                                      <tr key={idx}>
                                        <td className="ps-3 text-muted fw-bold">#{idx + 2}</td>
                                        {sheet.entityFields.filter(f => sheet.enabledFields[f.key]).map(f => {
                                          const colName = sheet.mapping[f.key];
                                          const cellVal = colName ? r[colName] : "";
                                          return (
                                            <td key={f.key} className={f.key === "price" ? "text-success fw-bold" : ""}>
                                              {f.key === "price" && cellVal ? `$${Number(cellVal).toLocaleString()}` : cellVal || "-"}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                    {sheet.totalRows > 10 && (
                                      <tr style={{ background: "#fafafa" }}>
                                        <td className="ps-3 text-muted fw-bold">...</td>
                                        <td colSpan={sheet.entityFields.filter(f => sheet.enabledFields[f.key]).length} className="text-muted smaller italic">
                                          {t("sheetsSync.otherRecordsProcessed", { count: sheet.totalRows - 10 })}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </Table>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )}

            {step === 3 && (
              <Col xs={12} className="py-5">
                <Card className="card-premium border-0 shadow-sm mx-auto text-center" style={{ maxWidth: "560px" }}>
                  <Card.Body className="p-5 d-grid gap-4">
                    <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle justify-self-center spin" style={{ width: "64px", height: "64px" }}>
                      <RefreshCw size={32} />
                    </div>
                    <div>
                      <h3 className="fw-black text-dark h5 mb-1">{t("sheetsSync.importingDataTitle")}</h3>
                      <p className="text-muted small mb-0">{statusText}</p>
                    </div>

                    <div className="px-3">
                      <ProgressBar now={progress} animated variant="success" style={{ height: "10px", borderRadius: "10px" }} />
                      <div className="text-end text-success fw-bold smaller mt-1.5">{Math.round(progress)}% {t("sheetsSync.progressCompleted")}</div>
                    </div>

                    <div className="p-3 bg-light rounded-3 text-muted small text-start border-start border-primary border-4">
                      {t("sheetsSync.neonProcessingNotice") && (
                        <>
                          <strong>{t("sheetsSync.neonProcessingNotice").split(":")[0]}:</strong>
                          {t("sheetsSync.neonProcessingNotice").split(":")[1]}
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {step === 4 && (
              <Col xs={12}>
                <Card className="card-premium border-0 shadow-sm mx-auto text-center py-4" style={{ maxWidth: "600px" }}>
                  <Card.Body className="p-5 d-grid gap-4">
                    <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle justify-self-center" style={{ width: "68px", height: "68px" }}>
                      <CheckCircle2 size={36} />
                    </div>
                    
                    <div>
                      <h3 className="fw-black text-dark h4 mb-1">{t("sheetsSync.importSuccessTitle")}</h3>
                      <p className="text-muted small mb-0">{t("sheetsSync.importSuccessDesc")}</p>
                    </div>

                    <Row className="g-3 my-2">
                      <Col xs={4}>
                        <div className="p-3 bg-light rounded-3 border">
                          <div className="h3 fw-black text-success m-0">{summary.created || 0}</div>
                          <div className="text-muted smaller">{t("sheetsSync.summaryCreated")}</div>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-3 bg-light rounded-3 border">
                          <div className="h3 fw-black text-primary m-0">{summary.reused || 0}</div>
                          <div className="text-muted smaller">{t("sheetsSync.summaryReused")}</div>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-3 bg-light rounded-3 border">
                          <div className="h3 fw-black text-danger m-0">{summary.failed || 0}</div>
                          <div className="text-muted smaller">{t("sheetsSync.summaryFailed")}</div>
                        </div>
                      </Col>
                    </Row>

                    {summary.skippedDetails && summary.skippedDetails.length > 0 && (
                      <div className="text-start mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="fw-bold text-danger h6 mb-0">Detalle de filas omitidas</h5>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="rounded-pill px-3 py-1 text-decoration-none d-flex align-items-center gap-1"
                            onClick={() => {
                              const data = [["Fila Original", "Motivo del Error"], ...summary.skippedDetails.map(d => [d.row, d.motive])];
                              const ws = XLSX.utils.aoa_to_sheet(data);
                              const wb = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(wb, ws, "Errores");
                              XLSX.writeFile(wb, `errores_importacion.xlsx`);
                            }}
                          >
                            <Download size={12} /> Descargar Errores
                          </Button>
                        </div>
                        <div className="table-responsive border rounded-3" style={{ maxHeight: "200px" }}>
                          <Table hover size="sm" className="mb-0">
                            <thead className="bg-light sticky-top">
                              <tr>
                                <th>Fila</th>
                                <th>Motivo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {summary.skippedDetails.map((skipped, idx) => (
                                <tr key={idx}>
                                  <td className="text-muted">#{skipped.row}</td>
                                  <td className="text-danger small">{skipped.motive}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2.5 justify-content-center mt-3">
                      <Button variant="outline-dark" onClick={() => { setStep(1); setSheetsData([]); }} className="rounded-pill px-4">
                        {t("sheetsSync.syncAnotherBtn")}
                      </Button>
                      <Button variant="dark" href="/app" className="rounded-pill px-4 btn-premium">
                        {t("sheetsSync.goDashboardBtn")}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </>
        )}

        {/* ==================== TAB 2: EXPORTAR Y DESCARGAR (SALIDA) ==================== */}
        {activeDirection === "export" && (
          <>
            {/* CONFIGURATION COLUMN */}
            <Col lg={5}>
              <Card className="card-premium border-0 shadow-sm p-4 rounded-2xl mb-4">
                <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
                  <Settings size={18} className="text-purple-600 animate-pulse" />
                  <span>{t("sheetsSync.outputConfigTitle")}</span>
                </h3>
                <p className="text-muted smaller mb-4">
                  {t("sheetsSync.outputConfigDesc")}
                </p>

                <Form className="d-grid gap-3.5">
                  {/* Select Table to Export */}
                  <Form.Group>
                    <Form.Label className="small fw-bold text-gray-700">{t("sheetsSync.selectDataModule")}</Form.Label>
                    <Form.Select 
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value)}
                      className="modern-input"
                    >
                      <option value="clients">{t("sheetsSync.moduleClients")}</option>
                      <option value="inventory">{t("sheetsSync.moduleInventory")}</option>
                      <option value="appointments">{t("sheetsSync.moduleAppointments")}</option>
                      <option value="expenses">{t("sheetsSync.moduleExpenses")}</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Select Columns */}
                  <Form.Group>
                    <Form.Label className="small fw-bold text-gray-700 mb-2">{t("sheetsSync.selectColumnsToInclude")}</Form.Label>
                    <Card className="p-3 bg-light border-0 rounded-xl">
                      <div className="d-flex flex-column gap-2">
                        {Object.keys(selectedColumns[exportType]).map((colKey) => (
                          <Form.Check 
                            key={colKey}
                            type="checkbox"
                            id={`col-${colKey}`}
                            label={t("sheetsSync.columns." + colKey, { defaultValue: colKey })}
                            checked={selectedColumns[exportType][colKey]}
                            onChange={() => handleColumnToggle(colKey)}
                            className="small text-gray-700 fw-medium"
                          />
                        ))}
                      </div>
                    </Card>
                  </Form.Group>

                  {/* Select Format */}
                  <Form.Group>
                    <Form.Label className="small fw-bold text-gray-700">{t("sheetsSync.outputFileFormat")}</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check 
                        type="radio"
                        id="format-xls"
                        name="format"
                        label={t("sheetsSync.formatExcel")}
                        checked={exportFormat === "xls"}
                        onChange={() => setExportFormat("xls")}
                        className="small text-gray-800 fw-bold"
                      />
                      <Form.Check 
                        type="radio"
                        id="format-csv"
                        name="format"
                        label={t("sheetsSync.formatCsv")}
                        checked={exportFormat === "csv"}
                        onChange={() => setExportFormat("csv")}
                        className="small text-gray-800 fw-bold"
                      />
                      <Form.Check 
                        type="radio"
                        id="format-json"
                        name="format"
                        label={t("sheetsSync.formatJson")}
                        checked={exportFormat === "json"}
                        onChange={() => setExportFormat("json")}
                        className="small text-gray-800 fw-bold"
                      />
                    </div>
                  </Form.Group>

                  {/* ACTIONS WRAPPER */}
                  <div className="mt-4 pt-3 border-top d-grid gap-2">
                    <Button 
                      variant="purple" 
                      onClick={triggerDownload}
                      className="rounded-xl py-2.5 fw-bold text-white bg-purple-600 hover-bg-purple-700 d-flex align-items-center justify-content-center gap-2 border-0 shadow-sm"
                    >
                      <Download size={16} />
                      <span>{t("sheetsSync.downloadDataBtn")}</span>
                    </Button>

                    <Button 
                      variant="outline-purple" 
                      onClick={triggerGoogleSheetsPushSync}
                      className="rounded-xl py-2.5 fw-bold text-purple-700 border-purple-300 hover-bg-purple-50 d-flex align-items-center justify-content-center gap-2"
                    >
                      <RefreshCw size={16} className={isSyncingOut ? "spin" : ""} />
                      <span>{t("sheetsSync.syncOutBtn")}</span>
                    </Button>
                  </div>
                </Form>
              </Card>
            </Col>

            {/* PREVIEW & CLOUD SYNC PREVIEW COLUMN */}
            <Col lg={7}>
              {/* Dynamic Loading or Done screen for Outward Sync */}
              {isSyncingOut && (
                <Card className="card-premium border-0 shadow-sm p-5 text-center mb-4 rounded-2xl bg-white h-100 d-flex flex-column justify-content-center">
                  <div className="p-3 bg-purple bg-opacity-10 text-purple-600 rounded-circle justify-self-center spin mb-4" style={{ width: "64px", height: "64px", margin: "0 auto" }}>
                    <RefreshCw size={32} />
                  </div>
                  <h4 className="fw-black text-gray-900 mb-2">{t("sheetsSync.syncingOutTitle")}</h4>
                  
                  <p className="text-muted small mb-4">{t("sheetsSync.syncingOutDesc")}</p>
                  <ProgressBar now={syncProgressOut} variant="purple" className="mb-2 rounded-pill mx-auto" style={{ width: "80%", height: "8px" }} />
                  <span className="smaller text-purple-600 fw-bold">{syncProgressOut}% {t("sheetsSync.progressCompleted")}</span>
                </Card>
              )}

              {!isSyncingOut && syncSuccessOut && (
                <Card className="card-premium border-0 shadow-sm p-4 text-center mb-4 rounded-2xl bg-white h-100 d-flex flex-column justify-content-center">
                  <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle justify-self-center mb-3" style={{ width: "64px", height: "64px", margin: "0 auto" }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="fw-black text-gray-900 mb-1">{t("sheetsSync.syncOutSuccessTitle")}</h4>
                  <p className="text-muted small mb-2">{t("sheetsSync.syncOutSuccessDesc", { type: exportType.toUpperCase() })}</p>
                  <p className="text-muted smaller mb-4">{t("sheetsSync.syncOutSuccessActionHint")}</p>
                  
                  <div className="d-grid gap-2 mx-auto" style={{ maxWidth: "340px" }}>
                    <Button 
                      variant="success" 
                      href={syncOutUrl}
                      target="_blank" 
                      className="rounded-xl py-2 fw-bold text-white bg-success hover-bg-success-dark border-0 shadow-sm d-flex align-items-center justify-content-center gap-2"
                    >
                      <Sparkles size={15} />
                      <span>{t("sheetsSync.viewGoogleSheetsBtn")}</span>
                    </Button>
                    <Button 
                      variant="light" 
                      onClick={() => setSyncSuccessOut(false)}
                      className="rounded-xl py-2 small text-muted border"
                    >
                      {t("sheetsSync.backOutBtn")}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Data Table Preview */}
              {!isSyncingOut && !syncSuccessOut && (
                <Card className="card-premium border-0 shadow-sm p-4 rounded-2xl h-100 bg-white d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <div>
                        <h3 className="h6 fw-black text-gray-900 mb-0.5">{t("sheetsSync.previewOutTitle")}</h3>
                        <span className="smaller text-muted d-flex align-items-center gap-1">
                          <Check size={12} className="text-success" /> Live Connection: Neon Cloud DB
                        </span>
                      </div>
                      <Badge bg="purple-soft" className="text-purple-600 px-3 py-1.5 rounded-pill fw-bold">
                        {exportType.toUpperCase()}
                      </Badge>
                    </div>

                    {previewLoading ? (
                      <div className="text-center py-5 my-4">
                        <RefreshCw className="spin text-purple-600 mb-2" size={24} />
                        <div className="smaller text-muted">{t("sheetsSync.previewLoadingText", { defaultValue: "Consultando Neon Cloud PostgreSQL..." })}</div>
                      </div>
                    ) : livePreview.length === 0 ? (
                      <div className="text-center py-5 my-4 bg-light rounded-2xl border text-muted smaller">
                        {t("sheetsSync.noDataPreview", { defaultValue: "No hay datos cargados en esta tabla para previsualizar." })}
                      </div>
                    ) : (
                      <div className="table-responsive rounded-2xl border">
                        <Table hover striped className="mb-0 align-middle">
                          <thead>
                            <tr className="bg-light table-header-small" style={{ fontSize: "11px" }}>
                              {Object.keys(selectedColumns[exportType]).filter(k => selectedColumns[exportType][k]).map((c) => (
                                <th key={c} className="py-2.5 ps-3">{t("sheetsSync.columns." + c, { defaultValue: c }).toUpperCase()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody style={{ fontSize: "12.5px" }}>
                            {livePreview.map((row, idx) => (
                              <tr key={idx}>
                                {Object.keys(selectedColumns[exportType]).filter(k => selectedColumns[exportType][k]).map((c) => (
                                  <td key={c} className="py-2.5 ps-3 fw-medium text-gray-800">
                                    {c === "startsAt" || c === "date" 
                                      ? new Date(row[c]).toLocaleDateString(i18n.language === "es" ? "es-AR" : "en-US") 
                                      : c === "amount" || c === "costPrice" || c === "salePrice"
                                        ? currency(row[c])
                                        : String(row[c])
                                    }
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-light rounded-2xl border text-muted smaller mt-4 mb-0" style={{ lineHeight: "1.4" }}>
                    <strong>{t("sheetsSync.exporterContableTitle")}</strong> {t("sheetsSync.exporterContableDesc")}
                  </div>
                </Card>
              )}
            </Col>
          </>
        )}
      </Row>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-black d-flex align-items-center gap-2">
            <CheckCircle2 className="text-primary" /> Confirmar Importación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold small text-dark">Nombre del Registro de Importación <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Ej. Migración Clientes Abril 2026"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              className="modern-input"
            />
          </Form.Group>
          <p className="text-muted small mb-4">
            A continuación se muestra el resumen de cómo quedará repartida la información en la base de datos según lo que has asignado. Revisa que todo esté correcto antes de confirmar.
          </p>
          <div className="d-grid gap-3">
            {sheetsData.filter(s => s.entityType && s.entityType !== "ignore").map(sheet => {
              const mappedCount = Object.keys(sheet.mapping).filter(k => sheet.enabledFields[k] && sheet.mapping[k]).length;
              return (
                <div key={sheet.id} className="p-3 border rounded-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0 text-dark">{sheet.name}</h6>
                    <Badge bg="purple-soft" className="text-purple-600 px-3 py-1 rounded-pill">
                      Destino: {t("sheetsSync.dataType" + sheet.entityType.charAt(0).toUpperCase() + sheet.entityType.slice(1), { defaultValue: sheet.entityType })}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between text-muted small">
                    <span><strong>{sheet.totalRows}</strong> filas a procesar</span>
                    <span><strong>{mappedCount}</strong> columnas mapeadas</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowConfirmModal(false)} className="rounded-pill px-4">
            Cancelar
          </Button>
          <Button 
            variant="success" 
            disabled={!importName.trim()}
            onClick={() => {
              setShowConfirmModal(false);
              executeRealSync();
            }} 
            className="rounded-pill px-4 btn-premium fw-bold shadow-sm"
          >
            Confirmar e Importar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DETALLES DE HISTORIAL */}
      <Modal show={!!selectedHistory} onHide={() => setSelectedHistory(null)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-black h5 d-flex align-items-center gap-2">
            <History className="text-primary" size={20} />
            {selectedHistory?.name || "Detalle de Importación"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          {selectedHistory?.details && (
            <>
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                <span className="text-muted small">Fecha: {new Date(selectedHistory.createdAt).toLocaleString()}</span>
                <Badge bg={selectedHistory.status === "COMPLETED" ? "success" : "warning"} className="px-3 py-1 rounded-pill">
                  {selectedHistory.status}
                </Badge>
              </div>

              <Row className="g-3 mb-4 text-center">
                <Col xs={4}>
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="h4 fw-black text-success m-0">{selectedHistory.details.summary?.created || selectedHistory.details.created || 0}</div>
                    <div className="text-muted smaller">Registros Creados</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="h4 fw-black text-primary m-0">{selectedHistory.details.summary?.reused || selectedHistory.details.reused || 0}</div>
                    <div className="text-muted smaller">Reutilizados / Actualizados</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="h4 fw-black text-danger m-0">{selectedHistory.details.summary?.failed || selectedHistory.details.failed || 0}</div>
                    <div className="text-muted smaller">Filas Omitidas</div>
                  </div>
                </Col>
              </Row>

              {((selectedHistory.details.summary?.successfulDetails) || selectedHistory.details.successfulDetails)?.length > 0 && (
                <div className="mt-4">
                  <h5 className="fw-bold text-success h6 mb-2">Datos Importados Exitosamente</h5>
                  <div className="table-responsive border rounded-3 mb-4 custom-scrollbar" style={{ maxHeight: "250px" }}>
                    <Table hover size="sm" className="mb-0 align-middle">
                      <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                        <tr style={{ fontSize: "12px" }}>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody style={{ fontSize: "13px" }}>
                        {((selectedHistory.details.summary?.successfulDetails) || selectedHistory.details.successfulDetails).map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold text-dark">{item.entityType}</td>
                            <td className="text-muted">{item.description}</td>
                            <td>
                              <Badge bg={item.action === "Creado" ? "success" : "primary"}>
                                {item.action}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              {((selectedHistory.details.summary?.skippedDetails) || selectedHistory.details.skippedDetails)?.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold text-danger h6 mb-0">Detalle de filas omitidas</h5>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="rounded-pill px-3 py-1 d-flex align-items-center gap-1"
                      onClick={() => {
                        const skips = (selectedHistory.details.summary?.skippedDetails) || selectedHistory.details.skippedDetails;
                        const data = [["Fila Original", "Motivo del Error"], ...skips.map(d => [d.row, d.motive])];
                        const ws = XLSX.utils.aoa_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Errores");
                        XLSX.writeFile(wb, `errores_${selectedHistory.name}.xlsx`);
                      }}
                    >
                      <Download size={12} /> Descargar Errores
                    </Button>
                  </div>
                  <div className="table-responsive border rounded-3" style={{ maxHeight: "250px" }}>
                    <Table hover size="sm" className="mb-0">
                      <thead className="bg-light sticky-top">
                        <tr>
                          <th>Fila</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((selectedHistory.details.summary?.skippedDetails) || selectedHistory.details.skippedDetails).map((skipped, idx) => (
                          <tr key={idx}>
                            <td className="text-muted">#{skipped.row}</td>
                            <td className="text-danger small">{skipped.motive}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setSelectedHistory(null)} className="rounded-pill px-4">
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DEACTIVATE CONFIRMATION MODAL */}
      <Modal show={!!deactivateModalData} onHide={() => !isDeactivating && setDeactivateModalData(null)} centered>
        <Modal.Header closeButton={!isDeactivating} className="border-0 pb-0">
          <Modal.Title className="fw-black h5 text-danger d-flex align-items-center gap-2">
            <AlertCircle size={22} />
            Desactivar Importación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-4">
            Estás a punto de desactivar la importación <strong>"{deactivateModalData?.name}"</strong>. Esto cambiará a estado "inactivo" o "cancelado" a los siguientes registros que fueron creados nuevos en esa importación:
          </p>
          <ul className="list-group mb-4 small">
            {(deactivateModalData?.details?.createdIds?.clients?.length > 0) && (
              <li className="list-group-item d-flex justify-content-between align-items-center bg-light">
                Clientes
                <Badge bg="primary" rounded="pill">{deactivateModalData.details.createdIds.clients.length}</Badge>
              </li>
            )}
            {(deactivateModalData?.details?.createdIds?.appointments?.length > 0) && (
              <li className="list-group-item d-flex justify-content-between align-items-center bg-light">
                Citas
                <Badge bg="success" rounded="pill">{deactivateModalData.details.createdIds.appointments.length}</Badge>
              </li>
            )}
            {(deactivateModalData?.details?.createdIds?.services?.length > 0) && (
              <li className="list-group-item d-flex justify-content-between align-items-center bg-light">
                Servicios
                <Badge bg="info" rounded="pill">{deactivateModalData.details.createdIds.services.length}</Badge>
              </li>
            )}
            {(deactivateModalData?.details?.createdIds?.workers?.length > 0) && (
              <li className="list-group-item d-flex justify-content-between align-items-center bg-light">
                Profesionales
                <Badge bg="warning" text="dark" rounded="pill">{deactivateModalData.details.createdIds.workers.length}</Badge>
              </li>
            )}
            {(deactivateModalData?.details?.createdIds?.expenses?.length > 0) && (
              <li className="list-group-item d-flex justify-content-between align-items-center bg-light">
                Egresos / Pagos
                <Badge bg="danger" rounded="pill">{deactivateModalData.details.createdIds.expenses.length}</Badge>
              </li>
            )}
            {(!deactivateModalData?.details?.createdIds || Object.values(deactivateModalData.details.createdIds).every(arr => arr.length === 0)) && (
              <li className="list-group-item bg-light text-muted fst-italic">
                No hay registros nuevos rastreados en esta importación.
              </li>
            )}
          </ul>
          <p className="text-danger small fw-bold mb-0">
            Esta acción no se puede deshacer. Los registros que solo fueron actualizados no se verán afectados.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setDeactivateModalData(null)} disabled={isDeactivating} className="rounded-pill px-4">
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            disabled={isDeactivating}
            onClick={async () => {
              setIsDeactivating(true);
              try {
                await api.delete(`/google/import-history/${deactivateModalData.id}`);
                setDeactivateModalData(null);
                
                // Refresh data
                const res = await api.get("/google/import-history");
                if (Array.isArray(res.data)) setImportHistory(res.data);
                
                alert("Importación desactivada exitosamente");
                
                // Optional: force a reload of the app to refresh dashboard stats
                window.location.reload();
              } catch (error) {
                alert(error.response?.data?.error || "Error al desactivar la importación");
              } finally {
                setIsDeactivating(false);
              }
            }} 
            className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
          >
            {isDeactivating ? <RefreshCw size={16} className="spin" /> : null}
            {isDeactivating ? "Procesando..." : "Sí, Desactivar"}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}
