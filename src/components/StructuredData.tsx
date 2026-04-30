export function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.teeahead.com/#organization',
        name: 'TeeAhead',
        legalName: 'TeeAhead, LLC',
        url: 'https://www.teeahead.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.teeahead.com/logo.png',
          width: 200,
          height: 60,
        },
        description:
          "TeeAhead is Metro Detroit's local-first golf loyalty network. Free tee sheet software for courses, zero booking fees for golfers.",
        foundingDate: '2026',
        email: 'support@teeahead.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Detroit',
          addressRegion: 'MI',
          addressCountry: 'US',
        },
        areaServed: {
          '@type': 'Place',
          name: 'Metro Detroit, Michigan',
        },
        founder: [
          { '@id': 'https://www.teeahead.com/#neil-barris' },
          { '@id': 'https://www.teeahead.com/#billy-beslock' },
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@teeahead.com',
          contactType: 'customer support',
          availableLanguage: 'English',
        },
      },
      {
        '@type': 'Person',
        '@id': 'https://www.teeahead.com/#neil-barris',
        name: 'Neil Barris',
        email: 'neil@teeahead.com',
        jobTitle: 'Co-Founder',
        worksFor: { '@id': 'https://www.teeahead.com/#organization' },
        description: 'Co-founder of TeeAhead. 10 years in software as a Customer Success Manager at companies including Samsung, FinTech, and Observability. Previously built Outing.golf, a golf group booking platform. Based in Metro Detroit.',
        knowsAbout: ['Golf course management software', 'Tee time booking systems', 'Golf loyalty programs', 'Customer success', 'Golf industry SaaS'],
      },
      {
        '@type': 'Person',
        '@id': 'https://www.teeahead.com/#billy-beslock',
        name: 'Billy Beslock',
        email: 'billy@teeahead.com',
        jobTitle: 'Co-Founder',
        worksFor: { '@id': 'https://www.teeahead.com/#organization' },
        description: 'Co-founder of TeeAhead. Career engineer at Ford Motor Company with decades of experience in complex operational systems. The systems thinker behind the TeeAhead loyalty mechanic and membership tier model. Metro Detroit native.',
        knowsAbout: ['Golf membership programs', 'Golf loyalty programs', 'Systems engineering', 'Consumer product design'],
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
              '$120/yr in tee time credits, 1 free round, always-on booking fee waiver, 10% green fee discount.',
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
              '$240/yr in tee time credits, 2 free rounds, 24 guest fee waivers, concierge booking, 15% green fee discount.',
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
