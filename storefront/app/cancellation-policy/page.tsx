import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { resolveStorefront } from '@/lib/api/storefront';
import { resolveTenantInfo } from '@/lib/tenant';
import { CancellationPolicyClient } from './CancellationPolicyClient';
import { getCancellationPolicy } from '@/lib/api/cancellation';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Cancellation Policy',
    description: 'Our cancellation terms and conditions.',
  };
}

export default async function CancellationPolicyPage() {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug');
  if (!tenantSlug) {
    notFound();
  }
  const headerTenantId = headersList.get('x-tenant-id');
  const isCustomDomain = headersList.get('x-is-custom-domain') === 'true';

  const [resolution, tenantHost] = await Promise.all([
    resolveStorefront(tenantSlug),
    resolveTenantInfo(tenantSlug),
  ]);

  const storefrontId = resolution?.id || tenantHost?.storefront_id || tenantHost?.tenant_id || '';
  const tenantId = resolution?.tenantId || tenantHost?.tenant_id || '';
  // For custom domains: use headerTenantId (from custom-domain-service) as authoritative
  // For standard domains: use tenantHost.tenant_id (from tenant-router)
  // This ensures settings are fetched with the same tenant ID the admin uses when saving
  const adminTenantId = (isCustomDomain && headerTenantId) ? headerTenantId : (tenantHost?.tenant_id || tenantId);

  const policy = await getCancellationPolicy(storefrontId, tenantId, adminTenantId);

  return <CancellationPolicyClient policy={policy} />;
}
