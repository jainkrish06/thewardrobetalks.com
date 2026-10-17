const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://wardrobetalks.com'

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
