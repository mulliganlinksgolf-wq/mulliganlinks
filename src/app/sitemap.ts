import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.teeahead.com'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/waitlist/golfer`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/waitlist/course`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/golfnow-alternative`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tee-time-software`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/best-tee-sheet-software`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/golf-course-booking-software`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/barter`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/damage`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/case-studies/windsor-parke`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
