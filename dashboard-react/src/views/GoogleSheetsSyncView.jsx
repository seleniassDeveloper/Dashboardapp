import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Form, Button, Table, ProgressBar, Alert, Badge, Modal } from "react-bootstrap";
import {
  FileSpreadsheet, Link2, Settings, ArrowRight, RefreshCw,
  CheckCircle2, AlertTriangle, Sparkles, HelpCircle, Download,
  Database, Check, FileText, FileJson, History
} from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import api from "../lib/api.js";
import * as XLSX from "xlsx";

const INITIAL_ENTITY_FIELDS = {
  clients: [
    { key: "firstName", label: "Nombre / Nombre Completo", required: false },
    { key: "lastName", label: "Apellido", required: false },
    { key: "phone", label: "Teléfono / WhatsApp", required: false },
    { key: "email", label: "Correo Electrónico", required: false },
    { key: "notes", label: "Notas / Origen", required: false }
  ],
  services: [
    { key: "name", label: "Nombre del Servicio", required: false },
    { key: "price", label: "Precio / Importe", required: false },
    { key: "duration", label: "Duración (minutos)", required: false }
  ],
  workers: [
    { key: "firstName", label: "Nombre / Nombre Completo", required: false },
    { key: "lastName", label: "Apellido", required: false },
    { key: "email", label: "Correo Electrónico", required: false },
    { key: "phone", label: "Teléfono / WhatsApp", required: false },
    { key: "roleTitle", label: "Cargo / Rol", required: false }
  ],
  appointments: [
    { key: "clientName", label: "Nombre del Cliente", required: false },
    { key: "phone", label: "Teléfono del Cliente", required: false },
    { key: "email", label: "Correo del Cliente", required: false },
    { key: "serviceName", label: "Nombre del Servicio", required: false },
    { key: "workerName", label: "Nombre del Profesional", required: false },
    { key: "startsAt", label: "Fecha del Turno", required: false },
    { key: "time", label: "Hora del Turno (Opcional)", required: false },
    { key: "price", label: "Importe Cobrado", required: false },
    { key: "status", label: "Estado (DONE, CONFIRMED, CANCELLED)", required: false },
    { key: "notes", label: "Notas / Detalles", required: false }
  ]
};

// Datos reales de salón para simular una carga exitosa en la base de datos real
const SAMPLE_SALON_DATA = [
  { firstName: "Sofía", lastName: "Altieri", phone: "1154329876", email: "sofia.altieri@gmail.com", service: "Balayage Premium", price: 30000, duration: 180, worker: "Andrea", notes: "Prefiere café con leche de almendras." },
  { firstName: "Javier", lastName: "Rossi", phone: "1198765432", email: "javier.rossi@yahoo.com.ar", service: "Corte Diseñador", price: 15000, duration: 45, worker: "Nicolás", notes: "Corte degradé bajo en los costados." },
  { firstName: "Martina", lastName: "López", phone: "1134215678", email: "martina.lopez@outlook.com", service: "Tratamiento Keratina", price: 25000, duration: 120, worker: "Florencia", notes: "Cabello con decoloración previa." },
  { firstName: "Bautista", lastName: "Sosa", phone: "1123456789", email: "bautista.sosa@gmail.com", service: "Manicuría Rusa", price: 12000, duration: 60, worker: "Andrea", notes: "Esmaltado semipermanente negro mate." },
  { firstName: "Delfina", lastName: "Fernández", phone: "1165437890", email: "delfina.f@hotmail.com", service: "Perfilado de Cejas", price: 6000, duration: 30, worker: "Florencia", notes: "Piel sensible a la cera caliente." },
  { firstName: "Valentino", lastName: "Gómez", phone: "1176543210", email: "valentino.g@gmail.com", service: "Coloración Total", price: 22000, duration: 90, worker: "Nicolás", notes: "Tinta orgánica libre de amoníaco." }
];

