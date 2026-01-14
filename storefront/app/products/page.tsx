import { headers } from 'next/headers';
import { getProducts, getCategories } from '@/lib/api/storefront';
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
