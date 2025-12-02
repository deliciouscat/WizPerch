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
    
    <!-- separator 아래 영역을 scrollable 컨테이너로 감싸기 -->
    <div class="scrollable-content" ref="commentBoxRef" @scroll="handleScroll">
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
      <div v-else class="comment-box">
        <!-- 초기 로딩 중 -->
        <div v-if="isLoadingComments && comments.length === 0" class="loading-indicator">
          <div class="spinner"></div>
        </div>
        
        <!-- 댓글 목록 -->
        <template v-else>
          <CommentBox
            v-for="comment in comments"
            :key="comment._id"
            :nametag="comment.userName"
            :content="comment.content"
            :commentId="comment._id"
            :isExpanded="expandedCommentId === comment._id"
            @expand="handleCommentExpand"
          />
          
          <!-- 더 로드 중 (무한 스크롤) -->
          <div v-if="hasMore && isLoadingComments" class="load-more-indicator">
            <div class="spinner"></div>
          </div>
          
          <!-- 모든 댓글 로드 완료 -->
          <div v-if="!hasMore && comments.length > 0" class="end-indicator">
            더 이상 댓글이 없습니다.
          </div>
          
          <!-- 댓글이 하나도 없을 때 -->
          <div v-if="comments.length === 0" class="empty-indicator">
            첫 댓글을 작성해보세요!
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useConvexQuery, useConvexMutation } from 'convex-vue'
import { api } from '../../../../convex/_generated/api'
import CommentBox from './CommentBox.vue'
import type { Id } from '../../../../convex/_generated/dataModel'

interface Props {
  pageId: Id<'pages'>
  userNickname: string
  epithet: string
}

const props = withDefaults(defineProps<Props>(), {
  userNickname: 'User',
  epithet: 'Guest'
})

// State
const expandedCommentId = ref<string | null>(null)
const isWriting = ref(false)
const commentInput = ref('')
const commentBoxRef = ref<HTMLElement | null>(null)

// Convex 쿼리 - 무한 스크롤
const numItems = ref(20)
const {
  data: commentsData,
  isPending: isLoadingComments,
} = useConvexQuery(
  api.comments.getCommentsByPage,
  computed(() => ({
    pageId: props.pageId,
    paginationOpts: { numItems: numItems.value, cursor: null },
  }))
)

const emit = defineEmits<{
  'update-counts': [count: number]
}>()

const comments = computed(() => commentsData.value?.page || [])
const hasMore = computed(() => commentsData.value?.continueCursor !== null)

// 댓글 수 변경 감지하여 부모에게 알림
watch(comments, (newComments) => {
  emit('update-counts', newComments.length)
}, { immediate: true })

// Convex mutation - 댓글 생성
const { mutate: createComment, isPending: isSubmitting } = useConvexMutation(
  api.comments.createComment
)

const nametagDisplay = computed(() => {
  return `${props.userNickname} • ${props.epithet}`
})

function handleCommentExpand(commentId: string) {
  if (expandedCommentId.value === commentId) {
    expandedCommentId.value = null
  } else {
    expandedCommentId.value = commentId
  }
}

function handleOutsideClick() {
  expandedCommentId.value = null
}

function startWriting() {
  isWriting.value = true
}

async function handleCommentSubmit() {
  if (commentInput.value.trim() && !isSubmitting.value) {
    try {
      await createComment({
        pageId: props.pageId,
        content: commentInput.value,
      })
      commentInput.value = ''
      isWriting.value = false
    } catch (error) {
      console.error('Failed to submit comment:', error)
    }
  }
}

// 무한 스크롤 핸들러
function handleScroll() {
  if (!commentBoxRef.value || !hasMore.value || isLoadingComments.value) return

  const { scrollTop, scrollHeight, clientHeight } = commentBoxRef.value
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

  // 80% 스크롤 시 더 로드
  if (scrollPercentage > 0.8) {
    numItems.value += 20
  }
}
</script>

<style scoped>
.bottom-sheet {
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.1);
  height: 100%; /* 부모 높이에 맞춤 */
  overflow: hidden; /* 전체는 스크롤 안 함 */
}

.gradient-area {
  height: 18px;
  width: 100%;
  background: linear-gradient(180deg, var(--background) 0%, var(--grey-lv2) 100%);
  cursor: pointer;
  flex-shrink: 0; /* 축소 방지 */
}

.header-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;
  flex-shrink: 0; /* 축소 방지 */
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
  flex-shrink: 0; /* 축소 방지 */
}

.separator::before {
  content: '';
  flex: 1;
  height: 4px;
  background-color: var(--grey-lv3);
}

/* separator 아래의 scrollable 영역 */
.scrollable-content {
  flex: 1; /* 남은 공간 모두 차지 */
  overflow-y: auto; /* 이 영역만 스크롤 */
  min-height: 0; /* Flexbox 스크롤 버그 방지 */
}

.comment-box {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* flex: 1 제거 - 내용물의 크기에 따라 자연스럽게 늘어남 */
}

.comment-write-box {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0; /* 축소 방지 */
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

.loading-indicator,
.load-more-indicator {
  display: flex;
  justify-content: center;
  padding: 16px;
  flex-shrink: 0; /* 축소 방지 */
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--grey-lv2);
  border-top-color: var(--main);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.end-indicator,
.empty-indicator {
  text-align: center;
  padding: 16px;
  color: var(--grey-lv3);
  font-size: 14px;
  flex-shrink: 0; /* 축소 방지 */
}
</style>

