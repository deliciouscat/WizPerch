<template>
  <div class="explore-plane">
    <div class="recommended-section" :style="{ height: `${recommendedRatio}%` }">
      <div class="suggestions">
        <button v-for="suggestion in currentSuggestions" :key="suggestion" class="suggestion-button"
          @click="handleSuggestionClick(suggestion)">
          {{ suggestion }}
        </button>
        <button v-if="!toolbarOutput" class="save-tabs-button" @click="handleSaveTabs"
          :disabled="saveTabsStatus === 'loading'">
          {{ saveTabsStatus === 'loading' ? '저장 중...' : '탭 저장하기' }}
        </button>
      </div>
      <div class="recommended-list">
        <Recommended v-for="(page, index) in filteredPages" :key="page.url" :title="page.title"
          :description="page.description" :favicon="page.favicon" :url="page.url" :keyword="page.keyword"
          @page-click="handlePageClick" />
        <Sponsor />
      </div>
    </div>
    <div class="bottom-sheet-section" :style="{ height: `${bottomSheetRatio}%` }">
      <BottomSheet 
        v-if="selectedPageId"
        :pageId="selectedPageId"
        :userNickname="commentAuthor.nickname"
        :epithet="commentAuthor.epithet"
      />
      <div v-else class="no-page-selected">
        페이지를 선택하면 댓글을 볼 수 있습니다.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useConvexMutation } from 'convex-vue'
import { api } from '../../../convex/_generated/api'
import Recommended from './recommend-n-search/Recommended.vue'
import Sponsor from './recommend-n-search/Sponsor.vue'
import BottomSheet from './bottom-sheet/BottomSheet.vue'
import { keyword_search } from './recommend-n-search/Search'
import type { PageData, CommentData, ToolbarOutput } from '@/types'
import type { Id } from '../../../convex/_generated/dataModel'
import querySuggestions from './query_suggestions.json'

interface Props {
  pages: PageData[]
  toolbarOutput: ToolbarOutput | null
  commentAuthor: {
    nickname: string
    epithet: string
  }
  onSaveTabs: (tabs: { save_date: string; pages: PageData[] }) => Promise<void>
  onNavigatePending: () => void
}

const props = defineProps<Props>()

// State
const filteredPages = ref<PageData[]>(props.pages)
const saveTabsStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const selectedPageId = ref<Id<'pages'> | null>(null)

// Convex mutation
const { mutate: getOrCreatePage } = useConvexMutation(api.pages.getOrCreatePage)

// Computed
const currentSuggestions = computed(() => {
  // toolbarOutput이 없어도 기본 제안 표시하지 않음
  if (!props.toolbarOutput) {
    return []
  }
  if (props.toolbarOutput.toolbar_operation === 'search') {
    return querySuggestions.search
  } else if (props.toolbarOutput.toolbar_operation === 'talk') {
    return querySuggestions.talk
  }
  return []
})

const bottomSheetRatio = computed(() => {
  // 선택된 페이지가 있으면 BottomSheet 표시
  if (selectedPageId.value) {
    return 40  // 기본 40%
  }
  return 0  // 페이지가 선택되지 않으면 숨김
})

const recommendedRatio = computed(() => {
  const ratio = 100 - bottomSheetRatio.value
  return ratio > 0 ? ratio : 40 // 최소 40% 보장
})

// Initialize filtered pages
filteredPages.value = props.pages

// Watch toolbar output for filtering
watch(() => props.toolbarOutput, (newOutput) => {
  if (!newOutput) {
    filteredPages.value = props.pages
    return
  }

  if (newOutput.toolbar_operation === 'search') {
    filteredPages.value = keyword_search(newOutput.toolbar_input, props.pages)
  } else if (newOutput.toolbar_operation === 'talk') {
    // AI 대화 모드 - 향후 구현
    filteredPages.value = props.pages
  } else {
    filteredPages.value = props.pages
  }
}, { immediate: true })

// Watch pages prop for changes
watch(() => props.pages, (newPages) => {
  if (!props.toolbarOutput) {
    filteredPages.value = newPages
  }
}, { immediate: true })

// Debug logging
onMounted(() => {
  console.log('ExplorePlane mounted:', {
    pages: props.pages.length,
    filteredPages: filteredPages.value.length,
    recommendedRatio: recommendedRatio.value,
    bottomSheetRatio: bottomSheetRatio.value,
    selectedPageId: selectedPageId.value
  })
})

// Handlers
async function handleSaveTabs() {
  try {
    saveTabsStatus.value = 'loading'
    await props.onSaveTabs({
      save_date: new Date().toISOString(),
      pages: props.pages
    })
    saveTabsStatus.value = 'success'
    props.onNavigatePending()
  } catch (error) {
    saveTabsStatus.value = 'error'
    console.error('Failed to save tabs:', error)
  }
}

async function handlePageClick(url: string) {
  // 페이지를 새 탭에서 열기
  window.open(url, '_blank')
  
  // 선택된 페이지 찾기
  const page = props.pages.find(p => p.url === url)
  if (page) {
    try {
      // Convex에서 페이지 ID 가져오기 또는 생성
      const pageId = await getOrCreatePage({
        url: page.url,
        title: page.title,
        passage: page.description,
        tags: page.keyword,
        favicon: page.favicon,
      })
      selectedPageId.value = pageId
    } catch (error) {
      console.error('Failed to get or create page:', error)
    }
  }
}

function handleSuggestionClick(suggestion: string) {
  // TODO: ToolBar에 텍스트 입력 및 operation 수행
  console.log('Suggestion clicked:', suggestion)
}

// handleSubmitComment와 handleCommentExpand는 이제 BottomSheet 내부에서 처리됨
</script>

<style scoped>
.explore-plane {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--background);
}

.recommended-section {
  overflow-y: auto;
  padding: 16px;
  background-color: var(--background);
  min-height: 0;
  /* flexbox에서 스크롤을 위해 필요 */
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.suggestion-button {
  padding: 8px 16px;
  border: 1px solid var(--grey-lv2);
  border-radius: 4px;
  background-color: var(--background);
  color: var(--font-black);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.suggestion-button:hover {
  background-color: var(--grey-lv1);
}

.save-tabs-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: var(--main);
  color: var(--grey-lv1);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.save-tabs-button:hover {
  background-color: var(--grey-lv3);
}

.save-tabs-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recommended-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bottom-sheet-section {
  min-height: 15%;
  max-height: 60%;
  overflow: hidden;
  flex-shrink: 0;
  /* 축소 방지 */
  background-color: var(--background);
}

.no-page-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grey-lv3);
  font-size: 14px;
  padding: 20px;
  text-align: center;
}
</style>
