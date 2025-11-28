<template>
  <div class="saved-tab-list" @click="handleOpenTabs">
    <div class="indicator"></div>
    <div class="content">
      <div class="save-date">{{ saveDate }}</div>
      <div class="summary-text">{{ tabs.length }} tabs saved</div>
      <div class="favicons">
        <img
          v-for="(favicon, index) in faviconList"
          :key="index"
          :src="favicon"
          :alt="`Favicon ${index + 1}`"
          class="favicon"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageData } from '@/types'

interface Props {
  saveDate: string
  tabs: PageData[]
  onOpenTabs: (urls: string[]) => void
  onDeleteTabs: (saveDate: string) => void
}

const props = defineProps<Props>()

const faviconList = computed(() => {
  return props.tabs.map(tab => tab.favicon)
})

function handleOpenTabs() {
  const urls = props.tabs.map(tab => tab.url)
  props.onOpenTabs(urls)
}
</script>

<style scoped>
.saved-tab-list {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.saved-tab-list:hover {
  background-color: var(--grey-lv1);
}

.saved-tab-list:hover .indicator {
  background-color: var(--main);
}

.indicator {
  width: 4px;
  height: 100%;
  background-color: var(--grey-lv3);
  transition: background-color 0.2s;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.save-date {
  color: var(--font-black);
  font-size: 14px;
  font-weight: bold;
}

.summary-text {
  color: var(--grey-lv2);
  font-size: 12px;
}

.favicons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.favicon {
  width: 16px;
  height: 16px;
}
</style>

