import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrder, getOrderTracking, getOrderReturns } from '@/lib/api/storefront';
import { OrderDetailsClient } from './OrderDetailsClient';
import { resolveTenantId, getAccessTokenFromCookie } from '@/lib/tenant';

interface OrderDetailsPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') || 'demo-store';

  // Resolve tenant UUID from slug
  const tenantId = await resolveTenantId(slug);
  if (!tenantId) {
    notFound();
  }

  // Get accessToken to use customer-authenticated endpoints
  const accessToken = (await getAccessTokenFromCookie()) || undefined;

  // Fetch order details, tracking, and returns in parallel
  const [order, tracking, returns] = await Promise.all([
    getOrder(tenantId, tenantId, orderId, accessToken),
    getOrderTracking(tenantId, tenantId, orderId, accessToken),
    getOrderReturns(tenantId, tenantId, orderId),
  ]);

  if (!order) {
    notFound();
  }

  return <OrderDetailsClient order={order} tracking={tracking} returns={returns} />;
}
