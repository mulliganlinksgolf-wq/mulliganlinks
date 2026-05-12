export function GolfCourseBookingSoftwareSchema() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'TeeAhead',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://www.teeahead.com',
      description: 'Golf course booking software with no commissions, no barter tee times, and no long-term contracts. Includes real-time tee sheet management, Stripe payments, golfer loyalty program, and league management.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Founding Partner — Free Year One',
          price: '0',
          priceCurrency: 'USD',
          description: 'Full platform free for the first year for Founding Partner courses.',
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
          description: 'Flat monthly rate — no commissions, no barter, no booking fees.',
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
          name: 'Does golf course booking software charge commissions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'It depends on the platform. GolfNow requires barter tee times worth $80,000–$100,000/year in foregone revenue. Other third-party booking engines charge $1–$3.50 per player per round. TeeAhead charges a flat $349/month with zero commissions and zero barter tee times — courses keep 100% of every round they sell.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the best free golf course booking software?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TeeAhead offers a full first year free for Founding Partner courses (the first 10 to join) and charges $349/month thereafter with no commissions or barter tee times. GolfNow offers free software but requires barter tee times that transfer $80,000–$100,000/year in revenue to GolfNow — making it one of the most expensive options in practice.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does golf course booking software work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Golf course booking software lets operators post available tee times and green fee rates online. Golfers search and book directly through the platform. Payments process via Stripe or similar payment processors directly to the course. Staff manage check-ins, cancellations, and reporting through a dashboard. TeeAhead adds a golfer loyalty layer on top of core booking.',
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': 'https://www.teeahead.com/golf-course-booking-software#article',
      headline: 'Golf Course Booking Software With No Commissions and No Barter',
      description: 'TeeAhead is free golf course booking software for independent and semi-private courses. No commissions per booking, no barter tee times, no long-term contracts.',
      url: 'https://www.teeahead.com/golf-course-booking-software',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://www.teeahead.com/golf-course-booking-software',
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
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', 'h2', 'p:first-of-type'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.teeahead.com' },
        { '@type': 'ListItem', position: 2, name: 'Golf Course Booking Software', item: 'https://www.teeahead.com/golf-course-booking-software' },
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
