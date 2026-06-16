const fs = require('fs');

let content = fs.readFileSync('dashboard-react/src/views/GoogleSheetsSyncView.jsx', 'utf8');

// The replacement code is very long. Let's do this safely.
const stateStart = content.indexOf('  // STATE FOR IMPORT');
const returnStart = content.indexOf('  return (');

const newStateAndLogic = `  // STATE FOR IMPORT
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
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);

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
            clientName: a.client ? \`\${a.client.firstName} \${a.client.lastName}\` : "Cliente Anónimo",
            serviceName: a.service ? a.service.name : "Servicio",
            workerName: a.worker ? \`\${a.worker.firstName} \${a.worker.lastName}\` : "Profesional",
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
    let fileName = \`salon_aura_\${exportType}_export.\${exportFormat}\`;

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
          return \`"\${val}"\`;
        }).join(",")
      );
      fileContent = [headers, ...rows].join("\\n");
      mimeType = "text/csv;charset=utf-8;";
    } else {
      const headersHTML = cols.map(c => \`<th style="background-color: #8b5cf6; color: white; font-weight: bold; padding: 6px; border: 1px solid #ddd;">\${c.toUpperCase()}</th>\`).join("");
      const rowsHTML = dataToExport.map(row => {
        const cells = cols.map(c => \`<td style="padding: 6px; border: 1px solid #ddd;">\${row[c] !== undefined ? row[c] : ""}</td>\`).join("");
        return \`<tr>\${cells}</tr>\`;
      }).join("\\n");

      const title = t("sheetsSync.outputConfigTitle");
      const desc = t("sheetsSync.outputConfigDesc");

      fileContent = \`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <h2 style="color: #8b5cf6; font-family: sans-serif;">\${title}</h2>
          <p style="font-family: sans-serif; font-size: 12px; color: #555;">\${desc} (\${exportType.toUpperCase()})</p>
          <table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 13px;">
            <thead>
              <tr>\${headersHTML}</tr>
            </thead>
            <tbody>
              \${rowsHTML}
            </tbody>
          </table>
        </body>
        </html>
      \`;
      mimeType = "application/vnd.ms-excel;charset=utf-8;";
      fileName = \`salon_aura_\${exportType}_export.xls\`;
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
    XLSX.writeFile(wb, \`plantilla_importacion_\${entityType}.xlsx\`);
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
      } else if ((char === '\\r' || char === '\\n') && !inQuotes) {
        if (char === '\\r' && nextChar === '\\n') {
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
              id: \`sheet_\${idx}\`,
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
      const res = await api.post("/google/fetch-sheet", { sheetUrl });
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
        setError(\`Faltan campos obligatorios en la hoja "\${sheet.name}": \${missingLabels}\`);
        return;
      }
    }

    setStep(3);
    setProgress(5);
    setStatusText(t("sheetsSync.progressText.import1"));
    setError("");

    let combinedSummary = { created: 0, reused: 0, failed: 0, skippedDetails: [] };

    try {
      for (let i = 0; i < mappedSheets.length; i++) {
        const sheet = mappedSheets[i];
        const progressBase = 5 + (i / mappedSheets.length) * 80;
        setProgress(progressBase);
        setStatusText(\`Importando hoja: \${sheet.name} (\${i+1}/\${mappedSheets.length})...\`);

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

        const res = await api.post("/google/import", payload);

        if (res.data && res.data.success) {
          combinedSummary.created += res.data.summary.created || 0;
          combinedSummary.reused += res.data.summary.reused || 0;
          combinedSummary.failed += res.data.summary.failed || 0;
          
          if (res.data.summary.skippedDetails) {
            const mappedSkips = res.data.summary.skippedDetails.map(d => ({
              ...d,
              motive: \`[\${sheet.name}] \${d.motive}\`
            }));
            combinedSummary.skippedDetails.push(...mappedSkips);
          }
        } else {
          throw new Error(\`Fallo al importar hoja \${sheet.name}\`);
        }
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

`;

content = content.substring(0, stateStart) + newStateAndLogic + content.substring(returnStart);

// Now we need to replace Step 1, Step 2, Step 3, Step 4 JSX.
const jsxStart = content.indexOf('{activeDirection === "import" && (');
const exportStart = content.indexOf('{/* ==================== TAB 2: EXPORTAR Y DESCARGAR (SALIDA) ==================== */}');

// The new JSX for the import section:
const newJSX = `{activeDirection === "import" && (
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
                          className={\`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all \${
                            importMethod === "google" ? "bg-purple-600 text-white shadow btn-purple" : "bg-light text-muted hover-bg-gray-100"
                          }\`}
                          style={{ fontSize: "12.5px" }}
                        >
                          <Link2 size={15} />
                          <span>{t("sheetsSync.googleTab", { defaultValue: "Google Sheets Link" })}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setImportMethod("file"); setError(""); }}
                          className={\`d-flex align-items-center gap-2 px-4 py-2.5 fw-bold rounded-xl border-0 transition-all \${
                            importMethod === "file" ? "bg-purple-600 text-white shadow btn-purple" : "bg-light text-muted hover-bg-gray-100"
                          }\`}
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
                        <Button variant="success" onClick={executeRealSync} disabled={sheetsData.filter(s => s.entityType && s.entityType !== "ignore").length === 0} className="rounded-pill px-4 btn-sm btn-premium bg-success border-success text-white fw-bold shadow">
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
                                        className={\`d-flex align-items-center gap-2 px-3 py-2 rounded-xl border transition-all \${
                                          isChecked 
                                            ? "bg-purple-500 bg-opacity-10 border-purple-300 text-purple-900" 
                                            : "bg-white border-gray-200 text-muted"
                                        }\`}
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
                                            {sheet.mapping[f.key] ? \`Col: \${sheet.mapping[f.key]}\` : "(Sin mapear)"}
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
                                              {f.key === "price" && cellVal ? \`$\${Number(cellVal).toLocaleString()}\` : cellVal || "-"}
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
                              XLSX.writeFile(wb, \`errores_importacion.xlsx\`);
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
        )}`;

content = content.substring(0, jsxStart) + newJSX + "\n\n        " + content.substring(exportStart);

fs.writeFileSync('scratch/GoogleSheetsSyncView_new.jsx', content);
