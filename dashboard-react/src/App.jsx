import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useBrand } from "./header/name/BrandProvider";
import { Can } from "./auth/PermissionProvider";
import { useAuth } from "./auth/AuthProvider";
import FinanceProtectedRoute from "./auth/FinanceProtectedRoute";

// Vistas con Code-Splitting (React.lazy)
const DashboardView = lazy(() => import("./views/DashboardView"));
const CalendarView = lazy(() => import("./views/CalendarView"));
const ClientsView = lazy(() => import("./views/ClientsView"));
const ServicesView = lazy(() => import("./views/ServicesView"));
const TeamView = lazy(() => import("./views/TeamView"));
const FinancesView = lazy(() => import("./views/FinancesView"));
const InventoryView = lazy(() => import("./views/InventoryView"));
const GoogleSheetsSyncView = lazy(() => import("./views/GoogleSheetsSyncView"));
const WorkflowsView = lazy(() => import("./views/WorkflowsView"));
const AutomationsView = lazy(() => import("./views/AutomationsView"));
const HowItWorks = lazy(() => import("./views/HowItWorks"));
const SettingsView = lazy(() => import("./views/SettingsView"));
const UnauthorizedView = lazy(() => import("./views/UnauthorizedView"));
const RolesPermissionsPage = lazy(() => import("./views/RolesPermissionsPage"));
const PricingView = lazy(() => import("./views/PricingView"));
const SuperAdminBillingView = lazy(() => import("./views/SuperAdminBillingView"));
const AppointmentsSLA = lazy(() => import("./components/appointments/mobile/AppointmentsSLA"));
const SlaTodayTimelineView = lazy(() => import("./views/SlaTodayTimelineView"));

const PLAN_RESTRICTIONS = {
  starter: ["finances"],
  pro: [],
  business: []
};

function ViewLoadingFallback() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5 my-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando vista...</span>
      </div>
    </div>
  );
}

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
      <Suspense fallback={<ViewLoadingFallback />}>
        <Routes>
          <Route path="/" element={
            isSuperAdmin && !business ? (
              <Navigate to="/superadmin" replace />
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
            path="/sla-today" 
            element={
              <Can permission="agenda.view" fallback={<UnauthorizedView />}>
                <SlaTodayTimelineView />
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
            path="/superadmin" 
            element={
              isSuperAdmin ? (
                <SuperAdminBillingView />
              ) : (
                <Navigate to="/unauthorized" replace />
              )
            } 
          />

          <Route 
            path="/sla-progress" 
            element={
              <Can permission="agenda.view" fallback={<UnauthorizedView />}>
                <AppointmentsSLA />
              </Can>
            } 
          />

          <Route path="/unauthorized" element={<UnauthorizedView />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}