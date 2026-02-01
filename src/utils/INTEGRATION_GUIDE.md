# RobustContentExtractor 통합 가이드

## 개요

`RobustContentExtractor`는 다양한 웹페이지에서 메인 콘텐츠와 댓글을 자동으로 추출하는 범용 파서입니다. 11가지 전략을 통해 뉴스 사이트, 블로그, Reddit, YouTube 등 다양한 플랫폼을 지원합니다.

## 성능

- **평균 파싱 시간**: 30-50ms (0.03-0.05초)
- **메모리 사용량**: 경량 (외부 라이브러리 의존성 없음)
- **지원 플랫폼**: 모든 웹페이지 (HTML 기반)

## 설치

```typescript
// src/utils/parser.ts 파일을 프로젝트에 포함
import { RobustContentExtractor } from '@/utils/parser';
```

## 기본 사용법

### 1. 메인 콘텐츠 추출

```typescript
// 현재 페이지에서 메인 콘텐츠 추출
const mainContent = RobustContentExtractor.extractMainContent();

if (mainContent) {
  console.log('추출된 콘텐츠:', mainContent);
  console.log('콘텐츠 길이:', mainContent.length);
} else {
  console.log('콘텐츠를 찾을 수 없습니다.');
}
```

**반환값:**
- `string | null`: 정제된 텍스트 콘텐츠 (성공 시) 또는 `null` (실패 시)

### 2. 댓글 섹션 찾기

```typescript
// 페이지에서 댓글 섹션 자동 탐지
const commentSections = RobustContentExtractor.findCommentSections();

console.log(`${commentSections.length}개의 댓글 섹션 발견`);

commentSections.forEach((section, index) => {
  console.log(`섹션 ${index + 1}:`, section);
});
```

**반환값:**
- `Element[]`: 댓글 섹션으로 추정되는 DOM 요소 배열

## 전략 (Strategies)

`extractMainContent()`는 다음 순서로 콘텐츠를 탐색합니다:

### 1. 시맨틱 HTML5 태그
- `<article>`
- `<main>`
- `[role="main"]`

### 2. 일반적인 클래스명
- `.article-body`
- `.post-content`
- `.entry-content`
- `[class*="article"]`
- `[class*="content"]`

### 3. ID 기반
- `#article`
- `#content`

### 4. 휴리스틱 분석
- `findLongestTextBlock()`: 가장 긴 텍스트 블록 찾기
  - 최소 25,600자 이상의 콘텐츠 확보
  - 필요 시 상위 3개 블록 결합

## 고급 사용법

### Chrome Extension에서 사용

```typescript
// content-script.js
function parseCurrentPage() {
  const pageData = {
    url: location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    
    // 메인 콘텐츠
    mainContent: RobustContentExtractor.extractMainContent(),
    
    // 댓글
    comments: extractAllComments()
  };
  
  return pageData;
}

function extractAllComments() {
  const sections = RobustContentExtractor.findCommentSections();
  const allComments = [];
  
  sections.forEach(section => {
    const comments = extractCommentsFromSection(section);
    allComments.push(...comments);
  });
  
  return allComments;
}

function extractCommentsFromSection(section: Element) {
  const items = [];
  
  // 가능한 댓글 아이템 선택자
  const itemSelectors = [
    'li',
    '.comment-item',
    '[class*="comment"]',
    'article',
    '.reply',
    '[class*="reply"]'
  ];
  
  itemSelectors.forEach(selector => {
    section.querySelectorAll(selector).forEach(item => {
      const text = extractTextOnly(item);
      
      if (text && text.length > 15) {
        items.push({
          text,
          author: findAuthor(item),
          likes: findLikes(item),
          timestamp: findTimestamp(item)
        });
      }
    });
  });
  
  return items;
}

function extractTextOnly(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  
  // UI 요소 제거
  clone.querySelectorAll('button, input, textarea, a[class*="btn"]')
    .forEach(el => el.remove());
  
  return (clone.textContent || '').trim();
}

function findAuthor(element: Element): string | null {
  const authorSelectors = [
    '.author',
    '.username',
    '[class*="author"]',
    '[class*="user"]'
  ];
  
  for (const selector of authorSelectors) {
    const authorEl = element.querySelector(selector);
    if (authorEl) {
      return (authorEl.textContent || '').trim();
    }
  }
  
  return null;
}

function findLikes(element: Element): number | null {
  const likeSelectors = [
    '.likes',
    '.upvotes',
    '[class*="like"]',
    '[class*="vote"]'
  ];
  
  for (const selector of likeSelectors) {
    const likeEl = element.querySelector(selector);
    if (likeEl) {
      const text = (likeEl.textContent || '').trim();
      const match = text.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
    }
  }
  
  return null;
}

function findTimestamp(element: Element): string | null {
  const timeSelectors = [
    'time',
    '.timestamp',
    '[class*="time"]',
    '[class*="date"]'
  ];
  
  for (const selector of timeSelectors) {
    const timeEl = element.querySelector(selector);
    if (timeEl) {
      return timeEl.getAttribute('datetime') || (timeEl.textContent || '').trim();
    }
  }
  
  return null;
}
```

