const fs = require('fs');

let content = fs.readFileSync('dashboard-react/src/views/GoogleSheetsSyncView.jsx', 'utf8');

// 1. Add state variable
const stateStart = content.indexOf('  const [showNewFieldForm, setShowNewFieldForm] = useState(false);');
content = content.substring(0, stateStart) + '  const [showConfirmModal, setShowConfirmModal] = useState(false);\n' + content.substring(stateStart);

// 2. Change the button onClick
// Find: <Button variant="success" onClick={executeRealSync} disabled={sheetsData.filter(s => s.entityType && s.entityType !== "ignore").length === 0}
const btnTarget = '<Button variant="success" onClick={executeRealSync} disabled={sheetsData.filter(s => s.entityType && s.entityType !== "ignore").length === 0}';
const btnReplace = '<Button variant="success" onClick={() => setShowConfirmModal(true)} disabled={sheetsData.filter(s => s.entityType && s.entityType !== "ignore").length === 0}';
content = content.replace(btnTarget, btnReplace);

// 3. Import Modal from react-bootstrap
const importReactBootstrap = 'import { Container, Row, Col, Card, Form, Button, Table, ProgressBar, Alert, Badge, Modal } from "react-bootstrap";';
content = content.replace(/import \{ Container, Row, Col, Card, Form, Button, Table, ProgressBar, Alert, Badge \} from "react-bootstrap";/, importReactBootstrap);

// 4. Add the Modal JSX right before the final </Container>
const modalJSX = `
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-black d-flex align-items-center gap-2">
            <CheckCircle2 className="text-primary" /> Confirmar Importación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
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
`;

const containerEnd = content.lastIndexOf('    </Container>');
content = content.substring(0, containerEnd) + modalJSX + content.substring(containerEnd);

fs.writeFileSync('dashboard-react/src/views/GoogleSheetsSyncView.jsx', content);
