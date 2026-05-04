import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";

import App from "./App.jsx";
import { BrandProvider } from "./header/name/BrandProvider.jsx";
import { AppointmentsProvider } from "./gadgets/appointments/AppointmentsProvider.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import LoginGate from "./auth/LoginGate.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <LoginGate>
      <BrandProvider>
        <AppointmentsProvider>
          <App />
        </AppointmentsProvider>
      </BrandProvider>
    </LoginGate>
  </AuthProvider>
);