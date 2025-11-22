<template>
  <div class="bottom-sheet" @click="handleOutsideClick">
    <div class="gradient-area" @click="handleOutsideClick"></div>
    <div class="header-area" @click="handleOutsideClick">
      <div class="nametag">{{ nametagDisplay }}</div>
      <button v-if="!isWriting" class="icon-button" @click.stop="startWriting">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
          <path d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM192,108.68,147.31,64l24-24L216,84.68Z"/>
        </svg>
      </button>
    </div>
    <div class="separator"></div>
    <div v-if="isWriting" class="comment-write-box">
      <textarea
        v-model="commentInput"
        placeholder="코멘트를 입력하세요."
        class="comment-input"
        rows="4"
      ></textarea>
      <div class="comment-actions">
        <div class="spacer"></div>
        <button class="submit-button" @click.stop="handleCommentSubmit">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
            <path d="M237.66,122.34l-72-72a8,8,0,0,0-11.32,11.32L214.63,120H32a8,8,0,0,0,0,16H214.63L154.34,194.34a8,8,0,0,0,11.32,11.32l72-72A8,8,0,0,0,237.66,122.34Z"/>
          </svg>
        </button>
      </div>
    </div>
    <div v-else class="comment-box" :style="{ maxHeight: commentBoxHeight }">
      <CommentBox
        v-for="comment in props.docComment"
        :key="comment.commentId"
        :nametag="comment.nametag"
        :content="comment.content"
        :commentId="comment.commentId"
        :isExpanded="expandedCommentId === comment.commentId"
        @expand="handleCommentExpand"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CommentBox from './CommentBox.vue'
import type { CommentData } from '@/types'

interface Props {
  docComment: CommentData[]
  userNickname: string
  epithet: string
  onSubmitComment: (content: string) => Promise<void>
  onExpandChange: (commentId: string | null) => void
}

const props = withDefaults(defineProps<Props>(), {
  docComment: () => [],
  userNickname: 'User',
  epithet: 'Guest'
})

// State
const expandedCommentId = ref<string | null>(null)
const isWriting = ref(false)
const commentInput = ref('')

const nametagDisplay = computed(() => {
  return `${props.userNickname} • ${props.epithet}`
})

const commentBoxHeight = computed(() => {
  const commentLength = props.docComment?.length || 0
  const dynamicHeight = 24 + 64 * commentLength
  const calculatedHeight = Math.max(200, dynamicHeight)
  const maxHeight = window.innerHeight * 0.75
  return `${Math.min(calculatedHeight, maxHeight)}px`
})

function handleCommentExpand(commentId: string) {
  if (expandedCommentId.value === commentId) {
    expandedCommentId.value = null
  } else {
    expandedCommentId.value = commentId
  }
  props.onExpandChange(expandedCommentId.value)
}

function handleOutsideClick() {
  expandedCommentId.value = null
  props.onExpandChange(null)
}

function startWriting() {
  isWriting.value = true
}

async function handleCommentSubmit() {
  if (commentInput.value.trim()) {
    try {
      await props.onSubmitComment(commentInput.value)
      commentInput.value = ''
      isWriting.value = false
    } catch (error) {
      console.error('Failed to submit comment:', error)
    }
  }
}
</script>

<style scoped>
.bottom-sheet {
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.1);
}

.gradient-area {
  height: 18px;
  width: 100%;
  background: linear-gradient(180deg, var(--background) 0%, var(--grey-lv2) 100%);
  cursor: pointer;
}

.header-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
}

.nametag {
  color: var(--font-black);
  font-size: 14px;
}

.icon-button {
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button svg {
  fill: var(--grey-lv3);
}

.separator {
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin: 8px 0;
}

.separator::before {
  content: '';
  flex: 1;
  height: 4px;
  background-color: var(--grey-lv3);
}

.comment-box {
  overflow-y: auto;
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-write-box {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--grey-lv2);
  border-radius: 0;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.comment-actions {
  display: flex;
  align-items: center;
}

.spacer {
  flex: 1;
}

.submit-button {
  width: 32px;
  height: 32px;
  border: none;
  background-color: var(--main);
  color: var(--background);
  cursor: pointer;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-button:hover {
  background-color: var(--grey-lv3);
}

.submit-button svg {
  fill: var(--background);
  transform: rotate(-45deg);
}
</style>

