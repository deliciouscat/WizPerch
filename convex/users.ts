/**
 * @fileoverview Vue + Convex + Clerk 인증 시스템의 사용자 관리 함수.
 *
 * 이 모듈은 사용자 데이터에 대한 CRUD 작업을 제공하며, 다음을 포함합니다:
 * - Clerk 인증에서 새 사용자 생성
 * - 현재 사용자 정보 조회
 * - 사용자 프로필 데이터 업데이트
 *
 * 모든 함수는 적절한 인증 확인과 데이터 검증을 포함합니다.
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */

import { mutation, query } from "./_generated/server";

/**
 * 데이터베이스에 새 사용자를 생성하거나 기존 사용자 ID를 반환합니다.
 *
 * 이 함수는 사용자가 Clerk로 처음 인증할 때 호출됩니다.
 * 주어진 Clerk ID로 사용자가 이미 존재하는지 확인하고,
 * 기존 사용자의 ID를 반환하거나 새 사용자 레코드를 생성합니다.
 *
 * @param ctx - 인증 및 데이터베이스 액세스를 포함하는 Convex 컨텍스트
 * @returns Promise<string> - 사용자 ID (기존 또는 새로 생성된)
 *
 * @throws {Error} 사용자가 인증되지 않은 경우
 *
 * @example
 * ```typescript
 * const userId = await getOrCreateUser();
 * ```
 */
export const getOrCreateUser = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

        if (existingUser) return existingUser._id;

        return await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "",
        name: `${identity.givenName || ""} ${identity.familyName || ""}`.trim(),
        createdAt: Date.now(),
        });
    },
    });

    /**
     * 현재 인증된 사용자의 프로필 정보를 조회합니다.
     *
     * 이 쿼리 함수는 Clerk 신원을 기반으로 현재 인증된 사용자의
     * 사용자 데이터를 가져옵니다. 사용자가 인증되지 않았거나
     * 데이터베이스에 사용자가 존재하지 않으면 null을 반환합니다.
     *
     * @param ctx - 인증 및 데이터베이스 액세스를 포함하는 Convex 컨텍스트
     * @returns Promise<User | null> - 현재 사용자의 프로필 데이터 또는 찾을 수 없는 경우 null
     *
     * @example
     * ```typescript
     * const currentUser = await getCurrentUser();
     * if (currentUser) {
     *   console.log(`Welcome, ${currentUser.name}!`);
     * }
     * ```
     */
    export const getCurrentUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    },
    });

    /**
     * 사용자 프로필 데이터를 업데이트합니다.
     *
     * 이 mutation 함수는 사용자 데이터를 업데이트합니다.
     * 인증된 사용자가 자신의 데이터만 업데이트할 수 있도록 보장합니다.
     *
     * @param ctx - 인증 및 데이터베이스 액세스를 포함하는 Convex 컨텍스트
     * @param args - 업데이트할 사용자 데이터를 포함하는 객체
     * @param args.name - 사용자의 표시 이름 (선택적)
     * @param args.email - 사용자의 이메일 주소 (선택적)
     * @returns Promise<Id<"users">> - 업데이트된 사용자의 ID
     *
     * @throws {Error} 사용자가 인증되지 않은 경우
     * @throws {Error} 사용자를 찾을 수 없는 경우
     * @throws {Error} 업데이트할 필드가 없는 경우
     *
     * @example
     * ```typescript
     * const userId = await updateUserData({
     *   name: "John Doe"
     * });
     * ```
     */
    export const updateUserData = mutation({
    handler: async (
        ctx,
        args: { name?: string; email?: string }
    ) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // 현재 사용자 찾기
        const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

        if (!existingUser) {
        throw new Error("User not found. Please sign in again.");
        }

        // 업데이트할 필드 준비
        const updates: { name?: string; email?: string } = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.email !== undefined) {
            if (!args.email.includes("@")) {
                throw new Error("Invalid email format");
            }
            updates.email = args.email;
        }

        if (Object.keys(updates).length === 0) {
            throw new Error("No fields to update");
        }

        // 기존 사용자 업데이트
        await ctx.db.patch(existingUser._id, updates);
        return existingUser._id;
    },
});
