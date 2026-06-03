import React, { useState, lazy, Suspense, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { motion, AnimatePresence } from "framer-motion";
import BrandModal from "../../header/name/BrandModal";
import ServiceModal from "../../header/services/ServiceModal";
import WorkerModal from "../../header/workers/WorkerModal";
import UsersAdminModal from "../../admin/UsersAdminModal.jsx";
import { useBrand } from "../../header/name/BrandProvider";
import ProductionApiBanner from "./ProductionApiBanner.jsx";
import OnboardingModal from "../onboarding/OnboardingModal";

import CommandPalette from "./CommandPalette";
import ClientModal from "../../header/clients/ClientModal";
import ClientDetailModal from "../clients/ClientDetailModal";
import ServiceDetailModal from "../../header/services/ServiceDetailModal";
import AppointmentModal from "../../gadgets/appointments/AppointmentModal";

// ABM modales (lazy load)
const WorkersABMModal = lazy(() => import("../../header/workers/WorkersABMModal.jsx"));
const ClientsABMModal = lazy(() => import("../../header/clients/ClientsABMModal.jsx"));

export default function DashboardLayout({ children }) {
  const { brand } = useBrand();
  const hasCompanyName = Boolean(brand.companyName?.trim());

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Modal states
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("onboardingCompleted") !== "true";
  });
  const [showBrandModal, setShowBrandModal] = useState(() => {
    const onboardingDone = localStorage.getItem("onboardingCompleted") === "true";
    return onboardingDone && !hasCompanyName;
  });
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showWorkersABM, setShowWorkersABM] = useState(false);
  const [showClientsABM, setShowClientsABM] = useState(false);
  const [showUsersAdmin, setShowUsersAdmin] = useState(false);

  // Command Palette & Global Search States
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Custom detail modal states
  const [showClientDetailModal, setShowClientDetailModal] = useState(false);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState(null);
  
  const [showServiceDetailModal, setShowServiceDetailModal] = useState(false);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState(null);

  // Custom client creation form modal states
  const [showClientFormModal, setShowClientFormModal] = useState(false);
  const [clientFormMode, setClientFormMode] = useState("create");
  const [editingClientData, setEditingClientData] = useState(null);

  // Custom worker modal states
  const [workerModalMode, setWorkerModalMode] = useState("create");
  const [editingWorkerData, setEditingWorkerData] = useState(null);

  // Custom service modal states
  const [editingServiceData, setEditingServiceData] = useState(null);

  // Appointment creation states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Listen to command palette global hotkey (⌘K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleCommandPaletteAction = (action) => {
    switch (action.actionType) {
      case "create_client":
        setClientFormMode("create");
        setEditingClientData(null);
        setShowClientFormModal(true);
        break;
      case "create_appointment":
        setShowAppointmentModal(true);
        break;
      case "create_service":
        setEditingServiceData(null);
        setShowServiceModal(true);
        break;
      case "create_worker":
        setWorkerModalMode("create");
        setEditingWorkerData(null);
        setShowWorkerModal(true);
        break;
      case "view_client":
        setSelectedClientForDetail(action.data);
        setShowClientDetailModal(true);
        break;
      case "view_service":
        setSelectedServiceForDetail(action.data);
        setShowServiceDetailModal(true);
        break;
      case "view_worker":
        setWorkerModalMode("edit");
        setEditingWorkerData(action.data);
        setShowWorkerModal(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        openWorkersABM={() => setShowWorkersABM(true)}
        openClientsABM={() => setShowClientsABM(true)}
        openUsersAdmin={() => setShowUsersAdmin(true)}
        onEditBrand={() => setShowBrandModal(true)}
      />
      
      <motion.main 
        className={`main-content ${isCollapsed ? "main-content--collapsed" : ""}`}
        animate={{ 
          marginLeft: isCollapsed ? "var(--space-sidebar-collapsed)" : "var(--space-sidebar)",
          width: isCollapsed ? "calc(100% - var(--space-sidebar-collapsed))" : "calc(100% - var(--space-sidebar))"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <TopBar 
          onMenuClick={() => setIsMobileOpen(true)} 
          onEditBrand={() => setShowBrandModal(true)}
          onSearchClick={() => setShowCommandPalette(true)}
        />
        <motion.div className="content-inner">
          <ProductionApiBanner />
          {children}
        </motion.div>
      </motion.main>

      {/* --- Modales del Sistema --- */}
      <OnboardingModal
        show={showOnboarding}
        onHide={() => setShowOnboarding(false)}
        onEditBrand={() => setShowBrandModal(true)}
      />

      <BrandModal
        show={showBrandModal}
        forceRequired={!hasCompanyName}
        onHide={() => {
          if (!hasCompanyName) return;
          setShowBrandModal(false);
        }}
      />

      <WorkerModal 
        show={showWorkerModal} 
        onHide={() => {
          setShowWorkerModal(false);
          setEditingWorkerData(null);
        }} 
        mode={workerModalMode}
        initialData={editingWorkerData}
      />
      
      <ServiceModal 
        show={showServiceModal} 
        onHide={() => {
          setShowServiceModal(false);
          setEditingServiceData(null);
        }} 
        editService={editingServiceData}
      />

      <ClientModal
        show={showClientFormModal}
        onHide={() => {
          setShowClientFormModal(false);
          setEditingClientData(null);
        }}
        mode={clientFormMode}
        initialData={editingClientData}
      />

      {showClientDetailModal && selectedClientForDetail && (
        <ClientDetailModal
          show={showClientDetailModal}
          onHide={() => {
            setShowClientDetailModal(false);
            setSelectedClientForDetail(null);
          }}
          client={selectedClientForDetail}
          appointments={[]}
        />
      )}

      {showServiceDetailModal && selectedServiceForDetail && (
        <ServiceDetailModal
          show={showServiceDetailModal}
          onHide={() => {
            setShowServiceDetailModal(false);
            setSelectedServiceForDetail(null);
          }}
          service={selectedServiceForDetail}
        />
      )}

      {showAppointmentModal && (
        <AppointmentModal
          show={showAppointmentModal}
          onHide={() => setShowAppointmentModal(false)}
        />
      )}

      {showCommandPalette && (
        <CommandPalette
          show={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onAction={handleCommandPaletteAction}
        />
      )}

      {showWorkersABM && (
        <Suspense fallback={null}>
          <WorkersABMModal show={showWorkersABM} onHide={() => setShowWorkersABM(false)} />
        </Suspense>
      )}

      {showClientsABM && (
        <Suspense fallback={null}>
          <ClientsABMModal show={showClientsABM} onHide={() => setShowClientsABM(false)} />
        </Suspense>
      )}

      <UsersAdminModal show={showUsersAdmin} onHide={() => setShowUsersAdmin(false)} />

      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.1)",
            backdropFilter: "blur(4px)",
            zIndex: 95
          }}
        />
      )}
    </div>
  );
}
