import { Metadata } from 'next';
import { headers } from 'next/headers';
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
  const tenantSlug = headersList.get('x-tenant-slug') || 'demo-store';

  const [resolution, tenantHost] = await Promise.all([
    resolveStorefront(tenantSlug),
    resolveTenantInfo(tenantSlug),
  ]);

  const storefrontId = resolution?.id || tenantHost?.storefront_id || tenantHost?.tenant_id || '';
  const tenantId = resolution?.tenantId || tenantHost?.tenant_id || '';
  const adminTenantId = tenantHost?.admin_tenant_id;

  const policy = await getCancellationPolicy(storefrontId, tenantId, adminTenantId);

  return <CancellationPolicyClient policyText={policy?.policyText || null} />;
}
