import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // Construct the base URL
  const baseUrl = `${protocol}://${host}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/account/',
        '/checkout/',
        '/cart/',
        '/*?*', // Disallow query parameters to prevent duplicate content issues
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
