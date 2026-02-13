import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getContentPage, resolveStorefront } from '@/lib/api/storefront';
import { resolveTenantInfo } from '@/lib/tenant';
import { AboutPageClient } from './AboutPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  if (!tenantSlug) {
    return {
      title: 'About Us',
      description: 'Learn more about our company and mission.',
    };
  }

  const resolution = await resolveStorefront(tenantSlug);
  const tenantHost = await resolveTenantInfo(tenantSlug);

  if (!resolution || !tenantHost) {
    return {
      title: 'About Us',
      description: 'Learn more about our company and mission.',
    };
  }

  const storefrontId = resolution.id || tenantHost.storefront_id || tenantHost.tenant_id;
  const tenantId = resolution.tenantId || tenantHost.tenant_id;

  const page = await getContentPage(storefrontId, tenantId, 'about');

  if (page) {
    return {
      title: page.metaTitle || page.title || 'About Us',
      description: page.metaDescription || page.excerpt || 'Learn more about our company and mission.',
    };
  }

  return {
    title: 'About Us',
    description: 'Learn more about our company and mission.',
  };
}

export default async function AboutPage() {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  if (!tenantSlug) {
    notFound();
  }

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
  const tenantName = tenantHost.name || 'Our Store';

  // Fetch page content from database
  const page = await getContentPage(storefrontId, tenantId, 'about');

  return <AboutPageClient page={page} tenantName={tenantName} />;
}
