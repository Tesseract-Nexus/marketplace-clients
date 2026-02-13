import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getContentPage, resolveStorefront } from '@/lib/api/storefront';
import { resolveTenantInfo } from '@/lib/tenant';
import { ContactPageClient } from './ContactPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  if (!tenantSlug) {
    return {
      title: 'Contact Us',
      description: 'Get in touch with our team. We are here to help.',
    };
  }

  const resolution = await resolveStorefront(tenantSlug);
  const tenantHost = await resolveTenantInfo(tenantSlug);

  if (!resolution || !tenantHost) {
    return {
      title: 'Contact Us',
      description: 'Get in touch with our team. We are here to help.',
    };
  }

  const storefrontId = resolution.id || tenantHost.storefront_id || tenantHost.tenant_id;
  const tenantId = resolution.tenantId || tenantHost.tenant_id;

  const page = await getContentPage(storefrontId, tenantId, 'contact');

  if (page) {
    return {
      title: page.metaTitle || page.title || 'Contact Us',
      description: page.metaDescription || page.excerpt || 'Get in touch with our team. We are here to help.',
    };
  }

  return {
    title: 'Contact Us',
    description: 'Get in touch with our team. We are here to help.',
  };
}

export default async function ContactPage() {
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
  const page = await getContentPage(storefrontId, tenantId, 'contact');

  return <ContactPageClient page={page} tenantName={tenantName} />;
}
