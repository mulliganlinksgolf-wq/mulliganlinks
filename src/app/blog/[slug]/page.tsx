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
import { SiteFooter } from '@/components/SiteFooter'
import { FadeIn } from '@/components/FadeIn'

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
    },
  }
}

function PostSchema({ post }: { post: NonNullable<ReturnType<typeof getPostBySlug>> }) {
  const author = AUTHORS[post.author]
  const schemas: object[] = [
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
  if (post.faqs && post.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    })
  }
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

      <header className="bg-white border-b border-[#0F3D2E]/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/"><TeeAheadLogo className="h-12 w-auto" /></Link>
          <div className="flex items-center gap-5">
            <Link
              href="/blog"
              className="hidden sm:inline font-mono text-[10.5px] tracking-[0.14em] uppercase text-[#0F3D2E]/70 hover:text-[#0F3D2E] transition-colors"
            >
              ← All posts
            </Link>
            <Link
              href="/waitlist/course"
              className="rounded-md bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:bg-[#0F3D2E]/90 transition-colors"
            >
              Claim a spot →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 lg:gap-16">
            {/* Article */}
            <article>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-[#E0A800] font-bold">
                  {CATEGORY_LABELS[post.category]}
                </span>
                <span className="text-[#0F3D2E]/30">·</span>
                <span className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-[#6B7770]">
                  {post.readingTime} min read
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-display text-[#0F3D2E] tracking-[-0.025em] leading-[1.05]"
                style={{ fontSize: 'clamp(36px, 5.5vw, 60px)', fontWeight: 400 }}
              >
                {post.title}
              </h1>

              {/* Author marginalia */}
              <div className="mt-7 flex items-center gap-3">
                <span
                  className="size-9 rounded-full bg-[#0F3D2E] text-[#E0A800] flex items-center justify-center font-display text-[13px]"
                  style={{ fontWeight: 400 }}
                >
                  {initials}
                </span>
                <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[#6B7770]">
                  <span className="text-[#0F3D2E] font-semibold">{author.name}</span>
                  <span className="mx-2 text-[#0F3D2E]/30">·</span>
                  <span>{publishDate}</span>
                </div>
              </div>

              <hr className="border-[#0F3D2E]/10 my-10" />

              {/* MDX body */}
              <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-[#0F3D2E] prose-headings:font-display prose-headings:font-normal prose-headings:tracking-[-0.015em] prose-a:text-[#0F3D2E] prose-a:underline prose-a:underline-offset-[3px] prose-strong:text-[#0F3D2E] prose-p:leading-[1.75]">
                <MDXRemote source={post.content} components={MDX_COMPONENTS} />
              </div>

              <AuthorBio authorKey={post.author} />
            </article>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-12 lg:self-start">
              <PostSidebar category={post.category} related={related} />
            </div>
          </div>
        </FadeIn>
      </main>

      <SiteFooter />
    </div>
  )
}
