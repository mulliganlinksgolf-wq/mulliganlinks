export function HomepageFaqSchema() {
  const schema = {
    '@context': 'https://schema.org',
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
          text: 'TeeAhead Eagle membership ($89/yr) beats GolfPass+ ($119/yr) on every metric: 250 bonus Fairway Points on signup, 1 complimentary round/yr (course-provided), always-on booking fee waiver, 2× points multiplier, 48hr priority booking, and a 10% birthday credit.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the TeeAhead Founding Partner program?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The first 10 golf courses to join TeeAhead in Metro Detroit receive Founding Partner status — the full platform free for your first year. The only requirement is that partner courses promote TeeAhead membership to their golfers at the point of booking. Course #11 onward pays $349/month.',
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
