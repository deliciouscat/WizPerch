<template>
  <!-- 사용자가 로그인하지 않은 경우 -->
  <div v-if="!isAuthenticated" class="profile-not-authenticated">
    <div class="signin-container">
      <h2>로그인이 필요합니다</h2>
      <p>프로필을 보려면 먼저 로그인해주세요.</p>
      <SignIn />
    </div>
  </div>

  <!-- Convex 인증이 완료되지 않은 경우 (로그인은 했지만 Convex 인증이 완료되지 않음) -->
  <div v-else-if="!convexAuthSet" class="profile-not-authenticated">
    <div class="signin-container">
      <h2>인증 초기화 중...</h2>
      <p>Convex 인증을 설정하는 중입니다. 잠시만 기다려주세요.</p>
      <LoadingSpinner size="medium" text="인증 설정 중..." />
    </div>
  </div>

  <!-- 닉네임 설정이 필요한 경우 -->
  <NicknameSetup v-else-if="needsNicknameSetup" @complete="handleNicknameComplete" />

  <div v-else-if="isLoading" class="profile-loading">
    <LoadingSpinner size="medium" text="Loading profile..." />
  </div>

  <div v-else-if="error" class="profile-error">
    <p>프로필을 불러오는 중 오류가 발생했습니다.</p>
    <p v-if="errorId" class="error-id">에러 ID: {{ errorId }}</p>
    <p class="error-hint">문제가 계속되면 에러 ID를 포함하여 문의해주세요.</p>
    <button @click="handleRetry" class="retry-button">다시 시도</button>
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
      <button @click="handleSignOut" class="signout-button">
        로그아웃
      </button>
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
import { onMounted, computed, ref, watch, inject, type ComputedRef } from "vue";
import { SignOutButton, SignIn, useUser, useAuth } from "@clerk/vue";
import { PhArrowLeft } from "@phosphor-icons/vue";
import { useAppStore } from "@/stores/app";
import { logger, isDev } from "@/utils/logger";
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
/**
 * Convex 인증 준비 상태를 부모 컴포넌트에서 가져옵니다.
 * 이 상태가 true가 될 때까지 쿼리를 실행하지 않습니다.
 */
const convexReady = inject<ComputedRef<boolean>>("convexReady", computed(() => false));

/**
 * Convex 인증 설정 완료 상태를 부모 컴포넌트에서 가져옵니다.
 * 이 상태가 true일 때만 쿼리를 실행해야 합니다.
 */
const convexAuthSet = inject<ComputedRef<boolean>>("convexAuthSet", computed(() => false));

const appStore = useAppStore();

// 에러 ID 저장
const errorId = ref<string | null>(null);

// Clerk 사용자 확인
const { user: clerkUser, isLoaded: clerkIsLoaded } = useUser();
const { signOut } = useAuth();
const isAuthenticated = computed(() => {
  const auth = clerkIsLoaded.value && !!clerkUser.value;
  logger.debug('UserProfile', '인증 상태 확인', {
    clerkIsLoaded: clerkIsLoaded.value,
    hasUser: !!clerkUser.value,
    isAuthenticated: auth
  });
  return auth;
});

const { mutate: getOrCreateUser, isPending: isCreatingUser } =
  useConvexMutation(api.users.getOrCreateUser);

/**
 * 쿼리 실행 조건을 계산합니다.
 * convexAuthSet이 true일 때만 쿼리를 실행해야 합니다.
 */
const shouldFetchUser = computed(() => {
  return convexAuthSet.value && isAuthenticated.value;
});

/**
 * 현재 사용자의 프로필 데이터를 가져오기 위한 Convex query 훅.
 *
 * 이 쿼리는 Convex 데이터베이스에서 인증된 사용자의 프로필 정보를
 * 자동으로 가져옵니다. 데이터는 반응형이며 사용자 프로필이 변경되면
 * 자동으로 업데이트됩니다.
 *
 * 주의: convex-vue의 useConvexQuery는 조건부 실행을 지원하지 않으므로,
 * 쿼리는 항상 실행됩니다. 하지만 convexAuthSet이 false일 때는
 * 쿼리 결과를 무시하고 로딩 상태를 표시하지 않습니다.
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
 * 실제 로딩 상태를 계산합니다.
 * convexAuthSet이 false이거나 shouldFetchUser가 false이면 로딩하지 않습니다.
 * 단, 사용자가 로그인했지만 convexAuthSet이 false인 경우는 인증 초기화 중이므로 로딩 상태로 표시합니다.
 */
const isLoading = computed(() => {
  // 사용자가 로그인하지 않았으면 로딩하지 않음
  if (!isAuthenticated.value) {
    return false;
  }
  // 사용자가 로그인했지만 convexAuthSet이 false이면 인증 초기화 중이므로 로딩 상태로 표시
  if (!convexAuthSet.value) {
    return true;
  }
  // 그 외의 경우 실제 로딩 상태 반환
  return isFetchingUser.value || isCreatingUser.value;
});

/**
 * convexAuthSet 상태를 모니터링하여 쿼리 실행 시점을 로깅합니다.
 */
watch([convexAuthSet, convexReady, isAuthenticated], ([authSet, ready, authenticated]) => {
  logger.info('UserProfile', '인증 상태 변화', {
    convexAuthSet: authSet,
    convexReady: ready,
    isAuthenticated: authenticated,
    canFetchUser: authSet && ready && authenticated
  });
}, { immediate: true });

