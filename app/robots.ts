import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://aegis.gdgoc.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/my-images',
          '/result/*',
          '/api/*',
          '/admin/*'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  }
}