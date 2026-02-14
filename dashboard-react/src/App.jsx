import React from "react";
import BrandHeader from "./header/name/BrandHeader";
import Body from "./body";
import { AppointmentsProvider } from "./gadgets/appointments/AppointmentsProvider.jsx";

export default function App() {
  return (
    <>
      <BrandHeader />
      <AppointmentsProvider className="pageContent">
        <Body />
      </AppointmentsProvider>
    </>
  );
}
