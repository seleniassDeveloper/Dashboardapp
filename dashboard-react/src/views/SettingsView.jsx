import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container, Tab } from "react-bootstrap";
import { Trans, useTranslation } from "react-i18next";
import { 
  Database, 
  LayoutGrid, 
  CalendarCheck, 
  MessageCircle, 
  MapPin, 
  CalendarDays, 
  FileSignature, 
  Tag, 
  CreditCard, 
  Users, 
  Plus 
} from "lucide-react";
import FieldsAndFormsSettings from "../components/configurable-fields/FieldsAndFormsSettings.jsx";
import ActiveModulesEditor from "../components/configurable-fields/ActiveModulesEditor.jsx";
import BookingSettings from "../components/configurable-fields/BookingSettings.jsx";
import UsersPermissionsSettings from "../components/configurable-fields/UsersPermissionsSettings.jsx";
import BranchSettings from "../components/configurable-fields/BranchSettings.jsx";
import GoogleSyncSettings from "../components/configurable-fields/GoogleSyncSettings.jsx";
import ConsentSettings from "../components/configurable-fields/ConsentSettings.jsx";
import AppointmentStatesSettings from "../components/configurable-fields/AppointmentStatesSettings.jsx";
import { usePermissions } from "../auth/PermissionProvider.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import SubscriptionSettingsView from "../components/configurable-fields/SubscriptionSettingsView.jsx";
import WhatsAppSettings from "../components/configurable-fields/WhatsAppSettings.jsx";
import "./SettingsView.css";

const SETTINGS_TABS = [
  { key: "custom-fields", labelEs: "Campos y Formularios", labelEn: "Fields & Forms", icon: Database, perm: "manage_settings" },
  { key: "modules", labelKey: "settings.tabs.modules", icon: LayoutGrid, perm: "manage_settings" },
  { key: "booking", labelKey: "settings.tabs.booking", icon: CalendarCheck, perm: "manage_settings" },
  { key: "whatsapp", labelEs: "WhatsApp", labelEn: "WhatsApp", icon: MessageCircle, perm: "manage_settings" },
  { key: "sucursales", labelKey: "settings.tabs.branches", icon: MapPin, perm: "manage_settings" },
  { key: "google-sync", labelEs: "Google Calendar", labelEn: "Google Calendar", icon: CalendarDays, perm: "manage_settings" },
  { key: "consent-templates", labelKey: "settings.tabs.consents", labelDefaultEs: "Consentimientos", labelDefaultEn: "Consents", icon: FileSignature, perm: "manage_settings" },
  { key: "appointment-states", labelEs: "Estados de Cita", labelEn: "Appointment States", icon: Tag, perm: "manage_settings" },
  { key: "subscription", labelEs: "Suscripción", labelEn: "Subscription", icon: CreditCard, perm: "manage_settings" },
  { key: "users", labelKey: "settings.tabs.users", icon: Users, perm: "manage_users" },
];