// 상태 변화 추적 (개발 환경에서만 상세 로그)
watch([isFetchingUser, isCreatingUser, currentUser, error], ([fetching, creating, user, err]) => {
  logger.debug('UserProfile', '상태 변화', {
    isFetchingUser: fetching,
    isCreatingUser: creating,
    currentUser: user ? {
      _id: user._id,
      name: user.name,
      email: user.email,
      clerkId: (user as any).clerkId,
      createdAt: user.createdAt
    } : null,
    error: err ? {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    } : null,
    timestamp: new Date().toISOString()
  });

  // 에러 발생 시 프로덕션에서도 로깅 (민감한 정보 마스킹)
  if (err) {
    const id = logger.error('UserProfile', '프로필 로드 중 오류 발생', err);
    errorId.value = id;
    // TODO: 에러 추적 서비스(Sentry 등)에 전송
  } else {
    errorId.value = null;
  }
}, { immediate: true, deep: true });

// getCurrentUser 쿼리 상태 추적
watch(() => isFetchingUser.value, (fetching, wasFetching) => {
  logger.debug('UserProfile', 'getCurrentUser 쿼리 상태 변화', {
    wasFetching,
    isFetching: fetching,
    changed: wasFetching !== fetching,
    currentUser: currentUser.value ? {
      _id: currentUser.value._id,
      name: currentUser.value.name,
      email: currentUser.value.email
    } : '없음',
    error: error.value ? {
      message: error.value instanceof Error ? error.value.message : String(error.value)
    } : null,
    timestamp: new Date().toISOString()
  });

  // 5초 이상 로딩 중이면 경고 (프로덕션에서도 표시)
  // 단, convexAuthSet이 true일 때만 경고 (인증이 완료된 후에만 쿼리가 실행되어야 함)
  if (fetching && convexAuthSet.value) {
    setTimeout(() => {
      if (isFetchingUser.value && convexAuthSet.value) {
        logger.warn('UserProfile', 'getCurrentUser 쿼리가 5초 이상 로딩 중입니다', {
          isFetchingUser: isFetchingUser.value,
          currentUser: currentUser.value ? '있음' : '없음',
          hasError: !!error.value,
          convexAuthSet: convexAuthSet.value
        });
      }
    }, 5000);
  }
}, { immediate: true });

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
 * 로그아웃 핸들러
 */
async function handleSignOut() {
  try {
    await signOut.value();
  } catch (error) {
    logger.error('UserProfile', '로그아웃 실패', error);
  }
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
async function handleRetry() {
  errorId.value = null;
  const id = await retryLoad();
  if (id) {
    errorId.value = id;
  }
}

const retryLoad = async (): Promise<string | null> => {
  try {
    logger.info('UserProfile', '프로필 재시도 시작');
    await getOrCreateUser({});
    logger.info('UserProfile', '프로필 재시도 완료');
    return null;
  } catch (error) {
    return logger.error('UserProfile', '프로필 재시도 중 오류 발생', error);
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
  logger.debug('UserProfile', '컴포넌트 마운트됨', {
    isAuthenticated: isAuthenticated.value,
    convexReady: convexReady.value,
    clerkUser: clerkUser.value ? {
      id: clerkUser.value.id,
      email: clerkUser.value.primaryEmailAddress?.emailAddress
    } : null
  });

  // 인증되지 않았거나 Convex가 준비되지 않았으면 getOrCreateUser 호출하지 않음
  if (!isAuthenticated.value || !convexReady.value) {
    logger.debug('UserProfile', '인증 또는 Convex 준비 상태가 충족되지 않아 getOrCreateUser 호출하지 않음', {
      isAuthenticated: isAuthenticated.value,
      convexReady: convexReady.value
    });
    
    // Convex가 준비될 때까지 대기
    if (!convexReady.value && isAuthenticated.value) {
      logger.debug('UserProfile', 'Convex 준비 대기 중...');
      const unwatch = watch(convexReady, (ready) => {
        if (ready) {
          unwatch();
          // Convex가 준비되면 getOrCreateUser 호출
          handleGetOrCreateUser();
        }
      });
    }
    return;
  }

  await handleGetOrCreateUser();
});

/**
 * getOrCreateUser를 호출하는 헬퍼 함수
 */
async function handleGetOrCreateUser() {
  try {
    logger.info('UserProfile', 'getOrCreateUser 호출 시작');
    const userId = await getOrCreateUser({});
    logger.info('UserProfile', 'getOrCreateUser 완료', { userId });

    // 개발 환경에서만 추가 디버깅
    if (isDev) {
      logger.debug('UserProfile', 'getOrCreateUser 완료 후 1초 대기...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      logger.debug('UserProfile', '대기 완료, getCurrentUser 상태 확인', {
        isFetchingUser: isFetchingUser.value,
        currentUser: currentUser.value ? '있음' : '없음',
        hasError: !!error.value
      });
    }
  } catch (error) {
    const errorId = logger.error('UserProfile', '사용자 생성/업데이트 중 오류 발생', error);
    // TODO: 에러 추적 서비스에 전송 및 사용자에게 에러 ID 표시
  }
}
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
  margin-bottom: 8px;
}

.error-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--grey-lv3);
  background-color: var(--grey-lv1);
  padding: 4px 8px;
  border-radius: 0;
  display: inline-block;
  margin: 8px 0;
}

.error-hint {
  color: var(--grey-lv3);
  font-size: 12px;
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

.profile-not-authenticated {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.signin-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  width: 100%;
  padding: 20px;
}

.signin-container h2 {
  color: var(--font-black);
  margin: 0 0 8px 0;
  font-size: 24px;
}

.signin-container p {
  color: var(--grey-lv3);
  margin: 0 0 24px 0;
  font-size: 14px;
  text-align: center;
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
