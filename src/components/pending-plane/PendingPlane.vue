<template>
  <div class="pending-plane">
    <div
      v-for="(group, index) in groupedTabs"
      :key="index"
      class="tabs-period"
    >
      <div class="period-label">{{ group.period }}</div>
      <div class="period-line"></div>
      <EachSavedTabList
        v-for="tabGroup in group.tabs"
        :key="tabGroup.save_date"
        :saveDate="tabGroup.save_date"
        :tabs="tabGroup.pages"
        @open-tabs="handleOpenTabs"
        @delete-tabs="handleDeleteTabs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EachSavedTabList from './EachSavedTabList.vue'
import type { SavedTabGroup } from '@/types'
import i18nData from '@/locales/ko.json'

interface Props {
  tabs: SavedTabGroup[]
  onOpenTabs: (urls: string[]) => void
  onDeleteTabs: (saveDate: string) => void
}

const props = defineProps<Props>()

function dateRange(date: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateObj = new Date(date)
  dateObj.setHours(0, 0, 0, 0)
  
  const daysDiff = Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
  
  const dateRanges = [
    { threshold: 0, name: i18nData.date.today },
    { threshold: 1, name: i18nData.date.yesterday },
    { threshold: 7, name: i18nData.date.last_7_d },
    { threshold: 30, name: i18nData.date.last_30_d },
    { threshold: 365, name: i18nData.date.last_year }
  ]
  
  for (const range of dateRanges) {
    if (daysDiff <= range.threshold) {
      return range.name
    }
  }
  
  return i18nData.date.long_ago
}

const groupedTabs = computed(() => {
  const groups: Record<string, SavedTabGroup[]> = {}
  
  props.tabs.forEach(tab => {
    const period = dateRange(tab.save_date)
    if (!groups[period]) {
      groups[period] = []
    }
    groups[period].push(tab)
  })
  
  return Object.entries(groups).map(([period, tabs]) => ({
    period,
    tabs
  }))
})

function handleOpenTabs(urls: string[]) {
  props.onOpenTabs(urls)
}

function handleDeleteTabs(saveDate: string) {
  props.onDeleteTabs(saveDate)
}
</script>

<style scoped>
.pending-plane {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 24px;
  height: 100%;
  overflow-y: auto;
  background-color: var(--background);
}

.tabs-period {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.period-label {
  color: var(--grey-lv3);
  font-size: 14px;
  font-weight: bold;
}

.period-line {
  height: 1px;
  background-color: var(--grey-lv3);
  margin: 4px 0;
}
</style>

