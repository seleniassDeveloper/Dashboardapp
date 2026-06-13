import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useBrand } from "./header/name/BrandProvider";
import { Can } from "./auth/PermissionProvider";

// Vistas
import DashboardView from "./views/DashboardView";
import CalendarView from "./views/CalendarView";
import ClientsView from "./views/ClientsView";
import ServicesView from "./views/ServicesView";
import TeamView from "./views/TeamView";
import FinancesView from "./views/FinancesView";
import InventoryView from "./views/InventoryView";
import GoogleSheetsSyncView from "./views/GoogleSheetsSyncView";
import WorkflowsView from "./views/WorkflowsView";
import AutomationsView from "./views/AutomationsView";
import HowItWorks from "./views/HowItWorks";
import SettingsView from "./views/SettingsView";
import UnauthorizedView from "./views/UnauthorizedView";
import RolesPermissionsPage from "./views/RolesPermissionsPage";
import FinanceProtectedRoute from "./auth/FinanceProtectedRoute";
import MarketingView from "./views/MarketingView";

export default function App() {
  const { brand } = useBrand();

  const isModuleActive = (moduleId) => {
    return brand.activeModules?.[moduleId] ?? true;
  };

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        
        <Route 
          path="/calendar" 
          element={
            <Can permission="agenda.view" fallback={<UnauthorizedView />}>
              <CalendarView />
            </Can>
          } 
        />
        
        <Route 
          path="/clients" 
          element={
            <Can permission="clients.view" fallback={<UnauthorizedView />}>
              <ClientsView />
            </Can>
          } 
        />
        
        <Route
          path="/services"
          element={
            isModuleActive("services") ? (
              <Can permission="agenda.view" fallback={<UnauthorizedView />}>
                <ServicesView />
              </Can>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        <Route
          path="/team"
          element={
            isModuleActive("team") ? (
              <Can permission="agenda.view" fallback={<UnauthorizedView />}>
                <TeamView />
              </Can>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        <Route
          path="/finances"
          element={
            isModuleActive("finances") ? (
              <FinanceProtectedRoute>
                <FinancesView />
              </FinanceProtectedRoute>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        <Route
          path="/inventory"
          element={
            isModuleActive("inventory") ? (
              <Can permission="inventory.view" fallback={<UnauthorizedView />}>
                <InventoryView />
              </Can>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        <Route
          path="/sheets-sync"
          element={
            isModuleActive("sheets_sync") ? (
              <Can permission="settings.view" fallback={<UnauthorizedView />}>
                <GoogleSheetsSyncView />
              </Can>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        <Route
          path="/workflows"
          element={
            isModuleActive("workflows") ? (
              <Can permission="workflows.view" fallback={<UnauthorizedView />}>
                <WorkflowsView />
              </Can>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        <Route
          path="/automations"
          element={
            isModuleActive("automations") ? (
              <Can permission="automations.view" fallback={<UnauthorizedView />}>
                <AutomationsView />
              </Can>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/marketing"
          element={
            isModuleActive("marketing") ? (
              <Can permission="marketing.view" fallback={<UnauthorizedView />}>
                <MarketingView />
              </Can>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="/guide" element={<HowItWorks />} />
        
        <Route 
          path="/settings" 
          element={
            <Can permission={["manage_settings", "manage_users"]} fallback={<UnauthorizedView />}>
              <SettingsView />
            </Can>
          } 
        />
        
        <Route 
          path="/settings/roles-permissions" 
          element={
            <Can permission="roles.view" fallback={<UnauthorizedView />}>
              <RolesPermissionsPage />
            </Can>
          } 
        />
        
        <Route path="/unauthorized" element={<UnauthorizedView />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}