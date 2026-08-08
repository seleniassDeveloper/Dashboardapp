// src/hooks/useFinanceDashboard.js
import { useState, useEffect, useCallback } from "react";
import api from "../lib/api.js";

export function getMockFinanceDashboardData() {
  return {
    kpis: {
      grossIncome: 485000,
      grossIncomeGrowth: 14.2,
      netProfit: 290000,
      netProfitGrowth: 18.5,
      operationalExpenses: 195000,
      operationalExpensesChange: -3.1,
      profitMargin: 59.7,
      marginChange: 4.5
    },
    monthlyBilling: [
      { month: "Ene", billing: 380000, expenses: 160000 },
      { month: "Feb", billing: 410000, expenses: 175000 },
      { month: "Mar", billing: 440000, expenses: 180000 },
      { month: "Abr", billing: 430000, expenses: 170000 },
      { month: "May", billing: 460000, expenses: 190000 },
      { month: "Jun", billing: 485000, expenses: 195000 }
    ],
    serviceRevenueBreakdown: [
      { name: "Peluquería & Estilismo", percentage: 45, total: 218250 },
      { name: "Coloración & Tratamientos", percentage: 35, total: 169750 },
      { name: "Barbería", percentage: 20, total: 97000 }
    ]
  };
}

export function useFinanceDashboard(enabled = true) {
  const [dashboardData, setDashboardData] = useState(() => getMockFinanceDashboardData());
  const [expenseBranches, setExpenseBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const [dashRes, branchesRes] = await Promise.all([
        api.get("/finances/dashboard"),
        api.get("/finances/branches").catch(() => ({ data: [] }))
      ]);

      if (dashRes.data && Object.keys(dashRes.data).length > 0) {
        setDashboardData(dashRes.data);
      } else {
        setDashboardData(getMockFinanceDashboardData());
      }
      setExpenseBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
    } catch (err) {
      console.warn("[useFinanceDashboard] Fallback to mock finance data for demo view:", err?.message);
      setDashboardData(getMockFinanceDashboardData());
      setError("");
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
