import React, { useState } from "react";
import CrmDashboard from "./CrmDashboard";
import ClientsList from "./ClientsList";
import ClientDetail from "./ClientDetail";
import ClientEdit from "./ClientEdit";
import "./CrmMobile.css";

export default function CrmMobile(props) {
  const [screen, setScreen] = useState("dashboard"); // dashboard | list | detail | edit
  const [selectedClient, setSelectedClient] = useState(null);

  const navigateTo = (nextScreen, client = null) => {
    if (client) setSelectedClient(client);
    setScreen(nextScreen);
  };

  const goBack = () => {
    if (screen === "edit") {
      // If we came from detail, return to detail, else go to list
      if (selectedClient && selectedClient.id) {
        setScreen("detail");
      } else {
        setScreen("list");
      }
    } else if (screen === "detail") {
      setScreen("list");
    } else if (screen === "list") {
      setScreen("dashboard");
    } else {
      setScreen("dashboard");
    }
  };

  return (
    <div className="crm-mobile">
      {screen === "dashboard" && (
        <CrmDashboard 
          {...props} 
          onNavigate={navigateTo} 
        />
      )}
      {screen === "list" && (
        <ClientsList 
          {...props} 
          selectedClient={selectedClient}
          onNavigate={navigateTo} 
          onBack={goBack}
        />
      )}
      {screen === "detail" && (
        <ClientDetail 
          {...props} 
          client={selectedClient} 
          onNavigate={navigateTo} 
          onBack={goBack}
        />
      )}
      {screen === "edit" && (
        <ClientEdit 
          {...props} 
          client={selectedClient} 
          onNavigate={navigateTo} 
          onBack={goBack}
        />
      )}
    </div>
  );
}
