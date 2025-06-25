import { z } from "zod";
import { role, userRole, user } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { initTRPC, TRPCError } from "@trpc/server";
import type { HonoContext } from "../..";
import { hasRole, isAdmin, type RoleName } from "@based/shared";

const t = initTRPC.context<HonoContext>().create();

// Protected procedure that requires authentication
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.honoCtx.get("user")) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
        });
    }
    return next();
});

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    const currentUser = ctx.honoCtx.get("user");
    
    // Get user roles
    const userRoles = await ctx.orm
        .select({
            roleName: role.name,
        })
        .from(userRole)
        .innerJoin(role, eq(userRole.roleId, role.id))
        .where(eq(userRole.userId, currentUser!.id));

    const userWithRoles = {
        ...currentUser!,
        roles: userRoles.map(ur => ({ name: ur.roleName as RoleName })),
    };

    if (!isAdmin(userWithRoles)) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
        });
    }

    return next();
});

export const roleRouter = t.router({
    // Get all roles
    list: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.orm.select().from(role).all();
    }),

    // Get user roles
    getUserRoles: protectedProcedure
        .input(z.object({ userId: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            const currentUser = ctx.honoCtx.get("user");
            const targetUserId = input.userId || currentUser!.id;

            // Only allow users to see their own roles, unless they're admin
            if (targetUserId !== currentUser!.id) {
                const userRoles = await ctx.orm
                    .select({
                        roleName: role.name,
                    })
                    .from(userRole)
                    .innerJoin(role, eq(userRole.roleId, role.id))
                    .where(eq(userRole.userId, currentUser!.id));

                const userWithRoles = {
                    ...currentUser!,
                    roles: userRoles.map(ur => ({ name: ur.roleName as RoleName })),
                };

                if (!isAdmin(userWithRoles)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You can only view your own roles",
                    });
                }
            }

            return await ctx.orm
                .select({
                    id: userRole.id,
                    userId: userRole.userId,
                    roleId: userRole.roleId,
                    roleName: role.name,
                    roleDescription: role.description,
                    createdAt: userRole.createdAt,
                })
                .from(userRole)
                .innerJoin(role, eq(userRole.roleId, role.id))
                .where(eq(userRole.userId, targetUserId));
        }),

    // Assign role to user (admin only)
    assignRole: adminProcedure
        .input(
            z.object({
                userId: z.string(),
                roleName: z.enum(["admin", "user", "moderator"]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { userId, roleName } = input;

            // Check if user exists
            const targetUser = await ctx.orm
                .select({ id: user.id })
                .from(user)
                .where(eq(user.id, userId))
                .get();

            if (!targetUser) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            // Get role by name
            const targetRole = await ctx.orm
                .select({ id: role.id })
                .from(role)
                .where(eq(role.name, roleName))
                .get();

            if (!targetRole) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });
            }

            // Check if user already has this role
            const existingUserRole = await ctx.orm
                .select({ id: userRole.id })
                .from(userRole)
                .where(and(eq(userRole.userId, userId), eq(userRole.roleId, targetRole.id)))
                .get();

            if (existingUserRole) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User already has this role",
                });
            }

            // Assign role
            const newUserRole = {
                id: crypto.randomUUID(),
                userId,
                roleId: targetRole.id,
                createdAt: new Date().toISOString(),
            };

            await ctx.orm.insert(userRole).values(newUserRole);

            return { success: true, userRole: newUserRole };
        }),

    // Remove role from user (admin only)
    removeRole: adminProcedure
        .input(
            z.object({
                userId: z.string(),
                roleName: z.enum(["admin", "user", "moderator"]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { userId, roleName } = input;

            // Get role by name
            const targetRole = await ctx.orm
                .select({ id: role.id })
                .from(role)
                .where(eq(role.name, roleName))
                .get();

            if (!targetRole) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });
            }

            // Remove role assignment
            const result = await ctx.orm
                .delete(userRole)
                .where(and(eq(userRole.userId, userId), eq(userRole.roleId, targetRole.id)));

            return { success: true };
        }),

    // Get current user with roles
    me: protectedProcedure.query(async ({ ctx }) => {
        const currentUser = ctx.honoCtx.get("user");

        const userRoles = await ctx.orm
            .select({
                id: role.id,
                name: role.name,
                description: role.description,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            })
            .from(userRole)
            .innerJoin(role, eq(userRole.roleId, role.id))
            .where(eq(userRole.userId, currentUser!.id));

        return {
            ...currentUser!,
            roles: userRoles,
        };
    }),
});
