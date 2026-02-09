import { redirect } from 'next/navigation';

export default async function VendorDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/vendors?id=${id}`);
}
