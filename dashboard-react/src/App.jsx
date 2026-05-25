import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useBrand } from "./header/name/BrandProvider";

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

export default function App() {
  const { brand } = useBrand();

  const isModuleActive = (moduleId) => {
    return brand.activeModules?.[moduleId] ?? true;
  };

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/clients" element={<ClientsView />} />
        
        <Route
          path="/services"
          element={isModuleActive("services") ? <ServicesView /> : <Navigate to="/" replace />}
        />
        <Route
          path="/team"
          element={isModuleActive("team") ? <TeamView /> : <Navigate to="/" replace />}
        />
        <Route
          path="/finances"
          element={isModuleActive("finances") ? <FinancesView /> : <Navigate to="/" replace />}
        />
        <Route
          path="/inventory"
          element={isModuleActive("inventory") ? <InventoryView /> : <Navigate to="/" replace />}
        />
        <Route
          path="/sheets-sync"
          element={isModuleActive("sheets_sync") ? <GoogleSheetsSyncView /> : <Navigate to="/" replace />}
        />
        <Route
          path="/workflows"
          element={isModuleActive("workflows") ? <WorkflowsView /> : <Navigate to="/" replace />}
        />
        <Route
          path="/automations"
          element={isModuleActive("automations") ? <AutomationsView /> : <Navigate to="/" replace />}
        />
        
        <Route path="/guide" element={<HowItWorks />} />
        <Route path="/settings" element={<SettingsView />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}