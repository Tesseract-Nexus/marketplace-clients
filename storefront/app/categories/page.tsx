import { headers } from 'next/headers';
import { getCategories } from '@/lib/api/storefront';
import { resolveTenantId } from '@/lib/tenant';
import { CategoriesClient } from './CategoriesClient';

export default async function CategoriesPage() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    return (
      <div className="container-tenant py-12 text-center">
        <p className="text-muted-foreground">Unable to load categories</p>
      </div>
    );
  }

  const categories = await getCategories(tenantId, tenantId).catch(() => []);

  return <CategoriesClient categories={categories} />;
}
