import React, { useState } from "react";
import { Container, Nav, Tab } from "react-bootstrap";
import FieldRegistryEditor from "../components/configurable-fields/FieldRegistryEditor.jsx";
import ComponentAssignmentEditor from "../components/configurable-fields/ComponentAssignmentEditor.jsx";
import ActiveModulesEditor from "../components/configurable-fields/ActiveModulesEditor.jsx";
import BookingSettings from "../components/configurable-fields/BookingSettings.jsx";

export default function SettingsView() {
  const [tab, setTab] = useState("assign");

  return (
    <Container fluid className="p-0">
      <header className="mb-4">
        <h1 className="fw-bold h3">Configuración</h1>
        <p className="text-muted mb-0">
          Catálogo de campos, asignación a cada pantalla de la app, reglas de workflows y módulos activos.
        </p>
      </header>

      <Tab.Container activeKey={tab} onSelect={(k) => k && setTab(k)}>
        <Nav variant="tabs" className="mb-4 border-0 gap-2">
          <Nav.Item>
            <Nav.Link eventKey="registry" className="rounded-pill px-4">
              Catálogo de campos
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="assign" className="rounded-pill px-4">
              Asignar a componentes
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="modules" className="rounded-pill px-4">
              Módulos activos
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="booking" className="rounded-pill px-4">
              Reservas Online
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="registry">
            <FieldRegistryEditor />
          </Tab.Pane>
          <Tab.Pane eventKey="assign">
            <ComponentAssignmentEditor />
          </Tab.Pane>
          <Tab.Pane eventKey="modules">
            <ActiveModulesEditor />
          </Tab.Pane>
          <Tab.Pane eventKey="booking">
            <BookingSettings />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <div className="mt-4 p-4 rounded-3 bg-light border">
        <h3 className="h6 fw-bold">Workflows con transiciones y pantallas</h3>
        <p className="text-muted small mb-2">
          En <strong>Workflows</strong> podés definir transiciones entre pasos y pantallas intermedias
          (formularios que el usuario o el cliente completa durante el flujo). Las pantallas usan los
          campos del catálogo con entidad <code>workflow</code>.
        </p>
        <p className="text-muted small mb-0">
          Configurá primero los campos en la pestaña &quot;Catálogo&quot; y asignalos en
          &quot;Workflow — pantallas&quot; si querés personalizar qué se muestra en cada paso.
        </p>
      </div>
    </Container>
  );
}