export default function SettingsView() {
  const { t, i18n } = useTranslation("views");
  const isEs = i18n.language === "es";
  const { hasPermission } = usePermissions();
  const { user, isDemo } = useAuth();

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

  const tabListRef = useRef(null);

  const setTab = (newTab) => {
    setTabState(newTab);
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    if (queryTab && queryTab !== tab) {
      setTabState(queryTab);
    }
  }, [queryTab]);

  const visibleTabs = SETTINGS_TABS.filter((tItem) => {
    if (tItem.perm === "manage_settings") return canManageSettings;
    if (tItem.perm === "manage_users") return canManageUsers;
    return true;
  });

  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % visibleTabs.length;
      setTab(visibleTabs[nextIndex].key);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + visibleTabs.length) % visibleTabs.length;
      setTab(visibleTabs[prevIndex].key);
    }
  };

  if (!canManageSettings && !canManageUsers) {
    return (
      <Container className="py-5 text-center">
        <h2 className="text-secondary smaller fw-bold mb-0">{t("settings.noPermission")}</h2>
      </Container>
    );
  }

  const isDemoSession = isDemo || user?.email === "demo@auradash.digital";

  return (
    <Container fluid className="p-0">
      <header className="mb-4">
        <h1 className="fw-bold h3" style={{ color: "var(--ink)" }}>{t("settings.title")}</h1>
        <p className="text-muted mb-0">{t("settings.subtitle")}</p>
      </header>

      {/* Banner de Modo Demostración */}
      {isDemoSession && (
        <div className="demo-banner">
          <div className="demo-banner__text">
            👀 <strong>Modo Demostración (Solo Lectura):</strong> Estás explorando la plataforma. Las acciones de guardado están deshabilitadas.
          </div>
          <Link to="/app/pricing" className="btn-v">
            <Plus size={16} />
            <span>{isEs ? "Crear mi cuenta!" : "Create Account!"}</span>
          </Link>
        </div>
      )}

      <Tab.Container activeKey={tab} onSelect={(k) => k && setTab(k)}>
        {/* Accesible 2026 Underlined Tabs with Icons */}
        <div role="tablist" className="settings-tabs" ref={tabListRef} aria-label="Ajustes de Configuración">
          {visibleTabs.map((tItem, index) => {
            const Icon = tItem.icon;
            const isActive = tab === tItem.key;
            let label = "";

            if (tItem.labelKey) {
              label = t(tItem.labelKey, { defaultValue: isEs ? (tItem.labelDefaultEs || tItem.labelKey) : (tItem.labelDefaultEn || tItem.labelKey) });
            } else {
              label = isEs ? tItem.labelEs : tItem.labelEn;
            }

            return (
              <button
                key={tItem.key}
                role="tab"
                id={`tab-${tItem.key}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tItem.key}`}
                tabIndex={isActive ? 0 : -1}
                className={`settings-tab ${isActive ? "is-active" : ""}`}
                onClick={() => setTab(tItem.key)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                <Icon size={19} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <Tab.Content>
          {canManageSettings && (
            <>
              <Tab.Pane eventKey="custom-fields" id="tabpanel-custom-fields" aria-labelledby="tab-custom-fields">
                <FieldsAndFormsSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="modules" id="tabpanel-modules" aria-labelledby="tab-modules">
                <ActiveModulesEditor />
              </Tab.Pane>
              <Tab.Pane eventKey="booking" id="tabpanel-booking" aria-labelledby="tab-booking">
                <BookingSettings onNavigateToGoogleSync={() => setTab("google-sync")} />
              </Tab.Pane>
              <Tab.Pane eventKey="whatsapp" id="tabpanel-whatsapp" aria-labelledby="tab-whatsapp">
                <WhatsAppSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="sucursales" id="tabpanel-sucursales" aria-labelledby="tab-sucursales">
                <BranchSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="google-sync" id="tabpanel-google-sync" aria-labelledby="tab-google-sync">
                <GoogleSyncSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="consent-templates" id="tabpanel-consent-templates" aria-labelledby="tab-consent-templates">
                <ConsentSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="appointment-states" id="tabpanel-appointment-states" aria-labelledby="tab-appointment-states">
                <AppointmentStatesSettings />
              </Tab.Pane>
              <Tab.Pane eventKey="subscription" id="tabpanel-subscription" aria-labelledby="tab-subscription">
                <SubscriptionSettingsView />
              </Tab.Pane>
            </>
          )}
          {canManageUsers && (
            <Tab.Pane eventKey="users" id="tabpanel-users" aria-labelledby="tab-users">
              <UsersPermissionsSettings />
            </Tab.Pane>
          )}
        </Tab.Content>
      </Tab.Container>

      {canManageSettings && (
        <div className="mt-4 p-4 rounded-4 bg-white border shadow-sm" style={{ borderColor: "var(--border)" }}>
          <h3 className="h6 fw-bold" style={{ color: "var(--ink)" }}>{t("settings.workflowHint.title")}</h3>
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
