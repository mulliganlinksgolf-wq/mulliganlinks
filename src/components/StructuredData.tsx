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
        sameAs: [],
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
          'Golf tee time booking and loyalty platform for Metro Detroit. Free for partner courses. Eagle membership $79/yr beats GolfPass+ on every metric.',
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
            price: '79',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '79',
              priceCurrency: 'USD',
              unitCode: 'ANN',
            },
            description:
              '$180/yr in tee time credits, 2 free rounds, always-on booking fee waiver, 10% green fee discount.',
          },
          {
            '@type': 'Offer',
            name: 'Ace Membership',
            price: '149',
            priceCurrency: 'USD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '149',
              priceCurrency: 'USD',
              unitCode: 'ANN',
            },
            description:
              '$300/yr in tee time credits, 4 free rounds, unlimited guest passes, concierge booking, 15% green fee discount.',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is TeeAhead free for golf courses?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. TeeAhead is completely free for the first 10 Founding Partner courses — free for your first year. There are no barter tee times, no commissions, and no data extraction. TeeAhead makes money from golfer memberships, not from courses.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does TeeAhead compare to GolfPass+?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'TeeAhead Eagle membership ($79/yr) beats GolfPass+ ($119/yr) on every metric: $180/yr in tee time credits vs $120, 2 free rounds vs zero, always-on booking fee waiver vs 12 times per year, 12 guest passes vs none, 10% green fee discount vs none, and a $25 birthday credit vs none.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the TeeAhead Founding Partner program?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The first 10 golf courses to join TeeAhead in Metro Detroit receive Founding Partner status — the full platform free for your first year. The only requirement is that partner courses promote TeeAhead membership to their golfers at the point of booking. Course #11 onward pays $299/month.',
            },
          },
          {
            '@type': 'Question',
            name: 'What does GolfNow actually cost a golf course?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'GolfNow takes approximately 2 barter tee times per day at rack rate. At 300 operating days per year, that equals roughly $94,500 per year in lost revenue for an average course. High-volume courses can lose $150,000 or more annually.',
            },
          },
          {
            '@type': 'Question',
            name: 'What are Fairway Points?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Fairway Points are TeeAhead's loyalty currency. Every dollar you spend on green fees at partner courses earns Fairway Points. Eagle members earn 2x points, Ace members earn 3x. Points can be redeemed for tee time credits at any partner course in the network.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
