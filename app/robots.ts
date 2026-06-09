import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 認証配下・API・トークン経由ページはクロール対象外
      disallow: [
        '/api/',
        '/dashboard',
        '/care-recipients',
        '/users',
        '/businesses',
        '/contact',
        '/reset-password/confirm',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
