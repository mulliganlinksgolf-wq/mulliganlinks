export interface KbCategory {
  id: string
  title: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  created_at: string
}

export interface KbArticle {
  id: string
  category_id: string | null
  title: string
  slug: string
  content: string
  excerpt: string | null
  is_published: boolean
  sort_order: number
  helpful_yes: number
  helpful_no: number
  created_at: string
  updated_at: string
  category?: KbCategory | null
}
