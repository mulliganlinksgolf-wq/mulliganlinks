export function GolfnowAlternativeSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': 'https://www.teeahead.com/golfnow-alternative#article',
    headline: 'The Best GolfNow Alternative for Golf Courses and Golfers',
    description:
      'TeeAhead is Metro Detroit\'s local-first golf platform — free tee sheet software for courses with zero barter tee times, and a loyalty membership for golfers that beats GolfPass+ on every metric.',
    url: 'https://www.teeahead.com/golfnow-alternative',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://www.teeahead.com/golfnow-alternative',
    },
    datePublished: '2026-04-27',
    dateModified: '2026-04-30',
    author: { '@id': 'https://www.teeahead.com/#neil-barris' },
    publisher: { '@id': 'https://www.teeahead.com/#organization' },
    image: {
      '@type': 'ImageObject',
      url: 'https://www.teeahead.com/og-image.png',
      width: 1200,
      height: 630,
    },
    articleSection: 'Golf Industry Analysis',
    about: [
      { '@type': 'Thing', name: 'GolfNow' },
      { '@type': 'Thing', name: 'GolfPass+' },
    ],
    mentions: [
      { '@type': 'Organization', name: 'Windsor Parke Golf Club' },
      { '@type': 'Organization', name: 'Missouri Bluffs Golf Club' },
      { '@type': 'Organization', name: 'National Golf Course Owners Association' },
    ],
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'h2', 'p:first-of-type'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
