"use client";

import { trpc } from "@/trpc/client";
import { hasRole, isAdmin, isModerator, type RoleName, type UserWithRoles } from "@based/shared";

// Hook for getting current user with roles
export const useCurrentUser = () => {
    return trpc.roles.me.useQuery();
};

// Hook for getting user roles
export const useUserRoles = (userId?: string) => {
    return trpc.roles.getUserRoles.useQuery({ userId });
};

// Hook for role management (admin only)
export const useRoleManagement = () => {
    const utils = trpc.useUtils();

    const assignRole = trpc.roles.assignRole.useMutation({
        onSuccess: () => {
            // Invalidate and refetch user roles
            utils.roles.getUserRoles.invalidate();
            utils.roles.me.invalidate();
        },
    });

    const removeRole = trpc.roles.removeRole.useMutation({
        onSuccess: () => {
            // Invalidate and refetch user roles
            utils.roles.getUserRoles.invalidate();
            utils.roles.me.invalidate();
        },
    });

    return {
        assignRole,
        removeRole,
    };
};

// Hook for role checking
export const useRoleCheck = () => {
    const { data: currentUser } = useCurrentUser();

    return {
        hasRole: (roleName: RoleName) => hasRole(currentUser, roleName),
        isAdmin: () => isAdmin(currentUser),
        isModerator: () => isModerator(currentUser),
        currentUser,
    };
};

// Hook for conditional rendering based on roles
export const useRoleGuard = (requiredRole: RoleName | RoleName[]) => {
    const { data: currentUser, isLoading } = useCurrentUser();

    const hasRequiredRole = Array.isArray(requiredRole)
        ? requiredRole.some(role => hasRole(currentUser, role))
        : hasRole(currentUser, requiredRole);

    return {
        hasAccess: hasRequiredRole,
        isLoading,
        currentUser,
    };
};
