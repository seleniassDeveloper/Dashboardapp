import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api.js";
import * as XLSX from "xlsx";

export const INITIAL_ENTITY_FIELDS = {
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
  ],
  expenses: [
    { key: "name", label: "Concepto / Descripción", required: true },
    { key: "amount", label: "Monto / Importe", required: true },
    { key: "category", label: "Categoría", required: false },
    { key: "date", label: "Fecha del Pago", required: false }
  ]
};

export const SAMPLE_SALON_DATA = [
  { firstName: "Sofía", lastName: "Altieri", phone: "1154329876", email: "sofia.altieri@gmail.com", service: "Balayage Premium", price: 30000, duration: 180, worker: "Andrea", notes: "Prefiere café con leche de almendras." },
  { firstName: "Javier", lastName: "Rossi", phone: "1198765432", email: "javier.rossi@yahoo.com.ar", service: "Corte Diseñador", price: 15000, duration: 45, worker: "Nicolás", notes: "Corte degradé bajo en los costados." },
  { firstName: "Martina", lastName: "López", phone: "1134215678", email: "martina.lopez@outlook.com", service: "Tratamiento Keratina", price: 25000, duration: 120, worker: "Florencia", notes: "Cabello con decoloración previa." },
  { firstName: "Bautista", lastName: "Sosa", phone: "1123456789", email: "bautista.sosa@gmail.com", service: "Manicuría Rusa", price: 12000, duration: 60, worker: "Andrea", notes: "Esmaltado semipermanente negro mate." },
  { firstName: "Delfina", lastName: "Fernández", phone: "1165437890", email: "delfina.f@hotmail.com", service: "Perfilado de Cejas", price: 6000, duration: 30, worker: "Florencia", notes: "Piel sensible a la cera caliente." },
  { firstName: "Valentino", lastName: "Gómez", phone: "1176543210", email: "valentino.g@gmail.com", service: "Coloración Total", price: 22000, duration: 90, worker: "Nicolás", notes: "Tinta orgánica libre de amoníaco." }
];

export function useSheetsSync() {
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
  const [sheetsData, setSheetsData] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState(null); // Which sheet's column mapping is currently open
  const [newFieldName, setNewFieldName] = useState("");
  const [importHistory, setImportHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [importName, setImportName] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [deactivateModalData, setDeactivateModalData] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

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

  useEffect(() => {
    fetchHistory();
  }, [step]); // Refetch when step changes (e.g. going back to step 1)

  const getInitialEnabledFields = (type) => ({
    clients: { firstName: true, lastName: true, phone: true, email: true, notes: true },
    services: { name: true, price: true, duration: true },
    workers: { firstName: true, lastName: true, email: true, phone: true, roleTitle: true },
    appointments: { clientName: true, phone: true, email: true, serviceName: true, workerName: true, startsAt: true, time: true, price: true, status: true, notes: true },
    expenses: { name: true, amount: true, category: true, date: true }
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
      } else if (lowerKey === "price" || lowerKey === "amount") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("precio") || l.includes("importe") || l.includes("monto") || l.includes("cost") || l.includes("total") || l.includes("pago") || l.includes("cobrado");
        });
      } else if (lowerKey === "category") {
        match = headers.find(h => {
          const l = h.toLowerCase();
          return l.includes("categoria") || l.includes("rubro") || l.includes("tipo");
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

  // STATE FOR EXPORT
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
            name: file.name || "Datos CSV",
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
            name: file.name || "Datos JSON",
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
    if (e && e.preventDefault) e.preventDefault();
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
          rows: res.data.previewRows,
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
          if (res.data.createdIds) {
            combinedSummary.createdIds = combinedSummary.createdIds || {};
            for (const key of Object.keys(res.data.createdIds)) {
              if (!combinedSummary.createdIds[key]) combinedSummary.createdIds[key] = [];
              combinedSummary.createdIds[key].push(...res.data.createdIds[key]);
            }
          }
        } else {
          throw new Error(`Fallo al importar hoja ${sheet.name}`);
        }
      }

      try {
        const historyPayload = { name: importName || "Importación rápida", summary: combinedSummary, createdIds: combinedSummary.createdIds || {} };
        await api.post("/google/import-history", historyPayload);
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

  return {
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
  };
}
