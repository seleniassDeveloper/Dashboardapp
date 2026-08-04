import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";
import "./i18n";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider.jsx";

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    }
  });

  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;
  console.error = noop;
  console.group = noop;
  console.groupCollapsed = noop;
  console.groupEnd = noop;
  console.table = noop;
}

function RouteTracker() {
  const location = useLocation();

  React.useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("config", "G-CCT7X0Y3JH", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}

// Lazy loaded components & views
const App = lazy(() => import("./App.jsx"));
const DashboardAppRoute = lazy(() => import("./DashboardAppRoute.jsx"));
const BusinessProviderModule = lazy(() => import("./auth/BusinessContext.jsx").then(m => ({ default: m.BusinessProvider })));
const BrandProviderModule = lazy(() => import("./header/name/BrandProvider.jsx").then(m => ({ default: m.BrandProvider })));
const AppointmentsProviderModule = lazy(() => import("./gadgets/appointments/AppointmentsProvider.jsx").then(m => ({ default: m.AppointmentsProvider })));
const LoginGate = lazy(() => import("./auth/LoginGate.jsx"));
const ErrorBoundary = lazy(() => import("./ErrorBoundary.jsx"));

const LandingPage = lazy(() => import("./landing/LandingPage.jsx"));
const HowItWorks = lazy(() => import("./views/HowItWorks"));
const BookingPage = lazy(() => import("./booking/BookingPage.jsx"));
const BookingSuccess = lazy(() => import("./views/booking/BookingSuccess.jsx"));
const QuickAddBookingPage = lazy(() => import("./views/booking/QuickAddBookingPage.jsx"));
const AcceptInviteView = lazy(() => import("./views/AcceptInviteView.jsx"));
const PublicConsentPage = lazy(() => import("./views/booking/PublicConsentPage.jsx"));
const GlobalErrorModal = lazy(() => import("./components/layout/GlobalErrorModal.jsx"));
const ManualView = lazy(() => import("./views/ManualView.jsx"));

function FullPageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <div className="text-muted fw-semibold">AuraDash está cargando...</div>
      </div>
    </div>
  );
}

function AppWithProviders() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <DashboardAppRoute>
        <BusinessProviderModule>
          <ErrorBoundary>
            <LoginGate>
              <BrandProviderModule>
                <AppointmentsProviderModule>
                  <App />
                </AppointmentsProviderModule>
              </BrandProviderModule>
            </LoginGate>
          </ErrorBoundary>
        </BusinessProviderModule>
      </DashboardAppRoute>
    </Suspense>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <RouteTracker />
    <AuthProvider>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/guide" element={<HowItWorks />} />
          <Route path="/manual" element={<ManualView />} />
          <Route path="/booking/:businessSlug" element={<BookingPage />} />
          <Route path="/booking/:businessSlug/success" element={<BookingSuccess />} />
          <Route path="/booking/:businessSlug/add" element={<QuickAddBookingPage />} />
          <Route path="/invite/:token" element={<AcceptInviteView />} />
          <Route path="/consent/:token" element={<PublicConsentPage />} />
          <Route path="/app/*" element={<AppWithProviders />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalErrorModal />
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);