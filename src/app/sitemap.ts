import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.teeahead.com'
  const posts = getAllPosts()
  const blogEntries: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))
  return [
    { url: `${base}/blog`, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 0.85 },
    ...blogEntries,
    { url: base, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/waitlist/golfer`, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/waitlist/course`, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/golfnow-alternative`, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tee-time-software`, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/best-tee-sheet-software`, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/golf-course-booking-software`, lastModified: new Date('2026-05-11'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/barter`, lastModified: new Date('2026-05-11'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/damage`, lastModified: new Date('2026-05-11'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/case-studies/windsor-parke`, lastModified: new Date('2026-05-11'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/software-cost`, lastModified: new Date('2026-05-11'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/features`, lastModified: new Date('2026-05-11'), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/about`, lastModified: new Date('2026-05-11'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date('2026-05-11'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/terms`, lastModified: new Date('2026-05-11'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date('2026-05-11'), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
