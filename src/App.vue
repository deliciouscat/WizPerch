<template>
  <div>
    <!-- Show loading state while Clerk is determining authentication -->
    <div v-if="!isLoaded" class="loading-container">
      <LoadingSpinner size="large" text="Initializing..." />
    </div>

    <!-- Show app content once authentication state is determined -->
    <div v-else class="app-container">
      <AppHeader
        :initial-mode="appStore.currentMode"
        :toolbar-suggestions="toolbarSuggestions"
        :user-id="user?.id || null"
        :user-nickname="user?.fullName || 'User'"
        :user-avatar="user?.imageUrl || ''"
        @mode-change="handleModeChange"
        @toolbar-submit="handleToolbarSubmit"
      />

      <main class="main-content">
        <ExplorePlane
          v-if="appStore.currentMode === 'explore'"
          :pages="samplePages"
          :comments="sampleComments"
          :toolbar-output="appStore.toolbarOutput"
          :comment-author="commentAuthor"
          @save-tabs="handleSaveTabs"
          @navigate-pending="handleNavigatePending"
          @submit-comment="handleSubmitComment"
          @comment-expand="handleCommentExpand"
        />

        <PendingPlane
          v-else-if="appStore.currentMode === 'pending'"
          :tabs="savedTabs"
          @open-tabs="handleOpenTabs"
          @delete-tabs="handleDeleteTabs"
        />

        <div v-else class="error-message">
          Error: Invalid mode
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUser } from '@clerk/vue'
import { useAppStore } from '@/stores/app'
import AppHeader from './components/app-header/AppHeader.vue'
import ExplorePlane from './components/explore-plane/ExplorePlane.vue'
import PendingPlane from './components/pending-plane/PendingPlane.vue'
import LoadingSpinner from './components/convex-provider/LoadingSpinner.vue'
import type { PageData, CommentData, SavedTabGroup, ToolbarOutput } from '@/types'
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

const sampleComments = ref<CommentData[]>([
  {
    nametag: 'User1 • Developer',
    content: 'This is a sample comment',
    commentId: '1'
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

async function handleSubmitComment(content: string) {
  // TODO: Convex API 호출
  console.log('Submitting comment:', content)
  sampleComments.value.push({
    nametag: `${commentAuthor.nickname} • ${commentAuthor.epithet}`,
    content,
    commentId: Date.now().toString()
  })
}

function handleCommentExpand(commentId: string | null) {
  console.log('Comment expand:', commentId)
}

function handleOpenTabs(urls: string[]) {
  urls.forEach(url => {
    window.open(url, '_blank')
  })
}

function handleDeleteTabs(saveDate: string) {
  savedTabs.value = savedTabs.value.filter(tab => tab.save_date !== saveDate)
}

onMounted(() => {
  appStore.setMode('explore')
  console.log('App mounted:', {
    isLoaded: isLoaded.value,
    user: user.value,
    currentMode: appStore.currentMode,
    samplePages: samplePages.value.length,
    sampleComments: sampleComments.value.length
  })
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
  min-height: 0; /* flexbox에서 스크롤을 위해 필요 */
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
