import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/admin/', '/course/', '/api/'],
      },
    ],
    sitemap: 'https://www.teeahead.com/sitemap.xml',
  }
}
