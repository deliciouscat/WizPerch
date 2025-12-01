/**
 * @fileoverview 페이지 관리 함수
 *
 * 이 모듈은 페이지에 대한 CRUD 작업을 제공합니다:
 * - URL로 페이지 조회 또는 생성
 * - 페이지 정보 업데이트
 *
 * @version 1.0.0
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * URL로 페이지를 찾거나 생성합니다.
 *
 * @param ctx - Convex 컨텍스트
 * @param args.url - 페이지 URL
 * @param args.title - 페이지 제목
 * @param args.passage - 페이지 요약/메모
 * @param args.tags - 페이지 태그
 * @param args.favicon - 파비콘 URL (선택적)
 * @returns Promise<Id<"pages">> - 페이지 ID
 */
export const getOrCreatePage = mutation({
  args: {
    url: v.string(),
    title: v.string(),
    passage: v.string(),
    tags: v.array(v.string()),
    favicon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // URL로 기존 페이지 찾기
    const existingPage = await ctx.db
      .query("pages")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();

    if (existingPage) {
      // 기존 페이지 업데이트
      await ctx.db.patch(existingPage._id, {
        title: args.title,
        passage: args.passage,
        tags: args.tags,
        favicon: args.favicon,
        updatedAt: Date.now(),
      });
      return existingPage._id;
    }

    // 새 페이지 생성
    const pageId = await ctx.db.insert("pages", {
      url: args.url,
      title: args.title,
      passage: args.passage,
      tags: args.tags,
      favicon: args.favicon,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return pageId;
  },
});

/**
 * URL로 페이지를 조회합니다.
 *
 * @param ctx - Convex 컨텍스트
 * @param args.url - 페이지 URL
 * @returns Promise<{ _id: Id<"pages">, ... } | null> - 페이지 데이터 또는 null
 */
export const getPageByUrl = query({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pages")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
  },
});