### 백그라운드로 데이터 전송

```typescript
// content-script.js
chrome.runtime.sendMessage({
  type: 'PAGE_PARSED',
  data: parseCurrentPage()
});

// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_PARSED') {
    console.log('파싱된 데이터:', message.data);
    
    // Convex 또는 다른 백엔드로 전송
    saveToDatabase(message.data);
  }
});
```

### 실시간 모니터링

```typescript
// 페이지 변경 감지 (SPA 등)
const observer = new MutationObserver(() => {
  const newContent = RobustContentExtractor.extractMainContent();
  
  if (newContent && newContent !== lastContent) {
    lastContent = newContent;
    console.log('콘텐츠 업데이트 감지:', newContent.substring(0, 100));
    
    // 업데이트된 콘텐츠 처리
    handleContentUpdate(newContent);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

## 유효성 검증

`isValidContent()` 메서드는 다음 조건을 확인합니다:

1. **최소 텍스트 길이**: 50자 이상
2. **링크 비율**: 전체 텍스트 중 링크가 50% 미만

이는 네비게이션 메뉴나 사이드바를 필터링하기 위한 것입니다.

## 정제 프로세스

`cleanElement()` 메서드는 다음 요소들을 제거합니다:

- `<script>`, `<style>`, `<noscript>`, `<iframe>`
- `<nav>`, `<header>`, `<footer>`, `<aside>`
- `.ad`, `.advertisement`, `[class*="banner"]`
- `[class*="comment"]`, `[id*="comment"]` (메인 콘텐츠에서만)

## 최적화 팁

### 1. 조건부 실행

```typescript
// 특정 도메인에서만 실행
const allowedDomains = ['news.com', 'blog.com', 'reddit.com'];
const currentDomain = location.hostname;

if (allowedDomains.some(domain => currentDomain.includes(domain))) {
  const content = RobustContentExtractor.extractMainContent();
  // 처리...
}
```

### 2. 캐싱

```typescript
// 동일 페이지에서 재파싱 방지
let cachedContent: string | null = null;
let lastUrl = '';

function getCachedContent() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    cachedContent = RobustContentExtractor.extractMainContent();
  }
  
  return cachedContent;
}
```

### 3. 비동기 처리

```typescript
// 파싱을 백그라운드 작업으로
async function parsePageAsync() {
  return new Promise<string | null>((resolve) => {
    setTimeout(() => {
      const content = RobustContentExtractor.extractMainContent();
      resolve(content);
    }, 0);
  });
}

// 사용
const content = await parsePageAsync();
```

## 에러 처리

```typescript
try {
  const content = RobustContentExtractor.extractMainContent();
  
  if (!content) {
    console.warn('콘텐츠를 추출할 수 없습니다.');
    // 대체 방법 시도...
    return document.body.textContent;
  }
  
  return content;
} catch (error) {
  console.error('파싱 중 에러 발생:', error);
  return null;
}
```

## 제한사항

1. **JavaScript 렌더링**: 일부 SPA는 초기 DOM이 비어있을 수 있습니다. `DOMContentLoaded` 또는 `load` 이벤트 후에 실행하세요.

```typescript
window.addEventListener('load', () => {
  const content = RobustContentExtractor.extractMainContent();
  // 처리...
});
```

2. **Shadow DOM**: Shadow DOM 내부의 콘텐츠는 접근할 수 없습니다.

3. **iframe**: iframe 내부의 콘텐츠는 CORS 정책에 따라 접근이 제한될 수 있습니다.

## 테스트

프로젝트에는 다음 테스트 리소스가 포함되어 있습니다:

- `src/utils/test-parser-simple.html`: 브라우저 기반 테스트 페이지
- `src/utils/test-case/*.html`: 실제 웹사이트 샘플 (txt1~5.html)
- `src/utils/TEST_REPORT.md`: 테스트 결과 보고서

### 테스트 실행

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 테스트 페이지 열기
# http://localhost:5173/src/utils/test-parser-simple.html
```

## 문제 해결

### 콘텐츠가 추출되지 않음

1. 페이지가 완전히 로드되었는지 확인
2. 페이지의 HTML 구조 확인 (개발자 도구)
3. `findLongestTextBlock()` 전략이 실행되는지 확인

### 불필요한 콘텐츠가 포함됨

1. `cleanElement()` 메서드의 선택자 추가
2. `isValidContent()` 조건 강화

### 댓글을 찾을 수 없음

1. 페이지의 댓글 구조 확인
2. `findCommentSections()` 키워드에 해당 사이트의 클래스명 추가

## 라이선스

MIT License

## 지원

문제가 발생하거나 개선 제안이 있으면 이슈를 등록해주세요.
