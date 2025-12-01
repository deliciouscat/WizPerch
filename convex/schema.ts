/**
 * @fileoverview Vue + Convex + Clerk 인증 시스템의 데이터베이스 스키마 정의.
 *
 * 이 모듈은 다음을 포함한 모든 데이터베이스 테이블의 구조를 정의합니다:
 * - 인증된 사용자 프로필을 저장하는 Users 테이블
 * - 사용자 생성 콘텐츠를 저장하는 Messages 테이블
 *
 * 스키마는 성능 최적화를 위한 적절한 인덱싱과
 * 데이터 무결성 제약 조건을 포함합니다.
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // 사용자 테이블
    users: defineTable({
        clerkId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
        createdAt: v.number(),
    }).index('by_clerk_id', ['clerkId']),

    // 컬렉션 테이블
    collections: defineTable({
        collectionId: v.id('collections'),
        userId: v.id('users'),
        title: v.string(),
        icon: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_collection_id', ['collectionId'])
        .index('by_user_id', ['userId']),

    // 페이지 테이블
    pages: defineTable({
        pageId: v.id('pages'),
        url: v.string(),
        title: v.string(),
        passage: v.string(), // 페이지의 메모/요약
        tags: v.array(v.string()),
        favicon: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index('by_page_id', ['pageId']),

    // 댓글 테이블
    comments: defineTable({
        userId: v.id('users'),
        pageId: v.id('pages'),
        content: v.string(),
        createdAt: v.number(),
    })
        .index('by_user_id', ['userId'])
        .index('by_page_id', ['pageId']),

    // 저장된 탭 테이블
    savedTabs: defineTable({
        userId: v.id('users'),
        tabs: v.array(v.object({
            url: v.string(),
            favicon: v.optional(v.string()),
            title: v.optional(v.string()),
        })),
        createdAt: v.number(),
    })
        .index('by_user_id', ['userId'])
        .index('by_created_at', ['createdAt']),
})