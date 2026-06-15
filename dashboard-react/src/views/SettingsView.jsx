import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Nav, Tab } from "react-bootstrap";
import { Trans, useTranslation } from "react-i18next";
import FieldsAndFormsSettings from "../components/configurable-fields/FieldsAndFormsSettings.jsx";
import ActiveModulesEditor from "../components/configurable-fields/ActiveModulesEditor.jsx";
import BookingSettings from "../components/configurable-fields/BookingSettings.jsx";
import UsersPermissionsSettings from "../components/configurable-fields/UsersPermissionsSettings.jsx";
import BranchSettings from "../components/configurable-fields/BranchSettings.jsx";
import GoogleSyncSettings from "../components/configurable-fields/GoogleSyncSettings.jsx";
import ConsentSettings from "../components/configurable-fields/ConsentSettings.jsx";
import AppointmentStatesSettings from "../components/configurable-fields/AppointmentStatesSettings.jsx";
import { usePermissions } from "../auth/PermissionProvider.jsx";
import SubscriptionSettingsView from "../components/configurable-fields/SubscriptionSettingsView.jsx";

export default function SettingsView() {
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";
  const { hasPermission } = usePermissions();

  const canManageSettings = hasPermission("manage_settings");
  const canManageUsers = hasPermission("manage_users");

  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");

  const [tab, setTabState] = useState(() => {
    if (queryTab) return queryTab;
    if (canManageSettings) return "custom-fields";
    if (canManageUsers) return "users";
    return "";
  });

  const setTab = (newTab) => {
    setTabState(newTab);
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    if (queryTab && queryTab !== tab) {
      setTabState(queryTab);
    }
  }, [queryTab]);

  if (!canManageSettings && !canManageUsers) {
    return (
      <Container className="py-5 text-center">
        <h2 className="text-secondary smaller fw-bold mb-0">{t("settings.noPermission")}</h2>
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
                <Nav.Link eventKey="custom-fields" className="rounded-pill px-4 fw-medium text-nowrap">
                  {isEs ? "Campos y Formularios" : "Fields & Forms"}
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
              <Nav.Item>
                <Nav.Link eventKey="sucursales" className="rounded-pill px-4">
                  {t("settings.tabs.branches")}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="google-sync" className="rounded-pill px-4">
                  Google Calendar
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="consent-templates" className="rounded-pill px-4">
                  {t("settings.tabs.consents", { defaultValue: "Consentimientos" })}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="appointment-states" className="rounded-pill px-4">
                  {isEs ? "Estados de Cita" : "Appointment States"}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="subscription" className="rounded-pill px-4">
                  {isEs ? "Suscripción" : "Subscription"}
                </Nav.Link>
              </Nav.Item>
            </>
          )}
          {canManageUsers && (
            <Nav.Item>
              <Nav.Link eventKey="users" className="rounded-pill px-4">
                {t("settings.tabs.users")}
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        <Tab.Content>
          {canManageSettings && (
            <>
              <Tab.Pane eventKey="custom-fields">
                <FieldsAndFormsSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="modules">
                <ActiveModulesEditor />
              </Tab.Pane>
              <Tab.Pane eventKey="booking">
                <BookingSettings onNavigateToGoogleSync={() => setTab("google-sync")} />
              </Tab.Pane>
              <Tab.Pane eventKey="sucursales">
                <BranchSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="google-sync">
                <GoogleSyncSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="consent-templates">
                <ConsentSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="appointment-states">
                <AppointmentStatesSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="subscription">
                <SubscriptionSettingsView />
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
