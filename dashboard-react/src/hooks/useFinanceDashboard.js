// src/hooks/useFinanceDashboard.js
import { useState, useEffect, useCallback } from "react";
import api from "../lib/api.js";

export function useFinanceDashboard(enabled = true) {
  const [dashboardData, setDashboardData] = useState(null);
  const [expenseBranches, setExpenseBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      // Load both dashboard metrics and branches
      const [dashRes, branchesRes] = await Promise.all([
        api.get("/finances/dashboard"),
        api.get("/finances/branches").catch(() => ({ data: [] }))
      ]);

      setDashboardData(dashRes.data);
      setExpenseBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
    } catch (err) {
      console.error("[useFinanceDashboard]:", err);
      setError("No se pudieron cargar los datos financieros ERP contables.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [enabled, fetchDashboardData]);

  return {
    dashboardData,
    expenseBranches,
    loading,
    error,
    fetchDashboardData
  };
}
