<template>
  <div v-if="isLoading" class="profile-loading">
    <LoadingSpinner size="medium" text="Loading profile..." />
  </div>

  <div v-else-if="error" class="profile-error">
    <p>Error loading profile: {{ error }}</p>
    <button @click="retryLoad" class="retry-button">Retry</button>
  </div>

  <div v-else-if="currentUser" class="profile-content">
    <h2>Welcome, {{ currentUser.name }}!</h2>
    <p>{{ currentUser.email }}</p>
  </div>

  <div v-else class="profile-empty">
    <p>No profile data found.</p>
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
import { onMounted, computed } from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";

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

/**
 * 컴포넌트가 로딩 상태인지 여부를 결정하는 계산된 속성.
 *
 * 데이터가 가져와지거나 사용자 레코드가 생성/업데이트되는 동안
 * 프로필 콘텐츠를 렌더링하는 것을 방지합니다.
 */
const isLoading = computed(() => isFetchingUser.value || isCreatingUser.value);

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
  padding: 20px;
  text-align: center;
}

.profile-content h2 {
  color: #212529;
  margin-bottom: 8px;
}

.profile-content p {
  color: #6c757d;
  margin: 0;
}
</style>
