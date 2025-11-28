/**
 * @fileoverview 댓글 관리 함수
 *
 * 이 모듈은 댓글에 대한 CRUD 작업을 제공합니다:
 * - 페이지별 댓글 조회 (무한 스크롤 지원)
 * - 댓글 생성
 * - 댓글 삭제
 *
 * @version 1.0.0
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

/**
 * 특정 페이지의 댓글을 페이지네이션으로 가져옵니다.
 * 최신 댓글이 먼저 표시됩니다.
 *
 * @param ctx - Convex 컨텍스트
 * @param args.pageId - 페이지 ID
 * @param args.paginationOpts - 페이지네이션 옵션
 * @returns Promise<PaginationResult<Comment>> - 댓글 목록과 페이지네이션 정보
 */
export const getCommentsByPage = query({
  args: {
    pageId: v.id("pages"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_page_id", (q) => q.eq("pageId", args.pageId))
      .order("desc") // 최신 댓글이 먼저
      .paginate(args.paginationOpts);

    // 각 댓글에 사용자 정보를 추가
    const commentsWithUser = await Promise.all(
      comments.page.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          userName: user?.name || "Unknown User",
        };
      })
    );

    return {
      ...comments,
      page: commentsWithUser,
    };
  },
});

/**
 * 새 댓글을 생성합니다.
 *
 * @param ctx - Convex 컨텍스트
 * @param args.pageId - 페이지 ID
 * @param args.content - 댓글 내용
 * @returns Promise<Id<"comments">> - 생성된 댓글 ID
 *
 * @throws {Error} 사용자가 인증되지 않은 경우
 * @throws {Error} 댓글 내용이 비어있는 경우
 */
export const createComment = mutation({
  args: {
    pageId: v.id("pages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!args.content.trim()) {
      throw new Error("Comment content cannot be empty");
    }

    // 현재 사용자 찾기
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // 댓글 생성
    const commentId = await ctx.db.insert("comments", {
      userId: user._id,
      pageId: args.pageId,
      content: args.content,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/**
 * 댓글을 삭제합니다.
 * 댓글 작성자만 삭제할 수 있습니다.
 *
 * @param ctx - Convex 컨텍스트
 * @param args.commentId - 댓글 ID
 * @returns Promise<void>
 *
 * @throws {Error} 사용자가 인증되지 않은 경우
 * @throws {Error} 댓글을 찾을 수 없는 경우
 * @throws {Error} 권한이 없는 경우
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    // 현재 사용자 찾기
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // 댓글 작성자 확인
    if (comment.userId !== user._id) {
      throw new Error("Unauthorized: You can only delete your own comments");
    }

    await ctx.db.delete(args.commentId);
  },
});

