import { useEffect } from "react";

export default function DashboardAppRoute({ children }) {
  useEffect(() => {
    document.body.classList.add("is-dashboard-app");
    return () => document.body.classList.remove("is-dashboard-app");
  }, []);

  return children;
}

