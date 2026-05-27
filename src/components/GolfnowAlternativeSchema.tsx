export function GolfnowAlternativeSchema() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.teeahead.com' },
      { '@type': 'ListItem', position: 2, name: 'GolfNow Alternative', item: 'https://www.teeahead.com/golfnow-alternative' },
    ],
  }

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

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does GolfNow actually cost a golf course?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'GolfNow requires courses to provide 2 barter tee times per day that GolfNow sells and keeps the revenue from. At a $315 average rack rate, that transfers roughly $94,500 per year in tee time revenue from the course to GolfNow — revenue that never appears on any invoice.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the best GolfNow alternative for golf courses?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TeeAhead is a commission-free tee sheet software for independent and semi-private golf courses. It charges a flat $349/month (with no barter tee times, no booking commissions, and no data extraction) after a free first year for Founding Partners. Courses keep 100% of every round they sell.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who should consider leaving GolfNow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Established courses with a returning customer base and an existing email list are the best candidates to leave GolfNow. If the majority of your GolfNow bookings are from golfers who already know your course, you are effectively paying GolfNow to take credit for demand you generated yourself. Courses that have made the switch — like Windsor Parke and Missouri Bluffs — consistently report revenue gains after leaving.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is TeeAhead really free for golf courses?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The first year is free for Founding Partner courses (the first 10 to join). After year one, TeeAhead costs $349/month — a flat SaaS fee with no barter tee times, no per-booking commissions, and no hidden fees. Compare this to GolfNow, where the effective annual cost in barter tee times alone typically exceeds $90,000.',
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
