const fs = require('fs');

let content = fs.readFileSync('dashboard-react/src/views/GoogleSheetsSyncView.jsx', 'utf8');

// 1. Add import History from lucide-react
content = content.replace('Settings } from "lucide-react";', 'Settings, History } from "lucide-react";');

// 2. Add State variables
const stateStart = content.indexOf('  const [showConfirmModal, setShowConfirmModal] = useState(false);');
content = content.substring(0, stateStart) + '  const [importHistory, setImportHistory] = useState([]);\n  const [importName, setImportName] = useState("");\n' + content.substring(stateStart);

// 3. Add useEffect to fetch history
const fetchHistoryLogic = `
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/google/import-history");
        setImportHistory(res.data);
      } catch (e) {
        console.error("Error fetching history:", e);
      }
    };
    fetchHistory();
  }, [step]); // Refetch when step changes (e.g. going back to step 1)
`;
const useEffectTarget = '  const getInitialEnabledFields = (type) => ({';
content = content.replace(useEffectTarget, fetchHistoryLogic + '\n' + useEffectTarget);

// 4. Update executeRealSync to post history
const postHistoryLogic = `
      try {
        await api.post("/google/import-history", { name: importName, summary: combinedSummary });
      } catch (err) {
        console.error("No se pudo guardar el historial", err);
      }

      setProgress(100);`;
content = content.replace('      setProgress(100);', postHistoryLogic);

// 5. Add Input to Modal
const modalTarget = '<p className="text-muted small mb-4">';
const modalInput = `
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
          <p className="text-muted small mb-4">`;
content = content.replace(modalTarget, modalInput);

// Disable confirm button if no name
const btnConfirmTarget = '<Button \n            variant="success" \n            onClick={() => {\n              setShowConfirmModal(false);\n              executeRealSync();\n            }}';
const btnConfirmReplace = '<Button \n            variant="success" \n            disabled={!importName.trim()}\n            onClick={() => {\n              setShowConfirmModal(false);\n              executeRealSync();\n            }}';
content = content.replace(btnConfirmTarget, btnConfirmReplace);

// 6. Add History View in Step 1
const historyCard = `
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
                              {importHistory.map(hist => (
                                <tr key={hist.id}>
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

            {step === 2 && (`;
content = content.replace('              </>\n            )}\n\n            {step === 2 && (', historyCard);

fs.writeFileSync('dashboard-react/src/views/GoogleSheetsSyncView.jsx', content);
