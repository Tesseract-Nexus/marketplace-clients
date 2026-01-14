import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrders, Order } from '@/lib/api/storefront';
import { OrdersClient } from './OrdersClient';
import { resolveTenantId, getCustomerEmailFromCookie } from '@/lib/tenant';

export default async function OrdersPage() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';

  console.log('[OrdersPage] slug:', slug);

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  console.log('[OrdersPage] tenantId:', tenantId);

  if (!tenantId) {
    console.log('[OrdersPage] No tenantId, returning empty orders');
    return <OrdersClient orders={[]} />;
  }

  // Get authenticated customer email from cookie
  const email = await getCustomerEmailFromCookie();
  console.log('[OrdersPage] email from cookie:', email);

  if (!email) {
    // Not authenticated - redirect to login
    console.log('[OrdersPage] No email, redirecting to login');
    redirect(`/login?redirect=/account/orders`);
  }

  // Fetch orders for this specific customer by email
  console.log('[OrdersPage] Fetching orders for email:', email);
  const orders = await getOrders(tenantId, tenantId, { email });
  console.log('[OrdersPage] Orders received:', orders.length);

  return <OrdersClient orders={orders} />;
}
