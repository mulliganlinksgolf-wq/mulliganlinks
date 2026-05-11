export function TeeTimeSoftwareSchema() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': 'https://www.teeahead.com/tee-time-software#article',
      headline: 'Free Tee Time Software for Golf Courses',
      description:
        'Free tee sheet software for golf courses — no barter tee times, no commissions, no lock-in. Compare TeeAhead vs. GolfNow, foreUP, and Lightspeed Golf.',
      url: 'https://www.teeahead.com/tee-time-software',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://www.teeahead.com/tee-time-software',
      },
      datePublished: '2026-04-27',
      dateModified: '2026-05-11',
      author: { '@id': 'https://www.teeahead.com/#neil-barris' },
      publisher: { '@id': 'https://www.teeahead.com/#organization' },
      image: {
        '@type': 'ImageObject',
        url: 'https://www.teeahead.com/og-image.png',
        width: 1200,
        height: 630,
      },
      articleSection: 'Tee Sheet Software Buying Guide',
      about: [
        { '@type': 'SoftwareApplication', name: 'TeeAhead', url: 'https://www.teeahead.com' },
        { '@type': 'SoftwareApplication', name: 'foreUP' },
        { '@type': 'SoftwareApplication', name: 'Lightspeed Golf' },
        { '@type': 'Organization', name: 'GolfNow' },
      ],
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', 'h2', 'p:first-of-type'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.teeahead.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tee Time Software',
          item: 'https://www.teeahead.com/tee-time-software',
        },
      ],
    },
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
