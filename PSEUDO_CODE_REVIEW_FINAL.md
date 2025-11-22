# PseudoCode 최종 검토 결과

네 명의 검토자(Composer1, GPT5.1 Codex High, Sonnet4.5 Think, Gemini3 Pro Think)의 검토 내용을 종합하여 최종 버전을 작성했습니다.

## 📋 검토 기준

1. **적절한 Design Pattern 적용 여부**
2. **Input/Output 명시 및 적절한 변수명**

---

## 🎯 주요 개선 사항

### 1. Design Pattern 명시화

모든 `*.pseudoCode.txt` 파일에 적절한 디자인 패턴을 명시했습니다:

#### **전역 상태 관리**
- **Store Pattern (Pinia)**: `App.vue`, `AppHeader.vue`
  - `currentMode`, `overlayMode`, `toolbarOutput` 등을 Pinia Store로 관리
  - 컴포넌트 간 상태 공유 및 일관성 유지

#### **컴포넌트 구조 패턴**
- **Mediator Pattern**: `App.vue`, `AppHeader.vue`
  - 하위 컴포넌트 간 통신을 중앙에서 조율
  - 이벤트 수집 및 전파

- **Container/Presenter Pattern**: `ExplorePlane.vue`, `BottomSheet.vue`
  - Container: 데이터 관리 및 비즈니스 로직
  - Presenter: 순수 렌더링 (Recommended, CommentBox, Sponsor)

- **State Pattern**: `ToolBar.vue`
  - Finite State Machine (Default, Search, Talk)
  - 상태에 따른 UI 구성 변경

#### **기능별 패턴**
- **Command Pattern**: `ToolBar.vue`, `EachSavedTabList.vue`
  - 버튼 클릭 시 커맨드 실행
  
- **Strategy Pattern**: `ToolBar.vue`, `Search.ts`
  - 검색 vs 대화 모드에 따른 처리 전략 분리

- **Accordion Pattern**: `BottomSheet.vue`
  - 댓글 확장/축소 관리

- **Pure Function**: `Search.ts`, `date_range()`
  - 부수효과 없는 순수 함수로 구현

---

### 2. Input/Output 명세 개선

모든 컴포넌트에 명확한 Props, State, Output을 정의했습니다.

#### **App.pseudoCode.txt**

```typescript
// Input
Props {
    initialMode: "explore" | "pending" = "explore",
    toolbarSuggestions: {
        search: list[string],
        talk: list[string]
    },
    isAuthenticated: boolean,
    userId: string | null
}

// State (Pinia Store)
State {
    currentMode: "explore" | "pending",
    overlayMode: null | "account" | "settings",
    toolbarOutput: ToolbarOutput | null
}

// Output
Output {
    mainLayout: VerticalGrid,
    activePlane: "explore" | "pending",
    propagatedToolbar: ToolbarOutput
}
```

#### **AppHeader.pseudocode.txt**

```typescript
// Input
Props {
    initialMode: "explore" | "pending",
    toolbarSuggestions: {...},
    userId: string | null,
    userNickname: string,
    userAvatar: string,
    onModeChange: (mode) => void,
    onToolbarSubmit: (output) => void
}

// Output
Output {
    display_mode: {
        currentMode: "explore" | "pending",
        overlay: null | "account" | "settings"
    },
    toolbar_output: ToolbarOutput
}
```

#### **ToolBar.pseudoCode.txt**

```typescript
// Input
Props {
    suggestions: {
        search: list[string],
        talk: list[string]
    },
    onSubmit: (output: ToolbarOutput) => void
}

// State
State {
    currentState: "default" | "search" | "talk",
    inputValue: string,
    usedSuggestions: list[string]
}

// Output
Output {
    toolbar_operation: "search" | "talk",
    toolbar_input: string,
    suggestions_used: list[string]
}
```

#### **ExplorePlane.pseudoCode.txt**

```typescript
// Input
Props {
    pages: list[dict{...}],
    comments: list[dict{...}],
    toolbarOutput: ToolbarOutput | null,
    commentAuthor: {nickname, epithet},
    onSaveTabs: (tabs) => Promise<void>,
    onNavigatePending: () => void,
    onSubmitComment: (content) => Promise<void>,
    onCommentExpand: (commentId) => void
}

// State
State {
    filteredPages: list[dict],
    saveTabsStatus: "idle" | "loading" | "success" | "error"
}
```

#### **BottomSheet.pseudoCode.txt**

