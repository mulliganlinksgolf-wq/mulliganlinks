import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import { AUTHORS } from '@/lib/authors'
import { PostSidebar } from '@/components/blog/PostSidebar'
import { AuthorBio } from '@/components/blog/AuthorBio'
import { Callout } from '@/components/blog/Callout'
import { StatBlock } from '@/components/blog/StatBlock'
import { ComparisonTable, Th, Td } from '@/components/blog/ComparisonTable'
import { TeeAheadLogo } from '@/components/TeeAheadLogo'

const CATEGORY_LABELS: Record<string, string> = {
  courses: 'For Courses',
  golfers: 'For Golfers',
  'case-studies': 'Case Study',
}

const MDX_COMPONENTS = { Callout, StatBlock, ComparisonTable, Th, Td }

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://www.teeahead.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.teeahead.com/blog/${post.slug}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  }
}

function PostSchema({ post }: { post: NonNullable<ReturnType<typeof getPostBySlug>> }) {
  const author = AUTHORS[post.author]
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      url: `https://www.teeahead.com/blog/${post.slug}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { '@id': author.schemaId },
      publisher: { '@id': 'https://www.teeahead.com/#organization' },
      image: { '@type': 'ImageObject', url: 'https://www.teeahead.com/og-image.png', width: 1200, height: 630 },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.teeahead.com' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.teeahead.com/blog' },
        { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.teeahead.com/blog/${post.slug}` },
      ],
    },
  ]
  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
    </>
  )
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = getRelatedPosts(post.slug, post.category)
  const author = AUTHORS[post.author]
  const initials = author.name.split(' ').map(n => n[0]).join('')
  const publishDate = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <PostSchema post={post} />

      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-14 w-auto" /></Link>
          <nav className="flex items-center gap-3">
            <Link href="/blog" className="hidden sm:inline-flex text-sm font-semibold text-gray-500 hover:text-[#0F3D2E] transition-colors">
              ← All Posts
            </Link>
            <Link href="/waitlist/golfer" className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-4 py-2 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity">
              Join the Waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
          {/* Article */}
          <article>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-[#E0A800] uppercase tracking-wide">
                {CATEGORY_LABELS[post.category]}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{post.readingTime} min read</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#0F3D2E] leading-tight mb-5">
              {post.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#0F3D2E] flex items-center justify-center text-[#E0A800] text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <span className="text-sm font-semibold text-[#0F3D2E]">{author.name}</span>
                <span className="text-gray-300 mx-2">·</span>
                <span className="text-sm text-gray-400">{publishDate}</span>
              </div>
            </div>

            <hr className="border-black/10 mb-8" />

            <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-[#0F3D2E] prose-headings:font-bold prose-a:text-[#0F3D2E] prose-a:underline prose-strong:text-[#0F3D2E]">
              <MDXRemote source={post.content} components={MDX_COMPONENTS} />
            </div>

            <AuthorBio authorKey={post.author} />
          </article>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PostSidebar category={post.category} related={related} />
          </div>
        </div>
      </main>

      <footer className="border-t border-black/5 py-8 text-center text-sm text-gray-400">
        <p>© 2026 TeeAhead, LLC · <Link href="/terms" className="hover:text-gray-600">Terms</Link> · <Link href="/privacy" className="hover:text-gray-600">Privacy</Link></p>
      </footer>
    </div>
  )
}
