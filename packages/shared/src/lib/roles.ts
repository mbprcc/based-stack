// Role management utilities for Better Auth
import type { User, Session } from "better-auth";

// Define role types
export type RoleName = "admin" | "user" | "moderator";

export interface Role {
    id: string;
    name: RoleName;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserRole {
    id: string;
    userId: string;
    roleId: string;
    createdAt: string;
}

// Extended user type with roles
export interface UserWithRoles extends User {
    roles?: Role[];
}

// Extended session type with user roles
export interface SessionWithRoles extends Session {
    user: UserWithRoles;
}

// Role checking utilities
export const hasRole = (user: UserWithRoles | null, roleName: RoleName): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => role.name === roleName);
};

export const hasAnyRole = (user: UserWithRoles | null, roleNames: RoleName[]): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => roleNames.includes(role.name));
};

export const isAdmin = (user: UserWithRoles | null): boolean => {
    return hasRole(user, "admin");
};

export const isModerator = (user: UserWithRoles | null): boolean => {
    return hasRole(user, "moderator");
};

export const isUser = (user: UserWithRoles | null): boolean => {
    return hasRole(user, "user");
};

// Role hierarchy utilities
export const getRoleHierarchy = (): Record<RoleName, number> => ({
    admin: 3,
    moderator: 2,
    user: 1,
});

export const hasHigherRole = (user: UserWithRoles | null, requiredRole: RoleName): boolean => {
    if (!user?.roles) return false;
    
    const hierarchy = getRoleHierarchy();
    const userMaxLevel = Math.max(...user.roles.map(role => hierarchy[role.name] || 0));
    const requiredLevel = hierarchy[requiredRole];
    
    return userMaxLevel >= requiredLevel;
};

// Default roles configuration
export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: "admin",
        description: "Administrator with full access",
    },
    {
        name: "user", 
        description: "Regular user with limited access",
    },
    {
        name: "moderator",
        description: "Moderator with content management access",
    },
];
