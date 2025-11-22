<template>
  <div class="app-header">
    <div class="header-top">
      <div class="logo-placeholder">Logo</div>
      <button class="icon-button" @click="accountMenuDisplay">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1,0-16h56A8,8,0,0,1,192,128Zm-56-56H72a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm0,112H72a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Z"/>
        </svg>
      </button>
      <button class="icon-button" @click="settingsMenuDisplay">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256">
          <path d="M168,128a40,40,0,1,1-40-40A40,40,0,0,1,168,128Zm64-40H219.23a95.94,95.94,0,0,0-12.44-29.57l27.32-15.78a8,8,0,1,0-8-13.86L198.79,44.05a95.94,95.94,0,0,0-29.57-12.44V4a8,8,0,0,0-16,0V31.61a95.94,95.94,0,0,0-29.57,12.44L86.89,28.79a8,8,0,0,0-8,13.86l27.32,15.78A95.94,95.94,0,0,0,93.77,88H32a8,8,0,0,0,0,16H93.77a95.94,95.94,0,0,0,12.44,29.57L78.89,149.35a8,8,0,1,0,8,13.86l27.32-15.78a95.94,95.94,0,0,0,29.57,12.44V252a8,8,0,0,0,16,0V220.39a95.94,95.94,0,0,0,29.57-12.44l27.32,15.78a8,8,0,1,0,8-13.86L198.79,188a95.94,95.94,0,0,0,12.44-29.57H232a8,8,0,0,0,0-16ZM128,176a48,48,0,1,1,48-48A48.05,48.05,0,0,1,128,176Z"/>
        </svg>
      </button>
      <button class="mode-button" @click="swapMode">
        {{ swapToText }}
      </button>
    </div>
    <ToolBar :suggestions="toolbarSuggestions" @submit="handleToolbarSubmit" />
    <div class="header-line"></div>
  </div>

  <!-- Overlay -->
  <div v-if="appStore.overlayMode === 'account'" class="overlay" @click="closeOverlay">
    <div class="overlay-content" @click.stop>
      <UserProfile
        :userId="userId"
        :nickname="userNickname"
        :avatar="userAvatar"
      />
    </div>
  </div>

  <div v-if="appStore.overlayMode === 'settings'" class="overlay" @click="closeOverlay">
    <div class="overlay-content" @click.stop>
      <Settings />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import ToolBar from './ToolBar.vue'
import UserProfile from '../convex-provider/UserProfile.vue'
import Settings from '../convex-provider/Settings.vue'
import type { ToolbarOutput } from '@/types'

interface Props {
  initialMode?: 'explore' | 'pending'
  toolbarSuggestions: {
    search: string[]
    talk: string[]
  }
  userId: string | null
  userNickname: string
  userAvatar: string
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'explore'
})

const emit = defineEmits<{
  modeChange: [mode: 'explore' | 'pending']
  toolbarSubmit: [output: ToolbarOutput]
}>()

const appStore = useAppStore()

// 초기화
appStore.setMode(props.initialMode)

const swapTo = computed(() => {
  return appStore.currentMode === 'explore' ? 'pending' : 'explore'
})

const swapToText = computed(() => {
  return swapTo.value === 'explore' ? '탐색하기' : '보관된 탭'
})

function swapMode() {
  const newMode = swapTo.value
  appStore.setMode(newMode)
  emit('modeChange', newMode)
}

function handleToolbarSubmit(output: ToolbarOutput) {
  appStore.setToolbarOutput(output)
  emit('toolbarSubmit', output)
}

function accountMenuDisplay() {
  appStore.setOverlayMode('account')
}

function settingsMenuDisplay() {
  appStore.setOverlayMode('settings')
}

function closeOverlay() {
  appStore.setOverlayMode(null)
}
</script>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  flex-shrink: 0; /* 헤더는 축소되지 않음 */
}

.header-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
}

.logo-placeholder {
  height: 32px;
  width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--grey-lv1);
  color: var(--font-black);
  font-size: 14px;
  font-weight: bold;
}

.icon-button {
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: var(--grey-lv1);
}

.icon-button svg {
  fill: var(--font-black);
}

.mode-button {
  margin-left: auto;
  padding: 8px 16px;
  border: 2px solid var(--grey-lv2);
  border-radius: 4px;
  background-color: var(--background);
  color: var(--font-black);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.mode-button:hover {
  background-color: var(--grey-lv1);
}

.header-line {
  height: 4px;
  background-color: var(--main);
  width: 100%;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.overlay-content {
  background-color: var(--background);
  padding: 24px;
  border-radius: 0;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
}
</style>

