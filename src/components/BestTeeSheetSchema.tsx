export function BestTeeSheetSchema() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'TeeAhead',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://www.teeahead.com',
      description: 'The best tee sheet software for independent golf courses — no barter tee times, no commissions, built-in golfer loyalty program. Free first year for Founding Partners, then $349/month.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Founding Partner — Free Year One',
          price: '0',
          priceCurrency: 'USD',
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
          name: 'Which tee sheet software is best for small and independent golf courses?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TeeAhead is built specifically for independent and semi-private golf courses. It charges a flat $349/month with no barter tee times and no per-booking commissions. foreUP and Lightspeed Golf are also strong options for independent courses, though both charge $400–$800/month. GolfNow is not recommended for established courses due to its barter tee time requirement.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does TeeAhead compare to foreUP for golf courses?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TeeAhead costs $349/month versus foreUP\'s $400–$800/month, and TeeAhead includes a built-in golfer loyalty program that foreUP does not. Both platforms offer online booking, tee sheet management, and payment processing with no barter tee times. TeeAhead is currently focused on Metro Detroit while foreUP serves courses nationally.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the cheapest tee sheet software for golf courses?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TeeAhead is the least expensive full-featured tee sheet software at $349/month, with the first year free for Founding Partner courses. GolfNow offers free software but requires barter tee times worth $80,000–$100,000/year in foregone revenue, making it the most expensive option in practice.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does tee sheet software replace GolfNow?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Modern tee sheet platforms like TeeAhead, foreUP, and Lightspeed Golf provide all the functionality of GolfNow — online booking, tee sheet management, payment processing — without requiring barter tee times or paying commissions per booking. Courses that switch typically recover the software cost within the first few weeks of the season.',
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': 'https://www.teeahead.com/best-tee-sheet-software#article',
      headline: 'Best Tee Sheet Software for Golf Courses in 2026',
      description: 'An honest comparison of the best tee sheet software for golf courses in 2026 — TeeAhead, foreUP, Lightspeed Golf, Club Caddie, and GolfNow. Pricing, features, and who each platform is best for.',
      url: 'https://www.teeahead.com/best-tee-sheet-software',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://www.teeahead.com/best-tee-sheet-software',
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
        { '@type': 'ListItem', position: 2, name: 'Best Tee Sheet Software 2026', item: 'https://www.teeahead.com/best-tee-sheet-software' },
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
