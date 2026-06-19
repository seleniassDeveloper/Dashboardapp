import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useBrand } from "./header/name/BrandProvider";
import { Can } from "./auth/PermissionProvider";
import { useAuth } from "./auth/AuthProvider";

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
import PricingView from "./views/PricingView";
import SuperAdminBillingView from "./views/SuperAdminBillingView";

const PLAN_RESTRICTIONS = {
  starter: [], // "finances", "inventory", "sheets_sync", "workflows", "automations", "marketing" (Desbloqueado por petición)
  pro: [], // "sheets_sync", "automations", "marketing" (Desbloqueado por petición)
  business: []
};

import IdleTimer from "./auth/IdleTimer";

export default function App() {
  const { brand } = useBrand();
  const { isSuperAdmin, business } = useAuth();

  const isModuleActive = (moduleId) => {
    return brand.activeModules?.[moduleId] ?? true;
  };

  const activePlan = business?.plan || "starter";
  const isLocked = (moduleId) => {
    return PLAN_RESTRICTIONS[activePlan]?.includes(moduleId);
  };

  return (
    <DashboardLayout>
      <IdleTimer timeoutMinutes={3} warningMinutes={2} />
      <Routes>
        <Route path="/" element={
          isSuperAdmin && !business ? (
            <Navigate to="/superadmin/billing" replace />
          ) : (
            <DashboardView />
          )
        } />
        
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
            isLocked("finances") ? (
              <Navigate to="/app/pricing" replace />
            ) : isModuleActive("finances") ? (
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
            isLocked("inventory") ? (
              <Navigate to="/app/pricing" replace />
            ) : isModuleActive("inventory") ? (
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
            isLocked("sheets_sync") ? (
              <Navigate to="/app/pricing" replace />
            ) : isModuleActive("sheets_sync") ? (
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
            isLocked("workflows") ? (
              <Navigate to="/app/pricing" replace />
            ) : isModuleActive("workflows") ? (
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
            isLocked("automations") ? (
              <Navigate to="/app/pricing" replace />
            ) : isModuleActive("automations") ? (
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
            isLocked("marketing") ? (
              <Navigate to="/app/pricing" replace />
            ) : isModuleActive("marketing") ? (
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
        
        <Route path="/pricing" element={<PricingView />} />
        
        <Route 
          path="/superadmin/billing" 
          element={
            isSuperAdmin ? (
              <SuperAdminBillingView />
            ) : (
              <Navigate to="/unauthorized" replace />
            )
          } 
        />

        <Route path="/unauthorized" element={<UnauthorizedView />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}