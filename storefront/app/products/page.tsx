import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getProducts, getCategories, resolveStorefront } from '@/lib/api/storefront';
import { ProductsClient } from './ProductsClient';
import { resolveTenantId } from '@/lib/tenant';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const slug = headersList.get('x-tenant-slug') || 'demo-store';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const search = await searchParams;
  const page = search.page ? parseInt(search.page) : 1;

  const resolution = await resolveStorefront(slug);
  const storeName = resolution?.name || 'Store';

  return {
    title: `All Products${page > 1 ? ` - Page ${page}` : ''} | ${storeName}`,
    description: `Browse our complete product catalog at ${storeName}. Find the best products with great prices and fast shipping.`,
    robots: page > 1 ? 'noindex, follow' : 'index, follow', // Prevent duplicate content for paginated pages
    alternates: {
      canonical: `${baseUrl}/products`,
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';
  const search = await searchParams;

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    return (
      <div className="container-tenant py-12 text-center">
        <p className="text-muted-foreground">Unable to load products</p>
      </div>
    );
  }

  // Fetch products and categories from real APIs using tenant UUID
  const [productsResponse, categories] = await Promise.all([
    getProducts(tenantId, tenantId, {
      categoryId: search.category,
      search: search.search,
      sort: search.sort as 'newest' | 'price_asc' | 'price_desc' | 'name' | 'rating' | undefined,
      page: search.page ? parseInt(search.page) : 1,
      limit: 12,
      status: 'ACTIVE',
    }),
    getCategories(tenantId, tenantId),
  ]);

  return (
    <ProductsClient
      initialProducts={productsResponse.data}
      categories={categories}
      totalProducts={productsResponse.pagination.total}
    />
  );
}
