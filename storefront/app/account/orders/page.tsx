import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getOrders } from '@/lib/api/storefront';
import { OrdersClient } from './OrdersClient';
import { resolveTenantId, getCustomerEmailFromCookie, getAccessTokenFromCookie } from '@/lib/tenant';

export default async function OrdersPage() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) {
    notFound();
  }

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    notFound();
  }

  // Get authenticated customer email from cookie
  const email = await getCustomerEmailFromCookie();

  if (!email) {
    // Not authenticated - redirect to login
    redirect(`/login?redirect=/account/orders`);
  }

  // Get accessToken to use customer-authenticated endpoint
  const accessToken = await getAccessTokenFromCookie();

  // Fetch orders using customer-authenticated endpoint (validates ownership via JWT)
  const orders = await getOrders(tenantId, tenantId, { email, accessToken: accessToken || undefined });

  return <OrdersClient orders={orders} />;
}
