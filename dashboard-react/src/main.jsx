import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";

import App from "./App.jsx";
import { BrandProvider } from "./header/name/BrandProvider.jsx";
import { AppointmentsProvider } from "./gadgets/appointments/AppointmentsProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrandProvider>
      <AppointmentsProvider>
        <App />
      </AppointmentsProvider>
    </BrandProvider>
  </React.StrictMode>
);