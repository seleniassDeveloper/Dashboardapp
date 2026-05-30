import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";
import "./i18n";

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import { BrandProvider } from "./header/name/BrandProvider.jsx";
import { AppointmentsProvider } from "./gadgets/appointments/AppointmentsProvider.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { BusinessProvider } from "./auth/BusinessContext.jsx";
import LoginGate from "./auth/LoginGate.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import LandingPage from "./landing/LandingPage.jsx";
import DashboardAppRoute from "./DashboardAppRoute.jsx";
import HowItWorks from "./views/HowItWorks";
import PublicBookingPage from "./views/booking/PublicBookingPage.jsx";
import BookingSuccess from "./views/booking/BookingSuccess.jsx";
import QuickAddBookingPage from "./views/booking/QuickAddBookingPage.jsx";
import AcceptInviteView from "./views/AcceptInviteView.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/guide" element={<HowItWorks />} />
      <Route path="/booking/:businessSlug" element={<PublicBookingPage />} />
      <Route path="/booking/:businessSlug/success" element={<BookingSuccess />} />
      <Route path="/booking/:businessSlug/add" element={<QuickAddBookingPage />} />
      <Route path="/invite/:token" element={<AcceptInviteView />} />
      <Route
        path="/app/*"
        element={
          <DashboardAppRoute>
            <AuthProvider>
              <BusinessProvider>
                <ErrorBoundary>
                  <LoginGate>
                    <BrandProvider>
                      <AppointmentsProvider>
                        <App />
                      </AppointmentsProvider>
                    </BrandProvider>
                  </LoginGate>
                </ErrorBoundary>
              </BusinessProvider>
            </AuthProvider>
          </DashboardAppRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);