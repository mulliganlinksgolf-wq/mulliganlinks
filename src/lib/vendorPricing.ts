// Legal note: All vendor pricing is based on publicly available market data as of April 2026.
// Last legal review: April 2026. Review again before major marketing campaigns.

export const TEEAHEAD_PRICING = {
  foundingMonthly: 0,
  foundingAnnual: 0,
  standardMonthly: 349,
  standardAnnual: 4188,
  foundingTotalSpots: 10,
  commitmentTiers: [
    { label: 'Standard', monthly: 349 },
    { label: '2-Year',   monthly: 329 },
    { label: '3-Year',   monthly: 309 },
    { label: '5-Year',   monthly: 289 },
  ],
} as const

export const VENDOR_PRICING = {
  foreup: {
    name: 'foreUP',
    medianMonthly: 250,
    minMonthly: 120,
    maxMonthly: 450,
    parent: 'Battery Ventures / Clubessential Holdings (PE)',
    marketplaceDefault: true,
    receipt:
      "foreUP is owned by Battery Ventures, part of a 10,000-customer PE rollup. Their default Supreme Golf integration distributes your tee times to Barstool Golf Time, Golf Digest, and CBS Sports. Every booking through those channels makes Barstool the customer relationship — not you.",
  },
  lightspeed: {
    name: 'Lightspeed Golf',
    medianMonthly: 425,
    minMonthly: 325,
    maxMonthly: 700,
    parent: 'Lightspeed Commerce (public company)',
    marketplaceDefault: true,
    receipt:
      "Lightspeed's privacy policy explicitly states they *'may sell non-personally identifiable information that has been derived from aggregated and de-identified Personal Data.'* Across 2,000+ courses, that aggregated dataset is one of the most valuable assets in golf — and your course data trains it.",
  },
  clubcaddie: {
    name: 'Club Caddie',
    medianMonthly: 299,
    minMonthly: 249,
    maxMonthly: 500,
    parent: 'Jonas Software / Constellation Software',
    marketplaceDefault: true,
    receipt:
      "Club Caddie's privacy policy explicitly says: *'if you book a tee time through the Services, your information will be shared with a third-party tee time aggregator we contract with.'* Your golfers' data goes to aggregators by default — not by accident.",
  },
  clubprophet: {
    name: 'Club Prophet',
    medianMonthly: 400,
    minMonthly: 300,
    maxMonthly: 600,
    parent: 'Independent (30+ years, 1,700 facilities)',
    marketplaceDefault: true,
    receipt:
      "Club Prophet integrated with Supreme Golf in December 2025 — meaning your tee times are now distributed across Barstool Golf Time, Golf Digest, and CBS Sports unless you've explicitly turned it off. Did anyone tell you?",
  },
  jonas: {
    name: 'Jonas Club Software',
    medianMonthly: 5000,
    minMonthly: 3000,
    maxMonthly: 10000,
    parent: 'Constellation Software',
    marketplaceDefault: false,
    receipt:
      "Jonas is enterprise-tier — primarily private clubs. They don't push to public marketplaces, but their aggregate data clauses are standard: anything anonymized can be shared with third parties without restriction.",
  },
  quick18: {
    name: 'Quick 18 (Sagacity)',
    medianMonthly: 250,
    minMonthly: 99,
    maxMonthly: 600,
    parent: 'Sagacity Golf',
    marketplaceDefault: true,
    receipt:
      "Sagacity's value prop is dynamic pricing 'based on cross-course market data' — which is your data, plus 700 other courses' data, used to set prices at all of them. You're paying them to learn from your operation and sell that learning to your competitors.",
  },
  teesnap: {
    name: 'Teesnap',
    medianMonthly: 180,
    minMonthly: 60,
    maxMonthly: 400,
    parent: 'Independent',
    marketplaceDefault: false,
    receipt:
      "Teesnap is one of the more reserved players on consumer data, but they integrate directly with GolfNow as a partner — meaning if you've enabled distribution, you're back in the GolfNow ecosystem.",
  },
  other: {
    name: 'Other / Not sure',
    medianMonthly: 300,
    minMonthly: 100,
    maxMonthly: 800,
    parent: 'Various',
    marketplaceDefault: true,
    receipt:
      "If you're not sure what your vendor is doing with your data, that's the problem. Read your contract's data section and your vendor's privacy policy — specifically the 'aggregated information' and 'third-party partners' clauses. Most courses are surprised by what they find.",
  },
} as const

export type VendorKey = keyof typeof VENDOR_PRICING

export const VENDOR_KEYS: VendorKey[] = [
  'foreup', 'lightspeed', 'clubcaddie', 'clubprophet', 'jonas', 'quick18', 'teesnap', 'other',
]
