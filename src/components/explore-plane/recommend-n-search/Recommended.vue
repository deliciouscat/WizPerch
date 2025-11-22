<template>
  <div class="recommended-box" @click="handlePageClick">
    <div class="recommended-header">
      <img v-if="favicon" :src="favicon" :alt="title" class="favicon" />
      <h3 class="title">{{ title }}</h3>
    </div>
    <div class="recommended-line"></div>
    <p class="description">{{ description }}</p>
    <div class="keywords">
      <span v-for="k in keyword" :key="k" class="keyword">#{{ k }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  favicon: string
  url: string
  keyword: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  pageClick: [url: string]
}>()

function handlePageClick() {
  emit('pageClick', props.url)
}
</script>

<style scoped>
.recommended-box {
  border: 2px solid var(--grey-lv2);
  border-radius: 0;
  padding: 16px;
  background-color: var(--background);
  cursor: pointer;
  transition: background-color 0.2s;
}

.recommended-box:hover {
  background-color: var(--grey-lv1);
}

.recommended-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.favicon {
  width: 16px;
  height: 16px;
}

.title {
  color: var(--font-black);
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.recommended-line {
  height: 1px;
  background-color: var(--grey-lv3);
  margin: 8px 0;
}

.description {
  color: var(--font-black);
  font-size: 14px;
  margin: 8px 0;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.keyword {
  color: var(--grey-lv3);
  font-size: 12px;
}
</style>

