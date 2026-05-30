import React, { useState } from "react";
import { Container, Nav, Tab } from "react-bootstrap";
import { Trans, useTranslation } from "react-i18next";
import FieldRegistryEditor from "../components/configurable-fields/FieldRegistryEditor.jsx";
import ComponentAssignmentEditor from "../components/configurable-fields/ComponentAssignmentEditor.jsx";
import ActiveModulesEditor from "../components/configurable-fields/ActiveModulesEditor.jsx";
import BookingSettings from "../components/configurable-fields/BookingSettings.jsx";
import UsersPermissionsSettings from "../components/configurable-fields/UsersPermissionsSettings.jsx";
import { usePermissions } from "../auth/PermissionProvider.jsx";

export default function SettingsView() {
  const { t } = useTranslation("views");
  const { hasPermission } = usePermissions();

  const canManageSettings = hasPermission("manage_settings");
  const canManageUsers = hasPermission("manage_users");

  const [tab, setTab] = useState(() => {
    if (canManageSettings) return "assign";
    if (canManageUsers) return "users";
    return "";
  });

  if (!canManageSettings && !canManageUsers) {
    return (
      <Container className="py-5 text-center">
        <h2 className="text-secondary smaller fw-bold mb-0">No tienes permisos para ver las configuraciones.</h2>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <header className="mb-4">
        <h1 className="fw-bold h3">{t("settings.title")}</h1>
        <p className="text-muted mb-0">{t("settings.subtitle")}</p>
      </header>

      <Tab.Container activeKey={tab} onSelect={(k) => k && setTab(k)}>
        <Nav variant="tabs" className="mb-4 border-0 gap-2">
          {canManageSettings && (
            <>
              <Nav.Item>
                <Nav.Link eventKey="registry" className="rounded-pill px-4">
                  {t("settings.tabs.registry")}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="assign" className="rounded-pill px-4">
                  {t("settings.tabs.assign")}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="modules" className="rounded-pill px-4">
                  {t("settings.tabs.modules")}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="booking" className="rounded-pill px-4">
                  {t("settings.tabs.booking")}
                </Nav.Link>
              </Nav.Item>
            </>
          )}
          {canManageUsers && (
            <Nav.Item>
              <Nav.Link eventKey="users" className="rounded-pill px-4">
                Roles y Permisos
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        <Tab.Content>
          {canManageSettings && (
            <>
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
            </>
          )}
          {canManageUsers && (
            <Tab.Pane eventKey="users">
              <UsersPermissionsSettings />
            </Tab.Pane>
          )}
        </Tab.Content>
      </Tab.Container>

      {canManageSettings && (
        <div className="mt-4 p-4 rounded-3 bg-light border">
          <h3 className="h6 fw-bold">{t("settings.workflowHint.title")}</h3>
          <p className="text-muted small mb-2">
            <Trans
              i18nKey="views:settings.workflowHint.p1"
              components={{ strong: <strong />, code: <code /> }}
            />
          </p>
          <p className="text-muted small mb-0">
            {t("settings.workflowHint.p2")}
          </p>
        </div>
      )}
    </Container>
  );
}
