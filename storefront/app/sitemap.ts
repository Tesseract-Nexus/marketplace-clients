import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { 
  getProducts, 
  getCategories, 
  getContentPages, 
  resolveStorefront 
} from '@/lib/api/storefront';
import { resolveTenantInfo } from '@/lib/tenant';

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'tesserix.app';

// Helper to extract tenant slug from host (mirroring middleware logic)
function getTenantFromHost(host: string): string | null {
  const hostname = host.split(':')[0] || '';
  
  if (hostname && hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '');
    if (['www', 'api', 'admin', 'dev-store', 'dev-admin'].includes(subdomain)) {
      return null;
    }
    return subdomain;
  }
  
  // Fallback for localhost testing
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    // In development, we might not be able to determine tenant from root sitemap.xml
    // unless we use a subdomain like demo.localhost
    return 'demo-store'; 
  }

  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const tenantSlug = getTenantFromHost(host);
  if (!tenantSlug) {
    return [];
  }

  // Resolve Tenant and Storefront IDs
  const [resolution, tenantHost] = await Promise.all([
    resolveStorefront(tenantSlug),
    resolveTenantInfo(tenantSlug),
  ]);

  if (!resolution || !tenantHost) {
    return [];
  }

  const storefrontId = resolution.id || tenantHost.storefront_id || tenantHost.tenant_id;
  const tenantId = resolution.tenantId || tenantHost.tenant_id;

  // Fetch all data in parallel
  const [productsResponse, categories, contentPages] = await Promise.all([
    getProducts(tenantId, storefrontId, { limit: 1000, status: 'ACTIVE' }),
    getCategories(tenantId, storefrontId),
    getContentPages(storefrontId, tenantId),
  ]);

  const products = productsResponse.data || [];

  // Static Routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Product Routes
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug || product.id}`,
    lastModified: new Date(product.updatedAt || new Date()),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Category Routes
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/categories?category=${category.slug || category.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Content Page Routes
  const pageRoutes: MetadataRoute.Sitemap = contentPages
    .filter((page) => page.status === 'PUBLISHED')
    .map((page) => ({
      url: `${baseUrl}/pages/${page.slug}`,
      lastModified: new Date(page.updatedAt || new Date()),
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

  return [...routes, ...categoryRoutes, ...productRoutes, ...pageRoutes];
}
