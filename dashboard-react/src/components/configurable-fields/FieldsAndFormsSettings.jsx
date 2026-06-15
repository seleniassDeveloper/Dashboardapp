import React, { useState } from "react";
import { Nav, Card } from "react-bootstrap";
import { Database, LayoutTemplate } from "lucide-react";
import FieldRegistryEditor from "./FieldRegistryEditor.jsx";
import ComponentAssignmentEditor from "./ComponentAssignmentEditor.jsx";

export default function FieldsAndFormsSettings() {
  const [activeStep, setActiveStep] = useState("registry");

  return (
    <div className="d-flex flex-column gap-4">
      {/* Step Navigation */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <Card.Body className="p-2">
          <Nav variant="pills" className="d-flex flex-row p-1 bg-light rounded-3" style={{ gap: "4px" }}>
            <Nav.Item className="flex-grow-1">
              <Nav.Link
                eventKey="registry"
                active={activeStep === "registry"}
                onClick={() => setActiveStep("registry")}
                className={`w-100 text-center py-3 fw-bold rounded-3 transition-all d-flex align-items-center justify-content-center gap-2 ${
                  activeStep === "registry" ? "bg-white shadow-sm text-purple-700" : "text-gray-600 hover-bg-white"
                }`}
              >
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${activeStep === "registry" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-500"}`} style={{ width: 24, height: 24, fontSize: 12 }}>1</div>
                <Database size={18} />
                <span>Catálogo de Campos (Crear)</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="flex-grow-1">
              <Nav.Link
                eventKey="assign"
                active={activeStep === "assign"}
                onClick={() => setActiveStep("assign")}
                className={`w-100 text-center py-3 fw-bold rounded-3 transition-all d-flex align-items-center justify-content-center gap-2 ${
                  activeStep === "assign" ? "bg-white shadow-sm text-purple-700" : "text-gray-600 hover-bg-white"
                }`}
              >
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${activeStep === "assign" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-500"}`} style={{ width: 24, height: 24, fontSize: 12 }}>2</div>
                <LayoutTemplate size={18} />
                <span>Asignar a Formularios (Canvas)</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* Content Render */}
      <div className="animate-fade-in">
        {activeStep === "registry" ? <FieldRegistryEditor /> : <ComponentAssignmentEditor />}
      </div>
    </div>
  );
}
