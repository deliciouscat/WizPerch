<template>
  <div class="comment-box" :class="{ expanded: isExpanded }" @click.stop="handleExpand">
    <div class="nametag">{{ nametag }}</div>
    <div class="content-wrapper">
      <div v-if="isExpanded" class="content-expanded markdown-body" v-html="renderedContent"></div>
      <div v-else class="content-collapsed">{{ content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

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
  try {
    // marked로 마크다운 렌더링 (동기 버전 사용)
    const htmlContent = marked.parse(props.content) as string
    // XSS 방지를 위해 DOMPurify로 살균
    return DOMPurify.sanitize(htmlContent)
  } catch {
    // 렌더링 실패 시 원본 텍스트 반환
    return DOMPurify.sanitize(props.content.replace(/\n/g, '<br>'))
  }
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

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 12px;
  margin-bottom: 8px;
  font-weight: bold;
  line-height: 1.4;
}

.markdown-body :deep(h1) {
  font-size: 24px;
}

.markdown-body :deep(h2) {
  font-size: 20px;
}

.markdown-body :deep(h3) {
  font-size: 18px;
}

.markdown-body :deep(p) {
  margin-bottom: 8px;
  line-height: 1.6;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-left: 16px;
  margin-bottom: 8px;
  padding-left: 16px;
}

.markdown-body :deep(li) {
  margin-bottom: 4px;
  line-height: 1.5;
}

.markdown-body :deep(code) {
  background-color: var(--grey-lv1);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  color: var(--font-black);
}

.markdown-body :deep(pre) {
  background-color: var(--grey-lv1);
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  font-size: 13px;
  line-height: 1.5;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--grey-lv2);
  margin-left: 0;
  padding-left: 12px;
  margin-bottom: 12px;
  color: var(--font-grey);
}

.markdown-body :deep(a) {
  color: #0969da;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  border: none;
  height: 1px;
  background-color: var(--grey-lv2);
  margin: 12px 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}
</style>
