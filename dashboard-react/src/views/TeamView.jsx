import React from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTeam } from "../hooks/useTeam";
import TeamDesktop from "../components/team/TeamDesktop";
import TeamMobile from "../components/team/mobile/TeamMobile";
import WorkerFormModal from "../header/workers/WorkerFormModal.jsx";

export default function TeamView() {
  const isMobile = useIsMobile();
  const sync = useTeam();

  const { showModal, setShowModal, editing, onSaved } = sync;

  return (
    <>
      {isMobile ? (
        <TeamMobile sync={sync} />
      ) : (
        <TeamDesktop sync={sync} />
      )}

      {/* Shared form modal for adding/editing team members */}
      <WorkerFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        mode={editing ? "edit" : "create"}
        initialData={editing}
        onSaved={onSaved}
      />
    </>
  );
}
