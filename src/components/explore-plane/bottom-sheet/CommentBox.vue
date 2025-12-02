<template>
  <div class="comment-box" :class="{ expanded: isExpanded }" @click.stop="handleExpand">
    <div class="nametag">{{ nametag }}</div>
    <div class="content-wrapper">
      <div v-if="isExpanded" class="content-expanded" v-html="renderedContent"></div>
      <div v-else class="content-collapsed">{{ content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  nametag: string
  content: string
  commentId: string
  isExpanded: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  expand: [id: string]
}>()

const renderedContent = computed(() => {
  // 간단한 마크다운 렌더링 (실제로는 markdown 라이브러리 사용)
  return props.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
})

function handleExpand() {
  emit('expand', props.commentId)
}
</script>

<style scoped>
.comment-box {
  border: 1px solid var(--grey-lv2);
  border-radius: 0;
  padding: 16px;
  background-color: var(--background);
  cursor: pointer;
  transition: background-color 0.2s;
  height: 96px; /* 고정 높이 */
  overflow: hidden;
  position: relative;
  flex-shrink: 0; /* 축소 방지 */
}

.comment-box:hover {
  background-color: var(--grey-lv1);
}

.comment-box.expanded {
  height: auto; /* 동적 높이 */
  max-height: 400px; /* 최대 높이 제한 */
  background-color: var(--background);
  box-shadow: inset 0 -8px 8px -8px var(--background);
  overflow-y: auto; /* 내용이 길면 스크롤 */
  flex-shrink: 0; /* 축소 방지 */
}

.nametag {
  color: var(--font-black);
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}

.content-wrapper {
  color: var(--font-black);
  font-size: 14px;
}

.content-collapsed {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.content-expanded {
  white-space: pre-wrap;
  word-break: break-word;
}

.content-expanded :deep(strong) {
  font-weight: bold;
}

.content-expanded :deep(em) {
  font-style: italic;
}
</style>
