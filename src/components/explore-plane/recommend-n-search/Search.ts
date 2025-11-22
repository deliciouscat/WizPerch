import type { PageData } from '@/types'

/**
 * 키워드 검색 함수 (Pure Function)
 * 
 * @param query 검색어
 * @param contents 검색할 페이지 데이터 목록
 * @returns 필터링된 페이지 데이터 목록
 */
export function keyword_search(query: string, contents: PageData[]): PageData[] {
  // 대소문자 구분 없이 검색
  const queryLower = query.toLowerCase()
  
  return contents.filter(c => 
    c.title.toLowerCase().includes(queryLower) ||
    c.description.toLowerCase().includes(queryLower) ||
    c.keyword.some(k => k.toLowerCase().includes(queryLower))
  )
}

