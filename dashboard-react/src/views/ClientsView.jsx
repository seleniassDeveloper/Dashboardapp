import React from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useClients } from "../hooks/useClients";
import ClientsDesktop from "../components/clients/ClientsDesktop";
import CrmMobile from "../components/clients/mobile/CrmMobile";

export default function ClientsView() {
  const isMobile = useIsMobile();
  const sync = useClients();

  return (
    <>
      {isMobile ? (
        <CrmMobile {...sync} />
      ) : (
        <ClientsDesktop sync={sync} />
      )}
    </>
  );
}
