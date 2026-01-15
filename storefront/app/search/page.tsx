import { headers } from 'next/headers';
import { searchProductsWithFacets, ProductSearchResult } from '@/lib/api/search';
import { searchProducts as fallbackSearch } from '@/lib/api/storefront';
import { SearchClient } from './SearchClient';
import { resolveTenantId } from '@/lib/tenant';
import { Product } from '@/types/storefront';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

/**
 * Transform Typesense search result to Product format
 */
function transformSearchResultToProduct(result: ProductSearchResult): Product {
  return {
    id: result.id,
    tenantId: result.tenant_id,
    name: result.name,
    description: result.description || '',
    price: String(result.price),
    comparePrice: result.sale_price ? String(result.sale_price) : undefined,
    currency: result.currency || 'USD',
    sku: result.sku || '',
    status: result.in_stock ? 'ACTIVE' : 'INACTIVE',
    inventoryStatus: result.in_stock ? 'IN_STOCK' : 'OUT_OF_STOCK',
    images: result.image_url ? [result.image_url] : [],
    categories: result.category || [],
    tags: result.tags || [],
    createdAt: new Date(result.created_at * 1000).toISOString(),
    updatedAt: new Date(result.updated_at * 1000).toISOString(),
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';
  const { q: query, sort } = await searchParams;

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    return (
      <div className="container-tenant py-12 text-center">
        <p className="text-muted-foreground">Unable to load search</p>
      </div>
    );
  }

  // Fetch initial search results if query exists using Typesense search
  let initialResults: Product[] = [];

  if (query) {
    try {
      // Use Typesense-powered search for fast, relevant results
      const sortBy = sort === 'price-asc' ? 'price_asc' :
                     sort === 'price-desc' ? 'price_desc' :
                     sort === 'newest' ? 'newest' : 'relevance';

      const searchResult = await searchProductsWithFacets(tenantId, tenantId, query, {
        perPage: 20,
        sortBy,
      });

      initialResults = searchResult.hits.map(transformSearchResultToProduct);

      // If Typesense returns no results, try fallback to products-service
      if (initialResults.length === 0) {
        console.log('Typesense returned 0 results, trying products-service fallback');
        initialResults = await fallbackSearch(tenantId, tenantId, query, 20);
      }
    } catch (error) {
      // Fallback to products-service search if Typesense fails
      console.error('Typesense search failed, falling back:', error);
      initialResults = await fallbackSearch(tenantId, tenantId, query, 20);
    }
  }

  return <SearchClient initialResults={initialResults} initialQuery={query || ''} />;
}
