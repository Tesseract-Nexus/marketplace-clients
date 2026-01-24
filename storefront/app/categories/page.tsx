import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCategories, resolveStorefront } from '@/lib/api/storefront';
import { resolveTenantId } from '@/lib/tenant';
import { CategoriesClient } from './CategoriesClient';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const slug = headersList.get('x-tenant-slug') || 'demo-store';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const resolution = await resolveStorefront(slug);
  const storeName = resolution?.name || 'Store';

  return {
    title: `Shop by Category | ${storeName}`,
    description: `Browse products by category at ${storeName}. Find exactly what you're looking for organized by department.`,
    alternates: {
      canonical: `${baseUrl}/categories`,
    },
  };
}

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
