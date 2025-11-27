<template>
  <!-- 닉네임 설정이 필요한 경우 -->
  <NicknameSetup v-if="needsNicknameSetup" @complete="handleNicknameComplete" />

  <div v-else-if="isLoading" class="profile-loading">
    <LoadingSpinner size="medium" text="Loading profile..." />
  </div>

  <div v-else-if="error" class="profile-error">
    <p>Error loading profile: {{ error }}</p>
    <button @click="retryLoad" class="retry-button">Retry</button>
  </div>

  <div v-else-if="currentUser" class="profile-content">
    <div class="profile-nav">
      <button @click="goBack" class="back-button">
        <PhArrowLeft :size="20" weight="bold" />
        <span>뒤로가기</span>
      </button>
    </div>

    <div class="profile-header">
      <div class="avatar-placeholder">
        {{ getInitials(currentUser.name) }}
      </div>
      <h2>{{ currentUser.name }}</h2>
      <p class="email">{{ currentUser.email }}</p>
    </div>

    <div class="profile-stats">
      <div class="stat-item">
        <span class="stat-label">가입일</span>
        <span class="stat-value">{{ formatDate(currentUser.createdAt) }}</span>
      </div>
    </div>

    <div class="profile-actions">
      <SignOutButton>
        <template #default="{ signOut }">
          <button @click="signOut" class="signout-button">
            로그아웃
          </button>
        </template>
      </SignOutButton>
    </div>
  </div>

  <div v-else class="profile-empty">
    <p>프로필 정보를 불러올 수 없습니다.</p>
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview UserProfile 컴포넌트
 *
 * 이 컴포넌트는 현재 인증된 사용자의 프로필 정보를 표시합니다.
 * Convex 백엔드에서 사용자 데이터를 자동으로 가져와
 * 사용자의 이름과 이메일 주소를 표시합니다.
 *
 * 주요 기능:
 * - 컴포넌트 마운트 시 현재 사용자 데이터 자동 가져오기
 * - Convex 데이터베이스에서 사용자 레코드 생성 또는 업데이트
 * - 깔끔한 형식으로 사용자 프로필 정보 표시
 * - 로딩 및 오류 상태를 우아하게 처리
 * - 로딩 상태 동안 불필요한 API 호출 방지
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */

import { useConvexQuery, useConvexMutation } from "convex-vue";
import { api } from "../../../convex/_generated/api";
import { onMounted, computed, ref } from "vue";
import { SignOutButton } from "@clerk/vue";
import { PhArrowLeft } from "@phosphor-icons/vue";
import { useAppStore } from "@/stores/app";
import LoadingSpinner from "./LoadingSpinner.vue";
import NicknameSetup from "./NicknameSetup.vue";

/**
 * 사용자 데이터를 생성하거나 업데이트하기 위한 Convex mutation 훅.
 *
 * 이 mutation은 컴포넌트가 마운트될 때 호출되어
 * 현재 사용자가 Convex 데이터베이스에 존재하는지 확인합니다.
 * 사용자가 존재하지 않으면 새 레코드를 생성하고,
 * 존재하면 기존 사용자 ID를 반환합니다.
 *
 * @type {import('convex-vue').UseConvexMutationReturn}
 */
const { mutate: getOrCreateUser, isPending: isCreatingUser } =
  useConvexMutation(api.users.getOrCreateUser);

/**
 * 현재 사용자의 프로필 데이터를 가져오기 위한 Convex query 훅.
 *
 * 이 쿼리는 Convex 데이터베이스에서 인증된 사용자의 프로필 정보를
 * 자동으로 가져옵니다. 데이터는 반응형이며 사용자 프로필이 변경되면
 * 자동으로 업데이트됩니다.
 *
 * @type {import('convex-vue').UseConvexQueryReturn}
 */
const {
  data: currentUser,
  error,
  isPending: isFetchingUser,
  suspense,
} = useConvexQuery(api.users.getCurrentUser, {});

const appStore = useAppStore();

/**
 * 컴포넌트가 로딩 상태인지 여부를 결정하는 계산된 속성.
 *
 * 데이터가 가져와지거나 사용자 레코드가 생성/업데이트되는 동안
 * 프로필 콘텐츠를 렌더링하는 것을 방지합니다.
 */
const isLoading = computed(() => isFetchingUser.value || isCreatingUser.value);

/**
 * 닉네임 설정이 필요한지 확인하는 계산된 속성.
 * 사용자가 존재하지만 이름이 없거나 비어있으면 true를 반환합니다.
 */
