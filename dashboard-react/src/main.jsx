import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import { BrandProvider } from "./header/name/BrandProvider.jsx";
import { AppointmentsProvider } from "./gadgets/appointments/AppointmentsProvider.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import LoginGate from "./auth/LoginGate.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import LandingPage from "./landing/LandingPage.jsx";
import DashboardAppRoute from "./DashboardAppRoute.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/app/*"
        element={
          <DashboardAppRoute>
            <AuthProvider>
              <ErrorBoundary>
                <LoginGate>
                  <BrandProvider>
                    <AppointmentsProvider>
                      <App />
                    </AppointmentsProvider>
                  </BrandProvider>
                </LoginGate>
              </ErrorBoundary>
            </AuthProvider>
          </DashboardAppRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);