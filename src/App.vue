<template>
    <div>
        <!-- Show loading state while Clerk is determining authentication -->
        <div v-if="!isLoaded" class="loading-container">
            <LoadingSpinner size="large" text="Initializing..." />
        </div>

        <!-- Show app content once authentication state is determined -->
        <div v-else>
            <header>
                <h1>My App</h1>
                <UserButton v-if="user" />
                <SignInButton v-else />
            </header>

            <main>
                <ConvexProvider v-if="user">
                    <UserProfile />
                </ConvexProvider>
                <p v-else>Please sign in</p>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview 메인 애플리케이션 컴포넌트
 *
 * 이것은 Vue + Convex + Clerk 인증 애플리케이션의 루트 컴포넌트입니다.
 * 메인 애플리케이션 구조를 제공하고 다른 컴포넌트 간의 인증 흐름을 처리합니다.
 *
 * 주요 책임:
 * - 헤더와 메인 콘텐츠를 포함한 메인 애플리케이션 레이아웃 렌더링
 * - 사용자 상태에 따라 인증 컴포넌트를 조건부로 렌더링
 * - 전체 애플리케이션의 진입점 제공
 * - 전체 사용자 경험 흐름 관리
 * - 인증 UI 깜빡임을 방지하기 위한 로딩 상태 처리
 *
 * 컴포넌트 구조:
 * - 인증 상태가 결정되는 동안의 로딩 상태
 * - 앱 제목과 인증 버튼이 있는 헤더
 * - 인증 상태에 따라 조건부 렌더링되는 메인 콘텐츠 영역
 * - 인증된 사용자를 위한 ConvexProvider 래퍼
 * - 인증된 사용자를 위한 UserProfile 표시
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */

import { SignInButton, UserButton, useUser } from "@clerk/vue";
import ConvexProvider from "./components/convex-provider/ConvexProvider.vue";
import UserProfile from "./components/convex-provider/UserProfile.vue";
import LoadingSpinner from "./components/convex-provider/LoadingSpinner.vue";

/**
 * 현재 사용자 상태에 액세스하기 위한 Clerk 인증 훅.
 *
 * 이 훅은 현재 사용자의 인증 상태에 대한 반응형 액세스를 제공합니다.
 * 사용자 객체는 사용자가 로그인하지 않았을 때 null이 되고,
 * 사용자가 인증되었을 때 사용자 데이터를 포함합니다.
 *
 * isLoaded 속성은 Clerk가 인증 상태 결정을 완료했는지 여부를 나타내며,
 * 페이지 새로고침 중 UI 깜빡임을 방지합니다.
 *
 * @type {import('@clerk/vue').UseUserReturn}
 */
const { user, isLoaded } = useUser();
</script>

<style scoped>
/**
 * 인증 상태 결정을 위한 로딩 컨테이너 스타일.
 * Clerk가 사용자가 인증되었는지 여부를 결정하는 동안
 * 깔끔하고 중앙 정렬된 로딩 경험을 제공합니다.
 */
.loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f8f9fa;
}
</style>
