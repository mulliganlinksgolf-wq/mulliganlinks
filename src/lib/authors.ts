export type AuthorKey = 'neil' | 'billy'

export const AUTHORS: Record<AuthorKey, {
  name: string
  title: string
  bio: string
  schemaId: string
}> = {
  neil: {
    name: 'Neil Barris',
    title: 'Co-Founder & CEO',
    bio: '10 years in enterprise software. Previously built Outing.golf. Lifelong golfer.',
    schemaId: 'https://www.teeahead.com/#neil-barris',
  },
  billy: {
    name: 'Billy Beslock',
    title: 'Co-Founder & CTO',
    bio: 'Career engineer at Ford Motor Company. The systems thinker behind TeeAhead.',
    schemaId: 'https://www.teeahead.com/#billy-beslock',
  },
}
