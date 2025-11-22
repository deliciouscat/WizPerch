<template>
  <div class="toolbar" ref="toolbarRef">
    <!-- Blank (default) -->
    <div 
      class="toolbar-item blank" 
      :style="{ flex: placementSizes[0] }" 
      @click="handleBlankClick"
    ></div>

    <!-- Search Button -->
    <button 
      class="toolbar-item icon-button" 
      @click="handleSearchClick" 
      :class="{ active: state === 'search' }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
        <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
      </svg>
    </button>

    <!-- Blank/TextInput (search) -->
    <div class="toolbar-item" :style="{ flex: placementSizes[2] }">
      <input 
        v-if="state === 'search' && placementSizes[2] === 1" 
        ref="searchInputRef" 
        type="text" 
        v-model="inputValue"
        @keyup.enter="handleSubmit" 
        placeholder="검색을 입력하세요..." 
        class="text-input" 
      />
    </div>

    <!-- Talk Button -->
    <button 
      class="toolbar-item icon-button" 
      @click="handleTalkClick" 
      :class="{ active: state === 'talk' }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
        <path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
      </svg>
    </button>

    <!-- Blank/TextInput (talk) -->
    <div class="toolbar-item" :style="{ flex: placementSizes[4] }">
      <input 
        v-if="state === 'talk' && placementSizes[4] === 1" 
        ref="talkInputRef" 
        type="text" 
        v-model="inputValue"
        @keyup.enter="handleSubmit" 
        placeholder="AI와 대화하기..." 
        class="text-input" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
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

.icon-button svg {
  fill: var(--font-black);
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
