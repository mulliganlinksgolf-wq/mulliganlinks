export function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.teeahead.com/#organization',
        name: 'TeeAhead',
        url: 'https://www.teeahead.com',
        logo: 'https://www.teeahead.com/logo.png',
        description:
          "TeeAhead is Metro Detroit's local-first golf loyalty network. Free tee sheet software for courses, zero booking fees for golfers.",
        foundingDate: '2026',
        areaServed: {
          '@type': 'Place',
          name: 'Metro Detroit, Michigan',
        },
        sameAs: [
          'https://www.linkedin.com/company/teeahead',
          'https://www.crunchbase.com/organization/teeahead',
        ],
        founder: [
          { '@id': 'https://www.teeahead.com/#neil-barris' },
          { '@id': 'https://www.teeahead.com/#billy-beslock' },
        ],
      },
      {
        '@type': 'Person',
        '@id': 'https://www.teeahead.com/#neil-barris',
        name: 'Neil Barris',
        jobTitle: 'Co-founder',
        worksFor: { '@id': 'https://www.teeahead.com/#organization' },
        email: 'neil@teeahead.com',
        url: 'https://www.teeahead.com/about',
        description:
          'Co-founder of TeeAhead. Previously built Outing.golf, a golf group booking platform serving Metro Detroit courses.',
      },
      {
        '@type': 'Person',
        '@id': 'https://www.teeahead.com/#billy-beslock',
        name: 'Billy Beslock',
        jobTitle: 'Co-founder',
        worksFor: { '@id': 'https://www.teeahead.com/#organization' },
        url: 'https://www.teeahead.com/about',
        description:
          'Co-founder of TeeAhead. Career at Ford Motor Company. Lifelong Metro Detroit golfer.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.teeahead.com/#website',
        url: 'https://www.teeahead.com',
        name: 'TeeAhead',
        publisher: { '@id': 'https://www.teeahead.com/#organization' },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'TeeAhead',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        url: 'https://www.teeahead.com',
        description:
          'Golf tee time booking and loyalty platform for Metro Detroit. Free for partner courses. Eagle membership $89/yr beats GolfPass+ on every metric.',
        offers: [
          {
            '@type': 'Offer',
            name: 'Fairway — Free Tier',
            price: '0',
            priceCurrency: 'USD',
            description: 'Book tee times at partner courses, earn Fairway Points, zero booking fees.',
          },
          {
            '@type': 'Offer',
            name: 'Eagle Membership',
            price: '89',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '89',
              priceCurrency: 'USD',
              unitCode: 'ANN',
            },
            description:
              '250 bonus Fairway Points, 2x points multiplier, 1 annual guest pass, always-on booking fee waiver, 48-hour priority booking.',
          },
          {
            '@type': 'Offer',
            name: 'Ace Membership',
            price: '159',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '159',
              priceCurrency: 'USD',
              unitCode: 'ANN',
            },
            description:
              '500 bonus Fairway Points, 3x points multiplier, 2 annual guest passes, always-on booking fee waiver, 72-hour priority booking.',
          },
        ],
      },
      // FAQPage is intentionally omitted here — it is scoped to the homepage only
      // via HomepageSchema to avoid schema validity violations on non-FAQ pages.
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
