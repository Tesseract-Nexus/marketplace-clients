import { redirect } from 'next/navigation';

export default async function ReturnDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/returns?id=${id}`);
}
