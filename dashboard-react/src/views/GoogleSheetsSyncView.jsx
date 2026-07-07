import React from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useSheetsSync } from "../hooks/useSheetsSync";
import SheetsSyncDesktop from "../components/sheets/SheetsSyncDesktop";
import SheetsSyncMobile from "../components/sheets/SheetsSyncMobile";

export default function GoogleSheetsSyncView() {
  const isMobile = useIsMobile();
  const sync = useSheetsSync();

  return isMobile ? (
    <SheetsSyncMobile sync={sync} />
  ) : (
    <SheetsSyncDesktop sync={sync} />
  );
}