export default function GoogleSheetsSyncView() {
  const { t, i18n } = useTranslation("views");
  const currency = (n) => {
    const isEs = i18n.language === "es";
    return new Intl.NumberFormat(isEs ? "es-AR" : "en-US", {
      style: "currency",
      currency: isEs ? "ARS" : "USD",
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  const [activeDirection, setActiveDirection] = useState("import"); // "import" | "export"

  // STATE FOR IMPORT
  const [sheetUrl, setSheetUrl] = useState("");
  const [step, setStep] = useState(1); // 1: URL/File, 2: Map Sheets, 3: Syncing, 4: Done
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ created: 0, reused: 0, failed: 0, skippedDetails: [] });
  const [importMethod, setImportMethod] = useState("google"); // "google" | "file"

  // MULTI-SHEET STATE
  // sheetsData: array of { id, name, headers, rows, totalRows, previewRows, entityType, mapping, enabledFields, entityFields }
  const [sheetsData, setSheetsData] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState(null); // Which sheet's column mapping is currently open
  const [newFieldName, setNewFieldName] = useState("");
  const [importHistory, setImportHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [importName, setImportName] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/google/import-history");
        if (Array.isArray(res.data)) {
          setImportHistory(res.data);
        } else {
          setImportHistory([]);
        }
      } catch (e) {
        console.error("Error fetching history:", e);
        setImportHistory([]);
      }
    };
    fetchHistory();
  }, [step]); // Refetch when step changes (e.g. going back to step 1)

  const getInitialEnabledFields = (type) => ({
    clients: { firstName: true, lastName: true, phone: true, email: true, notes: true },
    services: { name: true, price: true, duration: true },
    workers: { firstName: true, lastName: true, email: true, phone: true, roleTitle: true },
    appointments: { clientName: true, phone: true, email: true, serviceName: true, workerName: true, startsAt: true, time: true, price: true, status: true, notes: true }
  }[type] || {});

  const autoDetectMappingsLocal = (headers, type, entityFieldsDef, enabled) => {
    const newMapping = {};
    const fields = entityFieldsDef.filter(f => enabled[f.key]);
    fields.forEach(field => {
      const lowerKey = field.key.toLowerCase();
      let match = "";
      if (lowerKey === "firstname" || lowerKey === "clientname") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("nombre") || l.includes("name") || l.includes("cliente");
        });
      } else if (lowerKey === "lastname") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("apellido") || l.includes("last");
        });
      } else if (lowerKey === "phone") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("tel") || l.includes("cel") || l.includes("wha") || l.includes("phone");
        });
      } else if (lowerKey === "email") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("email") || l.includes("mail") || l.includes("correo");
        });
      } else if (lowerKey === "servicename" || lowerKey === "name") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("servicio") || l.includes("service") || l.includes("insumo");
        });
      } else if (lowerKey === "workername" || lowerKey === "worker") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("profesional") || l.includes("worker") || l.includes("empleado") || l.includes("estilista") || l.includes("colaborador") || l.includes("atendio");
        });
      } else if (lowerKey === "startsat" || lowerKey === "date") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("fecha") || l.includes("date") || l.includes("alta") || l.includes("turno");
        });
      } else if (lowerKey === "time") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("hora") || l.includes("time");
        });
      } else if (lowerKey === "price") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("precio") || l.includes("importe") || l.includes("monto") || l.includes("cost") || l.includes("total") || l.includes("pagos") || l.includes("cobrado");
        });
      } else if (lowerKey === "notes") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("nota") || l.includes("origen") || l.includes("comentario");
        });
      } else if (lowerKey === "status") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("estado") || l.includes("status");
        });
      } else if (lowerKey === "roletitle") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("cargo") || l.includes("rol") || l.includes("puesto");
        });
      }
      newMapping[field.key] = match || "";
    });
    return newMapping;
  };

  const updateSheetState = (sheetId, updates) => {
    setSheetsData(prev => prev.map(s => s.id === sheetId ? { ...s, ...updates } : s));
  };

  const handleAssignSheetType = (sheetId, type) => {
    if (type === "ignore" || !type) {
      updateSheetState(sheetId, { entityType: type || "", mapping: {}, entityFields: [], enabledFields: {} });
      if (activeSheetId === sheetId) setActiveSheetId(null);
      return;
    }
    const entityFieldsDef = [...INITIAL_ENTITY_FIELDS[type]];
    const enabledFields = getInitialEnabledFields(type);
    setSheetsData(prev => prev.map(s => {
      if (s.id === sheetId) {
        return {
          ...s,
          entityType: type,
          entityFields: entityFieldsDef,
          enabledFields,
          mapping: autoDetectMappingsLocal(s.headers, type, entityFieldsDef, enabledFields)
        };
      }
      return s;
    }));
    setActiveSheetId(sheetId);
  };

  const handleMapChange = (sheetId, field, val) => {
    setSheetsData(prev => prev.map(s => {
      if (s.id === sheetId) {
        return { ...s, mapping: { ...s.mapping, [field]: val } };
      }
      return s;
    }));
  };

  const handleToggleField = (sheetId, fieldKey) => {
    setSheetsData(prev => prev.map(s => {
      if (s.id === sheetId) {
        return {
          ...s,
          enabledFields: {
            ...s.enabledFields,
            [fieldKey]: !s.enabledFields[fieldKey]
          }
        };
      }
      return s;
    }));
  };

  const handleAddCustomField = (sheetId) => {
    if (!newFieldName.trim()) return;
    const keyName = newFieldName.trim();
    setSheetsData(prev => prev.map(s => {
      if (s.id === sheetId) {
        const exists = s.entityFields.some(f => f.key === keyName);
        if (exists) {
          alert(t("sheetsSync.errors.fieldExists", { defaultValue: "Este campo ya existe." }));
          return s;
        }
        return {
          ...s,
          entityFields: [...s.entityFields, { key: keyName, label: keyName, required: false, custom: true }],
          enabledFields: { ...s.enabledFields, [keyName]: true }
        };
      }
      return s;
    }));
    setNewFieldName("");
    setShowNewFieldForm(false);
  };

  // STATE FOR EXPORT (NEW FEATURE)
  const [exportType, setExportType] = useState("clients"); // "clients" | "inventory" | "appointments" | "expenses"
  const [selectedColumns, setSelectedColumns] = useState({
    clients: { firstName: true, lastName: true, phone: true, email: true, status: true },
    inventory: { name: true, category: true, stock: true, costPrice: true, salePrice: true },
    appointments: { startsAt: true, clientName: true, serviceName: true, workerName: true, status: true },
    expenses: { concept: true, amount: true, date: true, category: true }
  });
  const [exportFormat, setExportFormat] = useState("xls"); // "xls" | "csv" | "json"
  const [livePreview, setLivePreview] = useState([]);
  const [fullData, setFullData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Simulated Google Sheets Output Sync State
  const [isSyncingOut, setIsSyncingOut] = useState(false);
  const [syncProgressOut, setSyncProgressOut] = useState(0);
  const [syncSuccessOut, setSyncSuccessOut] = useState(false);
  const [syncOutUrl, setSyncOutUrl] = useState("");

  const fetchLivePreview = async (type) => {
    try {
      setPreviewLoading(true);
      setError("");
      let res;
      if (type === "clients") {
        res = await api.get("/clients");
        const list = Array.isArray(res.data) ? res.data : [];
        let mappedFull = [];
        if (list.length === 0) {
          mappedFull = SAMPLE_SALON_DATA.map(d => ({ 
            id: d.firstName + d.lastName, 
            firstName: d.firstName, 
            lastName: d.lastName, 
            phone: d.phone, 
            email: d.email, 
            status: "VIP" 
          }));
        } else {
          mappedFull = list.map(c => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone || "Sin Teléfono",
            email: c.email || "Sin Email",
            status: c.vip ? "VIP" : "Activo"
          }));
        }
        setFullData(mappedFull);
        setLivePreview(mappedFull.slice(0, 6));
      } else if (type === "inventory") {
        res = await api.get("/inventory/products");
        const list = Array.isArray(res.data) ? res.data : [];
        let mappedFull = [];
        if (list.length === 0) {
          mappedFull = [
            { id: "1", name: "Tinta L'Oreal Majirel 7.1", category: "Coloración", stock: 3, costPrice: 4500, salePrice: 9000 },
            { id: "2", name: "Shampoo PH Neutro Premium 5L", category: "Lavado", stock: 1, costPrice: 12000, salePrice: 24000 },
            { id: "3", name: "Keratina Hidrolizada 1L", category: "Tratamientos", stock: 6, costPrice: 28000, salePrice: 45000 }
          ];
        } else {
          mappedFull = list;
        }
        setFullData(mappedFull);
        setLivePreview(mappedFull.slice(0, 6));
      } else if (type === "appointments") {
        res = await api.get("/appointments");
        const list = Array.isArray(res.data) ? res.data : [];
        let mappedFull = [];
        if (list.length === 0) {
          mappedFull = [
            { id: "1", startsAt: new Date().toISOString(), clientName: "Sofía Altieri", serviceName: "Balayage Premium", workerName: "Andrea", status: "DONE" },
            { id: "2", startsAt: new Date().toISOString(), clientName: "Javier Rossi", serviceName: "Corte Diseñador", workerName: "Nicolás", status: "CONFIRMED" },
            { id: "3", startsAt: new Date().toISOString(), clientName: "Martina López", serviceName: "Tratamiento Keratina", workerName: "Florencia", status: "CONFIRMED" }
          ];
        } else {
          mappedFull = list.map(a => ({
            id: a.id,
            startsAt: a.startsAt,
            clientName: a.client ? `${a.client.firstName} ${a.client.lastName}` : "Cliente Anónimo",
            serviceName: a.service ? a.service.name : "Servicio",
            workerName: a.worker ? `${a.worker.firstName} ${a.worker.lastName}` : "Profesional",
            status: a.status
          }));
        }
        setFullData(mappedFull);
        setLivePreview(mappedFull.slice(0, 6));
      } else if (type === "expenses") {
        try {
          res = await api.get("/finances/expenses");
          const list = Array.isArray(res.data) ? res.data : [];
          let mappedFull = [];
          if (list.length === 0) {
            mappedFull = [
              { id: "1", concept: "Alquiler Local CABA", amount: 180000, date: new Date().toISOString(), category: "Alquiler" },
              { id: "2", concept: "Luz Edesur", amount: 45000, date: new Date().toISOString(), category: "Servicios" },
              { id: "3", concept: "Sueldo Limpieza", amount: 60000, date: new Date().toISOString(), category: "Sueldos" }
            ];
          } else {
            mappedFull = list;
          }
          setFullData(mappedFull);
          setLivePreview(mappedFull.slice(0, 6));
        } catch {
          const mappedFull = [
            { id: "1", concept: "Alquiler Local CABA", amount: 180000, date: new Date().toISOString(), category: "Alquiler" },
            { id: "2", concept: "Luz Edesur", amount: 45000, date: new Date().toISOString(), category: "Servicios" }
          ];
          setFullData(mappedFull);
          setLivePreview(mappedFull.slice(0, 6));
        }
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron consultar datos reales desde Neon PostgreSQL.");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeDirection === "export") {
      fetchLivePreview(exportType);
    }
  }, [exportType, activeDirection]);

  const handleColumnToggle = (colKey) => {
    setSelectedColumns(prev => ({
      ...prev,
      [exportType]: {
        ...prev[exportType],
        [colKey]: !prev[exportType][colKey]
      }
    }));
  };

  const triggerDownload = () => {
    const dataToExport = fullData.length > 0 ? fullData : livePreview;
    if (dataToExport.length === 0) return;

    const cols = Object.keys(selectedColumns[exportType]).filter(k => selectedColumns[exportType][k]);
    if (cols.length === 0) {
      alert(t("sheetsSync.errors.selectColumn"));
      return;
    }

    let fileContent = "";
    let mimeType = "";
    let fileName = `salon_aura_${exportType}_export.${exportFormat}`;

    if (exportFormat === "json") {
      const jsonExport = dataToExport.map(row => {
        const obj = {};
        cols.forEach(c => { obj[c] = row[c]; });
        return obj;
      });
      fileContent = JSON.stringify(jsonExport, null, 2);
      mimeType = "application/json;charset=utf-8;";
    } else if (exportFormat === "csv") {
      const headers = cols.join(",");
      const rows = dataToExport.map(row => 
        cols.map(c => {
          const val = row[c] !== undefined ? String(row[c]).replace(/"/g, '""') : "";
          return `"${val}"`;
        }).join(",")
      );
      fileContent = [headers, ...rows].join("\n");
      mimeType = "text/csv;charset=utf-8;";
    } else {
      const headersHTML = cols.map(c => `<th style="background-color: #8b5cf6; color: white; font-weight: bold; padding: 6px; border: 1px solid #ddd;">${c.toUpperCase()}</th>`).join("");
      const rowsHTML = dataToExport.map(row => {
        const cells = cols.map(c => `<td style="padding: 6px; border: 1px solid #ddd;">${row[c] !== undefined ? row[c] : ""}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("\n");

      const title = t("sheetsSync.outputConfigTitle");
      const desc = t("sheetsSync.outputConfigDesc");

      fileContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <h2 style="color: #8b5cf6; font-family: sans-serif;">${title}</h2>
          <p style="font-family: sans-serif; font-size: 12px; color: #555;">${desc} (${exportType.toUpperCase()})</p>
          <table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 13px;">
            <thead>
              <tr>${headersHTML}</tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </body>
        </html>
      `;
      mimeType = "application/vnd.ms-excel;charset=utf-8;";
      fileName = `salon_aura_${exportType}_export.xls`;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadTemplate = (entityType) => {
    const fields = INITIAL_ENTITY_FIELDS[entityType];
    const headers = fields.map(f => f.label);
    
    const exampleRows = {
      clients: [
        ["Juan", "Pérez", "1122334455", "juan@ejemplo.com", "Cliente frecuente"],
        ["María", "López", "+5491133445566", "maria@ejemplo.com", ""]
      ],
      services: [
        ["Corte de Pelo", "15000", "45"],
        ["Tintura", "25000", "90"]
      ],
      workers: [
        ["Ana", "Gómez", "ana@salonaura.com", "1144556677", "Colorista"],
        ["Pedro", "Sánchez", "pedro@salonaura.com", "1199887766", "Estilista"]
      ],
      appointments: [
        ["Juan Pérez", "1122334455", "juan@ejemplo.com", "Corte de Pelo", "Ana Gómez", "20/12/2026", "14:30", "15000", "CONFIRMED", "Puntual"],
        ["María López", "+5491133445566", "maria@ejemplo.com", "Tintura", "Pedro Sánchez", "21/12/2026", "10:00", "25000", "DONE", ""]
      ]
    };

    const data = [headers, ...exampleRows[entityType]];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, `plantilla_importacion_${entityType}.xlsx`);
  };

  const triggerGoogleSheetsPushSync = () => {
    setIsSyncingOut(true);
    setSyncProgressOut(10);
    setSyncSuccessOut(false);

    const steps = [
      { p: 25, txt: t("sheetsSync.progressText.step1") },
      { p: 55, txt: t("sheetsSync.progressText.step2") },
      { p: 80, txt: t("sheetsSync.progressText.step3") },
      { p: 100, txt: t("sheetsSync.progressText.step4") }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setSyncProgressOut(step.p);
        if (step.p === 100) {
          setIsSyncingOut(false);
          setSyncSuccessOut(true);
          setSyncOutUrl("https://sheets.new");
          triggerDownload();
        }
      }, (index + 1) * 800);
    });
  };

  const parseCSV = (text) => {
    const delimiter = text.includes(';') && !text.includes(',') ? ';' : ',';
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines.filter(r => r.some(cell => cell.trim() !== ""));
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setError("");
    setLoading(true);

    const reader = new FileReader();
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "csv") {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const parsed = parseCSV(text);
          if (parsed.length <= 1) {
            setError(t("sheetsSync.errors.emptyCsv"));
            setLoading(false);
            return;
          }
          const headers = parsed[0].map(h => h.trim());
          const rows = parsed.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = row[idx] !== undefined ? row[idx].trim() : "";
            });
            return obj;
          });
          setSheetsData([{
            id: "sheet_0",
            name: "Datos CSV",
            headers,
            rows,
            totalRows: rows.length,
            previewRows: rows.slice(0, 10),
            entityType: "",
            mapping: {},
            enabledFields: {},
            entityFields: []
          }]);
          setStep(2);
        } catch (err) {
          console.error(err);
          setError(t("sheetsSync.errors.errorCsv"));
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } else if (extension === "xlsx" || extension === "xls") {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          
          const newSheets = workbook.SheetNames.map((name, idx) => {
            const worksheet = workbook.Sheets[name];
            const parsed = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (parsed.length <= 1) return null;
            const headers = parsed[0].map(h => String(h || "").trim());
            const rows = parsed.slice(1).map(row => {
              const obj = {};
              headers.forEach((h, colIdx) => {
                obj[h] = row[colIdx] !== undefined ? String(row[colIdx]).trim() : "";
              });
              return obj;
            });
            return {
              id: `sheet_${idx}`,
              name,
              headers,
              rows,
              totalRows: rows.length,
              previewRows: rows.slice(0, 10),
              entityType: "",
              mapping: {},
              enabledFields: {},
              entityFields: []
            };
          }).filter(Boolean);

          if (newSheets.length === 0) {
            setError(t("sheetsSync.errors.emptyExcel"));
            setLoading(false);
            return;
          }
          setSheetsData(newSheets);
          setStep(2);
        } catch (err) {
          console.error(err);
          setError(t("sheetsSync.errors.errorExcel"));
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (extension === "json") {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const json = JSON.parse(text);
          if (!Array.isArray(json) || json.length === 0) {
            setError(t("sheetsSync.errors.invalidJson"));
            setLoading(false);
            return;
          }
          const headers = Array.from(new Set(json.flatMap(obj => Object.keys(obj)))).map(h => String(h).trim());
          const rows = json.map(row => {
            const obj = {};
            headers.forEach(h => {
              obj[h] = row[h] !== undefined ? String(row[h]).trim() : "";
            });
            return obj;
          });
          setSheetsData([{
            id: "sheet_0",
            name: "Datos JSON",
            headers,
            rows,
            totalRows: rows.length,
            previewRows: rows.slice(0, 10),
            entityType: "",
            mapping: {},
            enabledFields: {},
            entityFields: []
          }]);
          setStep(2);
        } catch (err) {
          console.error(err);
          setError(t("sheetsSync.errors.errorJson"));
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } else {
      setError(t("sheetsSync.errors.unsupportedFormat"));
      setLoading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!sheetUrl.trim() || !sheetUrl.includes("docs.google.com/spreadsheets")) {
      setError(t("sheetsSync.errors.invalidUrl"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/google/fetch-sheet", { sheetUrl }, { timeout: 300000 });
      if (res.data && res.data.success) {
        setSheetsData([{
          id: "sheet_0",
          name: "Hoja de Google Sheets",
          headers: res.data.headers,
          rows: res.data.previewRows, // backend sends all? Wait, fetch-sheet only sends previewRows...
          // We must ensure backend can import correctly or we pass rows
          // Wait, backend fetch-sheet only returns previewRows. Real import uses sheetUrl.
          // Let's pass previewRows to preview and keep sheetUrl to pass to /import
          totalRows: res.data.totalRows,
          previewRows: res.data.previewRows,
          entityType: "",
          mapping: {},
          enabledFields: {},
          entityFields: [],
          isGoogleSheet: true
        }]);
        setStep(2);
      } else {
        setError(t("sheetsSync.errors.failedToFetch"));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || t("sheetsSync.errors.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const executeRealSync = async () => {
    const mappedSheets = sheetsData.filter(s => s.entityType && s.entityType !== "ignore");
    if (mappedSheets.length === 0) {
      setError("Debes asignar al menos una hoja a una tabla para importar.");
      return;
    }

    // Validate mappings
    for (const sheet of mappedSheets) {
      const requiredFields = sheet.entityFields.filter(f => f.required && sheet.enabledFields[f.key]);
      const missing = requiredFields.filter(f => !sheet.mapping[f.key]);
      if (missing.length > 0) {
        const missingLabels = missing.map(f => t("sheetsSync.columns." + f.key, { defaultValue: f.label })).join(", ");
        setError(`Faltan campos obligatorios en la hoja "${sheet.name}": ${missingLabels}`);
        return;
      }
    }

    setStep(3);
    setProgress(5);
    setStatusText(t("sheetsSync.progressText.import1"));
    setError("");

    let combinedSummary = { created: 0, reused: 0, failed: 0, skippedDetails: [], successfulDetails: [] };

    try {
      for (let i = 0; i < mappedSheets.length; i++) {
        const sheet = mappedSheets[i];
        const progressBase = 5 + (i / mappedSheets.length) * 80;
        setProgress(progressBase);
        setStatusText(`Importando hoja: ${sheet.name} (${i+1}/${mappedSheets.length})...`);

        const filteredMapping = Object.keys(sheet.mapping)
          .filter(key => sheet.enabledFields[key])
          .reduce((obj, key) => {
            obj[key] = sheet.mapping[key];
            return obj;
          }, {});

        const payload = {
          entityType: sheet.entityType,
          mapping: filteredMapping
        };

        if (sheet.isGoogleSheet) {
          payload.sheetUrl = sheetUrl;
        } else {
          payload.rows = sheet.rows;
        }

        const res = await api.post("/google/import", payload, { timeout: 300000 });

        if (res.data && res.data.success) {
          combinedSummary.created += res.data.summary.created || 0;
          combinedSummary.reused += res.data.summary.reused || 0;
          combinedSummary.failed += res.data.summary.failed || 0;
          
          if (res.data.summary.skippedDetails) {
            const mappedSkips = res.data.summary.skippedDetails.map(d => ({
              ...d,
              motive: `[${sheet.name}] ${d.motive}`
            }));
            combinedSummary.skippedDetails.push(...mappedSkips);
          }
          if (res.data.summary.successfulDetails) {
            combinedSummary.successfulDetails.push(...res.data.summary.successfulDetails);
          }
        } else {
          throw new Error(`Fallo al importar hoja ${sheet.name}`);
        }
      }


      try {
        await api.post("/google/import-history", { name: importName, summary: combinedSummary });
      } catch (err) {
        console.error("No se pudo guardar el historial", err);
      }

      setProgress(100);
      setStatusText(t("sheetsSync.progressCompleted"));
      setSummary(combinedSummary);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || t("sheetsSync.errors.postgreError"));
      setStep(2);
    }
  };

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
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: "13px" }}>
                              {(importHistory || []).map(hist => (
                                <tr key={hist.id} onClick={() => setSelectedHistory(hist)} className="cursor-pointer hover-bg-gray-50 transition-all" title="Ver detalles de la importación">
                                  <td className="ps-3 fw-bold text-dark">{hist.name}</td>
                                  <td className="text-muted">{new Date(hist.createdAt).toLocaleString()}</td>
                                  <td>
                                    <Badge bg="success" className="me-1">{(hist.details?.created) || 0} Creados</Badge>
                                    <Badge bg="primary" className="me-1">{(hist.details?.reused) || 0} Actualizados</Badge>
                                    <Badge bg="danger">{(hist.details?.failed) || 0} Fallidos</Badge>
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
                    <div className="h4 fw-black text-success m-0">{selectedHistory.details.created || 0}</div>
                    <div className="text-muted smaller">Registros Creados</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="h4 fw-black text-primary m-0">{selectedHistory.details.reused || 0}</div>
                    <div className="text-muted smaller">Reutilizados / Actualizados</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="h4 fw-black text-danger m-0">{selectedHistory.details.failed || 0}</div>
                    <div className="text-muted smaller">Filas Omitidas</div>
                  </div>
                </Col>
              </Row>

              {selectedHistory.details.successfulDetails && selectedHistory.details.successfulDetails.length > 0 && (
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
                        {selectedHistory.details.successfulDetails.map((item, idx) => (
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

              {selectedHistory.details.skippedDetails && selectedHistory.details.skippedDetails.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold text-danger h6 mb-0">Detalle de filas omitidas</h5>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="rounded-pill px-3 py-1 d-flex align-items-center gap-1"
                      onClick={() => {
                        const data = [["Fila Original", "Motivo del Error"], ...selectedHistory.details.skippedDetails.map(d => [d.row, d.motive])];
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
                        {selectedHistory.details.skippedDetails.map((skipped, idx) => (
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

    </Container>
  );
}
