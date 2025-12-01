// 타입 정의

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

export interface SavedTabGroup {
  id?: string
  save_date: string
  pages: PageData[]
}

export type AppMode = 'explore' | 'pending'
export type OverlayMode = 'account' | 'settings' | null

