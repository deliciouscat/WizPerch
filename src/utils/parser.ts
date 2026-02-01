class RobustContentExtractor {
  // 메인 콘텐츠 추출 (우선순위 기반)
  static extractMainContent() {
    const strategies = [
      // 1. 시맨틱 HTML5
      { fn: () => document.querySelector('article') },
      { fn: () => document.querySelector('main') },
      { fn: () => document.querySelector('[role="main"]') },
      
      // 2. 일반적인 클래스명
      { fn: () => document.querySelector('.article-body') },
      { fn: () => document.querySelector('.post-content') },
      { fn: () => document.querySelector('.entry-content') },
      { fn: () => document.querySelector('[class*="article"]') },
      { fn: () => document.querySelector('[class*="content"]') },
      
      // 3. ID 기반
      { fn: () => document.querySelector('#article') },
      { fn: () => document.querySelector('#content') },
      
      // 4. 가장 긴 p 태그 집합의 부모
      { fn: () => this.findLongestTextBlock() }
    ];
    
    for (const strategy of strategies) {
      const element = strategy.fn();
      
      if (element && this.isValidContent(element)) {
        return this.cleanElement(element);
      }
    }
    
    return null;
  }
  
  // 가장 긴 텍스트 블록 찾기 (충분히 길지 않으면 여러 블록 결합)
  static findLongestTextBlock() {
    const MIN_CONTENT_LENGTH = 25600; // 최소 콘텐츠 길이
    const MIN_PARAGRAPHS = 2; // 최소 p 태그 개수 (3에서 2로 완화)
    const candidates: Array<{ element: Element; score: number; textLength: number }> = [];
    
    document.querySelectorAll('div, section, article').forEach(el => {
      // 점수 계산: p 태그 개수 * 평균 텍스트 길이
      const paragraphs = el.querySelectorAll('p');
      if (paragraphs.length < MIN_PARAGRAPHS) return; // 너무 적으면 제외
      
      const totalText = Array.from(paragraphs)
        .map(p => (p.textContent || '').length)
        .reduce((a, b) => a + b, 0);
      
      const score = paragraphs.length * (totalText / paragraphs.length);
      
      candidates.push({
        element: el,
        score: score,
        textLength: totalText
      });
    });
    
    // 점수 순으로 정렬
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length === 0) return null;
    
    // 가장 긴 블록이 충분히 길면 그것만 반환
    if (candidates[0].textLength >= MIN_CONTENT_LENGTH) {
      return candidates[0].element;
    }
    
    // 충분히 길지 않으면 상위 블록들을 결합
    let combinedLength = 0;
    const selectedElements: Element[] = [];
    
    for (let i = 0; i < Math.min(3, candidates.length); i++) {
      selectedElements.push(candidates[i].element);
      combinedLength += candidates[i].textLength;
      
      if (combinedLength >= MIN_CONTENT_LENGTH) break;
    }
    
    // 여러 블록을 하나의 컨테이너로 결합
    if (selectedElements.length > 1) {
      const container = document.createElement('div');
      selectedElements.forEach(el => {
        const clone = el.cloneNode(true);
        container.appendChild(clone);
      });
      return container;
    }
    
    return selectedElements[0] || null;
  }
  
  // 유효한 콘텐츠인지 확인
  static isValidContent(element: Element) {
    const text = (element.textContent || '').trim();
    
    // 최소 길이 체크
    if (text.length < 50) {
      return false;
    }
    
    // 링크 비율 체크 (네비게이션일 수 있음)
    const links = element.querySelectorAll('a');
    const linkTextLength = Array.from(links)
      .map(a => (a.textContent || '').length)
      .reduce((a, b) => a + b, 0);
    
    const linkRatio = linkTextLength / text.length;
    if (linkRatio > 0.5) {
      return false;
    }
    
    return true;
  }
  
  // 댓글 섹션 찾기 (더 정교하게)
  static findCommentSections() {
    const commentKeywords = [
      'comment', 'reply', 'discussion', 'review', 'feedback',
      '댓글', '답글', '의견', '리뷰', '토론'
    ];
    
    const candidates = new Set();
    
    // 1. 키워드 기반
    commentKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'i');
      
      document.querySelectorAll('*').forEach(el => {
        const className = el.className || '';
        const id = el.id || '';
        
        if (regex.test(className) || regex.test(id)) {
          // 부모 중에서 가장 큰 댓글 컨테이너 찾기
          let container = el;
          let parent = el.parentElement;
          
          while (parent) {
            if (this.looksLikeCommentContainer(parent)) {
              container = parent;
            }
            parent = parent.parentElement;
          }
          
          candidates.add(container);
        }
      });
    });
    
    // 2. 구조 기반 (반복 요소)
    document.querySelectorAll('ul, ol, div').forEach(el => {
      if (this.looksLikeCommentList(el)) {
        candidates.add(el);
      }
    });
    
    return Array.from(candidates);
  }
  
  static looksLikeCommentContainer(element: Element) {
    const children = Array.from(element.children);
    if (children.length < 2) return false;
    
    // 자식 중 비슷한 구조가 반복되는지
    const tagNames = children.map(c => c.tagName);
    const uniqueTags = new Set(tagNames);
    
    // 같은 태그가 3개 이상 반복
    return tagNames.some(tag => 
      tagNames.filter(t => t === tag).length >= 3
    );
  }
  
  static looksLikeCommentList(element: Element) {
    const items = Array.from(element.children);
    if (items.length < 3) return false;
    
    // 각 아이템이 적당한 길이의 텍스트를 가지고 있는지
    const validItems = items.filter(item => {
      const text = (item.textContent || '').trim();
      return text.length > 20 && text.length < 5000;
    });
    
    return validItems.length >= 3;
  }
  
  // 요소 정리 (script, style 등 제거)
  static cleanElement(element: Element) {
    const clone = element.cloneNode(true) as Element;
    
    // 제거할 요소들
    const removeSelectors = [
      'script', 'style', 'noscript', 'iframe',
      'nav', 'header', 'footer', 'aside',
      '.ad', '.advertisement', '[class*="banner"]',
      '[class*="comment"]', '[id*="comment"]' // 댓글은 따로 추출
    ];
    
    removeSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    return (clone.textContent || '').trim();
  }
}


/* 실제 사용 */
/*
// content-script.js
function parseAnyPage() {
  return {
    url: location.href,
    title: document.title,
    
    // 메인 콘텐츠 - 여러 전략 시도
    mainContent: RobustContentExtractor.extractMainContent(),
    
    // 댓글 - 자동 탐지
    comments: RobustContentExtractor.findCommentSections()
      .flatMap(section => extractCommentsFromSection(section))
  };
}

function extractCommentsFromSection(section) {
  const items = [];
  
  // 가능한 댓글 아이템 패턴들
  const itemSelectors = [
    'li', '.comment-item', '[class*="comment"]',
    'article', '.reply', '[class*="reply"]'
  ];
  
  itemSelectors.forEach(selector => {
    section.querySelectorAll(selector).forEach(item => {
      const text = extractTextOnly(item);
      if (text && text.length > 15) {
        items.push({
          text,
          author: findAuthor(item),
          likes: findLikes(item)
        });
      }
    });
  });
  
  return items;
}

function extractTextOnly(element) {
  const clone = element.cloneNode(true);
  
  // UI 요소 제거
  clone.querySelectorAll('button, input, textarea, a[class*="btn"]').forEach(el => el.remove());
  
  return clone.textContent.trim();
}
*/