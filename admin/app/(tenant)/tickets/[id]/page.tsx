import { redirect } from 'next/navigation';

export default async function TicketDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/tickets?id=${id}`);
}
