import React, { useCallback, useMemo } from "react";
import { useAuth } from "./AuthProvider";

export function usePermissions() {
  const { role, permissions } = useAuth();

  const hasPermission = useCallback((permission) => {
    if (!permissions) return false;
    const normalizedRole = String(role || "").toLowerCase();
    if (normalizedRole === "owner" || normalizedRole === "admin") return true;
    
    if (Array.isArray(permission)) {
      return permission.some(p => permissions.includes(p));
    }
    return permissions.includes(permission);
  }, [role, permissions]);

  const hasAnyPermission = useCallback((permissionsList) => {
    if (!permissions) return false;
    const normalizedRole = String(role || "").toLowerCase();
    if (normalizedRole === "owner" || normalizedRole === "admin") return true;
    
    return permissionsList.some(p => permissions.includes(p));
  }, [role, permissions]);

  const hasRole = useCallback((roleKey) => {
    if (!role) return false;
    const normalizedRole = String(role || "").toLowerCase();
    const targetKey = String(roleKey || "").toLowerCase();
    if (normalizedRole === "owner" || normalizedRole === "admin") return true;
    return normalizedRole === targetKey;
  }, [role]);

  return useMemo(() => ({
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasRole,
  }), [role, permissions, hasPermission, hasAnyPermission, hasRole]);
}

export function Can({ permission, fallback = null, children }) {
  const { hasPermission } = usePermissions();
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

export function RoleGate({ roles = [], fallback = null, children }) {
  const { role } = usePermissions();
  const normalizedRole = String(role || "").toLowerCase();
  const normalizedRoles = roles.map(r => String(r || "").toLowerCase());
  
  if (normalizedRole === "owner" || normalizedRole === "admin" || normalizedRoles.includes(normalizedRole)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

export function useRole() {
  const { role, hasRole } = usePermissions();
  return { role, hasRole };
}
