"use client";

import { type ReactNode } from "react";
import { useRoleGuard } from "@/lib/hooks/useRoles";
import type { RoleName } from "@based/shared";

interface RoleGuardProps {
    children: ReactNode;
    requiredRole: RoleName | RoleName[];
    fallback?: ReactNode;
    loadingComponent?: ReactNode;
}

export const RoleGuard = ({ 
    children, 
    requiredRole, 
    fallback = null,
    loadingComponent = <div>Loading...</div>
}: RoleGuardProps) => {
    const { hasAccess, isLoading } = useRoleGuard(requiredRole);

    if (isLoading) {
        return <>{loadingComponent}</>;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// Specific role guards for convenience
export const AdminGuard = ({ children, fallback, loadingComponent }: Omit<RoleGuardProps, 'requiredRole'>) => (
    <RoleGuard requiredRole="admin" fallback={fallback} loadingComponent={loadingComponent}>
        {children}
    </RoleGuard>
);

export const ModeratorGuard = ({ children, fallback, loadingComponent }: Omit<RoleGuardProps, 'requiredRole'>) => (
    <RoleGuard requiredRole={["admin", "moderator"]} fallback={fallback} loadingComponent={loadingComponent}>
        {children}
    </RoleGuard>
);

export const UserGuard = ({ children, fallback, loadingComponent }: Omit<RoleGuardProps, 'requiredRole'>) => (
    <RoleGuard requiredRole={["admin", "moderator", "user"]} fallback={fallback} loadingComponent={loadingComponent}>
        {children}
    </RoleGuard>
);
