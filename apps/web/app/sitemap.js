const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://wardrobetalks.com'

export default async function sitemap() {
  const now = new Date()
  const staticPages = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/#women`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/#men`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/#celebrity`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/#about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/#contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  try {
    const res = await fetch(`${BASE}/api/products`, { cache: 'no-store' })
    const products = await res.json()
    if (Array.isArray(products)) {
      products.forEach(p => {
        staticPages.push({
          url: `${BASE}/#product-${p.id}`,
          lastModified: new Date(p.createdAt || now),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      })
    }
  } catch {}

  return staticPages
}
