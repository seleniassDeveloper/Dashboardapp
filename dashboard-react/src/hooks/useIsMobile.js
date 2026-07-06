import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 767px)");
    
    setIsMobile(media.matches);

    const listener = (e) => {
      setIsMobile(e.matches);
    };

    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, []);

  return isMobile;
}
