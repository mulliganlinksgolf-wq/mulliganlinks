import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type Category = 'courses' | 'golfers' | 'case-studies'

export interface PostMeta {
  slug: string
  title: string
  description: string
  author: 'neil' | 'billy'
  publishedAt: string
  updatedAt: string
  category: Category
}

export interface Post extends PostMeta {
  content: string
  readingTime: number
}

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog')

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export function getAllPosts(): (PostMeta & { readingTime: number })[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  return files
    .map(file => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
      const { data, content } = matter(raw)
      return {
        slug: data.slug as string,
        title: data.title as string,
        description: data.description as string,
        author: data.author as 'neil' | 'billy',
        publishedAt: data.publishedAt as string,
        updatedAt: data.updatedAt as string,
        category: data.category as Category,
        readingTime: calcReadingTime(content),
      }
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getPostBySlug(slug: string): Post | null {
  if (!fs.existsSync(BLOG_DIR)) return null
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
    const { data, content } = matter(raw)
    if (data.slug === slug) {
      return {
        slug: data.slug as string,
        title: data.title as string,
        description: data.description as string,
        author: data.author as 'neil' | 'billy',
        publishedAt: data.publishedAt as string,
        updatedAt: data.updatedAt as string,
        category: data.category as Category,
        content,
        readingTime: calcReadingTime(content),
      }
    }
  }
  return null
}

export function getRelatedPosts(currentSlug: string, category: Category, limit = 3): PostMeta[] {
  const all = getAllPosts().filter(p => p.slug !== currentSlug)
  const sameCategory = all.filter(p => p.category === category)
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit)
  const others = all.filter(p => p.category !== category)
  return [...sameCategory, ...others].slice(0, limit)
}
