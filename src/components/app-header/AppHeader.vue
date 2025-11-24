<template>
  <div class="app-header">
    <div class="header-top">
      <img src="@/components/assets/logo.svg" alt="WizPerch Logo" class="logo" />
      <button class="icon-button" @click="accountMenuDisplay">
        <PhUserCircle :size="24" weight="bold" />
      </button>
      <button class="icon-button" @click="settingsMenuDisplay">
        <PhGearSix :size="24" weight="bold" />
      </button>
      <button class="mode-button" @click="swapMode">
        {{ swapToText }}
      </button>
    </div>
    <ToolBar :suggestions="toolbarSuggestions" @submit="handleToolbarSubmit" />
    <div class="header-line"></div>
  </div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhUserCircle, PhGearSix } from '@phosphor-icons/vue'
import { useAppStore } from '@/stores/app'
import ToolBar from './ToolBar.vue'
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

.logo {
  height: 32px;
  width: auto;
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

</style>

