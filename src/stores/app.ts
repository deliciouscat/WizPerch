import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppMode, OverlayMode, ToolbarOutput } from '@/types'

export const useAppStore = defineStore('app', () => {
  const currentMode = ref<AppMode>('explore')
  const overlayMode = ref<OverlayMode>(null)
  const toolbarOutput = ref<ToolbarOutput | null>(null)

  function setMode(mode: AppMode) {
    currentMode.value = mode
  }

  function setOverlayMode(mode: OverlayMode) {
    overlayMode.value = mode
  }

  function setToolbarOutput(output: ToolbarOutput | null) {
    toolbarOutput.value = output
  }

  return {
    currentMode,
    overlayMode,
    toolbarOutput,
    setMode,
    setOverlayMode,
    setToolbarOutput
  }
})

