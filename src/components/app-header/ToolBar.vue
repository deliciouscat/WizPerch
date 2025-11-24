<template>
  <div class="toolbar" ref="toolbarRef">
    <!-- Blank (default) -->
    <div class="toolbar-item blank" :style="{ flex: placementSizes[0] }" @click="handleBlankClick"></div>

    <!-- Search Button -->
    <button class="toolbar-item icon-button" @click="handleSearchClick" :class="{ active: state === 'search' }">
      <PhMagnifyingGlass :size="24" weight="bold" />
    </button>

    <!-- Blank/TextInput (search) -->
    <div class="toolbar-item" :style="{ flex: placementSizes[2] }">
      <input v-if="state === 'search' && placementSizes[2] === 1" ref="searchInputRef" type="text" v-model="inputValue"
        @keyup.enter="handleSubmit" placeholder="검색을 입력하세요..." class="text-input" />
    </div>

    <!-- Talk Button -->
    <button class="toolbar-item icon-button" @click="handleTalkClick" :class="{ active: state === 'talk' }">
      <PhRobot :size="24" weight="bold" />
    </button>

    <!-- Blank/TextInput (talk) -->
    <div class="toolbar-item" :style="{ flex: placementSizes[4] }">
      <input v-if="state === 'talk' && placementSizes[4] === 1" ref="talkInputRef" type="text" v-model="inputValue"
        @keyup.enter="handleSubmit" placeholder="AI와 대화하기..." class="text-input" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { PhMagnifyingGlass, PhRobot } from '@phosphor-icons/vue'
import type { ToolbarOutput } from '@/types'

interface Props {
  suggestions: {
    search: string[]
    talk: string[]
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [output: ToolbarOutput]
}>()

// State
const state = ref<'default' | 'search' | 'talk'>('default')
const inputValue = ref('')
const usedSuggestions = ref<string[]>([])

// Refs
const toolbarRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const talkInputRef = ref<HTMLInputElement>()

// Computed placement sizes based on state
const placementSizes = computed(() => {
  switch (state.value) {
    case 'search':
      return [0, 0, 1, 0, 0] // [Blank(0), search_button, TextInput(1), talk_button, Blank(0)]
    case 'talk':
      return [0, 0, 0, 0, 1] // [Blank(0), search_button, Blank(0), talk_button, TextInput(1)]
    default:
      return [1, 0, 0, 0, 0] // [Blank(1), search_button, Blank(0), talk_button, Blank(0)]
  }
})

// Animation delay
const animationDelay = 100 // 0.1 seconds

// Handle search button click
async function handleSearchClick() {
  if (state.value === 'search') {
    handleSubmit()
    return
  }

  state.value = 'search'
  // 검색 모드로 전환 시 즉시 이벤트 발생 (빈 입력으로)
  emit('submit', {
    toolbar_operation: 'search',
    toolbar_input: '',
    suggestions_used: []
  })
  await nextTick()
  setTimeout(() => {
    searchInputRef.value?.focus()
  }, animationDelay)
}

// Handle talk button click
async function handleTalkClick() {
  if (state.value === 'talk') {
    handleSubmit()
    return
  }

  state.value = 'talk'
  // 대화 모드로 전환 시 즉시 이벤트 발생 (빈 입력으로)
  emit('submit', {
    toolbar_operation: 'talk',
    toolbar_input: '',
    suggestions_used: []
  })
  await nextTick()
  setTimeout(() => {
    talkInputRef.value?.focus()
  }, animationDelay)
}

// Handle blank click (return to default)
function handleBlankClick() {
  resetToDefault()
}

// Handle submit
function handleSubmit() {
  if (inputValue.value.trim()) {
    emit('submit', {
      toolbar_operation: state.value,
      toolbar_input: inputValue.value,
      suggestions_used: usedSuggestions.value
    })
    resetToDefault()
  }
}

// Reset to default state
function resetToDefault() {
  state.value = 'default'
  inputValue.value = ''
  usedSuggestions.value = []
}

// Handle clicks outside toolbar (in AppHeader area)
function handleOutsideClick(event: MouseEvent) {
  if (toolbarRef.value && !toolbarRef.value.contains(event.target as Node)) {
    const appHeader = toolbarRef.value.closest('.app-header')
    if (appHeader && appHeader.contains(event.target as Node)) {
      resetToDefault()
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: var(--background);
  border-radius: 0;
}

.toolbar-item {
  transition: flex 0.3s ease-in-out;
  overflow: hidden;
  min-width: 0;
}

.blank {
  cursor: pointer;
}

.icon-button {
  flex-shrink: 0;
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

.icon-button.active {
  background-color: var(--grey-lv2);
}

.icon-button :deep(svg) {
  color: var(--font-black);
}

.text-input {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 0;
  padding: 0 16px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background-color: var(--background);
  color: var(--font-black);
}
</style>
