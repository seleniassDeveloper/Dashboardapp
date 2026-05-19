import React, { useState, lazy, Suspense } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { motion, AnimatePresence } from "framer-motion";
import BrandModal from "../../header/name/BrandModal";
import ServiceModal from "../../header/services/ServiceModal";
import WorkerModal from "../../header/workers/WorkerModal";
import UsersAdminModal from "../../admin/UsersAdminModal.jsx";
import { useBrand } from "../../header/name/BrandProvider";
import ProductionApiBanner from "./ProductionApiBanner.jsx";

// ABM modales (lazy load)
const WorkersABMModal = lazy(() => import("../../header/workers/WorkersABMModal.jsx"));
const ClientsABMModal = lazy(() => import("../../header/clients/ClientsABMModal.jsx"));

export default function DashboardLayout({ children }) {
  const { brand } = useBrand();
  const hasCompanyName = Boolean(brand.companyName?.trim());

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Modal states
  const [showBrandModal, setShowBrandModal] = useState(!hasCompanyName);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showWorkersABM, setShowWorkersABM] = useState(false);
  const [showClientsABM, setShowClientsABM] = useState(false);
  const [showUsersAdmin, setShowUsersAdmin] = useState(false);

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
        animate={{ marginLeft: isCollapsed ? "var(--space-sidebar-collapsed)" : "var(--space-sidebar)" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <TopBar 
          onMenuClick={() => setIsMobileOpen(true)} 
          onEditBrand={() => setShowBrandModal(true)}
        />
        <motion.div className="content-inner">
          <ProductionApiBanner />
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.main>

      {/* --- Modales del Sistema --- */}
      <BrandModal
        show={showBrandModal}
        forceRequired={!hasCompanyName}
        onHide={() => {
          if (!hasCompanyName) return;
          setShowBrandModal(false);
        }}
      />

      <WorkerModal show={showWorkerModal} onHide={() => setShowWorkerModal(false)} />
      <ServiceModal show={showServiceModal} onHide={() => setShowServiceModal(false)} />

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