```typescript
// Input
Props {
    doc_comment: list[dict{...}],
    user_nickname: string,
    epithet: string,
    onSubmitComment: (content) => Promise<void>,
    onExpandChange: (commentId) => void
}

// State
State {
    expandedCommentId: string | null,
    isWriting: boolean
}
```

#### **CommentBox.pseudoCode.txt**

```typescript
// Input (Controlled Component)
Props {
    nametag: string,
    content: string,
    commentId: string,
    isExpanded: boolean,
    onExpand: (id: string) => void
}
```

#### **Recommended.pseudoCode.txt**

```typescript
// Input
Props {
    title, description, favicon, url, keyword,
    onPageClick: (url: string) => void
}
```

#### **Search.pseudoCode.txt**

```typescript
// Pure Function
function keyword_search(
    query: string, 
    contents: list[dict]
) -> list[dict]
```

#### **Sponsor.pseudoCode.txt**

```typescript
// Input
Props {
    sponsorUrl: string = "https://github.com/deliciouscat",
    sponsorTitle: string = "Sponsor",
    sponsorDescription: string = "Support this project"
}
```

#### **PendingPlane.pseudocode.txt**

```typescript
// Input
Props {
    tabs: list[dict{...}],
    onOpenTabs: (urls: list[string]) => void,
    onDeleteTabs: (saveDate: string) => void
}
```

#### **EachSavedTabList.pseudoCode.txt**

```typescript
// Input
Props {
    save_date: string,
    tabs: list[dict{...}],
    onOpenTabs: (urls: list[string]) => void,
    onDeleteTabs: (saveDate: string) => void
}
```

---

### 3. 오타 및 버그 수정

| 파일 | 수정 전 | 수정 후 |
|------|---------|---------|
| ToolBar | `검색하을` | `검색을` |
| ToolBar | `phospor-icons` | `phosphor-icons` |
| ToolBar | `add_button` | `talk_button` |
| BottomSheet | `Documment` | `Document` |
| Sponsor | `onClikUrl` | `onClickUrl` |
| EachSavedTabList | `favicons` (undefined) | `favicon_list` |
| EachSavedTabList | `keyword` (undefined) | `summary_text` |
| PendingPlane | `today <= d.date` | `days_diff <= d.threshold` |

---

## 🏗️ 아키텍처 개요

```
App (Mediator + Store)
├── AppHeader (Mediator)
│   ├── ToolBar (State Machine)
│   ├── UserProfile
│   └── Settings
│
├── ExplorePlane (Container)
│   ├── Recommended (Presenter) × N
│   ├── Sponsor (Presenter)
│   ├── Search (Pure Function)
│   └── BottomSheet (Controller-View)
│       └── CommentBox (Controlled Component) × N
│
└── PendingPlane (Container + Grouper)
    └── EachSavedTabList (List Item) × N
```

---

## 🔄 데이터 흐름

### 1. 모드 전환 (Explore ↔ Pending)
```
User Click → AppHeader.swap_mode() 
          → Pinia Store.currentMode 
          → App.vue (re-render)
```

### 2. 검색 흐름
```
User Input → ToolBar (State: "search")
          → Props.onSubmit(output)
          → AppHeader → App → ExplorePlane
          → Search.keyword_search()
          → State.filteredPages 업데이트
```

### 3. 댓글 작성 흐름
```
User Input → CommentBox.onExpand()
          → BottomSheet.handleCommentExpand()
          → Props.onExpandChange()
          → ExplorePlane.onCommentExpand()
```

### 4. 탭 저장 흐름
```
User Click → ExplorePlane.handle_save_tabs()
          → Props.onSaveTabs() (Convex API)
          → State.saveTabsStatus = "success"
          → Props.onNavigatePending()
```

---

## ✅ 검토자별 기여도

### Composer1 & Gemini3 Pro Think
- ✅ Pinia Store 기반 전역 상태 관리 제안
- ✅ Container/Presenter 패턴 명확화
- ✅ Props/Emits 구조 정의

### GPT5.1 Codex High
- ✅ Mediator/Command 패턴 적용
- ✅ 구체적인 Props 명세 작성
- ✅ 이벤트 핸들러 함수 구조화

### Sonnet4.5 Think
- ✅ 오타 수정 (phospor → phosphor, 검색하을 → 검색을)
- ✅ 에러 처리 로직 추가 (try-catch)
- ✅ 보안 고려사항 제안

---

## 📌 다음 단계 권장사항

