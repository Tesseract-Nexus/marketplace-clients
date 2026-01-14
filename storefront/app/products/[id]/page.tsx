import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api/storefront';
import { ProductDetailClient } from './ProductDetailClient';
import { resolveTenantId } from '@/lib/tenant';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';
  const { id } = await params;

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    notFound();
  }

  // Fetch product from real API using tenant UUID
  const product = await getProduct(tenantId, tenantId, id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
