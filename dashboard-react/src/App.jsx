import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";

// Vistas
import DashboardView from "./views/DashboardView";
import CalendarView from "./views/CalendarView";
import ClientsView from "./views/ClientsView";
import ServicesView from "./views/ServicesView";
import TeamView from "./views/TeamView";
import FinancesView from "./views/FinancesView";
import WorkflowsView from "./views/WorkflowsView";
import AutomationsView from "./views/AutomationsView";
import HowItWorks from "./views/HowItWorks";
import SettingsView from "./views/SettingsView";

export default function App() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/clients" element={<ClientsView />} />
        <Route path="/services" element={<ServicesView />} />
        <Route path="/team" element={<TeamView />} />
        <Route path="/finances" element={<FinancesView />} />
        <Route path="/workflows" element={<WorkflowsView />} />
        <Route path="/automations" element={<AutomationsView />} />
        <Route path="/guide" element={<HowItWorks />} />
        <Route path="/settings" element={<SettingsView />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}