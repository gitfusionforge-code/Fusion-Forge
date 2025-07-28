import { firebaseRealtimeStorage as storage } from "./firebase-realtime-storage";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function generateSitemap(): Promise<string> {
  const baseUrl = process.env.BASE_URL || 'https://fusionforge.replit.app';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'daily' as const, priority: 1.0 },
    { path: '/builds', changefreq: 'daily' as const, priority: 0.9 },
    { path: '/configurator', changefreq: 'weekly' as const, priority: 0.8 },
    { path: '/about', changefreq: 'monthly' as const, priority: 0.7 },
    { path: '/services', changefreq: 'monthly' as const, priority: 0.7 },
    { path: '/faq', changefreq: 'weekly' as const, priority: 0.6 },
    { path: '/contact', changefreq: 'monthly' as const, priority: 0.5 }
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Dynamic pages - PC builds
  try {
    const builds = await storage.getPcBuilds();
    builds.forEach(build => {
      urls.push({
        loc: `${baseUrl}/builds/${build.id}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8
      });
    });

    // Category pages
    const categories = Array.from(new Set(builds.map(build => build.category)));
    categories.forEach(category => {
      urls.push({
        loc: `${baseUrl}/builds?category=${encodeURIComponent(category)}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 0.7
      });
    });
  } catch (error) {
    console.error('Error fetching builds for sitemap:', error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

export async function generateRobotsTxt(): Promise<string> {
  const baseUrl = process.env.BASE_URL || 'https://fusionforge.replit.app';
  
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1

# Disallow admin and API endpoints
Disallow: /admin
Disallow: /api/

# Allow important pages
Allow: /builds
Allow: /configurator
Allow: /about
Allow: /services
Allow: /faq
Allow: /contact`;
}