### 1. Pinia Store 구조 설계
```typescript
// stores/app.ts
export const useAppStore = defineStore('app', {
  state: () => ({
    currentMode: 'explore' as 'explore' | 'pending',
    overlayMode: null as null | 'account' | 'settings',
    toolbarOutput: null as ToolbarOutput | null
  }),
  actions: {
    setMode(mode: 'explore' | 'pending') {
      this.currentMode = mode
    },
    setToolbarOutput(output: ToolbarOutput) {
      this.toolbarOutput = output
    }
  }
})
```

### 2. TypeScript Interface 정의
```typescript
// types/index.ts
export interface ToolbarOutput {
  toolbar_operation: 'search' | 'talk'
  toolbar_input: string
  suggestions_used: string[]
}

export interface PageData {
  title: string
  description: string
  favicon: string
  url: string
  keyword: string[]
}

export interface CommentData {
  nametag: string
  content: string
  commentId: string
}
```

### 3. API 명세 확정
`/Users/deliciouscat/projects/PageLink-retrieve-server`와의 통신 규격을 정의해야 합니다:

```typescript
// API Endpoints
POST /api/tabs/save
  Request: { save_date: string, pages: PageData[] }
  Response: { success: boolean, id: string }

GET /api/tabs/list
  Response: { tabs: SavedTabGroup[] }

POST /api/comments/submit
  Request: { pageUrl: string, content: string }
  Response: { success: boolean, commentId: string }

GET /api/comments/list
  Query: { pageUrl: string }
  Response: { comments: CommentData[] }

POST /api/search
  Request: { query: string, mode: 'search' | 'talk' }
  Response: { pages: PageData[] }
```

### 4. 에러 처리 전략
- API 호출 실패 시 사용자 알림
- 네트워크 오류 재시도 로직
- 낙관적 UI 업데이트 (Optimistic Update)

### 5. 성능 최적화
- `Recommended` 컴포넌트 가상 스크롤링 (Virtual Scrolling)
- 이미지 Lazy Loading
- Debounce 적용 (검색 입력)

### 6. 보안 고려사항
- XSS 방지: 댓글 입력 시 sanitize
- CSRF 토큰 적용
- API 요청 Rate Limiting

---

## 📝 변경된 파일 목록

1. ✅ `src/App.pseudoCode.txt`
2. ✅ `src/components/app-header/AppHeader.pseudocode.txt`
3. ✅ `src/components/app-header/ToolBar.pseudoCode.txt`
4. ✅ `src/components/explore-plane/ExplorePlane.pseudoCode.txt`
5. ✅ `src/components/explore-plane/bottom-sheet/BottomSheet.pseudoCode.txt`
6. ✅ `src/components/explore-plane/bottom-sheet/CommentBox.pseudoCode.txt`
7. ✅ `src/components/explore-plane/recommend-n-search/Recommended.pseudoCode.txt`
8. ✅ `src/components/explore-plane/recommend-n-search/Search.pseudoCode.txt`
9. ✅ `src/components/explore-plane/recommend-n-search/Sponsor.pseudoCode.txt`
10. ✅ `src/components/pending-plane/PendingPlane.pseudocode.txt`
11. ✅ `src/components/pending-plane/EachSavedTabList.pseudoCode.txt`

---

## 🎓 학습 포인트

### Vue.js 모범 사례 적용
- ✅ Props down, Events up 패턴
- ✅ Controlled vs Uncontrolled Components
- ✅ Composition API 활용 (Pinia Store)
- ✅ TypeScript 타입 안정성

### 디자인 패턴 실전 적용
- ✅ Store Pattern: 전역 상태 관리
- ✅ Mediator Pattern: 컴포넌트 간 통신
- ✅ Container/Presenter: 관심사 분리
- ✅ State Machine: 복잡한 상태 관리
- ✅ Pure Function: 테스트 용이성

---

## 📊 통계

- **총 파일 수**: 11개
- **추가된 Design Pattern 섹션**: 11개
- **추가된 Input/Output 섹션**: 11개
- **수정된 오타**: 7개
- **추가된 에러 처리**: 3개
- **개선된 변수명**: 5개

---

## 🚀 구현 준비 완료

모든 pseudoCode 파일이 실제 Vue 컴포넌트 구현을 위한 명세서로 사용될 수 있도록 개선되었습니다. 이제 다음 단계로 진행할 수 있습니다:

1. Pinia Store 구현
2. TypeScript Interface 정의
3. Vue 컴포넌트 구현 시작
4. API 서버와의 통신 규격 확정

---

**검토 완료일**: 2025-11-22  
**검토자**: Composer1, GPT5.1 Codex High, Sonnet4.5 Think, Gemini3 Pro Think  
**통합 작성자**: Claude Sonnet 4.5

