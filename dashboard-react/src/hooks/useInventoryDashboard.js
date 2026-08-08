import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../lib/api.js";

const safeArray = (x) => (Array.isArray(x) ? x : []);

export function getMockInventoryData() {
  return {
    products: [
      { id: "p1", name: "Shampoo Nutritivo Argan 1L", category: "Peluquería", stock: 15, minStock: 5, costPrice: 2500, salePrice: 4800, sku: "SH-ARG-1L" },
      { id: "p2", name: "Tinte Profesional 6.1 Rubio Oscuro", category: "Coloración", stock: 24, minStock: 10, costPrice: 1200, salePrice: 2800, sku: "TN-61-75M" },
      { id: "p3", name: "Aceite de Barba Hidratante 50ml", category: "Barbería", stock: 8, minStock: 4, costPrice: 1800, salePrice: 3500, sku: "AC-BAR-50" },
      { id: "p4", name: "Máscara Reparadora Keratina 500g", category: "Tratamientos", stock: 3, minStock: 6, costPrice: 3200, salePrice: 6500, sku: "MK-KER-500" }
    ],
    dashboard: {
      summary: {
        lowStockCount: 1,
        totalValue: 98400,
        totalUnique: 4,
        estimatedMonthlySpend: 24500,
        mostConsumed: "Shampoo Nutritivo Argan 1L",
        costliestService: "Balayage Profesional"
      }
    }
  };
}

export default function useInventoryDashboard() {
  const mockInv = getMockInventoryData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(() => mockInv.dashboard);
  const [products, setProducts] = useState(() => mockInv.products);
  const [suppliers, setSuppliers] = useState([]);
  const [rules, setRules] = useState([]);
  const [movements, setMovements] = useState([]);
  const [branchesCount, setBranchesCount] = useState(1);
  const [businessIndustry, setBusinessIndustry] = useState("Estética");

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [dashRes, prodRes, supRes, ruleRes, movRes, branchRes, bizRes] = await Promise.all([
        api.get("/inventory/dashboard").catch(() => null),
        api.get("/inventory/products").catch(() => null),
        api.get("/inventory/suppliers").catch(() => ({ data: [] })),
        api.get("/inventory/rules").catch(() => ({ data: [] })),
        api.get("/inventory/movements").catch(() => ({ data: [] })),
        api.get("/finances/branches").catch(() => ({ data: [] })),
        api.get("/businesses/me").catch(() => null)
      ]);

      const prodList = safeArray(prodRes?.data);
      if (prodList.length > 0) {
        setProducts(prodList);
      } else {
        setProducts(mockInv.products);
      }

      if (dashRes?.data && dashRes.data.summary) {
        setDashboardData(dashRes.data);
      } else {
        setDashboardData(mockInv.dashboard);
      }

      setSuppliers(safeArray(supRes?.data));
      setRules(safeArray(ruleRes?.data));
      setMovements(safeArray(movRes?.data));
      setBranchesCount(safeArray(branchRes?.data).length || 1);

      if (bizRes && bizRes.data && bizRes.data.business) {
        setBusinessIndustry(bizRes.data.business.industry || "Estética");
      }
      setError("");
    } catch (err) {
      console.warn("[useInventoryDashboard] Fallback to mock inventory data for demo view:", err?.message);
      setProducts(mockInv.products);
      setDashboardData(mockInv.dashboard);
      setError("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculations from InventoryDashboard.jsx
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p && typeof p.stock === "number" && typeof p.minStock === "number" && p.stock < p.minStock);
  }, [products]);

  const productsWithValue = useMemo(() => {
    return products
      .filter(p => p !== null && p !== undefined)
      .map(p => ({ ...p, totalVal: (p.stock || 0) * (p.costPrice || 0) }))
      .sort((a, b) => b.totalVal - a.totalVal);
  }, [products]);

  const categoryBreakdown = useMemo(() => {
    const map = products
      .filter(p => p !== null && p !== undefined)
      .reduce((acc, p) => {
        const cat = p.category || "General";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  }, [products]);

  const recentAutomaticMovements = useMemo(() => {
    return movements
      .filter(m => m && (m.type === "automatic" || m.type === "output"))
      .slice(0, 15);
  }, [movements]);

  const stockChartData = useMemo(() => {
    return products
      .filter(p => p && p.name)
      .slice(0, 8)
      .map(p => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
        stock: p.stock || 0,
        minStock: p.minStock || 0
      }));
  }, [products]);

  const safeSummary = useMemo(() => {
    const summary = dashboardData?.summary;
    return {
      lowStockCount: typeof summary?.lowStockCount === "number" ? summary.lowStockCount : 0,
      totalValue: typeof summary?.totalValue === "number" ? summary.totalValue : 0,
      totalUnique: typeof summary?.totalUnique === "number" ? summary.totalUnique : 0,
      estimatedMonthlySpend: typeof summary?.estimatedMonthlySpend === "number" ? summary.estimatedMonthlySpend : 0,
      mostConsumed: summary?.mostConsumed || "Sin registros",
      costliestService: summary?.costliestService || "Sin registrar"
    };
  }, [dashboardData]);

  // Combined stock low alerts and expiration alerts
  const alerts = useMemo(() => {
    const list = [];
    
    // 1. Stock alerts
    products.forEach(p => {
      if (p && typeof p.stock === "number" && typeof p.minStock === "number" && p.stock < p.minStock) {
        const isCritical = p.stock === 0 || p.stock <= 2 || p.stock <= p.minStock * 0.3;
        list.push({
          id: `stock-${p.id}`,
          type: "stock",
          product: p,
          name: p.name,
          sub: `Stock actual: ${p.stock} ${p.unit || "unidades"}`,
          severity: isCritical ? "crit" : "low",
          badgeText: isCritical ? "Crítico" : "Bajo"
        });
      }
    });

    // 2. Expiration alerts
    products.forEach(p => {
      if (p && Array.isArray(p.batches)) {
        p.batches.forEach(b => {
          if (b && b.expirationDate) {
            const now = Date.now();
            const exp = new Date(b.expirationDate).getTime();
            const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) {
              const severity = diffDays <= 0 ? "crit" : "exp";
              list.push({
                id: `exp-${b.id}`,
                type: "expiration",
                product: p,
                name: p.name,
                sub: diffDays <= 0 ? "VENCIDO" : `Vence en ${diffDays} días`,
                severity: severity,
                badgeText: diffDays <= 0 ? "Vencido" : "Vencer"
              });
            }
          }
        });
      }
    });

    return list;
  }, [products]);

  return {
    loading,
    error,
    dashboardData,
    products,
    suppliers,
    rules,
    movements,
    branchesCount,
    businessIndustry,
    refresh: fetchAllData,
    
    // Derived values
    lowStockProducts,
    productsWithValue,
    categoryBreakdown,
    recentAutomaticMovements,
    stockChartData,
    safeSummary,
    alerts
  };
}
