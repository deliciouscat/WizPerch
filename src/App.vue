<template>
  <div>
    <!-- Show minimal loading state while Clerk is determining authentication -->
    <div v-if="!isLoaded" class="loading-container">
      <LoadingSpinner size="large" text="초기화 중..." />
    </div>

    <!-- Show app content once authentication state is determined -->
    <ConvexProvider v-else>
      <div class="app-container">
        <AppHeader :initial-mode="appStore.currentMode" :toolbar-suggestions="toolbarSuggestions"
          :user-id="user?.id || null" :user-nickname="user?.fullName || 'User'" :user-avatar="user?.imageUrl || ''"
          @mode-change="handleModeChange" @toolbar-submit="handleToolbarSubmit" />

        <main class="main-content">
          <!-- Overlay가 활성화되면 UserProfile 또는 Settings 표시 -->
          <UserProfile v-if="appStore.overlayMode === 'account'" />
          <Settings v-else-if="appStore.overlayMode === 'settings'" />

          <!-- 일반 모드 -->
          <ExplorePlane v-else-if="appStore.currentMode === 'explore'" :pages="samplePages"
            :toolbar-output="appStore.toolbarOutput" :comment-author="commentAuthor" @save-tabs="handleSaveTabs"
            @navigate-pending="handleNavigatePending" />

          <PendingPlane v-else-if="appStore.currentMode === 'pending'" :tabs="savedTabs" @open-tabs="handleOpenTabs"
            @delete-tabs="handleDeleteTabs" />

          <div v-else class="error-message">
            Error: Invalid mode
          </div>
        </main>
      </div>
    </ConvexProvider>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useUser } from '@clerk/vue'
import { useAppStore } from '@/stores/app'
import ConvexProvider from './components/convex-provider/ConvexProvider.vue'
import AppHeader from './components/app-header/AppHeader.vue'
import ExplorePlane from './components/explore-plane/ExplorePlane.vue'
import PendingPlane from './components/pending-plane/PendingPlane.vue'
import UserProfile from './components/convex-provider/UserProfile.vue'
import Settings from './components/convex-provider/Settings.vue'
import LoadingSpinner from './components/convex-provider/LoadingSpinner.vue'
import type { PageData, SavedTabGroup, ToolbarOutput } from '@/types'
import querySuggestions from './components/explore-plane/query_suggestions.json'

const { user, isLoaded } = useUser()
const appStore = useAppStore()


// Sample data (실제로는 Convex에서 가져올 것)
const samplePages = ref<PageData[]>([
  {
    title: 'Example Page',
    description: 'This is an example page',
    favicon: 'https://example.com/favicon.ico',
    url: 'https://example.com',
    keyword: ['example', 'test']
  }
])

const savedTabs = ref<SavedTabGroup[]>([])

const toolbarSuggestions = querySuggestions

const commentAuthor = {
  nickname: user.value?.fullName || 'User',
  epithet: 'Developer'
}

// Handlers
function handleModeChange(mode: 'explore' | 'pending') {
  appStore.setMode(mode)
}

function handleToolbarSubmit(output: ToolbarOutput) {
  appStore.setToolbarOutput(output)
}

async function handleSaveTabs(tabs: { save_date: string; pages: PageData[] }) {
  // TODO: Convex API 호출
  console.log('Saving tabs:', tabs)
  savedTabs.value.push(tabs as SavedTabGroup)
}

function handleNavigatePending() {
  appStore.setMode('pending')
}

// handleSubmitComment와 handleCommentExpand는 이제 BottomSheet 내부에서 처리됨

function handleOpenTabs(urls: string[]) {
  urls.forEach(url => {
    window.open(url, '_blank')
  })
}

function handleDeleteTabs(saveDate: string) {
  savedTabs.value = savedTabs.value.filter(tab => tab.save_date !== saveDate)
}

// 로그인 완료 감지 및 탐색하기 모드로 리다이렉트
let loginCheckInterval: number | null = null

function checkLoginComplete() {
  chrome.storage.local.get(['loginComplete', 'loginCompleteTime'], (result) => {
    if (result.loginComplete) {
      console.log('로그인 완료 플래그 감지. 앱을 새로고침하여 로그인 상태를 반영합니다.');

      // 플래그 삭제 후 리로드
      chrome.storage.local.remove(['loginComplete', 'loginCompleteTime', 'loginCheckNeeded'], () => {
        // 앱 새로고침 (가장 확실한 상태 동기화 방법)
        // 새로고침 후에는 onMounted에서 setMode('explore')가 실행되어 탐색하기 화면으로 이동함
        window.location.reload();
      });

      // 체크 인터벌 정리
      if (loginCheckInterval !== null) {
        clearInterval(loginCheckInterval)
        loginCheckInterval = null
      }
    }
  })
}

// 사용자 인증 상태 변화 감지하여 탐색하기 모드로 리다이렉트
watch([user, isLoaded], ([newUser, newIsLoaded], [oldUser, oldIsLoaded]) => {
  // 로그인 완료 감지: 이전에는 사용자가 없었는데 지금은 있음
  if (newIsLoaded && !oldUser && newUser) {
    console.log('사용자 로그인 감지, 탐색하기 모드로 리다이렉트')

    // 오버레이 모드 닫기
    appStore.setOverlayMode(null)

    // 탐색하기 모드로 설정
    appStore.setMode('explore')
  }
}, { immediate: false })

onMounted(() => {
  appStore.setMode('explore')

  // 로그인 완료 체크를 위한 인터벌 설정 (5초마다 체크)
  loginCheckInterval = window.setInterval(checkLoginComplete, 5000)

  // 초기 체크
  checkLoginComplete()

  // Chrome 메시지 리스너 등록
  if (chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'LOGIN_COMPLETE' && message.action === 'redirect_to_explore') {
        console.log('로그인 완료 메시지 수신, 탐색하기 모드로 리다이렉트')
        appStore.setOverlayMode(null)
        appStore.setMode('explore')
        sendResponse({ success: true })
      }
    })
  }
})

onUnmounted(() => {
  // 인터벌 정리
  if (loginCheckInterval !== null) {
    clearInterval(loginCheckInterval)
    loginCheckInterval = null
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--background);
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--background);
}

.main-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  /* flexbox에서 스크롤을 위해 필요 */
  background-color: var(--background);
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--notification);
  font-size: 16px;
}
</style>
