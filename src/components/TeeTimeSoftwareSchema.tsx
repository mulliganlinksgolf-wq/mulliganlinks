export function TeeTimeSoftwareSchema() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'TeeAhead',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://www.teeahead.com',
      description: 'Free tee sheet software for golf courses — no barter tee times, no commissions, no lock-in. Includes online booking, golfer loyalty program, league management, and Stripe payments.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Founding Partner — Free Year One',
          price: '0',
          priceCurrency: 'USD',
          description: 'Full platform free for the first year for Founding Partner courses (first 10 courses).',
        },
        {
          '@type': 'Offer',
          name: 'Standard',
          price: '349',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '349',
            priceCurrency: 'USD',
            unitCode: 'MON',
          },
          description: 'Flat monthly rate — no barter tee times, no commissions, no booking fees.',
        },
      ],
      publisher: { '@id': 'https://www.teeahead.com/#organization' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What does TeeAhead tee time software cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TeeAhead is free for the first year for Founding Partner courses (the first 10 to join). After year one, the standard rate is $349/month — a flat fee with no barter tee times, no per-booking commissions, and no hidden fees.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does TeeAhead require barter tee times like GolfNow?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. TeeAhead charges a flat monthly SaaS fee and never requires barter tee times. Courses keep 100% of every round they sell. GolfNow\'s barter model costs the average course roughly $94,500 per year in foregone revenue — TeeAhead has no such arrangement.',
          },
        },
        {
          '@type': 'Question',
          name: 'What features does TeeAhead tee sheet software include?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TeeAhead includes online tee time booking, real-time tee sheet management, Stripe Connect payment processing, QR code check-in, member profiles, golfer loyalty program (Eagle and Ace tiers), league management, rain check and credit system, revenue reporting, and in-round service requests.',
          },
        },
      ],
    },
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
