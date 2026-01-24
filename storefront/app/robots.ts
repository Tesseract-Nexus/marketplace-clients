import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  // Construct the base URL
  const baseUrl = `${protocol}://${host}`;

  return {
    rules: [
      // Standard web crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/login',
          '/register',
          '/*?*', // Disallow query parameters to prevent duplicate content issues
        ],
      },
      // AI Crawlers - allow access to product/content pages
      {
        userAgent: [
          'GPTBot',
          'Claude-Web',
          'PerplexityBot',
          'Anthropic-AI',
          'ChatGPT-User',
          'Google-Extended',
          'CCBot',
        ],
        allow: [
          '/',
          '/products/',
          '/categories/',
          '/about',
          '/contact',
          '/llms.txt',
        ],
        disallow: [
          '/api/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
