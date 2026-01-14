import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getContentPage, resolveStorefront } from '@/lib/api/storefront';
import { resolveTenantInfo } from '@/lib/tenant';
import { Metadata } from 'next';
import { ContentPageClient } from './ContentPageClient';

interface PageProps {
  params: Promise<{
    pageSlug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug') || 'demo-store';
  const { pageSlug } = await params;

  const resolution = await resolveStorefront(tenantSlug);
  const tenantHost = await resolveTenantInfo(tenantSlug);

  if (!resolution || !tenantHost) return {};

  const storefrontId = resolution.id || tenantHost.storefront_id || tenantHost.tenant_id;
  const tenantId = resolution.tenantId || tenantHost.tenant_id;

  const page = await getContentPage(storefrontId, tenantId, pageSlug);

  if (!page) return {};

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt,
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug') || 'demo-store';
  const { pageSlug } = await params;

  // Resolve IDs
  const [resolution, tenantHost] = await Promise.all([
    resolveStorefront(tenantSlug),
    resolveTenantInfo(tenantSlug),
  ]);

  if (!resolution || !tenantHost) {
    notFound();
  }

  const storefrontId = resolution.id || tenantHost.storefront_id || tenantHost.tenant_id;
  const tenantId = resolution.tenantId || tenantHost.tenant_id;

  // Fetch page content
  const page = await getContentPage(storefrontId, tenantId, pageSlug);

  if (!page) {
    notFound();
  }

  return <ContentPageClient page={page} />;
}