const needsNicknameSetup = computed(() => {
  if (isLoading.value || error.value) return false;
  if (!currentUser.value) return false;
  return !currentUser.value.name || currentUser.value.name.trim() === '';
});

/**
 * 날짜를 포맷하는 함수
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 닉네임 설정 완료 핸들러
 */
function handleNicknameComplete() {
  // 닉네임 설정이 완료되면 자동으로 쿼리가 재실행되어 업데이트된 사용자 정보를 가져옵니다.
}

/**
 * 이름에서 이니셜을 추출하는 함수
 */
function getInitials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * 뒤로가기 함수
 */
function goBack() {
  appStore.setOverlayMode(null);
}

/**
 * 오류 발생 시 사용자 데이터를 다시 로드하기 위한 재시도 함수.
 *
 * 초기 로드 중 오류가 발생한 경우 사용자가 프로필 데이터를
 * 다시 로드하기 위해 이 함수를 호출할 수 있습니다.
 *
 * @async
 * @returns {Promise<void>}
 */
const retryLoad = async () => {
  try {
    await getOrCreateUser({});
  } catch (error) {
    console.error("Error retrying user load:", error);
  }
};

/**
 * 컴포넌트가 마운트될 때 실행되는 생명주기 훅.
 *
 * 이 함수는 getOrCreateUser mutation을 호출하여 현재 사용자가
 * Convex 데이터베이스에 존재하는지 확인합니다. 이는 사용자가
 * Clerk로 인증했지만 아직 Convex 데이터베이스에 해당 레코드가
 * 없을 수 있기 때문에 필요합니다.
 *
 * 이 함수는 컴포넌트가 마운트될 때 한 번만 호출되어
 * 재렌더링 중 불필요한 API 호출을 방지합니다.
 *
 * @async
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * onMounted(async () => {
 *   await getOrCreateUser({});
 * });
 * ```
 */
onMounted(async () => {
  try {
    await getOrCreateUser({});
  } catch (error) {
    console.error("Error creating/updating user:", error);
  }
});
</script>

<style scoped>
/**
 * 프로필 데이터 가져오기를 위한 로딩 상태 스타일.
 * 사용자 프로필 데이터가 로드되는 동안 시각적 피드백을 제공합니다.
 */
.profile-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  padding: 20px;
}

/**
 * 프로필 로딩 실패를 위한 오류 상태 스타일.
 * 오류 메시지를 표시하고 재시도 기능을 제공합니다.
 */
.profile-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  padding: 20px;
  text-align: center;
}

.profile-error p {
  color: #dc3545;
  margin-bottom: 16px;
}

/**
 * 오류 복구를 위한 재시도 버튼 스타일.
 * 사용자가 프로필을 다시 로드할 수 있도록 명확한 행동 유도 버튼을 제공합니다.
 */
.retry-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #0056b3;
}

/**
 * 프로필 데이터를 찾을 수 없을 때의 빈 상태 스타일.
 * 사용자가 존재하지만 프로필 데이터가 없을 때 피드백을 제공합니다.
 */
.profile-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  padding: 20px;
  text-align: center;
  color: #6c757d;
}

/**
 * 사용자 정보를 표시하기 위한 프로필 콘텐츠 스타일.
 * 사용자 프로필 데이터를 위한 깔끔하고 읽기 쉬운 레이아웃을 제공합니다.
 */
.profile-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background-color: var(--background);
}

.profile-nav {
  padding: 16px 20px;
  border-bottom: 2px solid var(--grey-lv2);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2px solid var(--grey-lv2);
  border-radius: 0;
  background-color: var(--background);
  color: var(--font-black);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: var(--grey-lv1);
}

.back-button svg {
  fill: var(--font-black);
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 20px;
  text-align: center;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--main);
  color: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
}

.profile-header h2 {
  color: var(--font-black);
  margin: 0 0 8px 0;
  font-size: 24px;
}

.profile-header .email {
  color: var(--grey-lv3);
  margin: 0;
  font-size: 14px;
}

.profile-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 20px;
  padding: 20px;
  border: 2px solid var(--grey-lv2);
  border-radius: 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--grey-lv3);
  font-size: 14px;
}

.stat-value {
  color: var(--font-black);
  font-size: 14px;
  font-weight: bold;
}

.profile-actions {
  margin: auto 20px 20px;
  padding-top: 20px;
}

.signout-button {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--notification);
  border-radius: 0;
  background-color: var(--background);
  color: var(--notification);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.signout-button:hover {
  background-color: var(--notification);
  color: var(--background);
}
</style>
