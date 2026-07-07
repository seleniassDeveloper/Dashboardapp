import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FileSpreadsheet, Database, Download, Link2, UploadCloud, 
  HelpCircle, ChevronRight, Check, X, RefreshCw, AlertTriangle, 
  Trash2, FileText, CheckCircle2, ShieldCheck, Play, ArrowLeft,
  ChevronLeft, Menu, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import api from "../../lib/api.js";
import "./SheetsSyncMobile.css";

const stepNames = ["Origen", "Mapear", "Revisar", "Importar"];

export default function SheetsSyncMobile({ sync }) {
  const { t } = useTranslation("views");
  const navigate = useNavigate();

  // Navigation state for mobile wizard
  const [screen, setScreen] = useState("home"); // "home" | "source" | "wizard" | "history" | "export"
  const [wizardStep, setWizardStep] = useState(1); // 1: Pestañas/Origen, 2: Mapear, 3: Revisar

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { 
      detail: screen !== "home" 
    }));
    return () => {
      window.dispatchEvent(new CustomEvent("set-hide-mobile-topbar", { detail: false }));
    };
  }, [screen]);

  // Stepper helper
  const renderStepper = () => {
    // Current logical step index (0-3)
    let currentStepIdx = 0;
    if (sync.step === 3 || sync.step === 4) {
      currentStepIdx = 3;
    } else if (wizardStep === 2) {
      currentStepIdx = 1;
    } else if (wizardStep === 3) {
      currentStepIdx = 2;
    }

    return (
      <div className="sm-stepper">
        {stepNames.map((name, idx) => {
          const isActive = idx === currentStepIdx;
          const isDone = idx < currentStepIdx;

          return (
            <div className="sm-stepper__step" key={name}>
              {idx > 0 && (
                <div className={`sm-stepper__line ${isDone ? "sm-stepper__line--done" : ""}`} />
              )}
              <div className={`sm-stepper__dot ${isActive ? "sm-stepper__dot--active" : ""} ${isDone ? "sm-stepper__dot--done" : ""}`}>
                {isDone ? <Check size={14} /> : idx + 1}
              </div>
              <span className={`sm-stepper__label ${isActive ? "sm-stepper__label--active" : ""}`}>
                {name}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Screen 1: SyncHome
  if (screen === "home") {
    return (
      <div className="sheets-mobile py-3">


        <div className="sm-hero">
          <div className="sm-hero__icon">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h1>Sincronizador</h1>
            <p>Portal bidireccional contable para importar, exportar y descargar archivos del salón.</p>
          </div>
        </div>

        {/* Toggle de dirección */}
        <div className="sm-toggle">
          <button 
            className={`sm-toggle__btn ${sync.activeDirection === "import" ? "sm-toggle__btn--active" : ""}`}
            onClick={() => sync.setActiveDirection("import")}
          >
            <Database size={18} className="mb-1" />
            <span>Importar (Entrada)</span>
          </button>
          <button 
            className={`sm-toggle__btn ${sync.activeDirection === "export" ? "sm-toggle__btn--active" : ""}`}
            onClick={() => sync.setActiveDirection("export")}
          >
            <Download size={18} className="mb-1" />
            <span>Exportar (Salida)</span>
          </button>
        </div>

        {sync.activeDirection === "import" ? (
          <div>
            <h3 className="im-section-title">Importar desde</h3>
            
            <div 
              className="sm-card sm-source-card"
              onClick={() => {
                sync.setImportMethod("google");
                setScreen("source");
              }}
            >
              <div className="sm-source-card__icon" style={{ background: "var(--sm-sheets-soft)", color: "var(--sm-sheets)" }}>
                <Link2 size={20} />
              </div>
              <div className="sm-source-card__body">
                <b>Google Sheets Link</b>
                <span>Pega el link de tu planilla de Google Drive.</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>

            <label className="sm-card sm-source-card w-100" style={{ cursor: "pointer" }}>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls, .json" 
                className="d-none"
                onChange={(e) => {
                  sync.setImportMethod("file");
                  if (e.target.files[0]) {
                    sync.handleFileUpload(e.target.files[0]);
                    setScreen("wizard");
                    setWizardStep(1);
                  }
                }}
              />
              <div className="sm-source-card__icon" style={{ background: "var(--sm-purple-soft)", color: "var(--sm-purple)" }}>
                <UploadCloud size={20} />
              </div>
              <div className="sm-source-card__body">
                <b>Subir Archivo Local</b>
                <span>Sube un archivo .xlsx, .csv o .json desde tu celular.</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </label>

            <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
              <h3 className="im-section-title m-0">Plantillas oficiales</h3>
            </div>
            <p className="text-muted small px-1 mb-3">Descarga, completa y vuelve a importar.</p>
            
            <div className="sm-templates">
              <div className="sm-template" onClick={() => sync.downloadTemplate("clients")}>
                <div className="sm-template__icon"><FileSpreadsheet size={18} /></div>
                <span className="sm-template__label">Clientes</span>
              </div>
              <div className="sm-template" onClick={() => sync.downloadTemplate("services")}>
                <div className="sm-template__icon"><FileSpreadsheet size={18} /></div>
                <span className="sm-template__label">Servicios</span>
              </div>
              <div className="sm-template" onClick={() => sync.downloadTemplate("workers")}>
                <div className="sm-template__icon"><FileSpreadsheet size={18} /></div>
                <span className="sm-template__label">Personal</span>
              </div>
              <div className="sm-template" onClick={() => sync.downloadTemplate("appointments")}>
                <div className="sm-template__icon"><FileSpreadsheet size={18} /></div>
                <span className="sm-template__label">Citas</span>
              </div>
            </div>

            <button 
              className="btn btn-outline-purple w-100 rounded-xl py-3 fw-bold mt-4 d-flex align-items-center justify-content-center gap-2"
              onClick={() => setScreen("history")}
            >
              <HistoryIcon size={16} />
              <span>Ver Historial de Importaciones</span>
            </button>
          </div>
        ) : (
          /* Export content direct navigation */
          <div>
            <h3 className="im-section-title">Configurar Exportación</h3>
            <button 
              className="btn btn-purple w-100 rounded-xl py-3 fw-bold mt-2"
              onClick={() => setScreen("export")}
            >
              Comenzar Exportación →
            </button>
          </div>
        )}
      </div>
    );
  }

  // Screen 2: SelectSource (Google Sheet Link)
  if (screen === "source") {
    return (
      <div className="sheets-mobile py-3">
        <header className="d-flex align-items-center justify-content-between mb-4">
          <button className="sm-back" onClick={() => setScreen("home")}>
            <ChevronLeft size={24} />
            <span>Atrás</span>
          </button>
          <h2 className="m-0 fw-bold" style={{ fontSize: "16px" }}>Vincular Planilla</h2>
          <button className="btn p-0" onClick={() => alert("Pega el enlace web de Google Sheets que tenga permisos de lectura pública (Cualquier persona con el enlace).")}><HelpCircle size={22} className="text-muted" /></button>
        </header>

        <div className="sm-card sm-connect">
          <div className="sm-connect__icon">
            <Link2 size={26} />
          </div>
          <h3>Pega el link de tu Google Sheet</h3>
          <p>Asegúrate de que el acceso esté configurado como 'Cualquier persona con el enlace puede ver'.</p>
          
          <input 
            type="text"
            value={sync.sheetUrl}
            onChange={(e) => sync.setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
          />
          
          {sync.loading ? (
            <button className="sm-connect__btn d-flex align-items-center justify-content-center gap-2" disabled>
              <RefreshCw size={18} className="spin" />
              <span>Analizando...</span>
            </button>
          ) : (
            <button 
              className="sm-connect__btn" 
              onClick={async (e) => {
                await sync.handleAnalyze(e);
                setScreen("wizard");
                setWizardStep(1);
              }}
            >
              Conectar
            </button>
          )}
        </div>

        <div className="sm-secure">
          <ShieldCheck size={28} className="text-purple-600 flex-shrink-0" />
          <div>
            <b>Tu información está 100% segura</b>
            <span>Solo importamos los datos que autorizas y mapeas en los siguientes pasos.</span>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3-7: Wizard
  if (screen === "wizard") {
    // Screen 6: StepImporting
    if (sync.step === 3) {
      const R = 80;
      const C = 2 * Math.PI * R;
      return (
        <div className="sheets-mobile py-3 text-center">
          {renderStepper()}
          
          <div className="sm-importing mt-4">
            <h3>Importando datos...</h3>
            <p>Por favor no cierres la aplicación.</p>
            
            <div className="sm-donut">
              <svg viewBox="0 0 180 180" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                <circle cx="90" cy="90" r={R} fill="none" stroke="#ede9fe" strokeWidth="12"/>
                <circle 
                  cx="90" 
                  cy="90" 
                  r={R} 
                  fill="none" 
                  stroke="#7c5cfc" 
                  strokeWidth="12"
                  strokeLinecap="round" 
                  strokeDasharray={C} 
                  strokeDashoffset={C * (1 - sync.progress / 100)}
                />
              </svg>
              <div className="sm-donut__pct">
                <b>{sync.progress}%</b>
                <span>{sync.statusText || "Procesando..."}</span>
              </div>
            </div>

            {/* List of tabs being synced */}
            <div className="mt-4 text-start">
              {sync.sheetsData
                .filter(s => s.entityType && s.entityType !== "ignore")
                .map((sheet, idx) => (
                  <div className="sm-prog-row" key={sheet.id}>
                    <span className="sm-prog-row__name">{sheet.name}</span>
                    <div className="sm-prog-row__bar">
                      <div className="sm-prog-row__fill" style={{ width: sync.progress >= 100 ? "100%" : `${Math.min(100, Math.max(0, (sync.progress - idx * 20)))}%` }} />
                    </div>
                    <span className="sm-prog-row__val">
                      {sync.progress >= 100 ? "Completo" : "Procesando"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
    }

    // Screen 7: StepDone
    if (sync.step === 4) {
      return (
        <div className="sheets-mobile py-3 text-center">
          {renderStepper()}

          <div className="sm-done mt-4">
            <div className="sm-done__check">
              <Check size={32} />
            </div>
            <h3 className="fw-bold">¡Importación completada!</h3>
            <p className="text-muted">Tu información se ha importado correctamente en Neon Cloud Database.</p>

            <div className="sm-card sm-result text-start">
              <div className="sm-result__row">
                <div className="sm-result__icon" style={{ background: "var(--sm-green-soft)", color: "var(--sm-green)" }}>
                  <Check size={20} />
                </div>
                <div>
                  <div className="sm-result__num">{sync.summary.created || 0}</div>
                  <span className="sm-result__label">Registros Creados</span>
                </div>
              </div>

              <div className="sm-result__row">
                <div className="sm-result__icon" style={{ background: "var(--sm-blue-soft)", color: "var(--sm-blue)" }}>
                  <RefreshCw size={20} />
                </div>
                <div>
                  <div className="sm-result__num">{sync.summary.reused || 0}</div>
                  <span className="sm-result__label">Registros Actualizados / Reutilizados</span>
                </div>
              </div>

              <div className="sm-result__row" style={{ borderBottom: 0 }}>
                <div className="sm-result__icon" style={{ background: "var(--sm-red-soft)", color: "var(--sm-red)" }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="sm-result__num">{sync.summary.failed || 0}</div>
                  <span className="sm-result__label">Errores / Omitidos</span>
                </div>
              </div>
            </div>

            {sync.summary.skippedDetails && sync.summary.skippedDetails.length > 0 && (
              <div className="sm-tip">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <b>Errores detectados</b>
                  <span className="d-block text-muted mt-1" style={{ fontSize: "12px" }}>
                    Revisa los datos faltantes en tu planilla para evitar duplicados en la próxima sincronización.
                  </span>
                </div>
              </div>
            )}

            <button 
              className="sm-cta"
              onClick={() => {
                sync.setStep(1);
                sync.setSheetsData([]);
                setScreen("home");
              }}
            >
              Finalizar
            </button>
          </div>
        </div>
      );
    }

    // Paso 1: Origen / pestañas detectadas (wizardStep === 1)
    if (wizardStep === 1) {
      return (
        <div className="sheets-mobile py-3">
          {renderStepper()}

          <header className="d-flex align-items-center justify-content-between mb-3 mt-2">
            <button className="sm-back" onClick={() => setScreen("home")}>
              <ChevronLeft size={24} />
              <span>Atrás</span>
            </button>
            <h3 className="m-0 fw-bold" style={{ fontSize: "16px" }}>Pestañas Detectadas</h3>
            <div style={{ width: "24px" }} />
          </header>

          <div className="sm-card sm-connected mb-3">
            <FileSpreadsheet size={24} className="text-success" />
            <div>
              <b>Planilla Vinculada</b>
              <span className="d-block">{sync.sheetsData.length} pestañas encontradas</span>
            </div>
          </div>

          <p className="text-muted small px-1 mb-3">Asigna el tipo de información que contiene cada pestaña:</p>

          <div className="d-grid gap-2">
            {sync.sheetsData.map((sheet) => {
              const isAssigned = sheet.entityType && sheet.entityType !== "ignore";
              
              return (
                <div 
                  className="sm-tab-row" 
                  key={sheet.id}
                  onClick={() => {
                    sync.setActiveSheetId(sheet.id);
                    setWizardStep(2);
                  }}
                >
                  <div>
                    <span className="sm-tab-row__name">{sheet.name}</span>
                    <span className="d-block text-muted small mt-1">
                      {sheet.totalRows} filas detectadas
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {isAssigned ? (
                      <span className="sm-badge sm-badge--ok">
                        {sheet.entityType.toUpperCase()}
                      </span>
                    ) : (
                      <span className="sm-badge sm-badge--none">
                        Sin asignar
                      </span>
                    )}
                    <ChevronRight size={18} className="text-muted" />
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            className="sm-cta"
            disabled={!sync.sheetsData.some(s => s.entityType && s.entityType !== "ignore")}
            onClick={() => setWizardStep(3)}
          >
            Continuar
          </button>
        </div>
      );
    }

    // Paso 2: Mapear columnas (wizardStep === 2)
    if (wizardStep === 2) {
      const activeSheet = sync.sheetsData.find(s => s.id === sync.activeSheetId);
      
      return (
        <div className="sheets-mobile py-3">
          {renderStepper()}

          <header className="d-flex align-items-center justify-content-between mb-3 mt-2">
            <button 
              className="sm-back" 
              onClick={() => {
                sync.setActiveSheetId(null);
                setWizardStep(1);
              }}
            >
              <ChevronLeft size={24} />
              <span>Atrás</span>
            </button>
            <h3 className="m-0 fw-bold" style={{ fontSize: "16px" }}>Mapear Columnas</h3>
            <div style={{ width: "24px" }} />
          </header>

          {activeSheet && (
            <div>
              <div className="mb-3">
                <label className="fw-bold small text-muted mb-1.5">Asignar tipo de datos de esta pestaña</label>
                <select 
                  className="form-select rounded-xl border-gray-200"
                  value={activeSheet.entityType || ""}
                  onChange={(e) => sync.handleAssignSheetType(activeSheet.id, e.target.value)}
                  style={{ minHeight: "48px" }}
                >
                  <option value="">-- Sin asignar --</option>
                  <option value="clients">Clientes</option>
                  <option value="services">Servicios</option>
                  <option value="workers">Equipo / Profesionales</option>
                  <option value="appointments">Agenda / Turnos</option>
                  <option value="expenses">Gastos</option>
                  <option value="ignore">Ignorar pestaña</option>
                </select>
              </div>

              {activeSheet.entityType && activeSheet.entityType !== "ignore" && (
                <div>
                  <div className="sm-map-head mt-4">
                    <span>COLUMNA EN TU EXCEL</span>
                    <span>CAMPO EN AURADASH</span>
                  </div>

                  <div className="d-grid gap-3">
                    {activeSheet.entityFields.map((field) => (
                      <div className="sm-map-row" key={field.key}>
                        <div className="sm-map-row__src">
                          {field.label} {field.required && "*"}
                        </div>
                        <div className="sm-map-row__arrow">→</div>
                        <div className="sm-map-row__dst">
                          <select
                            value={activeSheet.mapping[field.key] || ""}
                            onChange={(e) => sync.handleMapChange(activeSheet.id, field.key, e.target.value)}
                          >
                            <option value="">-- Ignorar --</option>
                            {activeSheet.headers.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {sync.showNewFieldForm ? (
                    <div className="mt-3 p-3 bg-light rounded-xl border">
                      <input 
                        type="text"
                        className="form-control rounded-xl mb-2"
                        placeholder="Nombre de campo personalizado"
                        value={sync.newFieldName}
                        onChange={(e) => sync.setNewFieldName(e.target.value)}
                      />
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-purple btn-sm rounded-pill px-3"
                          onClick={() => sync.handleAddCustomField(activeSheet.id)}
                        >
                          Guardar
                        </button>
                        <button 
                          className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                          onClick={() => sync.setShowNewFieldForm(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="sm-add-field w-100 py-2.5 mt-2"
                      onClick={() => sync.setShowNewFieldForm(true)}
                    >
                      + Agregar campo personalizado
                    </button>
                  )}
                </div>
              )}

              <button 
                className="sm-cta"
                onClick={() => {
                  sync.setActiveSheetId(null);
                  setWizardStep(1);
                }}
              >
                Guardar Mapeo
              </button>
            </div>
          )}
        </div>
      );
    }

    // Paso 3: Revisar / Vista previa (wizardStep === 3)
    if (wizardStep === 3) {
      const activeSheet = sync.sheetsData.find(s => s.entityType && s.entityType !== "ignore") || sync.sheetsData[0];
      
      return (
        <div className="sheets-mobile py-3">
          {renderStepper()}

          <header className="d-flex align-items-center justify-content-between mb-3 mt-2">
            <button className="sm-back" onClick={() => setWizardStep(1)}>
              <ChevronLeft size={24} />
              <span>Atrás</span>
            </button>
            <h3 className="m-0 fw-bold" style={{ fontSize: "16px" }}>Revisar Datos</h3>
            <div style={{ width: "24px" }} />
          </header>

          <p className="text-muted small px-1 mb-3">Revisa las primeras 5 filas antes de iniciar la importación:</p>

          {activeSheet && (
            <div className="sm-preview mb-4">
              <table>
                <thead>
                  <tr>
                    {activeSheet.headers.slice(0, 4).map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeSheet.previewRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {activeSheet.headers.slice(0, 4).map(h => (
                        <td key={h}>{row[h] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="sm-card sm-summary">
            <h4 className="fw-bold small text-muted mb-3">Resumen estimado</h4>
            
            <div className="sm-summary__row">
              <span className="sm-summary__dot" style={{ background: "var(--sm-green)" }} />
              <span>Registros Nuevos</span>
              <b>{sync.sheetsData.reduce((acc, s) => acc + (s.entityType && s.entityType !== "ignore" ? s.totalRows : 0), 0)}</b>
            </div>
            
            <div className="sm-summary__row" style={{ borderTop: "1px solid #f2f0f9", borderBottom: "1px solid #f2f0f9" }}>
              <span className="sm-summary__dot" style={{ background: "var(--sm-blue)" }} />
              <span>A actualizar</span>
              <b>0</b>
            </div>

            <div className="sm-summary__row">
              <span className="sm-summary__dot" style={{ background: "var(--sm-red)" }} />
              <span>Con errores</span>
              <b>0</b>
            </div>
          </div>

          <div className="mt-3">
            <label className="fw-bold small text-muted mb-1.5">Nombre del lote (opcional)</label>
            <input 
              type="text"
              className="form-control rounded-xl"
              style={{ minHeight: "48px" }}
              placeholder="Ej: Backup Excel Julio 2026"
              value={sync.importName}
              onChange={(e) => sync.setImportName(e.target.value)}
            />
          </div>

          <button 
            className="sm-cta"
            onClick={() => sync.executeRealSync()}
          >
            Iniciar Importación
          </button>
        </div>
      );
    }
  }

  // Screen 8: Historial de importaciones
  if (screen === "history") {
    return (
      <div className="sheets-mobile py-3">
        <header className="d-flex align-items-center justify-content-between mb-4">
          <button className="sm-back" onClick={() => setScreen("home")}>
            <ChevronLeft size={24} />
            <span>Atrás</span>
          </button>
          <h2 className="m-0 fw-bold" style={{ fontSize: "16px" }}>Historial</h2>
          <div style={{ width: "24px" }} />
        </header>

        <div className="sm-hist-filter">
          <span>Filtrar: Todos los estados</span>
        </div>

        <div className="d-grid gap-2">
          {sync.importHistory.length === 0 ? (
            <div className="text-center py-5 text-muted small bg-white rounded-xl border">
              No hay importaciones registradas todavía.
            </div>
          ) : (
            sync.importHistory.map((hist) => {
              const dateStr = new Date(hist.createdAt).toLocaleDateString("es-AR") + " • " + new Date(hist.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs";
              
              return (
                <div className="sm-hist-row sm-card" key={hist.id}>
                  <div className="sm-hist-row__icon sm-hist-row__icon--xlsx">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="sm-hist-row__body">
                    <div className="sm-hist-row__top">
                      <span className="sm-hist-row__name">{hist.name || "Importación de datos"}</span>
                      <span className="badge bg-success-soft text-success rounded-pill px-2.5">
                        Completado
                      </span>
                    </div>
                    <div className="sm-hist-row__meta">
                      {dateStr}
                    </div>
                    <div className="small text-muted mt-2" style={{ fontSize: "11.5px" }}>
                      Created: {hist.summary?.created || 0} • Updated: {hist.summary?.reused || 0} • Failed: {hist.summary?.failed || 0}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Screen 9: Exportar
  if (screen === "export") {
    return (
      <div className="sheets-mobile py-3">
        <header className="d-flex align-items-center justify-content-between mb-4">
          <button className="sm-back" onClick={() => setScreen("home")}>
            <ChevronLeft size={24} />
            <span>Atrás</span>
          </button>
          <h2 className="m-0 fw-bold" style={{ fontSize: "16px" }}>Exportar</h2>
          <div style={{ width: "24px" }} />
        </header>

        <div className="mb-3">
          <label className="fw-bold small text-muted mb-1.5">¿Qué datos deseas exportar?</label>
          <select 
            className="form-select rounded-xl"
            style={{ minHeight: "48px" }}
            value={sync.exportType}
            onChange={(e) => sync.setExportType(e.target.value)}
          >
            <option value="clients">Clientes</option>
            <option value="inventory">Inventario de Productos</option>
            <option value="appointments">Citas / Agenda</option>
            <option value="expenses">Gastos Financieros</option>
          </select>
        </div>

        <label className="fw-bold small text-muted mb-1.5 mt-2">Columnas a incluir:</label>
        <div className="sm-export-chips">
          {Object.keys(sync.selectedColumns[sync.exportType] || {}).map((col) => {
            const isActive = sync.selectedColumns[sync.exportType][col];
            return (
              <div 
                className={`sm-export-chip ${isActive ? "sm-export-chip--active" : ""}`}
                key={col}
                onClick={() => sync.handleColumnToggle(col)}
              >
                {col}
              </div>
            );
          })}
        </div>

        <div className="mb-3">
          <label className="fw-bold small text-muted mb-1.5">Formato de descarga</label>
          <select 
            className="form-select rounded-xl"
            style={{ minHeight: "48px" }}
            value={sync.exportFormat}
            onChange={(e) => sync.setExportFormat(e.target.value)}
          >
            <option value="xls">Excel (.xlsx / .xls)</option>
            <option value="csv">CSV delimitado por comas</option>
            <option value="json">Archivo JSON estructurado</option>
          </select>
        </div>

        {sync.previewLoading ? (
          <div className="text-center py-4 text-muted small">
            Cargando vista previa...
          </div>
        ) : (
          sync.livePreview && sync.livePreview.length > 0 && (
            <div>
              <label className="fw-bold small text-muted mb-1.5">Vista previa (Primeras 5 filas):</label>
              <div className="sm-preview mb-4">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(sync.selectedColumns[sync.exportType]).filter(c => sync.selectedColumns[sync.exportType][c]).map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sync.livePreview.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {Object.keys(sync.selectedColumns[sync.exportType]).filter(c => sync.selectedColumns[sync.exportType][c]).map(h => (
                          <td key={h}>{row[h] !== undefined ? String(row[h]) : "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {sync.isSyncingOut ? (
          <button className="sm-cta d-flex align-items-center justify-content-center gap-2" disabled>
            <RefreshCw size={18} className="spin" />
            <span>Sincronizando {sync.syncProgressOut}%...</span>
          </button>
        ) : (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-purple flex-grow-1 rounded-xl py-3 fw-bold"
              onClick={() => sync.triggerDownload()}
            >
              Descargar archivo
            </button>
            <button 
              className="btn btn-purple flex-grow-1 rounded-xl py-3 fw-bold"
              onClick={() => sync.triggerGoogleSheetsPushSync()}
            >
              Enviar a Google Sheets
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Inline fallback for MenuIcon and HistoryIcon to avoid lucide imports collision
function MenuIcon({ size }) {
  return <Menu size={size} />;
}
function HistoryIcon({ size }) {
  return <History size={size} />;
}
